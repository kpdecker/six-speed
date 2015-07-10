var _ = require('lodash'),
    Babel = require('babel'),
    BabelRuntimePackage = require('babel-runtime/package'),
    DataStore = require('../lib/data-store'),
    Fs = require('fs'),
    Gulp = require('gulp'),
    Handlebars = require('handlebars'),
    TraceurPackage = require('traceur/package');

var template = Handlebars.compile(Fs.readFileSync(__dirname + '/report.handlebars').toString());

Gulp.task('report', ['report:static'], function() {
  var report = render();
  Fs.writeFileSync('site/index.html', report);
});

Gulp.task('report:static', function() {
  return Gulp.src('report/*.css')
      .pipe(Gulp.dest('site/'));
});

function render() {
  var data = DataStore.load();

  // And the browsers tested
  var browsers = _.map(data, function(browserData, browserName) {
    var fullVersions = _.keys(browserData).sort();
    return {
      name: browserName,
      fullVersions: fullVersions,
      versions: _.map(fullVersions, function(versionName) {
        if (browserName !== 'node' && browserName !== 'webkit') {
          versionName = parseFloat(versionName);
        }
        return versionName;
      })
    };
  });
  browsers = _.filter(browsers, function(browser) {
    return browser.versions.length > 0;
  });

  // Pull out all of the tests that were actually run
  var tests = _.map(data, function(browserData) {
    return _.flatten(_.map(browserData, function(versionData) {
      return _.keys(versionData.stats);
    }));
  });
  tests = _.flatten(tests);
  tests = _.unique(tests);
  tests = tests.sort();

  tests = _.map(tests, function(test) {
    var types = [];

    // Figure out what types this particular test has
    _.each(data, function(browserData) {
      _.each(browserData, function(versionData) {
        var stats = versionData.stats[test] || {};
        types = _.union(types, _.keys(stats.relative), _.keys(stats.errors));
      });
    });
    types = types.sort(function(a, b) {
      // Push anything with es prefix to the end of the list
      if (/^es/.test(a)) {
        a = 'zz' + a;
      }
      if (/^es/.test(b)) {
        b = 'zz' + b;
      }
      return a.localeCompare(b);
    });

    // And then collect the results for each type
    types = _.map(types, function(type) {
      var results = [];
      _.each(browsers, function(browser) {
        var browserData = data[browser.name];
        var firstVersion = true;

        _.each(browser.fullVersions, function(versionName) {
          var versionData = browserData[versionName],
              stats = versionData.stats[test] || {},
              speed = (stats.relative || {})[type],
              error = (stats.errors || {})[type];

          var text = '',
              clazz = 'test-no-support';
          if (speed && !error) {
            if (speed.toFixed(1) === '1.0' || speed.toFixed(1) === '1.1' || speed.toFixed(1) === '0.9') {
              text = 'Identical';
              clazz = 'test-ok';
            } else if (speed > 1) {
              text = speed.toFixed(speed > 3 ? 0 : 1) + 'x faster';
              clazz = 'test-faster';
            } else {
              speed = 1 / speed;
              text = speed.toFixed(speed > 3 ? 0 : 1) + 'x slower';
              clazz = 'test-slow';
            }
          } else if (error && !(/SyntaxError|(Promise|Symbol)/.test(error))) {
            text = (/AssertError/).test(error) ? 'Incorrect' : 'Error';
            clazz = 'test-error';
          }

          if (firstVersion) {
            clazz += ' browser-first';
            firstVersion = false;
          }

          results.push({
            text: text,
            clazz: clazz
          });

        });
      });

      return {
        name: type,
        results: results
      };
    });

    return {
      name: test,
      types: types
    };
  });

  return template({
    browsers: browsers,
    tests: tests,
    date: new Date().toLocaleDateString(),
    babelVersion: Babel.version,
    babelRuntimeVersion: BabelRuntimePackage.version,
    traceurVersion: TraceurPackage.version
  });
}
