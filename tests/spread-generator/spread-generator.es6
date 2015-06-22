function *generate() {
  yield 1;
  yield 2;
  yield 3;
}

test(function() {
  return Math.max(... generate());
});
