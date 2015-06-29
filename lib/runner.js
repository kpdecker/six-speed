var _ = require('lodash'),
      Async = require('async'),
      Benchmark = require('benchmark');

var SixSpeed = {
  tests: {},
  stats: {},
  log: [],

  running: false,
  ran: false,

  profile: function(testName, testType, count) {
    if (!SixSpeed.tests[testName]) {
      throw new Error('Unknown test: ' + testName);
    }
    if (!SixSpeed.tests[testName][testType]) {
      throw new Error('Unknown test type: ' + testType + ' for test ' + testName);
    }
    SixSpeed.tests[testName][testType](function(fn) {
      for (var i = 0; i < count; i++) {
        fn();
      }

      console.log('done');
    }, testName, testType, testRequire);
  },

  bench: function(options) {
    var grep = options.grep;
    if (grep && typeof grep === 'string') {
      grep = new RegExp('.*' + grep + '.*');
    }

    function log(message) {
      SixSpeed.log.push(message);
      (options.log || console.log)(message);
    }

    SixSpeed.running = true;

    var tests = SixSpeed.tests,
        suites = [];
    _.each(tests, function(test, testName) {
      if (grep && !grep.test(testName)) {
        return;
      }

      var suite = new Benchmark.Suite(testName);
      suite.types = _.keys(test);

      var errored = {};

      _.each(test, function(testInstance, testType) {
        try {
          testInstance(function(fn) {
            suite.add(testType, fn);
          }, testName, testType, testRequire);
        } catch (err) {
          errored[testType] = err + '';
        }
      });

      suite
        .on('complete', function() {
          var hz = {},
              supportsES6;
          var baseline = this.reduce(function(prev, bench) {
            if (bench.name === 'es6') {
              supportsES6 = true;
            }

            if (bench.name === 'es5') {
              return bench;
            } else {
              return prev;
            }
          });

          this.filter(function(test) {
            return test !== baseline;
          }).forEach(function(bench) {
            hz[bench.name] = bench.error ? bench.error + '' : bench.hz;
          });


          var stats = SixSpeed.stats[this.name] = {
            supportsES6: supportsES6,
            baseline: baseline.hz,
            relative: {},
            raw: {},
            errors: errored
          };
          _.each(hz, function(frequency, testName) {
            if (typeof frequency === 'number') {
              hz[testName] = ((frequency / baseline.hz) * 100).toFixed(5) + '%  (' + Benchmark.formatNumber(frequency.toFixed(0)) + ' ops/sec)';

              stats.relative[testName] = frequency / baseline.hz;
              stats.raw[testName] = frequency;
            } else {
              stats.errors[testName] = frequency;
            }
          });

          if (!supportsES6) {
            hz.es6 = 'unsupported';
          }

          log(this.name + ' - Baseline is ' + Benchmark.formatNumber(baseline.hz.toFixed(0)) + ' ops/sec');
          log('Percentage of baseline: ' + JSON.stringify(hz, undefined, 2));
        });

      suites.push(suite);
    });

    Async.forEachSeries(suites, function(suite, done) {
      log('running ' + suite.name + ' ' + JSON.stringify(suite.types));
      suite.on('complete', function() {
        done();

        if (options.testDone) {
          options.testDone();
        }
      });
      suite.run({async: true});
    },
    function() {
      SixSpeed.running = false;
      SixSpeed.ran = true;

      if (options.done) {
        options.done();
      }
    });
  }
};

function testRequire(name) {
  // Helper util that allows tests to do simple requires into the webpack space
  if (name === 'babel-runtime/core-js/map') {
    return require('babel-runtime/core-js/map');
  } else if (name === 'babel-runtime/core-js/set') {
    return require('babel-runtime/core-js/set');
  } else if (name === 'babel-runtime/helpers/create-class') {
    return require('babel-runtime/helpers/create-class');
  } else if (name === 'babel-runtime/helpers/class-call-check') {
    return require('babel-runtime/helpers/class-call-check');
  } else if (name === 'babel-runtime/helpers/define-property') {
    return require('babel-runtime/helpers/define-property');
  } else if (name === 'babel-runtime/helpers/get') {
    return require('babel-runtime/helpers/get');
  } else if (name === 'babel-runtime/helpers/inherits') {
    return require('babel-runtime/helpers/inherits');
  } else if (name === 'babel-runtime/helpers/sliced-to-array') {
    return require('babel-runtime/helpers/sliced-to-array');
  } else if (name === 'babel-runtime/helpers/tagged-template-literal') {
    return require('babel-runtime/helpers/tagged-template-literal');
  } else if (name === 'babel-runtime/helpers/tagged-template-literal-loose') {
    return require('babel-runtime/helpers/tagged-template-literal-loose');
  } else if (name === 'babel-runtime/helpers/to-consumable-array') {
    return require('babel-runtime/helpers/to-consumable-array');
  } else if (name === 'babel-runtime/core-js/get-iterator') {
    return require('babel-runtime/core-js/get-iterator');
  } else if (name === 'babel-runtime/core-js/symbol') {
    return require('babel-runtime/core-js/symbol');
  } else if (name === 'babel-runtime/core-js/symbol/iterator') {
    return require('babel-runtime/core-js/symbol/iterator');
  } else if (name === 'babel-runtime/core-js/object/keys') {
    return require('babel-runtime/core-js/object/keys');
  } else if (name === 'babel-runtime/core-js/promise') {
    return require('babel-runtime/core-js/promise');
  } else if (name === 'babel-runtime/regenerator') {
    return require('babel-runtime/regenerator');
  } else if (name === 'bluebird') {
    return require('bluebird');
  } else {
    throw new Error('Unsupported test library: ' + name);
  }
}

if (typeof global !== 'undefined') {
  global.SixSpeed = SixSpeed;
}
