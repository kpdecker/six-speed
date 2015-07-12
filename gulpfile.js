var del = require('del'),
    Gulp = require('gulp');

require('./tasks/build');
require('./tasks/local');
require('./tasks/nightly');
require('./tasks/node');
require('./tasks/report');
require('./tasks/sauce');
require('./tasks/server');

Gulp.task('test', ['test:node']);

Gulp.task('watch', ['build'], function() {
  Gulp.watch(['lib/*.js', 'tests/**'], ['build']);
});

Gulp.task('clean', function(callback) {
  del(['build/**'], callback);
});
