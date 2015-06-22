var data = {'a': 'b', 'c': 'd'};
data[Symbol.iterator] = function() {
  var array = Object.keys(data),
      nextIndex = 0;

  return {
    next: function() {
       return nextIndex < array.length ?
         {value: array[nextIndex++], done: false} :
         {done: true};
    }
  };
};

test(function() {
  var ret = '';
  for (var value of data) {
    ret += value;
  }
  return ret;
});
