const Async = require('async');
const AppleScript = require('applescript');
const ChildProcess = require('child_process');
const Gulp = require('gulp');
const Path = require('path');
const Server = require('./server');
const userhome = require('user-home');
const safariStableRedirect = Path.resolve(Path.join(__dirname, '..', 'build/redirect-stable.html'));
const safariPrereleaseRedirect = Path.resolve(Path.join(__dirname, '..', 'build/redirect-prerelease.html'));

const chromeArgs = [
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

const browsers = [
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

Gulp.task('test:local', Gulp.series('build:browser', async (callback) => {
  return Async.eachSeries(browsers, runProcess, () => {
    callback();
  });
}));

function runProcess({app, path, args}, callback) {
  let child;
  const appPath = Path.resolve(app);
  Server.start(() => {
    child = ChildProcess.spawn(path, args, {stdio: 'inherit'});

    if (!(/firefox/.test(path))) {
      setTimeout(() => {
        execAppleScript(`tell application "${appPath}" to activate`, () => {});
      }, 3000);
    }
  }, () => {
    function killServer() {
      Server.stop(() => {
        callback();
      });
    }

    if (/Safari|WebKit/.test(path)) {
      execAppleScript(`tell application "${appPath}" to close (every tab of window 1)`, () => {
        execAppleScript(`tell application "${appPath}" to quit`, killServer);
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
