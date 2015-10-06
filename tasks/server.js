var DataStore = require('../lib/data-store'),
    Gulp = require('gulp'),
    GUtil = require('gulp-util'),
    Hapi = require('hapi'),
    UserAgent = require('../lib/user-agent');

var server;

Gulp.task('server', function(callback) {    // eslint-disable-line no-unused-vars
  exports.start(function() {});
});

Gulp.task('test:edge', function(callback) {
  exports.start(function() {}, function() {
    server.stop(function() {
      callback();
    });
  });

  GUtil.log('Open ' + GUtil.colors.magenta('http://' + server.info.uri + '/') + ' in Edge to begin test.');
});

exports.start = function(startup, testComplete) {
  server = new Hapi.Server();
  server.connection({ port: 9999 });

  // Simple endpoint to allow for sending remote data back to the server.
  server.route({
    method: 'POST',
    path: '/log',
    handler: function(request, reply) {
      var userAgent = UserAgent.parse(request.payload.browser),
          data = JSON.parse(request.payload.data);

      GUtil.log('Storing data for browser', GUtil.colors.magenta(userAgent.name), GUtil.colors.magenta(userAgent.version), '{' + Object.keys(data).join(', ') + '}');
      DataStore.store(userAgent.name, request.payload.tag, userAgent.version, data);

      reply({});
    }
  });
  server.route({
    method: 'POST',
    path: '/debug',
    handler: function(request, reply) {
      var userAgent = UserAgent.parse(request.payload.browser),
          message = request.payload.message;

      GUtil.log(GUtil.colors.magenta('[debug]'), GUtil.colors.magenta(userAgent.name), GUtil.colors.magenta(userAgent.version), message);

      reply({});
    }
  });

  server.route({
    method: 'POST',
    path: '/done',
    handler: function(request, reply) {
      reply({});

      if (testComplete) {
        testComplete();
      }
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
    startup();
  });
};

exports.stop = function(done) {
  server.stop(done);
};
