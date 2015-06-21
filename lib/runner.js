var _ = require('lodash'),
      Async = require('async'),
      Benchmark = require('benchmark');

var SixSpeed = {
  tests: {},

  run: function(grep) {
    if (grep && typeof grep === 'string') {
      grep = new RegExp('.*' + grep + '.*');
    }

    var tests = SixSpeed.tests,
        suites = [];
    _.each(tests, function(test, testName) {
      if (grep && !grep.test(testName)) {
        return;
      }

      var suite = new Benchmark.Suite(testName);

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
            hz[bench.name] = bench.hz;
          });

          _.each(hz, function(frequency, testName) {
            hz[testName] = ((frequency / baseline.hz) * 100).toFixed(5) + '%  (' + Benchmark.formatNumber(frequency.toFixed(0)) + ' ops/sec)';
          });

          if (!supportsES6) {
            hz.es6 = 'unsupported';
          }

          console.log(this.name + ' - Baseline is ' + Benchmark.formatNumber(baseline.hz.toFixed(0)) + ' ops/sec');
          console.log('Percentage of baseline: ', JSON.stringify(hz, undefined, 2));
        });

      suites.push(suite);
    });

    Async.forEachSeries(suites, function(suite, done) {
      console.log('running', suite.name);
      suite.on('complete', function() {
        done();
      });
      suite.run({async: true});
    },
    function() {
      console.log('DONE');
    });
  }
};

if (typeof global !== 'undefined') {
  global.SixSpeed = SixSpeed;
}
