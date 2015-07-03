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

    var tests = SixSpeed.tests;
    Async.forEachSeries(_.keys(tests), function(testName, done) {
      if (grep && !grep.test(testName)) {
        return done();
      }

      var test = tests[testName],
          hz = {},
          elapsed = {},
          count = {},
          result = {
            types: _.keys(test)
          };

      log('running ' + testName + ' ' + JSON.stringify(result.types));

      Async.forEachLimit(result.types, options.concurrency || 1, function(testType, done) {
          options.runTest(testName, testType, function(result) {
            hz[testType] = result.result;
            elapsed[testType] = result.elapsed;
            count[testType] = result.count;
            done();
          });
        },
        function() {
          var supportsES6 = 'es6' in hz,
              baseline = hz.es5;
          delete hz.es5;

          var stats = SixSpeed.stats[testName] = {
            supportsES6: supportsES6,
            baseline: baseline,
            relative: {},
            raw: {},
            elapsed: elapsed,
            count: count,
            errors: {}
          };
          _.each(hz, function(frequency, testName) {
            if (typeof frequency === 'number') {
              hz[testName] = ((frequency / baseline) * 100).toFixed(5) + '%  (' + Benchmark.formatNumber(frequency.toFixed(0)) + ' ops/sec)';

              stats.relative[testName] = frequency / baseline;
              stats.raw[testName] = frequency;
            } else {
              stats.errors[testName] = frequency;
            }
          });

          if (!supportsES6) {
            hz.es6 = 'unsupported';
          }

          log(testName + ' - Baseline ' + (typeof baseline === 'number' ? 'is ' + Benchmark.formatNumber(baseline.toFixed(0)) + ' ops/sec' : 'errored ' + baseline));
          log('Percentage of baseline: ' + JSON.stringify(hz, undefined, 2));
          log('Duration: ' + JSON.stringify(elapsed, undefined, 2));
          log('Count: ' + JSON.stringify(count, undefined, 2));

          if (options.testDone) {
            options.testDone();
          }
          done();
        });
    },
    function() {
      SixSpeed.running = false;
      SixSpeed.ran = true;

      if (options.done) {
        options.done();
      }
    });
  },

  benchTest: function(test, type, callback) {
    try {
      SixSpeed.tests[test][type](function(fn) {
        var bench = new Benchmark(test + '-' + type, fn);
        bench.on('complete', function() {
          callback({result: bench.error ? bench.error + '' : bench.hz, elapsed: bench.times.elapsed, count: bench.count});
        });
        bench.run({async: true});
      }, test, type, testRequire, assertEqual);
    } catch (err) {
      callback(err + '');
    }
  }
};

function assertEqual(a, b) {
  if (a !== b) {
    throw new Error('AssertError - Expect ' + a + ' to equal ' + b);
  }
}

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
