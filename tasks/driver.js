/*eslint-disable no-process-env */

var _ = require('lodash'),
    GUtil = require('gulp-util'),
    WebdriverIO = require('webdriverio'),
    UserAgent = require('../lib/user-agent');

var browserOptions = {
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

module.exports.test = function(remote, config, done) {
  var options = _.defaults({
    desiredCapabilities: _.merge({
      name: 'SixSpeed - ' + config.browserName,
      public: 'public',
      build: process.env.TRAVIS_BUILD_ID,

      loggingPrefs: {
        'browser': 'WARNING'
      },
      recordVideo: false,
      'webdriver.remote.quietExceptions': true
    }, config, browserOptions[config.browserName])
  }, remote);

  var userAgent,
      browserId,
      browserLog,
      stats;

  var testServer = remote.testServer || 'http://localhost:9999/',
      indexFile = config.browserName === 'firefox' ? 'moz/index.html?tag=stable' : 'index.html?tag=stable';

  var client = WebdriverIO
    .remote(options)
    .init()
    .url(testServer + indexFile)
    .execute(function() {
        /*global navigator */
        return navigator.userAgent;
      },
      function(err, data) {
        if (err) {
          throw new GUtil.PluginError('test:sauce', config.browserName + ' ' + err);
        }

        userAgent = UserAgent.parse(data.value);
        browserId = userAgent.name + ' ' + userAgent.version;
      });

  (function exec(timeout) {
    /*global SixSpeed */
    client.pause(Math.max(timeout, 15000))
      .execute(function() {
          return !SixSpeed.running && SixSpeed.ran;
        },
        function(err, ret) {
          if (err) {
            throw new GUtil.PluginError('test:sauce', browserId + ' ' + err);
          }

          if (!ret.value) {
            exec(timeout / 2);
          } else {
            cleanup();
          }
        });
  }(60 * 1000));

  function cleanup() {
    client
      .log('browser', function(err, data) {
        if (err) {
          // Not supported under IE so just log and move on.
          GUtil.log('test:sauce', browserId, GUtil.colors.red(err));
        } else {
          browserLog = data.value;
        }
      })
      .execute(function() {
          return SixSpeed.stats;
        },
        function(err, ret) {
          if (err) {
            throw new GUtil.PluginError('test:sauce', browserId + ' ' + err);
          }

          stats = ret.value;
        })
      .end()
      .call(function() {
        // Log for the user
        _.each(browserLog, function(message) {
          GUtil.log(GUtil.colors.magenta(browserId), GUtil.colors.yellow(message.source || ''), '-', message.message);
        });
        _.each(_.keys(stats).sort(), function(name) {
          var stat = stats[name];

          GUtil.log(GUtil.colors.magenta(browserId), GUtil.colors.blue(name), _.map(stat.relative, function(relative, type) {
            return GUtil.colors.yellow(type) + ': ' + (relative * 100).toFixed(5) + '%';
          }).join(' '));
        });

        done();
      });
  }
};
