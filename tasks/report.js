const _ = require('lodash');
const Babel = require('@babel/core');
const BabelRuntimePackage = require('@babel/plugin-transform-runtime');
const DataStore = require('../lib/data-store');
const Fs = require('fs');
const Gulp = require('gulp');
const Log = require('fancy-log');
const PluginError = require('plugin-error');
const Handlebars = require('handlebars');
const Path = require('path');
const webpack = require('webpack');
const pkg = require('../package.json').dependencies;

Gulp.task('report:static', async () => {
  return Gulp.src('report/*.css')
    .pipe(Gulp.dest('site/'))
});

Gulp.task('report:bootstrap:fonts', async () => {
  return Gulp.src(['bower_components/bootstrap/fonts/*'], {base: 'bower_components/bootstrap'})
    .pipe(Gulp.dest('site/'))
});

Gulp.task('report:bootstrap:css', async () => {
  return Gulp.src(['bower_components/bootstrap/dist/css/*'], {base: 'bower_components/bootstrap/dist'})
    .pipe(Gulp.dest('site/'))
});

Gulp.task('report:webpack', async (callback) => {
  return webpack({
    mode: 'production',
    entry: {
      report: './report/index.js'
    },
    output: {
      path: Path.resolve(__dirname, '../site/'),
      filename: '[name].js'
    },
    module: {
      rules: [{
        test: /\.jsx?$/,
        exclude: /node_modules|vendor|bower_components/,
        use: [{
          loader: 'babel-loader',
        }]
      }, {
        test: /bootstrap\/js/,
        use: [{
          loader: 'imports',
          options: {
            jQuery: 'jquery'
          }
        }]
      }]
    },
    resolve: {
      alias: {
        root: Path.join(__dirname, '..', 'bower_components')
      }
    },
  }, (err, stats) => {
      if (err) {
        throw new PluginError('webpack', err);
      }
      Log('[webpack]', stats.toString());
      callback();
  });
});

function render() {
  const data = DataStore.load();
  const notes = DataStore.notes();

  // And the browsers tested
  let browserTags = [];

  let familyTags = [];
  let browsers = _.map(data, (browserData, browserName) => {
    const tags = _.keys(browserData);
    const family = notes.family[browserName].map(tag => `js-family-${tag}`).join(' ');
    let versionTag = '';

    const fullVersions = _.map(tags, tag => {
      // A bit of a hack here, but we treat all node releases that we are testing as stable
      let tagName = tag;
      if (/^\d/.test(tag)) {
        tagName = 'stable';
      }

      browserTags = browserTags.concat(tagName);

      tagName = ` js-version-${tagName}`;
      versionTag += tagName;

      const versionName = browserData[tag].version;
      let displayName = versionName;
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
  browsers = _.filter(browsers, ({versions}) => versions.length > 0);

  // Pull out all of the tests that were actually run
  let implementations = [];
  let tests = _.map(data, browserData => _.flatten(_.map(browserData, ({stats}) => _.keys(stats))));
  tests = _.flatten(tests);
  tests = _.uniq(tests);
  tests = tests.sort();

  tests = _.map(tests, test => {
    let types = [];

    // Figure out what types this particular test has
    _.each(data, browserData => {
      _.each(browserData, versionData => {
        const stats = versionData.stats[test] || {};
        types = _.union(types, _.keys(stats.relative), _.keys(stats.errors));
      });
    });
    types = types.sort((a, b) => {
      // Push anything with es prefix to the end of the list
      if (/^es/.test(a)) {
        a = `zz${a}`;
      }
      if (/^es/.test(b)) {
        b = `zz${b}`;
      }
      return a.localeCompare(b);
    });

    // Save these results to the full implementation list
    implementations = _.union(implementations, types);
    _.each(browsers, ({name, versions}) => {
      const browserData = data[name];
      const firstVersion = true;

      _.each(versions, ({id}) => {
        const versionData = browserData[id];
        const elapsed = versionData.stats[test] || {};

        // Look for elapsed times that have a high variance
        if (elapsed != undefined || elapsed != null) {
          const types = Object.keys(elapsed);
          const average = types.reduce((prev, curr) => prev + elapsed[curr], 0) / types.length;

          if (types.find((type) => elapsed[type] / average > 2 || elapsed[type] / average < 0.5)) {
            console.warn('Elapsed outlier detected', name, id, test, elapsed);
          }
	    }
      });
    });

    // And then collect the results for each type
    types = _.map(types, type => {
      const results = [];
      const typeClazz = `js-impl-${type.replace(/-.*$/, '')}`;
      _.each(browsers, ({name, versions}) => {
        const browserData = data[name];
        let firstVersion = true;

        _.each(versions, ({id, tag}) => {
          const versionData = browserData[id];
          const stats = versionData.stats[test] || {};
          let speed = (stats.relative || {})[type];
          const error = (stats.errors || {})[type];
          let text = '';
          let clazz = 'test-no-support';
          let tip = '';
          if (speed && !error) {
            if (speed.toFixed(1) === '1.0' || speed.toFixed(1) === '1.1' || speed.toFixed(1) === '0.9') {
              text = 'Identical';
              clazz = 'test-ok';
            } else if (speed > 1) {
              text = `${speed.toFixed(speed > 3 ? 0 : 1)}x faster`;
              clazz = 'test-faster';
            } else {
              speed = 1 / speed;
              text = `${speed.toFixed(speed > 3 ? 0 : 1)}x slower`;
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
            text = `<span data-toggle="tooltip" title="${tip.replace(/"/g, '&#x27;')}">${text} <span class="glyphicon glyphicon-info-sign"></span></span>`;
          }

          results.push({
            text,
            clazz: `${tag} ${typeClazz} ${clazz}`
          });
        });
      });

      return {
        name: type,
        clazz: typeClazz,
        results
      };
    });

    return {
      name: test,
      display: test.replace(/_/g, ' '),
      types
    };
  });

  implementations = _.map(implementations, impl => impl.replace(/-.*$/, ''));
  implementations = _.uniq(implementations.sort());
  implementations = _.map(implementations, implementation => ({
    name: implementation,
    selector: `js-impl-${implementation}`
  }));

  const reportData = {
    engines: _.union(_.uniq(browserTags).map(tag => ({
      name: _.capitalize(tag),
      selector: `js-version-${tag}`
    })),
      [{dash: true}],
      familyTags.sort().map(tag => ({
        name: _.capitalize(tag),
        selector: `js-family-${tag}`
      }))),
    implementations
  };

  const template = Handlebars.compile(Fs.readFileSync(`${__dirname}/report.handlebars`).toString());
  return template({
    browsers,
    tests,
    date: new Date().toLocaleDateString(),
    babelVersion: Babel.version,
    babelRuntimeVersion: pkg['@babel/runtime'].replace('^', ''),
    typescriptVersion: pkg.typescript.replace('^', ''),
    jqueryVersion: pkg.jquery.replace('^', ''),
    bootstrapVersion: pkg.bootstrap.replace('^', ''),

    reportData: JSON.stringify(reportData)
  });
}

Gulp.task('report', Gulp.series('report:static', 'report:bootstrap:fonts', 'report:bootstrap:css', 'report:webpack', async () => {
  const report = render();
  try {
    Fs.statSync('site');
  } catch(e) {
    Fs.mkdirSync('site');
  }
  return Fs.writeFileSync('site/index.html', report);
}));
