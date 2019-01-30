/*eslint-disable no-process-env */
const _ = require('lodash'),
    Async = require('async'),
    Driver = require('./driver'),
    Gulp = require('gulp'),
    PluginError = require('plugin-error'),
    SauceTunnel = require('sauce-tunnel'),
    Server = require('./server');

var browsers = [
  {
    browserName: 'internet explorer'
  }
];

Gulp.task('test:sauce', ['build:browser'], function(callback) {
  var user = process.env.SAUCE_USERNAME,
      pass = process.env.SAUCE_ACCESS_KEY,
      tunnelId = process.env.TRAVIS_JOB_ID || 42;

  Server.start(function() {
    startTunnel(user, pass, tunnelId, function(tunnel) {
      Async.eachLimit(browsers, 5, function(config, done) {
          config = _.defaults({
            'tunnel-identifier': tunnelId
          }, config);

          var remote = {
            port: 4445,
            user: user,
            key: pass
          };

          Driver.test(remote, config, done);
        },
        function() {
          tunnel.stop(function() {
            Server.stop(function() {
              callback();
            });
          });
        });
    });
  });
});

function startTunnel(user, pass, tunnelId, done) {
  var tunnel = new SauceTunnel(user, pass, tunnelId, true, []);
  tunnel.on('log:error', function(data) {
    Log(data);
  });
  tunnel.on('verbose:debug', function(data) {
    Log(data);
  });
  tunnel.start(function(success) {
    if (!success) {
      //throw new PluginError('test:sauce', 'Tunnel failed to open');
      console.log('Tunnel failed to open');
    }

    done(tunnel);
  });
}
