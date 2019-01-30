const del = require('del');
const Gulp = require('gulp');

require('./tasks/build');
require('./tasks/local');
require('./tasks/node');
require('./tasks/report');
require('./tasks/sauce');
require('./tasks/vm');
require('./tasks/server');

Gulp.task('test', ['test:node']);

Gulp.task('watch', ['build', 'report'], () => {
  Gulp.watch(['lib/*.js', 'tests/**'], ['build']);
  Gulp.watch(['tasks/report.*', 'report/**', 'data.json', 'notes.json'], ['report']);
});

Gulp.task('clean', (callback) => {
  del(['build/**'], callback);
});
