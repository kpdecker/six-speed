function * generator() {
  yield 1;
  yield 2;
}

test(function() {
  var iterator = generator();
  iterator.next();
  iterator.next();
  iterator.next();
});

