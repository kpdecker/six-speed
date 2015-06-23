(function(global) {
  global.NativeFeatures = {
    Promise: !!global.Promise,
    Symbol: !!global.Symbol,
    Map: !!global.Map,
    Set: !!global.Set
  };
}(this));
