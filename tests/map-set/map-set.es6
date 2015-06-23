if (testType === 'es6' && (!NativeFeatures.Map || !NativeFeatures.Set)) {
  throw new Error('Promises not natively supported');
}

test(function() {
  var map = new Map();
  map.set('foo', 'bar');
  map.has('foo');

  var set = new Set();
  set.add('bar');
  return set.has('bar');
});
