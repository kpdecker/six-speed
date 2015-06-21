function fn(foo, ...args) {
  return args[0];
}

test(function() {
  fn();
  fn(2);
  fn(2, 4);
});
