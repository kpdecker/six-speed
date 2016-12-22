var Async = require('async'),
    AppleScript = require('applescript'),
    ChildProcess = require('child_process'),
    Gulp = require('gulp'),
    Path = require('path'),
    Server = require('./server'),
    userhome = require('user-home');

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
    path: `${userhome}/browsers/Google Chrome.app/Contents/MacOS/Google Chrome`,
    app: `${userhome}/browsers/Google Chrome.app`,
    args: chromeArgs.concat('http://localhost:9999/?tag=stable')
  },
  {
    path: `${userhome}/browsers/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary`,
    app: `${userhome}/browsers/Google Chrome Canary.app`,
    args: chromeArgs.concat('http://localhost:9999/?tag=prerelease')
  },
  {
    path: `${userhome}/browsers/Firefox.app/Contents/MacOS/firefox`,
    app: `${userhome}/browsers/Firefox.app`,
    args: ['http://localhost:9999/moz/?tag=stable']
  },
  {
    path: `${userhome}/browsers/FirefoxNightly.app/Contents/MacOS/firefox`,
    app: `${userhome}/browsers/FirefoxNightly.app`,
    args: ['http://localhost:9999/moz/?tag=prerelease']
  },
  {
    path: '/Applications/Safari.app/Contents/MacOS/Safari',
    app: '/Applications/Safari.app',
    args: [safariStableRedirect]
  },
  {
    path: `${userhome}/browsers/WebKit.app/Contents/MacOS/WebKit`,
    app: `${userhome}/browsers/WebKit.app`,
    args: [safariPrereleaseRedirect]
  }
];

Gulp.task('test:local', ['build:browser'], function(callback) {
  Async.eachSeries(browsers, runProcess, function() {
    callback();
  });
});

function runProcess(config, callback) {
  var child,
      appPath = Path.resolve(config.app);
  Server.start(function() {
    child = ChildProcess.spawn(config.path, config.args, {stdio: 'inherit'});

    if (!(/firefox/.test(config.path))) {
      setTimeout(function() {
        execAppleScript('tell application "' + appPath + '" to activate', function() {});
      }, 3000);
    }
  }, function() {
    function killServer() {
      Server.stop(function() {
        callback();
      });
    }

    if (/Safari|WebKit/.test(config.path)) {
      execAppleScript('tell application "' + appPath + '" to close (every tab of window 1)', function() {
        execAppleScript('tell application "' + appPath + '" to quit', killServer);
      });
    } else {
      child.kill();
      killServer();
    }
  });
}

function execAppleScript(script, cb) {
  console.log('Running script', script);
  AppleScript.execString(script, cb);
}
