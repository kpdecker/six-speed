// Create an instance so we throw safely here, rather in the async test
new Promise(function() {});   // eslint-disable-line no-new

test({
  defer: true,
  fn: function(deferred) {
    var p1 = new Promise(function(resolve) { resolve('foo'); });

    p1.then(function() {
      deferred.resolve();
    });
  }
});
