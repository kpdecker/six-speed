function *generate() {
  yield 1;
  yield 2;
  yield 3;
}

function fn() {
  return Math.max(... generate());
}

test(function() {
  fn();
});
