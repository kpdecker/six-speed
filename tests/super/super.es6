
class C {
  constructor() {
    this.foo = 'bar';
  }
  bar() {
  }
}
class D extends C {
  constructor() {
    super();
    this.baz = 'bat';
  }
  bar() {
    super.bar();
  }
}
function fn() {
  var d = new D();
  return d.bar();
}

test(function() {
  fn();
});
