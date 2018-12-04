const _ = require('lodash'),
    Babel = require('babel-core'),
    BabelRuntimePackage = require('babel-runtime/package'),
    DataStore = require('../lib/data-store'),
    Fs = require('fs'),
    Gulp = require('gulp'),
    GUtil = require('gulp-util'),
    Handlebars = require('handlebars'),
    Path = require('path'),
    TraceurPackage = require('traceur/package'),
    webpack = require('webpack');

Gulp.task('report', ['report:static', 'report:bootstrap:fonts', 'report:bootstrap:css', 'report:webpack'], function() {
  const report = render();
  Fs.writeFileSync('site/index.html', report);
});

Gulp.task('report:static', function() {
  return Gulp.src('report/*.css')
      .pipe(Gulp.dest('site/'));
});
Gulp.task('report:bootstrap:fonts', function() {
  return Gulp.src(['bower_components/bootstrap/fonts/*'], {base: 'bower_components/bootstrap'})
      .pipe(Gulp.dest('site/'));
});
Gulp.task('report:bootstrap:css', function() {
  return Gulp.src(['bower_components/bootstrap/dist/css/*'], {base: 'bower_components/bootstrap/dist'})
      .pipe(Gulp.dest('site/'));
});


Gulp.task('report:webpack', function(callback) {
  webpack({
    entry: {
      report: './report/index.js'
    },
    output: {
      path: 'site/',
      filename: '[name].js'
    },
    module: {
      loaders: [{
        test: /\.jsx?$/,
        exclude: /node_modules|vendor|bower_components/,
        loader: 'babel-loader'
      }, {
        test: /bootstrap\/js/,
        loader: 'imports?jQuery=jquery'
      }]
    },

    resolve: {
      root: [Path.join(__dirname, '..', 'bower_components')]
    },
    plugins: [
      new webpack.ResolverPlugin(
        new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin('bower.json', ['main'])
      )
    ]
  }, function(err, stats) {
      if (err) {
        throw new GUtil.PluginError('webpack', err);
      }
      GUtil.log('[webpack]', stats.toString());
      callback();
  });
});

function render() {
  var data = DataStore.load(),
      notes = DataStore.notes();

  // And the browsers tested
  var browserTags = [],
      familyTags = [];
  var browsers = _.map(data, function(browserData, browserName) {
    var tags = _.keys(browserData),
        family = notes.family[browserName].map(function(tag) { return 'js-family-' + tag; }).join(' '),
        versionTag = '';

    var fullVersions = _.map(tags, function(tag) {
      // A bit of a hack here, but we treat all node releases that we are testing as stable
      var tagName = tag;
      if (/^\d/.test(tag)) {
        tagName = 'stable';
      }

      browserTags = browserTags.concat(tagName);

      tagName = ' js-version-' + tagName;
      versionTag += tagName;

      var versionName = browserData[tag].version,
          displayName = versionName;
      if (browserName !== 'node' && browserName !== 'webkit') {
        displayName = parseFloat(versionName);
      }

      return {
        id: tag,
        name: versionName,
        display: displayName,
        tag: family + tagName
      };
    });

    familyTags = _.union(familyTags, notes.family[browserName]);
    return {
      name: browserName,
      versions: fullVersions,
      tag: family + versionTag
    };
  });
  browsers = _.filter(browsers, function(browser) {
    return browser.versions.length > 0;
  });

  // Pull out all of the tests that were actually run
  var implementations = [];
  var tests = _.map(data, function(browserData) {
    return _.flatten(_.map(browserData, function(versionData) {
      return _.keys(versionData.stats);
    }));
  });
  tests = _.flatten(tests);
  tests = _.uniq(tests);
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

    // Save these results to the full implementation list
    implementations = _.union(implementations, types);
    _.each(browsers, function(browser) {
      var browserData = data[browser.name],
          firstVersion = true;

      _.each(browser.versions, function(version) {
        var versionData = browserData[version.id],
            elapsed = versionData.stats[test] || {};

        // Look for elapsed times that have a high variance
		if (elapsed != undefined || elapsed != null) {
          var types = Object.keys(elapsed);
          var average = types.reduce((prev, curr) => prev + elapsed[curr], 0) / types.length;

          if (types.find((type) => elapsed[type] / average > 2 || elapsed[type] / average < 0.5)) {
            console.warn('Elapsed outlier detected', browser.name, version.id, test, elapsed);
          }
	    }
      });
    });

    // And then collect the results for each type
    types = _.map(types, function(type) {
      var results = [],
          typeClazz = 'js-impl-' + type.replace(/-.*$/, '');
      _.each(browsers, function(browser) {
        var browserData = data[browser.name],
            firstVersion = true;

        _.each(browser.versions, function(version) {
          var versionData = browserData[version.id],
              stats = versionData.stats[test] || {},
              speed = (stats.relative || {})[type],
              error = (stats.errors || {})[type];

          var text = '',
              clazz = 'test-no-support',
              tip = '';
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
            tip = error;
          }

          if (firstVersion) {
            clazz += ' browser-first';
            firstVersion = false;
          }

          if (tip) {
            text = '<span data-toggle="tooltip" title="' + tip.replace(/"/g, '&#x27;') + '">' + text + ' <span class="glyphicon glyphicon-info-sign"></span></span>';
          }

          results.push({
            text: text,
            clazz: version.tag + ' ' + typeClazz + ' ' + clazz
          });
        });
      });

      return {
        name: type,
        clazz: typeClazz,
        results: results
      };
    });

    return {
      name: test,
      display: test.replace(/_/g, ' '),
      types: types
    };
  });


  implementations = _.map(implementations, function(impl) {
    return impl.replace(/-.*$/, '');
  });
  implementations = _.uniq(implementations.sort());
  implementations = _.map(implementations, function(implementation) {
    return {
      name: implementation,
      selector: 'js-impl-' + implementation
    };
  });

  var reportData = {
    engines: _.union(_.uniq(browserTags).map(function(tag) {
        return {name: _.capitalize(tag), selector: 'js-version-' + tag};
      }),
      [{dash: true}],
      familyTags.sort().map(function(tag) {
        return {name: _.capitalize(tag), selector: 'js-family-' + tag};
      })),
    implementations: implementations
  };



  var template = Handlebars.compile(Fs.readFileSync(__dirname + '/report.handlebars').toString());
  return template({
    browsers: browsers,
    tests: tests,
    date: new Date().toLocaleDateString(),
    babelVersion: Babel.version,
    babelRuntimeVersion: BabelRuntimePackage.version,
    traceurVersion: TraceurPackage.version,

    reportData: JSON.stringify(reportData)
  });
}
