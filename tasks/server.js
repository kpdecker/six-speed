const DataStore = require('../lib/data-store');
const Gulp = require('gulp');
const PluginError = require('plugin-error');
const Hapi = require('hapi');
const UserAgent = require('../lib/user-agent');
const Log = require('fancy-log');

let server;

Gulp.task('server', callback => {    // eslint-disable-line no-unused-vars
  exports.start(() => {});
});

exports.start = (startup, testComplete) => {
  server = new Hapi.Server();
  server.connection({ port: 9999 });

  // Simple endpoint to allow for sending remote data back to the server.
  server.route({
    method: 'POST',
    path: '/log',
    handler({payload}, reply) {
      const userAgent = UserAgent.parse(payload.browser);
      const data = JSON.parse(payload.data);

      Log('Storing data for browser', userAgent.name, userAgent.version, `{${Object.keys(data).join(', ')}}`);
      DataStore.store(userAgent.name, payload.tag, userAgent.version, data);

      reply({});
    }
  });
  server.route({
    method: 'POST',
    path: '/debug',
    handler({payload}, reply) {
      const userAgent = UserAgent.parse(payload.browser);
      const message = payload.message;

      Log('[debug]', userAgent.name, userAgent.version, message);

      reply({});
    }
  });

  server.route({
    method: 'POST',
    path: '/done',
    handler(request, reply) {
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
  server.start(err => {
    if (err) {
      throw new PluginError('server', err);
    }

    Log('Server running at:', server.info.uri);
    startup(server.info.uri);
  });
};

exports.stop = done => {
  server.stop(done);
};
