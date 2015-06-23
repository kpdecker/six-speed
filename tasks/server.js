var Gulp = require('gulp'),
    GUtil = require('gulp-util'),
    Hapi = require('hapi');

var server;

Gulp.task('server', function(callback) {    // eslint-disable-line no-unused-vars
  exports.start(function() {});
});

exports.start = function(done) {
  server = new Hapi.Server();
  server.connection({ port: 9999 });

  server.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
      directory: {
        path: 'build'
      }
    }
  });
  server.start(function(err) {
    if (err) {
      throw new GUtil.PluginError('server', err);
    }

    GUtil.log('Server running at:', server.info.uri);
    done();
  });
};

exports.stop = function(done) {
  server.stop(done);
};
