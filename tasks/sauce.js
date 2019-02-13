/*eslint-disable no-process-env */
const _ = require('lodash');

const Async = require('async');
const Driver = require('./driver');
const Gulp = require('gulp');
const PluginError = require('plugin-error');
const SauceTunnel = require('sauce-tunnel');
const Server = require('./server');
const Log = require('fancy-log');

const browsers = [
  {
    browserName: 'internet explorer'
  }
];

Gulp.task('test:sauce', ['build:browser'], callback => {
  const user = process.env.SAUCE_USERNAME;
  const pass = process.env.SAUCE_ACCESS_KEY;
  const tunnelId = process.env.TRAVIS_JOB_ID || 42;

  Server.start(() => {
    startTunnel(user, pass, tunnelId, tunnel => {
      Async.eachLimit(browsers, 5, (config, done) => {
          config = _.defaults({
            'tunnel-identifier': tunnelId
          }, config);

          const remote = {
            port: 4445,
            user,
            key: pass
          };

          Driver.test(remote, config, done);
        },
        () => {
          tunnel.stop(() => {
            Server.stop(() => {
              callback();
            });
          });
        });
    });
  });
});

function startTunnel(user, pass, tunnelId, done) {
  const tunnel = new SauceTunnel(user, pass, tunnelId, true, []);
  tunnel.on('log:error', data => {
    Log(data);
  });
  tunnel.on('verbose:debug', data => {
    Log(data);
  });
  tunnel.start(success => {
    if (!success) {
      //throw new PluginError('test:sauce', 'Tunnel failed to open');
      console.log('Tunnel failed to open');
    }

    done(tunnel);
  });
}
