const del = require('del');
const Gulp = require('gulp');

require('./tasks/build');
require('./tasks/local');
require('./tasks/node');
require('./tasks/report');
require('./tasks/sauce');
require('./tasks/vm');
require('./tasks/server');


function watchFiles() {
  Gulp.task('watch', Gulp.series('build', 'report'), () => {
    Gulp.watch(['lib/*.js', 'tests/**'], Gulp.series('build'));
    Gulp.watch(['tasks/report.*', 'report/**', 'data.json', 'notes.json'], Gulp.series('report'));
  });
}

const watch = Gulp.series(watchFiles);

Gulp.task('clean', async (callback) => {
  return del(['build/**'], callback);
});

Gulp.task('test', Gulp.series('test:node'));
