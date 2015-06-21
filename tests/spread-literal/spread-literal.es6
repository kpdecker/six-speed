function fn() {
  return [1, ... [1,2,3]];
}

test(function() {
  fn();
});
