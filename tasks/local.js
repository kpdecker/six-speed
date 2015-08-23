var Async = require('async'),
    ChildProcess = require('child_process'),
    Gulp = require('gulp'),
    Path = require('path'),
    Server = require('./server');

var safariRedirect = Path.resolve(Path.join(__dirname, '..', 'build/redirect.html'));

var browsers = [
  {
    path: '/Applications/Safari.app/Contents/MacOS/Safari',
    args: [safariRedirect]
  },
  {
    path: '/Applications/WebKit.app/Contents/MacOS/WebKit',
    args: [safariRedirect]
  },
  {
    path: '/Applications/FirefoxNightly.app/Contents/MacOS/firefox',
    args: ['http://localhost:9999']
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
