var Async = require('async'),
    AppleScript = require('applescript'),
    ChildProcess = require('child_process'),
    Gulp = require('gulp'),
    Path = require('path'),
    Server = require('./server');

var safariStableRedirect = Path.resolve(Path.join(__dirname, '..', 'build/redirect-stable.html')),
    safariPrereleaseRedirect = Path.resolve(Path.join(__dirname, '..', 'build/redirect-prerelease.html'));

var chromeArgs = [
  // Defaults from Sauce Labs
  '--disable-webgl',
  '--blacklist-webgl',
  '--blacklist-accelerated-compositing',
  '--disable-accelerated-2d-canvas',
  '--disable-accelerated-compositing',
  '--disable-accelerated-layers',
  '--disable-accelerated-plugins',
  '--disable-accelerated-video',
  '--disable-accelerated-video-decode',
  '--disable-gpu',
  '--test-type',

  // Our own exec flags
  '--enable-javascript-harmony',
  '--enable-benchmarking',
  '--disable-background-timer-throttling'
];

var browsers = [
  {
    path: './browsers/Google Chrome.app/Contents/MacOS/Google Chrome',
    app: './browsers/Google Chrome.app',
    args: chromeArgs.concat('http://localhost:9999/?tag=stable')
  },
  {
    path: './browsers/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    app: './browsers/Google Chrome Canary.app',
    args: chromeArgs.concat('http://localhost:9999/?tag=prerelease')
  },
  {
    path: './browsers/Firefox.app/Contents/MacOS/firefox',
    app: './browsers/Firefox.app',
    args: ['http://localhost:9999/moz/?tag=stable']
  },
  {
    path: './browsers/FirefoxNightly.app/Contents/MacOS/firefox',
    app: './browsers/FirefoxNightly.app',
    args: ['http://localhost:9999/moz/?tag=prerelease']
  },
  {
    path: '/Applications/Safari.app/Contents/MacOS/Safari',
    app: '/Applications/Safari.app',
    args: [safariStableRedirect]
  },
  {
    path: './browsers/WebKit.app/Contents/MacOS/WebKit',
    app: './browsers/WebKit.app',
    args: [safariPrereleaseRedirect]
  }
];

Gulp.task('test:local', ['build:browser'], function(callback) {
  Async.eachSeries(browsers, runProcess, function() {
    callback();
  });
});

function runProcess(config, callback) {
  var child;
  Server.start(function() {
    child = ChildProcess.spawn(config.path, config.args, {stdio: 'inherit'});

    if (!(/firefox/.test(config.path))) {
      setTimeout(function() {
        AppleScript.execString('tell application "' + config.app + '" to activate', function() {});
      }, 3000);
    }
  }, function() {
    child.kill();

    Server.stop(function() {
      callback();
    });
  });
}
