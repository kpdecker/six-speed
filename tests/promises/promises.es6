test({
  defer: true,
  fn: function(deferred) {
    var p1 = new Promise(function(resolve) { resolve('foo'); });

    p1.then(function() {
      deferred.resolve();
    });
  }
});
