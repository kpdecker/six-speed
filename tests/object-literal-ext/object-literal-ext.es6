function fn() {
  var name = 'foo';
  return {
    'bizz buzz'() {
      return 1;
    },
    name,
    [name]: 'bar'
  };
}

test(function() {
  fn();
});
