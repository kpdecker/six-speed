
var obj = {
  value: 42,
  fn: function() {
    return () => this.value;
  }
};

var fn = obj.fn();

test(function() {
  fn();
});
