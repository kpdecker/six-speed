/*eslint-disable no-process-env, camelcase */
var Async = require('async'),
    Driver = require('./driver'),
    Gulp = require('gulp'),
    Server = require('./server');

var browsers = [
  {
    browserName: 'chrome',
    chromeOptions: {
      binary: '/Applications/Google\ Chrome\ Canary.app/Contents/MacOS/Google\ Chrome\ Canary'
    }
  },
  {
    browserName: 'firefox',
    firefox_binary: '/Applications/FirefoxNightly.app/Contents/MacOS/firefox-bin'
  },
  {
    browserName: 'safari'
    // Nightly path configured through Selenium Server
  }
];

Gulp.task('test:nightly', ['build:browser'], function(callback) {
  Server.start(function() {
    Async.eachLimit(browsers, 1, function(config, done) {
      var remote = {};

      Driver.test(remote, config, done);
    },
    function() {
      Server.stop(function() {
        callback();
      });
    });
  });
});
