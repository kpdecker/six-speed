var Async = require('async'),
    ChildProcess = require('child_process'),
    Gulp = require('gulp'),
    Path = require('path'),
    Server = require('./server');

var safariRedirect = Path.resolve(Path.join(__dirname, '..', 'build/redirect.html'));

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

  'http://localhost:9999'
];

var browsers = [
  {
    path: './browsers/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: chromeArgs
  },
  {
    path: './browsers/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    args: chromeArgs
  },
  {
    path: './browsers/Firefox.app/Contents/MacOS/firefox',
    args: ['http://localhost:9999']
  },
  {
    path: './browsers/FirefoxNightly.app/Contents/MacOS/firefox',
    args: ['http://localhost:9999']
  },
  {
    path: '/Applications/Safari.app/Contents/MacOS/Safari',
    args: [safariRedirect]
  },
  {
    path: './browsers/WebKit.app/Contents/MacOS/WebKit',
    args: [safariRedirect]
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
  }, function() {
    child.kill();

    Server.stop(function() {
      callback();
    });
  });
}
