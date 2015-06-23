var DataStore = require('../lib/data-store'),
    Gulp = require('gulp'),
    GUtil = require('gulp-util'),
    Hapi = require('hapi');

var server;

Gulp.task('server', function(callback) {    // eslint-disable-line no-unused-vars
  exports.start(function() {});
});

exports.start = function(done) {
  server = new Hapi.Server();
  server.connection({ port: 9999 });

  // Simple endpoint to allow for sending remote data back to the server.
  server.route({
    method: 'POST',
    path: '/log',
    handler: function(request, reply) {
      var userAgent = request.payload.browser,
          browserName = userAgent,
          browserVersion = 'unknown';

      if (userAgent.match(/MSIE ([\.\d]+)/)) {
        browserName = 'internet explorer';
        browserVersion = RegExp.$1;
      } else if (userAgent.match(/(Edge|Firefox)\/(\S+)/)) {
        browserName = RegExp.$1.toLowerCase();
        browserVersion = RegExp.$2;
      } else if (userAgent.match(/Chrome\/(\S+)/)) {
        browserName = 'chrome';
        browserVersion = RegExp.$1;
      } else if (userAgent.match(/Safari\/\S+/) && userAgent.match(/Version\/(\S+)/)) {
        browserName = 'safari';
        browserVersion = RegExp.$1;
      }

      GUtil.log('Storing data for browser', GUtil.colors.yellow(browserName), GUtil.colors.yellow(browserVersion), userAgent);
      DataStore.store(browserName, browserVersion, JSON.parse(request.payload.data));

      reply({});
    }
  });

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
