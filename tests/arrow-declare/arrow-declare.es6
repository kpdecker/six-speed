
var obj = {
  value: 42,
  fn: function() {
    return () => this.value;
  }
};

test(function() {
  obj.fn();
});
