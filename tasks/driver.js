/*eslint-disable no-process-env */

const _ = require('lodash');

const PluginError = require('plugin-error');
const WebdriverIO = require('webdriverio');
const UserAgent = require('../lib/user-agent');
const Log = require('fancy-log');

const browserOptions = {
  chrome: {
    chromeOptions: {
      args: [
        // Defaults from Sauce Labs
        'disable-webgl',
        'blacklist-webgl',
        'blacklist-accelerated-compositing',
        'disable-accelerated-2d-canvas',
        'disable-accelerated-compositing',
        'disable-accelerated-layers',
        'disable-accelerated-plugins',
        'disable-accelerated-video',
        'disable-accelerated-video-decode',
        'disable-gpu',
        'test-type',

        // Our own exec flags
        'enable-javascript-harmony'
      ]
    }
  }
};

module.exports.test = (remote, config, done) => {
  const options = _.defaults({
    desiredCapabilities: _.merge({
      name: `SixSpeed - ${config.browserName}`,
      public: 'public',
      build: process.env.TRAVIS_BUILD_ID,

      loggingPrefs: {
        'browser': 'WARNING'
      },
      recordVideo: false,
      'webdriver.remote.quietExceptions': true
    }, config, browserOptions[config.browserName])
  }, remote);

  let userAgent;
  let browserId;
  let browserLog;
  let stats;
  const testServer = remote.testServer || 'http://localhost:9999/';
  const indexFile = config.browserName === 'firefox' ? 'moz/index.html?tag=stable' : 'index.html?tag=stable';

  const client = WebdriverIO
    .remote(options)
    .init()
    .url(testServer + indexFile)
    .execute(() => /*global navigator */
  navigator.userAgent,
      (err, {value}) => {
        if (err) {
          throw new PluginError('test:sauce', `${config.browserName} ${err}`);
        }

        userAgent = UserAgent.parse(value);
        browserId = `${userAgent.name} ${userAgent.version}`;
      });

  (function exec(timeout) {
    /*global SixSpeed */
    client.pause(Math.max(timeout, 15000))
      .execute(() => !SixSpeed.running && SixSpeed.ran,
        (err, {value}) => {
          if (err) {
            throw new PluginError('test:sauce', `${browserId} ${err}`);
          }

          if (!value) {
            exec(timeout / 2);
          } else {
            cleanup();
          }
        });
  }(60 * 1000));

  function cleanup() {
    client
      .log('browser', (err, {value}) => {
        if (err) {
          // Not supported under IE so just log and move on.
          Log('test:sauce', browserId, err);
        } else {
          browserLog = value;
        }
      })
      .execute(() => SixSpeed.stats,
        (err, {value}) => {
          if (err) {
            throw new PluginError('test:sauce', `${browserId} ${err}`);
          }

          stats = value;
        })
      .end()
      .call(() => {
        // Log for the user
        _.each(browserLog, message => {
          Log(browserId, message.source || '', '-', message.message);
        });
        _.each(_.keys(stats).sort(), name => {
          const stat = stats[name];

          Log(browserId, name, _.map(stat.relative, (relative, type) => `${type}: ${(relative * 100).toFixed(5)}%`).join(' '));
        });

        done();
      });
  }
};
