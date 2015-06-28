if (testType === 'es6' && (!NativeFeatures.Map || !NativeFeatures.Set)) {
  throw new Error('Promises not natively supported');
}

test(function() {
  var map = new Map(),
      set = new Set();

  for (var i = 0; i < 250; i++) {
    map.set(i, i);
    set.add(i);
  }

  map.set('foo', 'bar');
  set.add('bar');

  return map.has('foo') && set.has('bar');
});
