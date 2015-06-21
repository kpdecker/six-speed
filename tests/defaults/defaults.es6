function fn(arg = 1, other = 3) {
  return other;
}

test(function() {
  fn();
  fn(2);
  fn(2, 4);
});
