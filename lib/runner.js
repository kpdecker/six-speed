
const _ = require('lodash');
const Async = require('async');
const Benchmark = require('benchmark');

const SixSpeed = {
  tests: {},
  stats: {},
  log: [],

  running: false,
  ran: false,

  profile(testName, testType, count) {
    if (!SixSpeed.tests[testName]) {
      throw new Error(`Unknown test: ${testName}`);
    }
    if (!SixSpeed.tests[testName][testType]) {
      throw new Error(`Unknown test type: ${testType} for test ${testName}`);
    }

    SixSpeed.tests[testName][testType](fn => {
      if (fn.defer) {
        (function exec(i) {
          fn.fn({
            resolve() {
              if (i < count) {
                exec(i + 1);
              } else {
                console.log('done');
              }
            }
          });
        }(0));
      } else {
        for (let i = 0; i < count; i++) {
          fn();
        }

        console.log('done');
      }
    }, testName, testType, testRequire, assertEqual);
  },

  bench(options) {
    let grep = options.grep;
    if (grep && typeof grep === 'string') {
      grep = new RegExp(`.*${grep}.*`);
    }

    function log(message) {
      SixSpeed.log.push(message);
      (options.log || console.log)(message);
    }

    SixSpeed.running = true;

    const tests = SixSpeed.tests;
    const testOrder = _.keys(tests).sort((a, b) => { if (a === 'promises') { return -1; } else if (b === 'promises') { return 1; } else { return a.localeCompare(b); }});
    Async.forEachSeries(testOrder, (testName, done) => {
      if (grep && !grep.test(testName)) {
        return done();
      }

      const test = tests[testName];
      const hz = {};
      const elapsed = {};
      const count = {};

      const result = {
        types: _.keys(test)
      };

      log(`running ${testName} ${JSON.stringify(result.types)}`);

      Async.forEachLimit(result.types, options.concurrency || 1, (testType, done) => {
          let counter = 0;
          (function runAttempt() {
            const iteration = counter;
            if (counter > 3) {
              log(`  cancelled ${testName} ${testType} ${iteration}`);
              return done();
            }
            counter++;

            log(`  running ${testName} ${testType} ${iteration}`);
            options.runTest(testName, testType, result => {
              hz[testType] = result.result;
              elapsed[testType] = result.elapsed;
              count[testType] = result.count;

              if (typeof hz[testType] === 'number' && !isFinite(hz[testType])) {
                log(`  failed ${testName} ${testType} ${iteration}`);
                hz[testType] = 'Failed due to infinite benchmark';
                runAttempt();
              } else {
                log(`  complete ${testName} ${testType} ${iteration} ${result.result}`);
                done();
              }
            });
          }());
        },
        () => {
          const supportsES6 = 'es6' in hz;
          const baseline = hz.es5;
          delete hz.es5;

          const stats = SixSpeed.stats[testName] = {
            supportsES6,
            baseline,
            relative: {},
            raw: {},
            elapsed,
            count,
            errors: {}
          };
          _.each(hz, (frequency, testName) => {
            if (typeof baseline !== 'number' || !isFinite(baseline)) {
              stats.errors[testName] = `baseline failed: ${baseline}`;
            } else if (typeof frequency === 'number') {
              hz[testName] = `${((frequency / baseline) * 100).toFixed(5)}%  (${Benchmark.formatNumber(frequency.toFixed(0))} ops/sec)`;

              stats.relative[testName] = frequency / baseline;
              stats.raw[testName] = frequency;
            } else {
              stats.errors[testName] = frequency;
            }
          });

          if (!supportsES6) {
            hz.es6 = 'unsupported';
          }

          log(`${testName} - Baseline ${typeof baseline === 'number' ? `is ${Benchmark.formatNumber(baseline.toFixed(0))} ops/sec` : `errored ${baseline}`}`);
          log(`Percentage of baseline: ${JSON.stringify(hz, undefined, 2)}`);
          log(`Duration: ${JSON.stringify(elapsed, undefined, 2)}`);
          log(`Count: ${JSON.stringify(count, undefined, 2)}`);

          if (options.testDone) {
            options.testDone();
          }
          done();
        });
    },
    () => {
      SixSpeed.running = false;
      SixSpeed.ran = true;

      if (options.done) {
        options.done();
      }
    });
  },

  benchTest(test, type, callback, async) {
    try {
      SixSpeed.tests[test][type](fn => {
        const bench = new Benchmark(`${test}-${type}`, fn);
        bench.on('complete', () => {
          callback({result: bench.error ? `${bench.error}` : bench.hz, elapsed: bench.times.elapsed, count: bench.count});
        });
        bench.run({async});
      }, test, type, testRequire, assertEqual);
    } catch (err) {
      callback({result: `${err}`});
    }
  }
};

function assertEqual(a, b) {
  if (a !== b) {
    throw new Error(`AssertError - Expect ${a} to equal ${b}`);
  }
}

function testRequire(name) {
  // try {
    // require(name);
  // }
  // catch (e) {
    // throw new Error(`Unsupported test library: ${name}`);
  // }
  if (name === '@babel/runtime-corejs2/core-js/map') {
    return require('@babel/runtime-corejs2/core-js/map');
  } else if (name === '@babel/runtime-corejs2/core-js/set') {
    return require('@babel/runtime-corejs2/core-js/set');
  } else if (name === '@babel/runtime/helpers/createClass') {
    return require('@babel/runtime/helpers/createClass');
  } else if (name === '@babel/runtime/helpers/classCallCheck') {
    return require('@babel/runtime/helpers/classCallCheck');
  } else if (name === '@babel/runtime/helpers/defineProperty') {
    return require('@babel/runtime/helpers/defineProperty');
  } else if (name === '@babel/runtime/helpers/get') {
    return require('@babel/runtime/helpers/get');
  } else if (name === '@babel/runtime/helpers/inherits') {
    return require('@babel/runtime/helpers/inherits');
  } else if (name === '@babel/runtime/helpers/slicedToArray') {
    return require('@babel/runtime/helpers/slicedToArray');
  } else if (name === '@babel/runtime/helpers/possibleConstructorReturn') {
    return require('@babel/runtime/helpers/possibleConstructorReturn');
  } else if (name === '@babel/runtime/helpers/taggedTemplateLiteral') {
    return require('@babel/runtime/helpers/taggedTemplateLiteral');
  } else if (name === '@babel/runtime/helpers/taggedTemplateLiteralLoose') {
    return require('@babel/runtime/helpers/taggedTemplateLiteralLoose');
  } else if (name === '@babel/runtime/helpers/toConsumableArray') {
    return require('@babel/runtime/helpers/toConsumableArray');
  } else if (name === '@babel/runtime/helpers/interopRequireDefault') {
    return require('@babel/runtime/helpers/interopRequireDefault');
  } else if (name === '@babel/runtime/helpers/typeof') {
    return require('@babel/runtime/helpers/typeof');
  } else if (name === '@babel/runtime/helpers/inheritsLoose') {
    return require('@babel/runtime/helpers/inheritsLoose');
  } else if (name === '@babel/runtime/helpers/getPrototypeOf') {
    return require('@babel/runtime/helpers/getPrototypeOf');
  } else if (name === '@babel/runtime-corejs2/core-js/get-iterator') {
    return require('@babel/runtime-corejs2/core-js/get-iterator');
  } else if (name === '@babel/runtime-corejs2/core-js/symbol') {
    return require('@babel/runtime-corejs2/core-js/symbol');
  } else if (name === '@babel/runtime-corejs2/core-js/symbol/iterator') {
    return require('@babel/runtime-corejs2/core-js/symbol/iterator');
  } else if (name === '@babel/runtime-corejs2/core-js/object/assign') {
    return require('@babel/runtime-corejs2/core-js/object/assign');
  } else if (name === '@babel/runtime-corejs2/core-js/object/get-prototype-of') {
    return require('@babel/runtime-corejs2/core-js/object/get-prototype-of');
  } else if (name === '@babel/runtime-corejs2/core-js/object/keys') {
    return require('@babel/runtime-corejs2/core-js/object/keys');
  } else if (name === '@babel/runtime-corejs2/core-js/promise') {
    return require('@babel/runtime-corejs2/core-js/promise');
  } else if (name === '@babel/runtime/regenerator') {
    return require('@babel/runtime/regenerator');
  } else if (name === 'bluebird') {
    return require('bluebird');
  } else {
    throw new Error(`Unsupported test library: ${name}`);
  }
}

if (typeof global !== 'undefined') {
  global.SixSpeed = SixSpeed;
}
