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
    const testOrder = Object.keys(tests).sort((a, b) => { if (a === 'promises') { return -1; } else if (b === 'promises') { return 1; } else { return a.localeCompare(b); }});
    Async.forEachSeries(testOrder, (testName, done) => {
      if (grep && !grep.test(testName)) {
        return done();
      }

      const test = tests[testName];
      const hz = {};
      const elapsed = {};
      const count = {};

      const result = {
        types: Object.keys(test)
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

              if (typeof hz[testType] === 'number' && isFinite(hz[testType])) {
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
          Object.entries(hz).forEach(([frequency, testName]) => {
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
  let lib
  try {
    lib = require(name);
  }
  catch (e) {
    throw new Error(`Unsupported test library: ${name}`);
  }

  return lib
}

if (typeof global !== 'undefined') {
  global.SixSpeed = SixSpeed;
}
