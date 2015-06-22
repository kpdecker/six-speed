class C {
  constructor() {
    this.foo = 'bar';
  }
  bar() {
  }
}
test(function() {
  return new C();
});
