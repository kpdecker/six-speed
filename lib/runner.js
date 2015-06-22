var _ = require('lodash'),
      Async = require('async'),
      Benchmark = require('benchmark');

require('babel/polyfill');

var SixSpeed = {
  tests: {},
  stats: {},
  log: [],

  running: false,
  ran: false,

  run: function(grep, logCallback, done) {
    if (grep && typeof grep === 'string') {
      grep = new RegExp('.*' + grep + '.*');
    }
    function log(message) {
      SixSpeed.log.push(message);
      (logCallback || console.log)(message);
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

      _.each(test, function(testInstance, testType) {
        testInstance(suite, testName, testType);
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
            errors: {}
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
      });
      suite.run({async: true});
    },
    function() {
      SixSpeed.running = false;
      SixSpeed.ran = true;
      if (done) {
        done();
      }
    });
  }
};

if (typeof global !== 'undefined') {
  global.SixSpeed = SixSpeed;
}
