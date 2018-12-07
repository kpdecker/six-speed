const DataStore = require('../lib/data-store');
const Gulp = require('gulp');
const PluginError = require('plugin-error');
const Hapi = require('hapi');
const UserAgent = require('../lib/user-agent');

var server;

Gulp.task('server', function(callback) {    // eslint-disable-line no-unused-vars
  exports.start(function() {});
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

      Log('Storing data for browser', userAgent.name, userAgent.version, '{' + Object.keys(data).join(', ') + '}');
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

      Log('[debug]', userAgent.name, userAgent.version, message);

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
      throw new PluginError('server', err);
    }

    Log('Server running at:', server.info.uri);
    startup(server.info.uri);
  });
};

exports.stop = function(done) {
  server.stop(done);
};
