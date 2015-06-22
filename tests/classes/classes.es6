class C {
  constructor() {
    this.foo = 'bar';
  }
  bar() {
  }
}
function fn() {
  return new C();
}

test(function() {
  fn();
});
