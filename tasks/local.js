var ChildProcess = require('child_process'),
    Gulp = require('gulp'),
    Path = require('path'),
    Server = require('./server');

Gulp.task('test:safari', function(callback) {
  var child;
  Server.start(function() {
    child = ChildProcess.spawn('/Applications/Safari.app/Contents/MacOS/Safari', [Path.resolve(Path.join(__dirname, '..', 'build/redirect.html'))], {stdio: 'inherit'});
  }, function() {
    child.kill();

    Server.stop(function() {
      callback();
    });
  });
});
Gulp.task('test:webkit', function(callback) {
  var child;
  Server.start(function() {
    child = ChildProcess.spawn('/Applications/WebKit.app/Contents/MacOS/WebKit', [Path.resolve(Path.join(__dirname, '..', 'build/redirect.html'))], {stdio: 'inherit'});
  }, function() {
    child.kill();

    Server.stop(function() {
      callback();
    });
  });
});
