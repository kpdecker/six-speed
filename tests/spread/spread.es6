function fn() {
  return Math.max(...[1,2,3]);
}

test(function() {
  fn();
});
