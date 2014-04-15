//     Underscore.js 1.6.0
//     http://underscorejs.org
//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    concat           = ArrayProto.concat,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.6.0';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return obj;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, length = obj.length; i < length; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      var keys = _.keys(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
      }
    }
    return obj;
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results.push(iterator.call(context, value, index, list));
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var result;
    any(obj, function(value, index, list) {
      if (predicate.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(predicate, context);
    each(obj, function(value, index, list) {
      if (predicate.call(context, value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, function(value, index, list) {
      return !predicate.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate || (predicate = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(predicate, context);
    each(obj, function(value, index, list) {
      if (!(result = result && predicate.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, predicate, context) {
    predicate || (predicate = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(predicate, context);
    each(obj, function(value, index, list) {
      if (result || (result = predicate.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matches(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matches(attrs));
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See [WebKit Bug 80797](https://bugs.webkit.org/show_bug.cgi?id=80797)
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    var result = -Infinity, lastComputed = -Infinity;
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      if (computed > lastComputed) {
        result = value;
        lastComputed = computed;
      }
    });
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    var result = Infinity, lastComputed = Infinity;
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      if (computed < lastComputed) {
        result = value;
        lastComputed = computed;
      }
    });
    return result;
  };

  // Shuffle an array, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (obj.length !== +obj.length) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return value;
    return _.property(value);
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, iterator, context) {
    iterator = lookupIterator(iterator);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iterator, context) {
      var result = {};
      iterator = lookupIterator(iterator);
      each(obj, function(value, index) {
        var key = iterator.call(context, value, index, obj);
        behavior(result, key, value);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, key, value) {
    _.has(result, key) ? result[key].push(value) : result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, key, value) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, key) {
    _.has(result, key) ? result[key]++ : result[key] = 1;
  });

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) return array[0];
    if (n < 0) return [];
    return slice.call(array, 0, n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) return array[array.length - 1];
    return slice.call(array, Math.max(array.length - n, 0));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    if (shallow && _.every(input, _.isArray)) {
      return concat.apply(output, input);
    }
    each(input, function(value) {
      if (_.isArray(value) || _.isArguments(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Split an array into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(array, predicate) {
    var pass = [], fail = [];
    each(array, function(elem) {
      (predicate(elem) ? pass : fail).push(elem);
    });
    return [pass, fail];
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.contains(other, item);
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var length = _.max(_.pluck(arguments, 'length').concat(0));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(arguments, '' + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, length = list.length; i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, length = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, length + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(length);

    while(idx < length) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    return function() {
      var position = 0;
      var args = boundArgs.slice();
      for (var i = 0, length = args.length; i < length; i++) {
        if (args[i] === _) args[i] = arguments[position++];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return func.apply(this, args);
    };
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) throw new Error('bindAll must be passed function names');
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    options || (options = {});
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
        context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;
      if (last < wait) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) {
        timeout = setTimeout(later, wait);
      }
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = new Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = new Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] === void 0) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                             _.isFunction(bCtor) && (bCtor instanceof bCtor))
                        && ('constructor' in a && 'constructor' in b)) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  _.constant = function(value) {
    return function () {
      return value;
    };
  };

  _.property = function(key) {
    return function(obj) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of `key:value` pairs.
  _.matches = function(attrs) {
    return function(obj) {
      if (obj === attrs) return true; //avoid comparing an object to itself.
      for (var key in attrs) {
        if (attrs[key] !== obj[key])
          return false;
      }
      return true;
    }
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(Math.max(0, n));
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() { return new Date().getTime(); };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}).call(this);
(function() {
  this.Gmaps = {
    build: function(type, options) {
      var model;
      if (options == null) {
        options = {};
      }
      model = _.isFunction(options.handler) ? options.handler : Gmaps.Objects.Handler;
      return new model(type, options);
    },
    Builders: {},
    Objects: {},
    Google: {
      Objects: {},
      Builders: {}
    }
  };

}).call(this);
(function() {
  var moduleKeywords,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  moduleKeywords = ['extended', 'included'];

  this.Gmaps.Base = (function() {
    function Base() {}

    Base.extend = function(obj) {
      var key, value, _ref;
      for (key in obj) {
        value = obj[key];
        if (__indexOf.call(moduleKeywords, key) < 0) {
          this[key] = value;
        }
      }
      if ((_ref = obj.extended) != null) {
        _ref.apply(this);
      }
      return this;
    };

    Base.include = function(obj) {
      var key, value, _ref;
      for (key in obj) {
        value = obj[key];
        if (__indexOf.call(moduleKeywords, key) < 0) {
          this.prototype[key] = value;
        }
      }
      if ((_ref = obj.included) != null) {
        _ref.apply(this);
      }
      return this;
    };

    return Base;

  })();

}).call(this);
(function() {
  this.Gmaps.Objects.BaseBuilder = (function() {
    function BaseBuilder() {}

    BaseBuilder.prototype.build = function() {
      return new (this.model_class())(this.serviceObject);
    };

    BaseBuilder.prototype.before_init = function() {};

    BaseBuilder.prototype.after_init = function() {};

    BaseBuilder.prototype.addListener = function(action, fn) {
      return this.primitives().addListener(this.getServiceObject(), action, fn);
    };

    BaseBuilder.prototype.getServiceObject = function() {
      return this.serviceObject;
    };

    BaseBuilder.prototype.primitives = function() {
      return this.constructor.PRIMITIVES;
    };

    BaseBuilder.prototype.model_class = function() {
      return this.constructor.OBJECT;
    };

    return BaseBuilder;

  })();

}).call(this);
(function() {
  this.Gmaps.Objects.Builders = function(builderClass, objectClass, primitivesProvider) {
    return {
      build: function(args, provider_options, internal_options) {
        var builder;
        objectClass.PRIMITIVES = primitivesProvider;
        builderClass.OBJECT = objectClass;
        builderClass.PRIMITIVES = primitivesProvider;
        builder = new builderClass(args, provider_options, internal_options);
        return builder.build();
      }
    };
  };

}).call(this);
(function() {
  this.Gmaps.Objects.Handler = (function() {
    function Handler(type, options) {
      this.type = type;
      if (options == null) {
        options = {};
      }
      this.setPrimitives(options);
      this.setOptions(options);
      this._cacheAllBuilders();
      this.resetBounds();
    }

    Handler.prototype.buildMap = function(options, onMapLoad) {
      if (onMapLoad == null) {
        onMapLoad = function() {};
      }
      return this.map = this._builder('Map').build(options, (function(_this) {
        return function() {
          _this._createClusterer();
          return onMapLoad();
        };
      })(this));
    };

    Handler.prototype.addMarkers = function(markers_data, provider_options) {
      return _.map(markers_data, (function(_this) {
        return function(marker_data) {
          return _this.addMarker(marker_data, provider_options);
        };
      })(this));
    };

    Handler.prototype.addMarker = function(marker_data, provider_options) {
      var marker;
      marker = this._builder('Marker').build(marker_data, provider_options, this.marker_options);
      marker.setMap(this.getMap());
      this.clusterer.addMarker(marker);
      return marker;
    };

    Handler.prototype.addCircles = function(circles_data, provider_options) {
      return _.map(circles_data, (function(_this) {
        return function(circle_data) {
          return _this.addCircle(circle_data, provider_options);
        };
      })(this));
    };

    Handler.prototype.addCircle = function(circle_data, provider_options) {
      return this._addResource('circle', circle_data, provider_options);
    };

    Handler.prototype.addPolylines = function(polylines_data, provider_options) {
      return _.map(polylines_data, (function(_this) {
        return function(polyline_data) {
          return _this.addPolyline(polyline_data, provider_options);
        };
      })(this));
    };

    Handler.prototype.addPolyline = function(polyline_data, provider_options) {
      return this._addResource('polyline', polyline_data, provider_options);
    };

    Handler.prototype.addPolygons = function(polygons_data, provider_options) {
      return _.map(polygons_data, (function(_this) {
        return function(polygon_data) {
          return _this.addPolygon(polygon_data, provider_options);
        };
      })(this));
    };

    Handler.prototype.addPolygon = function(polygon_data, provider_options) {
      return this._addResource('polygon', polygon_data, provider_options);
    };

    Handler.prototype.addKmls = function(kmls_data, provider_options) {
      return _.map(kmls_data, (function(_this) {
        return function(kml_data) {
          return _this.addKml(kml_data, provider_options);
        };
      })(this));
    };

    Handler.prototype.addKml = function(kml_data, provider_options) {
      return this._addResource('kml', kml_data, provider_options);
    };

    Handler.prototype.removeMarkers = function(gem_markers) {
      return _.map(gem_markers, (function(_this) {
        return function(gem_marker) {
          return _this.removeMarker(gem_marker);
        };
      })(this));
    };

    Handler.prototype.removeMarker = function(gem_marker) {
      gem_marker.clear();
      return this.clusterer.removeMarker(gem_marker);
    };

    Handler.prototype.fitMapToBounds = function() {
      return this.map.fitToBounds(this.bounds.getServiceObject());
    };

    Handler.prototype.getMap = function() {
      return this.map.getServiceObject();
    };

    Handler.prototype.setOptions = function(options) {
      this.marker_options = _.extend(this._default_marker_options(), options.markers);
      this.builders = _.extend(this._default_builders(), options.builders);
      return this.models = _.extend(this._default_models(), options.models);
    };

    Handler.prototype.resetBounds = function() {
      return this.bounds = this._builder('Bound').build();
    };

    Handler.prototype.setPrimitives = function(options) {
      return this.primitives = options.primitives === void 0 ? this._rootModule().Primitives() : _.isFunction(options.primitives) ? options.primitives() : options.primitives;
    };

    Handler.prototype.currentInfowindow = function() {
      return this.builders.Marker.CURRENT_INFOWINDOW;
    };

    Handler.prototype._addResource = function(resource_name, resource_data, provider_options) {
      var resource;
      resource = this._builder(resource_name).build(resource_data, provider_options);
      resource.setMap(this.getMap());
      return resource;
    };

    Handler.prototype._cacheAllBuilders = function() {
      var that;
      that = this;
      return _.each(['Bound', 'Circle', 'Clusterer', 'Kml', 'Map', 'Marker', 'Polygon', 'Polyline'], function(kind) {
        return that._builder(kind);
      });
    };

    Handler.prototype._clusterize = function() {
      return _.isObject(this.marker_options.clusterer);
    };

    Handler.prototype._createClusterer = function() {
      return this.clusterer = this._builder('Clusterer').build({
        map: this.getMap()
      }, this.marker_options.clusterer);
    };

    Handler.prototype._default_marker_options = function() {
      return _.clone({
        singleInfowindow: true,
        maxRandomDistance: 0,
        clusterer: {
          maxZoom: 5,
          gridSize: 50
        }
      });
    };

    Handler.prototype._builder = function(name) {
      var _name;
      name = this._capitalize(name);
      if (this[_name = "__builder" + name] == null) {
        this[_name] = Gmaps.Objects.Builders(this.builders[name], this.models[name], this.primitives);
      }
      return this["__builder" + name];
    };

    Handler.prototype._default_models = function() {
      var models;
      models = _.clone(this._rootModule().Objects);
      if (this._clusterize()) {
        return models;
      } else {
        models.Clusterer = Gmaps.Objects.NullClusterer;
        return models;
      }
    };

    Handler.prototype._capitalize = function(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    };

    Handler.prototype._default_builders = function() {
      return _.clone(this._rootModule().Builders);
    };

    Handler.prototype._rootModule = function() {
      if (this.__rootModule == null) {
        this.__rootModule = Gmaps[this.type];
      }
      return this.__rootModule;
    };

    return Handler;

  })();

}).call(this);
(function() {
  this.Gmaps.Objects.NullClusterer = (function() {
    function NullClusterer() {}

    NullClusterer.prototype.addMarkers = function() {};

    NullClusterer.prototype.addMarker = function() {};

    NullClusterer.prototype.clear = function() {};

    NullClusterer.prototype.removeMarker = function() {};

    return NullClusterer;

  })();

}).call(this);
(function() {
  this.Gmaps.Google.Objects.Common = {
    getServiceObject: function() {
      return this.serviceObject;
    },
    setMap: function(map) {
      return this.getServiceObject().setMap(map);
    },
    clear: function() {
      return this.getServiceObject().setMap(null);
    },
    show: function() {
      return this.getServiceObject().setVisible(true);
    },
    hide: function() {
      return this.getServiceObject().setVisible(false);
    },
    isVisible: function() {
      return this.getServiceObject().getVisible();
    },
    primitives: function() {
      return this.constructor.PRIMITIVES;
    }
  };

}).call(this);
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.Gmaps.Google.Builders.Bound = (function(_super) {
    __extends(Bound, _super);

    function Bound(options) {
      this.before_init();
      this.serviceObject = new (this.primitives().latLngBounds);
      this.after_init();
    }

    return Bound;

  })(Gmaps.Objects.BaseBuilder);

}).call(this);
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.Gmaps.Google.Builders.Circle = (function(_super) {
    __extends(Circle, _super);

    function Circle(args, provider_options) {
      this.args = args;
      this.provider_options = provider_options != null ? provider_options : {};
      this.before_init();
      this.serviceObject = this.create_circle();
      this.after_init();
    }

    Circle.prototype.create_circle = function() {
      return new (this.primitives().circle)(this.circle_options());
    };

    Circle.prototype.circle_options = function() {
      var base_options;
      base_options = {
        center: new (this.primitives().latLng)(this.args.lat, this.args.lng),
        radius: this.args.radius
      };
      return _.defaults(base_options, this.provider_options);
    };

    return Circle;

  })(Gmaps.Objects.BaseBuilder);

}).call(this);
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.Gmaps.Google.Builders.Clusterer = (function(_super) {
    __extends(Clusterer, _super);

    function Clusterer(args, options) {
      this.args = args;
      this.options = options;
      this.before_init();
      this.serviceObject = new (this.primitives().clusterer)(this.args.map, [], this.options);
      this.after_init();
    }

    return Clusterer;

  })(Gmaps.Objects.BaseBuilder);

}).call(this);
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.Gmaps.Google.Builders.Kml = (function(_super) {
    __extends(Kml, _super);

    function Kml(args, provider_options) {
      this.args = args;
      this.provider_options = provider_options != null ? provider_options : {};
      this.before_init();
      this.serviceObject = this.create_kml();
      this.after_init();
    }

    Kml.prototype.create_kml = function() {
      return new (this.primitives().kml)(this.args.url, this.kml_options());
    };

    Kml.prototype.kml_options = function() {
      var base_options;
      base_options = {};
      return _.defaults(base_options, this.provider_options);
    };

    return Kml;

  })(Gmaps.Objects.BaseBuilder);

}).call(this);
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.Gmaps.Google.Builders.Map = (function(_super) {
    __extends(Map, _super);

    function Map(options, onMapLoad) {
      var provider_options;
      this.before_init();
      provider_options = _.extend(this.default_options(), options.provider);
      this.internal_options = options.internal;
      this.serviceObject = new (this.primitives().map)(document.getElementById(this.internal_options.id), provider_options);
      this.on_map_load(onMapLoad);
      this.after_init();
    }

    Map.prototype.build = function() {
      return new (this.model_class())(this.serviceObject, this.primitives());
    };

    Map.prototype.on_map_load = function(onMapLoad) {
      return this.primitives().addListenerOnce(this.serviceObject, 'idle', onMapLoad);
    };

    Map.prototype.default_options = function() {
      return {
        mapTypeId: this.primitives().mapTypes('ROADMAP'),
        center: new (this.primitives().latLng)(0, 0),
        zoom: 8
      };
    };

    return Map;

  })(Gmaps.Objects.BaseBuilder);

}).call(this);
(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.Gmaps.Google.Builders.Marker = (function(_super) {
    __extends(Marker, _super);

    Marker.CURRENT_INFOWINDOW = void 0;

    Marker.CACHE_STORE = {};

    function Marker(args, provider_options, internal_options) {
      this.args = args;
      this.provider_options = provider_options != null ? provider_options : {};
      this.internal_options = internal_options != null ? internal_options : {};
      this.infowindow_binding = __bind(this.infowindow_binding, this);
      this.before_init();
      this.create_marker();
      this.create_infowindow_on_click();
      this.after_init();
    }

    Marker.prototype.build = function() {
      return this.marker = new (this.model_class())(this.serviceObject);
    };

    Marker.prototype.create_marker = function() {
      return this.serviceObject = new (this.primitives().marker)(this.marker_options());
    };

    Marker.prototype.create_infowindow = function() {
      if (!_.isString(this.args.infowindow)) {
        return null;
      }
      return new (this.primitives().infowindow)({
        content: this.args.infowindow
      });
    };

    Marker.prototype.marker_options = function() {
      var base_options, coords;
      coords = this._randomized_coordinates();
      base_options = {
        title: this.args.marker_title,
        position: new (this.primitives().latLng)(coords[0], coords[1]),
        icon: this._get_picture('picture'),
        shadow: this._get_picture('shadow')
      };
      return _.extend(this.provider_options, base_options);
    };

    Marker.prototype.create_infowindow_on_click = function() {
      return this.addListener('click', this.infowindow_binding);
    };

    Marker.prototype.infowindow_binding = function() {
      var _base;
      if (this._should_close_infowindow()) {
        this.constructor.CURRENT_INFOWINDOW.close();
      }
      this.marker.panTo();
      if (this.infowindow == null) {
        this.infowindow = this.create_infowindow();
      }
      if (this.infowindow == null) {
        return;
      }
      this.infowindow.open(this.getServiceObject().getMap(), this.getServiceObject());
      if ((_base = this.marker).infowindow == null) {
        _base.infowindow = this.infowindow;
      }
      return this.constructor.CURRENT_INFOWINDOW = this.infowindow;
    };

    Marker.prototype._get_picture = function(picture_name) {
      if (!_.isObject(this.args[picture_name]) || !_.isString(this.args[picture_name].url)) {
        return null;
      }
      return this._create_or_retrieve_image(this._picture_args(picture_name));
    };

    Marker.prototype._create_or_retrieve_image = function(picture_args) {
      if (this.constructor.CACHE_STORE[picture_args.url] === void 0) {
        this.constructor.CACHE_STORE[picture_args.url] = new (this.primitives().markerImage)(picture_args.url, picture_args.size, picture_args.origin, picture_args.anchor, picture_args.scaledSize);
      }
      return this.constructor.CACHE_STORE[picture_args.url];
    };

    Marker.prototype._picture_args = function(picture_name) {
      return {
        url: this.args[picture_name].url,
        anchor: this._createImageAnchorPosition(this.args[picture_name].anchor),
        size: new (this.primitives().size)(this.args[picture_name].width, this.args[picture_name].height),
        scaledSize: null,
        origin: null
      };
    };

    Marker.prototype._createImageAnchorPosition = function(anchorLocation) {
      if (!_.isArray(anchorLocation)) {
        return null;
      }
      return new (this.primitives().point)(anchorLocation[0], anchorLocation[1]);
    };

    Marker.prototype._should_close_infowindow = function() {
      return this.internal_options.singleInfowindow && (this.constructor.CURRENT_INFOWINDOW != null);
    };

    Marker.prototype._randomized_coordinates = function() {
      var Lat, Lng, dx, dy, random;
      if (!_.isNumber(this.internal_options.maxRandomDistance)) {
        return [this.args.lat, this.args.lng];
      }
      random = function() {
        return Math.random() * 2 - 1;
      };
      dx = this.internal_options.maxRandomDistance * random();
      dy = this.internal_options.maxRandomDistance * random();
      Lat = parseFloat(this.args.lat) + (180 / Math.PI) * (dy / 6378137);
      Lng = parseFloat(this.args.lng) + (90 / Math.PI) * (dx / 6378137) / Math.cos(this.args.lat);
      return [Lat, Lng];
    };

    return Marker;

  })(Gmaps.Objects.BaseBuilder);

}).call(this);
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.Gmaps.Google.Builders.Polygon = (function(_super) {
    __extends(Polygon, _super);

    function Polygon(args, provider_options) {
      this.args = args;
      this.provider_options = provider_options != null ? provider_options : {};
      this.before_init();
      this.serviceObject = this.create_polygon();
      this.after_init();
    }

    Polygon.prototype.create_polygon = function() {
      return new (this.primitives().polygon)(this.polygon_options());
    };

    Polygon.prototype.polygon_options = function() {
      var base_options;
      base_options = {
        path: this._build_path()
      };
      return _.defaults(base_options, this.provider_options);
    };

    Polygon.prototype._build_path = function() {
      return _.map(this.args, (function(_this) {
        return function(arg) {
          return new (_this.primitives().latLng)(arg.lat, arg.lng);
        };
      })(this));
    };

    return Polygon;

  })(Gmaps.Objects.BaseBuilder);

}).call(this);
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.Gmaps.Google.Builders.Polyline = (function(_super) {
    __extends(Polyline, _super);

    function Polyline(args, provider_options) {
      this.args = args;
      this.provider_options = provider_options != null ? provider_options : {};
      this.before_init();
      this.serviceObject = this.create_polyline();
      this.after_init();
    }

    Polyline.prototype.create_polyline = function() {
      return new (this.primitives().polyline)(this.polyline_options());
    };

    Polyline.prototype.polyline_options = function() {
      var base_options;
      base_options = {
        path: this._build_path()
      };
      return _.defaults(base_options, this.provider_options);
    };

    Polyline.prototype._build_path = function() {
      return _.map(this.args, (function(_this) {
        return function(arg) {
          return new (_this.primitives().latLng)(arg.lat, arg.lng);
        };
      })(this));
    };

    return Polyline;

  })(Gmaps.Objects.BaseBuilder);

}).call(this);
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.Gmaps.Google.Objects.Bound = (function(_super) {
    __extends(Bound, _super);

    Bound.include(Gmaps.Google.Objects.Common);

    function Bound(serviceObject) {
      this.serviceObject = serviceObject;
    }

    Bound.prototype.extendWith = function(array_or_object) {
      var collection;
      collection = _.isArray(array_or_object) ? array_or_object : [array_or_object];
      return _.each(collection, (function(_this) {
        return function(object) {
          return object.updateBounds(_this);
        };
      })(this));
    };

    Bound.prototype.extend = function(value) {
      return this.getServiceObject().extend(this.primitives().latLngFromPosition(value));
    };

    return Bound;

  })(Gmaps.Base);

}).call(this);
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.Gmaps.Google.Objects.Circle = (function(_super) {
    __extends(Circle, _super);

    Circle.include(Gmaps.Google.Objects.Common);

    function Circle(serviceObject) {
      this.serviceObject = serviceObject;
    }

    Circle.prototype.updateBounds = function(bounds) {
      bounds.extend(this.getServiceObject().getBounds().getNorthEast());
      return bounds.extend(this.getServiceObject().getBounds().getSouthWest());
    };

    return Circle;

  })(Gmaps.Base);

}).call(this);
(function() {
  this.Gmaps.Google.Objects.Clusterer = (function() {
    function Clusterer(serviceObject) {
      this.serviceObject = serviceObject;
    }

    Clusterer.prototype.addMarkers = function(markers) {
      return _.each(markers, (function(_this) {
        return function(marker) {
          return _this.addMarker(marker);
        };
      })(this));
    };

    Clusterer.prototype.addMarker = function(marker) {
      return this.getServiceObject().addMarker(marker.getServiceObject());
    };

    Clusterer.prototype.clear = function() {
      return this.getServiceObject().clearMarkers();
    };

    Clusterer.prototype.removeMarker = function(marker) {
      return this.getServiceObject().removeMarker(marker.getServiceObject());
    };

    Clusterer.prototype.getServiceObject = function() {
      return this.serviceObject;
    };

    return Clusterer;

  })();

}).call(this);
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.Gmaps.Google.Objects.Kml = (function(_super) {
    __extends(Kml, _super);

    function Kml(serviceObject) {
      this.serviceObject = serviceObject;
    }

    Kml.prototype.updateBounds = function(bounds) {};

    Kml.prototype.setMap = function(map) {
      return this.getServiceObject().setMap(map);
    };

    Kml.prototype.getServiceObject = function() {
      return this.serviceObject;
    };

    Kml.prototype.primitives = function() {
      return this.constructor.PRIMITIVES;
    };

    return Kml;

  })(Gmaps.Base);

}).call(this);
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.Gmaps.Google.Objects.Map = (function(_super) {
    __extends(Map, _super);

    function Map(serviceObject) {
      this.serviceObject = serviceObject;
    }

    Map.prototype.getServiceObject = function() {
      return this.serviceObject;
    };

    Map.prototype.centerOn = function(position) {
      return this.getServiceObject().setCenter(this.primitives().latLngFromPosition(position));
    };

    Map.prototype.fitToBounds = function(boundsObject) {
      if (!boundsObject.isEmpty()) {
        return this.getServiceObject().fitBounds(boundsObject);
      }
    };

    Map.prototype.primitives = function() {
      return this.constructor.PRIMITIVES;
    };

    return Map;

  })(Gmaps.Base);

}).call(this);
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.Gmaps.Google.Objects.Marker = (function(_super) {
    __extends(Marker, _super);

    Marker.include(Gmaps.Google.Objects.Common);

    function Marker(serviceObject) {
      this.serviceObject = serviceObject;
    }

    Marker.prototype.updateBounds = function(bounds) {
      return bounds.extend(this.getServiceObject().position);
    };

    Marker.prototype.panTo = function() {
      return this.getServiceObject().getMap().panTo(this.getServiceObject().getPosition());
    };

    return Marker;

  })(Gmaps.Base);

}).call(this);
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.Gmaps.Google.Objects.Polygon = (function(_super) {
    __extends(Polygon, _super);

    Polygon.include(Gmaps.Google.Objects.Common);

    function Polygon(serviceObject) {
      this.serviceObject = serviceObject;
    }

    Polygon.prototype.updateBounds = function(bounds) {
      var ll, _i, _len, _ref, _results;
      _ref = this.serviceObject.getPath().getArray();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        ll = _ref[_i];
        _results.push(bounds.extend(ll));
      }
      return _results;
    };

    return Polygon;

  })(Gmaps.Base);

}).call(this);
(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  this.Gmaps.Google.Objects.Polyline = (function(_super) {
    __extends(Polyline, _super);

    Polyline.include(Gmaps.Google.Objects.Common);

    function Polyline(serviceObject) {
      this.serviceObject = serviceObject;
    }

    Polyline.prototype.updateBounds = function(bounds) {
      var ll, _i, _len, _ref, _results;
      _ref = this.serviceObject.getPath().getArray();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        ll = _ref[_i];
        _results.push(bounds.extend(ll));
      }
      return _results;
    };

    return Polyline;

  })(Gmaps.Base);

}).call(this);
(function() {
  this.Gmaps.Google.Primitives = function() {
    var factory;
    factory = {
      point: google.maps.Point,
      size: google.maps.Size,
      circle: google.maps.Circle,
      latLng: google.maps.LatLng,
      latLngBounds: google.maps.LatLngBounds,
      map: google.maps.Map,
      mapTypez: google.maps.MapTypeId,
      markerImage: google.maps.MarkerImage,
      marker: google.maps.Marker,
      infowindow: google.maps.InfoWindow,
      listener: google.maps.event.addListener,
      clusterer: MarkerClusterer,
      listenerOnce: google.maps.event.addListenerOnce,
      polyline: google.maps.Polyline,
      polygon: google.maps.Polygon,
      kml: google.maps.KmlLayer,
      addListener: function(object, event_name, fn) {
        return factory.listener(object, event_name, fn);
      },
      addListenerOnce: function(object, event_name, fn) {
        return factory.listenerOnce(object, event_name, fn);
      },
      mapTypes: function(type) {
        return factory.mapTypez[type];
      },
      latLngFromPosition: function(position) {
        if (_.isArray(position)) {
          return new factory.latLng(position[0], position[1]);
        } else {
          if (_.isNumber(position.lat) && _.isNumber(position.lng)) {
            return new factory.latLng(position.lat, position.lng);
          } else {
            if (_.isFunction(position.getServiceObject)) {
              return position.getServiceObject().getPosition();
            } else {
              return position;
            }
          }
        }
      }
    };
    return factory;
  };

}).call(this);
(function() {


}).call(this);
/*!
 * jQuery JavaScript Library v1.11.0
 * http://jquery.com/
 *
 * Includes Sizzle.js
 * http://sizzlejs.com/
 *
 * Copyright 2005, 2014 jQuery Foundation, Inc. and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2014-01-23T21:02Z
 */


(function( global, factory ) {

	if ( typeof module === "object" && typeof module.exports === "object" ) {
		// For CommonJS and CommonJS-like environments where a proper window is present,
		// execute the factory and get jQuery
		// For environments that do not inherently posses a window with a document
		// (such as Node.js), expose a jQuery-making factory as module.exports
		// This accentuates the need for the creation of a real window
		// e.g. var jQuery = require("jquery")(window);
		// See ticket #14549 for more info
		module.exports = global.document ?
			factory( global, true ) :
			function( w ) {
				if ( !w.document ) {
					throw new Error( "jQuery requires a window with a document" );
				}
				return factory( w );
			};
	} else {
		factory( global );
	}

// Pass this if window is not defined yet
}(typeof window !== "undefined" ? window : this, function( window, noGlobal ) {

// Can't do this because several apps including ASP.NET trace
// the stack via arguments.caller.callee and Firefox dies if
// you try to trace through "use strict" call chains. (#13335)
// Support: Firefox 18+
//

var deletedIds = [];

var slice = deletedIds.slice;

var concat = deletedIds.concat;

var push = deletedIds.push;

var indexOf = deletedIds.indexOf;

var class2type = {};

var toString = class2type.toString;

var hasOwn = class2type.hasOwnProperty;

var trim = "".trim;

var support = {};



var
	version = "1.11.0",

	// Define a local copy of jQuery
	jQuery = function( selector, context ) {
		// The jQuery object is actually just the init constructor 'enhanced'
		// Need init if jQuery is called (just allow error to be thrown if not included)
		return new jQuery.fn.init( selector, context );
	},

	// Make sure we trim BOM and NBSP (here's looking at you, Safari 5.0 and IE)
	rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,

	// Matches dashed string for camelizing
	rmsPrefix = /^-ms-/,
	rdashAlpha = /-([\da-z])/gi,

	// Used by jQuery.camelCase as callback to replace()
	fcamelCase = function( all, letter ) {
		return letter.toUpperCase();
	};

jQuery.fn = jQuery.prototype = {
	// The current version of jQuery being used
	jquery: version,

	constructor: jQuery,

	// Start with an empty selector
	selector: "",

	// The default length of a jQuery object is 0
	length: 0,

	toArray: function() {
		return slice.call( this );
	},

	// Get the Nth element in the matched element set OR
	// Get the whole matched element set as a clean array
	get: function( num ) {
		return num != null ?

			// Return a 'clean' array
			( num < 0 ? this[ num + this.length ] : this[ num ] ) :

			// Return just the object
			slice.call( this );
	},

	// Take an array of elements and push it onto the stack
	// (returning the new matched element set)
	pushStack: function( elems ) {

		// Build a new jQuery matched element set
		var ret = jQuery.merge( this.constructor(), elems );

		// Add the old object onto the stack (as a reference)
		ret.prevObject = this;
		ret.context = this.context;

		// Return the newly-formed element set
		return ret;
	},

	// Execute a callback for every element in the matched set.
	// (You can seed the arguments with an array of args, but this is
	// only used internally.)
	each: function( callback, args ) {
		return jQuery.each( this, callback, args );
	},

	map: function( callback ) {
		return this.pushStack( jQuery.map(this, function( elem, i ) {
			return callback.call( elem, i, elem );
		}));
	},

	slice: function() {
		return this.pushStack( slice.apply( this, arguments ) );
	},

	first: function() {
		return this.eq( 0 );
	},

	last: function() {
		return this.eq( -1 );
	},

	eq: function( i ) {
		var len = this.length,
			j = +i + ( i < 0 ? len : 0 );
		return this.pushStack( j >= 0 && j < len ? [ this[j] ] : [] );
	},

	end: function() {
		return this.prevObject || this.constructor(null);
	},

	// For internal use only.
	// Behaves like an Array's method, not like a jQuery method.
	push: push,
	sort: deletedIds.sort,
	splice: deletedIds.splice
};

jQuery.extend = jQuery.fn.extend = function() {
	var src, copyIsArray, copy, name, options, clone,
		target = arguments[0] || {},
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if ( typeof target === "boolean" ) {
		deep = target;

		// skip the boolean and the target
		target = arguments[ i ] || {};
		i++;
	}

	// Handle case when target is a string or something (possible in deep copy)
	if ( typeof target !== "object" && !jQuery.isFunction(target) ) {
		target = {};
	}

	// extend jQuery itself if only one argument is passed
	if ( i === length ) {
		target = this;
		i--;
	}

	for ( ; i < length; i++ ) {
		// Only deal with non-null/undefined values
		if ( (options = arguments[ i ]) != null ) {
			// Extend the base object
			for ( name in options ) {
				src = target[ name ];
				copy = options[ name ];

				// Prevent never-ending loop
				if ( target === copy ) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if ( deep && copy && ( jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)) ) ) {
					if ( copyIsArray ) {
						copyIsArray = false;
						clone = src && jQuery.isArray(src) ? src : [];

					} else {
						clone = src && jQuery.isPlainObject(src) ? src : {};
					}

					// Never move original objects, clone them
					target[ name ] = jQuery.extend( deep, clone, copy );

				// Don't bring in undefined values
				} else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};

jQuery.extend({
	// Unique for each copy of jQuery on the page
	expando: "jQuery" + ( version + Math.random() ).replace( /\D/g, "" ),

	// Assume jQuery is ready without the ready module
	isReady: true,

	error: function( msg ) {
		throw new Error( msg );
	},

	noop: function() {},

	// See test/unit/core.js for details concerning isFunction.
	// Since version 1.3, DOM methods and functions like alert
	// aren't supported. They return false on IE (#2968).
	isFunction: function( obj ) {
		return jQuery.type(obj) === "function";
	},

	isArray: Array.isArray || function( obj ) {
		return jQuery.type(obj) === "array";
	},

	isWindow: function( obj ) {
		/* jshint eqeqeq: false */
		return obj != null && obj == obj.window;
	},

	isNumeric: function( obj ) {
		// parseFloat NaNs numeric-cast false positives (null|true|false|"")
		// ...but misinterprets leading-number strings, particularly hex literals ("0x...")
		// subtraction forces infinities to NaN
		return obj - parseFloat( obj ) >= 0;
	},

	isEmptyObject: function( obj ) {
		var name;
		for ( name in obj ) {
			return false;
		}
		return true;
	},

	isPlainObject: function( obj ) {
		var key;

		// Must be an Object.
		// Because of IE, we also have to check the presence of the constructor property.
		// Make sure that DOM nodes and window objects don't pass through, as well
		if ( !obj || jQuery.type(obj) !== "object" || obj.nodeType || jQuery.isWindow( obj ) ) {
			return false;
		}

		try {
			// Not own constructor property must be Object
			if ( obj.constructor &&
				!hasOwn.call(obj, "constructor") &&
				!hasOwn.call(obj.constructor.prototype, "isPrototypeOf") ) {
				return false;
			}
		} catch ( e ) {
			// IE8,9 Will throw exceptions on certain host objects #9897
			return false;
		}

		// Support: IE<9
		// Handle iteration over inherited properties before own properties.
		if ( support.ownLast ) {
			for ( key in obj ) {
				return hasOwn.call( obj, key );
			}
		}

		// Own properties are enumerated firstly, so to speed up,
		// if last one is own, then all properties are own.
		for ( key in obj ) {}

		return key === undefined || hasOwn.call( obj, key );
	},

	type: function( obj ) {
		if ( obj == null ) {
			return obj + "";
		}
		return typeof obj === "object" || typeof obj === "function" ?
			class2type[ toString.call(obj) ] || "object" :
			typeof obj;
	},

	// Evaluates a script in a global context
	// Workarounds based on findings by Jim Driscoll
	// http://weblogs.java.net/blog/driscoll/archive/2009/09/08/eval-javascript-global-context
	globalEval: function( data ) {
		if ( data && jQuery.trim( data ) ) {
			// We use execScript on Internet Explorer
			// We use an anonymous function so that context is window
			// rather than jQuery in Firefox
			( window.execScript || function( data ) {
				window[ "eval" ].call( window, data );
			} )( data );
		}
	},

	// Convert dashed to camelCase; used by the css and data modules
	// Microsoft forgot to hump their vendor prefix (#9572)
	camelCase: function( string ) {
		return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
	},

	nodeName: function( elem, name ) {
		return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
	},

	// args is for internal usage only
	each: function( obj, callback, args ) {
		var value,
			i = 0,
			length = obj.length,
			isArray = isArraylike( obj );

		if ( args ) {
			if ( isArray ) {
				for ( ; i < length; i++ ) {
					value = callback.apply( obj[ i ], args );

					if ( value === false ) {
						break;
					}
				}
			} else {
				for ( i in obj ) {
					value = callback.apply( obj[ i ], args );

					if ( value === false ) {
						break;
					}
				}
			}

		// A special, fast, case for the most common use of each
		} else {
			if ( isArray ) {
				for ( ; i < length; i++ ) {
					value = callback.call( obj[ i ], i, obj[ i ] );

					if ( value === false ) {
						break;
					}
				}
			} else {
				for ( i in obj ) {
					value = callback.call( obj[ i ], i, obj[ i ] );

					if ( value === false ) {
						break;
					}
				}
			}
		}

		return obj;
	},

	// Use native String.trim function wherever possible
	trim: trim && !trim.call("\uFEFF\xA0") ?
		function( text ) {
			return text == null ?
				"" :
				trim.call( text );
		} :

		// Otherwise use our own trimming functionality
		function( text ) {
			return text == null ?
				"" :
				( text + "" ).replace( rtrim, "" );
		},

	// results is for internal usage only
	makeArray: function( arr, results ) {
		var ret = results || [];

		if ( arr != null ) {
			if ( isArraylike( Object(arr) ) ) {
				jQuery.merge( ret,
					typeof arr === "string" ?
					[ arr ] : arr
				);
			} else {
				push.call( ret, arr );
			}
		}

		return ret;
	},

	inArray: function( elem, arr, i ) {
		var len;

		if ( arr ) {
			if ( indexOf ) {
				return indexOf.call( arr, elem, i );
			}

			len = arr.length;
			i = i ? i < 0 ? Math.max( 0, len + i ) : i : 0;

			for ( ; i < len; i++ ) {
				// Skip accessing in sparse arrays
				if ( i in arr && arr[ i ] === elem ) {
					return i;
				}
			}
		}

		return -1;
	},

	merge: function( first, second ) {
		var len = +second.length,
			j = 0,
			i = first.length;

		while ( j < len ) {
			first[ i++ ] = second[ j++ ];
		}

		// Support: IE<9
		// Workaround casting of .length to NaN on otherwise arraylike objects (e.g., NodeLists)
		if ( len !== len ) {
			while ( second[j] !== undefined ) {
				first[ i++ ] = second[ j++ ];
			}
		}

		first.length = i;

		return first;
	},

	grep: function( elems, callback, invert ) {
		var callbackInverse,
			matches = [],
			i = 0,
			length = elems.length,
			callbackExpect = !invert;

		// Go through the array, only saving the items
		// that pass the validator function
		for ( ; i < length; i++ ) {
			callbackInverse = !callback( elems[ i ], i );
			if ( callbackInverse !== callbackExpect ) {
				matches.push( elems[ i ] );
			}
		}

		return matches;
	},

	// arg is for internal usage only
	map: function( elems, callback, arg ) {
		var value,
			i = 0,
			length = elems.length,
			isArray = isArraylike( elems ),
			ret = [];

		// Go through the array, translating each of the items to their new values
		if ( isArray ) {
			for ( ; i < length; i++ ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret.push( value );
				}
			}

		// Go through every key on the object,
		} else {
			for ( i in elems ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret.push( value );
				}
			}
		}

		// Flatten any nested arrays
		return concat.apply( [], ret );
	},

	// A global GUID counter for objects
	guid: 1,

	// Bind a function to a context, optionally partially applying any
	// arguments.
	proxy: function( fn, context ) {
		var args, proxy, tmp;

		if ( typeof context === "string" ) {
			tmp = fn[ context ];
			context = fn;
			fn = tmp;
		}

		// Quick check to determine if target is callable, in the spec
		// this throws a TypeError, but we will just return undefined.
		if ( !jQuery.isFunction( fn ) ) {
			return undefined;
		}

		// Simulated bind
		args = slice.call( arguments, 2 );
		proxy = function() {
			return fn.apply( context || this, args.concat( slice.call( arguments ) ) );
		};

		// Set the guid of unique handler to the same of original handler, so it can be removed
		proxy.guid = fn.guid = fn.guid || jQuery.guid++;

		return proxy;
	},

	now: function() {
		return +( new Date() );
	},

	// jQuery.support is not used in Core but other projects attach their
	// properties to it so it needs to exist.
	support: support
});

// Populate the class2type map
jQuery.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
	class2type[ "[object " + name + "]" ] = name.toLowerCase();
});

function isArraylike( obj ) {
	var length = obj.length,
		type = jQuery.type( obj );

	if ( type === "function" || jQuery.isWindow( obj ) ) {
		return false;
	}

	if ( obj.nodeType === 1 && length ) {
		return true;
	}

	return type === "array" || length === 0 ||
		typeof length === "number" && length > 0 && ( length - 1 ) in obj;
}
var Sizzle =
/*!
 * Sizzle CSS Selector Engine v1.10.16
 * http://sizzlejs.com/
 *
 * Copyright 2013 jQuery Foundation, Inc. and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2014-01-13
 */
(function( window ) {

var i,
	support,
	Expr,
	getText,
	isXML,
	compile,
	outermostContext,
	sortInput,
	hasDuplicate,

	// Local document vars
	setDocument,
	document,
	docElem,
	documentIsHTML,
	rbuggyQSA,
	rbuggyMatches,
	matches,
	contains,

	// Instance-specific data
	expando = "sizzle" + -(new Date()),
	preferredDoc = window.document,
	dirruns = 0,
	done = 0,
	classCache = createCache(),
	tokenCache = createCache(),
	compilerCache = createCache(),
	sortOrder = function( a, b ) {
		if ( a === b ) {
			hasDuplicate = true;
		}
		return 0;
	},

	// General-purpose constants
	strundefined = typeof undefined,
	MAX_NEGATIVE = 1 << 31,

	// Instance methods
	hasOwn = ({}).hasOwnProperty,
	arr = [],
	pop = arr.pop,
	push_native = arr.push,
	push = arr.push,
	slice = arr.slice,
	// Use a stripped-down indexOf if we can't use a native one
	indexOf = arr.indexOf || function( elem ) {
		var i = 0,
			len = this.length;
		for ( ; i < len; i++ ) {
			if ( this[i] === elem ) {
				return i;
			}
		}
		return -1;
	},

	booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",

	// Regular expressions

	// Whitespace characters http://www.w3.org/TR/css3-selectors/#whitespace
	whitespace = "[\\x20\\t\\r\\n\\f]",
	// http://www.w3.org/TR/css3-syntax/#characters
	characterEncoding = "(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",

	// Loosely modeled on CSS identifier characters
	// An unquoted value should be a CSS identifier http://www.w3.org/TR/css3-selectors/#attribute-selectors
	// Proper syntax: http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
	identifier = characterEncoding.replace( "w", "w#" ),

	// Acceptable operators http://www.w3.org/TR/selectors/#attribute-selectors
	attributes = "\\[" + whitespace + "*(" + characterEncoding + ")" + whitespace +
		"*(?:([*^$|!~]?=)" + whitespace + "*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|(" + identifier + ")|)|)" + whitespace + "*\\]",

	// Prefer arguments quoted,
	//   then not containing pseudos/brackets,
	//   then attribute selectors/non-parenthetical expressions,
	//   then anything else
	// These preferences are here to reduce the number of selectors
	//   needing tokenize in the PSEUDO preFilter
	pseudos = ":(" + characterEncoding + ")(?:\\(((['\"])((?:\\\\.|[^\\\\])*?)\\3|((?:\\\\.|[^\\\\()[\\]]|" + attributes.replace( 3, 8 ) + ")*)|.*)\\)|)",

	// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
	rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g" ),

	rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
	rcombinators = new RegExp( "^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*" ),

	rattributeQuotes = new RegExp( "=" + whitespace + "*([^\\]'\"]*?)" + whitespace + "*\\]", "g" ),

	rpseudo = new RegExp( pseudos ),
	ridentifier = new RegExp( "^" + identifier + "$" ),

	matchExpr = {
		"ID": new RegExp( "^#(" + characterEncoding + ")" ),
		"CLASS": new RegExp( "^\\.(" + characterEncoding + ")" ),
		"TAG": new RegExp( "^(" + characterEncoding.replace( "w", "w*" ) + ")" ),
		"ATTR": new RegExp( "^" + attributes ),
		"PSEUDO": new RegExp( "^" + pseudos ),
		"CHILD": new RegExp( "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace +
			"*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace +
			"*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
		"bool": new RegExp( "^(?:" + booleans + ")$", "i" ),
		// For use in libraries implementing .is()
		// We use this for POS matching in `select`
		"needsContext": new RegExp( "^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" +
			whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i" )
	},

	rinputs = /^(?:input|select|textarea|button)$/i,
	rheader = /^h\d$/i,

	rnative = /^[^{]+\{\s*\[native \w/,

	// Easily-parseable/retrievable ID or TAG or CLASS selectors
	rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,

	rsibling = /[+~]/,
	rescape = /'|\\/g,

	// CSS escapes http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
	runescape = new RegExp( "\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig" ),
	funescape = function( _, escaped, escapedWhitespace ) {
		var high = "0x" + escaped - 0x10000;
		// NaN means non-codepoint
		// Support: Firefox
		// Workaround erroneous numeric interpretation of +"0x"
		return high !== high || escapedWhitespace ?
			escaped :
			high < 0 ?
				// BMP codepoint
				String.fromCharCode( high + 0x10000 ) :
				// Supplemental Plane codepoint (surrogate pair)
				String.fromCharCode( high >> 10 | 0xD800, high & 0x3FF | 0xDC00 );
	};

// Optimize for push.apply( _, NodeList )
try {
	push.apply(
		(arr = slice.call( preferredDoc.childNodes )),
		preferredDoc.childNodes
	);
	// Support: Android<4.0
	// Detect silently failing push.apply
	arr[ preferredDoc.childNodes.length ].nodeType;
} catch ( e ) {
	push = { apply: arr.length ?

		// Leverage slice if possible
		function( target, els ) {
			push_native.apply( target, slice.call(els) );
		} :

		// Support: IE<9
		// Otherwise append directly
		function( target, els ) {
			var j = target.length,
				i = 0;
			// Can't trust NodeList.length
			while ( (target[j++] = els[i++]) ) {}
			target.length = j - 1;
		}
	};
}

function Sizzle( selector, context, results, seed ) {
	var match, elem, m, nodeType,
		// QSA vars
		i, groups, old, nid, newContext, newSelector;

	if ( ( context ? context.ownerDocument || context : preferredDoc ) !== document ) {
		setDocument( context );
	}

	context = context || document;
	results = results || [];

	if ( !selector || typeof selector !== "string" ) {
		return results;
	}

	if ( (nodeType = context.nodeType) !== 1 && nodeType !== 9 ) {
		return [];
	}

	if ( documentIsHTML && !seed ) {

		// Shortcuts
		if ( (match = rquickExpr.exec( selector )) ) {
			// Speed-up: Sizzle("#ID")
			if ( (m = match[1]) ) {
				if ( nodeType === 9 ) {
					elem = context.getElementById( m );
					// Check parentNode to catch when Blackberry 4.6 returns
					// nodes that are no longer in the document (jQuery #6963)
					if ( elem && elem.parentNode ) {
						// Handle the case where IE, Opera, and Webkit return items
						// by name instead of ID
						if ( elem.id === m ) {
							results.push( elem );
							return results;
						}
					} else {
						return results;
					}
				} else {
					// Context is not a document
					if ( context.ownerDocument && (elem = context.ownerDocument.getElementById( m )) &&
						contains( context, elem ) && elem.id === m ) {
						results.push( elem );
						return results;
					}
				}

			// Speed-up: Sizzle("TAG")
			} else if ( match[2] ) {
				push.apply( results, context.getElementsByTagName( selector ) );
				return results;

			// Speed-up: Sizzle(".CLASS")
			} else if ( (m = match[3]) && support.getElementsByClassName && context.getElementsByClassName ) {
				push.apply( results, context.getElementsByClassName( m ) );
				return results;
			}
		}

		// QSA path
		if ( support.qsa && (!rbuggyQSA || !rbuggyQSA.test( selector )) ) {
			nid = old = expando;
			newContext = context;
			newSelector = nodeType === 9 && selector;

			// qSA works strangely on Element-rooted queries
			// We can work around this by specifying an extra ID on the root
			// and working up from there (Thanks to Andrew Dupont for the technique)
			// IE 8 doesn't work on object elements
			if ( nodeType === 1 && context.nodeName.toLowerCase() !== "object" ) {
				groups = tokenize( selector );

				if ( (old = context.getAttribute("id")) ) {
					nid = old.replace( rescape, "\\$&" );
				} else {
					context.setAttribute( "id", nid );
				}
				nid = "[id='" + nid + "'] ";

				i = groups.length;
				while ( i-- ) {
					groups[i] = nid + toSelector( groups[i] );
				}
				newContext = rsibling.test( selector ) && testContext( context.parentNode ) || context;
				newSelector = groups.join(",");
			}

			if ( newSelector ) {
				try {
					push.apply( results,
						newContext.querySelectorAll( newSelector )
					);
					return results;
				} catch(qsaError) {
				} finally {
					if ( !old ) {
						context.removeAttribute("id");
					}
				}
			}
		}
	}

	// All others
	return select( selector.replace( rtrim, "$1" ), context, results, seed );
}

/**
 * Create key-value caches of limited size
 * @returns {Function(string, Object)} Returns the Object data after storing it on itself with
 *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
 *	deleting the oldest entry
 */
function createCache() {
	var keys = [];

	function cache( key, value ) {
		// Use (key + " ") to avoid collision with native prototype properties (see Issue #157)
		if ( keys.push( key + " " ) > Expr.cacheLength ) {
			// Only keep the most recent entries
			delete cache[ keys.shift() ];
		}
		return (cache[ key + " " ] = value);
	}
	return cache;
}

/**
 * Mark a function for special use by Sizzle
 * @param {Function} fn The function to mark
 */
function markFunction( fn ) {
	fn[ expando ] = true;
	return fn;
}

/**
 * Support testing using an element
 * @param {Function} fn Passed the created div and expects a boolean result
 */
function assert( fn ) {
	var div = document.createElement("div");

	try {
		return !!fn( div );
	} catch (e) {
		return false;
	} finally {
		// Remove from its parent by default
		if ( div.parentNode ) {
			div.parentNode.removeChild( div );
		}
		// release memory in IE
		div = null;
	}
}

/**
 * Adds the same handler for all of the specified attrs
 * @param {String} attrs Pipe-separated list of attributes
 * @param {Function} handler The method that will be applied
 */
function addHandle( attrs, handler ) {
	var arr = attrs.split("|"),
		i = attrs.length;

	while ( i-- ) {
		Expr.attrHandle[ arr[i] ] = handler;
	}
}

/**
 * Checks document order of two siblings
 * @param {Element} a
 * @param {Element} b
 * @returns {Number} Returns less than 0 if a precedes b, greater than 0 if a follows b
 */
function siblingCheck( a, b ) {
	var cur = b && a,
		diff = cur && a.nodeType === 1 && b.nodeType === 1 &&
			( ~b.sourceIndex || MAX_NEGATIVE ) -
			( ~a.sourceIndex || MAX_NEGATIVE );

	// Use IE sourceIndex if available on both nodes
	if ( diff ) {
		return diff;
	}

	// Check if b follows a
	if ( cur ) {
		while ( (cur = cur.nextSibling) ) {
			if ( cur === b ) {
				return -1;
			}
		}
	}

	return a ? 1 : -1;
}

/**
 * Returns a function to use in pseudos for input types
 * @param {String} type
 */
function createInputPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return name === "input" && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for buttons
 * @param {String} type
 */
function createButtonPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return (name === "input" || name === "button") && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for positionals
 * @param {Function} fn
 */
function createPositionalPseudo( fn ) {
	return markFunction(function( argument ) {
		argument = +argument;
		return markFunction(function( seed, matches ) {
			var j,
				matchIndexes = fn( [], seed.length, argument ),
				i = matchIndexes.length;

			// Match elements found at the specified indexes
			while ( i-- ) {
				if ( seed[ (j = matchIndexes[i]) ] ) {
					seed[j] = !(matches[j] = seed[j]);
				}
			}
		});
	});
}

/**
 * Checks a node for validity as a Sizzle context
 * @param {Element|Object=} context
 * @returns {Element|Object|Boolean} The input node if acceptable, otherwise a falsy value
 */
function testContext( context ) {
	return context && typeof context.getElementsByTagName !== strundefined && context;
}

// Expose support vars for convenience
support = Sizzle.support = {};

/**
 * Detects XML nodes
 * @param {Element|Object} elem An element or a document
 * @returns {Boolean} True iff elem is a non-HTML XML node
 */
isXML = Sizzle.isXML = function( elem ) {
	// documentElement is verified for cases where it doesn't yet exist
	// (such as loading iframes in IE - #4833)
	var documentElement = elem && (elem.ownerDocument || elem).documentElement;
	return documentElement ? documentElement.nodeName !== "HTML" : false;
};

/**
 * Sets document-related variables once based on the current document
 * @param {Element|Object} [doc] An element or document object to use to set the document
 * @returns {Object} Returns the current document
 */
setDocument = Sizzle.setDocument = function( node ) {
	var hasCompare,
		doc = node ? node.ownerDocument || node : preferredDoc,
		parent = doc.defaultView;

	// If no document and documentElement is available, return
	if ( doc === document || doc.nodeType !== 9 || !doc.documentElement ) {
		return document;
	}

	// Set our document
	document = doc;
	docElem = doc.documentElement;

	// Support tests
	documentIsHTML = !isXML( doc );

	// Support: IE>8
	// If iframe document is assigned to "document" variable and if iframe has been reloaded,
	// IE will throw "permission denied" error when accessing "document" variable, see jQuery #13936
	// IE6-8 do not support the defaultView property so parent will be undefined
	if ( parent && parent !== parent.top ) {
		// IE11 does not have attachEvent, so all must suffer
		if ( parent.addEventListener ) {
			parent.addEventListener( "unload", function() {
				setDocument();
			}, false );
		} else if ( parent.attachEvent ) {
			parent.attachEvent( "onunload", function() {
				setDocument();
			});
		}
	}

	/* Attributes
	---------------------------------------------------------------------- */

	// Support: IE<8
	// Verify that getAttribute really returns attributes and not properties (excepting IE8 booleans)
	support.attributes = assert(function( div ) {
		div.className = "i";
		return !div.getAttribute("className");
	});

	/* getElement(s)By*
	---------------------------------------------------------------------- */

	// Check if getElementsByTagName("*") returns only elements
	support.getElementsByTagName = assert(function( div ) {
		div.appendChild( doc.createComment("") );
		return !div.getElementsByTagName("*").length;
	});

	// Check if getElementsByClassName can be trusted
	support.getElementsByClassName = rnative.test( doc.getElementsByClassName ) && assert(function( div ) {
		div.innerHTML = "<div class='a'></div><div class='a i'></div>";

		// Support: Safari<4
		// Catch class over-caching
		div.firstChild.className = "i";
		// Support: Opera<10
		// Catch gEBCN failure to find non-leading classes
		return div.getElementsByClassName("i").length === 2;
	});

	// Support: IE<10
	// Check if getElementById returns elements by name
	// The broken getElementById methods don't pick up programatically-set names,
	// so use a roundabout getElementsByName test
	support.getById = assert(function( div ) {
		docElem.appendChild( div ).id = expando;
		return !doc.getElementsByName || !doc.getElementsByName( expando ).length;
	});

	// ID find and filter
	if ( support.getById ) {
		Expr.find["ID"] = function( id, context ) {
			if ( typeof context.getElementById !== strundefined && documentIsHTML ) {
				var m = context.getElementById( id );
				// Check parentNode to catch when Blackberry 4.6 returns
				// nodes that are no longer in the document #6963
				return m && m.parentNode ? [m] : [];
			}
		};
		Expr.filter["ID"] = function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				return elem.getAttribute("id") === attrId;
			};
		};
	} else {
		// Support: IE6/7
		// getElementById is not reliable as a find shortcut
		delete Expr.find["ID"];

		Expr.filter["ID"] =  function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				var node = typeof elem.getAttributeNode !== strundefined && elem.getAttributeNode("id");
				return node && node.value === attrId;
			};
		};
	}

	// Tag
	Expr.find["TAG"] = support.getElementsByTagName ?
		function( tag, context ) {
			if ( typeof context.getElementsByTagName !== strundefined ) {
				return context.getElementsByTagName( tag );
			}
		} :
		function( tag, context ) {
			var elem,
				tmp = [],
				i = 0,
				results = context.getElementsByTagName( tag );

			// Filter out possible comments
			if ( tag === "*" ) {
				while ( (elem = results[i++]) ) {
					if ( elem.nodeType === 1 ) {
						tmp.push( elem );
					}
				}

				return tmp;
			}
			return results;
		};

	// Class
	Expr.find["CLASS"] = support.getElementsByClassName && function( className, context ) {
		if ( typeof context.getElementsByClassName !== strundefined && documentIsHTML ) {
			return context.getElementsByClassName( className );
		}
	};

	/* QSA/matchesSelector
	---------------------------------------------------------------------- */

	// QSA and matchesSelector support

	// matchesSelector(:active) reports false when true (IE9/Opera 11.5)
	rbuggyMatches = [];

	// qSa(:focus) reports false when true (Chrome 21)
	// We allow this because of a bug in IE8/9 that throws an error
	// whenever `document.activeElement` is accessed on an iframe
	// So, we allow :focus to pass through QSA all the time to avoid the IE error
	// See http://bugs.jquery.com/ticket/13378
	rbuggyQSA = [];

	if ( (support.qsa = rnative.test( doc.querySelectorAll )) ) {
		// Build QSA regex
		// Regex strategy adopted from Diego Perini
		assert(function( div ) {
			// Select is set to empty string on purpose
			// This is to test IE's treatment of not explicitly
			// setting a boolean content attribute,
			// since its presence should be enough
			// http://bugs.jquery.com/ticket/12359
			div.innerHTML = "<select t=''><option selected=''></option></select>";

			// Support: IE8, Opera 10-12
			// Nothing should be selected when empty strings follow ^= or $= or *=
			if ( div.querySelectorAll("[t^='']").length ) {
				rbuggyQSA.push( "[*^$]=" + whitespace + "*(?:''|\"\")" );
			}

			// Support: IE8
			// Boolean attributes and "value" are not treated correctly
			if ( !div.querySelectorAll("[selected]").length ) {
				rbuggyQSA.push( "\\[" + whitespace + "*(?:value|" + booleans + ")" );
			}

			// Webkit/Opera - :checked should return selected option elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			// IE8 throws error here and will not see later tests
			if ( !div.querySelectorAll(":checked").length ) {
				rbuggyQSA.push(":checked");
			}
		});

		assert(function( div ) {
			// Support: Windows 8 Native Apps
			// The type and name attributes are restricted during .innerHTML assignment
			var input = doc.createElement("input");
			input.setAttribute( "type", "hidden" );
			div.appendChild( input ).setAttribute( "name", "D" );

			// Support: IE8
			// Enforce case-sensitivity of name attribute
			if ( div.querySelectorAll("[name=d]").length ) {
				rbuggyQSA.push( "name" + whitespace + "*[*^$|!~]?=" );
			}

			// FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
			// IE8 throws error here and will not see later tests
			if ( !div.querySelectorAll(":enabled").length ) {
				rbuggyQSA.push( ":enabled", ":disabled" );
			}

			// Opera 10-11 does not throw on post-comma invalid pseudos
			div.querySelectorAll("*,:x");
			rbuggyQSA.push(",.*:");
		});
	}

	if ( (support.matchesSelector = rnative.test( (matches = docElem.webkitMatchesSelector ||
		docElem.mozMatchesSelector ||
		docElem.oMatchesSelector ||
		docElem.msMatchesSelector) )) ) {

		assert(function( div ) {
			// Check to see if it's possible to do matchesSelector
			// on a disconnected node (IE 9)
			support.disconnectedMatch = matches.call( div, "div" );

			// This should fail with an exception
			// Gecko does not error, returns false instead
			matches.call( div, "[s!='']:x" );
			rbuggyMatches.push( "!=", pseudos );
		});
	}

	rbuggyQSA = rbuggyQSA.length && new RegExp( rbuggyQSA.join("|") );
	rbuggyMatches = rbuggyMatches.length && new RegExp( rbuggyMatches.join("|") );

	/* Contains
	---------------------------------------------------------------------- */
	hasCompare = rnative.test( docElem.compareDocumentPosition );

	// Element contains another
	// Purposefully does not implement inclusive descendent
	// As in, an element does not contain itself
	contains = hasCompare || rnative.test( docElem.contains ) ?
		function( a, b ) {
			var adown = a.nodeType === 9 ? a.documentElement : a,
				bup = b && b.parentNode;
			return a === bup || !!( bup && bup.nodeType === 1 && (
				adown.contains ?
					adown.contains( bup ) :
					a.compareDocumentPosition && a.compareDocumentPosition( bup ) & 16
			));
		} :
		function( a, b ) {
			if ( b ) {
				while ( (b = b.parentNode) ) {
					if ( b === a ) {
						return true;
					}
				}
			}
			return false;
		};

	/* Sorting
	---------------------------------------------------------------------- */

	// Document order sorting
	sortOrder = hasCompare ?
	function( a, b ) {

		// Flag for duplicate removal
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		// Sort on method existence if only one input has compareDocumentPosition
		var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
		if ( compare ) {
			return compare;
		}

		// Calculate position if both inputs belong to the same document
		compare = ( a.ownerDocument || a ) === ( b.ownerDocument || b ) ?
			a.compareDocumentPosition( b ) :

			// Otherwise we know they are disconnected
			1;

		// Disconnected nodes
		if ( compare & 1 ||
			(!support.sortDetached && b.compareDocumentPosition( a ) === compare) ) {

			// Choose the first element that is related to our preferred document
			if ( a === doc || a.ownerDocument === preferredDoc && contains(preferredDoc, a) ) {
				return -1;
			}
			if ( b === doc || b.ownerDocument === preferredDoc && contains(preferredDoc, b) ) {
				return 1;
			}

			// Maintain original order
			return sortInput ?
				( indexOf.call( sortInput, a ) - indexOf.call( sortInput, b ) ) :
				0;
		}

		return compare & 4 ? -1 : 1;
	} :
	function( a, b ) {
		// Exit early if the nodes are identical
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		var cur,
			i = 0,
			aup = a.parentNode,
			bup = b.parentNode,
			ap = [ a ],
			bp = [ b ];

		// Parentless nodes are either documents or disconnected
		if ( !aup || !bup ) {
			return a === doc ? -1 :
				b === doc ? 1 :
				aup ? -1 :
				bup ? 1 :
				sortInput ?
				( indexOf.call( sortInput, a ) - indexOf.call( sortInput, b ) ) :
				0;

		// If the nodes are siblings, we can do a quick check
		} else if ( aup === bup ) {
			return siblingCheck( a, b );
		}

		// Otherwise we need full lists of their ancestors for comparison
		cur = a;
		while ( (cur = cur.parentNode) ) {
			ap.unshift( cur );
		}
		cur = b;
		while ( (cur = cur.parentNode) ) {
			bp.unshift( cur );
		}

		// Walk down the tree looking for a discrepancy
		while ( ap[i] === bp[i] ) {
			i++;
		}

		return i ?
			// Do a sibling check if the nodes have a common ancestor
			siblingCheck( ap[i], bp[i] ) :

			// Otherwise nodes in our document sort first
			ap[i] === preferredDoc ? -1 :
			bp[i] === preferredDoc ? 1 :
			0;
	};

	return doc;
};

Sizzle.matches = function( expr, elements ) {
	return Sizzle( expr, null, null, elements );
};

Sizzle.matchesSelector = function( elem, expr ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	// Make sure that attribute selectors are quoted
	expr = expr.replace( rattributeQuotes, "='$1']" );

	if ( support.matchesSelector && documentIsHTML &&
		( !rbuggyMatches || !rbuggyMatches.test( expr ) ) &&
		( !rbuggyQSA     || !rbuggyQSA.test( expr ) ) ) {

		try {
			var ret = matches.call( elem, expr );

			// IE 9's matchesSelector returns false on disconnected nodes
			if ( ret || support.disconnectedMatch ||
					// As well, disconnected nodes are said to be in a document
					// fragment in IE 9
					elem.document && elem.document.nodeType !== 11 ) {
				return ret;
			}
		} catch(e) {}
	}

	return Sizzle( expr, document, null, [elem] ).length > 0;
};

Sizzle.contains = function( context, elem ) {
	// Set document vars if needed
	if ( ( context.ownerDocument || context ) !== document ) {
		setDocument( context );
	}
	return contains( context, elem );
};

Sizzle.attr = function( elem, name ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	var fn = Expr.attrHandle[ name.toLowerCase() ],
		// Don't get fooled by Object.prototype properties (jQuery #13807)
		val = fn && hasOwn.call( Expr.attrHandle, name.toLowerCase() ) ?
			fn( elem, name, !documentIsHTML ) :
			undefined;

	return val !== undefined ?
		val :
		support.attributes || !documentIsHTML ?
			elem.getAttribute( name ) :
			(val = elem.getAttributeNode(name)) && val.specified ?
				val.value :
				null;
};

Sizzle.error = function( msg ) {
	throw new Error( "Syntax error, unrecognized expression: " + msg );
};

/**
 * Document sorting and removing duplicates
 * @param {ArrayLike} results
 */
Sizzle.uniqueSort = function( results ) {
	var elem,
		duplicates = [],
		j = 0,
		i = 0;

	// Unless we *know* we can detect duplicates, assume their presence
	hasDuplicate = !support.detectDuplicates;
	sortInput = !support.sortStable && results.slice( 0 );
	results.sort( sortOrder );

	if ( hasDuplicate ) {
		while ( (elem = results[i++]) ) {
			if ( elem === results[ i ] ) {
				j = duplicates.push( i );
			}
		}
		while ( j-- ) {
			results.splice( duplicates[ j ], 1 );
		}
	}

	// Clear input after sorting to release objects
	// See https://github.com/jquery/sizzle/pull/225
	sortInput = null;

	return results;
};

/**
 * Utility function for retrieving the text value of an array of DOM nodes
 * @param {Array|Element} elem
 */
getText = Sizzle.getText = function( elem ) {
	var node,
		ret = "",
		i = 0,
		nodeType = elem.nodeType;

	if ( !nodeType ) {
		// If no nodeType, this is expected to be an array
		while ( (node = elem[i++]) ) {
			// Do not traverse comment nodes
			ret += getText( node );
		}
	} else if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
		// Use textContent for elements
		// innerText usage removed for consistency of new lines (jQuery #11153)
		if ( typeof elem.textContent === "string" ) {
			return elem.textContent;
		} else {
			// Traverse its children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				ret += getText( elem );
			}
		}
	} else if ( nodeType === 3 || nodeType === 4 ) {
		return elem.nodeValue;
	}
	// Do not include comment or processing instruction nodes

	return ret;
};

Expr = Sizzle.selectors = {

	// Can be adjusted by the user
	cacheLength: 50,

	createPseudo: markFunction,

	match: matchExpr,

	attrHandle: {},

	find: {},

	relative: {
		">": { dir: "parentNode", first: true },
		" ": { dir: "parentNode" },
		"+": { dir: "previousSibling", first: true },
		"~": { dir: "previousSibling" }
	},

	preFilter: {
		"ATTR": function( match ) {
			match[1] = match[1].replace( runescape, funescape );

			// Move the given value to match[3] whether quoted or unquoted
			match[3] = ( match[4] || match[5] || "" ).replace( runescape, funescape );

			if ( match[2] === "~=" ) {
				match[3] = " " + match[3] + " ";
			}

			return match.slice( 0, 4 );
		},

		"CHILD": function( match ) {
			/* matches from matchExpr["CHILD"]
				1 type (only|nth|...)
				2 what (child|of-type)
				3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
				4 xn-component of xn+y argument ([+-]?\d*n|)
				5 sign of xn-component
				6 x of xn-component
				7 sign of y-component
				8 y of y-component
			*/
			match[1] = match[1].toLowerCase();

			if ( match[1].slice( 0, 3 ) === "nth" ) {
				// nth-* requires argument
				if ( !match[3] ) {
					Sizzle.error( match[0] );
				}

				// numeric x and y parameters for Expr.filter.CHILD
				// remember that false/true cast respectively to 0/1
				match[4] = +( match[4] ? match[5] + (match[6] || 1) : 2 * ( match[3] === "even" || match[3] === "odd" ) );
				match[5] = +( ( match[7] + match[8] ) || match[3] === "odd" );

			// other types prohibit arguments
			} else if ( match[3] ) {
				Sizzle.error( match[0] );
			}

			return match;
		},

		"PSEUDO": function( match ) {
			var excess,
				unquoted = !match[5] && match[2];

			if ( matchExpr["CHILD"].test( match[0] ) ) {
				return null;
			}

			// Accept quoted arguments as-is
			if ( match[3] && match[4] !== undefined ) {
				match[2] = match[4];

			// Strip excess characters from unquoted arguments
			} else if ( unquoted && rpseudo.test( unquoted ) &&
				// Get excess from tokenize (recursively)
				(excess = tokenize( unquoted, true )) &&
				// advance to the next closing parenthesis
				(excess = unquoted.indexOf( ")", unquoted.length - excess ) - unquoted.length) ) {

				// excess is a negative index
				match[0] = match[0].slice( 0, excess );
				match[2] = unquoted.slice( 0, excess );
			}

			// Return only captures needed by the pseudo filter method (type and argument)
			return match.slice( 0, 3 );
		}
	},

	filter: {

		"TAG": function( nodeNameSelector ) {
			var nodeName = nodeNameSelector.replace( runescape, funescape ).toLowerCase();
			return nodeNameSelector === "*" ?
				function() { return true; } :
				function( elem ) {
					return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
				};
		},

		"CLASS": function( className ) {
			var pattern = classCache[ className + " " ];

			return pattern ||
				(pattern = new RegExp( "(^|" + whitespace + ")" + className + "(" + whitespace + "|$)" )) &&
				classCache( className, function( elem ) {
					return pattern.test( typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== strundefined && elem.getAttribute("class") || "" );
				});
		},

		"ATTR": function( name, operator, check ) {
			return function( elem ) {
				var result = Sizzle.attr( elem, name );

				if ( result == null ) {
					return operator === "!=";
				}
				if ( !operator ) {
					return true;
				}

				result += "";

				return operator === "=" ? result === check :
					operator === "!=" ? result !== check :
					operator === "^=" ? check && result.indexOf( check ) === 0 :
					operator === "*=" ? check && result.indexOf( check ) > -1 :
					operator === "$=" ? check && result.slice( -check.length ) === check :
					operator === "~=" ? ( " " + result + " " ).indexOf( check ) > -1 :
					operator === "|=" ? result === check || result.slice( 0, check.length + 1 ) === check + "-" :
					false;
			};
		},

		"CHILD": function( type, what, argument, first, last ) {
			var simple = type.slice( 0, 3 ) !== "nth",
				forward = type.slice( -4 ) !== "last",
				ofType = what === "of-type";

			return first === 1 && last === 0 ?

				// Shortcut for :nth-*(n)
				function( elem ) {
					return !!elem.parentNode;
				} :

				function( elem, context, xml ) {
					var cache, outerCache, node, diff, nodeIndex, start,
						dir = simple !== forward ? "nextSibling" : "previousSibling",
						parent = elem.parentNode,
						name = ofType && elem.nodeName.toLowerCase(),
						useCache = !xml && !ofType;

					if ( parent ) {

						// :(first|last|only)-(child|of-type)
						if ( simple ) {
							while ( dir ) {
								node = elem;
								while ( (node = node[ dir ]) ) {
									if ( ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1 ) {
										return false;
									}
								}
								// Reverse direction for :only-* (if we haven't yet done so)
								start = dir = type === "only" && !start && "nextSibling";
							}
							return true;
						}

						start = [ forward ? parent.firstChild : parent.lastChild ];

						// non-xml :nth-child(...) stores cache data on `parent`
						if ( forward && useCache ) {
							// Seek `elem` from a previously-cached index
							outerCache = parent[ expando ] || (parent[ expando ] = {});
							cache = outerCache[ type ] || [];
							nodeIndex = cache[0] === dirruns && cache[1];
							diff = cache[0] === dirruns && cache[2];
							node = nodeIndex && parent.childNodes[ nodeIndex ];

							while ( (node = ++nodeIndex && node && node[ dir ] ||

								// Fallback to seeking `elem` from the start
								(diff = nodeIndex = 0) || start.pop()) ) {

								// When found, cache indexes on `parent` and break
								if ( node.nodeType === 1 && ++diff && node === elem ) {
									outerCache[ type ] = [ dirruns, nodeIndex, diff ];
									break;
								}
							}

						// Use previously-cached element index if available
						} else if ( useCache && (cache = (elem[ expando ] || (elem[ expando ] = {}))[ type ]) && cache[0] === dirruns ) {
							diff = cache[1];

						// xml :nth-child(...) or :nth-last-child(...) or :nth(-last)?-of-type(...)
						} else {
							// Use the same loop as above to seek `elem` from the start
							while ( (node = ++nodeIndex && node && node[ dir ] ||
								(diff = nodeIndex = 0) || start.pop()) ) {

								if ( ( ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1 ) && ++diff ) {
									// Cache the index of each encountered element
									if ( useCache ) {
										(node[ expando ] || (node[ expando ] = {}))[ type ] = [ dirruns, diff ];
									}

									if ( node === elem ) {
										break;
									}
								}
							}
						}

						// Incorporate the offset, then check against cycle size
						diff -= last;
						return diff === first || ( diff % first === 0 && diff / first >= 0 );
					}
				};
		},

		"PSEUDO": function( pseudo, argument ) {
			// pseudo-class names are case-insensitive
			// http://www.w3.org/TR/selectors/#pseudo-classes
			// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
			// Remember that setFilters inherits from pseudos
			var args,
				fn = Expr.pseudos[ pseudo ] || Expr.setFilters[ pseudo.toLowerCase() ] ||
					Sizzle.error( "unsupported pseudo: " + pseudo );

			// The user may use createPseudo to indicate that
			// arguments are needed to create the filter function
			// just as Sizzle does
			if ( fn[ expando ] ) {
				return fn( argument );
			}

			// But maintain support for old signatures
			if ( fn.length > 1 ) {
				args = [ pseudo, pseudo, "", argument ];
				return Expr.setFilters.hasOwnProperty( pseudo.toLowerCase() ) ?
					markFunction(function( seed, matches ) {
						var idx,
							matched = fn( seed, argument ),
							i = matched.length;
						while ( i-- ) {
							idx = indexOf.call( seed, matched[i] );
							seed[ idx ] = !( matches[ idx ] = matched[i] );
						}
					}) :
					function( elem ) {
						return fn( elem, 0, args );
					};
			}

			return fn;
		}
	},

	pseudos: {
		// Potentially complex pseudos
		"not": markFunction(function( selector ) {
			// Trim the selector passed to compile
			// to avoid treating leading and trailing
			// spaces as combinators
			var input = [],
				results = [],
				matcher = compile( selector.replace( rtrim, "$1" ) );

			return matcher[ expando ] ?
				markFunction(function( seed, matches, context, xml ) {
					var elem,
						unmatched = matcher( seed, null, xml, [] ),
						i = seed.length;

					// Match elements unmatched by `matcher`
					while ( i-- ) {
						if ( (elem = unmatched[i]) ) {
							seed[i] = !(matches[i] = elem);
						}
					}
				}) :
				function( elem, context, xml ) {
					input[0] = elem;
					matcher( input, null, xml, results );
					return !results.pop();
				};
		}),

		"has": markFunction(function( selector ) {
			return function( elem ) {
				return Sizzle( selector, elem ).length > 0;
			};
		}),

		"contains": markFunction(function( text ) {
			return function( elem ) {
				return ( elem.textContent || elem.innerText || getText( elem ) ).indexOf( text ) > -1;
			};
		}),

		// "Whether an element is represented by a :lang() selector
		// is based solely on the element's language value
		// being equal to the identifier C,
		// or beginning with the identifier C immediately followed by "-".
		// The matching of C against the element's language value is performed case-insensitively.
		// The identifier C does not have to be a valid language name."
		// http://www.w3.org/TR/selectors/#lang-pseudo
		"lang": markFunction( function( lang ) {
			// lang value must be a valid identifier
			if ( !ridentifier.test(lang || "") ) {
				Sizzle.error( "unsupported lang: " + lang );
			}
			lang = lang.replace( runescape, funescape ).toLowerCase();
			return function( elem ) {
				var elemLang;
				do {
					if ( (elemLang = documentIsHTML ?
						elem.lang :
						elem.getAttribute("xml:lang") || elem.getAttribute("lang")) ) {

						elemLang = elemLang.toLowerCase();
						return elemLang === lang || elemLang.indexOf( lang + "-" ) === 0;
					}
				} while ( (elem = elem.parentNode) && elem.nodeType === 1 );
				return false;
			};
		}),

		// Miscellaneous
		"target": function( elem ) {
			var hash = window.location && window.location.hash;
			return hash && hash.slice( 1 ) === elem.id;
		},

		"root": function( elem ) {
			return elem === docElem;
		},

		"focus": function( elem ) {
			return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
		},

		// Boolean properties
		"enabled": function( elem ) {
			return elem.disabled === false;
		},

		"disabled": function( elem ) {
			return elem.disabled === true;
		},

		"checked": function( elem ) {
			// In CSS3, :checked should return both checked and selected elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			var nodeName = elem.nodeName.toLowerCase();
			return (nodeName === "input" && !!elem.checked) || (nodeName === "option" && !!elem.selected);
		},

		"selected": function( elem ) {
			// Accessing this property makes selected-by-default
			// options in Safari work properly
			if ( elem.parentNode ) {
				elem.parentNode.selectedIndex;
			}

			return elem.selected === true;
		},

		// Contents
		"empty": function( elem ) {
			// http://www.w3.org/TR/selectors/#empty-pseudo
			// :empty is negated by element (1) or content nodes (text: 3; cdata: 4; entity ref: 5),
			//   but not by others (comment: 8; processing instruction: 7; etc.)
			// nodeType < 6 works because attributes (2) do not appear as children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				if ( elem.nodeType < 6 ) {
					return false;
				}
			}
			return true;
		},

		"parent": function( elem ) {
			return !Expr.pseudos["empty"]( elem );
		},

		// Element/input types
		"header": function( elem ) {
			return rheader.test( elem.nodeName );
		},

		"input": function( elem ) {
			return rinputs.test( elem.nodeName );
		},

		"button": function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return name === "input" && elem.type === "button" || name === "button";
		},

		"text": function( elem ) {
			var attr;
			return elem.nodeName.toLowerCase() === "input" &&
				elem.type === "text" &&

				// Support: IE<8
				// New HTML5 attribute values (e.g., "search") appear with elem.type === "text"
				( (attr = elem.getAttribute("type")) == null || attr.toLowerCase() === "text" );
		},

		// Position-in-collection
		"first": createPositionalPseudo(function() {
			return [ 0 ];
		}),

		"last": createPositionalPseudo(function( matchIndexes, length ) {
			return [ length - 1 ];
		}),

		"eq": createPositionalPseudo(function( matchIndexes, length, argument ) {
			return [ argument < 0 ? argument + length : argument ];
		}),

		"even": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 0;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"odd": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 1;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"lt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; --i >= 0; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"gt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; ++i < length; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		})
	}
};

Expr.pseudos["nth"] = Expr.pseudos["eq"];

// Add button/input type pseudos
for ( i in { radio: true, checkbox: true, file: true, password: true, image: true } ) {
	Expr.pseudos[ i ] = createInputPseudo( i );
}
for ( i in { submit: true, reset: true } ) {
	Expr.pseudos[ i ] = createButtonPseudo( i );
}

// Easy API for creating new setFilters
function setFilters() {}
setFilters.prototype = Expr.filters = Expr.pseudos;
Expr.setFilters = new setFilters();

function tokenize( selector, parseOnly ) {
	var matched, match, tokens, type,
		soFar, groups, preFilters,
		cached = tokenCache[ selector + " " ];

	if ( cached ) {
		return parseOnly ? 0 : cached.slice( 0 );
	}

	soFar = selector;
	groups = [];
	preFilters = Expr.preFilter;

	while ( soFar ) {

		// Comma and first run
		if ( !matched || (match = rcomma.exec( soFar )) ) {
			if ( match ) {
				// Don't consume trailing commas as valid
				soFar = soFar.slice( match[0].length ) || soFar;
			}
			groups.push( (tokens = []) );
		}

		matched = false;

		// Combinators
		if ( (match = rcombinators.exec( soFar )) ) {
			matched = match.shift();
			tokens.push({
				value: matched,
				// Cast descendant combinators to space
				type: match[0].replace( rtrim, " " )
			});
			soFar = soFar.slice( matched.length );
		}

		// Filters
		for ( type in Expr.filter ) {
			if ( (match = matchExpr[ type ].exec( soFar )) && (!preFilters[ type ] ||
				(match = preFilters[ type ]( match ))) ) {
				matched = match.shift();
				tokens.push({
					value: matched,
					type: type,
					matches: match
				});
				soFar = soFar.slice( matched.length );
			}
		}

		if ( !matched ) {
			break;
		}
	}

	// Return the length of the invalid excess
	// if we're just parsing
	// Otherwise, throw an error or return tokens
	return parseOnly ?
		soFar.length :
		soFar ?
			Sizzle.error( selector ) :
			// Cache the tokens
			tokenCache( selector, groups ).slice( 0 );
}

function toSelector( tokens ) {
	var i = 0,
		len = tokens.length,
		selector = "";
	for ( ; i < len; i++ ) {
		selector += tokens[i].value;
	}
	return selector;
}

function addCombinator( matcher, combinator, base ) {
	var dir = combinator.dir,
		checkNonElements = base && dir === "parentNode",
		doneName = done++;

	return combinator.first ?
		// Check against closest ancestor/preceding element
		function( elem, context, xml ) {
			while ( (elem = elem[ dir ]) ) {
				if ( elem.nodeType === 1 || checkNonElements ) {
					return matcher( elem, context, xml );
				}
			}
		} :

		// Check against all ancestor/preceding elements
		function( elem, context, xml ) {
			var oldCache, outerCache,
				newCache = [ dirruns, doneName ];

			// We can't set arbitrary data on XML nodes, so they don't benefit from dir caching
			if ( xml ) {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						if ( matcher( elem, context, xml ) ) {
							return true;
						}
					}
				}
			} else {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						outerCache = elem[ expando ] || (elem[ expando ] = {});
						if ( (oldCache = outerCache[ dir ]) &&
							oldCache[ 0 ] === dirruns && oldCache[ 1 ] === doneName ) {

							// Assign to newCache so results back-propagate to previous elements
							return (newCache[ 2 ] = oldCache[ 2 ]);
						} else {
							// Reuse newcache so results back-propagate to previous elements
							outerCache[ dir ] = newCache;

							// A match means we're done; a fail means we have to keep checking
							if ( (newCache[ 2 ] = matcher( elem, context, xml )) ) {
								return true;
							}
						}
					}
				}
			}
		};
}

function elementMatcher( matchers ) {
	return matchers.length > 1 ?
		function( elem, context, xml ) {
			var i = matchers.length;
			while ( i-- ) {
				if ( !matchers[i]( elem, context, xml ) ) {
					return false;
				}
			}
			return true;
		} :
		matchers[0];
}

function condense( unmatched, map, filter, context, xml ) {
	var elem,
		newUnmatched = [],
		i = 0,
		len = unmatched.length,
		mapped = map != null;

	for ( ; i < len; i++ ) {
		if ( (elem = unmatched[i]) ) {
			if ( !filter || filter( elem, context, xml ) ) {
				newUnmatched.push( elem );
				if ( mapped ) {
					map.push( i );
				}
			}
		}
	}

	return newUnmatched;
}

function setMatcher( preFilter, selector, matcher, postFilter, postFinder, postSelector ) {
	if ( postFilter && !postFilter[ expando ] ) {
		postFilter = setMatcher( postFilter );
	}
	if ( postFinder && !postFinder[ expando ] ) {
		postFinder = setMatcher( postFinder, postSelector );
	}
	return markFunction(function( seed, results, context, xml ) {
		var temp, i, elem,
			preMap = [],
			postMap = [],
			preexisting = results.length,

			// Get initial elements from seed or context
			elems = seed || multipleContexts( selector || "*", context.nodeType ? [ context ] : context, [] ),

			// Prefilter to get matcher input, preserving a map for seed-results synchronization
			matcherIn = preFilter && ( seed || !selector ) ?
				condense( elems, preMap, preFilter, context, xml ) :
				elems,

			matcherOut = matcher ?
				// If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
				postFinder || ( seed ? preFilter : preexisting || postFilter ) ?

					// ...intermediate processing is necessary
					[] :

					// ...otherwise use results directly
					results :
				matcherIn;

		// Find primary matches
		if ( matcher ) {
			matcher( matcherIn, matcherOut, context, xml );
		}

		// Apply postFilter
		if ( postFilter ) {
			temp = condense( matcherOut, postMap );
			postFilter( temp, [], context, xml );

			// Un-match failing elements by moving them back to matcherIn
			i = temp.length;
			while ( i-- ) {
				if ( (elem = temp[i]) ) {
					matcherOut[ postMap[i] ] = !(matcherIn[ postMap[i] ] = elem);
				}
			}
		}

		if ( seed ) {
			if ( postFinder || preFilter ) {
				if ( postFinder ) {
					// Get the final matcherOut by condensing this intermediate into postFinder contexts
					temp = [];
					i = matcherOut.length;
					while ( i-- ) {
						if ( (elem = matcherOut[i]) ) {
							// Restore matcherIn since elem is not yet a final match
							temp.push( (matcherIn[i] = elem) );
						}
					}
					postFinder( null, (matcherOut = []), temp, xml );
				}

				// Move matched elements from seed to results to keep them synchronized
				i = matcherOut.length;
				while ( i-- ) {
					if ( (elem = matcherOut[i]) &&
						(temp = postFinder ? indexOf.call( seed, elem ) : preMap[i]) > -1 ) {

						seed[temp] = !(results[temp] = elem);
					}
				}
			}

		// Add elements to results, through postFinder if defined
		} else {
			matcherOut = condense(
				matcherOut === results ?
					matcherOut.splice( preexisting, matcherOut.length ) :
					matcherOut
			);
			if ( postFinder ) {
				postFinder( null, results, matcherOut, xml );
			} else {
				push.apply( results, matcherOut );
			}
		}
	});
}

function matcherFromTokens( tokens ) {
	var checkContext, matcher, j,
		len = tokens.length,
		leadingRelative = Expr.relative[ tokens[0].type ],
		implicitRelative = leadingRelative || Expr.relative[" "],
		i = leadingRelative ? 1 : 0,

		// The foundational matcher ensures that elements are reachable from top-level context(s)
		matchContext = addCombinator( function( elem ) {
			return elem === checkContext;
		}, implicitRelative, true ),
		matchAnyContext = addCombinator( function( elem ) {
			return indexOf.call( checkContext, elem ) > -1;
		}, implicitRelative, true ),
		matchers = [ function( elem, context, xml ) {
			return ( !leadingRelative && ( xml || context !== outermostContext ) ) || (
				(checkContext = context).nodeType ?
					matchContext( elem, context, xml ) :
					matchAnyContext( elem, context, xml ) );
		} ];

	for ( ; i < len; i++ ) {
		if ( (matcher = Expr.relative[ tokens[i].type ]) ) {
			matchers = [ addCombinator(elementMatcher( matchers ), matcher) ];
		} else {
			matcher = Expr.filter[ tokens[i].type ].apply( null, tokens[i].matches );

			// Return special upon seeing a positional matcher
			if ( matcher[ expando ] ) {
				// Find the next relative operator (if any) for proper handling
				j = ++i;
				for ( ; j < len; j++ ) {
					if ( Expr.relative[ tokens[j].type ] ) {
						break;
					}
				}
				return setMatcher(
					i > 1 && elementMatcher( matchers ),
					i > 1 && toSelector(
						// If the preceding token was a descendant combinator, insert an implicit any-element `*`
						tokens.slice( 0, i - 1 ).concat({ value: tokens[ i - 2 ].type === " " ? "*" : "" })
					).replace( rtrim, "$1" ),
					matcher,
					i < j && matcherFromTokens( tokens.slice( i, j ) ),
					j < len && matcherFromTokens( (tokens = tokens.slice( j )) ),
					j < len && toSelector( tokens )
				);
			}
			matchers.push( matcher );
		}
	}

	return elementMatcher( matchers );
}

function matcherFromGroupMatchers( elementMatchers, setMatchers ) {
	var bySet = setMatchers.length > 0,
		byElement = elementMatchers.length > 0,
		superMatcher = function( seed, context, xml, results, outermost ) {
			var elem, j, matcher,
				matchedCount = 0,
				i = "0",
				unmatched = seed && [],
				setMatched = [],
				contextBackup = outermostContext,
				// We must always have either seed elements or outermost context
				elems = seed || byElement && Expr.find["TAG"]( "*", outermost ),
				// Use integer dirruns iff this is the outermost matcher
				dirrunsUnique = (dirruns += contextBackup == null ? 1 : Math.random() || 0.1),
				len = elems.length;

			if ( outermost ) {
				outermostContext = context !== document && context;
			}

			// Add elements passing elementMatchers directly to results
			// Keep `i` a string if there are no elements so `matchedCount` will be "00" below
			// Support: IE<9, Safari
			// Tolerate NodeList properties (IE: "length"; Safari: <number>) matching elements by id
			for ( ; i !== len && (elem = elems[i]) != null; i++ ) {
				if ( byElement && elem ) {
					j = 0;
					while ( (matcher = elementMatchers[j++]) ) {
						if ( matcher( elem, context, xml ) ) {
							results.push( elem );
							break;
						}
					}
					if ( outermost ) {
						dirruns = dirrunsUnique;
					}
				}

				// Track unmatched elements for set filters
				if ( bySet ) {
					// They will have gone through all possible matchers
					if ( (elem = !matcher && elem) ) {
						matchedCount--;
					}

					// Lengthen the array for every element, matched or not
					if ( seed ) {
						unmatched.push( elem );
					}
				}
			}

			// Apply set filters to unmatched elements
			matchedCount += i;
			if ( bySet && i !== matchedCount ) {
				j = 0;
				while ( (matcher = setMatchers[j++]) ) {
					matcher( unmatched, setMatched, context, xml );
				}

				if ( seed ) {
					// Reintegrate element matches to eliminate the need for sorting
					if ( matchedCount > 0 ) {
						while ( i-- ) {
							if ( !(unmatched[i] || setMatched[i]) ) {
								setMatched[i] = pop.call( results );
							}
						}
					}

					// Discard index placeholder values to get only actual matches
					setMatched = condense( setMatched );
				}

				// Add matches to results
				push.apply( results, setMatched );

				// Seedless set matches succeeding multiple successful matchers stipulate sorting
				if ( outermost && !seed && setMatched.length > 0 &&
					( matchedCount + setMatchers.length ) > 1 ) {

					Sizzle.uniqueSort( results );
				}
			}

			// Override manipulation of globals by nested matchers
			if ( outermost ) {
				dirruns = dirrunsUnique;
				outermostContext = contextBackup;
			}

			return unmatched;
		};

	return bySet ?
		markFunction( superMatcher ) :
		superMatcher;
}

compile = Sizzle.compile = function( selector, group /* Internal Use Only */ ) {
	var i,
		setMatchers = [],
		elementMatchers = [],
		cached = compilerCache[ selector + " " ];

	if ( !cached ) {
		// Generate a function of recursive functions that can be used to check each element
		if ( !group ) {
			group = tokenize( selector );
		}
		i = group.length;
		while ( i-- ) {
			cached = matcherFromTokens( group[i] );
			if ( cached[ expando ] ) {
				setMatchers.push( cached );
			} else {
				elementMatchers.push( cached );
			}
		}

		// Cache the compiled function
		cached = compilerCache( selector, matcherFromGroupMatchers( elementMatchers, setMatchers ) );
	}
	return cached;
};

function multipleContexts( selector, contexts, results ) {
	var i = 0,
		len = contexts.length;
	for ( ; i < len; i++ ) {
		Sizzle( selector, contexts[i], results );
	}
	return results;
}

function select( selector, context, results, seed ) {
	var i, tokens, token, type, find,
		match = tokenize( selector );

	if ( !seed ) {
		// Try to minimize operations if there is only one group
		if ( match.length === 1 ) {

			// Take a shortcut and set the context if the root selector is an ID
			tokens = match[0] = match[0].slice( 0 );
			if ( tokens.length > 2 && (token = tokens[0]).type === "ID" &&
					support.getById && context.nodeType === 9 && documentIsHTML &&
					Expr.relative[ tokens[1].type ] ) {

				context = ( Expr.find["ID"]( token.matches[0].replace(runescape, funescape), context ) || [] )[0];
				if ( !context ) {
					return results;
				}
				selector = selector.slice( tokens.shift().value.length );
			}

			// Fetch a seed set for right-to-left matching
			i = matchExpr["needsContext"].test( selector ) ? 0 : tokens.length;
			while ( i-- ) {
				token = tokens[i];

				// Abort if we hit a combinator
				if ( Expr.relative[ (type = token.type) ] ) {
					break;
				}
				if ( (find = Expr.find[ type ]) ) {
					// Search, expanding context for leading sibling combinators
					if ( (seed = find(
						token.matches[0].replace( runescape, funescape ),
						rsibling.test( tokens[0].type ) && testContext( context.parentNode ) || context
					)) ) {

						// If seed is empty or no tokens remain, we can return early
						tokens.splice( i, 1 );
						selector = seed.length && toSelector( tokens );
						if ( !selector ) {
							push.apply( results, seed );
							return results;
						}

						break;
					}
				}
			}
		}
	}

	// Compile and execute a filtering function
	// Provide `match` to avoid retokenization if we modified the selector above
	compile( selector, match )(
		seed,
		context,
		!documentIsHTML,
		results,
		rsibling.test( selector ) && testContext( context.parentNode ) || context
	);
	return results;
}

// One-time assignments

// Sort stability
support.sortStable = expando.split("").sort( sortOrder ).join("") === expando;

// Support: Chrome<14
// Always assume duplicates if they aren't passed to the comparison function
support.detectDuplicates = !!hasDuplicate;

// Initialize against the default document
setDocument();

// Support: Webkit<537.32 - Safari 6.0.3/Chrome 25 (fixed in Chrome 27)
// Detached nodes confoundingly follow *each other*
support.sortDetached = assert(function( div1 ) {
	// Should return 1, but returns 4 (following)
	return div1.compareDocumentPosition( document.createElement("div") ) & 1;
});

// Support: IE<8
// Prevent attribute/property "interpolation"
// http://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
if ( !assert(function( div ) {
	div.innerHTML = "<a href='#'></a>";
	return div.firstChild.getAttribute("href") === "#" ;
}) ) {
	addHandle( "type|href|height|width", function( elem, name, isXML ) {
		if ( !isXML ) {
			return elem.getAttribute( name, name.toLowerCase() === "type" ? 1 : 2 );
		}
	});
}

// Support: IE<9
// Use defaultValue in place of getAttribute("value")
if ( !support.attributes || !assert(function( div ) {
	div.innerHTML = "<input/>";
	div.firstChild.setAttribute( "value", "" );
	return div.firstChild.getAttribute( "value" ) === "";
}) ) {
	addHandle( "value", function( elem, name, isXML ) {
		if ( !isXML && elem.nodeName.toLowerCase() === "input" ) {
			return elem.defaultValue;
		}
	});
}

// Support: IE<9
// Use getAttributeNode to fetch booleans when getAttribute lies
if ( !assert(function( div ) {
	return div.getAttribute("disabled") == null;
}) ) {
	addHandle( booleans, function( elem, name, isXML ) {
		var val;
		if ( !isXML ) {
			return elem[ name ] === true ? name.toLowerCase() :
					(val = elem.getAttributeNode( name )) && val.specified ?
					val.value :
				null;
		}
	});
}

return Sizzle;

})( window );



jQuery.find = Sizzle;
jQuery.expr = Sizzle.selectors;
jQuery.expr[":"] = jQuery.expr.pseudos;
jQuery.unique = Sizzle.uniqueSort;
jQuery.text = Sizzle.getText;
jQuery.isXMLDoc = Sizzle.isXML;
jQuery.contains = Sizzle.contains;



var rneedsContext = jQuery.expr.match.needsContext;

var rsingleTag = (/^<(\w+)\s*\/?>(?:<\/\1>|)$/);



var risSimple = /^.[^:#\[\.,]*$/;

// Implement the identical functionality for filter and not
function winnow( elements, qualifier, not ) {
	if ( jQuery.isFunction( qualifier ) ) {
		return jQuery.grep( elements, function( elem, i ) {
			/* jshint -W018 */
			return !!qualifier.call( elem, i, elem ) !== not;
		});

	}

	if ( qualifier.nodeType ) {
		return jQuery.grep( elements, function( elem ) {
			return ( elem === qualifier ) !== not;
		});

	}

	if ( typeof qualifier === "string" ) {
		if ( risSimple.test( qualifier ) ) {
			return jQuery.filter( qualifier, elements, not );
		}

		qualifier = jQuery.filter( qualifier, elements );
	}

	return jQuery.grep( elements, function( elem ) {
		return ( jQuery.inArray( elem, qualifier ) >= 0 ) !== not;
	});
}

jQuery.filter = function( expr, elems, not ) {
	var elem = elems[ 0 ];

	if ( not ) {
		expr = ":not(" + expr + ")";
	}

	return elems.length === 1 && elem.nodeType === 1 ?
		jQuery.find.matchesSelector( elem, expr ) ? [ elem ] : [] :
		jQuery.find.matches( expr, jQuery.grep( elems, function( elem ) {
			return elem.nodeType === 1;
		}));
};

jQuery.fn.extend({
	find: function( selector ) {
		var i,
			ret = [],
			self = this,
			len = self.length;

		if ( typeof selector !== "string" ) {
			return this.pushStack( jQuery( selector ).filter(function() {
				for ( i = 0; i < len; i++ ) {
					if ( jQuery.contains( self[ i ], this ) ) {
						return true;
					}
				}
			}) );
		}

		for ( i = 0; i < len; i++ ) {
			jQuery.find( selector, self[ i ], ret );
		}

		// Needed because $( selector, context ) becomes $( context ).find( selector )
		ret = this.pushStack( len > 1 ? jQuery.unique( ret ) : ret );
		ret.selector = this.selector ? this.selector + " " + selector : selector;
		return ret;
	},
	filter: function( selector ) {
		return this.pushStack( winnow(this, selector || [], false) );
	},
	not: function( selector ) {
		return this.pushStack( winnow(this, selector || [], true) );
	},
	is: function( selector ) {
		return !!winnow(
			this,

			// If this is a positional/relative selector, check membership in the returned set
			// so $("p:first").is("p:last") won't return true for a doc with two "p".
			typeof selector === "string" && rneedsContext.test( selector ) ?
				jQuery( selector ) :
				selector || [],
			false
		).length;
	}
});


// Initialize a jQuery object


// A central reference to the root jQuery(document)
var rootjQuery,

	// Use the correct document accordingly with window argument (sandbox)
	document = window.document,

	// A simple way to check for HTML strings
	// Prioritize #id over <tag> to avoid XSS via location.hash (#9521)
	// Strict HTML recognition (#11290: must start with <)
	rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,

	init = jQuery.fn.init = function( selector, context ) {
		var match, elem;

		// HANDLE: $(""), $(null), $(undefined), $(false)
		if ( !selector ) {
			return this;
		}

		// Handle HTML strings
		if ( typeof selector === "string" ) {
			if ( selector.charAt(0) === "<" && selector.charAt( selector.length - 1 ) === ">" && selector.length >= 3 ) {
				// Assume that strings that start and end with <> are HTML and skip the regex check
				match = [ null, selector, null ];

			} else {
				match = rquickExpr.exec( selector );
			}

			// Match html or make sure no context is specified for #id
			if ( match && (match[1] || !context) ) {

				// HANDLE: $(html) -> $(array)
				if ( match[1] ) {
					context = context instanceof jQuery ? context[0] : context;

					// scripts is true for back-compat
					// Intentionally let the error be thrown if parseHTML is not present
					jQuery.merge( this, jQuery.parseHTML(
						match[1],
						context && context.nodeType ? context.ownerDocument || context : document,
						true
					) );

					// HANDLE: $(html, props)
					if ( rsingleTag.test( match[1] ) && jQuery.isPlainObject( context ) ) {
						for ( match in context ) {
							// Properties of context are called as methods if possible
							if ( jQuery.isFunction( this[ match ] ) ) {
								this[ match ]( context[ match ] );

							// ...and otherwise set as attributes
							} else {
								this.attr( match, context[ match ] );
							}
						}
					}

					return this;

				// HANDLE: $(#id)
				} else {
					elem = document.getElementById( match[2] );

					// Check parentNode to catch when Blackberry 4.6 returns
					// nodes that are no longer in the document #6963
					if ( elem && elem.parentNode ) {
						// Handle the case where IE and Opera return items
						// by name instead of ID
						if ( elem.id !== match[2] ) {
							return rootjQuery.find( selector );
						}

						// Otherwise, we inject the element directly into the jQuery object
						this.length = 1;
						this[0] = elem;
					}

					this.context = document;
					this.selector = selector;
					return this;
				}

			// HANDLE: $(expr, $(...))
			} else if ( !context || context.jquery ) {
				return ( context || rootjQuery ).find( selector );

			// HANDLE: $(expr, context)
			// (which is just equivalent to: $(context).find(expr)
			} else {
				return this.constructor( context ).find( selector );
			}

		// HANDLE: $(DOMElement)
		} else if ( selector.nodeType ) {
			this.context = this[0] = selector;
			this.length = 1;
			return this;

		// HANDLE: $(function)
		// Shortcut for document ready
		} else if ( jQuery.isFunction( selector ) ) {
			return typeof rootjQuery.ready !== "undefined" ?
				rootjQuery.ready( selector ) :
				// Execute immediately if ready is not present
				selector( jQuery );
		}

		if ( selector.selector !== undefined ) {
			this.selector = selector.selector;
			this.context = selector.context;
		}

		return jQuery.makeArray( selector, this );
	};

// Give the init function the jQuery prototype for later instantiation
init.prototype = jQuery.fn;

// Initialize central reference
rootjQuery = jQuery( document );


var rparentsprev = /^(?:parents|prev(?:Until|All))/,
	// methods guaranteed to produce a unique set when starting from a unique set
	guaranteedUnique = {
		children: true,
		contents: true,
		next: true,
		prev: true
	};

jQuery.extend({
	dir: function( elem, dir, until ) {
		var matched = [],
			cur = elem[ dir ];

		while ( cur && cur.nodeType !== 9 && (until === undefined || cur.nodeType !== 1 || !jQuery( cur ).is( until )) ) {
			if ( cur.nodeType === 1 ) {
				matched.push( cur );
			}
			cur = cur[dir];
		}
		return matched;
	},

	sibling: function( n, elem ) {
		var r = [];

		for ( ; n; n = n.nextSibling ) {
			if ( n.nodeType === 1 && n !== elem ) {
				r.push( n );
			}
		}

		return r;
	}
});

jQuery.fn.extend({
	has: function( target ) {
		var i,
			targets = jQuery( target, this ),
			len = targets.length;

		return this.filter(function() {
			for ( i = 0; i < len; i++ ) {
				if ( jQuery.contains( this, targets[i] ) ) {
					return true;
				}
			}
		});
	},

	closest: function( selectors, context ) {
		var cur,
			i = 0,
			l = this.length,
			matched = [],
			pos = rneedsContext.test( selectors ) || typeof selectors !== "string" ?
				jQuery( selectors, context || this.context ) :
				0;

		for ( ; i < l; i++ ) {
			for ( cur = this[i]; cur && cur !== context; cur = cur.parentNode ) {
				// Always skip document fragments
				if ( cur.nodeType < 11 && (pos ?
					pos.index(cur) > -1 :

					// Don't pass non-elements to Sizzle
					cur.nodeType === 1 &&
						jQuery.find.matchesSelector(cur, selectors)) ) {

					matched.push( cur );
					break;
				}
			}
		}

		return this.pushStack( matched.length > 1 ? jQuery.unique( matched ) : matched );
	},

	// Determine the position of an element within
	// the matched set of elements
	index: function( elem ) {

		// No argument, return index in parent
		if ( !elem ) {
			return ( this[0] && this[0].parentNode ) ? this.first().prevAll().length : -1;
		}

		// index in selector
		if ( typeof elem === "string" ) {
			return jQuery.inArray( this[0], jQuery( elem ) );
		}

		// Locate the position of the desired element
		return jQuery.inArray(
			// If it receives a jQuery object, the first element is used
			elem.jquery ? elem[0] : elem, this );
	},

	add: function( selector, context ) {
		return this.pushStack(
			jQuery.unique(
				jQuery.merge( this.get(), jQuery( selector, context ) )
			)
		);
	},

	addBack: function( selector ) {
		return this.add( selector == null ?
			this.prevObject : this.prevObject.filter(selector)
		);
	}
});

function sibling( cur, dir ) {
	do {
		cur = cur[ dir ];
	} while ( cur && cur.nodeType !== 1 );

	return cur;
}

jQuery.each({
	parent: function( elem ) {
		var parent = elem.parentNode;
		return parent && parent.nodeType !== 11 ? parent : null;
	},
	parents: function( elem ) {
		return jQuery.dir( elem, "parentNode" );
	},
	parentsUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "parentNode", until );
	},
	next: function( elem ) {
		return sibling( elem, "nextSibling" );
	},
	prev: function( elem ) {
		return sibling( elem, "previousSibling" );
	},
	nextAll: function( elem ) {
		return jQuery.dir( elem, "nextSibling" );
	},
	prevAll: function( elem ) {
		return jQuery.dir( elem, "previousSibling" );
	},
	nextUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "nextSibling", until );
	},
	prevUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "previousSibling", until );
	},
	siblings: function( elem ) {
		return jQuery.sibling( ( elem.parentNode || {} ).firstChild, elem );
	},
	children: function( elem ) {
		return jQuery.sibling( elem.firstChild );
	},
	contents: function( elem ) {
		return jQuery.nodeName( elem, "iframe" ) ?
			elem.contentDocument || elem.contentWindow.document :
			jQuery.merge( [], elem.childNodes );
	}
}, function( name, fn ) {
	jQuery.fn[ name ] = function( until, selector ) {
		var ret = jQuery.map( this, fn, until );

		if ( name.slice( -5 ) !== "Until" ) {
			selector = until;
		}

		if ( selector && typeof selector === "string" ) {
			ret = jQuery.filter( selector, ret );
		}

		if ( this.length > 1 ) {
			// Remove duplicates
			if ( !guaranteedUnique[ name ] ) {
				ret = jQuery.unique( ret );
			}

			// Reverse order for parents* and prev-derivatives
			if ( rparentsprev.test( name ) ) {
				ret = ret.reverse();
			}
		}

		return this.pushStack( ret );
	};
});
var rnotwhite = (/\S+/g);



// String to Object options format cache
var optionsCache = {};

// Convert String-formatted options into Object-formatted ones and store in cache
function createOptions( options ) {
	var object = optionsCache[ options ] = {};
	jQuery.each( options.match( rnotwhite ) || [], function( _, flag ) {
		object[ flag ] = true;
	});
	return object;
}

/*
 * Create a callback list using the following parameters:
 *
 *	options: an optional list of space-separated options that will change how
 *			the callback list behaves or a more traditional option object
 *
 * By default a callback list will act like an event callback list and can be
 * "fired" multiple times.
 *
 * Possible options:
 *
 *	once:			will ensure the callback list can only be fired once (like a Deferred)
 *
 *	memory:			will keep track of previous values and will call any callback added
 *					after the list has been fired right away with the latest "memorized"
 *					values (like a Deferred)
 *
 *	unique:			will ensure a callback can only be added once (no duplicate in the list)
 *
 *	stopOnFalse:	interrupt callings when a callback returns false
 *
 */
jQuery.Callbacks = function( options ) {

	// Convert options from String-formatted to Object-formatted if needed
	// (we check in cache first)
	options = typeof options === "string" ?
		( optionsCache[ options ] || createOptions( options ) ) :
		jQuery.extend( {}, options );

	var // Flag to know if list is currently firing
		firing,
		// Last fire value (for non-forgettable lists)
		memory,
		// Flag to know if list was already fired
		fired,
		// End of the loop when firing
		firingLength,
		// Index of currently firing callback (modified by remove if needed)
		firingIndex,
		// First callback to fire (used internally by add and fireWith)
		firingStart,
		// Actual callback list
		list = [],
		// Stack of fire calls for repeatable lists
		stack = !options.once && [],
		// Fire callbacks
		fire = function( data ) {
			memory = options.memory && data;
			fired = true;
			firingIndex = firingStart || 0;
			firingStart = 0;
			firingLength = list.length;
			firing = true;
			for ( ; list && firingIndex < firingLength; firingIndex++ ) {
				if ( list[ firingIndex ].apply( data[ 0 ], data[ 1 ] ) === false && options.stopOnFalse ) {
					memory = false; // To prevent further calls using add
					break;
				}
			}
			firing = false;
			if ( list ) {
				if ( stack ) {
					if ( stack.length ) {
						fire( stack.shift() );
					}
				} else if ( memory ) {
					list = [];
				} else {
					self.disable();
				}
			}
		},
		// Actual Callbacks object
		self = {
			// Add a callback or a collection of callbacks to the list
			add: function() {
				if ( list ) {
					// First, we save the current length
					var start = list.length;
					(function add( args ) {
						jQuery.each( args, function( _, arg ) {
							var type = jQuery.type( arg );
							if ( type === "function" ) {
								if ( !options.unique || !self.has( arg ) ) {
									list.push( arg );
								}
							} else if ( arg && arg.length && type !== "string" ) {
								// Inspect recursively
								add( arg );
							}
						});
					})( arguments );
					// Do we need to add the callbacks to the
					// current firing batch?
					if ( firing ) {
						firingLength = list.length;
					// With memory, if we're not firing then
					// we should call right away
					} else if ( memory ) {
						firingStart = start;
						fire( memory );
					}
				}
				return this;
			},
			// Remove a callback from the list
			remove: function() {
				if ( list ) {
					jQuery.each( arguments, function( _, arg ) {
						var index;
						while ( ( index = jQuery.inArray( arg, list, index ) ) > -1 ) {
							list.splice( index, 1 );
							// Handle firing indexes
							if ( firing ) {
								if ( index <= firingLength ) {
									firingLength--;
								}
								if ( index <= firingIndex ) {
									firingIndex--;
								}
							}
						}
					});
				}
				return this;
			},
			// Check if a given callback is in the list.
			// If no argument is given, return whether or not list has callbacks attached.
			has: function( fn ) {
				return fn ? jQuery.inArray( fn, list ) > -1 : !!( list && list.length );
			},
			// Remove all callbacks from the list
			empty: function() {
				list = [];
				firingLength = 0;
				return this;
			},
			// Have the list do nothing anymore
			disable: function() {
				list = stack = memory = undefined;
				return this;
			},
			// Is it disabled?
			disabled: function() {
				return !list;
			},
			// Lock the list in its current state
			lock: function() {
				stack = undefined;
				if ( !memory ) {
					self.disable();
				}
				return this;
			},
			// Is it locked?
			locked: function() {
				return !stack;
			},
			// Call all callbacks with the given context and arguments
			fireWith: function( context, args ) {
				if ( list && ( !fired || stack ) ) {
					args = args || [];
					args = [ context, args.slice ? args.slice() : args ];
					if ( firing ) {
						stack.push( args );
					} else {
						fire( args );
					}
				}
				return this;
			},
			// Call all the callbacks with the given arguments
			fire: function() {
				self.fireWith( this, arguments );
				return this;
			},
			// To know if the callbacks have already been called at least once
			fired: function() {
				return !!fired;
			}
		};

	return self;
};


jQuery.extend({

	Deferred: function( func ) {
		var tuples = [
				// action, add listener, listener list, final state
				[ "resolve", "done", jQuery.Callbacks("once memory"), "resolved" ],
				[ "reject", "fail", jQuery.Callbacks("once memory"), "rejected" ],
				[ "notify", "progress", jQuery.Callbacks("memory") ]
			],
			state = "pending",
			promise = {
				state: function() {
					return state;
				},
				always: function() {
					deferred.done( arguments ).fail( arguments );
					return this;
				},
				then: function( /* fnDone, fnFail, fnProgress */ ) {
					var fns = arguments;
					return jQuery.Deferred(function( newDefer ) {
						jQuery.each( tuples, function( i, tuple ) {
							var fn = jQuery.isFunction( fns[ i ] ) && fns[ i ];
							// deferred[ done | fail | progress ] for forwarding actions to newDefer
							deferred[ tuple[1] ](function() {
								var returned = fn && fn.apply( this, arguments );
								if ( returned && jQuery.isFunction( returned.promise ) ) {
									returned.promise()
										.done( newDefer.resolve )
										.fail( newDefer.reject )
										.progress( newDefer.notify );
								} else {
									newDefer[ tuple[ 0 ] + "With" ]( this === promise ? newDefer.promise() : this, fn ? [ returned ] : arguments );
								}
							});
						});
						fns = null;
					}).promise();
				},
				// Get a promise for this deferred
				// If obj is provided, the promise aspect is added to the object
				promise: function( obj ) {
					return obj != null ? jQuery.extend( obj, promise ) : promise;
				}
			},
			deferred = {};

		// Keep pipe for back-compat
		promise.pipe = promise.then;

		// Add list-specific methods
		jQuery.each( tuples, function( i, tuple ) {
			var list = tuple[ 2 ],
				stateString = tuple[ 3 ];

			// promise[ done | fail | progress ] = list.add
			promise[ tuple[1] ] = list.add;

			// Handle state
			if ( stateString ) {
				list.add(function() {
					// state = [ resolved | rejected ]
					state = stateString;

				// [ reject_list | resolve_list ].disable; progress_list.lock
				}, tuples[ i ^ 1 ][ 2 ].disable, tuples[ 2 ][ 2 ].lock );
			}

			// deferred[ resolve | reject | notify ]
			deferred[ tuple[0] ] = function() {
				deferred[ tuple[0] + "With" ]( this === deferred ? promise : this, arguments );
				return this;
			};
			deferred[ tuple[0] + "With" ] = list.fireWith;
		});

		// Make the deferred a promise
		promise.promise( deferred );

		// Call given func if any
		if ( func ) {
			func.call( deferred, deferred );
		}

		// All done!
		return deferred;
	},

	// Deferred helper
	when: function( subordinate /* , ..., subordinateN */ ) {
		var i = 0,
			resolveValues = slice.call( arguments ),
			length = resolveValues.length,

			// the count of uncompleted subordinates
			remaining = length !== 1 || ( subordinate && jQuery.isFunction( subordinate.promise ) ) ? length : 0,

			// the master Deferred. If resolveValues consist of only a single Deferred, just use that.
			deferred = remaining === 1 ? subordinate : jQuery.Deferred(),

			// Update function for both resolve and progress values
			updateFunc = function( i, contexts, values ) {
				return function( value ) {
					contexts[ i ] = this;
					values[ i ] = arguments.length > 1 ? slice.call( arguments ) : value;
					if ( values === progressValues ) {
						deferred.notifyWith( contexts, values );

					} else if ( !(--remaining) ) {
						deferred.resolveWith( contexts, values );
					}
				};
			},

			progressValues, progressContexts, resolveContexts;

		// add listeners to Deferred subordinates; treat others as resolved
		if ( length > 1 ) {
			progressValues = new Array( length );
			progressContexts = new Array( length );
			resolveContexts = new Array( length );
			for ( ; i < length; i++ ) {
				if ( resolveValues[ i ] && jQuery.isFunction( resolveValues[ i ].promise ) ) {
					resolveValues[ i ].promise()
						.done( updateFunc( i, resolveContexts, resolveValues ) )
						.fail( deferred.reject )
						.progress( updateFunc( i, progressContexts, progressValues ) );
				} else {
					--remaining;
				}
			}
		}

		// if we're not waiting on anything, resolve the master
		if ( !remaining ) {
			deferred.resolveWith( resolveContexts, resolveValues );
		}

		return deferred.promise();
	}
});


// The deferred used on DOM ready
var readyList;

jQuery.fn.ready = function( fn ) {
	// Add the callback
	jQuery.ready.promise().done( fn );

	return this;
};

jQuery.extend({
	// Is the DOM ready to be used? Set to true once it occurs.
	isReady: false,

	// A counter to track how many items to wait for before
	// the ready event fires. See #6781
	readyWait: 1,

	// Hold (or release) the ready event
	holdReady: function( hold ) {
		if ( hold ) {
			jQuery.readyWait++;
		} else {
			jQuery.ready( true );
		}
	},

	// Handle when the DOM is ready
	ready: function( wait ) {

		// Abort if there are pending holds or we're already ready
		if ( wait === true ? --jQuery.readyWait : jQuery.isReady ) {
			return;
		}

		// Make sure body exists, at least, in case IE gets a little overzealous (ticket #5443).
		if ( !document.body ) {
			return setTimeout( jQuery.ready );
		}

		// Remember that the DOM is ready
		jQuery.isReady = true;

		// If a normal DOM Ready event fired, decrement, and wait if need be
		if ( wait !== true && --jQuery.readyWait > 0 ) {
			return;
		}

		// If there are functions bound, to execute
		readyList.resolveWith( document, [ jQuery ] );

		// Trigger any bound ready events
		if ( jQuery.fn.trigger ) {
			jQuery( document ).trigger("ready").off("ready");
		}
	}
});

/**
 * Clean-up method for dom ready events
 */
function detach() {
	if ( document.addEventListener ) {
		document.removeEventListener( "DOMContentLoaded", completed, false );
		window.removeEventListener( "load", completed, false );

	} else {
		document.detachEvent( "onreadystatechange", completed );
		window.detachEvent( "onload", completed );
	}
}

/**
 * The ready event handler and self cleanup method
 */
function completed() {
	// readyState === "complete" is good enough for us to call the dom ready in oldIE
	if ( document.addEventListener || event.type === "load" || document.readyState === "complete" ) {
		detach();
		jQuery.ready();
	}
}

jQuery.ready.promise = function( obj ) {
	if ( !readyList ) {

		readyList = jQuery.Deferred();

		// Catch cases where $(document).ready() is called after the browser event has already occurred.
		// we once tried to use readyState "interactive" here, but it caused issues like the one
		// discovered by ChrisS here: http://bugs.jquery.com/ticket/12282#comment:15
		if ( document.readyState === "complete" ) {
			// Handle it asynchronously to allow scripts the opportunity to delay ready
			setTimeout( jQuery.ready );

		// Standards-based browsers support DOMContentLoaded
		} else if ( document.addEventListener ) {
			// Use the handy event callback
			document.addEventListener( "DOMContentLoaded", completed, false );

			// A fallback to window.onload, that will always work
			window.addEventListener( "load", completed, false );

		// If IE event model is used
		} else {
			// Ensure firing before onload, maybe late but safe also for iframes
			document.attachEvent( "onreadystatechange", completed );

			// A fallback to window.onload, that will always work
			window.attachEvent( "onload", completed );

			// If IE and not a frame
			// continually check to see if the document is ready
			var top = false;

			try {
				top = window.frameElement == null && document.documentElement;
			} catch(e) {}

			if ( top && top.doScroll ) {
				(function doScrollCheck() {
					if ( !jQuery.isReady ) {

						try {
							// Use the trick by Diego Perini
							// http://javascript.nwbox.com/IEContentLoaded/
							top.doScroll("left");
						} catch(e) {
							return setTimeout( doScrollCheck, 50 );
						}

						// detach all dom ready events
						detach();

						// and execute any waiting functions
						jQuery.ready();
					}
				})();
			}
		}
	}
	return readyList.promise( obj );
};


var strundefined = typeof undefined;



// Support: IE<9
// Iteration over object's inherited properties before its own
var i;
for ( i in jQuery( support ) ) {
	break;
}
support.ownLast = i !== "0";

// Note: most support tests are defined in their respective modules.
// false until the test is run
support.inlineBlockNeedsLayout = false;

jQuery(function() {
	// We need to execute this one support test ASAP because we need to know
	// if body.style.zoom needs to be set.

	var container, div,
		body = document.getElementsByTagName("body")[0];

	if ( !body ) {
		// Return for frameset docs that don't have a body
		return;
	}

	// Setup
	container = document.createElement( "div" );
	container.style.cssText = "border:0;width:0;height:0;position:absolute;top:0;left:-9999px;margin-top:1px";

	div = document.createElement( "div" );
	body.appendChild( container ).appendChild( div );

	if ( typeof div.style.zoom !== strundefined ) {
		// Support: IE<8
		// Check if natively block-level elements act like inline-block
		// elements when setting their display to 'inline' and giving
		// them layout
		div.style.cssText = "border:0;margin:0;width:1px;padding:1px;display:inline;zoom:1";

		if ( (support.inlineBlockNeedsLayout = ( div.offsetWidth === 3 )) ) {
			// Prevent IE 6 from affecting layout for positioned elements #11048
			// Prevent IE from shrinking the body in IE 7 mode #12869
			// Support: IE<8
			body.style.zoom = 1;
		}
	}

	body.removeChild( container );

	// Null elements to avoid leaks in IE
	container = div = null;
});




(function() {
	var div = document.createElement( "div" );

	// Execute the test only if not already executed in another module.
	if (support.deleteExpando == null) {
		// Support: IE<9
		support.deleteExpando = true;
		try {
			delete div.test;
		} catch( e ) {
			support.deleteExpando = false;
		}
	}

	// Null elements to avoid leaks in IE.
	div = null;
})();


/**
 * Determines whether an object can have data
 */
jQuery.acceptData = function( elem ) {
	var noData = jQuery.noData[ (elem.nodeName + " ").toLowerCase() ],
		nodeType = +elem.nodeType || 1;

	// Do not set data on non-element DOM nodes because it will not be cleared (#8335).
	return nodeType !== 1 && nodeType !== 9 ?
		false :

		// Nodes accept data unless otherwise specified; rejection can be conditional
		!noData || noData !== true && elem.getAttribute("classid") === noData;
};


var rbrace = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,
	rmultiDash = /([A-Z])/g;

function dataAttr( elem, key, data ) {
	// If nothing was found internally, try to fetch any
	// data from the HTML5 data-* attribute
	if ( data === undefined && elem.nodeType === 1 ) {

		var name = "data-" + key.replace( rmultiDash, "-$1" ).toLowerCase();

		data = elem.getAttribute( name );

		if ( typeof data === "string" ) {
			try {
				data = data === "true" ? true :
					data === "false" ? false :
					data === "null" ? null :
					// Only convert to a number if it doesn't change the string
					+data + "" === data ? +data :
					rbrace.test( data ) ? jQuery.parseJSON( data ) :
					data;
			} catch( e ) {}

			// Make sure we set the data so it isn't changed later
			jQuery.data( elem, key, data );

		} else {
			data = undefined;
		}
	}

	return data;
}

// checks a cache object for emptiness
function isEmptyDataObject( obj ) {
	var name;
	for ( name in obj ) {

		// if the public data object is empty, the private is still empty
		if ( name === "data" && jQuery.isEmptyObject( obj[name] ) ) {
			continue;
		}
		if ( name !== "toJSON" ) {
			return false;
		}
	}

	return true;
}

function internalData( elem, name, data, pvt /* Internal Use Only */ ) {
	if ( !jQuery.acceptData( elem ) ) {
		return;
	}

	var ret, thisCache,
		internalKey = jQuery.expando,

		// We have to handle DOM nodes and JS objects differently because IE6-7
		// can't GC object references properly across the DOM-JS boundary
		isNode = elem.nodeType,

		// Only DOM nodes need the global jQuery cache; JS object data is
		// attached directly to the object so GC can occur automatically
		cache = isNode ? jQuery.cache : elem,

		// Only defining an ID for JS objects if its cache already exists allows
		// the code to shortcut on the same path as a DOM node with no cache
		id = isNode ? elem[ internalKey ] : elem[ internalKey ] && internalKey;

	// Avoid doing any more work than we need to when trying to get data on an
	// object that has no data at all
	if ( (!id || !cache[id] || (!pvt && !cache[id].data)) && data === undefined && typeof name === "string" ) {
		return;
	}

	if ( !id ) {
		// Only DOM nodes need a new unique ID for each element since their data
		// ends up in the global cache
		if ( isNode ) {
			id = elem[ internalKey ] = deletedIds.pop() || jQuery.guid++;
		} else {
			id = internalKey;
		}
	}

	if ( !cache[ id ] ) {
		// Avoid exposing jQuery metadata on plain JS objects when the object
		// is serialized using JSON.stringify
		cache[ id ] = isNode ? {} : { toJSON: jQuery.noop };
	}

	// An object can be passed to jQuery.data instead of a key/value pair; this gets
	// shallow copied over onto the existing cache
	if ( typeof name === "object" || typeof name === "function" ) {
		if ( pvt ) {
			cache[ id ] = jQuery.extend( cache[ id ], name );
		} else {
			cache[ id ].data = jQuery.extend( cache[ id ].data, name );
		}
	}

	thisCache = cache[ id ];

	// jQuery data() is stored in a separate object inside the object's internal data
	// cache in order to avoid key collisions between internal data and user-defined
	// data.
	if ( !pvt ) {
		if ( !thisCache.data ) {
			thisCache.data = {};
		}

		thisCache = thisCache.data;
	}

	if ( data !== undefined ) {
		thisCache[ jQuery.camelCase( name ) ] = data;
	}

	// Check for both converted-to-camel and non-converted data property names
	// If a data property was specified
	if ( typeof name === "string" ) {

		// First Try to find as-is property data
		ret = thisCache[ name ];

		// Test for null|undefined property data
		if ( ret == null ) {

			// Try to find the camelCased property
			ret = thisCache[ jQuery.camelCase( name ) ];
		}
	} else {
		ret = thisCache;
	}

	return ret;
}

function internalRemoveData( elem, name, pvt ) {
	if ( !jQuery.acceptData( elem ) ) {
		return;
	}

	var thisCache, i,
		isNode = elem.nodeType,

		// See jQuery.data for more information
		cache = isNode ? jQuery.cache : elem,
		id = isNode ? elem[ jQuery.expando ] : jQuery.expando;

	// If there is already no cache entry for this object, there is no
	// purpose in continuing
	if ( !cache[ id ] ) {
		return;
	}

	if ( name ) {

		thisCache = pvt ? cache[ id ] : cache[ id ].data;

		if ( thisCache ) {

			// Support array or space separated string names for data keys
			if ( !jQuery.isArray( name ) ) {

				// try the string as a key before any manipulation
				if ( name in thisCache ) {
					name = [ name ];
				} else {

					// split the camel cased version by spaces unless a key with the spaces exists
					name = jQuery.camelCase( name );
					if ( name in thisCache ) {
						name = [ name ];
					} else {
						name = name.split(" ");
					}
				}
			} else {
				// If "name" is an array of keys...
				// When data is initially created, via ("key", "val") signature,
				// keys will be converted to camelCase.
				// Since there is no way to tell _how_ a key was added, remove
				// both plain key and camelCase key. #12786
				// This will only penalize the array argument path.
				name = name.concat( jQuery.map( name, jQuery.camelCase ) );
			}

			i = name.length;
			while ( i-- ) {
				delete thisCache[ name[i] ];
			}

			// If there is no data left in the cache, we want to continue
			// and let the cache object itself get destroyed
			if ( pvt ? !isEmptyDataObject(thisCache) : !jQuery.isEmptyObject(thisCache) ) {
				return;
			}
		}
	}

	// See jQuery.data for more information
	if ( !pvt ) {
		delete cache[ id ].data;

		// Don't destroy the parent cache unless the internal data object
		// had been the only thing left in it
		if ( !isEmptyDataObject( cache[ id ] ) ) {
			return;
		}
	}

	// Destroy the cache
	if ( isNode ) {
		jQuery.cleanData( [ elem ], true );

	// Use delete when supported for expandos or `cache` is not a window per isWindow (#10080)
	/* jshint eqeqeq: false */
	} else if ( support.deleteExpando || cache != cache.window ) {
		/* jshint eqeqeq: true */
		delete cache[ id ];

	// When all else fails, null
	} else {
		cache[ id ] = null;
	}
}

jQuery.extend({
	cache: {},

	// The following elements (space-suffixed to avoid Object.prototype collisions)
	// throw uncatchable exceptions if you attempt to set expando properties
	noData: {
		"applet ": true,
		"embed ": true,
		// ...but Flash objects (which have this classid) *can* handle expandos
		"object ": "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"
	},

	hasData: function( elem ) {
		elem = elem.nodeType ? jQuery.cache[ elem[jQuery.expando] ] : elem[ jQuery.expando ];
		return !!elem && !isEmptyDataObject( elem );
	},

	data: function( elem, name, data ) {
		return internalData( elem, name, data );
	},

	removeData: function( elem, name ) {
		return internalRemoveData( elem, name );
	},

	// For internal use only.
	_data: function( elem, name, data ) {
		return internalData( elem, name, data, true );
	},

	_removeData: function( elem, name ) {
		return internalRemoveData( elem, name, true );
	}
});

jQuery.fn.extend({
	data: function( key, value ) {
		var i, name, data,
			elem = this[0],
			attrs = elem && elem.attributes;

		// Special expections of .data basically thwart jQuery.access,
		// so implement the relevant behavior ourselves

		// Gets all values
		if ( key === undefined ) {
			if ( this.length ) {
				data = jQuery.data( elem );

				if ( elem.nodeType === 1 && !jQuery._data( elem, "parsedAttrs" ) ) {
					i = attrs.length;
					while ( i-- ) {
						name = attrs[i].name;

						if ( name.indexOf("data-") === 0 ) {
							name = jQuery.camelCase( name.slice(5) );

							dataAttr( elem, name, data[ name ] );
						}
					}
					jQuery._data( elem, "parsedAttrs", true );
				}
			}

			return data;
		}

		// Sets multiple values
		if ( typeof key === "object" ) {
			return this.each(function() {
				jQuery.data( this, key );
			});
		}

		return arguments.length > 1 ?

			// Sets one value
			this.each(function() {
				jQuery.data( this, key, value );
			}) :

			// Gets one value
			// Try to fetch any internally stored data first
			elem ? dataAttr( elem, key, jQuery.data( elem, key ) ) : undefined;
	},

	removeData: function( key ) {
		return this.each(function() {
			jQuery.removeData( this, key );
		});
	}
});


jQuery.extend({
	queue: function( elem, type, data ) {
		var queue;

		if ( elem ) {
			type = ( type || "fx" ) + "queue";
			queue = jQuery._data( elem, type );

			// Speed up dequeue by getting out quickly if this is just a lookup
			if ( data ) {
				if ( !queue || jQuery.isArray(data) ) {
					queue = jQuery._data( elem, type, jQuery.makeArray(data) );
				} else {
					queue.push( data );
				}
			}
			return queue || [];
		}
	},

	dequeue: function( elem, type ) {
		type = type || "fx";

		var queue = jQuery.queue( elem, type ),
			startLength = queue.length,
			fn = queue.shift(),
			hooks = jQuery._queueHooks( elem, type ),
			next = function() {
				jQuery.dequeue( elem, type );
			};

		// If the fx queue is dequeued, always remove the progress sentinel
		if ( fn === "inprogress" ) {
			fn = queue.shift();
			startLength--;
		}

		if ( fn ) {

			// Add a progress sentinel to prevent the fx queue from being
			// automatically dequeued
			if ( type === "fx" ) {
				queue.unshift( "inprogress" );
			}

			// clear up the last queue stop function
			delete hooks.stop;
			fn.call( elem, next, hooks );
		}

		if ( !startLength && hooks ) {
			hooks.empty.fire();
		}
	},

	// not intended for public consumption - generates a queueHooks object, or returns the current one
	_queueHooks: function( elem, type ) {
		var key = type + "queueHooks";
		return jQuery._data( elem, key ) || jQuery._data( elem, key, {
			empty: jQuery.Callbacks("once memory").add(function() {
				jQuery._removeData( elem, type + "queue" );
				jQuery._removeData( elem, key );
			})
		});
	}
});

jQuery.fn.extend({
	queue: function( type, data ) {
		var setter = 2;

		if ( typeof type !== "string" ) {
			data = type;
			type = "fx";
			setter--;
		}

		if ( arguments.length < setter ) {
			return jQuery.queue( this[0], type );
		}

		return data === undefined ?
			this :
			this.each(function() {
				var queue = jQuery.queue( this, type, data );

				// ensure a hooks for this queue
				jQuery._queueHooks( this, type );

				if ( type === "fx" && queue[0] !== "inprogress" ) {
					jQuery.dequeue( this, type );
				}
			});
	},
	dequeue: function( type ) {
		return this.each(function() {
			jQuery.dequeue( this, type );
		});
	},
	clearQueue: function( type ) {
		return this.queue( type || "fx", [] );
	},
	// Get a promise resolved when queues of a certain type
	// are emptied (fx is the type by default)
	promise: function( type, obj ) {
		var tmp,
			count = 1,
			defer = jQuery.Deferred(),
			elements = this,
			i = this.length,
			resolve = function() {
				if ( !( --count ) ) {
					defer.resolveWith( elements, [ elements ] );
				}
			};

		if ( typeof type !== "string" ) {
			obj = type;
			type = undefined;
		}
		type = type || "fx";

		while ( i-- ) {
			tmp = jQuery._data( elements[ i ], type + "queueHooks" );
			if ( tmp && tmp.empty ) {
				count++;
				tmp.empty.add( resolve );
			}
		}
		resolve();
		return defer.promise( obj );
	}
});
var pnum = (/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/).source;

var cssExpand = [ "Top", "Right", "Bottom", "Left" ];

var isHidden = function( elem, el ) {
		// isHidden might be called from jQuery#filter function;
		// in that case, element will be second argument
		elem = el || elem;
		return jQuery.css( elem, "display" ) === "none" || !jQuery.contains( elem.ownerDocument, elem );
	};



// Multifunctional method to get and set values of a collection
// The value/s can optionally be executed if it's a function
var access = jQuery.access = function( elems, fn, key, value, chainable, emptyGet, raw ) {
	var i = 0,
		length = elems.length,
		bulk = key == null;

	// Sets many values
	if ( jQuery.type( key ) === "object" ) {
		chainable = true;
		for ( i in key ) {
			jQuery.access( elems, fn, i, key[i], true, emptyGet, raw );
		}

	// Sets one value
	} else if ( value !== undefined ) {
		chainable = true;

		if ( !jQuery.isFunction( value ) ) {
			raw = true;
		}

		if ( bulk ) {
			// Bulk operations run against the entire set
			if ( raw ) {
				fn.call( elems, value );
				fn = null;

			// ...except when executing function values
			} else {
				bulk = fn;
				fn = function( elem, key, value ) {
					return bulk.call( jQuery( elem ), value );
				};
			}
		}

		if ( fn ) {
			for ( ; i < length; i++ ) {
				fn( elems[i], key, raw ? value : value.call( elems[i], i, fn( elems[i], key ) ) );
			}
		}
	}

	return chainable ?
		elems :

		// Gets
		bulk ?
			fn.call( elems ) :
			length ? fn( elems[0], key ) : emptyGet;
};
var rcheckableType = (/^(?:checkbox|radio)$/i);



(function() {
	var fragment = document.createDocumentFragment(),
		div = document.createElement("div"),
		input = document.createElement("input");

	// Setup
	div.setAttribute( "className", "t" );
	div.innerHTML = "  <link/><table></table><a href='/a'>a</a>";

	// IE strips leading whitespace when .innerHTML is used
	support.leadingWhitespace = div.firstChild.nodeType === 3;

	// Make sure that tbody elements aren't automatically inserted
	// IE will insert them into empty tables
	support.tbody = !div.getElementsByTagName( "tbody" ).length;

	// Make sure that link elements get serialized correctly by innerHTML
	// This requires a wrapper element in IE
	support.htmlSerialize = !!div.getElementsByTagName( "link" ).length;

	// Makes sure cloning an html5 element does not cause problems
	// Where outerHTML is undefined, this still works
	support.html5Clone =
		document.createElement( "nav" ).cloneNode( true ).outerHTML !== "<:nav></:nav>";

	// Check if a disconnected checkbox will retain its checked
	// value of true after appended to the DOM (IE6/7)
	input.type = "checkbox";
	input.checked = true;
	fragment.appendChild( input );
	support.appendChecked = input.checked;

	// Make sure textarea (and checkbox) defaultValue is properly cloned
	// Support: IE6-IE11+
	div.innerHTML = "<textarea>x</textarea>";
	support.noCloneChecked = !!div.cloneNode( true ).lastChild.defaultValue;

	// #11217 - WebKit loses check when the name is after the checked attribute
	fragment.appendChild( div );
	div.innerHTML = "<input type='radio' checked='checked' name='t'/>";

	// Support: Safari 5.1, iOS 5.1, Android 4.x, Android 2.3
	// old WebKit doesn't clone checked state correctly in fragments
	support.checkClone = div.cloneNode( true ).cloneNode( true ).lastChild.checked;

	// Support: IE<9
	// Opera does not clone events (and typeof div.attachEvent === undefined).
	// IE9-10 clones events bound via attachEvent, but they don't trigger with .click()
	support.noCloneEvent = true;
	if ( div.attachEvent ) {
		div.attachEvent( "onclick", function() {
			support.noCloneEvent = false;
		});

		div.cloneNode( true ).click();
	}

	// Execute the test only if not already executed in another module.
	if (support.deleteExpando == null) {
		// Support: IE<9
		support.deleteExpando = true;
		try {
			delete div.test;
		} catch( e ) {
			support.deleteExpando = false;
		}
	}

	// Null elements to avoid leaks in IE.
	fragment = div = input = null;
})();


(function() {
	var i, eventName,
		div = document.createElement( "div" );

	// Support: IE<9 (lack submit/change bubble), Firefox 23+ (lack focusin event)
	for ( i in { submit: true, change: true, focusin: true }) {
		eventName = "on" + i;

		if ( !(support[ i + "Bubbles" ] = eventName in window) ) {
			// Beware of CSP restrictions (https://developer.mozilla.org/en/Security/CSP)
			div.setAttribute( eventName, "t" );
			support[ i + "Bubbles" ] = div.attributes[ eventName ].expando === false;
		}
	}

	// Null elements to avoid leaks in IE.
	div = null;
})();


var rformElems = /^(?:input|select|textarea)$/i,
	rkeyEvent = /^key/,
	rmouseEvent = /^(?:mouse|contextmenu)|click/,
	rfocusMorph = /^(?:focusinfocus|focusoutblur)$/,
	rtypenamespace = /^([^.]*)(?:\.(.+)|)$/;

function returnTrue() {
	return true;
}

function returnFalse() {
	return false;
}

function safeActiveElement() {
	try {
		return document.activeElement;
	} catch ( err ) { }
}

/*
 * Helper functions for managing events -- not part of the public interface.
 * Props to Dean Edwards' addEvent library for many of the ideas.
 */
jQuery.event = {

	global: {},

	add: function( elem, types, handler, data, selector ) {
		var tmp, events, t, handleObjIn,
			special, eventHandle, handleObj,
			handlers, type, namespaces, origType,
			elemData = jQuery._data( elem );

		// Don't attach events to noData or text/comment nodes (but allow plain objects)
		if ( !elemData ) {
			return;
		}

		// Caller can pass in an object of custom data in lieu of the handler
		if ( handler.handler ) {
			handleObjIn = handler;
			handler = handleObjIn.handler;
			selector = handleObjIn.selector;
		}

		// Make sure that the handler has a unique ID, used to find/remove it later
		if ( !handler.guid ) {
			handler.guid = jQuery.guid++;
		}

		// Init the element's event structure and main handler, if this is the first
		if ( !(events = elemData.events) ) {
			events = elemData.events = {};
		}
		if ( !(eventHandle = elemData.handle) ) {
			eventHandle = elemData.handle = function( e ) {
				// Discard the second event of a jQuery.event.trigger() and
				// when an event is called after a page has unloaded
				return typeof jQuery !== strundefined && (!e || jQuery.event.triggered !== e.type) ?
					jQuery.event.dispatch.apply( eventHandle.elem, arguments ) :
					undefined;
			};
			// Add elem as a property of the handle fn to prevent a memory leak with IE non-native events
			eventHandle.elem = elem;
		}

		// Handle multiple events separated by a space
		types = ( types || "" ).match( rnotwhite ) || [ "" ];
		t = types.length;
		while ( t-- ) {
			tmp = rtypenamespace.exec( types[t] ) || [];
			type = origType = tmp[1];
			namespaces = ( tmp[2] || "" ).split( "." ).sort();

			// There *must* be a type, no attaching namespace-only handlers
			if ( !type ) {
				continue;
			}

			// If event changes its type, use the special event handlers for the changed type
			special = jQuery.event.special[ type ] || {};

			// If selector defined, determine special event api type, otherwise given type
			type = ( selector ? special.delegateType : special.bindType ) || type;

			// Update special based on newly reset type
			special = jQuery.event.special[ type ] || {};

			// handleObj is passed to all event handlers
			handleObj = jQuery.extend({
				type: type,
				origType: origType,
				data: data,
				handler: handler,
				guid: handler.guid,
				selector: selector,
				needsContext: selector && jQuery.expr.match.needsContext.test( selector ),
				namespace: namespaces.join(".")
			}, handleObjIn );

			// Init the event handler queue if we're the first
			if ( !(handlers = events[ type ]) ) {
				handlers = events[ type ] = [];
				handlers.delegateCount = 0;

				// Only use addEventListener/attachEvent if the special events handler returns false
				if ( !special.setup || special.setup.call( elem, data, namespaces, eventHandle ) === false ) {
					// Bind the global event handler to the element
					if ( elem.addEventListener ) {
						elem.addEventListener( type, eventHandle, false );

					} else if ( elem.attachEvent ) {
						elem.attachEvent( "on" + type, eventHandle );
					}
				}
			}

			if ( special.add ) {
				special.add.call( elem, handleObj );

				if ( !handleObj.handler.guid ) {
					handleObj.handler.guid = handler.guid;
				}
			}

			// Add to the element's handler list, delegates in front
			if ( selector ) {
				handlers.splice( handlers.delegateCount++, 0, handleObj );
			} else {
				handlers.push( handleObj );
			}

			// Keep track of which events have ever been used, for event optimization
			jQuery.event.global[ type ] = true;
		}

		// Nullify elem to prevent memory leaks in IE
		elem = null;
	},

	// Detach an event or set of events from an element
	remove: function( elem, types, handler, selector, mappedTypes ) {
		var j, handleObj, tmp,
			origCount, t, events,
			special, handlers, type,
			namespaces, origType,
			elemData = jQuery.hasData( elem ) && jQuery._data( elem );

		if ( !elemData || !(events = elemData.events) ) {
			return;
		}

		// Once for each type.namespace in types; type may be omitted
		types = ( types || "" ).match( rnotwhite ) || [ "" ];
		t = types.length;
		while ( t-- ) {
			tmp = rtypenamespace.exec( types[t] ) || [];
			type = origType = tmp[1];
			namespaces = ( tmp[2] || "" ).split( "." ).sort();

			// Unbind all events (on this namespace, if provided) for the element
			if ( !type ) {
				for ( type in events ) {
					jQuery.event.remove( elem, type + types[ t ], handler, selector, true );
				}
				continue;
			}

			special = jQuery.event.special[ type ] || {};
			type = ( selector ? special.delegateType : special.bindType ) || type;
			handlers = events[ type ] || [];
			tmp = tmp[2] && new RegExp( "(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)" );

			// Remove matching events
			origCount = j = handlers.length;
			while ( j-- ) {
				handleObj = handlers[ j ];

				if ( ( mappedTypes || origType === handleObj.origType ) &&
					( !handler || handler.guid === handleObj.guid ) &&
					( !tmp || tmp.test( handleObj.namespace ) ) &&
					( !selector || selector === handleObj.selector || selector === "**" && handleObj.selector ) ) {
					handlers.splice( j, 1 );

					if ( handleObj.selector ) {
						handlers.delegateCount--;
					}
					if ( special.remove ) {
						special.remove.call( elem, handleObj );
					}
				}
			}

			// Remove generic event handler if we removed something and no more handlers exist
			// (avoids potential for endless recursion during removal of special event handlers)
			if ( origCount && !handlers.length ) {
				if ( !special.teardown || special.teardown.call( elem, namespaces, elemData.handle ) === false ) {
					jQuery.removeEvent( elem, type, elemData.handle );
				}

				delete events[ type ];
			}
		}

		// Remove the expando if it's no longer used
		if ( jQuery.isEmptyObject( events ) ) {
			delete elemData.handle;

			// removeData also checks for emptiness and clears the expando if empty
			// so use it instead of delete
			jQuery._removeData( elem, "events" );
		}
	},

	trigger: function( event, data, elem, onlyHandlers ) {
		var handle, ontype, cur,
			bubbleType, special, tmp, i,
			eventPath = [ elem || document ],
			type = hasOwn.call( event, "type" ) ? event.type : event,
			namespaces = hasOwn.call( event, "namespace" ) ? event.namespace.split(".") : [];

		cur = tmp = elem = elem || document;

		// Don't do events on text and comment nodes
		if ( elem.nodeType === 3 || elem.nodeType === 8 ) {
			return;
		}

		// focus/blur morphs to focusin/out; ensure we're not firing them right now
		if ( rfocusMorph.test( type + jQuery.event.triggered ) ) {
			return;
		}

		if ( type.indexOf(".") >= 0 ) {
			// Namespaced trigger; create a regexp to match event type in handle()
			namespaces = type.split(".");
			type = namespaces.shift();
			namespaces.sort();
		}
		ontype = type.indexOf(":") < 0 && "on" + type;

		// Caller can pass in a jQuery.Event object, Object, or just an event type string
		event = event[ jQuery.expando ] ?
			event :
			new jQuery.Event( type, typeof event === "object" && event );

		// Trigger bitmask: & 1 for native handlers; & 2 for jQuery (always true)
		event.isTrigger = onlyHandlers ? 2 : 3;
		event.namespace = namespaces.join(".");
		event.namespace_re = event.namespace ?
			new RegExp( "(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)" ) :
			null;

		// Clean up the event in case it is being reused
		event.result = undefined;
		if ( !event.target ) {
			event.target = elem;
		}

		// Clone any incoming data and prepend the event, creating the handler arg list
		data = data == null ?
			[ event ] :
			jQuery.makeArray( data, [ event ] );

		// Allow special events to draw outside the lines
		special = jQuery.event.special[ type ] || {};
		if ( !onlyHandlers && special.trigger && special.trigger.apply( elem, data ) === false ) {
			return;
		}

		// Determine event propagation path in advance, per W3C events spec (#9951)
		// Bubble up to document, then to window; watch for a global ownerDocument var (#9724)
		if ( !onlyHandlers && !special.noBubble && !jQuery.isWindow( elem ) ) {

			bubbleType = special.delegateType || type;
			if ( !rfocusMorph.test( bubbleType + type ) ) {
				cur = cur.parentNode;
			}
			for ( ; cur; cur = cur.parentNode ) {
				eventPath.push( cur );
				tmp = cur;
			}

			// Only add window if we got to document (e.g., not plain obj or detached DOM)
			if ( tmp === (elem.ownerDocument || document) ) {
				eventPath.push( tmp.defaultView || tmp.parentWindow || window );
			}
		}

		// Fire handlers on the event path
		i = 0;
		while ( (cur = eventPath[i++]) && !event.isPropagationStopped() ) {

			event.type = i > 1 ?
				bubbleType :
				special.bindType || type;

			// jQuery handler
			handle = ( jQuery._data( cur, "events" ) || {} )[ event.type ] && jQuery._data( cur, "handle" );
			if ( handle ) {
				handle.apply( cur, data );
			}

			// Native handler
			handle = ontype && cur[ ontype ];
			if ( handle && handle.apply && jQuery.acceptData( cur ) ) {
				event.result = handle.apply( cur, data );
				if ( event.result === false ) {
					event.preventDefault();
				}
			}
		}
		event.type = type;

		// If nobody prevented the default action, do it now
		if ( !onlyHandlers && !event.isDefaultPrevented() ) {

			if ( (!special._default || special._default.apply( eventPath.pop(), data ) === false) &&
				jQuery.acceptData( elem ) ) {

				// Call a native DOM method on the target with the same name name as the event.
				// Can't use an .isFunction() check here because IE6/7 fails that test.
				// Don't do default actions on window, that's where global variables be (#6170)
				if ( ontype && elem[ type ] && !jQuery.isWindow( elem ) ) {

					// Don't re-trigger an onFOO event when we call its FOO() method
					tmp = elem[ ontype ];

					if ( tmp ) {
						elem[ ontype ] = null;
					}

					// Prevent re-triggering of the same event, since we already bubbled it above
					jQuery.event.triggered = type;
					try {
						elem[ type ]();
					} catch ( e ) {
						// IE<9 dies on focus/blur to hidden element (#1486,#12518)
						// only reproducible on winXP IE8 native, not IE9 in IE8 mode
					}
					jQuery.event.triggered = undefined;

					if ( tmp ) {
						elem[ ontype ] = tmp;
					}
				}
			}
		}

		return event.result;
	},

	dispatch: function( event ) {

		// Make a writable jQuery.Event from the native event object
		event = jQuery.event.fix( event );

		var i, ret, handleObj, matched, j,
			handlerQueue = [],
			args = slice.call( arguments ),
			handlers = ( jQuery._data( this, "events" ) || {} )[ event.type ] || [],
			special = jQuery.event.special[ event.type ] || {};

		// Use the fix-ed jQuery.Event rather than the (read-only) native event
		args[0] = event;
		event.delegateTarget = this;

		// Call the preDispatch hook for the mapped type, and let it bail if desired
		if ( special.preDispatch && special.preDispatch.call( this, event ) === false ) {
			return;
		}

		// Determine handlers
		handlerQueue = jQuery.event.handlers.call( this, event, handlers );

		// Run delegates first; they may want to stop propagation beneath us
		i = 0;
		while ( (matched = handlerQueue[ i++ ]) && !event.isPropagationStopped() ) {
			event.currentTarget = matched.elem;

			j = 0;
			while ( (handleObj = matched.handlers[ j++ ]) && !event.isImmediatePropagationStopped() ) {

				// Triggered event must either 1) have no namespace, or
				// 2) have namespace(s) a subset or equal to those in the bound event (both can have no namespace).
				if ( !event.namespace_re || event.namespace_re.test( handleObj.namespace ) ) {

					event.handleObj = handleObj;
					event.data = handleObj.data;

					ret = ( (jQuery.event.special[ handleObj.origType ] || {}).handle || handleObj.handler )
							.apply( matched.elem, args );

					if ( ret !== undefined ) {
						if ( (event.result = ret) === false ) {
							event.preventDefault();
							event.stopPropagation();
						}
					}
				}
			}
		}

		// Call the postDispatch hook for the mapped type
		if ( special.postDispatch ) {
			special.postDispatch.call( this, event );
		}

		return event.result;
	},

	handlers: function( event, handlers ) {
		var sel, handleObj, matches, i,
			handlerQueue = [],
			delegateCount = handlers.delegateCount,
			cur = event.target;

		// Find delegate handlers
		// Black-hole SVG <use> instance trees (#13180)
		// Avoid non-left-click bubbling in Firefox (#3861)
		if ( delegateCount && cur.nodeType && (!event.button || event.type !== "click") ) {

			/* jshint eqeqeq: false */
			for ( ; cur != this; cur = cur.parentNode || this ) {
				/* jshint eqeqeq: true */

				// Don't check non-elements (#13208)
				// Don't process clicks on disabled elements (#6911, #8165, #11382, #11764)
				if ( cur.nodeType === 1 && (cur.disabled !== true || event.type !== "click") ) {
					matches = [];
					for ( i = 0; i < delegateCount; i++ ) {
						handleObj = handlers[ i ];

						// Don't conflict with Object.prototype properties (#13203)
						sel = handleObj.selector + " ";

						if ( matches[ sel ] === undefined ) {
							matches[ sel ] = handleObj.needsContext ?
								jQuery( sel, this ).index( cur ) >= 0 :
								jQuery.find( sel, this, null, [ cur ] ).length;
						}
						if ( matches[ sel ] ) {
							matches.push( handleObj );
						}
					}
					if ( matches.length ) {
						handlerQueue.push({ elem: cur, handlers: matches });
					}
				}
			}
		}

		// Add the remaining (directly-bound) handlers
		if ( delegateCount < handlers.length ) {
			handlerQueue.push({ elem: this, handlers: handlers.slice( delegateCount ) });
		}

		return handlerQueue;
	},

	fix: function( event ) {
		if ( event[ jQuery.expando ] ) {
			return event;
		}

		// Create a writable copy of the event object and normalize some properties
		var i, prop, copy,
			type = event.type,
			originalEvent = event,
			fixHook = this.fixHooks[ type ];

		if ( !fixHook ) {
			this.fixHooks[ type ] = fixHook =
				rmouseEvent.test( type ) ? this.mouseHooks :
				rkeyEvent.test( type ) ? this.keyHooks :
				{};
		}
		copy = fixHook.props ? this.props.concat( fixHook.props ) : this.props;

		event = new jQuery.Event( originalEvent );

		i = copy.length;
		while ( i-- ) {
			prop = copy[ i ];
			event[ prop ] = originalEvent[ prop ];
		}

		// Support: IE<9
		// Fix target property (#1925)
		if ( !event.target ) {
			event.target = originalEvent.srcElement || document;
		}

		// Support: Chrome 23+, Safari?
		// Target should not be a text node (#504, #13143)
		if ( event.target.nodeType === 3 ) {
			event.target = event.target.parentNode;
		}

		// Support: IE<9
		// For mouse/key events, metaKey==false if it's undefined (#3368, #11328)
		event.metaKey = !!event.metaKey;

		return fixHook.filter ? fixHook.filter( event, originalEvent ) : event;
	},

	// Includes some event props shared by KeyEvent and MouseEvent
	props: "altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),

	fixHooks: {},

	keyHooks: {
		props: "char charCode key keyCode".split(" "),
		filter: function( event, original ) {

			// Add which for key events
			if ( event.which == null ) {
				event.which = original.charCode != null ? original.charCode : original.keyCode;
			}

			return event;
		}
	},

	mouseHooks: {
		props: "button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),
		filter: function( event, original ) {
			var body, eventDoc, doc,
				button = original.button,
				fromElement = original.fromElement;

			// Calculate pageX/Y if missing and clientX/Y available
			if ( event.pageX == null && original.clientX != null ) {
				eventDoc = event.target.ownerDocument || document;
				doc = eventDoc.documentElement;
				body = eventDoc.body;

				event.pageX = original.clientX + ( doc && doc.scrollLeft || body && body.scrollLeft || 0 ) - ( doc && doc.clientLeft || body && body.clientLeft || 0 );
				event.pageY = original.clientY + ( doc && doc.scrollTop  || body && body.scrollTop  || 0 ) - ( doc && doc.clientTop  || body && body.clientTop  || 0 );
			}

			// Add relatedTarget, if necessary
			if ( !event.relatedTarget && fromElement ) {
				event.relatedTarget = fromElement === event.target ? original.toElement : fromElement;
			}

			// Add which for click: 1 === left; 2 === middle; 3 === right
			// Note: button is not normalized, so don't use it
			if ( !event.which && button !== undefined ) {
				event.which = ( button & 1 ? 1 : ( button & 2 ? 3 : ( button & 4 ? 2 : 0 ) ) );
			}

			return event;
		}
	},

	special: {
		load: {
			// Prevent triggered image.load events from bubbling to window.load
			noBubble: true
		},
		focus: {
			// Fire native event if possible so blur/focus sequence is correct
			trigger: function() {
				if ( this !== safeActiveElement() && this.focus ) {
					try {
						this.focus();
						return false;
					} catch ( e ) {
						// Support: IE<9
						// If we error on focus to hidden element (#1486, #12518),
						// let .trigger() run the handlers
					}
				}
			},
			delegateType: "focusin"
		},
		blur: {
			trigger: function() {
				if ( this === safeActiveElement() && this.blur ) {
					this.blur();
					return false;
				}
			},
			delegateType: "focusout"
		},
		click: {
			// For checkbox, fire native event so checked state will be right
			trigger: function() {
				if ( jQuery.nodeName( this, "input" ) && this.type === "checkbox" && this.click ) {
					this.click();
					return false;
				}
			},

			// For cross-browser consistency, don't fire native .click() on links
			_default: function( event ) {
				return jQuery.nodeName( event.target, "a" );
			}
		},

		beforeunload: {
			postDispatch: function( event ) {

				// Even when returnValue equals to undefined Firefox will still show alert
				if ( event.result !== undefined ) {
					event.originalEvent.returnValue = event.result;
				}
			}
		}
	},

	simulate: function( type, elem, event, bubble ) {
		// Piggyback on a donor event to simulate a different one.
		// Fake originalEvent to avoid donor's stopPropagation, but if the
		// simulated event prevents default then we do the same on the donor.
		var e = jQuery.extend(
			new jQuery.Event(),
			event,
			{
				type: type,
				isSimulated: true,
				originalEvent: {}
			}
		);
		if ( bubble ) {
			jQuery.event.trigger( e, null, elem );
		} else {
			jQuery.event.dispatch.call( elem, e );
		}
		if ( e.isDefaultPrevented() ) {
			event.preventDefault();
		}
	}
};

jQuery.removeEvent = document.removeEventListener ?
	function( elem, type, handle ) {
		if ( elem.removeEventListener ) {
			elem.removeEventListener( type, handle, false );
		}
	} :
	function( elem, type, handle ) {
		var name = "on" + type;

		if ( elem.detachEvent ) {

			// #8545, #7054, preventing memory leaks for custom events in IE6-8
			// detachEvent needed property on element, by name of that event, to properly expose it to GC
			if ( typeof elem[ name ] === strundefined ) {
				elem[ name ] = null;
			}

			elem.detachEvent( name, handle );
		}
	};

jQuery.Event = function( src, props ) {
	// Allow instantiation without the 'new' keyword
	if ( !(this instanceof jQuery.Event) ) {
		return new jQuery.Event( src, props );
	}

	// Event object
	if ( src && src.type ) {
		this.originalEvent = src;
		this.type = src.type;

		// Events bubbling up the document may have been marked as prevented
		// by a handler lower down the tree; reflect the correct value.
		this.isDefaultPrevented = src.defaultPrevented ||
				src.defaultPrevented === undefined && (
				// Support: IE < 9
				src.returnValue === false ||
				// Support: Android < 4.0
				src.getPreventDefault && src.getPreventDefault() ) ?
			returnTrue :
			returnFalse;

	// Event type
	} else {
		this.type = src;
	}

	// Put explicitly provided properties onto the event object
	if ( props ) {
		jQuery.extend( this, props );
	}

	// Create a timestamp if incoming event doesn't have one
	this.timeStamp = src && src.timeStamp || jQuery.now();

	// Mark it as fixed
	this[ jQuery.expando ] = true;
};

// jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
// http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
jQuery.Event.prototype = {
	isDefaultPrevented: returnFalse,
	isPropagationStopped: returnFalse,
	isImmediatePropagationStopped: returnFalse,

	preventDefault: function() {
		var e = this.originalEvent;

		this.isDefaultPrevented = returnTrue;
		if ( !e ) {
			return;
		}

		// If preventDefault exists, run it on the original event
		if ( e.preventDefault ) {
			e.preventDefault();

		// Support: IE
		// Otherwise set the returnValue property of the original event to false
		} else {
			e.returnValue = false;
		}
	},
	stopPropagation: function() {
		var e = this.originalEvent;

		this.isPropagationStopped = returnTrue;
		if ( !e ) {
			return;
		}
		// If stopPropagation exists, run it on the original event
		if ( e.stopPropagation ) {
			e.stopPropagation();
		}

		// Support: IE
		// Set the cancelBubble property of the original event to true
		e.cancelBubble = true;
	},
	stopImmediatePropagation: function() {
		this.isImmediatePropagationStopped = returnTrue;
		this.stopPropagation();
	}
};

// Create mouseenter/leave events using mouseover/out and event-time checks
jQuery.each({
	mouseenter: "mouseover",
	mouseleave: "mouseout"
}, function( orig, fix ) {
	jQuery.event.special[ orig ] = {
		delegateType: fix,
		bindType: fix,

		handle: function( event ) {
			var ret,
				target = this,
				related = event.relatedTarget,
				handleObj = event.handleObj;

			// For mousenter/leave call the handler if related is outside the target.
			// NB: No relatedTarget if the mouse left/entered the browser window
			if ( !related || (related !== target && !jQuery.contains( target, related )) ) {
				event.type = handleObj.origType;
				ret = handleObj.handler.apply( this, arguments );
				event.type = fix;
			}
			return ret;
		}
	};
});

// IE submit delegation
if ( !support.submitBubbles ) {

	jQuery.event.special.submit = {
		setup: function() {
			// Only need this for delegated form submit events
			if ( jQuery.nodeName( this, "form" ) ) {
				return false;
			}

			// Lazy-add a submit handler when a descendant form may potentially be submitted
			jQuery.event.add( this, "click._submit keypress._submit", function( e ) {
				// Node name check avoids a VML-related crash in IE (#9807)
				var elem = e.target,
					form = jQuery.nodeName( elem, "input" ) || jQuery.nodeName( elem, "button" ) ? elem.form : undefined;
				if ( form && !jQuery._data( form, "submitBubbles" ) ) {
					jQuery.event.add( form, "submit._submit", function( event ) {
						event._submit_bubble = true;
					});
					jQuery._data( form, "submitBubbles", true );
				}
			});
			// return undefined since we don't need an event listener
		},

		postDispatch: function( event ) {
			// If form was submitted by the user, bubble the event up the tree
			if ( event._submit_bubble ) {
				delete event._submit_bubble;
				if ( this.parentNode && !event.isTrigger ) {
					jQuery.event.simulate( "submit", this.parentNode, event, true );
				}
			}
		},

		teardown: function() {
			// Only need this for delegated form submit events
			if ( jQuery.nodeName( this, "form" ) ) {
				return false;
			}

			// Remove delegated handlers; cleanData eventually reaps submit handlers attached above
			jQuery.event.remove( this, "._submit" );
		}
	};
}

// IE change delegation and checkbox/radio fix
if ( !support.changeBubbles ) {

	jQuery.event.special.change = {

		setup: function() {

			if ( rformElems.test( this.nodeName ) ) {
				// IE doesn't fire change on a check/radio until blur; trigger it on click
				// after a propertychange. Eat the blur-change in special.change.handle.
				// This still fires onchange a second time for check/radio after blur.
				if ( this.type === "checkbox" || this.type === "radio" ) {
					jQuery.event.add( this, "propertychange._change", function( event ) {
						if ( event.originalEvent.propertyName === "checked" ) {
							this._just_changed = true;
						}
					});
					jQuery.event.add( this, "click._change", function( event ) {
						if ( this._just_changed && !event.isTrigger ) {
							this._just_changed = false;
						}
						// Allow triggered, simulated change events (#11500)
						jQuery.event.simulate( "change", this, event, true );
					});
				}
				return false;
			}
			// Delegated event; lazy-add a change handler on descendant inputs
			jQuery.event.add( this, "beforeactivate._change", function( e ) {
				var elem = e.target;

				if ( rformElems.test( elem.nodeName ) && !jQuery._data( elem, "changeBubbles" ) ) {
					jQuery.event.add( elem, "change._change", function( event ) {
						if ( this.parentNode && !event.isSimulated && !event.isTrigger ) {
							jQuery.event.simulate( "change", this.parentNode, event, true );
						}
					});
					jQuery._data( elem, "changeBubbles", true );
				}
			});
		},

		handle: function( event ) {
			var elem = event.target;

			// Swallow native change events from checkbox/radio, we already triggered them above
			if ( this !== elem || event.isSimulated || event.isTrigger || (elem.type !== "radio" && elem.type !== "checkbox") ) {
				return event.handleObj.handler.apply( this, arguments );
			}
		},

		teardown: function() {
			jQuery.event.remove( this, "._change" );

			return !rformElems.test( this.nodeName );
		}
	};
}

// Create "bubbling" focus and blur events
if ( !support.focusinBubbles ) {
	jQuery.each({ focus: "focusin", blur: "focusout" }, function( orig, fix ) {

		// Attach a single capturing handler on the document while someone wants focusin/focusout
		var handler = function( event ) {
				jQuery.event.simulate( fix, event.target, jQuery.event.fix( event ), true );
			};

		jQuery.event.special[ fix ] = {
			setup: function() {
				var doc = this.ownerDocument || this,
					attaches = jQuery._data( doc, fix );

				if ( !attaches ) {
					doc.addEventListener( orig, handler, true );
				}
				jQuery._data( doc, fix, ( attaches || 0 ) + 1 );
			},
			teardown: function() {
				var doc = this.ownerDocument || this,
					attaches = jQuery._data( doc, fix ) - 1;

				if ( !attaches ) {
					doc.removeEventListener( orig, handler, true );
					jQuery._removeData( doc, fix );
				} else {
					jQuery._data( doc, fix, attaches );
				}
			}
		};
	});
}

jQuery.fn.extend({

	on: function( types, selector, data, fn, /*INTERNAL*/ one ) {
		var type, origFn;

		// Types can be a map of types/handlers
		if ( typeof types === "object" ) {
			// ( types-Object, selector, data )
			if ( typeof selector !== "string" ) {
				// ( types-Object, data )
				data = data || selector;
				selector = undefined;
			}
			for ( type in types ) {
				this.on( type, selector, data, types[ type ], one );
			}
			return this;
		}

		if ( data == null && fn == null ) {
			// ( types, fn )
			fn = selector;
			data = selector = undefined;
		} else if ( fn == null ) {
			if ( typeof selector === "string" ) {
				// ( types, selector, fn )
				fn = data;
				data = undefined;
			} else {
				// ( types, data, fn )
				fn = data;
				data = selector;
				selector = undefined;
			}
		}
		if ( fn === false ) {
			fn = returnFalse;
		} else if ( !fn ) {
			return this;
		}

		if ( one === 1 ) {
			origFn = fn;
			fn = function( event ) {
				// Can use an empty set, since event contains the info
				jQuery().off( event );
				return origFn.apply( this, arguments );
			};
			// Use same guid so caller can remove using origFn
			fn.guid = origFn.guid || ( origFn.guid = jQuery.guid++ );
		}
		return this.each( function() {
			jQuery.event.add( this, types, fn, data, selector );
		});
	},
	one: function( types, selector, data, fn ) {
		return this.on( types, selector, data, fn, 1 );
	},
	off: function( types, selector, fn ) {
		var handleObj, type;
		if ( types && types.preventDefault && types.handleObj ) {
			// ( event )  dispatched jQuery.Event
			handleObj = types.handleObj;
			jQuery( types.delegateTarget ).off(
				handleObj.namespace ? handleObj.origType + "." + handleObj.namespace : handleObj.origType,
				handleObj.selector,
				handleObj.handler
			);
			return this;
		}
		if ( typeof types === "object" ) {
			// ( types-object [, selector] )
			for ( type in types ) {
				this.off( type, selector, types[ type ] );
			}
			return this;
		}
		if ( selector === false || typeof selector === "function" ) {
			// ( types [, fn] )
			fn = selector;
			selector = undefined;
		}
		if ( fn === false ) {
			fn = returnFalse;
		}
		return this.each(function() {
			jQuery.event.remove( this, types, fn, selector );
		});
	},

	trigger: function( type, data ) {
		return this.each(function() {
			jQuery.event.trigger( type, data, this );
		});
	},
	triggerHandler: function( type, data ) {
		var elem = this[0];
		if ( elem ) {
			return jQuery.event.trigger( type, data, elem, true );
		}
	}
});


function createSafeFragment( document ) {
	var list = nodeNames.split( "|" ),
		safeFrag = document.createDocumentFragment();

	if ( safeFrag.createElement ) {
		while ( list.length ) {
			safeFrag.createElement(
				list.pop()
			);
		}
	}
	return safeFrag;
}

var nodeNames = "abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|" +
		"header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",
	rinlinejQuery = / jQuery\d+="(?:null|\d+)"/g,
	rnoshimcache = new RegExp("<(?:" + nodeNames + ")[\\s/>]", "i"),
	rleadingWhitespace = /^\s+/,
	rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,
	rtagName = /<([\w:]+)/,
	rtbody = /<tbody/i,
	rhtml = /<|&#?\w+;/,
	rnoInnerhtml = /<(?:script|style|link)/i,
	// checked="checked" or checked
	rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i,
	rscriptType = /^$|\/(?:java|ecma)script/i,
	rscriptTypeMasked = /^true\/(.*)/,
	rcleanScript = /^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,

	// We have to close these tags to support XHTML (#13200)
	wrapMap = {
		option: [ 1, "<select multiple='multiple'>", "</select>" ],
		legend: [ 1, "<fieldset>", "</fieldset>" ],
		area: [ 1, "<map>", "</map>" ],
		param: [ 1, "<object>", "</object>" ],
		thead: [ 1, "<table>", "</table>" ],
		tr: [ 2, "<table><tbody>", "</tbody></table>" ],
		col: [ 2, "<table><tbody></tbody><colgroup>", "</colgroup></table>" ],
		td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],

		// IE6-8 can't serialize link, script, style, or any html5 (NoScope) tags,
		// unless wrapped in a div with non-breaking characters in front of it.
		_default: support.htmlSerialize ? [ 0, "", "" ] : [ 1, "X<div>", "</div>"  ]
	},
	safeFragment = createSafeFragment( document ),
	fragmentDiv = safeFragment.appendChild( document.createElement("div") );

wrapMap.optgroup = wrapMap.option;
wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
wrapMap.th = wrapMap.td;

function getAll( context, tag ) {
	var elems, elem,
		i = 0,
		found = typeof context.getElementsByTagName !== strundefined ? context.getElementsByTagName( tag || "*" ) :
			typeof context.querySelectorAll !== strundefined ? context.querySelectorAll( tag || "*" ) :
			undefined;

	if ( !found ) {
		for ( found = [], elems = context.childNodes || context; (elem = elems[i]) != null; i++ ) {
			if ( !tag || jQuery.nodeName( elem, tag ) ) {
				found.push( elem );
			} else {
				jQuery.merge( found, getAll( elem, tag ) );
			}
		}
	}

	return tag === undefined || tag && jQuery.nodeName( context, tag ) ?
		jQuery.merge( [ context ], found ) :
		found;
}

// Used in buildFragment, fixes the defaultChecked property
function fixDefaultChecked( elem ) {
	if ( rcheckableType.test( elem.type ) ) {
		elem.defaultChecked = elem.checked;
	}
}

// Support: IE<8
// Manipulating tables requires a tbody
function manipulationTarget( elem, content ) {
	return jQuery.nodeName( elem, "table" ) &&
		jQuery.nodeName( content.nodeType !== 11 ? content : content.firstChild, "tr" ) ?

		elem.getElementsByTagName("tbody")[0] ||
			elem.appendChild( elem.ownerDocument.createElement("tbody") ) :
		elem;
}

// Replace/restore the type attribute of script elements for safe DOM manipulation
function disableScript( elem ) {
	elem.type = (jQuery.find.attr( elem, "type" ) !== null) + "/" + elem.type;
	return elem;
}
function restoreScript( elem ) {
	var match = rscriptTypeMasked.exec( elem.type );
	if ( match ) {
		elem.type = match[1];
	} else {
		elem.removeAttribute("type");
	}
	return elem;
}

// Mark scripts as having already been evaluated
function setGlobalEval( elems, refElements ) {
	var elem,
		i = 0;
	for ( ; (elem = elems[i]) != null; i++ ) {
		jQuery._data( elem, "globalEval", !refElements || jQuery._data( refElements[i], "globalEval" ) );
	}
}

function cloneCopyEvent( src, dest ) {

	if ( dest.nodeType !== 1 || !jQuery.hasData( src ) ) {
		return;
	}

	var type, i, l,
		oldData = jQuery._data( src ),
		curData = jQuery._data( dest, oldData ),
		events = oldData.events;

	if ( events ) {
		delete curData.handle;
		curData.events = {};

		for ( type in events ) {
			for ( i = 0, l = events[ type ].length; i < l; i++ ) {
				jQuery.event.add( dest, type, events[ type ][ i ] );
			}
		}
	}

	// make the cloned public data object a copy from the original
	if ( curData.data ) {
		curData.data = jQuery.extend( {}, curData.data );
	}
}

function fixCloneNodeIssues( src, dest ) {
	var nodeName, e, data;

	// We do not need to do anything for non-Elements
	if ( dest.nodeType !== 1 ) {
		return;
	}

	nodeName = dest.nodeName.toLowerCase();

	// IE6-8 copies events bound via attachEvent when using cloneNode.
	if ( !support.noCloneEvent && dest[ jQuery.expando ] ) {
		data = jQuery._data( dest );

		for ( e in data.events ) {
			jQuery.removeEvent( dest, e, data.handle );
		}

		// Event data gets referenced instead of copied if the expando gets copied too
		dest.removeAttribute( jQuery.expando );
	}

	// IE blanks contents when cloning scripts, and tries to evaluate newly-set text
	if ( nodeName === "script" && dest.text !== src.text ) {
		disableScript( dest ).text = src.text;
		restoreScript( dest );

	// IE6-10 improperly clones children of object elements using classid.
	// IE10 throws NoModificationAllowedError if parent is null, #12132.
	} else if ( nodeName === "object" ) {
		if ( dest.parentNode ) {
			dest.outerHTML = src.outerHTML;
		}

		// This path appears unavoidable for IE9. When cloning an object
		// element in IE9, the outerHTML strategy above is not sufficient.
		// If the src has innerHTML and the destination does not,
		// copy the src.innerHTML into the dest.innerHTML. #10324
		if ( support.html5Clone && ( src.innerHTML && !jQuery.trim(dest.innerHTML) ) ) {
			dest.innerHTML = src.innerHTML;
		}

	} else if ( nodeName === "input" && rcheckableType.test( src.type ) ) {
		// IE6-8 fails to persist the checked state of a cloned checkbox
		// or radio button. Worse, IE6-7 fail to give the cloned element
		// a checked appearance if the defaultChecked value isn't also set

		dest.defaultChecked = dest.checked = src.checked;

		// IE6-7 get confused and end up setting the value of a cloned
		// checkbox/radio button to an empty string instead of "on"
		if ( dest.value !== src.value ) {
			dest.value = src.value;
		}

	// IE6-8 fails to return the selected option to the default selected
	// state when cloning options
	} else if ( nodeName === "option" ) {
		dest.defaultSelected = dest.selected = src.defaultSelected;

	// IE6-8 fails to set the defaultValue to the correct value when
	// cloning other types of input fields
	} else if ( nodeName === "input" || nodeName === "textarea" ) {
		dest.defaultValue = src.defaultValue;
	}
}

jQuery.extend({
	clone: function( elem, dataAndEvents, deepDataAndEvents ) {
		var destElements, node, clone, i, srcElements,
			inPage = jQuery.contains( elem.ownerDocument, elem );

		if ( support.html5Clone || jQuery.isXMLDoc(elem) || !rnoshimcache.test( "<" + elem.nodeName + ">" ) ) {
			clone = elem.cloneNode( true );

		// IE<=8 does not properly clone detached, unknown element nodes
		} else {
			fragmentDiv.innerHTML = elem.outerHTML;
			fragmentDiv.removeChild( clone = fragmentDiv.firstChild );
		}

		if ( (!support.noCloneEvent || !support.noCloneChecked) &&
				(elem.nodeType === 1 || elem.nodeType === 11) && !jQuery.isXMLDoc(elem) ) {

			// We eschew Sizzle here for performance reasons: http://jsperf.com/getall-vs-sizzle/2
			destElements = getAll( clone );
			srcElements = getAll( elem );

			// Fix all IE cloning issues
			for ( i = 0; (node = srcElements[i]) != null; ++i ) {
				// Ensure that the destination node is not null; Fixes #9587
				if ( destElements[i] ) {
					fixCloneNodeIssues( node, destElements[i] );
				}
			}
		}

		// Copy the events from the original to the clone
		if ( dataAndEvents ) {
			if ( deepDataAndEvents ) {
				srcElements = srcElements || getAll( elem );
				destElements = destElements || getAll( clone );

				for ( i = 0; (node = srcElements[i]) != null; i++ ) {
					cloneCopyEvent( node, destElements[i] );
				}
			} else {
				cloneCopyEvent( elem, clone );
			}
		}

		// Preserve script evaluation history
		destElements = getAll( clone, "script" );
		if ( destElements.length > 0 ) {
			setGlobalEval( destElements, !inPage && getAll( elem, "script" ) );
		}

		destElements = srcElements = node = null;

		// Return the cloned set
		return clone;
	},

	buildFragment: function( elems, context, scripts, selection ) {
		var j, elem, contains,
			tmp, tag, tbody, wrap,
			l = elems.length,

			// Ensure a safe fragment
			safe = createSafeFragment( context ),

			nodes = [],
			i = 0;

		for ( ; i < l; i++ ) {
			elem = elems[ i ];

			if ( elem || elem === 0 ) {

				// Add nodes directly
				if ( jQuery.type( elem ) === "object" ) {
					jQuery.merge( nodes, elem.nodeType ? [ elem ] : elem );

				// Convert non-html into a text node
				} else if ( !rhtml.test( elem ) ) {
					nodes.push( context.createTextNode( elem ) );

				// Convert html into DOM nodes
				} else {
					tmp = tmp || safe.appendChild( context.createElement("div") );

					// Deserialize a standard representation
					tag = (rtagName.exec( elem ) || [ "", "" ])[ 1 ].toLowerCase();
					wrap = wrapMap[ tag ] || wrapMap._default;

					tmp.innerHTML = wrap[1] + elem.replace( rxhtmlTag, "<$1></$2>" ) + wrap[2];

					// Descend through wrappers to the right content
					j = wrap[0];
					while ( j-- ) {
						tmp = tmp.lastChild;
					}

					// Manually add leading whitespace removed by IE
					if ( !support.leadingWhitespace && rleadingWhitespace.test( elem ) ) {
						nodes.push( context.createTextNode( rleadingWhitespace.exec( elem )[0] ) );
					}

					// Remove IE's autoinserted <tbody> from table fragments
					if ( !support.tbody ) {

						// String was a <table>, *may* have spurious <tbody>
						elem = tag === "table" && !rtbody.test( elem ) ?
							tmp.firstChild :

							// String was a bare <thead> or <tfoot>
							wrap[1] === "<table>" && !rtbody.test( elem ) ?
								tmp :
								0;

						j = elem && elem.childNodes.length;
						while ( j-- ) {
							if ( jQuery.nodeName( (tbody = elem.childNodes[j]), "tbody" ) && !tbody.childNodes.length ) {
								elem.removeChild( tbody );
							}
						}
					}

					jQuery.merge( nodes, tmp.childNodes );

					// Fix #12392 for WebKit and IE > 9
					tmp.textContent = "";

					// Fix #12392 for oldIE
					while ( tmp.firstChild ) {
						tmp.removeChild( tmp.firstChild );
					}

					// Remember the top-level container for proper cleanup
					tmp = safe.lastChild;
				}
			}
		}

		// Fix #11356: Clear elements from fragment
		if ( tmp ) {
			safe.removeChild( tmp );
		}

		// Reset defaultChecked for any radios and checkboxes
		// about to be appended to the DOM in IE 6/7 (#8060)
		if ( !support.appendChecked ) {
			jQuery.grep( getAll( nodes, "input" ), fixDefaultChecked );
		}

		i = 0;
		while ( (elem = nodes[ i++ ]) ) {

			// #4087 - If origin and destination elements are the same, and this is
			// that element, do not do anything
			if ( selection && jQuery.inArray( elem, selection ) !== -1 ) {
				continue;
			}

			contains = jQuery.contains( elem.ownerDocument, elem );

			// Append to fragment
			tmp = getAll( safe.appendChild( elem ), "script" );

			// Preserve script evaluation history
			if ( contains ) {
				setGlobalEval( tmp );
			}

			// Capture executables
			if ( scripts ) {
				j = 0;
				while ( (elem = tmp[ j++ ]) ) {
					if ( rscriptType.test( elem.type || "" ) ) {
						scripts.push( elem );
					}
				}
			}
		}

		tmp = null;

		return safe;
	},

	cleanData: function( elems, /* internal */ acceptData ) {
		var elem, type, id, data,
			i = 0,
			internalKey = jQuery.expando,
			cache = jQuery.cache,
			deleteExpando = support.deleteExpando,
			special = jQuery.event.special;

		for ( ; (elem = elems[i]) != null; i++ ) {
			if ( acceptData || jQuery.acceptData( elem ) ) {

				id = elem[ internalKey ];
				data = id && cache[ id ];

				if ( data ) {
					if ( data.events ) {
						for ( type in data.events ) {
							if ( special[ type ] ) {
								jQuery.event.remove( elem, type );

							// This is a shortcut to avoid jQuery.event.remove's overhead
							} else {
								jQuery.removeEvent( elem, type, data.handle );
							}
						}
					}

					// Remove cache only if it was not already removed by jQuery.event.remove
					if ( cache[ id ] ) {

						delete cache[ id ];

						// IE does not allow us to delete expando properties from nodes,
						// nor does it have a removeAttribute function on Document nodes;
						// we must handle all of these cases
						if ( deleteExpando ) {
							delete elem[ internalKey ];

						} else if ( typeof elem.removeAttribute !== strundefined ) {
							elem.removeAttribute( internalKey );

						} else {
							elem[ internalKey ] = null;
						}

						deletedIds.push( id );
					}
				}
			}
		}
	}
});

jQuery.fn.extend({
	text: function( value ) {
		return access( this, function( value ) {
			return value === undefined ?
				jQuery.text( this ) :
				this.empty().append( ( this[0] && this[0].ownerDocument || document ).createTextNode( value ) );
		}, null, value, arguments.length );
	},

	append: function() {
		return this.domManip( arguments, function( elem ) {
			if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
				var target = manipulationTarget( this, elem );
				target.appendChild( elem );
			}
		});
	},

	prepend: function() {
		return this.domManip( arguments, function( elem ) {
			if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
				var target = manipulationTarget( this, elem );
				target.insertBefore( elem, target.firstChild );
			}
		});
	},

	before: function() {
		return this.domManip( arguments, function( elem ) {
			if ( this.parentNode ) {
				this.parentNode.insertBefore( elem, this );
			}
		});
	},

	after: function() {
		return this.domManip( arguments, function( elem ) {
			if ( this.parentNode ) {
				this.parentNode.insertBefore( elem, this.nextSibling );
			}
		});
	},

	remove: function( selector, keepData /* Internal Use Only */ ) {
		var elem,
			elems = selector ? jQuery.filter( selector, this ) : this,
			i = 0;

		for ( ; (elem = elems[i]) != null; i++ ) {

			if ( !keepData && elem.nodeType === 1 ) {
				jQuery.cleanData( getAll( elem ) );
			}

			if ( elem.parentNode ) {
				if ( keepData && jQuery.contains( elem.ownerDocument, elem ) ) {
					setGlobalEval( getAll( elem, "script" ) );
				}
				elem.parentNode.removeChild( elem );
			}
		}

		return this;
	},

	empty: function() {
		var elem,
			i = 0;

		for ( ; (elem = this[i]) != null; i++ ) {
			// Remove element nodes and prevent memory leaks
			if ( elem.nodeType === 1 ) {
				jQuery.cleanData( getAll( elem, false ) );
			}

			// Remove any remaining nodes
			while ( elem.firstChild ) {
				elem.removeChild( elem.firstChild );
			}

			// If this is a select, ensure that it displays empty (#12336)
			// Support: IE<9
			if ( elem.options && jQuery.nodeName( elem, "select" ) ) {
				elem.options.length = 0;
			}
		}

		return this;
	},

	clone: function( dataAndEvents, deepDataAndEvents ) {
		dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
		deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;

		return this.map(function() {
			return jQuery.clone( this, dataAndEvents, deepDataAndEvents );
		});
	},

	html: function( value ) {
		return access( this, function( value ) {
			var elem = this[ 0 ] || {},
				i = 0,
				l = this.length;

			if ( value === undefined ) {
				return elem.nodeType === 1 ?
					elem.innerHTML.replace( rinlinejQuery, "" ) :
					undefined;
			}

			// See if we can take a shortcut and just use innerHTML
			if ( typeof value === "string" && !rnoInnerhtml.test( value ) &&
				( support.htmlSerialize || !rnoshimcache.test( value )  ) &&
				( support.leadingWhitespace || !rleadingWhitespace.test( value ) ) &&
				!wrapMap[ (rtagName.exec( value ) || [ "", "" ])[ 1 ].toLowerCase() ] ) {

				value = value.replace( rxhtmlTag, "<$1></$2>" );

				try {
					for (; i < l; i++ ) {
						// Remove element nodes and prevent memory leaks
						elem = this[i] || {};
						if ( elem.nodeType === 1 ) {
							jQuery.cleanData( getAll( elem, false ) );
							elem.innerHTML = value;
						}
					}

					elem = 0;

				// If using innerHTML throws an exception, use the fallback method
				} catch(e) {}
			}

			if ( elem ) {
				this.empty().append( value );
			}
		}, null, value, arguments.length );
	},

	replaceWith: function() {
		var arg = arguments[ 0 ];

		// Make the changes, replacing each context element with the new content
		this.domManip( arguments, function( elem ) {
			arg = this.parentNode;

			jQuery.cleanData( getAll( this ) );

			if ( arg ) {
				arg.replaceChild( elem, this );
			}
		});

		// Force removal if there was no new content (e.g., from empty arguments)
		return arg && (arg.length || arg.nodeType) ? this : this.remove();
	},

	detach: function( selector ) {
		return this.remove( selector, true );
	},

	domManip: function( args, callback ) {

		// Flatten any nested arrays
		args = concat.apply( [], args );

		var first, node, hasScripts,
			scripts, doc, fragment,
			i = 0,
			l = this.length,
			set = this,
			iNoClone = l - 1,
			value = args[0],
			isFunction = jQuery.isFunction( value );

		// We can't cloneNode fragments that contain checked, in WebKit
		if ( isFunction ||
				( l > 1 && typeof value === "string" &&
					!support.checkClone && rchecked.test( value ) ) ) {
			return this.each(function( index ) {
				var self = set.eq( index );
				if ( isFunction ) {
					args[0] = value.call( this, index, self.html() );
				}
				self.domManip( args, callback );
			});
		}

		if ( l ) {
			fragment = jQuery.buildFragment( args, this[ 0 ].ownerDocument, false, this );
			first = fragment.firstChild;

			if ( fragment.childNodes.length === 1 ) {
				fragment = first;
			}

			if ( first ) {
				scripts = jQuery.map( getAll( fragment, "script" ), disableScript );
				hasScripts = scripts.length;

				// Use the original fragment for the last item instead of the first because it can end up
				// being emptied incorrectly in certain situations (#8070).
				for ( ; i < l; i++ ) {
					node = fragment;

					if ( i !== iNoClone ) {
						node = jQuery.clone( node, true, true );

						// Keep references to cloned scripts for later restoration
						if ( hasScripts ) {
							jQuery.merge( scripts, getAll( node, "script" ) );
						}
					}

					callback.call( this[i], node, i );
				}

				if ( hasScripts ) {
					doc = scripts[ scripts.length - 1 ].ownerDocument;

					// Reenable scripts
					jQuery.map( scripts, restoreScript );

					// Evaluate executable scripts on first document insertion
					for ( i = 0; i < hasScripts; i++ ) {
						node = scripts[ i ];
						if ( rscriptType.test( node.type || "" ) &&
							!jQuery._data( node, "globalEval" ) && jQuery.contains( doc, node ) ) {

							if ( node.src ) {
								// Optional AJAX dependency, but won't run scripts if not present
								if ( jQuery._evalUrl ) {
									jQuery._evalUrl( node.src );
								}
							} else {
								jQuery.globalEval( ( node.text || node.textContent || node.innerHTML || "" ).replace( rcleanScript, "" ) );
							}
						}
					}
				}

				// Fix #11809: Avoid leaking memory
				fragment = first = null;
			}
		}

		return this;
	}
});

jQuery.each({
	appendTo: "append",
	prependTo: "prepend",
	insertBefore: "before",
	insertAfter: "after",
	replaceAll: "replaceWith"
}, function( name, original ) {
	jQuery.fn[ name ] = function( selector ) {
		var elems,
			i = 0,
			ret = [],
			insert = jQuery( selector ),
			last = insert.length - 1;

		for ( ; i <= last; i++ ) {
			elems = i === last ? this : this.clone(true);
			jQuery( insert[i] )[ original ]( elems );

			// Modern browsers can apply jQuery collections as arrays, but oldIE needs a .get()
			push.apply( ret, elems.get() );
		}

		return this.pushStack( ret );
	};
});


var iframe,
	elemdisplay = {};

/**
 * Retrieve the actual display of a element
 * @param {String} name nodeName of the element
 * @param {Object} doc Document object
 */
// Called only from within defaultDisplay
function actualDisplay( name, doc ) {
	var elem = jQuery( doc.createElement( name ) ).appendTo( doc.body ),

		// getDefaultComputedStyle might be reliably used only on attached element
		display = window.getDefaultComputedStyle ?

			// Use of this method is a temporary fix (more like optmization) until something better comes along,
			// since it was removed from specification and supported only in FF
			window.getDefaultComputedStyle( elem[ 0 ] ).display : jQuery.css( elem[ 0 ], "display" );

	// We don't have any data stored on the element,
	// so use "detach" method as fast way to get rid of the element
	elem.detach();

	return display;
}

/**
 * Try to determine the default display value of an element
 * @param {String} nodeName
 */
function defaultDisplay( nodeName ) {
	var doc = document,
		display = elemdisplay[ nodeName ];

	if ( !display ) {
		display = actualDisplay( nodeName, doc );

		// If the simple way fails, read from inside an iframe
		if ( display === "none" || !display ) {

			// Use the already-created iframe if possible
			iframe = (iframe || jQuery( "<iframe frameborder='0' width='0' height='0'/>" )).appendTo( doc.documentElement );

			// Always write a new HTML skeleton so Webkit and Firefox don't choke on reuse
			doc = ( iframe[ 0 ].contentWindow || iframe[ 0 ].contentDocument ).document;

			// Support: IE
			doc.write();
			doc.close();

			display = actualDisplay( nodeName, doc );
			iframe.detach();
		}

		// Store the correct default display
		elemdisplay[ nodeName ] = display;
	}

	return display;
}


(function() {
	var a, shrinkWrapBlocksVal,
		div = document.createElement( "div" ),
		divReset =
			"-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;" +
			"display:block;padding:0;margin:0;border:0";

	// Setup
	div.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>";
	a = div.getElementsByTagName( "a" )[ 0 ];

	a.style.cssText = "float:left;opacity:.5";

	// Make sure that element opacity exists
	// (IE uses filter instead)
	// Use a regex to work around a WebKit issue. See #5145
	support.opacity = /^0.5/.test( a.style.opacity );

	// Verify style float existence
	// (IE uses styleFloat instead of cssFloat)
	support.cssFloat = !!a.style.cssFloat;

	div.style.backgroundClip = "content-box";
	div.cloneNode( true ).style.backgroundClip = "";
	support.clearCloneStyle = div.style.backgroundClip === "content-box";

	// Null elements to avoid leaks in IE.
	a = div = null;

	support.shrinkWrapBlocks = function() {
		var body, container, div, containerStyles;

		if ( shrinkWrapBlocksVal == null ) {
			body = document.getElementsByTagName( "body" )[ 0 ];
			if ( !body ) {
				// Test fired too early or in an unsupported environment, exit.
				return;
			}

			containerStyles = "border:0;width:0;height:0;position:absolute;top:0;left:-9999px";
			container = document.createElement( "div" );
			div = document.createElement( "div" );

			body.appendChild( container ).appendChild( div );

			// Will be changed later if needed.
			shrinkWrapBlocksVal = false;

			if ( typeof div.style.zoom !== strundefined ) {
				// Support: IE6
				// Check if elements with layout shrink-wrap their children
				div.style.cssText = divReset + ";width:1px;padding:1px;zoom:1";
				div.innerHTML = "<div></div>";
				div.firstChild.style.width = "5px";
				shrinkWrapBlocksVal = div.offsetWidth !== 3;
			}

			body.removeChild( container );

			// Null elements to avoid leaks in IE.
			body = container = div = null;
		}

		return shrinkWrapBlocksVal;
	};

})();
var rmargin = (/^margin/);

var rnumnonpx = new RegExp( "^(" + pnum + ")(?!px)[a-z%]+$", "i" );



var getStyles, curCSS,
	rposition = /^(top|right|bottom|left)$/;

if ( window.getComputedStyle ) {
	getStyles = function( elem ) {
		return elem.ownerDocument.defaultView.getComputedStyle( elem, null );
	};

	curCSS = function( elem, name, computed ) {
		var width, minWidth, maxWidth, ret,
			style = elem.style;

		computed = computed || getStyles( elem );

		// getPropertyValue is only needed for .css('filter') in IE9, see #12537
		ret = computed ? computed.getPropertyValue( name ) || computed[ name ] : undefined;

		if ( computed ) {

			if ( ret === "" && !jQuery.contains( elem.ownerDocument, elem ) ) {
				ret = jQuery.style( elem, name );
			}

			// A tribute to the "awesome hack by Dean Edwards"
			// Chrome < 17 and Safari 5.0 uses "computed value" instead of "used value" for margin-right
			// Safari 5.1.7 (at least) returns percentage for a larger set of values, but width seems to be reliably pixels
			// this is against the CSSOM draft spec: http://dev.w3.org/csswg/cssom/#resolved-values
			if ( rnumnonpx.test( ret ) && rmargin.test( name ) ) {

				// Remember the original values
				width = style.width;
				minWidth = style.minWidth;
				maxWidth = style.maxWidth;

				// Put in the new values to get a computed value out
				style.minWidth = style.maxWidth = style.width = ret;
				ret = computed.width;

				// Revert the changed values
				style.width = width;
				style.minWidth = minWidth;
				style.maxWidth = maxWidth;
			}
		}

		// Support: IE
		// IE returns zIndex value as an integer.
		return ret === undefined ?
			ret :
			ret + "";
	};
} else if ( document.documentElement.currentStyle ) {
	getStyles = function( elem ) {
		return elem.currentStyle;
	};

	curCSS = function( elem, name, computed ) {
		var left, rs, rsLeft, ret,
			style = elem.style;

		computed = computed || getStyles( elem );
		ret = computed ? computed[ name ] : undefined;

		// Avoid setting ret to empty string here
		// so we don't default to auto
		if ( ret == null && style && style[ name ] ) {
			ret = style[ name ];
		}

		// From the awesome hack by Dean Edwards
		// http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291

		// If we're not dealing with a regular pixel number
		// but a number that has a weird ending, we need to convert it to pixels
		// but not position css attributes, as those are proportional to the parent element instead
		// and we can't measure the parent instead because it might trigger a "stacking dolls" problem
		if ( rnumnonpx.test( ret ) && !rposition.test( name ) ) {

			// Remember the original values
			left = style.left;
			rs = elem.runtimeStyle;
			rsLeft = rs && rs.left;

			// Put in the new values to get a computed value out
			if ( rsLeft ) {
				rs.left = elem.currentStyle.left;
			}
			style.left = name === "fontSize" ? "1em" : ret;
			ret = style.pixelLeft + "px";

			// Revert the changed values
			style.left = left;
			if ( rsLeft ) {
				rs.left = rsLeft;
			}
		}

		// Support: IE
		// IE returns zIndex value as an integer.
		return ret === undefined ?
			ret :
			ret + "" || "auto";
	};
}




function addGetHookIf( conditionFn, hookFn ) {
	// Define the hook, we'll check on the first run if it's really needed.
	return {
		get: function() {
			var condition = conditionFn();

			if ( condition == null ) {
				// The test was not ready at this point; screw the hook this time
				// but check again when needed next time.
				return;
			}

			if ( condition ) {
				// Hook not needed (or it's not possible to use it due to missing dependency),
				// remove it.
				// Since there are no other hooks for marginRight, remove the whole object.
				delete this.get;
				return;
			}

			// Hook needed; redefine it so that the support test is not executed again.

			return (this.get = hookFn).apply( this, arguments );
		}
	};
}


(function() {
	var a, reliableHiddenOffsetsVal, boxSizingVal, boxSizingReliableVal,
		pixelPositionVal, reliableMarginRightVal,
		div = document.createElement( "div" ),
		containerStyles = "border:0;width:0;height:0;position:absolute;top:0;left:-9999px",
		divReset =
			"-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;" +
			"display:block;padding:0;margin:0;border:0";

	// Setup
	div.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>";
	a = div.getElementsByTagName( "a" )[ 0 ];

	a.style.cssText = "float:left;opacity:.5";

	// Make sure that element opacity exists
	// (IE uses filter instead)
	// Use a regex to work around a WebKit issue. See #5145
	support.opacity = /^0.5/.test( a.style.opacity );

	// Verify style float existence
	// (IE uses styleFloat instead of cssFloat)
	support.cssFloat = !!a.style.cssFloat;

	div.style.backgroundClip = "content-box";
	div.cloneNode( true ).style.backgroundClip = "";
	support.clearCloneStyle = div.style.backgroundClip === "content-box";

	// Null elements to avoid leaks in IE.
	a = div = null;

	jQuery.extend(support, {
		reliableHiddenOffsets: function() {
			if ( reliableHiddenOffsetsVal != null ) {
				return reliableHiddenOffsetsVal;
			}

			var container, tds, isSupported,
				div = document.createElement( "div" ),
				body = document.getElementsByTagName( "body" )[ 0 ];

			if ( !body ) {
				// Return for frameset docs that don't have a body
				return;
			}

			// Setup
			div.setAttribute( "className", "t" );
			div.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>";

			container = document.createElement( "div" );
			container.style.cssText = containerStyles;

			body.appendChild( container ).appendChild( div );

			// Support: IE8
			// Check if table cells still have offsetWidth/Height when they are set
			// to display:none and there are still other visible table cells in a
			// table row; if so, offsetWidth/Height are not reliable for use when
			// determining if an element has been hidden directly using
			// display:none (it is still safe to use offsets if a parent element is
			// hidden; don safety goggles and see bug #4512 for more information).
			div.innerHTML = "<table><tr><td></td><td>t</td></tr></table>";
			tds = div.getElementsByTagName( "td" );
			tds[ 0 ].style.cssText = "padding:0;margin:0;border:0;display:none";
			isSupported = ( tds[ 0 ].offsetHeight === 0 );

			tds[ 0 ].style.display = "";
			tds[ 1 ].style.display = "none";

			// Support: IE8
			// Check if empty table cells still have offsetWidth/Height
			reliableHiddenOffsetsVal = isSupported && ( tds[ 0 ].offsetHeight === 0 );

			body.removeChild( container );

			// Null elements to avoid leaks in IE.
			div = body = null;

			return reliableHiddenOffsetsVal;
		},

		boxSizing: function() {
			if ( boxSizingVal == null ) {
				computeStyleTests();
			}
			return boxSizingVal;
		},

		boxSizingReliable: function() {
			if ( boxSizingReliableVal == null ) {
				computeStyleTests();
			}
			return boxSizingReliableVal;
		},

		pixelPosition: function() {
			if ( pixelPositionVal == null ) {
				computeStyleTests();
			}
			return pixelPositionVal;
		},

		reliableMarginRight: function() {
			var body, container, div, marginDiv;

			// Use window.getComputedStyle because jsdom on node.js will break without it.
			if ( reliableMarginRightVal == null && window.getComputedStyle ) {
				body = document.getElementsByTagName( "body" )[ 0 ];
				if ( !body ) {
					// Test fired too early or in an unsupported environment, exit.
					return;
				}

				container = document.createElement( "div" );
				div = document.createElement( "div" );
				container.style.cssText = containerStyles;

				body.appendChild( container ).appendChild( div );

				// Check if div with explicit width and no margin-right incorrectly
				// gets computed margin-right based on width of container. (#3333)
				// Fails in WebKit before Feb 2011 nightlies
				// WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
				marginDiv = div.appendChild( document.createElement( "div" ) );
				marginDiv.style.cssText = div.style.cssText = divReset;
				marginDiv.style.marginRight = marginDiv.style.width = "0";
				div.style.width = "1px";

				reliableMarginRightVal =
					!parseFloat( ( window.getComputedStyle( marginDiv, null ) || {} ).marginRight );

				body.removeChild( container );
			}

			return reliableMarginRightVal;
		}
	});

	function computeStyleTests() {
		var container, div,
			body = document.getElementsByTagName( "body" )[ 0 ];

		if ( !body ) {
			// Test fired too early or in an unsupported environment, exit.
			return;
		}

		container = document.createElement( "div" );
		div = document.createElement( "div" );
		container.style.cssText = containerStyles;

		body.appendChild( container ).appendChild( div );

		div.style.cssText =
			"-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;" +
				"position:absolute;display:block;padding:1px;border:1px;width:4px;" +
				"margin-top:1%;top:1%";

		// Workaround failing boxSizing test due to offsetWidth returning wrong value
		// with some non-1 values of body zoom, ticket #13543
		jQuery.swap( body, body.style.zoom != null ? { zoom: 1 } : {}, function() {
			boxSizingVal = div.offsetWidth === 4;
		});

		// Will be changed later if needed.
		boxSizingReliableVal = true;
		pixelPositionVal = false;
		reliableMarginRightVal = true;

		// Use window.getComputedStyle because jsdom on node.js will break without it.
		if ( window.getComputedStyle ) {
			pixelPositionVal = ( window.getComputedStyle( div, null ) || {} ).top !== "1%";
			boxSizingReliableVal =
				( window.getComputedStyle( div, null ) || { width: "4px" } ).width === "4px";
		}

		body.removeChild( container );

		// Null elements to avoid leaks in IE.
		div = body = null;
	}

})();


// A method for quickly swapping in/out CSS properties to get correct calculations.
jQuery.swap = function( elem, options, callback, args ) {
	var ret, name,
		old = {};

	// Remember the old values, and insert the new ones
	for ( name in options ) {
		old[ name ] = elem.style[ name ];
		elem.style[ name ] = options[ name ];
	}

	ret = callback.apply( elem, args || [] );

	// Revert the old values
	for ( name in options ) {
		elem.style[ name ] = old[ name ];
	}

	return ret;
};


var
		ralpha = /alpha\([^)]*\)/i,
	ropacity = /opacity\s*=\s*([^)]*)/,

	// swappable if display is none or starts with table except "table", "table-cell", or "table-caption"
	// see here for display values: https://developer.mozilla.org/en-US/docs/CSS/display
	rdisplayswap = /^(none|table(?!-c[ea]).+)/,
	rnumsplit = new RegExp( "^(" + pnum + ")(.*)$", "i" ),
	rrelNum = new RegExp( "^([+-])=(" + pnum + ")", "i" ),

	cssShow = { position: "absolute", visibility: "hidden", display: "block" },
	cssNormalTransform = {
		letterSpacing: 0,
		fontWeight: 400
	},

	cssPrefixes = [ "Webkit", "O", "Moz", "ms" ];


// return a css property mapped to a potentially vendor prefixed property
function vendorPropName( style, name ) {

	// shortcut for names that are not vendor prefixed
	if ( name in style ) {
		return name;
	}

	// check for vendor prefixed names
	var capName = name.charAt(0).toUpperCase() + name.slice(1),
		origName = name,
		i = cssPrefixes.length;

	while ( i-- ) {
		name = cssPrefixes[ i ] + capName;
		if ( name in style ) {
			return name;
		}
	}

	return origName;
}

function showHide( elements, show ) {
	var display, elem, hidden,
		values = [],
		index = 0,
		length = elements.length;

	for ( ; index < length; index++ ) {
		elem = elements[ index ];
		if ( !elem.style ) {
			continue;
		}

		values[ index ] = jQuery._data( elem, "olddisplay" );
		display = elem.style.display;
		if ( show ) {
			// Reset the inline display of this element to learn if it is
			// being hidden by cascaded rules or not
			if ( !values[ index ] && display === "none" ) {
				elem.style.display = "";
			}

			// Set elements which have been overridden with display: none
			// in a stylesheet to whatever the default browser style is
			// for such an element
			if ( elem.style.display === "" && isHidden( elem ) ) {
				values[ index ] = jQuery._data( elem, "olddisplay", defaultDisplay(elem.nodeName) );
			}
		} else {

			if ( !values[ index ] ) {
				hidden = isHidden( elem );

				if ( display && display !== "none" || !hidden ) {
					jQuery._data( elem, "olddisplay", hidden ? display : jQuery.css( elem, "display" ) );
				}
			}
		}
	}

	// Set the display of most of the elements in a second loop
	// to avoid the constant reflow
	for ( index = 0; index < length; index++ ) {
		elem = elements[ index ];
		if ( !elem.style ) {
			continue;
		}
		if ( !show || elem.style.display === "none" || elem.style.display === "" ) {
			elem.style.display = show ? values[ index ] || "" : "none";
		}
	}

	return elements;
}

function setPositiveNumber( elem, value, subtract ) {
	var matches = rnumsplit.exec( value );
	return matches ?
		// Guard against undefined "subtract", e.g., when used as in cssHooks
		Math.max( 0, matches[ 1 ] - ( subtract || 0 ) ) + ( matches[ 2 ] || "px" ) :
		value;
}

function augmentWidthOrHeight( elem, name, extra, isBorderBox, styles ) {
	var i = extra === ( isBorderBox ? "border" : "content" ) ?
		// If we already have the right measurement, avoid augmentation
		4 :
		// Otherwise initialize for horizontal or vertical properties
		name === "width" ? 1 : 0,

		val = 0;

	for ( ; i < 4; i += 2 ) {
		// both box models exclude margin, so add it if we want it
		if ( extra === "margin" ) {
			val += jQuery.css( elem, extra + cssExpand[ i ], true, styles );
		}

		if ( isBorderBox ) {
			// border-box includes padding, so remove it if we want content
			if ( extra === "content" ) {
				val -= jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );
			}

			// at this point, extra isn't border nor margin, so remove border
			if ( extra !== "margin" ) {
				val -= jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
			}
		} else {
			// at this point, extra isn't content, so add padding
			val += jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );

			// at this point, extra isn't content nor padding, so add border
			if ( extra !== "padding" ) {
				val += jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
			}
		}
	}

	return val;
}

function getWidthOrHeight( elem, name, extra ) {

	// Start with offset property, which is equivalent to the border-box value
	var valueIsBorderBox = true,
		val = name === "width" ? elem.offsetWidth : elem.offsetHeight,
		styles = getStyles( elem ),
		isBorderBox = support.boxSizing() && jQuery.css( elem, "boxSizing", false, styles ) === "border-box";

	// some non-html elements return undefined for offsetWidth, so check for null/undefined
	// svg - https://bugzilla.mozilla.org/show_bug.cgi?id=649285
	// MathML - https://bugzilla.mozilla.org/show_bug.cgi?id=491668
	if ( val <= 0 || val == null ) {
		// Fall back to computed then uncomputed css if necessary
		val = curCSS( elem, name, styles );
		if ( val < 0 || val == null ) {
			val = elem.style[ name ];
		}

		// Computed unit is not pixels. Stop here and return.
		if ( rnumnonpx.test(val) ) {
			return val;
		}

		// we need the check for style in case a browser which returns unreliable values
		// for getComputedStyle silently falls back to the reliable elem.style
		valueIsBorderBox = isBorderBox && ( support.boxSizingReliable() || val === elem.style[ name ] );

		// Normalize "", auto, and prepare for extra
		val = parseFloat( val ) || 0;
	}

	// use the active box-sizing model to add/subtract irrelevant styles
	return ( val +
		augmentWidthOrHeight(
			elem,
			name,
			extra || ( isBorderBox ? "border" : "content" ),
			valueIsBorderBox,
			styles
		)
	) + "px";
}

jQuery.extend({
	// Add in style property hooks for overriding the default
	// behavior of getting and setting a style property
	cssHooks: {
		opacity: {
			get: function( elem, computed ) {
				if ( computed ) {
					// We should always get a number back from opacity
					var ret = curCSS( elem, "opacity" );
					return ret === "" ? "1" : ret;
				}
			}
		}
	},

	// Don't automatically add "px" to these possibly-unitless properties
	cssNumber: {
		"columnCount": true,
		"fillOpacity": true,
		"fontWeight": true,
		"lineHeight": true,
		"opacity": true,
		"order": true,
		"orphans": true,
		"widows": true,
		"zIndex": true,
		"zoom": true
	},

	// Add in properties whose names you wish to fix before
	// setting or getting the value
	cssProps: {
		// normalize float css property
		"float": support.cssFloat ? "cssFloat" : "styleFloat"
	},

	// Get and set the style property on a DOM Node
	style: function( elem, name, value, extra ) {
		// Don't set styles on text and comment nodes
		if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style ) {
			return;
		}

		// Make sure that we're working with the right name
		var ret, type, hooks,
			origName = jQuery.camelCase( name ),
			style = elem.style;

		name = jQuery.cssProps[ origName ] || ( jQuery.cssProps[ origName ] = vendorPropName( style, origName ) );

		// gets hook for the prefixed version
		// followed by the unprefixed version
		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

		// Check if we're setting a value
		if ( value !== undefined ) {
			type = typeof value;

			// convert relative number strings (+= or -=) to relative numbers. #7345
			if ( type === "string" && (ret = rrelNum.exec( value )) ) {
				value = ( ret[1] + 1 ) * ret[2] + parseFloat( jQuery.css( elem, name ) );
				// Fixes bug #9237
				type = "number";
			}

			// Make sure that null and NaN values aren't set. See: #7116
			if ( value == null || value !== value ) {
				return;
			}

			// If a number was passed in, add 'px' to the (except for certain CSS properties)
			if ( type === "number" && !jQuery.cssNumber[ origName ] ) {
				value += "px";
			}

			// Fixes #8908, it can be done more correctly by specifing setters in cssHooks,
			// but it would mean to define eight (for every problematic property) identical functions
			if ( !support.clearCloneStyle && value === "" && name.indexOf("background") === 0 ) {
				style[ name ] = "inherit";
			}

			// If a hook was provided, use that value, otherwise just set the specified value
			if ( !hooks || !("set" in hooks) || (value = hooks.set( elem, value, extra )) !== undefined ) {

				// Support: IE
				// Swallow errors from 'invalid' CSS values (#5509)
				try {
					// Support: Chrome, Safari
					// Setting style to blank string required to delete "style: x !important;"
					style[ name ] = "";
					style[ name ] = value;
				} catch(e) {}
			}

		} else {
			// If a hook was provided get the non-computed value from there
			if ( hooks && "get" in hooks && (ret = hooks.get( elem, false, extra )) !== undefined ) {
				return ret;
			}

			// Otherwise just get the value from the style object
			return style[ name ];
		}
	},

	css: function( elem, name, extra, styles ) {
		var num, val, hooks,
			origName = jQuery.camelCase( name );

		// Make sure that we're working with the right name
		name = jQuery.cssProps[ origName ] || ( jQuery.cssProps[ origName ] = vendorPropName( elem.style, origName ) );

		// gets hook for the prefixed version
		// followed by the unprefixed version
		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

		// If a hook was provided get the computed value from there
		if ( hooks && "get" in hooks ) {
			val = hooks.get( elem, true, extra );
		}

		// Otherwise, if a way to get the computed value exists, use that
		if ( val === undefined ) {
			val = curCSS( elem, name, styles );
		}

		//convert "normal" to computed value
		if ( val === "normal" && name in cssNormalTransform ) {
			val = cssNormalTransform[ name ];
		}

		// Return, converting to number if forced or a qualifier was provided and val looks numeric
		if ( extra === "" || extra ) {
			num = parseFloat( val );
			return extra === true || jQuery.isNumeric( num ) ? num || 0 : val;
		}
		return val;
	}
});

jQuery.each([ "height", "width" ], function( i, name ) {
	jQuery.cssHooks[ name ] = {
		get: function( elem, computed, extra ) {
			if ( computed ) {
				// certain elements can have dimension info if we invisibly show them
				// however, it must have a current display style that would benefit from this
				return elem.offsetWidth === 0 && rdisplayswap.test( jQuery.css( elem, "display" ) ) ?
					jQuery.swap( elem, cssShow, function() {
						return getWidthOrHeight( elem, name, extra );
					}) :
					getWidthOrHeight( elem, name, extra );
			}
		},

		set: function( elem, value, extra ) {
			var styles = extra && getStyles( elem );
			return setPositiveNumber( elem, value, extra ?
				augmentWidthOrHeight(
					elem,
					name,
					extra,
					support.boxSizing() && jQuery.css( elem, "boxSizing", false, styles ) === "border-box",
					styles
				) : 0
			);
		}
	};
});

if ( !support.opacity ) {
	jQuery.cssHooks.opacity = {
		get: function( elem, computed ) {
			// IE uses filters for opacity
			return ropacity.test( (computed && elem.currentStyle ? elem.currentStyle.filter : elem.style.filter) || "" ) ?
				( 0.01 * parseFloat( RegExp.$1 ) ) + "" :
				computed ? "1" : "";
		},

		set: function( elem, value ) {
			var style = elem.style,
				currentStyle = elem.currentStyle,
				opacity = jQuery.isNumeric( value ) ? "alpha(opacity=" + value * 100 + ")" : "",
				filter = currentStyle && currentStyle.filter || style.filter || "";

			// IE has trouble with opacity if it does not have layout
			// Force it by setting the zoom level
			style.zoom = 1;

			// if setting opacity to 1, and no other filters exist - attempt to remove filter attribute #6652
			// if value === "", then remove inline opacity #12685
			if ( ( value >= 1 || value === "" ) &&
					jQuery.trim( filter.replace( ralpha, "" ) ) === "" &&
					style.removeAttribute ) {

				// Setting style.filter to null, "" & " " still leave "filter:" in the cssText
				// if "filter:" is present at all, clearType is disabled, we want to avoid this
				// style.removeAttribute is IE Only, but so apparently is this code path...
				style.removeAttribute( "filter" );

				// if there is no filter style applied in a css rule or unset inline opacity, we are done
				if ( value === "" || currentStyle && !currentStyle.filter ) {
					return;
				}
			}

			// otherwise, set new filter values
			style.filter = ralpha.test( filter ) ?
				filter.replace( ralpha, opacity ) :
				filter + " " + opacity;
		}
	};
}

jQuery.cssHooks.marginRight = addGetHookIf( support.reliableMarginRight,
	function( elem, computed ) {
		if ( computed ) {
			// WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
			// Work around by temporarily setting element display to inline-block
			return jQuery.swap( elem, { "display": "inline-block" },
				curCSS, [ elem, "marginRight" ] );
		}
	}
);

// These hooks are used by animate to expand properties
jQuery.each({
	margin: "",
	padding: "",
	border: "Width"
}, function( prefix, suffix ) {
	jQuery.cssHooks[ prefix + suffix ] = {
		expand: function( value ) {
			var i = 0,
				expanded = {},

				// assumes a single number if not a string
				parts = typeof value === "string" ? value.split(" ") : [ value ];

			for ( ; i < 4; i++ ) {
				expanded[ prefix + cssExpand[ i ] + suffix ] =
					parts[ i ] || parts[ i - 2 ] || parts[ 0 ];
			}

			return expanded;
		}
	};

	if ( !rmargin.test( prefix ) ) {
		jQuery.cssHooks[ prefix + suffix ].set = setPositiveNumber;
	}
});

jQuery.fn.extend({
	css: function( name, value ) {
		return access( this, function( elem, name, value ) {
			var styles, len,
				map = {},
				i = 0;

			if ( jQuery.isArray( name ) ) {
				styles = getStyles( elem );
				len = name.length;

				for ( ; i < len; i++ ) {
					map[ name[ i ] ] = jQuery.css( elem, name[ i ], false, styles );
				}

				return map;
			}

			return value !== undefined ?
				jQuery.style( elem, name, value ) :
				jQuery.css( elem, name );
		}, name, value, arguments.length > 1 );
	},
	show: function() {
		return showHide( this, true );
	},
	hide: function() {
		return showHide( this );
	},
	toggle: function( state ) {
		if ( typeof state === "boolean" ) {
			return state ? this.show() : this.hide();
		}

		return this.each(function() {
			if ( isHidden( this ) ) {
				jQuery( this ).show();
			} else {
				jQuery( this ).hide();
			}
		});
	}
});


function Tween( elem, options, prop, end, easing ) {
	return new Tween.prototype.init( elem, options, prop, end, easing );
}
jQuery.Tween = Tween;

Tween.prototype = {
	constructor: Tween,
	init: function( elem, options, prop, end, easing, unit ) {
		this.elem = elem;
		this.prop = prop;
		this.easing = easing || "swing";
		this.options = options;
		this.start = this.now = this.cur();
		this.end = end;
		this.unit = unit || ( jQuery.cssNumber[ prop ] ? "" : "px" );
	},
	cur: function() {
		var hooks = Tween.propHooks[ this.prop ];

		return hooks && hooks.get ?
			hooks.get( this ) :
			Tween.propHooks._default.get( this );
	},
	run: function( percent ) {
		var eased,
			hooks = Tween.propHooks[ this.prop ];

		if ( this.options.duration ) {
			this.pos = eased = jQuery.easing[ this.easing ](
				percent, this.options.duration * percent, 0, 1, this.options.duration
			);
		} else {
			this.pos = eased = percent;
		}
		this.now = ( this.end - this.start ) * eased + this.start;

		if ( this.options.step ) {
			this.options.step.call( this.elem, this.now, this );
		}

		if ( hooks && hooks.set ) {
			hooks.set( this );
		} else {
			Tween.propHooks._default.set( this );
		}
		return this;
	}
};

Tween.prototype.init.prototype = Tween.prototype;

Tween.propHooks = {
	_default: {
		get: function( tween ) {
			var result;

			if ( tween.elem[ tween.prop ] != null &&
				(!tween.elem.style || tween.elem.style[ tween.prop ] == null) ) {
				return tween.elem[ tween.prop ];
			}

			// passing an empty string as a 3rd parameter to .css will automatically
			// attempt a parseFloat and fallback to a string if the parse fails
			// so, simple values such as "10px" are parsed to Float.
			// complex values such as "rotate(1rad)" are returned as is.
			result = jQuery.css( tween.elem, tween.prop, "" );
			// Empty strings, null, undefined and "auto" are converted to 0.
			return !result || result === "auto" ? 0 : result;
		},
		set: function( tween ) {
			// use step hook for back compat - use cssHook if its there - use .style if its
			// available and use plain properties where available
			if ( jQuery.fx.step[ tween.prop ] ) {
				jQuery.fx.step[ tween.prop ]( tween );
			} else if ( tween.elem.style && ( tween.elem.style[ jQuery.cssProps[ tween.prop ] ] != null || jQuery.cssHooks[ tween.prop ] ) ) {
				jQuery.style( tween.elem, tween.prop, tween.now + tween.unit );
			} else {
				tween.elem[ tween.prop ] = tween.now;
			}
		}
	}
};

// Support: IE <=9
// Panic based approach to setting things on disconnected nodes

Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
	set: function( tween ) {
		if ( tween.elem.nodeType && tween.elem.parentNode ) {
			tween.elem[ tween.prop ] = tween.now;
		}
	}
};

jQuery.easing = {
	linear: function( p ) {
		return p;
	},
	swing: function( p ) {
		return 0.5 - Math.cos( p * Math.PI ) / 2;
	}
};

jQuery.fx = Tween.prototype.init;

// Back Compat <1.8 extension point
jQuery.fx.step = {};




var
	fxNow, timerId,
	rfxtypes = /^(?:toggle|show|hide)$/,
	rfxnum = new RegExp( "^(?:([+-])=|)(" + pnum + ")([a-z%]*)$", "i" ),
	rrun = /queueHooks$/,
	animationPrefilters = [ defaultPrefilter ],
	tweeners = {
		"*": [ function( prop, value ) {
			var tween = this.createTween( prop, value ),
				target = tween.cur(),
				parts = rfxnum.exec( value ),
				unit = parts && parts[ 3 ] || ( jQuery.cssNumber[ prop ] ? "" : "px" ),

				// Starting value computation is required for potential unit mismatches
				start = ( jQuery.cssNumber[ prop ] || unit !== "px" && +target ) &&
					rfxnum.exec( jQuery.css( tween.elem, prop ) ),
				scale = 1,
				maxIterations = 20;

			if ( start && start[ 3 ] !== unit ) {
				// Trust units reported by jQuery.css
				unit = unit || start[ 3 ];

				// Make sure we update the tween properties later on
				parts = parts || [];

				// Iteratively approximate from a nonzero starting point
				start = +target || 1;

				do {
					// If previous iteration zeroed out, double until we get *something*
					// Use a string for doubling factor so we don't accidentally see scale as unchanged below
					scale = scale || ".5";

					// Adjust and apply
					start = start / scale;
					jQuery.style( tween.elem, prop, start + unit );

				// Update scale, tolerating zero or NaN from tween.cur()
				// And breaking the loop if scale is unchanged or perfect, or if we've just had enough
				} while ( scale !== (scale = tween.cur() / target) && scale !== 1 && --maxIterations );
			}

			// Update tween properties
			if ( parts ) {
				start = tween.start = +start || +target || 0;
				tween.unit = unit;
				// If a +=/-= token was provided, we're doing a relative animation
				tween.end = parts[ 1 ] ?
					start + ( parts[ 1 ] + 1 ) * parts[ 2 ] :
					+parts[ 2 ];
			}

			return tween;
		} ]
	};

// Animations created synchronously will run synchronously
function createFxNow() {
	setTimeout(function() {
		fxNow = undefined;
	});
	return ( fxNow = jQuery.now() );
}

// Generate parameters to create a standard animation
function genFx( type, includeWidth ) {
	var which,
		attrs = { height: type },
		i = 0;

	// if we include width, step value is 1 to do all cssExpand values,
	// if we don't include width, step value is 2 to skip over Left and Right
	includeWidth = includeWidth ? 1 : 0;
	for ( ; i < 4 ; i += 2 - includeWidth ) {
		which = cssExpand[ i ];
		attrs[ "margin" + which ] = attrs[ "padding" + which ] = type;
	}

	if ( includeWidth ) {
		attrs.opacity = attrs.width = type;
	}

	return attrs;
}

function createTween( value, prop, animation ) {
	var tween,
		collection = ( tweeners[ prop ] || [] ).concat( tweeners[ "*" ] ),
		index = 0,
		length = collection.length;
	for ( ; index < length; index++ ) {
		if ( (tween = collection[ index ].call( animation, prop, value )) ) {

			// we're done with this property
			return tween;
		}
	}
}

function defaultPrefilter( elem, props, opts ) {
	/* jshint validthis: true */
	var prop, value, toggle, tween, hooks, oldfire, display, dDisplay,
		anim = this,
		orig = {},
		style = elem.style,
		hidden = elem.nodeType && isHidden( elem ),
		dataShow = jQuery._data( elem, "fxshow" );

	// handle queue: false promises
	if ( !opts.queue ) {
		hooks = jQuery._queueHooks( elem, "fx" );
		if ( hooks.unqueued == null ) {
			hooks.unqueued = 0;
			oldfire = hooks.empty.fire;
			hooks.empty.fire = function() {
				if ( !hooks.unqueued ) {
					oldfire();
				}
			};
		}
		hooks.unqueued++;

		anim.always(function() {
			// doing this makes sure that the complete handler will be called
			// before this completes
			anim.always(function() {
				hooks.unqueued--;
				if ( !jQuery.queue( elem, "fx" ).length ) {
					hooks.empty.fire();
				}
			});
		});
	}

	// height/width overflow pass
	if ( elem.nodeType === 1 && ( "height" in props || "width" in props ) ) {
		// Make sure that nothing sneaks out
		// Record all 3 overflow attributes because IE does not
		// change the overflow attribute when overflowX and
		// overflowY are set to the same value
		opts.overflow = [ style.overflow, style.overflowX, style.overflowY ];

		// Set display property to inline-block for height/width
		// animations on inline elements that are having width/height animated
		display = jQuery.css( elem, "display" );
		dDisplay = defaultDisplay( elem.nodeName );
		if ( display === "none" ) {
			display = dDisplay;
		}
		if ( display === "inline" &&
				jQuery.css( elem, "float" ) === "none" ) {

			// inline-level elements accept inline-block;
			// block-level elements need to be inline with layout
			if ( !support.inlineBlockNeedsLayout || dDisplay === "inline" ) {
				style.display = "inline-block";
			} else {
				style.zoom = 1;
			}
		}
	}

	if ( opts.overflow ) {
		style.overflow = "hidden";
		if ( !support.shrinkWrapBlocks() ) {
			anim.always(function() {
				style.overflow = opts.overflow[ 0 ];
				style.overflowX = opts.overflow[ 1 ];
				style.overflowY = opts.overflow[ 2 ];
			});
		}
	}

	// show/hide pass
	for ( prop in props ) {
		value = props[ prop ];
		if ( rfxtypes.exec( value ) ) {
			delete props[ prop ];
			toggle = toggle || value === "toggle";
			if ( value === ( hidden ? "hide" : "show" ) ) {

				// If there is dataShow left over from a stopped hide or show and we are going to proceed with show, we should pretend to be hidden
				if ( value === "show" && dataShow && dataShow[ prop ] !== undefined ) {
					hidden = true;
				} else {
					continue;
				}
			}
			orig[ prop ] = dataShow && dataShow[ prop ] || jQuery.style( elem, prop );
		}
	}

	if ( !jQuery.isEmptyObject( orig ) ) {
		if ( dataShow ) {
			if ( "hidden" in dataShow ) {
				hidden = dataShow.hidden;
			}
		} else {
			dataShow = jQuery._data( elem, "fxshow", {} );
		}

		// store state if its toggle - enables .stop().toggle() to "reverse"
		if ( toggle ) {
			dataShow.hidden = !hidden;
		}
		if ( hidden ) {
			jQuery( elem ).show();
		} else {
			anim.done(function() {
				jQuery( elem ).hide();
			});
		}
		anim.done(function() {
			var prop;
			jQuery._removeData( elem, "fxshow" );
			for ( prop in orig ) {
				jQuery.style( elem, prop, orig[ prop ] );
			}
		});
		for ( prop in orig ) {
			tween = createTween( hidden ? dataShow[ prop ] : 0, prop, anim );

			if ( !( prop in dataShow ) ) {
				dataShow[ prop ] = tween.start;
				if ( hidden ) {
					tween.end = tween.start;
					tween.start = prop === "width" || prop === "height" ? 1 : 0;
				}
			}
		}
	}
}

function propFilter( props, specialEasing ) {
	var index, name, easing, value, hooks;

	// camelCase, specialEasing and expand cssHook pass
	for ( index in props ) {
		name = jQuery.camelCase( index );
		easing = specialEasing[ name ];
		value = props[ index ];
		if ( jQuery.isArray( value ) ) {
			easing = value[ 1 ];
			value = props[ index ] = value[ 0 ];
		}

		if ( index !== name ) {
			props[ name ] = value;
			delete props[ index ];
		}

		hooks = jQuery.cssHooks[ name ];
		if ( hooks && "expand" in hooks ) {
			value = hooks.expand( value );
			delete props[ name ];

			// not quite $.extend, this wont overwrite keys already present.
			// also - reusing 'index' from above because we have the correct "name"
			for ( index in value ) {
				if ( !( index in props ) ) {
					props[ index ] = value[ index ];
					specialEasing[ index ] = easing;
				}
			}
		} else {
			specialEasing[ name ] = easing;
		}
	}
}

function Animation( elem, properties, options ) {
	var result,
		stopped,
		index = 0,
		length = animationPrefilters.length,
		deferred = jQuery.Deferred().always( function() {
			// don't match elem in the :animated selector
			delete tick.elem;
		}),
		tick = function() {
			if ( stopped ) {
				return false;
			}
			var currentTime = fxNow || createFxNow(),
				remaining = Math.max( 0, animation.startTime + animation.duration - currentTime ),
				// archaic crash bug won't allow us to use 1 - ( 0.5 || 0 ) (#12497)
				temp = remaining / animation.duration || 0,
				percent = 1 - temp,
				index = 0,
				length = animation.tweens.length;

			for ( ; index < length ; index++ ) {
				animation.tweens[ index ].run( percent );
			}

			deferred.notifyWith( elem, [ animation, percent, remaining ]);

			if ( percent < 1 && length ) {
				return remaining;
			} else {
				deferred.resolveWith( elem, [ animation ] );
				return false;
			}
		},
		animation = deferred.promise({
			elem: elem,
			props: jQuery.extend( {}, properties ),
			opts: jQuery.extend( true, { specialEasing: {} }, options ),
			originalProperties: properties,
			originalOptions: options,
			startTime: fxNow || createFxNow(),
			duration: options.duration,
			tweens: [],
			createTween: function( prop, end ) {
				var tween = jQuery.Tween( elem, animation.opts, prop, end,
						animation.opts.specialEasing[ prop ] || animation.opts.easing );
				animation.tweens.push( tween );
				return tween;
			},
			stop: function( gotoEnd ) {
				var index = 0,
					// if we are going to the end, we want to run all the tweens
					// otherwise we skip this part
					length = gotoEnd ? animation.tweens.length : 0;
				if ( stopped ) {
					return this;
				}
				stopped = true;
				for ( ; index < length ; index++ ) {
					animation.tweens[ index ].run( 1 );
				}

				// resolve when we played the last frame
				// otherwise, reject
				if ( gotoEnd ) {
					deferred.resolveWith( elem, [ animation, gotoEnd ] );
				} else {
					deferred.rejectWith( elem, [ animation, gotoEnd ] );
				}
				return this;
			}
		}),
		props = animation.props;

	propFilter( props, animation.opts.specialEasing );

	for ( ; index < length ; index++ ) {
		result = animationPrefilters[ index ].call( animation, elem, props, animation.opts );
		if ( result ) {
			return result;
		}
	}

	jQuery.map( props, createTween, animation );

	if ( jQuery.isFunction( animation.opts.start ) ) {
		animation.opts.start.call( elem, animation );
	}

	jQuery.fx.timer(
		jQuery.extend( tick, {
			elem: elem,
			anim: animation,
			queue: animation.opts.queue
		})
	);

	// attach callbacks from options
	return animation.progress( animation.opts.progress )
		.done( animation.opts.done, animation.opts.complete )
		.fail( animation.opts.fail )
		.always( animation.opts.always );
}

jQuery.Animation = jQuery.extend( Animation, {
	tweener: function( props, callback ) {
		if ( jQuery.isFunction( props ) ) {
			callback = props;
			props = [ "*" ];
		} else {
			props = props.split(" ");
		}

		var prop,
			index = 0,
			length = props.length;

		for ( ; index < length ; index++ ) {
			prop = props[ index ];
			tweeners[ prop ] = tweeners[ prop ] || [];
			tweeners[ prop ].unshift( callback );
		}
	},

	prefilter: function( callback, prepend ) {
		if ( prepend ) {
			animationPrefilters.unshift( callback );
		} else {
			animationPrefilters.push( callback );
		}
	}
});

jQuery.speed = function( speed, easing, fn ) {
	var opt = speed && typeof speed === "object" ? jQuery.extend( {}, speed ) : {
		complete: fn || !fn && easing ||
			jQuery.isFunction( speed ) && speed,
		duration: speed,
		easing: fn && easing || easing && !jQuery.isFunction( easing ) && easing
	};

	opt.duration = jQuery.fx.off ? 0 : typeof opt.duration === "number" ? opt.duration :
		opt.duration in jQuery.fx.speeds ? jQuery.fx.speeds[ opt.duration ] : jQuery.fx.speeds._default;

	// normalize opt.queue - true/undefined/null -> "fx"
	if ( opt.queue == null || opt.queue === true ) {
		opt.queue = "fx";
	}

	// Queueing
	opt.old = opt.complete;

	opt.complete = function() {
		if ( jQuery.isFunction( opt.old ) ) {
			opt.old.call( this );
		}

		if ( opt.queue ) {
			jQuery.dequeue( this, opt.queue );
		}
	};

	return opt;
};

jQuery.fn.extend({
	fadeTo: function( speed, to, easing, callback ) {

		// show any hidden elements after setting opacity to 0
		return this.filter( isHidden ).css( "opacity", 0 ).show()

			// animate to the value specified
			.end().animate({ opacity: to }, speed, easing, callback );
	},
	animate: function( prop, speed, easing, callback ) {
		var empty = jQuery.isEmptyObject( prop ),
			optall = jQuery.speed( speed, easing, callback ),
			doAnimation = function() {
				// Operate on a copy of prop so per-property easing won't be lost
				var anim = Animation( this, jQuery.extend( {}, prop ), optall );

				// Empty animations, or finishing resolves immediately
				if ( empty || jQuery._data( this, "finish" ) ) {
					anim.stop( true );
				}
			};
			doAnimation.finish = doAnimation;

		return empty || optall.queue === false ?
			this.each( doAnimation ) :
			this.queue( optall.queue, doAnimation );
	},
	stop: function( type, clearQueue, gotoEnd ) {
		var stopQueue = function( hooks ) {
			var stop = hooks.stop;
			delete hooks.stop;
			stop( gotoEnd );
		};

		if ( typeof type !== "string" ) {
			gotoEnd = clearQueue;
			clearQueue = type;
			type = undefined;
		}
		if ( clearQueue && type !== false ) {
			this.queue( type || "fx", [] );
		}

		return this.each(function() {
			var dequeue = true,
				index = type != null && type + "queueHooks",
				timers = jQuery.timers,
				data = jQuery._data( this );

			if ( index ) {
				if ( data[ index ] && data[ index ].stop ) {
					stopQueue( data[ index ] );
				}
			} else {
				for ( index in data ) {
					if ( data[ index ] && data[ index ].stop && rrun.test( index ) ) {
						stopQueue( data[ index ] );
					}
				}
			}

			for ( index = timers.length; index--; ) {
				if ( timers[ index ].elem === this && (type == null || timers[ index ].queue === type) ) {
					timers[ index ].anim.stop( gotoEnd );
					dequeue = false;
					timers.splice( index, 1 );
				}
			}

			// start the next in the queue if the last step wasn't forced
			// timers currently will call their complete callbacks, which will dequeue
			// but only if they were gotoEnd
			if ( dequeue || !gotoEnd ) {
				jQuery.dequeue( this, type );
			}
		});
	},
	finish: function( type ) {
		if ( type !== false ) {
			type = type || "fx";
		}
		return this.each(function() {
			var index,
				data = jQuery._data( this ),
				queue = data[ type + "queue" ],
				hooks = data[ type + "queueHooks" ],
				timers = jQuery.timers,
				length = queue ? queue.length : 0;

			// enable finishing flag on private data
			data.finish = true;

			// empty the queue first
			jQuery.queue( this, type, [] );

			if ( hooks && hooks.stop ) {
				hooks.stop.call( this, true );
			}

			// look for any active animations, and finish them
			for ( index = timers.length; index--; ) {
				if ( timers[ index ].elem === this && timers[ index ].queue === type ) {
					timers[ index ].anim.stop( true );
					timers.splice( index, 1 );
				}
			}

			// look for any animations in the old queue and finish them
			for ( index = 0; index < length; index++ ) {
				if ( queue[ index ] && queue[ index ].finish ) {
					queue[ index ].finish.call( this );
				}
			}

			// turn off finishing flag
			delete data.finish;
		});
	}
});

jQuery.each([ "toggle", "show", "hide" ], function( i, name ) {
	var cssFn = jQuery.fn[ name ];
	jQuery.fn[ name ] = function( speed, easing, callback ) {
		return speed == null || typeof speed === "boolean" ?
			cssFn.apply( this, arguments ) :
			this.animate( genFx( name, true ), speed, easing, callback );
	};
});

// Generate shortcuts for custom animations
jQuery.each({
	slideDown: genFx("show"),
	slideUp: genFx("hide"),
	slideToggle: genFx("toggle"),
	fadeIn: { opacity: "show" },
	fadeOut: { opacity: "hide" },
	fadeToggle: { opacity: "toggle" }
}, function( name, props ) {
	jQuery.fn[ name ] = function( speed, easing, callback ) {
		return this.animate( props, speed, easing, callback );
	};
});

jQuery.timers = [];
jQuery.fx.tick = function() {
	var timer,
		timers = jQuery.timers,
		i = 0;

	fxNow = jQuery.now();

	for ( ; i < timers.length; i++ ) {
		timer = timers[ i ];
		// Checks the timer has not already been removed
		if ( !timer() && timers[ i ] === timer ) {
			timers.splice( i--, 1 );
		}
	}

	if ( !timers.length ) {
		jQuery.fx.stop();
	}
	fxNow = undefined;
};

jQuery.fx.timer = function( timer ) {
	jQuery.timers.push( timer );
	if ( timer() ) {
		jQuery.fx.start();
	} else {
		jQuery.timers.pop();
	}
};

jQuery.fx.interval = 13;

jQuery.fx.start = function() {
	if ( !timerId ) {
		timerId = setInterval( jQuery.fx.tick, jQuery.fx.interval );
	}
};

jQuery.fx.stop = function() {
	clearInterval( timerId );
	timerId = null;
};

jQuery.fx.speeds = {
	slow: 600,
	fast: 200,
	// Default speed
	_default: 400
};


// Based off of the plugin by Clint Helfers, with permission.
// http://blindsignals.com/index.php/2009/07/jquery-delay/
jQuery.fn.delay = function( time, type ) {
	time = jQuery.fx ? jQuery.fx.speeds[ time ] || time : time;
	type = type || "fx";

	return this.queue( type, function( next, hooks ) {
		var timeout = setTimeout( next, time );
		hooks.stop = function() {
			clearTimeout( timeout );
		};
	});
};


(function() {
	var a, input, select, opt,
		div = document.createElement("div" );

	// Setup
	div.setAttribute( "className", "t" );
	div.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>";
	a = div.getElementsByTagName("a")[ 0 ];

	// First batch of tests.
	select = document.createElement("select");
	opt = select.appendChild( document.createElement("option") );
	input = div.getElementsByTagName("input")[ 0 ];

	a.style.cssText = "top:1px";

	// Test setAttribute on camelCase class. If it works, we need attrFixes when doing get/setAttribute (ie6/7)
	support.getSetAttribute = div.className !== "t";

	// Get the style information from getAttribute
	// (IE uses .cssText instead)
	support.style = /top/.test( a.getAttribute("style") );

	// Make sure that URLs aren't manipulated
	// (IE normalizes it by default)
	support.hrefNormalized = a.getAttribute("href") === "/a";

	// Check the default checkbox/radio value ("" on WebKit; "on" elsewhere)
	support.checkOn = !!input.value;

	// Make sure that a selected-by-default option has a working selected property.
	// (WebKit defaults to false instead of true, IE too, if it's in an optgroup)
	support.optSelected = opt.selected;

	// Tests for enctype support on a form (#6743)
	support.enctype = !!document.createElement("form").enctype;

	// Make sure that the options inside disabled selects aren't marked as disabled
	// (WebKit marks them as disabled)
	select.disabled = true;
	support.optDisabled = !opt.disabled;

	// Support: IE8 only
	// Check if we can trust getAttribute("value")
	input = document.createElement( "input" );
	input.setAttribute( "value", "" );
	support.input = input.getAttribute( "value" ) === "";

	// Check if an input maintains its value after becoming a radio
	input.value = "t";
	input.setAttribute( "type", "radio" );
	support.radioValue = input.value === "t";

	// Null elements to avoid leaks in IE.
	a = input = select = opt = div = null;
})();


var rreturn = /\r/g;

jQuery.fn.extend({
	val: function( value ) {
		var hooks, ret, isFunction,
			elem = this[0];

		if ( !arguments.length ) {
			if ( elem ) {
				hooks = jQuery.valHooks[ elem.type ] || jQuery.valHooks[ elem.nodeName.toLowerCase() ];

				if ( hooks && "get" in hooks && (ret = hooks.get( elem, "value" )) !== undefined ) {
					return ret;
				}

				ret = elem.value;

				return typeof ret === "string" ?
					// handle most common string cases
					ret.replace(rreturn, "") :
					// handle cases where value is null/undef or number
					ret == null ? "" : ret;
			}

			return;
		}

		isFunction = jQuery.isFunction( value );

		return this.each(function( i ) {
			var val;

			if ( this.nodeType !== 1 ) {
				return;
			}

			if ( isFunction ) {
				val = value.call( this, i, jQuery( this ).val() );
			} else {
				val = value;
			}

			// Treat null/undefined as ""; convert numbers to string
			if ( val == null ) {
				val = "";
			} else if ( typeof val === "number" ) {
				val += "";
			} else if ( jQuery.isArray( val ) ) {
				val = jQuery.map( val, function( value ) {
					return value == null ? "" : value + "";
				});
			}

			hooks = jQuery.valHooks[ this.type ] || jQuery.valHooks[ this.nodeName.toLowerCase() ];

			// If set returns undefined, fall back to normal setting
			if ( !hooks || !("set" in hooks) || hooks.set( this, val, "value" ) === undefined ) {
				this.value = val;
			}
		});
	}
});

jQuery.extend({
	valHooks: {
		option: {
			get: function( elem ) {
				var val = jQuery.find.attr( elem, "value" );
				return val != null ?
					val :
					jQuery.text( elem );
			}
		},
		select: {
			get: function( elem ) {
				var value, option,
					options = elem.options,
					index = elem.selectedIndex,
					one = elem.type === "select-one" || index < 0,
					values = one ? null : [],
					max = one ? index + 1 : options.length,
					i = index < 0 ?
						max :
						one ? index : 0;

				// Loop through all the selected options
				for ( ; i < max; i++ ) {
					option = options[ i ];

					// oldIE doesn't update selected after form reset (#2551)
					if ( ( option.selected || i === index ) &&
							// Don't return options that are disabled or in a disabled optgroup
							( support.optDisabled ? !option.disabled : option.getAttribute("disabled") === null ) &&
							( !option.parentNode.disabled || !jQuery.nodeName( option.parentNode, "optgroup" ) ) ) {

						// Get the specific value for the option
						value = jQuery( option ).val();

						// We don't need an array for one selects
						if ( one ) {
							return value;
						}

						// Multi-Selects return an array
						values.push( value );
					}
				}

				return values;
			},

			set: function( elem, value ) {
				var optionSet, option,
					options = elem.options,
					values = jQuery.makeArray( value ),
					i = options.length;

				while ( i-- ) {
					option = options[ i ];

					if ( jQuery.inArray( jQuery.valHooks.option.get( option ), values ) >= 0 ) {

						// Support: IE6
						// When new option element is added to select box we need to
						// force reflow of newly added node in order to workaround delay
						// of initialization properties
						try {
							option.selected = optionSet = true;

						} catch ( _ ) {

							// Will be executed only in IE6
							option.scrollHeight;
						}

					} else {
						option.selected = false;
					}
				}

				// Force browsers to behave consistently when non-matching value is set
				if ( !optionSet ) {
					elem.selectedIndex = -1;
				}

				return options;
			}
		}
	}
});

// Radios and checkboxes getter/setter
jQuery.each([ "radio", "checkbox" ], function() {
	jQuery.valHooks[ this ] = {
		set: function( elem, value ) {
			if ( jQuery.isArray( value ) ) {
				return ( elem.checked = jQuery.inArray( jQuery(elem).val(), value ) >= 0 );
			}
		}
	};
	if ( !support.checkOn ) {
		jQuery.valHooks[ this ].get = function( elem ) {
			// Support: Webkit
			// "" is returned instead of "on" if a value isn't specified
			return elem.getAttribute("value") === null ? "on" : elem.value;
		};
	}
});




var nodeHook, boolHook,
	attrHandle = jQuery.expr.attrHandle,
	ruseDefault = /^(?:checked|selected)$/i,
	getSetAttribute = support.getSetAttribute,
	getSetInput = support.input;

jQuery.fn.extend({
	attr: function( name, value ) {
		return access( this, jQuery.attr, name, value, arguments.length > 1 );
	},

	removeAttr: function( name ) {
		return this.each(function() {
			jQuery.removeAttr( this, name );
		});
	}
});

jQuery.extend({
	attr: function( elem, name, value ) {
		var hooks, ret,
			nType = elem.nodeType;

		// don't get/set attributes on text, comment and attribute nodes
		if ( !elem || nType === 3 || nType === 8 || nType === 2 ) {
			return;
		}

		// Fallback to prop when attributes are not supported
		if ( typeof elem.getAttribute === strundefined ) {
			return jQuery.prop( elem, name, value );
		}

		// All attributes are lowercase
		// Grab necessary hook if one is defined
		if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {
			name = name.toLowerCase();
			hooks = jQuery.attrHooks[ name ] ||
				( jQuery.expr.match.bool.test( name ) ? boolHook : nodeHook );
		}

		if ( value !== undefined ) {

			if ( value === null ) {
				jQuery.removeAttr( elem, name );

			} else if ( hooks && "set" in hooks && (ret = hooks.set( elem, value, name )) !== undefined ) {
				return ret;

			} else {
				elem.setAttribute( name, value + "" );
				return value;
			}

		} else if ( hooks && "get" in hooks && (ret = hooks.get( elem, name )) !== null ) {
			return ret;

		} else {
			ret = jQuery.find.attr( elem, name );

			// Non-existent attributes return null, we normalize to undefined
			return ret == null ?
				undefined :
				ret;
		}
	},

	removeAttr: function( elem, value ) {
		var name, propName,
			i = 0,
			attrNames = value && value.match( rnotwhite );

		if ( attrNames && elem.nodeType === 1 ) {
			while ( (name = attrNames[i++]) ) {
				propName = jQuery.propFix[ name ] || name;

				// Boolean attributes get special treatment (#10870)
				if ( jQuery.expr.match.bool.test( name ) ) {
					// Set corresponding property to false
					if ( getSetInput && getSetAttribute || !ruseDefault.test( name ) ) {
						elem[ propName ] = false;
					// Support: IE<9
					// Also clear defaultChecked/defaultSelected (if appropriate)
					} else {
						elem[ jQuery.camelCase( "default-" + name ) ] =
							elem[ propName ] = false;
					}

				// See #9699 for explanation of this approach (setting first, then removal)
				} else {
					jQuery.attr( elem, name, "" );
				}

				elem.removeAttribute( getSetAttribute ? name : propName );
			}
		}
	},

	attrHooks: {
		type: {
			set: function( elem, value ) {
				if ( !support.radioValue && value === "radio" && jQuery.nodeName(elem, "input") ) {
					// Setting the type on a radio button after the value resets the value in IE6-9
					// Reset value to default in case type is set after value during creation
					var val = elem.value;
					elem.setAttribute( "type", value );
					if ( val ) {
						elem.value = val;
					}
					return value;
				}
			}
		}
	}
});

// Hook for boolean attributes
boolHook = {
	set: function( elem, value, name ) {
		if ( value === false ) {
			// Remove boolean attributes when set to false
			jQuery.removeAttr( elem, name );
		} else if ( getSetInput && getSetAttribute || !ruseDefault.test( name ) ) {
			// IE<8 needs the *property* name
			elem.setAttribute( !getSetAttribute && jQuery.propFix[ name ] || name, name );

		// Use defaultChecked and defaultSelected for oldIE
		} else {
			elem[ jQuery.camelCase( "default-" + name ) ] = elem[ name ] = true;
		}

		return name;
	}
};

// Retrieve booleans specially
jQuery.each( jQuery.expr.match.bool.source.match( /\w+/g ), function( i, name ) {

	var getter = attrHandle[ name ] || jQuery.find.attr;

	attrHandle[ name ] = getSetInput && getSetAttribute || !ruseDefault.test( name ) ?
		function( elem, name, isXML ) {
			var ret, handle;
			if ( !isXML ) {
				// Avoid an infinite loop by temporarily removing this function from the getter
				handle = attrHandle[ name ];
				attrHandle[ name ] = ret;
				ret = getter( elem, name, isXML ) != null ?
					name.toLowerCase() :
					null;
				attrHandle[ name ] = handle;
			}
			return ret;
		} :
		function( elem, name, isXML ) {
			if ( !isXML ) {
				return elem[ jQuery.camelCase( "default-" + name ) ] ?
					name.toLowerCase() :
					null;
			}
		};
});

// fix oldIE attroperties
if ( !getSetInput || !getSetAttribute ) {
	jQuery.attrHooks.value = {
		set: function( elem, value, name ) {
			if ( jQuery.nodeName( elem, "input" ) ) {
				// Does not return so that setAttribute is also used
				elem.defaultValue = value;
			} else {
				// Use nodeHook if defined (#1954); otherwise setAttribute is fine
				return nodeHook && nodeHook.set( elem, value, name );
			}
		}
	};
}

// IE6/7 do not support getting/setting some attributes with get/setAttribute
if ( !getSetAttribute ) {

	// Use this for any attribute in IE6/7
	// This fixes almost every IE6/7 issue
	nodeHook = {
		set: function( elem, value, name ) {
			// Set the existing or create a new attribute node
			var ret = elem.getAttributeNode( name );
			if ( !ret ) {
				elem.setAttributeNode(
					(ret = elem.ownerDocument.createAttribute( name ))
				);
			}

			ret.value = value += "";

			// Break association with cloned elements by also using setAttribute (#9646)
			if ( name === "value" || value === elem.getAttribute( name ) ) {
				return value;
			}
		}
	};

	// Some attributes are constructed with empty-string values when not defined
	attrHandle.id = attrHandle.name = attrHandle.coords =
		function( elem, name, isXML ) {
			var ret;
			if ( !isXML ) {
				return (ret = elem.getAttributeNode( name )) && ret.value !== "" ?
					ret.value :
					null;
			}
		};

	// Fixing value retrieval on a button requires this module
	jQuery.valHooks.button = {
		get: function( elem, name ) {
			var ret = elem.getAttributeNode( name );
			if ( ret && ret.specified ) {
				return ret.value;
			}
		},
		set: nodeHook.set
	};

	// Set contenteditable to false on removals(#10429)
	// Setting to empty string throws an error as an invalid value
	jQuery.attrHooks.contenteditable = {
		set: function( elem, value, name ) {
			nodeHook.set( elem, value === "" ? false : value, name );
		}
	};

	// Set width and height to auto instead of 0 on empty string( Bug #8150 )
	// This is for removals
	jQuery.each([ "width", "height" ], function( i, name ) {
		jQuery.attrHooks[ name ] = {
			set: function( elem, value ) {
				if ( value === "" ) {
					elem.setAttribute( name, "auto" );
					return value;
				}
			}
		};
	});
}

if ( !support.style ) {
	jQuery.attrHooks.style = {
		get: function( elem ) {
			// Return undefined in the case of empty string
			// Note: IE uppercases css property names, but if we were to .toLowerCase()
			// .cssText, that would destroy case senstitivity in URL's, like in "background"
			return elem.style.cssText || undefined;
		},
		set: function( elem, value ) {
			return ( elem.style.cssText = value + "" );
		}
	};
}




var rfocusable = /^(?:input|select|textarea|button|object)$/i,
	rclickable = /^(?:a|area)$/i;

jQuery.fn.extend({
	prop: function( name, value ) {
		return access( this, jQuery.prop, name, value, arguments.length > 1 );
	},

	removeProp: function( name ) {
		name = jQuery.propFix[ name ] || name;
		return this.each(function() {
			// try/catch handles cases where IE balks (such as removing a property on window)
			try {
				this[ name ] = undefined;
				delete this[ name ];
			} catch( e ) {}
		});
	}
});

jQuery.extend({
	propFix: {
		"for": "htmlFor",
		"class": "className"
	},

	prop: function( elem, name, value ) {
		var ret, hooks, notxml,
			nType = elem.nodeType;

		// don't get/set properties on text, comment and attribute nodes
		if ( !elem || nType === 3 || nType === 8 || nType === 2 ) {
			return;
		}

		notxml = nType !== 1 || !jQuery.isXMLDoc( elem );

		if ( notxml ) {
			// Fix name and attach hooks
			name = jQuery.propFix[ name ] || name;
			hooks = jQuery.propHooks[ name ];
		}

		if ( value !== undefined ) {
			return hooks && "set" in hooks && (ret = hooks.set( elem, value, name )) !== undefined ?
				ret :
				( elem[ name ] = value );

		} else {
			return hooks && "get" in hooks && (ret = hooks.get( elem, name )) !== null ?
				ret :
				elem[ name ];
		}
	},

	propHooks: {
		tabIndex: {
			get: function( elem ) {
				// elem.tabIndex doesn't always return the correct value when it hasn't been explicitly set
				// http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
				// Use proper attribute retrieval(#12072)
				var tabindex = jQuery.find.attr( elem, "tabindex" );

				return tabindex ?
					parseInt( tabindex, 10 ) :
					rfocusable.test( elem.nodeName ) || rclickable.test( elem.nodeName ) && elem.href ?
						0 :
						-1;
			}
		}
	}
});

// Some attributes require a special call on IE
// http://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
if ( !support.hrefNormalized ) {
	// href/src property should get the full normalized URL (#10299/#12915)
	jQuery.each([ "href", "src" ], function( i, name ) {
		jQuery.propHooks[ name ] = {
			get: function( elem ) {
				return elem.getAttribute( name, 4 );
			}
		};
	});
}

// Support: Safari, IE9+
// mis-reports the default selected property of an option
// Accessing the parent's selectedIndex property fixes it
if ( !support.optSelected ) {
	jQuery.propHooks.selected = {
		get: function( elem ) {
			var parent = elem.parentNode;

			if ( parent ) {
				parent.selectedIndex;

				// Make sure that it also works with optgroups, see #5701
				if ( parent.parentNode ) {
					parent.parentNode.selectedIndex;
				}
			}
			return null;
		}
	};
}

jQuery.each([
	"tabIndex",
	"readOnly",
	"maxLength",
	"cellSpacing",
	"cellPadding",
	"rowSpan",
	"colSpan",
	"useMap",
	"frameBorder",
	"contentEditable"
], function() {
	jQuery.propFix[ this.toLowerCase() ] = this;
});

// IE6/7 call enctype encoding
if ( !support.enctype ) {
	jQuery.propFix.enctype = "encoding";
}




var rclass = /[\t\r\n\f]/g;

jQuery.fn.extend({
	addClass: function( value ) {
		var classes, elem, cur, clazz, j, finalValue,
			i = 0,
			len = this.length,
			proceed = typeof value === "string" && value;

		if ( jQuery.isFunction( value ) ) {
			return this.each(function( j ) {
				jQuery( this ).addClass( value.call( this, j, this.className ) );
			});
		}

		if ( proceed ) {
			// The disjunction here is for better compressibility (see removeClass)
			classes = ( value || "" ).match( rnotwhite ) || [];

			for ( ; i < len; i++ ) {
				elem = this[ i ];
				cur = elem.nodeType === 1 && ( elem.className ?
					( " " + elem.className + " " ).replace( rclass, " " ) :
					" "
				);

				if ( cur ) {
					j = 0;
					while ( (clazz = classes[j++]) ) {
						if ( cur.indexOf( " " + clazz + " " ) < 0 ) {
							cur += clazz + " ";
						}
					}

					// only assign if different to avoid unneeded rendering.
					finalValue = jQuery.trim( cur );
					if ( elem.className !== finalValue ) {
						elem.className = finalValue;
					}
				}
			}
		}

		return this;
	},

	removeClass: function( value ) {
		var classes, elem, cur, clazz, j, finalValue,
			i = 0,
			len = this.length,
			proceed = arguments.length === 0 || typeof value === "string" && value;

		if ( jQuery.isFunction( value ) ) {
			return this.each(function( j ) {
				jQuery( this ).removeClass( value.call( this, j, this.className ) );
			});
		}
		if ( proceed ) {
			classes = ( value || "" ).match( rnotwhite ) || [];

			for ( ; i < len; i++ ) {
				elem = this[ i ];
				// This expression is here for better compressibility (see addClass)
				cur = elem.nodeType === 1 && ( elem.className ?
					( " " + elem.className + " " ).replace( rclass, " " ) :
					""
				);

				if ( cur ) {
					j = 0;
					while ( (clazz = classes[j++]) ) {
						// Remove *all* instances
						while ( cur.indexOf( " " + clazz + " " ) >= 0 ) {
							cur = cur.replace( " " + clazz + " ", " " );
						}
					}

					// only assign if different to avoid unneeded rendering.
					finalValue = value ? jQuery.trim( cur ) : "";
					if ( elem.className !== finalValue ) {
						elem.className = finalValue;
					}
				}
			}
		}

		return this;
	},

	toggleClass: function( value, stateVal ) {
		var type = typeof value;

		if ( typeof stateVal === "boolean" && type === "string" ) {
			return stateVal ? this.addClass( value ) : this.removeClass( value );
		}

		if ( jQuery.isFunction( value ) ) {
			return this.each(function( i ) {
				jQuery( this ).toggleClass( value.call(this, i, this.className, stateVal), stateVal );
			});
		}

		return this.each(function() {
			if ( type === "string" ) {
				// toggle individual class names
				var className,
					i = 0,
					self = jQuery( this ),
					classNames = value.match( rnotwhite ) || [];

				while ( (className = classNames[ i++ ]) ) {
					// check each className given, space separated list
					if ( self.hasClass( className ) ) {
						self.removeClass( className );
					} else {
						self.addClass( className );
					}
				}

			// Toggle whole class name
			} else if ( type === strundefined || type === "boolean" ) {
				if ( this.className ) {
					// store className if set
					jQuery._data( this, "__className__", this.className );
				}

				// If the element has a class name or if we're passed "false",
				// then remove the whole classname (if there was one, the above saved it).
				// Otherwise bring back whatever was previously saved (if anything),
				// falling back to the empty string if nothing was stored.
				this.className = this.className || value === false ? "" : jQuery._data( this, "__className__" ) || "";
			}
		});
	},

	hasClass: function( selector ) {
		var className = " " + selector + " ",
			i = 0,
			l = this.length;
		for ( ; i < l; i++ ) {
			if ( this[i].nodeType === 1 && (" " + this[i].className + " ").replace(rclass, " ").indexOf( className ) >= 0 ) {
				return true;
			}
		}

		return false;
	}
});




// Return jQuery for attributes-only inclusion


jQuery.each( ("blur focus focusin focusout load resize scroll unload click dblclick " +
	"mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " +
	"change select submit keydown keypress keyup error contextmenu").split(" "), function( i, name ) {

	// Handle event binding
	jQuery.fn[ name ] = function( data, fn ) {
		return arguments.length > 0 ?
			this.on( name, null, data, fn ) :
			this.trigger( name );
	};
});

jQuery.fn.extend({
	hover: function( fnOver, fnOut ) {
		return this.mouseenter( fnOver ).mouseleave( fnOut || fnOver );
	},

	bind: function( types, data, fn ) {
		return this.on( types, null, data, fn );
	},
	unbind: function( types, fn ) {
		return this.off( types, null, fn );
	},

	delegate: function( selector, types, data, fn ) {
		return this.on( types, selector, data, fn );
	},
	undelegate: function( selector, types, fn ) {
		// ( namespace ) or ( selector, types [, fn] )
		return arguments.length === 1 ? this.off( selector, "**" ) : this.off( types, selector || "**", fn );
	}
});


var nonce = jQuery.now();

var rquery = (/\?/);



var rvalidtokens = /(,)|(\[|{)|(}|])|"(?:[^"\\\r\n]|\\["\\\/bfnrt]|\\u[\da-fA-F]{4})*"\s*:?|true|false|null|-?(?!0\d)\d+(?:\.\d+|)(?:[eE][+-]?\d+|)/g;

jQuery.parseJSON = function( data ) {
	// Attempt to parse using the native JSON parser first
	if ( window.JSON && window.JSON.parse ) {
		// Support: Android 2.3
		// Workaround failure to string-cast null input
		return window.JSON.parse( data + "" );
	}

	var requireNonComma,
		depth = null,
		str = jQuery.trim( data + "" );

	// Guard against invalid (and possibly dangerous) input by ensuring that nothing remains
	// after removing valid tokens
	return str && !jQuery.trim( str.replace( rvalidtokens, function( token, comma, open, close ) {

		// Force termination if we see a misplaced comma
		if ( requireNonComma && comma ) {
			depth = 0;
		}

		// Perform no more replacements after returning to outermost depth
		if ( depth === 0 ) {
			return token;
		}

		// Commas must not follow "[", "{", or ","
		requireNonComma = open || comma;

		// Determine new depth
		// array/object open ("[" or "{"): depth += true - false (increment)
		// array/object close ("]" or "}"): depth += false - true (decrement)
		// other cases ("," or primitive): depth += true - true (numeric cast)
		depth += !close - !open;

		// Remove this token
		return "";
	}) ) ?
		( Function( "return " + str ) )() :
		jQuery.error( "Invalid JSON: " + data );
};


// Cross-browser xml parsing
jQuery.parseXML = function( data ) {
	var xml, tmp;
	if ( !data || typeof data !== "string" ) {
		return null;
	}
	try {
		if ( window.DOMParser ) { // Standard
			tmp = new DOMParser();
			xml = tmp.parseFromString( data, "text/xml" );
		} else { // IE
			xml = new ActiveXObject( "Microsoft.XMLDOM" );
			xml.async = "false";
			xml.loadXML( data );
		}
	} catch( e ) {
		xml = undefined;
	}
	if ( !xml || !xml.documentElement || xml.getElementsByTagName( "parsererror" ).length ) {
		jQuery.error( "Invalid XML: " + data );
	}
	return xml;
};


var
	// Document location
	ajaxLocParts,
	ajaxLocation,

	rhash = /#.*$/,
	rts = /([?&])_=[^&]*/,
	rheaders = /^(.*?):[ \t]*([^\r\n]*)\r?$/mg, // IE leaves an \r character at EOL
	// #7653, #8125, #8152: local protocol detection
	rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/,
	rnoContent = /^(?:GET|HEAD)$/,
	rprotocol = /^\/\//,
	rurl = /^([\w.+-]+:)(?:\/\/(?:[^\/?#]*@|)([^\/?#:]*)(?::(\d+)|)|)/,

	/* Prefilters
	 * 1) They are useful to introduce custom dataTypes (see ajax/jsonp.js for an example)
	 * 2) These are called:
	 *    - BEFORE asking for a transport
	 *    - AFTER param serialization (s.data is a string if s.processData is true)
	 * 3) key is the dataType
	 * 4) the catchall symbol "*" can be used
	 * 5) execution will start with transport dataType and THEN continue down to "*" if needed
	 */
	prefilters = {},

	/* Transports bindings
	 * 1) key is the dataType
	 * 2) the catchall symbol "*" can be used
	 * 3) selection will start with transport dataType and THEN go to "*" if needed
	 */
	transports = {},

	// Avoid comment-prolog char sequence (#10098); must appease lint and evade compression
	allTypes = "*/".concat("*");

// #8138, IE may throw an exception when accessing
// a field from window.location if document.domain has been set
try {
	ajaxLocation = location.href;
} catch( e ) {
	// Use the href attribute of an A element
	// since IE will modify it given document.location
	ajaxLocation = document.createElement( "a" );
	ajaxLocation.href = "";
	ajaxLocation = ajaxLocation.href;
}

// Segment location into parts
ajaxLocParts = rurl.exec( ajaxLocation.toLowerCase() ) || [];

// Base "constructor" for jQuery.ajaxPrefilter and jQuery.ajaxTransport
function addToPrefiltersOrTransports( structure ) {

	// dataTypeExpression is optional and defaults to "*"
	return function( dataTypeExpression, func ) {

		if ( typeof dataTypeExpression !== "string" ) {
			func = dataTypeExpression;
			dataTypeExpression = "*";
		}

		var dataType,
			i = 0,
			dataTypes = dataTypeExpression.toLowerCase().match( rnotwhite ) || [];

		if ( jQuery.isFunction( func ) ) {
			// For each dataType in the dataTypeExpression
			while ( (dataType = dataTypes[i++]) ) {
				// Prepend if requested
				if ( dataType.charAt( 0 ) === "+" ) {
					dataType = dataType.slice( 1 ) || "*";
					(structure[ dataType ] = structure[ dataType ] || []).unshift( func );

				// Otherwise append
				} else {
					(structure[ dataType ] = structure[ dataType ] || []).push( func );
				}
			}
		}
	};
}

// Base inspection function for prefilters and transports
function inspectPrefiltersOrTransports( structure, options, originalOptions, jqXHR ) {

	var inspected = {},
		seekingTransport = ( structure === transports );

	function inspect( dataType ) {
		var selected;
		inspected[ dataType ] = true;
		jQuery.each( structure[ dataType ] || [], function( _, prefilterOrFactory ) {
			var dataTypeOrTransport = prefilterOrFactory( options, originalOptions, jqXHR );
			if ( typeof dataTypeOrTransport === "string" && !seekingTransport && !inspected[ dataTypeOrTransport ] ) {
				options.dataTypes.unshift( dataTypeOrTransport );
				inspect( dataTypeOrTransport );
				return false;
			} else if ( seekingTransport ) {
				return !( selected = dataTypeOrTransport );
			}
		});
		return selected;
	}

	return inspect( options.dataTypes[ 0 ] ) || !inspected[ "*" ] && inspect( "*" );
}

// A special extend for ajax options
// that takes "flat" options (not to be deep extended)
// Fixes #9887
function ajaxExtend( target, src ) {
	var deep, key,
		flatOptions = jQuery.ajaxSettings.flatOptions || {};

	for ( key in src ) {
		if ( src[ key ] !== undefined ) {
			( flatOptions[ key ] ? target : ( deep || (deep = {}) ) )[ key ] = src[ key ];
		}
	}
	if ( deep ) {
		jQuery.extend( true, target, deep );
	}

	return target;
}

/* Handles responses to an ajax request:
 * - finds the right dataType (mediates between content-type and expected dataType)
 * - returns the corresponding response
 */
function ajaxHandleResponses( s, jqXHR, responses ) {
	var firstDataType, ct, finalDataType, type,
		contents = s.contents,
		dataTypes = s.dataTypes;

	// Remove auto dataType and get content-type in the process
	while ( dataTypes[ 0 ] === "*" ) {
		dataTypes.shift();
		if ( ct === undefined ) {
			ct = s.mimeType || jqXHR.getResponseHeader("Content-Type");
		}
	}

	// Check if we're dealing with a known content-type
	if ( ct ) {
		for ( type in contents ) {
			if ( contents[ type ] && contents[ type ].test( ct ) ) {
				dataTypes.unshift( type );
				break;
			}
		}
	}

	// Check to see if we have a response for the expected dataType
	if ( dataTypes[ 0 ] in responses ) {
		finalDataType = dataTypes[ 0 ];
	} else {
		// Try convertible dataTypes
		for ( type in responses ) {
			if ( !dataTypes[ 0 ] || s.converters[ type + " " + dataTypes[0] ] ) {
				finalDataType = type;
				break;
			}
			if ( !firstDataType ) {
				firstDataType = type;
			}
		}
		// Or just use first one
		finalDataType = finalDataType || firstDataType;
	}

	// If we found a dataType
	// We add the dataType to the list if needed
	// and return the corresponding response
	if ( finalDataType ) {
		if ( finalDataType !== dataTypes[ 0 ] ) {
			dataTypes.unshift( finalDataType );
		}
		return responses[ finalDataType ];
	}
}

/* Chain conversions given the request and the original response
 * Also sets the responseXXX fields on the jqXHR instance
 */
function ajaxConvert( s, response, jqXHR, isSuccess ) {
	var conv2, current, conv, tmp, prev,
		converters = {},
		// Work with a copy of dataTypes in case we need to modify it for conversion
		dataTypes = s.dataTypes.slice();

	// Create converters map with lowercased keys
	if ( dataTypes[ 1 ] ) {
		for ( conv in s.converters ) {
			converters[ conv.toLowerCase() ] = s.converters[ conv ];
		}
	}

	current = dataTypes.shift();

	// Convert to each sequential dataType
	while ( current ) {

		if ( s.responseFields[ current ] ) {
			jqXHR[ s.responseFields[ current ] ] = response;
		}

		// Apply the dataFilter if provided
		if ( !prev && isSuccess && s.dataFilter ) {
			response = s.dataFilter( response, s.dataType );
		}

		prev = current;
		current = dataTypes.shift();

		if ( current ) {

			// There's only work to do if current dataType is non-auto
			if ( current === "*" ) {

				current = prev;

			// Convert response if prev dataType is non-auto and differs from current
			} else if ( prev !== "*" && prev !== current ) {

				// Seek a direct converter
				conv = converters[ prev + " " + current ] || converters[ "* " + current ];

				// If none found, seek a pair
				if ( !conv ) {
					for ( conv2 in converters ) {

						// If conv2 outputs current
						tmp = conv2.split( " " );
						if ( tmp[ 1 ] === current ) {

							// If prev can be converted to accepted input
							conv = converters[ prev + " " + tmp[ 0 ] ] ||
								converters[ "* " + tmp[ 0 ] ];
							if ( conv ) {
								// Condense equivalence converters
								if ( conv === true ) {
									conv = converters[ conv2 ];

								// Otherwise, insert the intermediate dataType
								} else if ( converters[ conv2 ] !== true ) {
									current = tmp[ 0 ];
									dataTypes.unshift( tmp[ 1 ] );
								}
								break;
							}
						}
					}
				}

				// Apply converter (if not an equivalence)
				if ( conv !== true ) {

					// Unless errors are allowed to bubble, catch and return them
					if ( conv && s[ "throws" ] ) {
						response = conv( response );
					} else {
						try {
							response = conv( response );
						} catch ( e ) {
							return { state: "parsererror", error: conv ? e : "No conversion from " + prev + " to " + current };
						}
					}
				}
			}
		}
	}

	return { state: "success", data: response };
}

jQuery.extend({

	// Counter for holding the number of active queries
	active: 0,

	// Last-Modified header cache for next request
	lastModified: {},
	etag: {},

	ajaxSettings: {
		url: ajaxLocation,
		type: "GET",
		isLocal: rlocalProtocol.test( ajaxLocParts[ 1 ] ),
		global: true,
		processData: true,
		async: true,
		contentType: "application/x-www-form-urlencoded; charset=UTF-8",
		/*
		timeout: 0,
		data: null,
		dataType: null,
		username: null,
		password: null,
		cache: null,
		throws: false,
		traditional: false,
		headers: {},
		*/

		accepts: {
			"*": allTypes,
			text: "text/plain",
			html: "text/html",
			xml: "application/xml, text/xml",
			json: "application/json, text/javascript"
		},

		contents: {
			xml: /xml/,
			html: /html/,
			json: /json/
		},

		responseFields: {
			xml: "responseXML",
			text: "responseText",
			json: "responseJSON"
		},

		// Data converters
		// Keys separate source (or catchall "*") and destination types with a single space
		converters: {

			// Convert anything to text
			"* text": String,

			// Text to html (true = no transformation)
			"text html": true,

			// Evaluate text as a json expression
			"text json": jQuery.parseJSON,

			// Parse text as xml
			"text xml": jQuery.parseXML
		},

		// For options that shouldn't be deep extended:
		// you can add your own custom options here if
		// and when you create one that shouldn't be
		// deep extended (see ajaxExtend)
		flatOptions: {
			url: true,
			context: true
		}
	},

	// Creates a full fledged settings object into target
	// with both ajaxSettings and settings fields.
	// If target is omitted, writes into ajaxSettings.
	ajaxSetup: function( target, settings ) {
		return settings ?

			// Building a settings object
			ajaxExtend( ajaxExtend( target, jQuery.ajaxSettings ), settings ) :

			// Extending ajaxSettings
			ajaxExtend( jQuery.ajaxSettings, target );
	},

	ajaxPrefilter: addToPrefiltersOrTransports( prefilters ),
	ajaxTransport: addToPrefiltersOrTransports( transports ),

	// Main method
	ajax: function( url, options ) {

		// If url is an object, simulate pre-1.5 signature
		if ( typeof url === "object" ) {
			options = url;
			url = undefined;
		}

		// Force options to be an object
		options = options || {};

		var // Cross-domain detection vars
			parts,
			// Loop variable
			i,
			// URL without anti-cache param
			cacheURL,
			// Response headers as string
			responseHeadersString,
			// timeout handle
			timeoutTimer,

			// To know if global events are to be dispatched
			fireGlobals,

			transport,
			// Response headers
			responseHeaders,
			// Create the final options object
			s = jQuery.ajaxSetup( {}, options ),
			// Callbacks context
			callbackContext = s.context || s,
			// Context for global events is callbackContext if it is a DOM node or jQuery collection
			globalEventContext = s.context && ( callbackContext.nodeType || callbackContext.jquery ) ?
				jQuery( callbackContext ) :
				jQuery.event,
			// Deferreds
			deferred = jQuery.Deferred(),
			completeDeferred = jQuery.Callbacks("once memory"),
			// Status-dependent callbacks
			statusCode = s.statusCode || {},
			// Headers (they are sent all at once)
			requestHeaders = {},
			requestHeadersNames = {},
			// The jqXHR state
			state = 0,
			// Default abort message
			strAbort = "canceled",
			// Fake xhr
			jqXHR = {
				readyState: 0,

				// Builds headers hashtable if needed
				getResponseHeader: function( key ) {
					var match;
					if ( state === 2 ) {
						if ( !responseHeaders ) {
							responseHeaders = {};
							while ( (match = rheaders.exec( responseHeadersString )) ) {
								responseHeaders[ match[1].toLowerCase() ] = match[ 2 ];
							}
						}
						match = responseHeaders[ key.toLowerCase() ];
					}
					return match == null ? null : match;
				},

				// Raw string
				getAllResponseHeaders: function() {
					return state === 2 ? responseHeadersString : null;
				},

				// Caches the header
				setRequestHeader: function( name, value ) {
					var lname = name.toLowerCase();
					if ( !state ) {
						name = requestHeadersNames[ lname ] = requestHeadersNames[ lname ] || name;
						requestHeaders[ name ] = value;
					}
					return this;
				},

				// Overrides response content-type header
				overrideMimeType: function( type ) {
					if ( !state ) {
						s.mimeType = type;
					}
					return this;
				},

				// Status-dependent callbacks
				statusCode: function( map ) {
					var code;
					if ( map ) {
						if ( state < 2 ) {
							for ( code in map ) {
								// Lazy-add the new callback in a way that preserves old ones
								statusCode[ code ] = [ statusCode[ code ], map[ code ] ];
							}
						} else {
							// Execute the appropriate callbacks
							jqXHR.always( map[ jqXHR.status ] );
						}
					}
					return this;
				},

				// Cancel the request
				abort: function( statusText ) {
					var finalText = statusText || strAbort;
					if ( transport ) {
						transport.abort( finalText );
					}
					done( 0, finalText );
					return this;
				}
			};

		// Attach deferreds
		deferred.promise( jqXHR ).complete = completeDeferred.add;
		jqXHR.success = jqXHR.done;
		jqXHR.error = jqXHR.fail;

		// Remove hash character (#7531: and string promotion)
		// Add protocol if not provided (#5866: IE7 issue with protocol-less urls)
		// Handle falsy url in the settings object (#10093: consistency with old signature)
		// We also use the url parameter if available
		s.url = ( ( url || s.url || ajaxLocation ) + "" ).replace( rhash, "" ).replace( rprotocol, ajaxLocParts[ 1 ] + "//" );

		// Alias method option to type as per ticket #12004
		s.type = options.method || options.type || s.method || s.type;

		// Extract dataTypes list
		s.dataTypes = jQuery.trim( s.dataType || "*" ).toLowerCase().match( rnotwhite ) || [ "" ];

		// A cross-domain request is in order when we have a protocol:host:port mismatch
		if ( s.crossDomain == null ) {
			parts = rurl.exec( s.url.toLowerCase() );
			s.crossDomain = !!( parts &&
				( parts[ 1 ] !== ajaxLocParts[ 1 ] || parts[ 2 ] !== ajaxLocParts[ 2 ] ||
					( parts[ 3 ] || ( parts[ 1 ] === "http:" ? "80" : "443" ) ) !==
						( ajaxLocParts[ 3 ] || ( ajaxLocParts[ 1 ] === "http:" ? "80" : "443" ) ) )
			);
		}

		// Convert data if not already a string
		if ( s.data && s.processData && typeof s.data !== "string" ) {
			s.data = jQuery.param( s.data, s.traditional );
		}

		// Apply prefilters
		inspectPrefiltersOrTransports( prefilters, s, options, jqXHR );

		// If request was aborted inside a prefilter, stop there
		if ( state === 2 ) {
			return jqXHR;
		}

		// We can fire global events as of now if asked to
		fireGlobals = s.global;

		// Watch for a new set of requests
		if ( fireGlobals && jQuery.active++ === 0 ) {
			jQuery.event.trigger("ajaxStart");
		}

		// Uppercase the type
		s.type = s.type.toUpperCase();

		// Determine if request has content
		s.hasContent = !rnoContent.test( s.type );

		// Save the URL in case we're toying with the If-Modified-Since
		// and/or If-None-Match header later on
		cacheURL = s.url;

		// More options handling for requests with no content
		if ( !s.hasContent ) {

			// If data is available, append data to url
			if ( s.data ) {
				cacheURL = ( s.url += ( rquery.test( cacheURL ) ? "&" : "?" ) + s.data );
				// #9682: remove data so that it's not used in an eventual retry
				delete s.data;
			}

			// Add anti-cache in url if needed
			if ( s.cache === false ) {
				s.url = rts.test( cacheURL ) ?

					// If there is already a '_' parameter, set its value
					cacheURL.replace( rts, "$1_=" + nonce++ ) :

					// Otherwise add one to the end
					cacheURL + ( rquery.test( cacheURL ) ? "&" : "?" ) + "_=" + nonce++;
			}
		}

		// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
		if ( s.ifModified ) {
			if ( jQuery.lastModified[ cacheURL ] ) {
				jqXHR.setRequestHeader( "If-Modified-Since", jQuery.lastModified[ cacheURL ] );
			}
			if ( jQuery.etag[ cacheURL ] ) {
				jqXHR.setRequestHeader( "If-None-Match", jQuery.etag[ cacheURL ] );
			}
		}

		// Set the correct header, if data is being sent
		if ( s.data && s.hasContent && s.contentType !== false || options.contentType ) {
			jqXHR.setRequestHeader( "Content-Type", s.contentType );
		}

		// Set the Accepts header for the server, depending on the dataType
		jqXHR.setRequestHeader(
			"Accept",
			s.dataTypes[ 0 ] && s.accepts[ s.dataTypes[0] ] ?
				s.accepts[ s.dataTypes[0] ] + ( s.dataTypes[ 0 ] !== "*" ? ", " + allTypes + "; q=0.01" : "" ) :
				s.accepts[ "*" ]
		);

		// Check for headers option
		for ( i in s.headers ) {
			jqXHR.setRequestHeader( i, s.headers[ i ] );
		}

		// Allow custom headers/mimetypes and early abort
		if ( s.beforeSend && ( s.beforeSend.call( callbackContext, jqXHR, s ) === false || state === 2 ) ) {
			// Abort if not done already and return
			return jqXHR.abort();
		}

		// aborting is no longer a cancellation
		strAbort = "abort";

		// Install callbacks on deferreds
		for ( i in { success: 1, error: 1, complete: 1 } ) {
			jqXHR[ i ]( s[ i ] );
		}

		// Get transport
		transport = inspectPrefiltersOrTransports( transports, s, options, jqXHR );

		// If no transport, we auto-abort
		if ( !transport ) {
			done( -1, "No Transport" );
		} else {
			jqXHR.readyState = 1;

			// Send global event
			if ( fireGlobals ) {
				globalEventContext.trigger( "ajaxSend", [ jqXHR, s ] );
			}
			// Timeout
			if ( s.async && s.timeout > 0 ) {
				timeoutTimer = setTimeout(function() {
					jqXHR.abort("timeout");
				}, s.timeout );
			}

			try {
				state = 1;
				transport.send( requestHeaders, done );
			} catch ( e ) {
				// Propagate exception as error if not done
				if ( state < 2 ) {
					done( -1, e );
				// Simply rethrow otherwise
				} else {
					throw e;
				}
			}
		}

		// Callback for when everything is done
		function done( status, nativeStatusText, responses, headers ) {
			var isSuccess, success, error, response, modified,
				statusText = nativeStatusText;

			// Called once
			if ( state === 2 ) {
				return;
			}

			// State is "done" now
			state = 2;

			// Clear timeout if it exists
			if ( timeoutTimer ) {
				clearTimeout( timeoutTimer );
			}

			// Dereference transport for early garbage collection
			// (no matter how long the jqXHR object will be used)
			transport = undefined;

			// Cache response headers
			responseHeadersString = headers || "";

			// Set readyState
			jqXHR.readyState = status > 0 ? 4 : 0;

			// Determine if successful
			isSuccess = status >= 200 && status < 300 || status === 304;

			// Get response data
			if ( responses ) {
				response = ajaxHandleResponses( s, jqXHR, responses );
			}

			// Convert no matter what (that way responseXXX fields are always set)
			response = ajaxConvert( s, response, jqXHR, isSuccess );

			// If successful, handle type chaining
			if ( isSuccess ) {

				// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
				if ( s.ifModified ) {
					modified = jqXHR.getResponseHeader("Last-Modified");
					if ( modified ) {
						jQuery.lastModified[ cacheURL ] = modified;
					}
					modified = jqXHR.getResponseHeader("etag");
					if ( modified ) {
						jQuery.etag[ cacheURL ] = modified;
					}
				}

				// if no content
				if ( status === 204 || s.type === "HEAD" ) {
					statusText = "nocontent";

				// if not modified
				} else if ( status === 304 ) {
					statusText = "notmodified";

				// If we have data, let's convert it
				} else {
					statusText = response.state;
					success = response.data;
					error = response.error;
					isSuccess = !error;
				}
			} else {
				// We extract error from statusText
				// then normalize statusText and status for non-aborts
				error = statusText;
				if ( status || !statusText ) {
					statusText = "error";
					if ( status < 0 ) {
						status = 0;
					}
				}
			}

			// Set data for the fake xhr object
			jqXHR.status = status;
			jqXHR.statusText = ( nativeStatusText || statusText ) + "";

			// Success/Error
			if ( isSuccess ) {
				deferred.resolveWith( callbackContext, [ success, statusText, jqXHR ] );
			} else {
				deferred.rejectWith( callbackContext, [ jqXHR, statusText, error ] );
			}

			// Status-dependent callbacks
			jqXHR.statusCode( statusCode );
			statusCode = undefined;

			if ( fireGlobals ) {
				globalEventContext.trigger( isSuccess ? "ajaxSuccess" : "ajaxError",
					[ jqXHR, s, isSuccess ? success : error ] );
			}

			// Complete
			completeDeferred.fireWith( callbackContext, [ jqXHR, statusText ] );

			if ( fireGlobals ) {
				globalEventContext.trigger( "ajaxComplete", [ jqXHR, s ] );
				// Handle the global AJAX counter
				if ( !( --jQuery.active ) ) {
					jQuery.event.trigger("ajaxStop");
				}
			}
		}

		return jqXHR;
	},

	getJSON: function( url, data, callback ) {
		return jQuery.get( url, data, callback, "json" );
	},

	getScript: function( url, callback ) {
		return jQuery.get( url, undefined, callback, "script" );
	}
});

jQuery.each( [ "get", "post" ], function( i, method ) {
	jQuery[ method ] = function( url, data, callback, type ) {
		// shift arguments if data argument was omitted
		if ( jQuery.isFunction( data ) ) {
			type = type || callback;
			callback = data;
			data = undefined;
		}

		return jQuery.ajax({
			url: url,
			type: method,
			dataType: type,
			data: data,
			success: callback
		});
	};
});

// Attach a bunch of functions for handling common AJAX events
jQuery.each( [ "ajaxStart", "ajaxStop", "ajaxComplete", "ajaxError", "ajaxSuccess", "ajaxSend" ], function( i, type ) {
	jQuery.fn[ type ] = function( fn ) {
		return this.on( type, fn );
	};
});


jQuery._evalUrl = function( url ) {
	return jQuery.ajax({
		url: url,
		type: "GET",
		dataType: "script",
		async: false,
		global: false,
		"throws": true
	});
};


jQuery.fn.extend({
	wrapAll: function( html ) {
		if ( jQuery.isFunction( html ) ) {
			return this.each(function(i) {
				jQuery(this).wrapAll( html.call(this, i) );
			});
		}

		if ( this[0] ) {
			// The elements to wrap the target around
			var wrap = jQuery( html, this[0].ownerDocument ).eq(0).clone(true);

			if ( this[0].parentNode ) {
				wrap.insertBefore( this[0] );
			}

			wrap.map(function() {
				var elem = this;

				while ( elem.firstChild && elem.firstChild.nodeType === 1 ) {
					elem = elem.firstChild;
				}

				return elem;
			}).append( this );
		}

		return this;
	},

	wrapInner: function( html ) {
		if ( jQuery.isFunction( html ) ) {
			return this.each(function(i) {
				jQuery(this).wrapInner( html.call(this, i) );
			});
		}

		return this.each(function() {
			var self = jQuery( this ),
				contents = self.contents();

			if ( contents.length ) {
				contents.wrapAll( html );

			} else {
				self.append( html );
			}
		});
	},

	wrap: function( html ) {
		var isFunction = jQuery.isFunction( html );

		return this.each(function(i) {
			jQuery( this ).wrapAll( isFunction ? html.call(this, i) : html );
		});
	},

	unwrap: function() {
		return this.parent().each(function() {
			if ( !jQuery.nodeName( this, "body" ) ) {
				jQuery( this ).replaceWith( this.childNodes );
			}
		}).end();
	}
});


jQuery.expr.filters.hidden = function( elem ) {
	// Support: Opera <= 12.12
	// Opera reports offsetWidths and offsetHeights less than zero on some elements
	return elem.offsetWidth <= 0 && elem.offsetHeight <= 0 ||
		(!support.reliableHiddenOffsets() &&
			((elem.style && elem.style.display) || jQuery.css( elem, "display" )) === "none");
};

jQuery.expr.filters.visible = function( elem ) {
	return !jQuery.expr.filters.hidden( elem );
};




var r20 = /%20/g,
	rbracket = /\[\]$/,
	rCRLF = /\r?\n/g,
	rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i,
	rsubmittable = /^(?:input|select|textarea|keygen)/i;

function buildParams( prefix, obj, traditional, add ) {
	var name;

	if ( jQuery.isArray( obj ) ) {
		// Serialize array item.
		jQuery.each( obj, function( i, v ) {
			if ( traditional || rbracket.test( prefix ) ) {
				// Treat each array item as a scalar.
				add( prefix, v );

			} else {
				// Item is non-scalar (array or object), encode its numeric index.
				buildParams( prefix + "[" + ( typeof v === "object" ? i : "" ) + "]", v, traditional, add );
			}
		});

	} else if ( !traditional && jQuery.type( obj ) === "object" ) {
		// Serialize object item.
		for ( name in obj ) {
			buildParams( prefix + "[" + name + "]", obj[ name ], traditional, add );
		}

	} else {
		// Serialize scalar item.
		add( prefix, obj );
	}
}

// Serialize an array of form elements or a set of
// key/values into a query string
jQuery.param = function( a, traditional ) {
	var prefix,
		s = [],
		add = function( key, value ) {
			// If value is a function, invoke it and return its value
			value = jQuery.isFunction( value ) ? value() : ( value == null ? "" : value );
			s[ s.length ] = encodeURIComponent( key ) + "=" + encodeURIComponent( value );
		};

	// Set traditional to true for jQuery <= 1.3.2 behavior.
	if ( traditional === undefined ) {
		traditional = jQuery.ajaxSettings && jQuery.ajaxSettings.traditional;
	}

	// If an array was passed in, assume that it is an array of form elements.
	if ( jQuery.isArray( a ) || ( a.jquery && !jQuery.isPlainObject( a ) ) ) {
		// Serialize the form elements
		jQuery.each( a, function() {
			add( this.name, this.value );
		});

	} else {
		// If traditional, encode the "old" way (the way 1.3.2 or older
		// did it), otherwise encode params recursively.
		for ( prefix in a ) {
			buildParams( prefix, a[ prefix ], traditional, add );
		}
	}

	// Return the resulting serialization
	return s.join( "&" ).replace( r20, "+" );
};

jQuery.fn.extend({
	serialize: function() {
		return jQuery.param( this.serializeArray() );
	},
	serializeArray: function() {
		return this.map(function() {
			// Can add propHook for "elements" to filter or add form elements
			var elements = jQuery.prop( this, "elements" );
			return elements ? jQuery.makeArray( elements ) : this;
		})
		.filter(function() {
			var type = this.type;
			// Use .is(":disabled") so that fieldset[disabled] works
			return this.name && !jQuery( this ).is( ":disabled" ) &&
				rsubmittable.test( this.nodeName ) && !rsubmitterTypes.test( type ) &&
				( this.checked || !rcheckableType.test( type ) );
		})
		.map(function( i, elem ) {
			var val = jQuery( this ).val();

			return val == null ?
				null :
				jQuery.isArray( val ) ?
					jQuery.map( val, function( val ) {
						return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
					}) :
					{ name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
		}).get();
	}
});


// Create the request object
// (This is still attached to ajaxSettings for backward compatibility)
jQuery.ajaxSettings.xhr = window.ActiveXObject !== undefined ?
	// Support: IE6+
	function() {

		// XHR cannot access local files, always use ActiveX for that case
		return !this.isLocal &&

			// Support: IE7-8
			// oldIE XHR does not support non-RFC2616 methods (#13240)
			// See http://msdn.microsoft.com/en-us/library/ie/ms536648(v=vs.85).aspx
			// and http://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html#sec9
			// Although this check for six methods instead of eight
			// since IE also does not support "trace" and "connect"
			/^(get|post|head|put|delete|options)$/i.test( this.type ) &&

			createStandardXHR() || createActiveXHR();
	} :
	// For all other browsers, use the standard XMLHttpRequest object
	createStandardXHR;

var xhrId = 0,
	xhrCallbacks = {},
	xhrSupported = jQuery.ajaxSettings.xhr();

// Support: IE<10
// Open requests must be manually aborted on unload (#5280)
if ( window.ActiveXObject ) {
	jQuery( window ).on( "unload", function() {
		for ( var key in xhrCallbacks ) {
			xhrCallbacks[ key ]( undefined, true );
		}
	});
}

// Determine support properties
support.cors = !!xhrSupported && ( "withCredentials" in xhrSupported );
xhrSupported = support.ajax = !!xhrSupported;

// Create transport if the browser can provide an xhr
if ( xhrSupported ) {

	jQuery.ajaxTransport(function( options ) {
		// Cross domain only allowed if supported through XMLHttpRequest
		if ( !options.crossDomain || support.cors ) {

			var callback;

			return {
				send: function( headers, complete ) {
					var i,
						xhr = options.xhr(),
						id = ++xhrId;

					// Open the socket
					xhr.open( options.type, options.url, options.async, options.username, options.password );

					// Apply custom fields if provided
					if ( options.xhrFields ) {
						for ( i in options.xhrFields ) {
							xhr[ i ] = options.xhrFields[ i ];
						}
					}

					// Override mime type if needed
					if ( options.mimeType && xhr.overrideMimeType ) {
						xhr.overrideMimeType( options.mimeType );
					}

					// X-Requested-With header
					// For cross-domain requests, seeing as conditions for a preflight are
					// akin to a jigsaw puzzle, we simply never set it to be sure.
					// (it can always be set on a per-request basis or even using ajaxSetup)
					// For same-domain requests, won't change header if already provided.
					if ( !options.crossDomain && !headers["X-Requested-With"] ) {
						headers["X-Requested-With"] = "XMLHttpRequest";
					}

					// Set headers
					for ( i in headers ) {
						// Support: IE<9
						// IE's ActiveXObject throws a 'Type Mismatch' exception when setting
						// request header to a null-value.
						//
						// To keep consistent with other XHR implementations, cast the value
						// to string and ignore `undefined`.
						if ( headers[ i ] !== undefined ) {
							xhr.setRequestHeader( i, headers[ i ] + "" );
						}
					}

					// Do send the request
					// This may raise an exception which is actually
					// handled in jQuery.ajax (so no try/catch here)
					xhr.send( ( options.hasContent && options.data ) || null );

					// Listener
					callback = function( _, isAbort ) {
						var status, statusText, responses;

						// Was never called and is aborted or complete
						if ( callback && ( isAbort || xhr.readyState === 4 ) ) {
							// Clean up
							delete xhrCallbacks[ id ];
							callback = undefined;
							xhr.onreadystatechange = jQuery.noop;

							// Abort manually if needed
							if ( isAbort ) {
								if ( xhr.readyState !== 4 ) {
									xhr.abort();
								}
							} else {
								responses = {};
								status = xhr.status;

								// Support: IE<10
								// Accessing binary-data responseText throws an exception
								// (#11426)
								if ( typeof xhr.responseText === "string" ) {
									responses.text = xhr.responseText;
								}

								// Firefox throws an exception when accessing
								// statusText for faulty cross-domain requests
								try {
									statusText = xhr.statusText;
								} catch( e ) {
									// We normalize with Webkit giving an empty statusText
									statusText = "";
								}

								// Filter status for non standard behaviors

								// If the request is local and we have data: assume a success
								// (success with no data won't get notified, that's the best we
								// can do given current implementations)
								if ( !status && options.isLocal && !options.crossDomain ) {
									status = responses.text ? 200 : 404;
								// IE - #1450: sometimes returns 1223 when it should be 204
								} else if ( status === 1223 ) {
									status = 204;
								}
							}
						}

						// Call complete if needed
						if ( responses ) {
							complete( status, statusText, responses, xhr.getAllResponseHeaders() );
						}
					};

					if ( !options.async ) {
						// if we're in sync mode we fire the callback
						callback();
					} else if ( xhr.readyState === 4 ) {
						// (IE6 & IE7) if it's in cache and has been
						// retrieved directly we need to fire the callback
						setTimeout( callback );
					} else {
						// Add to the list of active xhr callbacks
						xhr.onreadystatechange = xhrCallbacks[ id ] = callback;
					}
				},

				abort: function() {
					if ( callback ) {
						callback( undefined, true );
					}
				}
			};
		}
	});
}

// Functions to create xhrs
function createStandardXHR() {
	try {
		return new window.XMLHttpRequest();
	} catch( e ) {}
}

function createActiveXHR() {
	try {
		return new window.ActiveXObject( "Microsoft.XMLHTTP" );
	} catch( e ) {}
}




// Install script dataType
jQuery.ajaxSetup({
	accepts: {
		script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"
	},
	contents: {
		script: /(?:java|ecma)script/
	},
	converters: {
		"text script": function( text ) {
			jQuery.globalEval( text );
			return text;
		}
	}
});

// Handle cache's special case and global
jQuery.ajaxPrefilter( "script", function( s ) {
	if ( s.cache === undefined ) {
		s.cache = false;
	}
	if ( s.crossDomain ) {
		s.type = "GET";
		s.global = false;
	}
});

// Bind script tag hack transport
jQuery.ajaxTransport( "script", function(s) {

	// This transport only deals with cross domain requests
	if ( s.crossDomain ) {

		var script,
			head = document.head || jQuery("head")[0] || document.documentElement;

		return {

			send: function( _, callback ) {

				script = document.createElement("script");

				script.async = true;

				if ( s.scriptCharset ) {
					script.charset = s.scriptCharset;
				}

				script.src = s.url;

				// Attach handlers for all browsers
				script.onload = script.onreadystatechange = function( _, isAbort ) {

					if ( isAbort || !script.readyState || /loaded|complete/.test( script.readyState ) ) {

						// Handle memory leak in IE
						script.onload = script.onreadystatechange = null;

						// Remove the script
						if ( script.parentNode ) {
							script.parentNode.removeChild( script );
						}

						// Dereference the script
						script = null;

						// Callback if not abort
						if ( !isAbort ) {
							callback( 200, "success" );
						}
					}
				};

				// Circumvent IE6 bugs with base elements (#2709 and #4378) by prepending
				// Use native DOM manipulation to avoid our domManip AJAX trickery
				head.insertBefore( script, head.firstChild );
			},

			abort: function() {
				if ( script ) {
					script.onload( undefined, true );
				}
			}
		};
	}
});




var oldCallbacks = [],
	rjsonp = /(=)\?(?=&|$)|\?\?/;

// Default jsonp settings
jQuery.ajaxSetup({
	jsonp: "callback",
	jsonpCallback: function() {
		var callback = oldCallbacks.pop() || ( jQuery.expando + "_" + ( nonce++ ) );
		this[ callback ] = true;
		return callback;
	}
});

// Detect, normalize options and install callbacks for jsonp requests
jQuery.ajaxPrefilter( "json jsonp", function( s, originalSettings, jqXHR ) {

	var callbackName, overwritten, responseContainer,
		jsonProp = s.jsonp !== false && ( rjsonp.test( s.url ) ?
			"url" :
			typeof s.data === "string" && !( s.contentType || "" ).indexOf("application/x-www-form-urlencoded") && rjsonp.test( s.data ) && "data"
		);

	// Handle iff the expected data type is "jsonp" or we have a parameter to set
	if ( jsonProp || s.dataTypes[ 0 ] === "jsonp" ) {

		// Get callback name, remembering preexisting value associated with it
		callbackName = s.jsonpCallback = jQuery.isFunction( s.jsonpCallback ) ?
			s.jsonpCallback() :
			s.jsonpCallback;

		// Insert callback into url or form data
		if ( jsonProp ) {
			s[ jsonProp ] = s[ jsonProp ].replace( rjsonp, "$1" + callbackName );
		} else if ( s.jsonp !== false ) {
			s.url += ( rquery.test( s.url ) ? "&" : "?" ) + s.jsonp + "=" + callbackName;
		}

		// Use data converter to retrieve json after script execution
		s.converters["script json"] = function() {
			if ( !responseContainer ) {
				jQuery.error( callbackName + " was not called" );
			}
			return responseContainer[ 0 ];
		};

		// force json dataType
		s.dataTypes[ 0 ] = "json";

		// Install callback
		overwritten = window[ callbackName ];
		window[ callbackName ] = function() {
			responseContainer = arguments;
		};

		// Clean-up function (fires after converters)
		jqXHR.always(function() {
			// Restore preexisting value
			window[ callbackName ] = overwritten;

			// Save back as free
			if ( s[ callbackName ] ) {
				// make sure that re-using the options doesn't screw things around
				s.jsonpCallback = originalSettings.jsonpCallback;

				// save the callback name for future use
				oldCallbacks.push( callbackName );
			}

			// Call if it was a function and we have a response
			if ( responseContainer && jQuery.isFunction( overwritten ) ) {
				overwritten( responseContainer[ 0 ] );
			}

			responseContainer = overwritten = undefined;
		});

		// Delegate to script
		return "script";
	}
});




// data: string of html
// context (optional): If specified, the fragment will be created in this context, defaults to document
// keepScripts (optional): If true, will include scripts passed in the html string
jQuery.parseHTML = function( data, context, keepScripts ) {
	if ( !data || typeof data !== "string" ) {
		return null;
	}
	if ( typeof context === "boolean" ) {
		keepScripts = context;
		context = false;
	}
	context = context || document;

	var parsed = rsingleTag.exec( data ),
		scripts = !keepScripts && [];

	// Single tag
	if ( parsed ) {
		return [ context.createElement( parsed[1] ) ];
	}

	parsed = jQuery.buildFragment( [ data ], context, scripts );

	if ( scripts && scripts.length ) {
		jQuery( scripts ).remove();
	}

	return jQuery.merge( [], parsed.childNodes );
};


// Keep a copy of the old load method
var _load = jQuery.fn.load;

/**
 * Load a url into a page
 */
jQuery.fn.load = function( url, params, callback ) {
	if ( typeof url !== "string" && _load ) {
		return _load.apply( this, arguments );
	}

	var selector, response, type,
		self = this,
		off = url.indexOf(" ");

	if ( off >= 0 ) {
		selector = url.slice( off, url.length );
		url = url.slice( 0, off );
	}

	// If it's a function
	if ( jQuery.isFunction( params ) ) {

		// We assume that it's the callback
		callback = params;
		params = undefined;

	// Otherwise, build a param string
	} else if ( params && typeof params === "object" ) {
		type = "POST";
	}

	// If we have elements to modify, make the request
	if ( self.length > 0 ) {
		jQuery.ajax({
			url: url,

			// if "type" variable is undefined, then "GET" method will be used
			type: type,
			dataType: "html",
			data: params
		}).done(function( responseText ) {

			// Save response for use in complete callback
			response = arguments;

			self.html( selector ?

				// If a selector was specified, locate the right elements in a dummy div
				// Exclude scripts to avoid IE 'Permission Denied' errors
				jQuery("<div>").append( jQuery.parseHTML( responseText ) ).find( selector ) :

				// Otherwise use the full result
				responseText );

		}).complete( callback && function( jqXHR, status ) {
			self.each( callback, response || [ jqXHR.responseText, status, jqXHR ] );
		});
	}

	return this;
};




jQuery.expr.filters.animated = function( elem ) {
	return jQuery.grep(jQuery.timers, function( fn ) {
		return elem === fn.elem;
	}).length;
};





var docElem = window.document.documentElement;

/**
 * Gets a window from an element
 */
function getWindow( elem ) {
	return jQuery.isWindow( elem ) ?
		elem :
		elem.nodeType === 9 ?
			elem.defaultView || elem.parentWindow :
			false;
}

jQuery.offset = {
	setOffset: function( elem, options, i ) {
		var curPosition, curLeft, curCSSTop, curTop, curOffset, curCSSLeft, calculatePosition,
			position = jQuery.css( elem, "position" ),
			curElem = jQuery( elem ),
			props = {};

		// set position first, in-case top/left are set even on static elem
		if ( position === "static" ) {
			elem.style.position = "relative";
		}

		curOffset = curElem.offset();
		curCSSTop = jQuery.css( elem, "top" );
		curCSSLeft = jQuery.css( elem, "left" );
		calculatePosition = ( position === "absolute" || position === "fixed" ) &&
			jQuery.inArray("auto", [ curCSSTop, curCSSLeft ] ) > -1;

		// need to be able to calculate position if either top or left is auto and position is either absolute or fixed
		if ( calculatePosition ) {
			curPosition = curElem.position();
			curTop = curPosition.top;
			curLeft = curPosition.left;
		} else {
			curTop = parseFloat( curCSSTop ) || 0;
			curLeft = parseFloat( curCSSLeft ) || 0;
		}

		if ( jQuery.isFunction( options ) ) {
			options = options.call( elem, i, curOffset );
		}

		if ( options.top != null ) {
			props.top = ( options.top - curOffset.top ) + curTop;
		}
		if ( options.left != null ) {
			props.left = ( options.left - curOffset.left ) + curLeft;
		}

		if ( "using" in options ) {
			options.using.call( elem, props );
		} else {
			curElem.css( props );
		}
	}
};

jQuery.fn.extend({
	offset: function( options ) {
		if ( arguments.length ) {
			return options === undefined ?
				this :
				this.each(function( i ) {
					jQuery.offset.setOffset( this, options, i );
				});
		}

		var docElem, win,
			box = { top: 0, left: 0 },
			elem = this[ 0 ],
			doc = elem && elem.ownerDocument;

		if ( !doc ) {
			return;
		}

		docElem = doc.documentElement;

		// Make sure it's not a disconnected DOM node
		if ( !jQuery.contains( docElem, elem ) ) {
			return box;
		}

		// If we don't have gBCR, just use 0,0 rather than error
		// BlackBerry 5, iOS 3 (original iPhone)
		if ( typeof elem.getBoundingClientRect !== strundefined ) {
			box = elem.getBoundingClientRect();
		}
		win = getWindow( doc );
		return {
			top: box.top  + ( win.pageYOffset || docElem.scrollTop )  - ( docElem.clientTop  || 0 ),
			left: box.left + ( win.pageXOffset || docElem.scrollLeft ) - ( docElem.clientLeft || 0 )
		};
	},

	position: function() {
		if ( !this[ 0 ] ) {
			return;
		}

		var offsetParent, offset,
			parentOffset = { top: 0, left: 0 },
			elem = this[ 0 ];

		// fixed elements are offset from window (parentOffset = {top:0, left: 0}, because it is its only offset parent
		if ( jQuery.css( elem, "position" ) === "fixed" ) {
			// we assume that getBoundingClientRect is available when computed position is fixed
			offset = elem.getBoundingClientRect();
		} else {
			// Get *real* offsetParent
			offsetParent = this.offsetParent();

			// Get correct offsets
			offset = this.offset();
			if ( !jQuery.nodeName( offsetParent[ 0 ], "html" ) ) {
				parentOffset = offsetParent.offset();
			}

			// Add offsetParent borders
			parentOffset.top  += jQuery.css( offsetParent[ 0 ], "borderTopWidth", true );
			parentOffset.left += jQuery.css( offsetParent[ 0 ], "borderLeftWidth", true );
		}

		// Subtract parent offsets and element margins
		// note: when an element has margin: auto the offsetLeft and marginLeft
		// are the same in Safari causing offset.left to incorrectly be 0
		return {
			top:  offset.top  - parentOffset.top - jQuery.css( elem, "marginTop", true ),
			left: offset.left - parentOffset.left - jQuery.css( elem, "marginLeft", true)
		};
	},

	offsetParent: function() {
		return this.map(function() {
			var offsetParent = this.offsetParent || docElem;

			while ( offsetParent && ( !jQuery.nodeName( offsetParent, "html" ) && jQuery.css( offsetParent, "position" ) === "static" ) ) {
				offsetParent = offsetParent.offsetParent;
			}
			return offsetParent || docElem;
		});
	}
});

// Create scrollLeft and scrollTop methods
jQuery.each( { scrollLeft: "pageXOffset", scrollTop: "pageYOffset" }, function( method, prop ) {
	var top = /Y/.test( prop );

	jQuery.fn[ method ] = function( val ) {
		return access( this, function( elem, method, val ) {
			var win = getWindow( elem );

			if ( val === undefined ) {
				return win ? (prop in win) ? win[ prop ] :
					win.document.documentElement[ method ] :
					elem[ method ];
			}

			if ( win ) {
				win.scrollTo(
					!top ? val : jQuery( win ).scrollLeft(),
					top ? val : jQuery( win ).scrollTop()
				);

			} else {
				elem[ method ] = val;
			}
		}, method, val, arguments.length, null );
	};
});

// Add the top/left cssHooks using jQuery.fn.position
// Webkit bug: https://bugs.webkit.org/show_bug.cgi?id=29084
// getComputedStyle returns percent when specified for top/left/bottom/right
// rather than make the css module depend on the offset module, we just check for it here
jQuery.each( [ "top", "left" ], function( i, prop ) {
	jQuery.cssHooks[ prop ] = addGetHookIf( support.pixelPosition,
		function( elem, computed ) {
			if ( computed ) {
				computed = curCSS( elem, prop );
				// if curCSS returns percentage, fallback to offset
				return rnumnonpx.test( computed ) ?
					jQuery( elem ).position()[ prop ] + "px" :
					computed;
			}
		}
	);
});


// Create innerHeight, innerWidth, height, width, outerHeight and outerWidth methods
jQuery.each( { Height: "height", Width: "width" }, function( name, type ) {
	jQuery.each( { padding: "inner" + name, content: type, "": "outer" + name }, function( defaultExtra, funcName ) {
		// margin is only for outerHeight, outerWidth
		jQuery.fn[ funcName ] = function( margin, value ) {
			var chainable = arguments.length && ( defaultExtra || typeof margin !== "boolean" ),
				extra = defaultExtra || ( margin === true || value === true ? "margin" : "border" );

			return access( this, function( elem, type, value ) {
				var doc;

				if ( jQuery.isWindow( elem ) ) {
					// As of 5/8/2012 this will yield incorrect results for Mobile Safari, but there
					// isn't a whole lot we can do. See pull request at this URL for discussion:
					// https://github.com/jquery/jquery/pull/764
					return elem.document.documentElement[ "client" + name ];
				}

				// Get document width or height
				if ( elem.nodeType === 9 ) {
					doc = elem.documentElement;

					// Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height], whichever is greatest
					// unfortunately, this causes bug #3838 in IE6/8 only, but there is currently no good, small way to fix it.
					return Math.max(
						elem.body[ "scroll" + name ], doc[ "scroll" + name ],
						elem.body[ "offset" + name ], doc[ "offset" + name ],
						doc[ "client" + name ]
					);
				}

				return value === undefined ?
					// Get width or height on the element, requesting but not forcing parseFloat
					jQuery.css( elem, type, extra ) :

					// Set width or height on the element
					jQuery.style( elem, type, value, extra );
			}, type, chainable ? margin : undefined, chainable, null );
		};
	});
});


// The number of elements contained in the matched element set
jQuery.fn.size = function() {
	return this.length;
};

jQuery.fn.andSelf = jQuery.fn.addBack;




// Register as a named AMD module, since jQuery can be concatenated with other
// files that may use define, but not via a proper concatenation script that
// understands anonymous AMD modules. A named AMD is safest and most robust
// way to register. Lowercase jquery is used because AMD module names are
// derived from file names, and jQuery is normally delivered in a lowercase
// file name. Do this after creating the global so that if an AMD module wants
// to call noConflict to hide this version of jQuery, it will work.
if ( typeof define === "function" && define.amd ) {
	define( "jquery", [], function() {
		return jQuery;
	});
}




var
	// Map over jQuery in case of overwrite
	_jQuery = window.jQuery,

	// Map over the $ in case of overwrite
	_$ = window.$;

jQuery.noConflict = function( deep ) {
	if ( window.$ === jQuery ) {
		window.$ = _$;
	}

	if ( deep && window.jQuery === jQuery ) {
		window.jQuery = _jQuery;
	}

	return jQuery;
};

// Expose jQuery and $ identifiers, even in
// AMD (#7102#comment:10, https://github.com/jquery/jquery/pull/557)
// and CommonJS for browser emulators (#13566)
if ( typeof noGlobal === strundefined ) {
	window.jQuery = window.$ = jQuery;
}




return jQuery;

}));
(function($, undefined) {

/**
 * Unobtrusive scripting adapter for jQuery
 * https://github.com/rails/jquery-ujs
 *
 * Requires jQuery 1.7.0 or later.
 *
 * Released under the MIT license
 *
 */

  // Cut down on the number of issues from people inadvertently including jquery_ujs twice
  // by detecting and raising an error when it happens.
  if ( $.rails !== undefined ) {
    $.error('jquery-ujs has already been loaded!');
  }

  // Shorthand to make it a little easier to call public rails functions from within rails.js
  var rails;
  var $document = $(document);

  $.rails = rails = {
    // Link elements bound by jquery-ujs
    linkClickSelector: 'a[data-confirm], a[data-method], a[data-remote], a[data-disable-with]',

    // Button elements bound by jquery-ujs
    buttonClickSelector: 'button[data-remote]',

    // Select elements bound by jquery-ujs
    inputChangeSelector: 'select[data-remote], input[data-remote], textarea[data-remote]',

    // Form elements bound by jquery-ujs
    formSubmitSelector: 'form',

    // Form input elements bound by jquery-ujs
    formInputClickSelector: 'form input[type=submit], form input[type=image], form button[type=submit], form button:not([type])',

    // Form input elements disabled during form submission
    disableSelector: 'input[data-disable-with], button[data-disable-with], textarea[data-disable-with]',

    // Form input elements re-enabled after form submission
    enableSelector: 'input[data-disable-with]:disabled, button[data-disable-with]:disabled, textarea[data-disable-with]:disabled',

    // Form required input elements
    requiredInputSelector: 'input[name][required]:not([disabled]),textarea[name][required]:not([disabled])',

    // Form file input elements
    fileInputSelector: 'input[type=file]',

    // Link onClick disable selector with possible reenable after remote submission
    linkDisableSelector: 'a[data-disable-with]',

    // Make sure that every Ajax request sends the CSRF token
    CSRFProtection: function(xhr) {
      var token = $('meta[name="csrf-token"]').attr('content');
      if (token) xhr.setRequestHeader('X-CSRF-Token', token);
    },

    // making sure that all forms have actual up-to-date token(cached forms contain old one)
    refreshCSRFTokens: function(){
      var csrfToken = $('meta[name=csrf-token]').attr('content');
      var csrfParam = $('meta[name=csrf-param]').attr('content');
      $('form input[name="' + csrfParam + '"]').val(csrfToken);
    },

    // Triggers an event on an element and returns false if the event result is false
    fire: function(obj, name, data) {
      var event = $.Event(name);
      obj.trigger(event, data);
      return event.result !== false;
    },

    // Default confirm dialog, may be overridden with custom confirm dialog in $.rails.confirm
    confirm: function(message) {
      return confirm(message);
    },

    // Default ajax function, may be overridden with custom function in $.rails.ajax
    ajax: function(options) {
      return $.ajax(options);
    },

    // Default way to get an element's href. May be overridden at $.rails.href.
    href: function(element) {
      return element.attr('href');
    },

    // Submits "remote" forms and links with ajax
    handleRemote: function(element) {
      var method, url, data, elCrossDomain, crossDomain, withCredentials, dataType, options;

      if (rails.fire(element, 'ajax:before')) {
        elCrossDomain = element.data('cross-domain');
        crossDomain = elCrossDomain === undefined ? null : elCrossDomain;
        withCredentials = element.data('with-credentials') || null;
        dataType = element.data('type') || ($.ajaxSettings && $.ajaxSettings.dataType);

        if (element.is('form')) {
          method = element.attr('method');
          url = element.attr('action');
          data = element.serializeArray();
          // memoized value from clicked submit button
          var button = element.data('ujs:submit-button');
          if (button) {
            data.push(button);
            element.data('ujs:submit-button', null);
          }
        } else if (element.is(rails.inputChangeSelector)) {
          method = element.data('method');
          url = element.data('url');
          data = element.serialize();
          if (element.data('params')) data = data + "&" + element.data('params');
        } else if (element.is(rails.buttonClickSelector)) {
          method = element.data('method') || 'get';
          url = element.data('url');
          data = element.serialize();
          if (element.data('params')) data = data + "&" + element.data('params');
        } else {
          method = element.data('method');
          url = rails.href(element);
          data = element.data('params') || null;
        }

        options = {
          type: method || 'GET', data: data, dataType: dataType,
          // stopping the "ajax:beforeSend" event will cancel the ajax request
          beforeSend: function(xhr, settings) {
            if (settings.dataType === undefined) {
              xhr.setRequestHeader('accept', '*/*;q=0.5, ' + settings.accepts.script);
            }
            return rails.fire(element, 'ajax:beforeSend', [xhr, settings]);
          },
          success: function(data, status, xhr) {
            element.trigger('ajax:success', [data, status, xhr]);
          },
          complete: function(xhr, status) {
            element.trigger('ajax:complete', [xhr, status]);
          },
          error: function(xhr, status, error) {
            element.trigger('ajax:error', [xhr, status, error]);
          },
          crossDomain: crossDomain
        };

        // There is no withCredentials for IE6-8 when
        // "Enable native XMLHTTP support" is disabled
        if (withCredentials) {
          options.xhrFields = {
            withCredentials: withCredentials
          };
        }

        // Only pass url to `ajax` options if not blank
        if (url) { options.url = url; }

        var jqxhr = rails.ajax(options);
        element.trigger('ajax:send', jqxhr);
        return jqxhr;
      } else {
        return false;
      }
    },

    // Handles "data-method" on links such as:
    // <a href="/users/5" data-method="delete" rel="nofollow" data-confirm="Are you sure?">Delete</a>
    handleMethod: function(link) {
      var href = rails.href(link),
        method = link.data('method'),
        target = link.attr('target'),
        csrfToken = $('meta[name=csrf-token]').attr('content'),
        csrfParam = $('meta[name=csrf-param]').attr('content'),
        form = $('<form method="post" action="' + href + '"></form>'),
        metadataInput = '<input name="_method" value="' + method + '" type="hidden" />';

      if (csrfParam !== undefined && csrfToken !== undefined) {
        metadataInput += '<input name="' + csrfParam + '" value="' + csrfToken + '" type="hidden" />';
      }

      if (target) { form.attr('target', target); }

      form.hide().append(metadataInput).appendTo('body');
      form.submit();
    },

    /* Disables form elements:
      - Caches element value in 'ujs:enable-with' data store
      - Replaces element text with value of 'data-disable-with' attribute
      - Sets disabled property to true
    */
    disableFormElements: function(form) {
      form.find(rails.disableSelector).each(function() {
        var element = $(this), method = element.is('button') ? 'html' : 'val';
        element.data('ujs:enable-with', element[method]());
        element[method](element.data('disable-with'));
        element.prop('disabled', true);
      });
    },

    /* Re-enables disabled form elements:
      - Replaces element text with cached value from 'ujs:enable-with' data store (created in `disableFormElements`)
      - Sets disabled property to false
    */
    enableFormElements: function(form) {
      form.find(rails.enableSelector).each(function() {
        var element = $(this), method = element.is('button') ? 'html' : 'val';
        if (element.data('ujs:enable-with')) element[method](element.data('ujs:enable-with'));
        element.prop('disabled', false);
      });
    },

   /* For 'data-confirm' attribute:
      - Fires `confirm` event
      - Shows the confirmation dialog
      - Fires the `confirm:complete` event

      Returns `true` if no function stops the chain and user chose yes; `false` otherwise.
      Attaching a handler to the element's `confirm` event that returns a `falsy` value cancels the confirmation dialog.
      Attaching a handler to the element's `confirm:complete` event that returns a `falsy` value makes this function
      return false. The `confirm:complete` event is fired whether or not the user answered true or false to the dialog.
   */
    allowAction: function(element) {
      var message = element.data('confirm'),
          answer = false, callback;
      if (!message) { return true; }

      if (rails.fire(element, 'confirm')) {
        answer = rails.confirm(message);
        callback = rails.fire(element, 'confirm:complete', [answer]);
      }
      return answer && callback;
    },

    // Helper function which checks for blank inputs in a form that match the specified CSS selector
    blankInputs: function(form, specifiedSelector, nonBlank) {
      var inputs = $(), input, valueToCheck,
          selector = specifiedSelector || 'input,textarea',
          allInputs = form.find(selector);

      allInputs.each(function() {
        input = $(this);
        valueToCheck = input.is('input[type=checkbox],input[type=radio]') ? input.is(':checked') : input.val();
        // If nonBlank and valueToCheck are both truthy, or nonBlank and valueToCheck are both falsey
        if (!valueToCheck === !nonBlank) {

          // Don't count unchecked required radio if other radio with same name is checked
          if (input.is('input[type=radio]') && allInputs.filter('input[type=radio]:checked[name="' + input.attr('name') + '"]').length) {
            return true; // Skip to next input
          }

          inputs = inputs.add(input);
        }
      });
      return inputs.length ? inputs : false;
    },

    // Helper function which checks for non-blank inputs in a form that match the specified CSS selector
    nonBlankInputs: function(form, specifiedSelector) {
      return rails.blankInputs(form, specifiedSelector, true); // true specifies nonBlank
    },

    // Helper function, needed to provide consistent behavior in IE
    stopEverything: function(e) {
      $(e.target).trigger('ujs:everythingStopped');
      e.stopImmediatePropagation();
      return false;
    },

    //  replace element's html with the 'data-disable-with' after storing original html
    //  and prevent clicking on it
    disableElement: function(element) {
      element.data('ujs:enable-with', element.html()); // store enabled state
      element.html(element.data('disable-with')); // set to disabled state
      element.bind('click.railsDisable', function(e) { // prevent further clicking
        return rails.stopEverything(e);
      });
    },

    // restore element to its original state which was disabled by 'disableElement' above
    enableElement: function(element) {
      if (element.data('ujs:enable-with') !== undefined) {
        element.html(element.data('ujs:enable-with')); // set to old enabled state
        element.removeData('ujs:enable-with'); // clean up cache
      }
      element.unbind('click.railsDisable'); // enable element
    }

  };

  if (rails.fire($document, 'rails:attachBindings')) {

    $.ajaxPrefilter(function(options, originalOptions, xhr){ if ( !options.crossDomain ) { rails.CSRFProtection(xhr); }});

    $document.delegate(rails.linkDisableSelector, 'ajax:complete', function() {
        rails.enableElement($(this));
    });

    $document.delegate(rails.linkClickSelector, 'click.rails', function(e) {
      var link = $(this), method = link.data('method'), data = link.data('params'), metaClick = e.metaKey || e.ctrlKey;
      if (!rails.allowAction(link)) return rails.stopEverything(e);

      if (!metaClick && link.is(rails.linkDisableSelector)) rails.disableElement(link);

      if (link.data('remote') !== undefined) {
        if (metaClick && (!method || method === 'GET') && !data) { return true; }

        var handleRemote = rails.handleRemote(link);
        // response from rails.handleRemote() will either be false or a deferred object promise.
        if (handleRemote === false) {
          rails.enableElement(link);
        } else {
          handleRemote.error( function() { rails.enableElement(link); } );
        }
        return false;

      } else if (link.data('method')) {
        rails.handleMethod(link);
        return false;
      }
    });

    $document.delegate(rails.buttonClickSelector, 'click.rails', function(e) {
      var button = $(this);
      if (!rails.allowAction(button)) return rails.stopEverything(e);

      rails.handleRemote(button);
      return false;
    });

    $document.delegate(rails.inputChangeSelector, 'change.rails', function(e) {
      var link = $(this);
      if (!rails.allowAction(link)) return rails.stopEverything(e);

      rails.handleRemote(link);
      return false;
    });

    $document.delegate(rails.formSubmitSelector, 'submit.rails', function(e) {
      var form = $(this),
        remote = form.data('remote') !== undefined,
        blankRequiredInputs = rails.blankInputs(form, rails.requiredInputSelector),
        nonBlankFileInputs = rails.nonBlankInputs(form, rails.fileInputSelector);

      if (!rails.allowAction(form)) return rails.stopEverything(e);

      // skip other logic when required values are missing or file upload is present
      if (blankRequiredInputs && form.attr("novalidate") == undefined && rails.fire(form, 'ajax:aborted:required', [blankRequiredInputs])) {
        return rails.stopEverything(e);
      }

      if (remote) {
        if (nonBlankFileInputs) {
          // slight timeout so that the submit button gets properly serialized
          // (make it easy for event handler to serialize form without disabled values)
          setTimeout(function(){ rails.disableFormElements(form); }, 13);
          var aborted = rails.fire(form, 'ajax:aborted:file', [nonBlankFileInputs]);

          // re-enable form elements if event bindings return false (canceling normal form submission)
          if (!aborted) { setTimeout(function(){ rails.enableFormElements(form); }, 13); }

          return aborted;
        }

        rails.handleRemote(form);
        return false;

      } else {
        // slight timeout so that the submit button gets properly serialized
        setTimeout(function(){ rails.disableFormElements(form); }, 13);
      }
    });

    $document.delegate(rails.formInputClickSelector, 'click.rails', function(event) {
      var button = $(this);

      if (!rails.allowAction(button)) return rails.stopEverything(event);

      // register the pressed submit button
      var name = button.attr('name'),
        data = name ? {name:name, value:button.val()} : null;

      button.closest('form').data('ujs:submit-button', data);
    });

    $document.delegate(rails.formSubmitSelector, 'ajax:beforeSend.rails', function(event) {
      if (this == event.target) rails.disableFormElements($(this));
    });

    $document.delegate(rails.formSubmitSelector, 'ajax:complete.rails', function(event) {
      if (this == event.target) rails.enableFormElements($(this));
    });

    $(function(){
      rails.refreshCSRFTokens();
    });
  }

})( jQuery );
(function() {
  var CSRFToken, Click, ComponentUrl, Link, browserCompatibleDocumentParser, browserIsntBuggy, browserSupportsCustomEvents, browserSupportsPushState, browserSupportsTurbolinks, bypassOnLoadPopstate, cacheCurrentPage, cacheSize, changePage, constrainPageCacheTo, createDocument, currentState, enableTransitionCache, executeScriptTags, extractTitleAndBody, fetch, fetchHistory, fetchReplacement, historyStateIsDefined, initializeTurbolinks, installDocumentReadyPageEventTriggers, installHistoryChangeHandler, installJqueryAjaxSuccessPageUpdateTrigger, loadedAssets, pageCache, pageChangePrevented, pagesCached, popCookie, processResponse, recallScrollPosition, referer, reflectNewUrl, reflectRedirectedUrl, rememberCurrentState, rememberCurrentUrl, rememberReferer, removeNoscriptTags, requestMethodIsSafe, resetScrollPosition, transitionCacheEnabled, transitionCacheFor, triggerEvent, visit, xhr, _ref,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  pageCache = {};

  cacheSize = 10;

  transitionCacheEnabled = false;

  currentState = null;

  loadedAssets = null;

  referer = null;

  createDocument = null;

  xhr = null;

  fetch = function(url) {
    var cachedPage;
    url = new ComponentUrl(url);
    rememberReferer();
    cacheCurrentPage();
    reflectNewUrl(url);
    if (transitionCacheEnabled && (cachedPage = transitionCacheFor(url.absolute))) {
      fetchHistory(cachedPage);
      return fetchReplacement(url);
    } else {
      return fetchReplacement(url, resetScrollPosition);
    }
  };

  transitionCacheFor = function(url) {
    var cachedPage;
    cachedPage = pageCache[url];
    if (cachedPage && !cachedPage.transitionCacheDisabled) {
      return cachedPage;
    }
  };

  enableTransitionCache = function(enable) {
    if (enable == null) {
      enable = true;
    }
    return transitionCacheEnabled = enable;
  };

  fetchReplacement = function(url, onLoadFunction) {
    if (onLoadFunction == null) {
      onLoadFunction = (function(_this) {
        return function() {};
      })(this);
    }
    triggerEvent('page:fetch', {
      url: url.absolute
    });
    if (xhr != null) {
      xhr.abort();
    }
    xhr = new XMLHttpRequest;
    xhr.open('GET', url.withoutHashForIE10compatibility(), true);
    xhr.setRequestHeader('Accept', 'text/html, application/xhtml+xml, application/xml');
    xhr.setRequestHeader('X-XHR-Referer', referer);
    xhr.onload = function() {
      var doc;
      triggerEvent('page:receive');
      if (doc = processResponse()) {
        changePage.apply(null, extractTitleAndBody(doc));
        reflectRedirectedUrl();
        onLoadFunction();
        return triggerEvent('page:load');
      } else {
        return document.location.href = url.absolute;
      }
    };
    xhr.onloadend = function() {
      return xhr = null;
    };
    xhr.onerror = function() {
      return document.location.href = url.absolute;
    };
    return xhr.send();
  };

  fetchHistory = function(cachedPage) {
    if (xhr != null) {
      xhr.abort();
    }
    changePage(cachedPage.title, cachedPage.body);
    recallScrollPosition(cachedPage);
    return triggerEvent('page:restore');
  };

  cacheCurrentPage = function() {
    var currentStateUrl;
    currentStateUrl = new ComponentUrl(currentState.url);
    pageCache[currentStateUrl.absolute] = {
      url: currentStateUrl.relative,
      body: document.body,
      title: document.title,
      positionY: window.pageYOffset,
      positionX: window.pageXOffset,
      cachedAt: new Date().getTime(),
      transitionCacheDisabled: document.querySelector('[data-no-transition-cache]') != null
    };
    return constrainPageCacheTo(cacheSize);
  };

  pagesCached = function(size) {
    if (size == null) {
      size = cacheSize;
    }
    if (/^[\d]+$/.test(size)) {
      return cacheSize = parseInt(size);
    }
  };

  constrainPageCacheTo = function(limit) {
    var cacheTimesRecentFirst, key, pageCacheKeys, _i, _len, _results;
    pageCacheKeys = Object.keys(pageCache);
    cacheTimesRecentFirst = pageCacheKeys.map(function(url) {
      return pageCache[url].cachedAt;
    }).sort(function(a, b) {
      return b - a;
    });
    _results = [];
    for (_i = 0, _len = pageCacheKeys.length; _i < _len; _i++) {
      key = pageCacheKeys[_i];
      if (!(pageCache[key].cachedAt <= cacheTimesRecentFirst[limit])) {
        continue;
      }
      triggerEvent('page:expire', pageCache[key]);
      _results.push(delete pageCache[key]);
    }
    return _results;
  };

  changePage = function(title, body, csrfToken, runScripts) {
    document.title = title;
    document.documentElement.replaceChild(body, document.body);
    if (csrfToken != null) {
      CSRFToken.update(csrfToken);
    }
    if (runScripts) {
      executeScriptTags();
    }
    currentState = window.history.state;
    triggerEvent('page:change');
    return triggerEvent('page:update');
  };

  executeScriptTags = function() {
    var attr, copy, nextSibling, parentNode, script, scripts, _i, _j, _len, _len1, _ref, _ref1;
    scripts = Array.prototype.slice.call(document.body.querySelectorAll('script:not([data-turbolinks-eval="false"])'));
    for (_i = 0, _len = scripts.length; _i < _len; _i++) {
      script = scripts[_i];
      if (!((_ref = script.type) === '' || _ref === 'text/javascript')) {
        continue;
      }
      copy = document.createElement('script');
      _ref1 = script.attributes;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        attr = _ref1[_j];
        copy.setAttribute(attr.name, attr.value);
      }
      copy.appendChild(document.createTextNode(script.innerHTML));
      parentNode = script.parentNode, nextSibling = script.nextSibling;
      parentNode.removeChild(script);
      parentNode.insertBefore(copy, nextSibling);
    }
  };

  removeNoscriptTags = function(node) {
    node.innerHTML = node.innerHTML.replace(/<noscript[\S\s]*?<\/noscript>/ig, '');
    return node;
  };

  reflectNewUrl = function(url) {
    if ((url = new ComponentUrl(url)).absolute !== referer) {
      return window.history.pushState({
        turbolinks: true,
        url: url.absolute
      }, '', url.absolute);
    }
  };

  reflectRedirectedUrl = function() {
    var location, preservedHash;
    if (location = xhr.getResponseHeader('X-XHR-Redirected-To')) {
      location = new ComponentUrl(location);
      preservedHash = location.hasNoHash() ? document.location.hash : '';
      return window.history.replaceState(currentState, '', location.href + preservedHash);
    }
  };

  rememberReferer = function() {
    return referer = document.location.href;
  };

  rememberCurrentUrl = function() {
    return window.history.replaceState({
      turbolinks: true,
      url: document.location.href
    }, '', document.location.href);
  };

  rememberCurrentState = function() {
    return currentState = window.history.state;
  };

  recallScrollPosition = function(page) {
    return window.scrollTo(page.positionX, page.positionY);
  };

  resetScrollPosition = function() {
    if (document.location.hash) {
      return document.location.href = document.location.href;
    } else {
      return window.scrollTo(0, 0);
    }
  };

  popCookie = function(name) {
    var value, _ref;
    value = ((_ref = document.cookie.match(new RegExp(name + "=(\\w+)"))) != null ? _ref[1].toUpperCase() : void 0) || '';
    document.cookie = name + '=; expires=Thu, 01-Jan-70 00:00:01 GMT; path=/';
    return value;
  };

  triggerEvent = function(name, data) {
    var event;
    event = document.createEvent('Events');
    if (data) {
      event.data = data;
    }
    event.initEvent(name, true, true);
    return document.dispatchEvent(event);
  };

  pageChangePrevented = function() {
    return !triggerEvent('page:before-change');
  };

  processResponse = function() {
    var assetsChanged, clientOrServerError, doc, extractTrackAssets, intersection, validContent;
    clientOrServerError = function() {
      var _ref;
      return (400 <= (_ref = xhr.status) && _ref < 600);
    };
    validContent = function() {
      return xhr.getResponseHeader('Content-Type').match(/^(?:text\/html|application\/xhtml\+xml|application\/xml)(?:;|$)/);
    };
    extractTrackAssets = function(doc) {
      var node, _i, _len, _ref, _results;
      _ref = doc.head.childNodes;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        node = _ref[_i];
        if ((typeof node.getAttribute === "function" ? node.getAttribute('data-turbolinks-track') : void 0) != null) {
          _results.push(node.getAttribute('src') || node.getAttribute('href'));
        }
      }
      return _results;
    };
    assetsChanged = function(doc) {
      var fetchedAssets;
      loadedAssets || (loadedAssets = extractTrackAssets(document));
      fetchedAssets = extractTrackAssets(doc);
      return fetchedAssets.length !== loadedAssets.length || intersection(fetchedAssets, loadedAssets).length !== loadedAssets.length;
    };
    intersection = function(a, b) {
      var value, _i, _len, _ref, _results;
      if (a.length > b.length) {
        _ref = [b, a], a = _ref[0], b = _ref[1];
      }
      _results = [];
      for (_i = 0, _len = a.length; _i < _len; _i++) {
        value = a[_i];
        if (__indexOf.call(b, value) >= 0) {
          _results.push(value);
        }
      }
      return _results;
    };
    if (!clientOrServerError() && validContent()) {
      doc = createDocument(xhr.responseText);
      if (doc && !assetsChanged(doc)) {
        return doc;
      }
    }
  };

  extractTitleAndBody = function(doc) {
    var title;
    title = doc.querySelector('title');
    return [title != null ? title.textContent : void 0, removeNoscriptTags(doc.body), CSRFToken.get(doc).token, 'runScripts'];
  };

  CSRFToken = {
    get: function(doc) {
      var tag;
      if (doc == null) {
        doc = document;
      }
      return {
        node: tag = doc.querySelector('meta[name="csrf-token"]'),
        token: tag != null ? typeof tag.getAttribute === "function" ? tag.getAttribute('content') : void 0 : void 0
      };
    },
    update: function(latest) {
      var current;
      current = this.get();
      if ((current.token != null) && (latest != null) && current.token !== latest) {
        return current.node.setAttribute('content', latest);
      }
    }
  };

  browserCompatibleDocumentParser = function() {
    var createDocumentUsingDOM, createDocumentUsingParser, createDocumentUsingWrite, e, testDoc, _ref;
    createDocumentUsingParser = function(html) {
      return (new DOMParser).parseFromString(html, 'text/html');
    };
    createDocumentUsingDOM = function(html) {
      var doc;
      doc = document.implementation.createHTMLDocument('');
      doc.documentElement.innerHTML = html;
      return doc;
    };
    createDocumentUsingWrite = function(html) {
      var doc;
      doc = document.implementation.createHTMLDocument('');
      doc.open('replace');
      doc.write(html);
      doc.close();
      return doc;
    };
    try {
      if (window.DOMParser) {
        testDoc = createDocumentUsingParser('<html><body><p>test');
        return createDocumentUsingParser;
      }
    } catch (_error) {
      e = _error;
      testDoc = createDocumentUsingDOM('<html><body><p>test');
      return createDocumentUsingDOM;
    } finally {
      if ((testDoc != null ? (_ref = testDoc.body) != null ? _ref.childNodes.length : void 0 : void 0) !== 1) {
        return createDocumentUsingWrite;
      }
    }
  };

  ComponentUrl = (function() {
    function ComponentUrl(original) {
      this.original = original != null ? original : document.location.href;
      if (this.original.constructor === ComponentUrl) {
        return this.original;
      }
      this._parse();
    }

    ComponentUrl.prototype.withoutHash = function() {
      return this.href.replace(this.hash, '');
    };

    ComponentUrl.prototype.withoutHashForIE10compatibility = function() {
      return this.withoutHash();
    };

    ComponentUrl.prototype.hasNoHash = function() {
      return this.hash.length === 0;
    };

    ComponentUrl.prototype._parse = function() {
      var _ref;
      (this.link != null ? this.link : this.link = document.createElement('a')).href = this.original;
      _ref = this.link, this.href = _ref.href, this.protocol = _ref.protocol, this.host = _ref.host, this.hostname = _ref.hostname, this.port = _ref.port, this.pathname = _ref.pathname, this.search = _ref.search, this.hash = _ref.hash;
      this.origin = [this.protocol, '//', this.hostname].join('');
      if (this.port.length !== 0) {
        this.origin += ":" + this.port;
      }
      this.relative = [this.pathname, this.search, this.hash].join('');
      return this.absolute = this.href;
    };

    return ComponentUrl;

  })();

  Link = (function(_super) {
    __extends(Link, _super);

    Link.HTML_EXTENSIONS = ['html'];

    Link.allowExtensions = function() {
      var extension, extensions, _i, _len;
      extensions = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      for (_i = 0, _len = extensions.length; _i < _len; _i++) {
        extension = extensions[_i];
        Link.HTML_EXTENSIONS.push(extension);
      }
      return Link.HTML_EXTENSIONS;
    };

    function Link(link) {
      this.link = link;
      if (this.link.constructor === Link) {
        return this.link;
      }
      this.original = this.link.href;
      Link.__super__.constructor.apply(this, arguments);
    }

    Link.prototype.shouldIgnore = function() {
      return this._crossOrigin() || this._anchored() || this._nonHtml() || this._optOut() || this._target();
    };

    Link.prototype._crossOrigin = function() {
      return this.origin !== (new ComponentUrl).origin;
    };

    Link.prototype._anchored = function() {
      var current;
      return ((this.hash && this.withoutHash()) === (current = new ComponentUrl).withoutHash()) || (this.href === current.href + '#');
    };

    Link.prototype._nonHtml = function() {
      return this.pathname.match(/\.[a-z]+$/g) && !this.pathname.match(new RegExp("\\.(?:" + (Link.HTML_EXTENSIONS.join('|')) + ")?$", 'g'));
    };

    Link.prototype._optOut = function() {
      var ignore, link;
      link = this.link;
      while (!(ignore || link === document)) {
        ignore = link.getAttribute('data-no-turbolink') != null;
        link = link.parentNode;
      }
      return ignore;
    };

    Link.prototype._target = function() {
      return this.link.target.length !== 0;
    };

    return Link;

  })(ComponentUrl);

  Click = (function() {
    Click.installHandlerLast = function(event) {
      if (!event.defaultPrevented) {
        document.removeEventListener('click', Click.handle, false);
        return document.addEventListener('click', Click.handle, false);
      }
    };

    Click.handle = function(event) {
      return new Click(event);
    };

    function Click(event) {
      this.event = event;
      if (this.event.defaultPrevented) {
        return;
      }
      this._extractLink();
      if (this._validForTurbolinks()) {
        if (!pageChangePrevented()) {
          visit(this.link.href);
        }
        this.event.preventDefault();
      }
    }

    Click.prototype._extractLink = function() {
      var link;
      link = this.event.target;
      while (!(!link.parentNode || link.nodeName === 'A')) {
        link = link.parentNode;
      }
      if (link.nodeName === 'A' && link.href.length !== 0) {
        return this.link = new Link(link);
      }
    };

    Click.prototype._validForTurbolinks = function() {
      return (this.link != null) && !(this.link.shouldIgnore() || this._nonStandardClick());
    };

    Click.prototype._nonStandardClick = function() {
      return this.event.which > 1 || this.event.metaKey || this.event.ctrlKey || this.event.shiftKey || this.event.altKey;
    };

    return Click;

  })();

  bypassOnLoadPopstate = function(fn) {
    return setTimeout(fn, 500);
  };

  installDocumentReadyPageEventTriggers = function() {
    return document.addEventListener('DOMContentLoaded', (function() {
      triggerEvent('page:change');
      return triggerEvent('page:update');
    }), true);
  };

  installJqueryAjaxSuccessPageUpdateTrigger = function() {
    if (typeof jQuery !== 'undefined') {
      return jQuery(document).on('ajaxSuccess', function(event, xhr, settings) {
        if (!jQuery.trim(xhr.responseText)) {
          return;
        }
        return triggerEvent('page:update');
      });
    }
  };

  installHistoryChangeHandler = function(event) {
    var cachedPage, _ref;
    if ((_ref = event.state) != null ? _ref.turbolinks : void 0) {
      if (cachedPage = pageCache[(new ComponentUrl(event.state.url)).absolute]) {
        cacheCurrentPage();
        return fetchHistory(cachedPage);
      } else {
        return visit(event.target.location.href);
      }
    }
  };

  initializeTurbolinks = function() {
    rememberCurrentUrl();
    rememberCurrentState();
    createDocument = browserCompatibleDocumentParser();
    document.addEventListener('click', Click.installHandlerLast, true);
    return bypassOnLoadPopstate(function() {
      return window.addEventListener('popstate', installHistoryChangeHandler, false);
    });
  };

  historyStateIsDefined = window.history.state !== void 0 || navigator.userAgent.match(/Firefox\/2[6|7]/);

  browserSupportsPushState = window.history && window.history.pushState && window.history.replaceState && historyStateIsDefined;

  browserIsntBuggy = !navigator.userAgent.match(/CriOS\//);

  requestMethodIsSafe = (_ref = popCookie('request_method')) === 'GET' || _ref === '';

  browserSupportsTurbolinks = browserSupportsPushState && browserIsntBuggy && requestMethodIsSafe;

  browserSupportsCustomEvents = document.addEventListener && document.createEvent;

  if (browserSupportsCustomEvents) {
    installDocumentReadyPageEventTriggers();
    installJqueryAjaxSuccessPageUpdateTrigger();
  }

  if (browserSupportsTurbolinks) {
    visit = fetch;
    initializeTurbolinks();
  } else {
    visit = function(url) {
      return document.location.href = url;
    };
  }

  this.Turbolinks = {
    visit: visit,
    pagesCached: pagesCached,
    enableTransitionCache: enableTransitionCache,
    allowLinkExtensions: Link.allowExtensions,
    supported: browserSupportsTurbolinks
  };

}).call(this);
(function() {


}).call(this);
/*!
 * Bootstrap v3.1.1 (http://getbootstrap.com)
 * Copyright 2011-2014 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 */

if("undefined"==typeof jQuery)throw new Error("Bootstrap's JavaScript requires jQuery");+function(a){"use strict";function b(){var a=document.createElement("bootstrap"),b={WebkitTransition:"webkitTransitionEnd",MozTransition:"transitionend",OTransition:"oTransitionEnd otransitionend",transition:"transitionend"};for(var c in b)if(void 0!==a.style[c])return{end:b[c]};return!1}a.fn.emulateTransitionEnd=function(b){var c=!1,d=this;a(this).one(a.support.transition.end,function(){c=!0});var e=function(){c||a(d).trigger(a.support.transition.end)};return setTimeout(e,b),this},a(function(){a.support.transition=b()})}(jQuery),+function(a){"use strict";var b='[data-dismiss="alert"]',c=function(c){a(c).on("click",b,this.close)};c.prototype.close=function(b){function c(){f.trigger("closed.bs.alert").remove()}var d=a(this),e=d.attr("data-target");e||(e=d.attr("href"),e=e&&e.replace(/.*(?=#[^\s]*$)/,""));var f=a(e);b&&b.preventDefault(),f.length||(f=d.hasClass("alert")?d:d.parent()),f.trigger(b=a.Event("close.bs.alert")),b.isDefaultPrevented()||(f.removeClass("in"),a.support.transition&&f.hasClass("fade")?f.one(a.support.transition.end,c).emulateTransitionEnd(150):c())};var d=a.fn.alert;a.fn.alert=function(b){return this.each(function(){var d=a(this),e=d.data("bs.alert");e||d.data("bs.alert",e=new c(this)),"string"==typeof b&&e[b].call(d)})},a.fn.alert.Constructor=c,a.fn.alert.noConflict=function(){return a.fn.alert=d,this},a(document).on("click.bs.alert.data-api",b,c.prototype.close)}(jQuery),+function(a){"use strict";var b=function(c,d){this.$element=a(c),this.options=a.extend({},b.DEFAULTS,d),this.isLoading=!1};b.DEFAULTS={loadingText:"loading..."},b.prototype.setState=function(b){var c="disabled",d=this.$element,e=d.is("input")?"val":"html",f=d.data();b+="Text",f.resetText||d.data("resetText",d[e]()),d[e](f[b]||this.options[b]),setTimeout(a.proxy(function(){"loadingText"==b?(this.isLoading=!0,d.addClass(c).attr(c,c)):this.isLoading&&(this.isLoading=!1,d.removeClass(c).removeAttr(c))},this),0)},b.prototype.toggle=function(){var a=!0,b=this.$element.closest('[data-toggle="buttons"]');if(b.length){var c=this.$element.find("input");"radio"==c.prop("type")&&(c.prop("checked")&&this.$element.hasClass("active")?a=!1:b.find(".active").removeClass("active")),a&&c.prop("checked",!this.$element.hasClass("active")).trigger("change")}a&&this.$element.toggleClass("active")};var c=a.fn.button;a.fn.button=function(c){return this.each(function(){var d=a(this),e=d.data("bs.button"),f="object"==typeof c&&c;e||d.data("bs.button",e=new b(this,f)),"toggle"==c?e.toggle():c&&e.setState(c)})},a.fn.button.Constructor=b,a.fn.button.noConflict=function(){return a.fn.button=c,this},a(document).on("click.bs.button.data-api","[data-toggle^=button]",function(b){var c=a(b.target);c.hasClass("btn")||(c=c.closest(".btn")),c.button("toggle"),b.preventDefault()})}(jQuery),+function(a){"use strict";var b=function(b,c){this.$element=a(b),this.$indicators=this.$element.find(".carousel-indicators"),this.options=c,this.paused=this.sliding=this.interval=this.$active=this.$items=null,"hover"==this.options.pause&&this.$element.on("mouseenter",a.proxy(this.pause,this)).on("mouseleave",a.proxy(this.cycle,this))};b.DEFAULTS={interval:5e3,pause:"hover",wrap:!0},b.prototype.cycle=function(b){return b||(this.paused=!1),this.interval&&clearInterval(this.interval),this.options.interval&&!this.paused&&(this.interval=setInterval(a.proxy(this.next,this),this.options.interval)),this},b.prototype.getActiveIndex=function(){return this.$active=this.$element.find(".item.active"),this.$items=this.$active.parent().children(),this.$items.index(this.$active)},b.prototype.to=function(b){var c=this,d=this.getActiveIndex();return b>this.$items.length-1||0>b?void 0:this.sliding?this.$element.one("slid.bs.carousel",function(){c.to(b)}):d==b?this.pause().cycle():this.slide(b>d?"next":"prev",a(this.$items[b]))},b.prototype.pause=function(b){return b||(this.paused=!0),this.$element.find(".next, .prev").length&&a.support.transition&&(this.$element.trigger(a.support.transition.end),this.cycle(!0)),this.interval=clearInterval(this.interval),this},b.prototype.next=function(){return this.sliding?void 0:this.slide("next")},b.prototype.prev=function(){return this.sliding?void 0:this.slide("prev")},b.prototype.slide=function(b,c){var d=this.$element.find(".item.active"),e=c||d[b](),f=this.interval,g="next"==b?"left":"right",h="next"==b?"first":"last",i=this;if(!e.length){if(!this.options.wrap)return;e=this.$element.find(".item")[h]()}if(e.hasClass("active"))return this.sliding=!1;var j=a.Event("slide.bs.carousel",{relatedTarget:e[0],direction:g});return this.$element.trigger(j),j.isDefaultPrevented()?void 0:(this.sliding=!0,f&&this.pause(),this.$indicators.length&&(this.$indicators.find(".active").removeClass("active"),this.$element.one("slid.bs.carousel",function(){var b=a(i.$indicators.children()[i.getActiveIndex()]);b&&b.addClass("active")})),a.support.transition&&this.$element.hasClass("slide")?(e.addClass(b),e[0].offsetWidth,d.addClass(g),e.addClass(g),d.one(a.support.transition.end,function(){e.removeClass([b,g].join(" ")).addClass("active"),d.removeClass(["active",g].join(" ")),i.sliding=!1,setTimeout(function(){i.$element.trigger("slid.bs.carousel")},0)}).emulateTransitionEnd(1e3*d.css("transition-duration").slice(0,-1))):(d.removeClass("active"),e.addClass("active"),this.sliding=!1,this.$element.trigger("slid.bs.carousel")),f&&this.cycle(),this)};var c=a.fn.carousel;a.fn.carousel=function(c){return this.each(function(){var d=a(this),e=d.data("bs.carousel"),f=a.extend({},b.DEFAULTS,d.data(),"object"==typeof c&&c),g="string"==typeof c?c:f.slide;e||d.data("bs.carousel",e=new b(this,f)),"number"==typeof c?e.to(c):g?e[g]():f.interval&&e.pause().cycle()})},a.fn.carousel.Constructor=b,a.fn.carousel.noConflict=function(){return a.fn.carousel=c,this},a(document).on("click.bs.carousel.data-api","[data-slide], [data-slide-to]",function(b){var c,d=a(this),e=a(d.attr("data-target")||(c=d.attr("href"))&&c.replace(/.*(?=#[^\s]+$)/,"")),f=a.extend({},e.data(),d.data()),g=d.attr("data-slide-to");g&&(f.interval=!1),e.carousel(f),(g=d.attr("data-slide-to"))&&e.data("bs.carousel").to(g),b.preventDefault()}),a(window).on("load",function(){a('[data-ride="carousel"]').each(function(){var b=a(this);b.carousel(b.data())})})}(jQuery),+function(a){"use strict";var b=function(c,d){this.$element=a(c),this.options=a.extend({},b.DEFAULTS,d),this.transitioning=null,this.options.parent&&(this.$parent=a(this.options.parent)),this.options.toggle&&this.toggle()};b.DEFAULTS={toggle:!0},b.prototype.dimension=function(){var a=this.$element.hasClass("width");return a?"width":"height"},b.prototype.show=function(){if(!this.transitioning&&!this.$element.hasClass("in")){var b=a.Event("show.bs.collapse");if(this.$element.trigger(b),!b.isDefaultPrevented()){var c=this.$parent&&this.$parent.find("> .panel > .in");if(c&&c.length){var d=c.data("bs.collapse");if(d&&d.transitioning)return;c.collapse("hide"),d||c.data("bs.collapse",null)}var e=this.dimension();this.$element.removeClass("collapse").addClass("collapsing")[e](0),this.transitioning=1;var f=function(){this.$element.removeClass("collapsing").addClass("collapse in")[e]("auto"),this.transitioning=0,this.$element.trigger("shown.bs.collapse")};if(!a.support.transition)return f.call(this);var g=a.camelCase(["scroll",e].join("-"));this.$element.one(a.support.transition.end,a.proxy(f,this)).emulateTransitionEnd(350)[e](this.$element[0][g])}}},b.prototype.hide=function(){if(!this.transitioning&&this.$element.hasClass("in")){var b=a.Event("hide.bs.collapse");if(this.$element.trigger(b),!b.isDefaultPrevented()){var c=this.dimension();this.$element[c](this.$element[c]())[0].offsetHeight,this.$element.addClass("collapsing").removeClass("collapse").removeClass("in"),this.transitioning=1;var d=function(){this.transitioning=0,this.$element.trigger("hidden.bs.collapse").removeClass("collapsing").addClass("collapse")};return a.support.transition?void this.$element[c](0).one(a.support.transition.end,a.proxy(d,this)).emulateTransitionEnd(350):d.call(this)}}},b.prototype.toggle=function(){this[this.$element.hasClass("in")?"hide":"show"]()};var c=a.fn.collapse;a.fn.collapse=function(c){return this.each(function(){var d=a(this),e=d.data("bs.collapse"),f=a.extend({},b.DEFAULTS,d.data(),"object"==typeof c&&c);!e&&f.toggle&&"show"==c&&(c=!c),e||d.data("bs.collapse",e=new b(this,f)),"string"==typeof c&&e[c]()})},a.fn.collapse.Constructor=b,a.fn.collapse.noConflict=function(){return a.fn.collapse=c,this},a(document).on("click.bs.collapse.data-api","[data-toggle=collapse]",function(b){var c,d=a(this),e=d.attr("data-target")||b.preventDefault()||(c=d.attr("href"))&&c.replace(/.*(?=#[^\s]+$)/,""),f=a(e),g=f.data("bs.collapse"),h=g?"toggle":d.data(),i=d.attr("data-parent"),j=i&&a(i);g&&g.transitioning||(j&&j.find('[data-toggle=collapse][data-parent="'+i+'"]').not(d).addClass("collapsed"),d[f.hasClass("in")?"addClass":"removeClass"]("collapsed")),f.collapse(h)})}(jQuery),+function(a){"use strict";function b(b){a(d).remove(),a(e).each(function(){var d=c(a(this)),e={relatedTarget:this};d.hasClass("open")&&(d.trigger(b=a.Event("hide.bs.dropdown",e)),b.isDefaultPrevented()||d.removeClass("open").trigger("hidden.bs.dropdown",e))})}function c(b){var c=b.attr("data-target");c||(c=b.attr("href"),c=c&&/#[A-Za-z]/.test(c)&&c.replace(/.*(?=#[^\s]*$)/,""));var d=c&&a(c);return d&&d.length?d:b.parent()}var d=".dropdown-backdrop",e="[data-toggle=dropdown]",f=function(b){a(b).on("click.bs.dropdown",this.toggle)};f.prototype.toggle=function(d){var e=a(this);if(!e.is(".disabled, :disabled")){var f=c(e),g=f.hasClass("open");if(b(),!g){"ontouchstart"in document.documentElement&&!f.closest(".navbar-nav").length&&a('<div class="dropdown-backdrop"/>').insertAfter(a(this)).on("click",b);var h={relatedTarget:this};if(f.trigger(d=a.Event("show.bs.dropdown",h)),d.isDefaultPrevented())return;f.toggleClass("open").trigger("shown.bs.dropdown",h),e.focus()}return!1}},f.prototype.keydown=function(b){if(/(38|40|27)/.test(b.keyCode)){var d=a(this);if(b.preventDefault(),b.stopPropagation(),!d.is(".disabled, :disabled")){var f=c(d),g=f.hasClass("open");if(!g||g&&27==b.keyCode)return 27==b.which&&f.find(e).focus(),d.click();var h=" li:not(.divider):visible a",i=f.find("[role=menu]"+h+", [role=listbox]"+h);if(i.length){var j=i.index(i.filter(":focus"));38==b.keyCode&&j>0&&j--,40==b.keyCode&&j<i.length-1&&j++,~j||(j=0),i.eq(j).focus()}}}};var g=a.fn.dropdown;a.fn.dropdown=function(b){return this.each(function(){var c=a(this),d=c.data("bs.dropdown");d||c.data("bs.dropdown",d=new f(this)),"string"==typeof b&&d[b].call(c)})},a.fn.dropdown.Constructor=f,a.fn.dropdown.noConflict=function(){return a.fn.dropdown=g,this},a(document).on("click.bs.dropdown.data-api",b).on("click.bs.dropdown.data-api",".dropdown form",function(a){a.stopPropagation()}).on("click.bs.dropdown.data-api",e,f.prototype.toggle).on("keydown.bs.dropdown.data-api",e+", [role=menu], [role=listbox]",f.prototype.keydown)}(jQuery),+function(a){"use strict";var b=function(b,c){this.options=c,this.$element=a(b),this.$backdrop=this.isShown=null,this.options.remote&&this.$element.find(".modal-content").load(this.options.remote,a.proxy(function(){this.$element.trigger("loaded.bs.modal")},this))};b.DEFAULTS={backdrop:!0,keyboard:!0,show:!0},b.prototype.toggle=function(a){return this[this.isShown?"hide":"show"](a)},b.prototype.show=function(b){var c=this,d=a.Event("show.bs.modal",{relatedTarget:b});this.$element.trigger(d),this.isShown||d.isDefaultPrevented()||(this.isShown=!0,this.escape(),this.$element.on("click.dismiss.bs.modal",'[data-dismiss="modal"]',a.proxy(this.hide,this)),this.backdrop(function(){var d=a.support.transition&&c.$element.hasClass("fade");c.$element.parent().length||c.$element.appendTo(document.body),c.$element.show().scrollTop(0),d&&c.$element[0].offsetWidth,c.$element.addClass("in").attr("aria-hidden",!1),c.enforceFocus();var e=a.Event("shown.bs.modal",{relatedTarget:b});d?c.$element.find(".modal-dialog").one(a.support.transition.end,function(){c.$element.focus().trigger(e)}).emulateTransitionEnd(300):c.$element.focus().trigger(e)}))},b.prototype.hide=function(b){b&&b.preventDefault(),b=a.Event("hide.bs.modal"),this.$element.trigger(b),this.isShown&&!b.isDefaultPrevented()&&(this.isShown=!1,this.escape(),a(document).off("focusin.bs.modal"),this.$element.removeClass("in").attr("aria-hidden",!0).off("click.dismiss.bs.modal"),a.support.transition&&this.$element.hasClass("fade")?this.$element.one(a.support.transition.end,a.proxy(this.hideModal,this)).emulateTransitionEnd(300):this.hideModal())},b.prototype.enforceFocus=function(){a(document).off("focusin.bs.modal").on("focusin.bs.modal",a.proxy(function(a){this.$element[0]===a.target||this.$element.has(a.target).length||this.$element.focus()},this))},b.prototype.escape=function(){this.isShown&&this.options.keyboard?this.$element.on("keyup.dismiss.bs.modal",a.proxy(function(a){27==a.which&&this.hide()},this)):this.isShown||this.$element.off("keyup.dismiss.bs.modal")},b.prototype.hideModal=function(){var a=this;this.$element.hide(),this.backdrop(function(){a.removeBackdrop(),a.$element.trigger("hidden.bs.modal")})},b.prototype.removeBackdrop=function(){this.$backdrop&&this.$backdrop.remove(),this.$backdrop=null},b.prototype.backdrop=function(b){var c=this.$element.hasClass("fade")?"fade":"";if(this.isShown&&this.options.backdrop){var d=a.support.transition&&c;if(this.$backdrop=a('<div class="modal-backdrop '+c+'" />').appendTo(document.body),this.$element.on("click.dismiss.bs.modal",a.proxy(function(a){a.target===a.currentTarget&&("static"==this.options.backdrop?this.$element[0].focus.call(this.$element[0]):this.hide.call(this))},this)),d&&this.$backdrop[0].offsetWidth,this.$backdrop.addClass("in"),!b)return;d?this.$backdrop.one(a.support.transition.end,b).emulateTransitionEnd(150):b()}else!this.isShown&&this.$backdrop?(this.$backdrop.removeClass("in"),a.support.transition&&this.$element.hasClass("fade")?this.$backdrop.one(a.support.transition.end,b).emulateTransitionEnd(150):b()):b&&b()};var c=a.fn.modal;a.fn.modal=function(c,d){return this.each(function(){var e=a(this),f=e.data("bs.modal"),g=a.extend({},b.DEFAULTS,e.data(),"object"==typeof c&&c);f||e.data("bs.modal",f=new b(this,g)),"string"==typeof c?f[c](d):g.show&&f.show(d)})},a.fn.modal.Constructor=b,a.fn.modal.noConflict=function(){return a.fn.modal=c,this},a(document).on("click.bs.modal.data-api",'[data-toggle="modal"]',function(b){var c=a(this),d=c.attr("href"),e=a(c.attr("data-target")||d&&d.replace(/.*(?=#[^\s]+$)/,"")),f=e.data("bs.modal")?"toggle":a.extend({remote:!/#/.test(d)&&d},e.data(),c.data());c.is("a")&&b.preventDefault(),e.modal(f,this).one("hide",function(){c.is(":visible")&&c.focus()})}),a(document).on("show.bs.modal",".modal",function(){a(document.body).addClass("modal-open")}).on("hidden.bs.modal",".modal",function(){a(document.body).removeClass("modal-open")})}(jQuery),+function(a){"use strict";var b=function(a,b){this.type=this.options=this.enabled=this.timeout=this.hoverState=this.$element=null,this.init("tooltip",a,b)};b.DEFAULTS={animation:!0,placement:"top",selector:!1,template:'<div class="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',trigger:"hover focus",title:"",delay:0,html:!1,container:!1},b.prototype.init=function(b,c,d){this.enabled=!0,this.type=b,this.$element=a(c),this.options=this.getOptions(d);for(var e=this.options.trigger.split(" "),f=e.length;f--;){var g=e[f];if("click"==g)this.$element.on("click."+this.type,this.options.selector,a.proxy(this.toggle,this));else if("manual"!=g){var h="hover"==g?"mouseenter":"focusin",i="hover"==g?"mouseleave":"focusout";this.$element.on(h+"."+this.type,this.options.selector,a.proxy(this.enter,this)),this.$element.on(i+"."+this.type,this.options.selector,a.proxy(this.leave,this))}}this.options.selector?this._options=a.extend({},this.options,{trigger:"manual",selector:""}):this.fixTitle()},b.prototype.getDefaults=function(){return b.DEFAULTS},b.prototype.getOptions=function(b){return b=a.extend({},this.getDefaults(),this.$element.data(),b),b.delay&&"number"==typeof b.delay&&(b.delay={show:b.delay,hide:b.delay}),b},b.prototype.getDelegateOptions=function(){var b={},c=this.getDefaults();return this._options&&a.each(this._options,function(a,d){c[a]!=d&&(b[a]=d)}),b},b.prototype.enter=function(b){var c=b instanceof this.constructor?b:a(b.currentTarget)[this.type](this.getDelegateOptions()).data("bs."+this.type);return clearTimeout(c.timeout),c.hoverState="in",c.options.delay&&c.options.delay.show?void(c.timeout=setTimeout(function(){"in"==c.hoverState&&c.show()},c.options.delay.show)):c.show()},b.prototype.leave=function(b){var c=b instanceof this.constructor?b:a(b.currentTarget)[this.type](this.getDelegateOptions()).data("bs."+this.type);return clearTimeout(c.timeout),c.hoverState="out",c.options.delay&&c.options.delay.hide?void(c.timeout=setTimeout(function(){"out"==c.hoverState&&c.hide()},c.options.delay.hide)):c.hide()},b.prototype.show=function(){var b=a.Event("show.bs."+this.type);if(this.hasContent()&&this.enabled){if(this.$element.trigger(b),b.isDefaultPrevented())return;var c=this,d=this.tip();this.setContent(),this.options.animation&&d.addClass("fade");var e="function"==typeof this.options.placement?this.options.placement.call(this,d[0],this.$element[0]):this.options.placement,f=/\s?auto?\s?/i,g=f.test(e);g&&(e=e.replace(f,"")||"top"),d.detach().css({top:0,left:0,display:"block"}).addClass(e),this.options.container?d.appendTo(this.options.container):d.insertAfter(this.$element);var h=this.getPosition(),i=d[0].offsetWidth,j=d[0].offsetHeight;if(g){var k=this.$element.parent(),l=e,m=document.documentElement.scrollTop||document.body.scrollTop,n="body"==this.options.container?window.innerWidth:k.outerWidth(),o="body"==this.options.container?window.innerHeight:k.outerHeight(),p="body"==this.options.container?0:k.offset().left;e="bottom"==e&&h.top+h.height+j-m>o?"top":"top"==e&&h.top-m-j<0?"bottom":"right"==e&&h.right+i>n?"left":"left"==e&&h.left-i<p?"right":e,d.removeClass(l).addClass(e)}var q=this.getCalculatedOffset(e,h,i,j);this.applyPlacement(q,e),this.hoverState=null;var r=function(){c.$element.trigger("shown.bs."+c.type)};a.support.transition&&this.$tip.hasClass("fade")?d.one(a.support.transition.end,r).emulateTransitionEnd(150):r()}},b.prototype.applyPlacement=function(b,c){var d,e=this.tip(),f=e[0].offsetWidth,g=e[0].offsetHeight,h=parseInt(e.css("margin-top"),10),i=parseInt(e.css("margin-left"),10);isNaN(h)&&(h=0),isNaN(i)&&(i=0),b.top=b.top+h,b.left=b.left+i,a.offset.setOffset(e[0],a.extend({using:function(a){e.css({top:Math.round(a.top),left:Math.round(a.left)})}},b),0),e.addClass("in");var j=e[0].offsetWidth,k=e[0].offsetHeight;if("top"==c&&k!=g&&(d=!0,b.top=b.top+g-k),/bottom|top/.test(c)){var l=0;b.left<0&&(l=-2*b.left,b.left=0,e.offset(b),j=e[0].offsetWidth,k=e[0].offsetHeight),this.replaceArrow(l-f+j,j,"left")}else this.replaceArrow(k-g,k,"top");d&&e.offset(b)},b.prototype.replaceArrow=function(a,b,c){this.arrow().css(c,a?50*(1-a/b)+"%":"")},b.prototype.setContent=function(){var a=this.tip(),b=this.getTitle();a.find(".tooltip-inner")[this.options.html?"html":"text"](b),a.removeClass("fade in top bottom left right")},b.prototype.hide=function(){function b(){"in"!=c.hoverState&&d.detach(),c.$element.trigger("hidden.bs."+c.type)}var c=this,d=this.tip(),e=a.Event("hide.bs."+this.type);return this.$element.trigger(e),e.isDefaultPrevented()?void 0:(d.removeClass("in"),a.support.transition&&this.$tip.hasClass("fade")?d.one(a.support.transition.end,b).emulateTransitionEnd(150):b(),this.hoverState=null,this)},b.prototype.fixTitle=function(){var a=this.$element;(a.attr("title")||"string"!=typeof a.attr("data-original-title"))&&a.attr("data-original-title",a.attr("title")||"").attr("title","")},b.prototype.hasContent=function(){return this.getTitle()},b.prototype.getPosition=function(){var b=this.$element[0];return a.extend({},"function"==typeof b.getBoundingClientRect?b.getBoundingClientRect():{width:b.offsetWidth,height:b.offsetHeight},this.$element.offset())},b.prototype.getCalculatedOffset=function(a,b,c,d){return"bottom"==a?{top:b.top+b.height,left:b.left+b.width/2-c/2}:"top"==a?{top:b.top-d,left:b.left+b.width/2-c/2}:"left"==a?{top:b.top+b.height/2-d/2,left:b.left-c}:{top:b.top+b.height/2-d/2,left:b.left+b.width}},b.prototype.getTitle=function(){var a,b=this.$element,c=this.options;return a=b.attr("data-original-title")||("function"==typeof c.title?c.title.call(b[0]):c.title)},b.prototype.tip=function(){return this.$tip=this.$tip||a(this.options.template)},b.prototype.arrow=function(){return this.$arrow=this.$arrow||this.tip().find(".tooltip-arrow")},b.prototype.validate=function(){this.$element[0].parentNode||(this.hide(),this.$element=null,this.options=null)},b.prototype.enable=function(){this.enabled=!0},b.prototype.disable=function(){this.enabled=!1},b.prototype.toggleEnabled=function(){this.enabled=!this.enabled},b.prototype.toggle=function(b){var c=b?a(b.currentTarget)[this.type](this.getDelegateOptions()).data("bs."+this.type):this;c.tip().hasClass("in")?c.leave(c):c.enter(c)},b.prototype.destroy=function(){clearTimeout(this.timeout),this.hide().$element.off("."+this.type).removeData("bs."+this.type)};var c=a.fn.tooltip;a.fn.tooltip=function(c){return this.each(function(){var d=a(this),e=d.data("bs.tooltip"),f="object"==typeof c&&c;(e||"destroy"!=c)&&(e||d.data("bs.tooltip",e=new b(this,f)),"string"==typeof c&&e[c]())})},a.fn.tooltip.Constructor=b,a.fn.tooltip.noConflict=function(){return a.fn.tooltip=c,this}}(jQuery),+function(a){"use strict";var b=function(a,b){this.init("popover",a,b)};if(!a.fn.tooltip)throw new Error("Popover requires tooltip.js");b.DEFAULTS=a.extend({},a.fn.tooltip.Constructor.DEFAULTS,{placement:"right",trigger:"click",content:"",template:'<div class="popover"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'}),b.prototype=a.extend({},a.fn.tooltip.Constructor.prototype),b.prototype.constructor=b,b.prototype.getDefaults=function(){return b.DEFAULTS},b.prototype.setContent=function(){var a=this.tip(),b=this.getTitle(),c=this.getContent();a.find(".popover-title")[this.options.html?"html":"text"](b),a.find(".popover-content")[this.options.html?"string"==typeof c?"html":"append":"text"](c),a.removeClass("fade top bottom left right in"),a.find(".popover-title").html()||a.find(".popover-title").hide()},b.prototype.hasContent=function(){return this.getTitle()||this.getContent()},b.prototype.getContent=function(){var a=this.$element,b=this.options;return a.attr("data-content")||("function"==typeof b.content?b.content.call(a[0]):b.content)},b.prototype.arrow=function(){return this.$arrow=this.$arrow||this.tip().find(".arrow")},b.prototype.tip=function(){return this.$tip||(this.$tip=a(this.options.template)),this.$tip};var c=a.fn.popover;a.fn.popover=function(c){return this.each(function(){var d=a(this),e=d.data("bs.popover"),f="object"==typeof c&&c;(e||"destroy"!=c)&&(e||d.data("bs.popover",e=new b(this,f)),"string"==typeof c&&e[c]())})},a.fn.popover.Constructor=b,a.fn.popover.noConflict=function(){return a.fn.popover=c,this}}(jQuery),+function(a){"use strict";function b(c,d){var e,f=a.proxy(this.process,this);this.$element=a(a(c).is("body")?window:c),this.$body=a("body"),this.$scrollElement=this.$element.on("scroll.bs.scroll-spy.data-api",f),this.options=a.extend({},b.DEFAULTS,d),this.selector=(this.options.target||(e=a(c).attr("href"))&&e.replace(/.*(?=#[^\s]+$)/,"")||"")+" .nav li > a",this.offsets=a([]),this.targets=a([]),this.activeTarget=null,this.refresh(),this.process()}b.DEFAULTS={offset:10},b.prototype.refresh=function(){var b=this.$element[0]==window?"offset":"position";this.offsets=a([]),this.targets=a([]);{var c=this;this.$body.find(this.selector).map(function(){var d=a(this),e=d.data("target")||d.attr("href"),f=/^#./.test(e)&&a(e);return f&&f.length&&f.is(":visible")&&[[f[b]().top+(!a.isWindow(c.$scrollElement.get(0))&&c.$scrollElement.scrollTop()),e]]||null}).sort(function(a,b){return a[0]-b[0]}).each(function(){c.offsets.push(this[0]),c.targets.push(this[1])})}},b.prototype.process=function(){var a,b=this.$scrollElement.scrollTop()+this.options.offset,c=this.$scrollElement[0].scrollHeight||this.$body[0].scrollHeight,d=c-this.$scrollElement.height(),e=this.offsets,f=this.targets,g=this.activeTarget;if(b>=d)return g!=(a=f.last()[0])&&this.activate(a);if(g&&b<=e[0])return g!=(a=f[0])&&this.activate(a);for(a=e.length;a--;)g!=f[a]&&b>=e[a]&&(!e[a+1]||b<=e[a+1])&&this.activate(f[a])},b.prototype.activate=function(b){this.activeTarget=b,a(this.selector).parentsUntil(this.options.target,".active").removeClass("active");var c=this.selector+'[data-target="'+b+'"],'+this.selector+'[href="'+b+'"]',d=a(c).parents("li").addClass("active");d.parent(".dropdown-menu").length&&(d=d.closest("li.dropdown").addClass("active")),d.trigger("activate.bs.scrollspy")};var c=a.fn.scrollspy;a.fn.scrollspy=function(c){return this.each(function(){var d=a(this),e=d.data("bs.scrollspy"),f="object"==typeof c&&c;e||d.data("bs.scrollspy",e=new b(this,f)),"string"==typeof c&&e[c]()})},a.fn.scrollspy.Constructor=b,a.fn.scrollspy.noConflict=function(){return a.fn.scrollspy=c,this},a(window).on("load",function(){a('[data-spy="scroll"]').each(function(){var b=a(this);b.scrollspy(b.data())})})}(jQuery),+function(a){"use strict";var b=function(b){this.element=a(b)};b.prototype.show=function(){var b=this.element,c=b.closest("ul:not(.dropdown-menu)"),d=b.data("target");if(d||(d=b.attr("href"),d=d&&d.replace(/.*(?=#[^\s]*$)/,"")),!b.parent("li").hasClass("active")){var e=c.find(".active:last a")[0],f=a.Event("show.bs.tab",{relatedTarget:e});if(b.trigger(f),!f.isDefaultPrevented()){var g=a(d);this.activate(b.parent("li"),c),this.activate(g,g.parent(),function(){b.trigger({type:"shown.bs.tab",relatedTarget:e})})}}},b.prototype.activate=function(b,c,d){function e(){f.removeClass("active").find("> .dropdown-menu > .active").removeClass("active"),b.addClass("active"),g?(b[0].offsetWidth,b.addClass("in")):b.removeClass("fade"),b.parent(".dropdown-menu")&&b.closest("li.dropdown").addClass("active"),d&&d()}var f=c.find("> .active"),g=d&&a.support.transition&&f.hasClass("fade");g?f.one(a.support.transition.end,e).emulateTransitionEnd(150):e(),f.removeClass("in")};var c=a.fn.tab;a.fn.tab=function(c){return this.each(function(){var d=a(this),e=d.data("bs.tab");e||d.data("bs.tab",e=new b(this)),"string"==typeof c&&e[c]()})},a.fn.tab.Constructor=b,a.fn.tab.noConflict=function(){return a.fn.tab=c,this},a(document).on("click.bs.tab.data-api",'[data-toggle="tab"], [data-toggle="pill"]',function(b){b.preventDefault(),a(this).tab("show")})}(jQuery),+function(a){"use strict";var b=function(c,d){this.options=a.extend({},b.DEFAULTS,d),this.$window=a(window).on("scroll.bs.affix.data-api",a.proxy(this.checkPosition,this)).on("click.bs.affix.data-api",a.proxy(this.checkPositionWithEventLoop,this)),this.$element=a(c),this.affixed=this.unpin=this.pinnedOffset=null,this.checkPosition()};b.RESET="affix affix-top affix-bottom",b.DEFAULTS={offset:0},b.prototype.getPinnedOffset=function(){if(this.pinnedOffset)return this.pinnedOffset;this.$element.removeClass(b.RESET).addClass("affix");var a=this.$window.scrollTop(),c=this.$element.offset();return this.pinnedOffset=c.top-a},b.prototype.checkPositionWithEventLoop=function(){setTimeout(a.proxy(this.checkPosition,this),1)},b.prototype.checkPosition=function(){if(this.$element.is(":visible")){var c=a(document).height(),d=this.$window.scrollTop(),e=this.$element.offset(),f=this.options.offset,g=f.top,h=f.bottom;"top"==this.affixed&&(e.top+=d),"object"!=typeof f&&(h=g=f),"function"==typeof g&&(g=f.top(this.$element)),"function"==typeof h&&(h=f.bottom(this.$element));var i=null!=this.unpin&&d+this.unpin<=e.top?!1:null!=h&&e.top+this.$element.height()>=c-h?"bottom":null!=g&&g>=d?"top":!1;if(this.affixed!==i){this.unpin&&this.$element.css("top","");var j="affix"+(i?"-"+i:""),k=a.Event(j+".bs.affix");this.$element.trigger(k),k.isDefaultPrevented()||(this.affixed=i,this.unpin="bottom"==i?this.getPinnedOffset():null,this.$element.removeClass(b.RESET).addClass(j).trigger(a.Event(j.replace("affix","affixed"))),"bottom"==i&&this.$element.offset({top:c-h-this.$element.height()}))}}};var c=a.fn.affix;a.fn.affix=function(c){return this.each(function(){var d=a(this),e=d.data("bs.affix"),f="object"==typeof c&&c;e||d.data("bs.affix",e=new b(this,f)),"string"==typeof c&&e[c]()})},a.fn.affix.Constructor=b,a.fn.affix.noConflict=function(){return a.fn.affix=c,this},a(window).on("load",function(){a('[data-spy="affix"]').each(function(){var b=a(this),c=b.data();c.offset=c.offset||{},c.offsetBottom&&(c.offset.bottom=c.offsetBottom),c.offsetTop&&(c.offset.top=c.offsetTop),b.affix(c)})})}(jQuery);
function initialize() {
  google.maps.visualRefresh = true;
  var isMobile = (navigator.userAgent.toLowerCase().indexOf('android') > -1) ||
    (navigator.userAgent.match(/(iPod|iPhone|iPad|BlackBerry|Windows Phone|iemobile)/));
  if (isMobile) {
    var viewport = document.querySelector("meta[name=viewport]");
    viewport.setAttribute('content', 'initial-scale=1.0, user-scalable=no');
  }
  var mapDiv = document.getElementById('googft-mapCanvas');
  mapDiv.style.width = isMobile ? '100%' : '500px';
  mapDiv.style.height = isMobile ? '100%' : '300px';
  var map = new google.maps.Map(mapDiv, {
    center: new google.maps.LatLng(47.623093219888034, -122.24589121624751),
    zoom: 11,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  });
  map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(document.getElementById('googft-legend-open'));
  map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(document.getElementById('googft-legend'));

  layer = new google.maps.FusionTablesLayer({
    map: map,
    heatmap: { enabled: false },
    query: {
      select: "col9",
      from: "12A-a3toi9W1eNDmnGi-QVJe9GJFSRZ2Pd57wPyoM",
      where: ""
    },
    options: {
      styleId: 2,
      templateId: 2
    }
  });

  if (isMobile) {
    var legend = document.getElementById('googft-legend');
    var legendOpenButton = document.getElementById('googft-legend-open');
    var legendCloseButton = document.getElementById('googft-legend-close');
    legend.style.display = 'none';
    legendOpenButton.style.display = 'block';
    legendCloseButton.style.display = 'block';
    legendOpenButton.onclick = function() {
      legend.style.display = 'block';
      legendOpenButton.style.display = 'none';
    }
    legendCloseButton.onclick = function() {
      legend.style.display = 'none';
      legendOpenButton.style.display = 'block';
    }
  }
}

google.maps.event.addDomListener(window, 'load', initialize);
window.onload = function() {
  handler = Gmaps.build('Google');
  handler.buildMap({ provider: {}, internal: {id: 'map'}}, function(){
    // var kmls = handler.addKml(
    //   { url: "https://s3-us-west-2.amazonaws.com/district-mapping/districts.kml" }
    // );
    var dist1a = handler.addPolygons(
    [
      [{lat:  47.556298, lng: -122.344476}, {lat:  47.55609, lng: -122.346298}, {lat:  47.55614, lng: -122.346838}, {lat:  47.556395, lng: -122.34748}, {lat:  47.556712, lng: -122.347987}, {lat:  47.557761, lng: -122.348831}, {lat:  47.558608, lng: -122.348865}, {lat:  47.55884, lng: -122.348663}, {lat:  47.559548, lng: -122.348326}, {lat:  47.559609, lng: -122.34792}, {lat:  47.559451, lng: -122.347077}, {lat:  47.559272, lng: -122.347078}, {lat:  47.559018, lng: -122.34684}, {lat:  47.558541, lng: -122.346874}, {lat:  47.558216, lng: -122.34657}, {lat:  47.557604, lng: -122.346436}, {lat:  47.557377, lng: -122.346131}, {lat:  47.55703, lng: -122.345185}, {lat:  47.556989, lng: -122.344543}, {lat:  47.556825, lng: -122.344205}, {lat:  47.556512, lng: -122.344137}, {lat:  47.556298, lng: -122.344476}]
    ],
    { strokeColor: '#FF0000'}
  );
    var dist1b = handler.addPolygons(
    [
      [{lat:  47.583084, lng: -122.346146}, {lat:  47.581598, lng: -122.346145}, {lat:  47.581122, lng: -122.34601}, {lat:  47.579539, lng: -122.346043}, {lat:  47.573697, lng: -122.3456}, {lat:  47.573506, lng: -122.345261}, {lat:  47.571, lng: -122.346071}, {lat:  47.5701, lng: -122.346207}, {lat:  47.569462, lng: -122.346374}, {lat:  47.569285, lng: -122.346644}, {lat:  47.569255, lng: -122.348029}, {lat:  47.569422, lng: -122.348773}, {lat:  47.570122, lng: -122.350055}, {lat:  47.570379, lng: -122.350866}, {lat:  47.571451, lng: -122.352623}, {lat:  47.573917, lng: -122.355935}, {lat:  47.574073, lng: -122.356508}, {lat:  47.575405, lng: -122.358301}, {lat:  47.575631, lng: -122.358267}, {lat:  47.579015, lng: -122.358405}, {lat:  47.581507, lng: -122.358373}, {lat:  47.582029, lng: -122.358373}, {lat:  47.583379, lng: -122.358341}, {lat:  47.583862, lng: -122.356618}, {lat:  47.585024, lng: -122.35672}, {lat:  47.585042, lng: -122.358409}, {lat:  47.586582, lng: -122.358345}, {lat:  47.58671, lng: -122.357534}, {lat:  47.586985, lng: -122.356826}, {lat:  47.586995, lng: -122.356528}, {lat:  47.587125, lng: -122.35294}, {lat:  47.587494, lng: -122.351353}, {lat:  47.587971, lng: -122.349832}, {lat:  47.588754, lng: -122.349833}, {lat:  47.589943, lng: -122.346827}, {lat:  47.590118, lng: -122.346016}, {lat:  47.584909, lng: -122.346011}, {lat:  47.583084, lng: -122.346146}]
    ],
    { strokeColor: '#FF0000'}
  );
    var dist1c = handler.addPolygons(
      [
        [{lat:  47.583416, lng: -122.372287}, {lat:  47.583805, lng: -122.372462}, {lat:  47.584221, lng: -122.373286}, {lat:  47.584713, lng: -122.373896}, {lat:  47.585145, lng: -122.374505}, {lat:  47.585538, lng: -122.375221}, {lat:  47.586006, lng: -122.375685}, {lat:  47.586407, lng: -122.375912}, {lat:  47.587537, lng: -122.377608}, {lat:  47.588285, lng: -122.378729}, {lat:  47.588991, lng: -122.379504}, {lat:  47.589608, lng: -122.38045}, {lat:  47.589879, lng: -122.380688}, {lat:  47.590772, lng: -122.381023}, {lat:  47.591257, lng: -122.381056}, {lat:  47.591853, lng: -122.381361}, {lat:  47.592447, lng: -122.38146}, {lat:  47.593013, lng: -122.381189}, {lat:  47.593292, lng: -122.381323}, {lat:  47.593953, lng: -122.381966}, {lat:  47.594181, lng: -122.382608}, {lat:  47.594596, lng: -122.382845}, {lat:  47.594857, lng: -122.38319}, {lat:  47.59535, lng: -122.384129}, {lat:  47.595509, lng: -122.385242}, {lat:  47.59558, lng: -122.386693}, {lat:  47.594548, lng: -122.388856}, {lat:  47.593521, lng: -122.390345}, {lat:  47.590047, lng: -122.393694}, {lat:  47.588379, lng: -122.395707}, {lat:  47.583731, lng: -122.401314}, {lat:  47.583154, lng: -122.40201}, {lat:  47.582221, lng: -122.40401}, {lat:  47.581641, lng: -122.405253}, {lat:  47.581262, lng: -122.406179}, {lat:  47.580272, lng: -122.408597}, {lat:  47.57943, lng: -122.410962}, {lat:  47.579124, lng: -122.411962}, {lat:  47.578718, lng: -122.413293}, {lat:  47.578563, lng: -122.4138}, {lat:  47.577257, lng: -122.418893}, {lat:  47.577169, lng: -122.419238}, {lat:  47.576751, lng: -122.420318}, {lat:  47.576501, lng: -122.420623}, {lat:  47.575936, lng: -122.420623}, {lat:  47.5755, lng: -122.420251}, {lat:  47.574838, lng: -122.419271}, {lat:  47.573277, lng: -122.416505}, {lat:  47.572343, lng: -122.414351}, {lat:  47.571929, lng: -122.413396}, {lat:  47.570903, lng: -122.411642}, {lat:  47.570107, lng: -122.410797}, {lat:  47.569212, lng: -122.409954}, {lat:  47.568825, lng: -122.409921}, {lat:  47.567593, lng: -122.410057}, {lat:  47.56731, lng: -122.40996}, {lat:  47.566899, lng: -122.409819}, {lat:  47.566565, lng: -122.409583}, {lat:  47.565216, lng: -122.407999}, {lat:  47.564755, lng: -122.407659}, {lat:  47.563222, lng: -122.406951}, {lat:  47.562445, lng: -122.406346}, {lat:  47.560734, lng: -122.404253}, {lat:  47.559677, lng: -122.403408}, {lat:  47.559569, lng: -122.40336}, {lat:  47.558928, lng: -122.403071}, {lat:  47.558584, lng: -122.402735}, {lat:  47.558214, lng: -122.402533}, {lat:  47.556939, lng: -122.401318}, {lat:  47.555241, lng: -122.400138}, {lat:  47.554854, lng: -122.400002}, {lat:  47.554125, lng: -122.399969}, {lat:  47.553692, lng: -122.3998}, {lat:  47.55278, lng: -122.399092}, {lat:  47.552203, lng: -122.398856}, {lat:  47.551311, lng: -122.398825}, {lat:  47.550439, lng: -122.398563}, {lat:  47.549852, lng: -122.398386}, {lat:  47.549023, lng: -122.398354}, {lat:  47.547497, lng: -122.398996}, {lat:  47.546924, lng: -122.399468}, {lat:  47.546034, lng: -122.399604}, {lat:  47.545028, lng: -122.399178}, {lat:  47.544915, lng: -122.39913}, {lat:  47.544021, lng: -122.398425}, {lat:  47.543723, lng: -122.398322}, {lat:  47.542425, lng: -122.397378}, {lat:  47.541828, lng: -122.397209}, {lat:  47.541072, lng: -122.397176}, {lat:  47.540551, lng: -122.397379}, {lat:  47.539763, lng: -122.397378}, {lat:  47.539705, lng: -122.397378}, {lat:  47.539109, lng: -122.396775}, {lat:  47.538793, lng: -122.39664}, {lat:  47.537786, lng: -122.396774}, {lat:  47.536342, lng: -122.395933}, {lat:  47.53589, lng: -122.395867}, {lat:  47.535657, lng: -122.395833}, {lat:  47.534903, lng: -122.396137}, {lat:  47.534285, lng: -122.396609}, {lat:  47.53271, lng: -122.398332}, {lat:  47.532273, lng: -122.398977}, {lat:  47.532183, lng: -122.399109}, {lat:  47.5318, lng: -122.39985}, {lat:  47.530791, lng: -122.401303}, {lat:  47.530361, lng: -122.401607}, {lat:  47.530018, lng: -122.401471}, {lat:  47.529765, lng: -122.401233}, {lat:  47.528776, lng: -122.399649}, {lat:  47.528456, lng: -122.398739}, {lat:  47.528075, lng: -122.398032}, {lat:  47.526969, lng: -122.396402}, {lat:  47.526198, lng: -122.395264}, {lat:  47.525003, lng: -122.393952}, {lat:  47.524416, lng: -122.393613}, {lat:  47.52393, lng: -122.393546}, {lat:  47.523409, lng: -122.393795}, {lat:  47.523167, lng: -122.394046}, {lat:  47.522812, lng: -122.394414}, {lat:  47.521917, lng: -122.394055}, {lat:  47.521306, lng: -122.394224}, {lat:  47.520983, lng: -122.394428}, {lat:  47.520168, lng: -122.395239}, {lat:  47.518882, lng: -122.396519}, {lat:  47.517622, lng: -122.398647}, {lat:  47.517237, lng: -122.398983}, {lat:  47.516805, lng: -122.398951}, {lat:  47.515796, lng: -122.396958}, {lat:  47.515404, lng: -122.396524}, {lat:  47.514081, lng: -122.39595}, {lat:  47.513805, lng: -122.395759}, {lat:  47.512618, lng: -122.394939}, {lat:  47.512167, lng: -122.394739}, {lat:  47.51113, lng: -122.394297}, {lat:  47.510587, lng: -122.39386}, {lat:  47.509675, lng: -122.393118}, {lat:  47.508869, lng: -122.392177}, {lat:  47.508481, lng: -122.391873}, {lat:  47.507869, lng: -122.391637}, {lat:  47.507386, lng: -122.390869}, {lat:  47.506881, lng: -122.390555}, {lat:  47.506483, lng: -122.390193}, {lat:  47.504173, lng: -122.388097}, {lat:  47.503885, lng: -122.387723}, {lat:  47.50265, lng: -122.386954}, {lat:  47.502289, lng: -122.386685}, {lat:  47.501944, lng: -122.386147}, {lat:  47.50158, lng: -122.385237}, {lat:  47.50108, lng: -122.384056}, {lat:  47.499823, lng: -122.381219}, {lat:  47.498295, lng: -122.378525}, {lat:  47.497291, lng: -122.377482}, {lat:  47.496991, lng: -122.377009}, {lat:  47.496488, lng: -122.376258}, {lat:  47.496472, lng: -122.376235}, {lat:  47.49626, lng: -122.375915}, {lat:  47.49644, lng: -122.375667}, {lat:  47.496875, lng: -122.375327}, {lat:  47.497038, lng: -122.375223}, {lat:  47.497254, lng: -122.375083}, {lat:  47.497326, lng: -122.375039}, {lat:  47.497503, lng: -122.374935}, {lat:  47.497665, lng: -122.374865}, {lat:  47.499227, lng: -122.374293}, {lat:  47.499623, lng: -122.374148}, {lat:  47.499923, lng: -122.374074}, {lat:  47.500587, lng: -122.373987}, {lat:  47.500703, lng: -122.373938}, {lat:  47.50084, lng: -122.373815}, {lat:  47.501384, lng: -122.373136}, {lat:  47.50202, lng: -122.372272}, {lat:  47.502188, lng: -122.372066}, {lat:  47.502784, lng: -122.371428}, {lat:  47.503247, lng: -122.370934}, {lat:  47.503517, lng: -122.370709}, {lat:  47.503689, lng: -122.370611}, {lat:  47.503872, lng: -122.370576}, {lat:  47.504526, lng: -122.370565}, {lat:  47.505141, lng: -122.370555}, {lat:  47.505408, lng: -122.370489}, {lat:  47.505509, lng: -122.370464}, {lat:  47.505692, lng: -122.370419}, {lat:  47.505827, lng: -122.370409}, {lat:  47.506404, lng: -122.370479}, {lat:  47.506415, lng: -122.37048}, {lat:  47.50667, lng: -122.370545}, {lat:  47.506914, lng: -122.370621}, {lat:  47.507069, lng: -122.370679}, {lat:  47.507127, lng: -122.370697}, {lat:  47.507194, lng: -122.370709}, {lat:  47.5072, lng: -122.370709}, {lat:  47.507265, lng: -122.370729}, {lat:  47.508023, lng: -122.370877}, {lat:  47.508201, lng: -122.370892}, {lat:  47.508205, lng: -122.370892}, {lat:  47.509464, lng: -122.370875}, {lat:  47.510044, lng: -122.370903}, {lat:  47.511969, lng: -122.370995}, {lat:  47.512291, lng: -122.371019}, {lat:  47.513707, lng: -122.371124}, {lat:  47.51385, lng: -122.371135}, {lat:  47.515564, lng: -122.371262}, {lat:  47.515751, lng: -122.371278}, {lat:  47.515815, lng: -122.37128}, {lat:  47.516043, lng: -122.371297}, {lat:  47.516971, lng: -122.371365}, {lat:  47.517426, lng: -122.371414}, {lat:  47.51743, lng: -122.371415}, {lat:  47.517429, lng: -122.371398}, {lat:  47.517399, lng: -122.368677}, {lat:  47.517387, lng: -122.36771}, {lat:  47.517383, lng: -122.367295}, {lat:  47.517367, lng: -122.36593}, {lat:  47.517368, lng: -122.364585}, {lat:  47.517368, lng: -122.364567}, {lat:  47.517368, lng: -122.363241}, {lat:  47.517367, lng: -122.362635}, {lat:  47.517367, lng: -122.361866}, {lat:  47.517368, lng: -122.361142}, {lat:  47.517366, lng: -122.360557}, {lat:  47.517365, lng: -122.360492}, {lat:  47.515529, lng: -122.360518}, {lat:  47.51553, lng: -122.359178}, {lat:  47.51553, lng: -122.358529}, {lat:  47.51553, lng: -122.35851}, {lat:  47.515613, lng: -122.358511}, {lat:  47.51728, lng: -122.358531}, {lat:  47.517349, lng: -122.358531}, {lat:  47.517353, lng: -122.358531}, {lat:  47.517363, lng: -122.358532}, {lat:  47.517362, lng: -122.358047}, {lat:  47.517366, lng: -122.357874}, {lat:  47.517388, lng: -122.356528}, {lat:  47.517392, lng: -122.356127}, {lat:  47.517386, lng: -122.355188}, {lat:  47.517386, lng: -122.355182}, {lat:  47.51738, lng: -122.354052}, {lat:  47.517376, lng: -122.353419}, {lat:  47.517367, lng: -122.352924}, {lat:  47.517345, lng: -122.351793}, {lat:  47.517345, lng: -122.35175}, {lat:  47.517338, lng: -122.35067}, {lat:  47.51733, lng: -122.349261}, {lat:  47.517323, lng: -122.348032}, {lat:  47.517323, lng: -122.347987}, {lat:  47.517315, lng: -122.346714}, {lat:  47.517308, lng: -122.345441}, {lat:  47.517305, lng: -122.344654}, {lat:  47.5173, lng: -122.344166}, {lat:  47.517299, lng: -122.343888}, {lat:  47.517293, lng: -122.342893}, {lat:  47.517293, lng: -122.342876}, {lat:  47.517289, lng: -122.342876}, {lat:  47.517281, lng: -122.341601}, {lat:  47.51728, lng: -122.341435}, {lat:  47.51728, lng: -122.341393}, {lat:  47.517273, lng: -122.34023}, {lat:  47.517273, lng: -122.340131}, {lat:  47.517272, lng: -122.340001}, {lat:  47.517265, lng: -122.338871}, {lat:  47.517261, lng: -122.338116}, {lat:  47.51726, lng: -122.337928}, {lat:  47.517258, lng: -122.337525}, {lat:  47.517176, lng: -122.337507}, {lat:  47.51637, lng: -122.337364}, {lat:  47.515667, lng: -122.337268}, {lat:  47.515562, lng: -122.337254}, {lat:  47.515457, lng: -122.33724}, {lat:  47.514105, lng: -122.337056}, {lat:  47.51402, lng: -122.337044}, {lat:  47.514001, lng: -122.337043}, {lat:  47.513911, lng: -122.33704}, {lat:  47.513916, lng: -122.336505}, {lat:  47.513925, lng: -122.335704}, {lat:  47.513934, lng: -122.33479}, {lat:  47.513939, lng: -122.334316}, {lat:  47.51394, lng: -122.334257}, {lat:  47.51394, lng: -122.334253}, {lat:  47.514022, lng: -122.334268}, {lat:  47.514274, lng: -122.334313}, {lat:  47.514282, lng: -122.334314}, {lat:  47.514497, lng: -122.334352}, {lat:  47.514499, lng: -122.334353}, {lat:  47.514525, lng: -122.334357}, {lat:  47.514524, lng: -122.334089}, {lat:  47.514524, lng: -122.334033}, {lat:  47.514524, lng: -122.333973}, {lat:  47.514525, lng: -122.333903}, {lat:  47.514526, lng: -122.333848}, {lat:  47.51453, lng: -122.33359}, {lat:  47.514526, lng: -122.333508}, {lat:  47.514617, lng: -122.333526}, {lat:  47.514743, lng: -122.33355}, {lat:  47.514727, lng: -122.333495}, {lat:  47.514733, lng: -122.333463}, {lat:  47.514866, lng: -122.332716}, {lat:  47.514899, lng: -122.332529}, {lat:  47.514988, lng: -122.332029}, {lat:  47.5151, lng: -122.331403}, {lat:  47.515134, lng: -122.331383}, {lat:  47.515139, lng: -122.331329}, {lat:  47.515143, lng: -122.331277}, {lat:  47.515151, lng: -122.331178}, {lat:  47.514798, lng: -122.33082}, {lat:  47.514794, lng: -122.330817}, {lat:  47.514792, lng: -122.330815}, {lat:  47.51479, lng: -122.330812}, {lat:  47.514788, lng: -122.33081}, {lat:  47.514785, lng: -122.330808}, {lat:  47.514783, lng: -122.330805}, {lat:  47.514781, lng: -122.330803}, {lat:  47.514779, lng: -122.330801}, {lat:  47.514776, lng: -122.330798}, {lat:  47.514774, lng: -122.330796}, {lat:  47.514772, lng: -122.330794}, {lat:  47.51477, lng: -122.330792}, {lat:  47.514768, lng: -122.33079}, {lat:  47.514767, lng: -122.330789}, {lat:  47.514765, lng: -122.330787}, {lat:  47.514763, lng: -122.330785}, {lat:  47.514761, lng: -122.330782}, {lat:  47.514758, lng: -122.33078}, {lat:  47.514756, lng: -122.330778}, {lat:  47.514754, lng: -122.330775}, {lat:  47.514752, lng: -122.330773}, {lat:  47.514749, lng: -122.330771}, {lat:  47.514747, lng: -122.330768}, {lat:  47.514745, lng: -122.330766}, {lat:  47.514743, lng: -122.330764}, {lat:  47.51474, lng: -122.330762}, {lat:  47.514738, lng: -122.330759}, {lat:  47.514736, lng: -122.330757}, {lat:  47.514734, lng: -122.330755}, {lat:  47.514731, lng: -122.330752}, {lat:  47.514729, lng: -122.33075}, {lat:  47.514727, lng: -122.330748}, {lat:  47.514725, lng: -122.330745}, {lat:  47.514722, lng: -122.330743}, {lat:  47.51472, lng: -122.330741}, {lat:  47.514718, lng: -122.330739}, {lat:  47.514715, lng: -122.330736}, {lat:  47.514713, lng: -122.330734}, {lat:  47.514711, lng: -122.330732}, {lat:  47.514709, lng: -122.330729}, {lat:  47.514706, lng: -122.330727}, {lat:  47.514704, lng: -122.330725}, {lat:  47.514702, lng: -122.330723}, {lat:  47.5147, lng: -122.330721}, {lat:  47.514697, lng: -122.330718}, {lat:  47.514695, lng: -122.330716}, {lat:  47.514693, lng: -122.330714}, {lat:  47.51469, lng: -122.330712}, {lat:  47.514688, lng: -122.330709}, {lat:  47.514686, lng: -122.330707}, {lat:  47.514683, lng: -122.330705}, {lat:  47.514681, lng: -122.330703}, {lat:  47.514679, lng: -122.330701}, {lat:  47.514677, lng: -122.330699}, {lat:  47.514674, lng: -122.330696}, {lat:  47.514672, lng: -122.330694}, {lat:  47.51467, lng: -122.330692}, {lat:  47.514667, lng: -122.33069}, {lat:  47.514665, lng: -122.330688}, {lat:  47.514663, lng: -122.330686}, {lat:  47.51466, lng: -122.330684}, {lat:  47.514658, lng: -122.330682}, {lat:  47.514655, lng: -122.33068}, {lat:  47.514653, lng: -122.330677}, {lat:  47.514651, lng: -122.330675}, {lat:  47.514648, lng: -122.330673}, {lat:  47.514646, lng: -122.330671}, {lat:  47.514644, lng: -122.330669}, {lat:  47.514641, lng: -122.330667}, {lat:  47.514639, lng: -122.330665}, {lat:  47.514637, lng: -122.330663}, {lat:  47.514634, lng: -122.330661}, {lat:  47.514632, lng: -122.330659}, {lat:  47.514629, lng: -122.330657}, {lat:  47.514627, lng: -122.330655}, {lat:  47.514625, lng: -122.330653}, {lat:  47.514622, lng: -122.330651}, {lat:  47.51462, lng: -122.330649}, {lat:  47.514618, lng: -122.330647}, {lat:  47.514615, lng: -122.330645}, {lat:  47.514613, lng: -122.330643}, {lat:  47.51461, lng: -122.330641}, {lat:  47.514608, lng: -122.330639}, {lat:  47.514606, lng: -122.330637}, {lat:  47.514603, lng: -122.330635}, {lat:  47.514601, lng: -122.330633}, {lat:  47.514598, lng: -122.330631}, {lat:  47.514596, lng: -122.330629}, {lat:  47.514594, lng: -122.330627}, {lat:  47.514591, lng: -122.330625}, {lat:  47.514589, lng: -122.330623}, {lat:  47.514586, lng: -122.330622}, {lat:  47.514584, lng: -122.33062}, {lat:  47.514582, lng: -122.330618}, {lat:  47.514579, lng: -122.330616}, {lat:  47.514577, lng: -122.330614}, {lat:  47.514574, lng: -122.330612}, {lat:  47.514572, lng: -122.33061}, {lat:  47.51457, lng: -122.330608}, {lat:  47.514567, lng: -122.330606}, {lat:  47.514565, lng: -122.330604}, {lat:  47.514562, lng: -122.330602}, {lat:  47.51456, lng: -122.3306}, {lat:  47.514558, lng: -122.330598}, {lat:  47.514555, lng: -122.330596}, {lat:  47.514553, lng: -122.330594}, {lat:  47.51455, lng: -122.330592}, {lat:  47.514548, lng: -122.33059}, {lat:  47.514546, lng: -122.330588}, {lat:  47.514543, lng: -122.330586}, {lat:  47.514541, lng: -122.330584}, {lat:  47.514538, lng: -122.330582}, {lat:  47.514536, lng: -122.33058}, {lat:  47.514534, lng: -122.330579}, {lat:  47.514531, lng: -122.330577}, {lat:  47.514529, lng: -122.330575}, {lat:  47.514526, lng: -122.330573}, {lat:  47.514524, lng: -122.330572}, {lat:  47.514521, lng: -122.33057}, {lat:  47.514519, lng: -122.330568}, {lat:  47.514516, lng: -122.330566}, {lat:  47.514514, lng: -122.330564}, {lat:  47.514511, lng: -122.330563}, {lat:  47.514509, lng: -122.330561}, {lat:  47.514506, lng: -122.330559}, {lat:  47.514504, lng: -122.330557}, {lat:  47.514502, lng: -122.330555}, {lat:  47.514499, lng: -122.330554}, {lat:  47.514497, lng: -122.330552}, {lat:  47.514494, lng: -122.33055}, {lat:  47.514492, lng: -122.330548}, {lat:  47.514489, lng: -122.330546}, {lat:  47.514487, lng: -122.330545}, {lat:  47.514484, lng: -122.330543}, {lat:  47.514482, lng: -122.330541}, {lat:  47.514479, lng: -122.330539}, {lat:  47.514477, lng: -122.330538}, {lat:  47.514474, lng: -122.330536}, {lat:  47.514472, lng: -122.330534}, {lat:  47.51447, lng: -122.330532}, {lat:  47.514467, lng: -122.330531}, {lat:  47.514465, lng: -122.330529}, {lat:  47.514462, lng: -122.330527}, {lat:  47.51446, lng: -122.330525}, {lat:  47.514457, lng: -122.330524}, {lat:  47.514455, lng: -122.330522}, {lat:  47.514452, lng: -122.33052}, {lat:  47.51445, lng: -122.330518}, {lat:  47.514447, lng: -122.330517}, {lat:  47.514445, lng: -122.330515}, {lat:  47.514442, lng: -122.330513}, {lat:  47.51444, lng: -122.330512}, {lat:  47.514437, lng: -122.33051}, {lat:  47.514435, lng: -122.330508}, {lat:  47.514432, lng: -122.330507}, {lat:  47.51443, lng: -122.330505}, {lat:  47.514427, lng: -122.330503}, {lat:  47.514425, lng: -122.330502}, {lat:  47.514422, lng: -122.3305}, {lat:  47.51442, lng: -122.330498}, {lat:  47.514417, lng: -122.330497}, {lat:  47.514415, lng: -122.330495}, {lat:  47.514412, lng: -122.330494}, {lat:  47.51441, lng: -122.330492}, {lat:  47.514407, lng: -122.33049}, {lat:  47.514405, lng: -122.330489}, {lat:  47.514402, lng: -122.330487}, {lat:  47.514399, lng: -122.330486}, {lat:  47.514397, lng: -122.330484}, {lat:  47.514394, lng: -122.330483}, {lat:  47.514392, lng: -122.330481}, {lat:  47.514389, lng: -122.33048}, {lat:  47.514387, lng: -122.330478}, {lat:  47.514384, lng: -122.330477}, {lat:  47.514382, lng: -122.330475}, {lat:  47.514379, lng: -122.330474}, {lat:  47.514377, lng: -122.330472}, {lat:  47.514374, lng: -122.330471}, {lat:  47.514372, lng: -122.330469}, {lat:  47.514369, lng: -122.330468}, {lat:  47.514366, lng: -122.330466}, {lat:  47.514364, lng: -122.330465}, {lat:  47.514361, lng: -122.330463}, {lat:  47.514359, lng: -122.330462}, {lat:  47.514356, lng: -122.33046}, {lat:  47.514354, lng: -122.330459}, {lat:  47.514351, lng: -122.330457}, {lat:  47.514349, lng: -122.330456}, {lat:  47.514346, lng: -122.330454}, {lat:  47.514343, lng: -122.330453}, {lat:  47.514341, lng: -122.330451}, {lat:  47.514338, lng: -122.33045}, {lat:  47.514336, lng: -122.330448}, {lat:  47.514333, lng: -122.330447}, {lat:  47.514331, lng: -122.330445}, {lat:  47.514328, lng: -122.330444}, {lat:  47.514326, lng: -122.330442}, {lat:  47.514323, lng: -122.330441}, {lat:  47.514321, lng: -122.330439}, {lat:  47.514316, lng: -122.330437}, {lat:  47.514199, lng: -122.330376}, {lat:  47.513999, lng: -122.33027}, {lat:  47.513999, lng: -122.330077}, {lat:  47.513998, lng: -122.329445}, {lat:  47.514004, lng: -122.328479}, {lat:  47.514005, lng: -122.328185}, {lat:  47.51401, lng: -122.32733}, {lat:  47.514395, lng: -122.327532}, {lat:  47.514705, lng: -122.327694}, {lat:  47.514995, lng: -122.327845}, {lat:  47.515218, lng: -122.327962}, {lat:  47.515411, lng: -122.328063}, {lat:  47.515493, lng: -122.328106}, {lat:  47.515782, lng: -122.328256}, {lat:  47.516509, lng: -122.328637}, {lat:  47.517128, lng: -122.329175}, {lat:  47.517172, lng: -122.329197}, {lat:  47.517186, lng: -122.329205}, {lat:  47.517206, lng: -122.329215}, {lat:  47.517227, lng: -122.329179}, {lat:  47.517227, lng: -122.329208}, {lat:  47.517227, lng: -122.329211}, {lat:  47.517227, lng: -122.329213}, {lat:  47.517227, lng: -122.329215}, {lat:  47.517227, lng: -122.329224}, {lat:  47.517225, lng: -122.329254}, {lat:  47.517227, lng: -122.329369}, {lat:  47.517227, lng: -122.329406}, {lat:  47.517227, lng: -122.329422}, {lat:  47.517227, lng: -122.329449}, {lat:  47.51725, lng: -122.32949}, {lat:  47.517358, lng: -122.32949}, {lat:  47.517394, lng: -122.32949}, {lat:  47.517617, lng: -122.329489}, {lat:  47.517984, lng: -122.329488}, {lat:  47.51807, lng: -122.329488}, {lat:  47.518193, lng: -122.329488}, {lat:  47.518243, lng: -122.32952}, {lat:  47.518405, lng: -122.329608}, {lat:  47.518608, lng: -122.329719}, {lat:  47.520903, lng: -122.330965}, {lat:  47.520902, lng: -122.331314}, {lat:  47.520902, lng: -122.331462}, {lat:  47.520901, lng: -122.33167}, {lat:  47.520947, lng: -122.331701}, {lat:  47.520961, lng: -122.331515}, {lat:  47.520996, lng: -122.33103}, {lat:  47.520993, lng: -122.330981}, {lat:  47.520986, lng: -122.330849}, {lat:  47.520974, lng: -122.330618}, {lat:  47.520912, lng: -122.330088}, {lat:  47.520919, lng: -122.329607}, {lat:  47.520927, lng: -122.327914}, {lat:  47.520926, lng: -122.325891}, {lat:  47.52092, lng: -122.325891}, {lat:  47.52092, lng: -122.325876}, {lat:  47.520232, lng: -122.325881}, {lat:  47.518696, lng: -122.325879}, {lat:  47.518691, lng: -122.325634}, {lat:  47.51869, lng: -122.325036}, {lat:  47.51869, lng: -122.324977}, {lat:  47.51869, lng: -122.324975}, {lat:  47.51869, lng: -122.324969}, {lat:  47.51869, lng: -122.324915}, {lat:  47.51869, lng: -122.32479}, {lat:  47.518689, lng: -122.324677}, {lat:  47.51871, lng: -122.32377}, {lat:  47.518724, lng: -122.323156}, {lat:  47.51872, lng: -122.321622}, {lat:  47.518722, lng: -122.321307}, {lat:  47.51872, lng: -122.320358}, {lat:  47.51872, lng: -122.320151}, {lat:  47.518728, lng: -122.318616}, {lat:  47.51873, lng: -122.318428}, {lat:  47.518733, lng: -122.318146}, {lat:  47.51876, lng: -122.317745}, {lat:  47.519157, lng: -122.317741}, {lat:  47.519887, lng: -122.317734}, {lat:  47.520062, lng: -122.317729}, {lat:  47.520209, lng: -122.317725}, {lat:  47.520349, lng: -122.317723}, {lat:  47.520484, lng: -122.317721}, {lat:  47.520633, lng: -122.317719}, {lat:  47.521025, lng: -122.317708}, {lat:  47.521314, lng: -122.317708}, {lat:  47.522228, lng: -122.317671}, {lat:  47.522227, lng: -122.317556}, {lat:  47.522241, lng: -122.317556}, {lat:  47.522233, lng: -122.314982}, {lat:  47.522229, lng: -122.313523}, {lat:  47.522229, lng: -122.313471}, {lat:  47.522227, lng: -122.312974}, {lat:  47.522226, lng: -122.312915}, {lat:  47.522226, lng: -122.312914}, {lat:  47.522226, lng: -122.312913}, {lat:  47.522225, lng: -122.312902}, {lat:  47.522186, lng: -122.312899}, {lat:  47.522186, lng: -122.312853}, {lat:  47.522183, lng: -122.311876}, {lat:  47.522181, lng: -122.311407}, {lat:  47.522178, lng: -122.31027}, {lat:  47.522177, lng: -122.309798}, {lat:  47.522176, lng: -122.309768}, {lat:  47.522182, lng: -122.309738}, {lat:  47.522344, lng: -122.309774}, {lat:  47.522989, lng: -122.309676}, {lat:  47.52309, lng: -122.309666}, {lat:  47.523163, lng: -122.309649}, {lat:  47.523248, lng: -122.309636}, {lat:  47.52389, lng: -122.309866}, {lat:  47.523963, lng: -122.309864}, {lat:  47.524294, lng: -122.309731}, {lat:  47.524863, lng: -122.310128}, {lat:  47.525386, lng: -122.310732}, {lat:  47.525389, lng: -122.310734}, {lat:  47.525465, lng: -122.310792}, {lat:  47.525497, lng: -122.310817}, {lat:  47.525579, lng: -122.31088}, {lat:  47.525658, lng: -122.310941}, {lat:  47.525764, lng: -122.311099}, {lat:  47.526188, lng: -122.311443}, {lat:  47.526369, lng: -122.311624}, {lat:  47.526491, lng: -122.311739}, {lat:  47.526563, lng: -122.311851}, {lat:  47.526585, lng: -122.311895}, {lat:  47.526777, lng: -122.312645}, {lat:  47.526819, lng: -122.312833}, {lat:  47.527316, lng: -122.314718}, {lat:  47.527369, lng: -122.314898}, {lat:  47.528171, lng: -122.317483}, {lat:  47.528173, lng: -122.317487}, {lat:  47.528177, lng: -122.317498}, {lat:  47.528206, lng: -122.317552}, {lat:  47.528216, lng: -122.317569}, {lat:  47.528555, lng: -122.317614}, {lat:  47.528831, lng: -122.317605}, {lat:  47.529032, lng: -122.31759}, {lat:  47.529175, lng: -122.317583}, {lat:  47.529419, lng: -122.31759}, {lat:  47.529438, lng: -122.31759}, {lat:  47.529438, lng: -122.317708}, {lat:  47.529438, lng: -122.31781}, {lat:  47.529439, lng: -122.317912}, {lat:  47.529439, lng: -122.318014}, {lat:  47.529439, lng: -122.318116}, {lat:  47.52944, lng: -122.318241}, {lat:  47.52944, lng: -122.31832}, {lat:  47.52944, lng: -122.318422}, {lat:  47.529441, lng: -122.318508}, {lat:  47.529698, lng: -122.318503}, {lat:  47.52978, lng: -122.318502}, {lat:  47.529863, lng: -122.3185}, {lat:  47.530137, lng: -122.318495}, {lat:  47.530411, lng: -122.31849}, {lat:  47.530508, lng: -122.318489}, {lat:  47.530575, lng: -122.318488}, {lat:  47.53085, lng: -122.318483}, {lat:  47.530919, lng: -122.318482}, {lat:  47.531025, lng: -122.31848}, {lat:  47.531245, lng: -122.318479}, {lat:  47.531284, lng: -122.318545}, {lat:  47.53165, lng: -122.319491}, {lat:  47.531967, lng: -122.319793}, {lat:  47.53302, lng: -122.321313}, {lat:  47.53313, lng: -122.321683}, {lat:  47.533747, lng: -122.322426}, {lat:  47.53411, lng: -122.323203}, {lat:  47.534596, lng: -122.324654}, {lat:  47.535005, lng: -122.325294}, {lat:  47.535692, lng: -122.326004}, {lat:  47.537291, lng: -122.328536}, {lat:  47.537562, lng: -122.328738}, {lat:  47.53807, lng: -122.329547}, {lat:  47.539112, lng: -122.330864}, {lat:  47.539323, lng: -122.331406}, {lat:  47.539417, lng: -122.332146}, {lat:  47.539867, lng: -122.33218}, {lat:  47.541176, lng: -122.334172}, {lat:  47.54126, lng: -122.334374}, {lat:  47.541331, lng: -122.334543}, {lat:  47.541881, lng: -122.334915}, {lat:  47.542116, lng: -122.335138}, {lat:  47.542631, lng: -122.335625}, {lat:  47.543366, lng: -122.336771}, {lat:  47.54387, lng: -122.338089}, {lat:  47.545125, lng: -122.338732}, {lat:  47.545329, lng: -122.338495}, {lat:  47.545969, lng: -122.338563}, {lat:  47.546402, lng: -122.3389}, {lat:  47.546531, lng: -122.338942}, {lat:  47.547341, lng: -122.339205}, {lat:  47.548027, lng: -122.339676}, {lat:  47.548281, lng: -122.33998}, {lat:  47.548483, lng: -122.34096}, {lat:  47.54858, lng: -122.341972}, {lat:  47.548849, lng: -122.341873}, {lat:  47.549493, lng: -122.341264}, {lat:  47.549878, lng: -122.340994}, {lat:  47.550383, lng: -122.34086}, {lat:  47.550795, lng: -122.340758}, {lat:  47.551049, lng: -122.341029}, {lat:  47.55116, lng: -122.341569}, {lat:  47.551845, lng: -122.341739}, {lat:  47.552305, lng: -122.342009}, {lat:  47.552621, lng: -122.342109}, {lat:  47.553424, lng: -122.34255}, {lat:  47.553874, lng: -122.342651}, {lat:  47.554084, lng: -122.342853}, {lat:  47.554813, lng: -122.343159}, {lat:  47.555204, lng: -122.343698}, {lat:  47.555297, lng: -122.344239}, {lat:  47.555089, lng: -122.345623}, {lat:  47.555111, lng: -122.346333}, {lat:  47.555431, lng: -122.347377}, {lat:  47.556048, lng: -122.34802}, {lat:  47.556691, lng: -122.348863}, {lat:  47.557757, lng: -122.349776}, {lat:  47.558155, lng: -122.349912}, {lat:  47.558722, lng: -122.349912}, {lat:  47.559458, lng: -122.349642}, {lat:  47.560159, lng: -122.349643}, {lat:  47.561323, lng: -122.350118}, {lat:  47.561575, lng: -122.350083}, {lat:  47.561781, lng: -122.349848}, {lat:  47.562108, lng: -122.348936}, {lat:  47.563289, lng: -122.347857}, {lat:  47.564732, lng: -122.348499}, {lat:  47.565873, lng: -122.349781}, {lat:  47.56674, lng: -122.350087}, {lat:  47.567909, lng: -122.349987}, {lat:  47.568133, lng: -122.350088}, {lat:  47.569049, lng: -122.351238}, {lat:  47.570191, lng: -122.352858}, {lat:  47.571722, lng: -122.354616}, {lat:  47.572205, lng: -122.355462}, {lat:  47.573211, lng: -122.356811}, {lat:  47.573529, lng: -122.357576}, {lat:  47.573549, lng: -122.357624}, {lat:  47.573532, lng: -122.361068}, {lat:  47.573731, lng: -122.361169}, {lat:  47.575472, lng: -122.361219}, {lat:  47.575473, lng: -122.361416}, {lat:  47.57985, lng: -122.361419}, {lat:  47.579905, lng: -122.361649}, {lat:  47.58123, lng: -122.361783}, {lat:  47.581346, lng: -122.361987}, {lat:  47.583444, lng: -122.361989}, {lat:  47.584452, lng: -122.362058}, {lat:  47.584513, lng: -122.365235}, {lat:  47.584882, lng: -122.365335}, {lat:  47.584697, lng: -122.367632}, {lat:  47.584746, lng: -122.368477}, {lat:  47.584724, lng: -122.36922}, {lat:  47.583968, lng: -122.369288}, {lat:  47.583693, lng: -122.369995}, {lat:  47.583056, lng: -122.370037}, {lat:  47.583337, lng: -122.371816}]
      ],
      { strokeColor: '#FF0000'}
    );
    var dist2 = handler.addPolygons(
      [
        [{lat:  47.554586, lng: -122.254509}, {lat:  47.55446, lng: -122.254436}, {lat:  47.554271, lng: -122.254444}, {lat:  47.554028, lng: -122.254429}, {lat:  47.553802, lng: -122.254397}, {lat:  47.553578, lng: -122.254471}, {lat:  47.553372, lng: -122.254616}, {lat:  47.553221, lng: -122.254885}, {lat:  47.553, lng: -122.255411}, {lat:  47.552901, lng: -122.255574}, {lat:  47.552587, lng: -122.255907}, {lat:  47.55243, lng: -122.256301}, {lat:  47.552299, lng: -122.256595}, {lat:  47.55222, lng: -122.25686}, {lat:  47.552147, lng: -122.256944}, {lat:  47.551877, lng: -122.257177}, {lat:  47.551312, lng: -122.257664}, {lat:  47.551298, lng: -122.258098}, {lat:  47.551287, lng: -122.258381}, {lat:  47.551271, lng: -122.259204}, {lat:  47.551297, lng: -122.25933}, {lat:  47.551338, lng: -122.25953}, {lat:  47.551489, lng: -122.259716}, {lat:  47.551736, lng: -122.259828}, {lat:  47.552083, lng: -122.259881}, {lat:  47.552515, lng: -122.259979}, {lat:  47.552764, lng: -122.260043}, {lat:  47.552999, lng: -122.260093}, {lat:  47.553535, lng: -122.260337}, {lat:  47.553734, lng: -122.260481}, {lat:  47.554158, lng: -122.26066}, {lat:  47.554672, lng: -122.260715}, {lat:  47.555006, lng: -122.260901}, {lat:  47.555178, lng: -122.261056}, {lat:  47.556226, lng: -122.261687}, {lat:  47.55645, lng: -122.261671}, {lat:  47.556953, lng: -122.261516}, {lat:  47.557122, lng: -122.261494}, {lat:  47.557142, lng: -122.261491}, {lat:  47.557304, lng: -122.261556}, {lat:  47.557504, lng: -122.261839}, {lat:  47.557694, lng: -122.261977}, {lat:  47.558019, lng: -122.262139}, {lat:  47.558284, lng: -122.262376}, {lat:  47.558353, lng: -122.262439}, {lat:  47.558526, lng: -122.262657}, {lat:  47.558826, lng: -122.263159}, {lat:  47.559171, lng: -122.263588}, {lat:  47.559396, lng: -122.263693}, {lat:  47.55991, lng: -122.263782}, {lat:  47.560254, lng: -122.263983}, {lat:  47.560461, lng: -122.264122}, {lat:  47.560618, lng: -122.264221}, {lat:  47.560741, lng: -122.264299}, {lat:  47.561499, lng: -122.264673}, {lat:  47.561576, lng: -122.264812}, {lat:  47.561752, lng: -122.26476}, {lat:  47.561804, lng: -122.264846}, {lat:  47.561802, lng: -122.264975}, {lat:  47.561549, lng: -122.265148}, {lat:  47.561518, lng: -122.265477}, {lat:  47.561682, lng: -122.266499}, {lat:  47.562022, lng: -122.26721}, {lat:  47.56281, lng: -122.267923}, {lat:  47.562955, lng: -122.268004}, {lat:  47.563576, lng: -122.268356}, {lat:  47.564203, lng: -122.268312}, {lat:  47.56449, lng: -122.26824}, {lat:  47.564825, lng: -122.267878}, {lat:  47.564785, lng: -122.267639}, {lat:  47.564729, lng: -122.267452}, {lat:  47.564755, lng: -122.267164}, {lat:  47.56483, lng: -122.267078}, {lat:  47.564921, lng: -122.267084}, {lat:  47.565014, lng: -122.267084}, {lat:  47.565194, lng: -122.267188}, {lat:  47.565317, lng: -122.26724}, {lat:  47.565387, lng: -122.267269}, {lat:  47.565549, lng: -122.267497}, {lat:  47.565722, lng: -122.267856}, {lat:  47.565836, lng: -122.267938}, {lat:  47.566174, lng: -122.268048}, {lat:  47.566316, lng: -122.268109}, {lat:  47.56646, lng: -122.268255}, {lat:  47.566653, lng: -122.268323}, {lat:  47.567192, lng: -122.269008}, {lat:  47.56762, lng: -122.269565}, {lat:  47.567784, lng: -122.269842}, {lat:  47.567887, lng: -122.270083}, {lat:  47.567876, lng: -122.270331}, {lat:  47.567775, lng: -122.270915}, {lat:  47.56777, lng: -122.271243}, {lat:  47.567777, lng: -122.271786}, {lat:  47.567886, lng: -122.272173}, {lat:  47.568257, lng: -122.272446}, {lat:  47.56824, lng: -122.272558}, {lat:  47.568267, lng: -122.272762}, {lat:  47.568688, lng: -122.273228}, {lat:  47.569403, lng: -122.274009}, {lat:  47.569903, lng: -122.274829}, {lat:  47.570221, lng: -122.275528}, {lat:  47.570241, lng: -122.276286}, {lat:  47.57039, lng: -122.276423}, {lat:  47.570703, lng: -122.276681}, {lat:  47.570865, lng: -122.276734}, {lat:  47.571167, lng: -122.276824}, {lat:  47.571436, lng: -122.276903}, {lat:  47.571601, lng: -122.277082}, {lat:  47.571665, lng: -122.277207}, {lat:  47.571612, lng: -122.277403}, {lat:  47.571163, lng: -122.277757}, {lat:  47.571071, lng: -122.27783}, {lat:  47.570253, lng: -122.27819}, {lat:  47.570216, lng: -122.278998}, {lat:  47.570605, lng: -122.279555}, {lat:  47.570757, lng: -122.279772}, {lat:  47.571156, lng: -122.280104}, {lat:  47.571252, lng: -122.280184}, {lat:  47.571935, lng: -122.28038}, {lat:  47.572333, lng: -122.280566}, {lat:  47.573303, lng: -122.280574}, {lat:  47.574152, lng: -122.280899}, {lat:  47.575278, lng: -122.281758}, {lat:  47.576185, lng: -122.28245}, {lat:  47.57783, lng: -122.283197}, {lat:  47.578729, lng: -122.28345}, {lat:  47.579944, lng: -122.283886}, {lat:  47.581447, lng: -122.285098}, {lat:  47.581992, lng: -122.285536}, {lat:  47.582484, lng: -122.28644}, {lat:  47.58248, lng: -122.286525}, {lat:  47.582503, lng: -122.286564}, {lat:  47.583262, lng: -122.287834}, {lat:  47.584375, lng: -122.287834}, {lat:  47.585031, lng: -122.287309}, {lat:  47.585086, lng: -122.287296}, {lat:  47.585108, lng: -122.287278}, {lat:  47.585442, lng: -122.286997}, {lat:  47.585858, lng: -122.286293}, {lat:  47.586249, lng: -122.285756}, {lat:  47.586583, lng: -122.285954}, {lat:  47.586682, lng: -122.285936}, {lat:  47.587576, lng: -122.285426}, {lat:  47.588068, lng: -122.285443}, {lat:  47.588619, lng: -122.285232}, {lat:  47.589451, lng: -122.285475}, {lat:  47.588785, lng: -122.285514}, {lat:  47.587621, lng: -122.285761}, {lat:  47.586591, lng: -122.286119}, {lat:  47.586671, lng: -122.28675}, {lat:  47.586458, lng: -122.286835}, {lat:  47.586322, lng: -122.286866}, {lat:  47.586189, lng: -122.286921}, {lat:  47.586048, lng: -122.28702}, {lat:  47.585563, lng: -122.287444}, {lat:  47.585508, lng: -122.287487}, {lat:  47.585451, lng: -122.287532}, {lat:  47.585209, lng: -122.287673}, {lat:  47.585112, lng: -122.287724}, {lat:  47.585107, lng: -122.287727}, {lat:  47.585024, lng: -122.287772}, {lat:  47.584801, lng: -122.287865}, {lat:  47.584599, lng: -122.287902}, {lat:  47.584156, lng: -122.287912}, {lat:  47.583288, lng: -122.287897}, {lat:  47.583186, lng: -122.287868}, {lat:  47.583113, lng: -122.287834}, {lat:  47.583036, lng: -122.287777}, {lat:  47.58294, lng: -122.287639}, {lat:  47.58284, lng: -122.28778}, {lat:  47.582799, lng: -122.287805}, {lat:  47.582599, lng: -122.287824}, {lat:  47.582509, lng: -122.287832}, {lat:  47.582509, lng: -122.287833}, {lat:  47.582459, lng: -122.287837}, {lat:  47.582431, lng: -122.287839}, {lat:  47.582341, lng: -122.287846}, {lat:  47.582174, lng: -122.287859}, {lat:  47.582107, lng: -122.287868}, {lat:  47.581987, lng: -122.287884}, {lat:  47.581924, lng: -122.287892}, {lat:  47.581854, lng: -122.287899}, {lat:  47.58184, lng: -122.287903}, {lat:  47.581814, lng: -122.287909}, {lat:  47.580028, lng: -122.288183}, {lat:  47.579851, lng: -122.28821}, {lat:  47.57972, lng: -122.288162}, {lat:  47.579679, lng: -122.288147}, {lat:  47.57936, lng: -122.288029}, {lat:  47.578342, lng: -122.287923}, {lat:  47.578342, lng: -122.287925}, {lat:  47.578341, lng: -122.288304}, {lat:  47.578341, lng: -122.288499}, {lat:  47.57834, lng: -122.288727}, {lat:  47.578341, lng: -122.289229}, {lat:  47.578351, lng: -122.289785}, {lat:  47.578345, lng: -122.290869}, {lat:  47.579647, lng: -122.290863}, {lat:  47.579647, lng: -122.290865}, {lat:  47.580959, lng: -122.290871}, {lat:  47.580961, lng: -122.290871}, {lat:  47.580963, lng: -122.291474}, {lat:  47.580963, lng: -122.291925}, {lat:  47.580964, lng: -122.292999}, {lat:  47.580965, lng: -122.294152}, {lat:  47.58097, lng: -122.294294}, {lat:  47.580972, lng: -122.294325}, {lat:  47.580975, lng: -122.295138}, {lat:  47.58098, lng: -122.296442}, {lat:  47.581115, lng: -122.296442}, {lat:  47.582025, lng: -122.297464}, {lat:  47.58153, lng: -122.297152}, {lat:  47.581265, lng: -122.296992}, {lat:  47.581018, lng: -122.297712}, {lat:  47.580979, lng: -122.297928}, {lat:  47.580986, lng: -122.299078}, {lat:  47.580993, lng: -122.300166}, {lat:  47.580994, lng: -122.300167}, {lat:  47.581242, lng: -122.300356}, {lat:  47.582507, lng: -122.301322}, {lat:  47.582591, lng: -122.301386}, {lat:  47.582597, lng: -122.301391}, {lat:  47.582763, lng: -122.301518}, {lat:  47.583145, lng: -122.30181}, {lat:  47.583656, lng: -122.302199}, {lat:  47.584457, lng: -122.302842}, {lat:  47.584507, lng: -122.302882}, {lat:  47.584542, lng: -122.30291}, {lat:  47.584547, lng: -122.302913}, {lat:  47.585494, lng: -122.302934}, {lat:  47.586324, lng: -122.302926}, {lat:  47.586328, lng: -122.304241}, {lat:  47.586333, lng: -122.305536}, {lat:  47.586337, lng: -122.306841}, {lat:  47.586342, lng: -122.308146}, {lat:  47.586347, lng: -122.30945}, {lat:  47.587746, lng: -122.309465}, {lat:  47.588426, lng: -122.309469}, {lat:  47.589083, lng: -122.309477}, {lat:  47.589393, lng: -122.309475}, {lat:  47.589468, lng: -122.309473}, {lat:  47.589571, lng: -122.309425}, {lat:  47.59001, lng: -122.309858}, {lat:  47.590373, lng: -122.310217}, {lat:  47.590831, lng: -122.310494}, {lat:  47.590855, lng: -122.310528}, {lat:  47.590856, lng: -122.310529}, {lat:  47.591016, lng: -122.310526}, {lat:  47.591463, lng: -122.311128}, {lat:  47.591718, lng: -122.31133}, {lat:  47.592113, lng: -122.311633}, {lat:  47.592579, lng: -122.311996}, {lat:  47.593445, lng: -122.31266}, {lat:  47.593727, lng: -122.312878}, {lat:  47.593731, lng: -122.312881}, {lat:  47.593927, lng: -122.313061}, {lat:  47.594059, lng: -122.313225}, {lat:  47.594188, lng: -122.313415}, {lat:  47.59429, lng: -122.3136}, {lat:  47.594311, lng: -122.313637}, {lat:  47.594432, lng: -122.313908}, {lat:  47.594561, lng: -122.314228}, {lat:  47.594674, lng: -122.314552}, {lat:  47.594743, lng: -122.314833}, {lat:  47.59478, lng: -122.315015}, {lat:  47.594816, lng: -122.315222}, {lat:  47.594838, lng: -122.315422}, {lat:  47.594852, lng: -122.315605}, {lat:  47.59486, lng: -122.315793}, {lat:  47.594864, lng: -122.315933}, {lat:  47.594864, lng: -122.316103}, {lat:  47.594849, lng: -122.316326}, {lat:  47.594826, lng: -122.316528}, {lat:  47.594787, lng: -122.316748}, {lat:  47.594739, lng: -122.316971}, {lat:  47.594699, lng: -122.317129}, {lat:  47.594699, lng: -122.317131}, {lat:  47.59466, lng: -122.31728}, {lat:  47.594706, lng: -122.317279}, {lat:  47.594882, lng: -122.317275}, {lat:  47.595045, lng: -122.317272}, {lat:  47.595197, lng: -122.317269}, {lat:  47.595674, lng: -122.317259}, {lat:  47.59582, lng: -122.317255}, {lat:  47.596605, lng: -122.317233}, {lat:  47.596659, lng: -122.317232}, {lat:  47.5975, lng: -122.317227}, {lat:  47.598338, lng: -122.317228}, {lat:  47.599189, lng: -122.317223}, {lat:  47.599189, lng: -122.317194}, {lat:  47.600017, lng: -122.317191}, {lat:  47.600107, lng: -122.317191}, {lat:  47.600115, lng: -122.317191}, {lat:  47.600124, lng: -122.317191}, {lat:  47.600126, lng: -122.317191}, {lat:  47.600129, lng: -122.317191}, {lat:  47.600132, lng: -122.317191}, {lat:  47.600135, lng: -122.317191}, {lat:  47.600137, lng: -122.31719}, {lat:  47.60014, lng: -122.31719}, {lat:  47.600143, lng: -122.31719}, {lat:  47.600146, lng: -122.31719}, {lat:  47.600148, lng: -122.31719}, {lat:  47.600151, lng: -122.31719}, {lat:  47.600154, lng: -122.31719}, {lat:  47.600157, lng: -122.31719}, {lat:  47.600159, lng: -122.31719}, {lat:  47.600162, lng: -122.31719}, {lat:  47.600165, lng: -122.31719}, {lat:  47.600168, lng: -122.317189}, {lat:  47.60017, lng: -122.317189}, {lat:  47.600173, lng: -122.317189}, {lat:  47.600176, lng: -122.317189}, {lat:  47.600178, lng: -122.317189}, {lat:  47.600181, lng: -122.317189}, {lat:  47.600184, lng: -122.317189}, {lat:  47.600187, lng: -122.317189}, {lat:  47.600189, lng: -122.317188}, {lat:  47.600192, lng: -122.317188}, {lat:  47.600195, lng: -122.317188}, {lat:  47.600198, lng: -122.317188}, {lat:  47.6002, lng: -122.317188}, {lat:  47.600203, lng: -122.317188}, {lat:  47.600206, lng: -122.317187}, {lat:  47.600209, lng: -122.317187}, {lat:  47.600211, lng: -122.317187}, {lat:  47.600214, lng: -122.317187}, {lat:  47.600217, lng: -122.317187}, {lat:  47.60022, lng: -122.317186}, {lat:  47.600222, lng: -122.317186}, {lat:  47.600225, lng: -122.317186}, {lat:  47.600228, lng: -122.317186}, {lat:  47.600231, lng: -122.317185}, {lat:  47.600233, lng: -122.317185}, {lat:  47.600236, lng: -122.317185}, {lat:  47.600239, lng: -122.317185}, {lat:  47.600241, lng: -122.317184}, {lat:  47.600244, lng: -122.317184}, {lat:  47.600247, lng: -122.317184}, {lat:  47.60025, lng: -122.317184}, {lat:  47.600252, lng: -122.317183}, {lat:  47.600255, lng: -122.317183}, {lat:  47.600258, lng: -122.317183}, {lat:  47.600261, lng: -122.317182}, {lat:  47.600263, lng: -122.317182}, {lat:  47.600266, lng: -122.317182}, {lat:  47.600269, lng: -122.317182}, {lat:  47.600272, lng: -122.317181}, {lat:  47.600274, lng: -122.317181}, {lat:  47.600277, lng: -122.317181}, {lat:  47.60028, lng: -122.31718}, {lat:  47.600282, lng: -122.31718}, {lat:  47.600285, lng: -122.31718}, {lat:  47.600288, lng: -122.317179}, {lat:  47.600291, lng: -122.317179}, {lat:  47.600293, lng: -122.317179}, {lat:  47.600296, lng: -122.317178}, {lat:  47.600299, lng: -122.317178}, {lat:  47.600302, lng: -122.317178}, {lat:  47.600304, lng: -122.317177}, {lat:  47.600307, lng: -122.317177}, {lat:  47.600309, lng: -122.317176}, {lat:  47.60031, lng: -122.317176}, {lat:  47.600313, lng: -122.317176}, {lat:  47.600315, lng: -122.317176}, {lat:  47.600318, lng: -122.317175}, {lat:  47.600321, lng: -122.317175}, {lat:  47.600323, lng: -122.317174}, {lat:  47.600326, lng: -122.317174}, {lat:  47.600329, lng: -122.317174}, {lat:  47.600332, lng: -122.317173}, {lat:  47.600334, lng: -122.317173}, {lat:  47.600337, lng: -122.317172}, {lat:  47.60034, lng: -122.317172}, {lat:  47.600343, lng: -122.317171}, {lat:  47.600345, lng: -122.317171}, {lat:  47.600348, lng: -122.317171}, {lat:  47.600351, lng: -122.31717}, {lat:  47.600353, lng: -122.31717}, {lat:  47.600356, lng: -122.317169}, {lat:  47.600359, lng: -122.317169}, {lat:  47.600362, lng: -122.317168}, {lat:  47.600364, lng: -122.317168}, {lat:  47.600367, lng: -122.317167}, {lat:  47.60037, lng: -122.317167}, {lat:  47.600372, lng: -122.317166}, {lat:  47.600375, lng: -122.317166}, {lat:  47.600378, lng: -122.317165}, {lat:  47.600381, lng: -122.317165}, {lat:  47.600383, lng: -122.317164}, {lat:  47.600386, lng: -122.317164}, {lat:  47.600389, lng: -122.317163}, {lat:  47.600391, lng: -122.317163}, {lat:  47.600394, lng: -122.317162}, {lat:  47.600397, lng: -122.317162}, {lat:  47.6004, lng: -122.317161}, {lat:  47.600402, lng: -122.317161}, {lat:  47.600405, lng: -122.31716}, {lat:  47.600408, lng: -122.317159}, {lat:  47.600411, lng: -122.317159}, {lat:  47.600413, lng: -122.317158}, {lat:  47.600416, lng: -122.317158}, {lat:  47.600419, lng: -122.317157}, {lat:  47.600421, lng: -122.317157}, {lat:  47.600424, lng: -122.317156}, {lat:  47.600427, lng: -122.317155}, {lat:  47.600429, lng: -122.317155}, {lat:  47.600432, lng: -122.317154}, {lat:  47.600435, lng: -122.317154}, {lat:  47.600438, lng: -122.317153}, {lat:  47.60044, lng: -122.317152}, {lat:  47.600443, lng: -122.317152}, {lat:  47.600446, lng: -122.317151}, {lat:  47.600448, lng: -122.31715}, {lat:  47.600451, lng: -122.31715}, {lat:  47.600454, lng: -122.317149}, {lat:  47.600457, lng: -122.317148}, {lat:  47.600459, lng: -122.317148}, {lat:  47.600462, lng: -122.317147}, {lat:  47.600465, lng: -122.317146}, {lat:  47.600467, lng: -122.317146}, {lat:  47.60047, lng: -122.317145}, {lat:  47.600473, lng: -122.317144}, {lat:  47.600476, lng: -122.317144}, {lat:  47.600478, lng: -122.317143}, {lat:  47.600481, lng: -122.317142}, {lat:  47.600484, lng: -122.317142}, {lat:  47.600486, lng: -122.317141}, {lat:  47.600489, lng: -122.31714}, {lat:  47.600492, lng: -122.31714}, {lat:  47.600494, lng: -122.317139}, {lat:  47.600497, lng: -122.317138}, {lat:  47.6005, lng: -122.317137}, {lat:  47.600502, lng: -122.317137}, {lat:  47.600505, lng: -122.317136}, {lat:  47.600508, lng: -122.317135}, {lat:  47.600511, lng: -122.317134}, {lat:  47.600513, lng: -122.317134}, {lat:  47.600516, lng: -122.317133}, {lat:  47.600519, lng: -122.317132}, {lat:  47.600521, lng: -122.317131}, {lat:  47.600524, lng: -122.317131}, {lat:  47.600527, lng: -122.31713}, {lat:  47.600529, lng: -122.317129}, {lat:  47.600532, lng: -122.317128}, {lat:  47.600535, lng: -122.317127}, {lat:  47.600537, lng: -122.317127}, {lat:  47.60054, lng: -122.317126}, {lat:  47.600543, lng: -122.317125}, {lat:  47.600546, lng: -122.317124}, {lat:  47.600548, lng: -122.317123}, {lat:  47.600551, lng: -122.317123}, {lat:  47.600554, lng: -122.317122}, {lat:  47.600556, lng: -122.317121}, {lat:  47.600559, lng: -122.31712}, {lat:  47.600562, lng: -122.317119}, {lat:  47.600564, lng: -122.317118}, {lat:  47.600567, lng: -122.317117}, {lat:  47.60057, lng: -122.317117}, {lat:  47.600572, lng: -122.317116}, {lat:  47.600575, lng: -122.317115}, {lat:  47.600578, lng: -122.317114}, {lat:  47.60058, lng: -122.317113}, {lat:  47.600583, lng: -122.317112}, {lat:  47.600586, lng: -122.317111}, {lat:  47.600588, lng: -122.31711}, {lat:  47.600591, lng: -122.31711}, {lat:  47.600594, lng: -122.317109}, {lat:  47.600596, lng: -122.317108}, {lat:  47.600599, lng: -122.317107}, {lat:  47.600602, lng: -122.317106}, {lat:  47.600604, lng: -122.317105}, {lat:  47.600607, lng: -122.317104}, {lat:  47.60061, lng: -122.317103}, {lat:  47.600612, lng: -122.317102}, {lat:  47.600615, lng: -122.317101}, {lat:  47.600618, lng: -122.3171}, {lat:  47.60062, lng: -122.317099}, {lat:  47.600623, lng: -122.317098}, {lat:  47.600626, lng: -122.317097}, {lat:  47.600628, lng: -122.317096}, {lat:  47.600631, lng: -122.317095}, {lat:  47.600634, lng: -122.317094}, {lat:  47.600636, lng: -122.317093}, {lat:  47.600639, lng: -122.317092}, {lat:  47.600642, lng: -122.317091}, {lat:  47.600644, lng: -122.31709}, {lat:  47.600647, lng: -122.317089}, {lat:  47.60065, lng: -122.317088}, {lat:  47.600652, lng: -122.317087}, {lat:  47.600655, lng: -122.317086}, {lat:  47.600658, lng: -122.317085}, {lat:  47.60066, lng: -122.317084}, {lat:  47.600663, lng: -122.317083}, {lat:  47.600666, lng: -122.317082}, {lat:  47.600669, lng: -122.317081}, {lat:  47.600671, lng: -122.31708}, {lat:  47.600674, lng: -122.317079}, {lat:  47.600676, lng: -122.317078}, {lat:  47.600679, lng: -122.317077}, {lat:  47.600682, lng: -122.317076}, {lat:  47.600684, lng: -122.317075}, {lat:  47.600687, lng: -122.317074}, {lat:  47.60069, lng: -122.317073}, {lat:  47.600692, lng: -122.317072}, {lat:  47.600695, lng: -122.31707}, {lat:  47.600698, lng: -122.317069}, {lat:  47.6007, lng: -122.317068}, {lat:  47.600703, lng: -122.317067}, {lat:  47.600706, lng: -122.317066}, {lat:  47.600708, lng: -122.317065}, {lat:  47.600711, lng: -122.317064}, {lat:  47.600713, lng: -122.317063}, {lat:  47.600716, lng: -122.317062}, {lat:  47.600719, lng: -122.31706}, {lat:  47.600721, lng: -122.317059}, {lat:  47.600724, lng: -122.317058}, {lat:  47.600727, lng: -122.317057}, {lat:  47.600729, lng: -122.317056}, {lat:  47.600732, lng: -122.317055}, {lat:  47.600734, lng: -122.317054}, {lat:  47.600737, lng: -122.317052}, {lat:  47.60074, lng: -122.317051}, {lat:  47.600742, lng: -122.31705}, {lat:  47.600745, lng: -122.317049}, {lat:  47.600748, lng: -122.317048}, {lat:  47.60075, lng: -122.317046}, {lat:  47.600753, lng: -122.317045}, {lat:  47.600755, lng: -122.317044}, {lat:  47.600758, lng: -122.317043}, {lat:  47.600761, lng: -122.317042}, {lat:  47.600763, lng: -122.31704}, {lat:  47.600766, lng: -122.317039}, {lat:  47.600771, lng: -122.317037}, {lat:  47.600773, lng: -122.317036}, {lat:  47.600776, lng: -122.317034}, {lat:  47.600779, lng: -122.317033}, {lat:  47.600781, lng: -122.317032}, {lat:  47.600784, lng: -122.317031}, {lat:  47.600786, lng: -122.317029}, {lat:  47.600789, lng: -122.317028}, {lat:  47.600792, lng: -122.317027}, {lat:  47.600794, lng: -122.317026}, {lat:  47.600797, lng: -122.317024}, {lat:  47.600799, lng: -122.317023}, {lat:  47.600802, lng: -122.317022}, {lat:  47.600805, lng: -122.31702}, {lat:  47.600807, lng: -122.317019}, {lat:  47.60081, lng: -122.317018}, {lat:  47.600812, lng: -122.317017}, {lat:  47.600815, lng: -122.317015}, {lat:  47.600818, lng: -122.317014}, {lat:  47.60082, lng: -122.317013}, {lat:  47.600823, lng: -122.317011}, {lat:  47.600825, lng: -122.31701}, {lat:  47.600828, lng: -122.317009}, {lat:  47.60083, lng: -122.317007}, {lat:  47.600833, lng: -122.317006}, {lat:  47.600836, lng: -122.317005}, {lat:  47.600838, lng: -122.317003}, {lat:  47.600841, lng: -122.317002}, {lat:  47.600843, lng: -122.317}, {lat:  47.600846, lng: -122.316999}, {lat:  47.600849, lng: -122.316998}, {lat:  47.600851, lng: -122.316996}, {lat:  47.600854, lng: -122.316995}, {lat:  47.600856, lng: -122.316994}, {lat:  47.600859, lng: -122.316992}, {lat:  47.600862, lng: -122.316991}, {lat:  47.600864, lng: -122.316989}, {lat:  47.600867, lng: -122.316988}, {lat:  47.600869, lng: -122.316987}, {lat:  47.600871, lng: -122.316985}, {lat:  47.600874, lng: -122.316984}, {lat:  47.600879, lng: -122.316981}, {lat:  47.600881, lng: -122.31698}, {lat:  47.600884, lng: -122.316978}, {lat:  47.600886, lng: -122.316977}, {lat:  47.600889, lng: -122.316976}, {lat:  47.600892, lng: -122.316974}, {lat:  47.600894, lng: -122.316973}, {lat:  47.600897, lng: -122.316972}, {lat:  47.600899, lng: -122.31697}, {lat:  47.600902, lng: -122.316969}, {lat:  47.600905, lng: -122.316968}, {lat:  47.600907, lng: -122.316966}, {lat:  47.60091, lng: -122.316965}, {lat:  47.600912, lng: -122.316963}, {lat:  47.600915, lng: -122.316962}, {lat:  47.600917, lng: -122.316961}, {lat:  47.60092, lng: -122.316959}, {lat:  47.600923, lng: -122.316958}, {lat:  47.600925, lng: -122.316957}, {lat:  47.600928, lng: -122.316956}, {lat:  47.60093, lng: -122.316954}, {lat:  47.600933, lng: -122.316953}, {lat:  47.600936, lng: -122.316952}, {lat:  47.600938, lng: -122.31695}, {lat:  47.600941, lng: -122.316949}, {lat:  47.600943, lng: -122.316948}, {lat:  47.600947, lng: -122.316946}, {lat:  47.600949, lng: -122.316945}, {lat:  47.600952, lng: -122.316944}, {lat:  47.600954, lng: -122.316942}, {lat:  47.600957, lng: -122.316941}, {lat:  47.60096, lng: -122.31694}, {lat:  47.600962, lng: -122.316939}, {lat:  47.600965, lng: -122.316937}, {lat:  47.600967, lng: -122.316936}, {lat:  47.60097, lng: -122.316935}, {lat:  47.600973, lng: -122.316934}, {lat:  47.600975, lng: -122.316932}, {lat:  47.600978, lng: -122.316931}, {lat:  47.600981, lng: -122.31693}, {lat:  47.600983, lng: -122.316929}, {lat:  47.600986, lng: -122.316928}, {lat:  47.600988, lng: -122.316926}, {lat:  47.600991, lng: -122.316925}, {lat:  47.600994, lng: -122.316924}, {lat:  47.600997, lng: -122.316923}, {lat:  47.600999, lng: -122.316922}, {lat:  47.601002, lng: -122.31692}, {lat:  47.601004, lng: -122.316919}, {lat:  47.601007, lng: -122.316918}, {lat:  47.60101, lng: -122.316917}, {lat:  47.601012, lng: -122.316916}, {lat:  47.601015, lng: -122.316915}, {lat:  47.601018, lng: -122.316913}, {lat:  47.60102, lng: -122.316912}, {lat:  47.601023, lng: -122.316911}, {lat:  47.601025, lng: -122.31691}, {lat:  47.601028, lng: -122.316909}, {lat:  47.601031, lng: -122.316908}, {lat:  47.601033, lng: -122.316907}, {lat:  47.601036, lng: -122.316906}, {lat:  47.601039, lng: -122.316904}, {lat:  47.601041, lng: -122.316903}, {lat:  47.601044, lng: -122.316902}, {lat:  47.601047, lng: -122.316901}, {lat:  47.601049, lng: -122.3169}, {lat:  47.601052, lng: -122.316899}, {lat:  47.601054, lng: -122.316898}, {lat:  47.601057, lng: -122.316897}, {lat:  47.60106, lng: -122.316896}, {lat:  47.601062, lng: -122.316895}, {lat:  47.601065, lng: -122.316894}, {lat:  47.601068, lng: -122.316893}, {lat:  47.60107, lng: -122.316892}, {lat:  47.601073, lng: -122.316891}, {lat:  47.601076, lng: -122.316889}, {lat:  47.601078, lng: -122.316888}, {lat:  47.601081, lng: -122.316887}, {lat:  47.601084, lng: -122.316886}, {lat:  47.601086, lng: -122.316885}, {lat:  47.601089, lng: -122.316884}, {lat:  47.601092, lng: -122.316883}, {lat:  47.601094, lng: -122.316882}, {lat:  47.601097, lng: -122.316881}, {lat:  47.6011, lng: -122.31688}, {lat:  47.601102, lng: -122.316879}, {lat:  47.601105, lng: -122.316878}, {lat:  47.601108, lng: -122.316877}, {lat:  47.60111, lng: -122.316876}, {lat:  47.601113, lng: -122.316875}, {lat:  47.601116, lng: -122.316874}, {lat:  47.601118, lng: -122.316874}, {lat:  47.601121, lng: -122.316873}, {lat:  47.601124, lng: -122.316872}, {lat:  47.601126, lng: -122.316871}, {lat:  47.601129, lng: -122.31687}, {lat:  47.601132, lng: -122.316869}, {lat:  47.601134, lng: -122.316868}, {lat:  47.601137, lng: -122.316867}, {lat:  47.60114, lng: -122.316866}, {lat:  47.601142, lng: -122.316865}, {lat:  47.601145, lng: -122.316864}, {lat:  47.601148, lng: -122.316863}, {lat:  47.60115, lng: -122.316862}, {lat:  47.601153, lng: -122.316862}, {lat:  47.601156, lng: -122.316861}, {lat:  47.601158, lng: -122.31686}, {lat:  47.601161, lng: -122.316859}, {lat:  47.601164, lng: -122.316858}, {lat:  47.601166, lng: -122.316857}, {lat:  47.601169, lng: -122.316856}, {lat:  47.601172, lng: -122.316855}, {lat:  47.601174, lng: -122.316855}, {lat:  47.601177, lng: -122.316854}, {lat:  47.60118, lng: -122.316853}, {lat:  47.601182, lng: -122.316852}, {lat:  47.601185, lng: -122.316851}, {lat:  47.601188, lng: -122.31685}, {lat:  47.60119, lng: -122.31685}, {lat:  47.601193, lng: -122.316849}, {lat:  47.601196, lng: -122.316848}, {lat:  47.601198, lng: -122.316847}, {lat:  47.601201, lng: -122.316846}, {lat:  47.601204, lng: -122.316845}, {lat:  47.601207, lng: -122.316845}, {lat:  47.601209, lng: -122.316844}, {lat:  47.601212, lng: -122.316843}, {lat:  47.601215, lng: -122.316842}, {lat:  47.601217, lng: -122.316842}, {lat:  47.60122, lng: -122.316841}, {lat:  47.601223, lng: -122.31684}, {lat:  47.601225, lng: -122.316839}, {lat:  47.601446, lng: -122.316782}, {lat:  47.601693, lng: -122.316782}, {lat:  47.601695, lng: -122.317823}, {lat:  47.601696, lng: -122.318098}, {lat:  47.601698, lng: -122.319403}, {lat:  47.601698, lng: -122.319575}, {lat:  47.6017, lng: -122.320737}, {lat:  47.601704, lng: -122.322447}, {lat:  47.601704, lng: -122.322459}, {lat:  47.601704, lng: -122.322616}, {lat:  47.601705, lng: -122.323486}, {lat:  47.601705, lng: -122.323501}, {lat:  47.601705, lng: -122.323555}, {lat:  47.601705, lng: -122.323581}, {lat:  47.601706, lng: -122.323741}, {lat:  47.601706, lng: -122.323796}, {lat:  47.601706, lng: -122.324284}, {lat:  47.601707, lng: -122.3243}, {lat:  47.601707, lng: -122.324374}, {lat:  47.601709, lng: -122.324952}, {lat:  47.601708, lng: -122.325048}, {lat:  47.601708, lng: -122.32528}, {lat:  47.601709, lng: -122.325833}, {lat:  47.60171, lng: -122.326331}, {lat:  47.60171, lng: -122.326351}, {lat:  47.60171, lng: -122.326452}, {lat:  47.60171, lng: -122.326566}, {lat:  47.60171, lng: -122.326576}, {lat:  47.601711, lng: -122.326868}, {lat:  47.601711, lng: -122.326878}, {lat:  47.601712, lng: -122.32737}, {lat:  47.601712, lng: -122.327656}, {lat:  47.601712, lng: -122.327658}, {lat:  47.601713, lng: -122.327988}, {lat:  47.601713, lng: -122.328373}, {lat:  47.601714, lng: -122.328909}, {lat:  47.601714, lng: -122.32896}, {lat:  47.601714, lng: -122.328966}, {lat:  47.601714, lng: -122.329022}, {lat:  47.601351, lng: -122.328984}, {lat:  47.600873, lng: -122.328986}, {lat:  47.60085, lng: -122.328985}, {lat:  47.600708, lng: -122.328984}, {lat:  47.600034, lng: -122.328977}, {lat:  47.599197, lng: -122.328989}, {lat:  47.599197, lng: -122.329035}, {lat:  47.599198, lng: -122.329679}, {lat:  47.599199, lng: -122.330276}, {lat:  47.599201, lng: -122.331557}, {lat:  47.599201, lng: -122.331578}, {lat:  47.599203, lng: -122.332882}, {lat:  47.599203, lng: -122.333287}, {lat:  47.599205, lng: -122.334188}, {lat:  47.599207, lng: -122.335362}, {lat:  47.599207, lng: -122.33544}, {lat:  47.599207, lng: -122.335582}, {lat:  47.599207, lng: -122.335669}, {lat:  47.599207, lng: -122.335727}, {lat:  47.599208, lng: -122.335869}, {lat:  47.599208, lng: -122.335909}, {lat:  47.599208, lng: -122.336092}, {lat:  47.599208, lng: -122.336107}, {lat:  47.599209, lng: -122.336798}, {lat:  47.59921, lng: -122.337395}, {lat:  47.59921, lng: -122.337441}, {lat:  47.599093, lng: -122.337452}, {lat:  47.599063, lng: -122.339973}, {lat:  47.597373, lng: -122.340708}, {lat:  47.595221, lng: -122.341494}, {lat:  47.593271, lng: -122.342294}, {lat:  47.592201, lng: -122.342511}, {lat:  47.592113, lng: -122.342721}, {lat:  47.591297, lng: -122.342997}, {lat:  47.590741, lng: -122.343062}, {lat:  47.590652, lng: -122.342844}, {lat:  47.590659, lng: -122.338614}, {lat:  47.590036, lng: -122.338596}, {lat:  47.590045, lng: -122.341099}, {lat:  47.589932, lng: -122.341178}, {lat:  47.589966, lng: -122.342949}, {lat:  47.589646, lng: -122.343244}, {lat:  47.588178, lng: -122.343412}, {lat:  47.587819, lng: -122.343345}, {lat:  47.587655, lng: -122.342974}, {lat:  47.586583, lng: -122.343007}, {lat:  47.586473, lng: -122.342398}, {lat:  47.584431, lng: -122.342465}, {lat:  47.584659, lng: -122.343108}, {lat:  47.584091, lng: -122.34314}, {lat:  47.583472, lng: -122.343174}, {lat:  47.582328, lng: -122.343038}, {lat:  47.580502, lng: -122.343071}, {lat:  47.57884, lng: -122.340368}, {lat:  47.57822, lng: -122.340672}, {lat:  47.579655, lng: -122.342901}, {lat:  47.57954, lng: -122.343205}, {lat:  47.579361, lng: -122.343307}, {lat:  47.57906, lng: -122.342767}, {lat:  47.573671, lng: -122.342695}, {lat:  47.573168, lng: -122.342998}, {lat:  47.57077, lng: -122.343977}, {lat:  47.570468, lng: -122.344449}, {lat:  47.569392, lng: -122.344956}, {lat:  47.569237, lng: -122.344786}, {lat:  47.568142, lng: -122.345124}, {lat:  47.567889, lng: -122.344954}, {lat:  47.565282, lng: -122.345562}, {lat:  47.563617, lng: -122.345391}, {lat:  47.563455, lng: -122.345255}, {lat:  47.562994, lng: -122.345086}, {lat:  47.562131, lng: -122.344952}, {lat:  47.561463, lng: -122.34458}, {lat:  47.560777, lng: -122.344309}, {lat:  47.559894, lng: -122.344006}, {lat:  47.559477, lng: -122.3437}, {lat:  47.557395, lng: -122.343026}, {lat:  47.557197, lng: -122.342788}, {lat:  47.556937, lng: -122.340155}, {lat:  47.556144, lng: -122.339884}, {lat:  47.556075, lng: -122.340223}, {lat:  47.556255, lng: -122.341808}, {lat:  47.556166, lng: -122.34201}, {lat:  47.555941, lng: -122.34191}, {lat:  47.555389, lng: -122.341303}, {lat:  47.554223, lng: -122.340592}, {lat:  47.553377, lng: -122.340524}, {lat:  47.552808, lng: -122.340321}, {lat:  47.551156, lng: -122.339509}, {lat:  47.550081, lng: -122.338698}, {lat:  47.549648, lng: -122.338428}, {lat:  47.548071, lng: -122.337922}, {lat:  47.547528, lng: -122.337382}, {lat:  47.547276, lng: -122.337347}, {lat:  47.546472, lng: -122.33691}, {lat:  47.546453, lng: -122.336638}, {lat:  47.547318, lng: -122.33549}, {lat:  47.547317, lng: -122.335186}, {lat:  47.546749, lng: -122.335188}, {lat:  47.546365, lng: -122.335322}, {lat:  47.545585, lng: -122.33593}, {lat:  47.544946, lng: -122.336166}, {lat:  47.544443, lng: -122.335996}, {lat:  47.543783, lng: -122.335456}, {lat:  47.543529, lng: -122.334949}, {lat:  47.543078, lng: -122.334371}, {lat:  47.543029, lng: -122.334309}, {lat:  47.542844, lng: -122.333464}, {lat:  47.542821, lng: -122.33252}, {lat:  47.542978, lng: -122.330089}, {lat:  47.542544, lng: -122.329989}, {lat:  47.542456, lng: -122.330191}, {lat:  47.542432, lng: -122.332282}, {lat:  47.542363, lng: -122.332722}, {lat:  47.542092, lng: -122.332621}, {lat:  47.541702, lng: -122.332248}, {lat:  47.54113, lng: -122.331169}, {lat:  47.540671, lng: -122.330998}, {lat:  47.539945, lng: -122.329918}, {lat:  47.539687, lng: -122.329244}, {lat:  47.539574, lng: -122.32803}, {lat:  47.538957, lng: -122.327353}, {lat:  47.538731, lng: -122.327218}, {lat:  47.538525, lng: -122.327185}, {lat:  47.537702, lng: -122.326576}, {lat:  47.535941, lng: -122.323979}, {lat:  47.535529, lng: -122.322898}, {lat:  47.535051, lng: -122.322527}, {lat:  47.53475, lng: -122.321952}, {lat:  47.534731, lng: -122.321515}, {lat:  47.534916, lng: -122.321009}, {lat:  47.535486, lng: -122.320197}, {lat:  47.535808, lng: -122.319861}, {lat:  47.536694, lng: -122.319153}, {lat:  47.536783, lng: -122.318882}, {lat:  47.536691, lng: -122.318646}, {lat:  47.536099, lng: -122.318648}, {lat:  47.535802, lng: -122.318917}, {lat:  47.534293, lng: -122.320772}, {lat:  47.534087, lng: -122.320772}, {lat:  47.532952, lng: -122.318849}, {lat:  47.532604, lng: -122.318005}, {lat:  47.531809, lng: -122.316816}, {lat:  47.531807, lng: -122.316647}, {lat:  47.531806, lng: -122.316525}, {lat:  47.531805, lng: -122.316424}, {lat:  47.531804, lng: -122.316323}, {lat:  47.531803, lng: -122.316222}, {lat:  47.531802, lng: -122.316121}, {lat:  47.531801, lng: -122.316019}, {lat:  47.5318, lng: -122.315918}, {lat:  47.531799, lng: -122.315817}, {lat:  47.531798, lng: -122.315716}, {lat:  47.531797, lng: -122.315615}, {lat:  47.531796, lng: -122.315514}, {lat:  47.531795, lng: -122.315412}, {lat:  47.531795, lng: -122.315311}, {lat:  47.531794, lng: -122.31521}, {lat:  47.531793, lng: -122.315109}, {lat:  47.531792, lng: -122.315008}, {lat:  47.531791, lng: -122.314886}, {lat:  47.531789, lng: -122.314765}, {lat:  47.531788, lng: -122.314664}, {lat:  47.531787, lng: -122.314562}, {lat:  47.531787, lng: -122.314478}, {lat:  47.531786, lng: -122.31436}, {lat:  47.531785, lng: -122.314266}, {lat:  47.531784, lng: -122.314157}, {lat:  47.531783, lng: -122.314056}, {lat:  47.531782, lng: -122.313986}, {lat:  47.531781, lng: -122.313854}, {lat:  47.53178, lng: -122.313754}, {lat:  47.531779, lng: -122.31368}, {lat:  47.53178, lng: -122.3133}, {lat:  47.531751, lng: -122.309192}, {lat:  47.531747, lng: -122.308939}, {lat:  47.531739, lng: -122.308445}, {lat:  47.531733, lng: -122.307151}, {lat:  47.531721, lng: -122.305532}, {lat:  47.531715, lng: -122.305529}, {lat:  47.531715, lng: -122.305517}, {lat:  47.531706, lng: -122.305513}, {lat:  47.531704, lng: -122.305099}, {lat:  47.531657, lng: -122.305089}, {lat:  47.531611, lng: -122.305077}, {lat:  47.531565, lng: -122.305062}, {lat:  47.531519, lng: -122.305046}, {lat:  47.531473, lng: -122.305027}, {lat:  47.531428, lng: -122.305006}, {lat:  47.531384, lng: -122.304984}, {lat:  47.53134, lng: -122.304959}, {lat:  47.531296, lng: -122.304932}, {lat:  47.531253, lng: -122.304903}, {lat:  47.531211, lng: -122.304873}, {lat:  47.531169, lng: -122.30484}, {lat:  47.531146, lng: -122.30482}, {lat:  47.530535, lng: -122.303502}, {lat:  47.530227, lng: -122.302796}, {lat:  47.530059, lng: -122.302308}, {lat:  47.530058, lng: -122.302307}, {lat:  47.530053, lng: -122.302293}, {lat:  47.529707, lng: -122.301839}, {lat:  47.529704, lng: -122.301833}, {lat:  47.529669, lng: -122.30177}, {lat:  47.529634, lng: -122.301708}, {lat:  47.529597, lng: -122.301648}, {lat:  47.52956, lng: -122.30159}, {lat:  47.529521, lng: -122.301532}, {lat:  47.529482, lng: -122.301477}, {lat:  47.529441, lng: -122.301422}, {lat:  47.5294, lng: -122.30137}, {lat:  47.529358, lng: -122.301318}, {lat:  47.529315, lng: -122.301269}, {lat:  47.529271, lng: -122.301221}, {lat:  47.529226, lng: -122.301175}, {lat:  47.529181, lng: -122.30113}, {lat:  47.529112, lng: -122.30107}, {lat:  47.529042, lng: -122.301012}, {lat:  47.528971, lng: -122.300955}, {lat:  47.5289, lng: -122.300901}, {lat:  47.528828, lng: -122.300849}, {lat:  47.528756, lng: -122.300799}, {lat:  47.528683, lng: -122.300751}, {lat:  47.528609, lng: -122.300705}, {lat:  47.528535, lng: -122.300661}, {lat:  47.52846, lng: -122.300619}, {lat:  47.528384, lng: -122.300579}, {lat:  47.528308, lng: -122.300542}, {lat:  47.528232, lng: -122.300506}, {lat:  47.528155, lng: -122.300473}, {lat:  47.528078, lng: -122.300442}, {lat:  47.528, lng: -122.300413}, {lat:  47.527922, lng: -122.300387}, {lat:  47.527844, lng: -122.300362}, {lat:  47.527765, lng: -122.30034}, {lat:  47.527686, lng: -122.30032}, {lat:  47.527607, lng: -122.300302}, {lat:  47.527528, lng: -122.300286}, {lat:  47.527453, lng: -122.300271}, {lat:  47.527378, lng: -122.300253}, {lat:  47.527304, lng: -122.300234}, {lat:  47.52723, lng: -122.300213}, {lat:  47.527156, lng: -122.30019}, {lat:  47.527083, lng: -122.300165}, {lat:  47.527003, lng: -122.300138}, {lat:  47.526924, lng: -122.300109}, {lat:  47.526846, lng: -122.300077}, {lat:  47.526767, lng: -122.300044}, {lat:  47.526689, lng: -122.300009}, {lat:  47.526612, lng: -122.299972}, {lat:  47.526163, lng: -122.299731}, {lat:  47.526115, lng: -122.299709}, {lat:  47.526067, lng: -122.299689}, {lat:  47.526018, lng: -122.299672}, {lat:  47.52597, lng: -122.299656}, {lat:  47.525921, lng: -122.299642}, {lat:  47.525871, lng: -122.29963}, {lat:  47.525822, lng: -122.29962}, {lat:  47.525772, lng: -122.299612}, {lat:  47.525701, lng: -122.299605}, {lat:  47.52563, lng: -122.299608}, {lat:  47.525559, lng: -122.299618}, {lat:  47.525489, lng: -122.299638}, {lat:  47.525442, lng: -122.299656}, {lat:  47.525387, lng: -122.299683}, {lat:  47.525321, lng: -122.299724}, {lat:  47.525258, lng: -122.299773}, {lat:  47.525198, lng: -122.299829}, {lat:  47.525141, lng: -122.299893}, {lat:  47.525088, lng: -122.299963}, {lat:  47.525044, lng: -122.300025}, {lat:  47.525002, lng: -122.300089}, {lat:  47.524961, lng: -122.300154}, {lat:  47.52492, lng: -122.300221}, {lat:  47.524881, lng: -122.300289}, {lat:  47.524843, lng: -122.300359}, {lat:  47.524806, lng: -122.30043}, {lat:  47.524771, lng: -122.300502}, {lat:  47.524736, lng: -122.300575}, {lat:  47.524703, lng: -122.30065}, {lat:  47.524671, lng: -122.300726}, {lat:  47.52464, lng: -122.300803}, {lat:  47.524611, lng: -122.300881}, {lat:  47.524592, lng: -122.300933}, {lat:  47.52459, lng: -122.300575}, {lat:  47.524586, lng: -122.300313}, {lat:  47.524583, lng: -122.30005}, {lat:  47.524564, lng: -122.299958}, {lat:  47.524431, lng: -122.293999}, {lat:  47.524428, lng: -122.293885}, {lat:  47.524428, lng: -122.293649}, {lat:  47.524427, lng: -122.293362}, {lat:  47.5244, lng: -122.291792}, {lat:  47.524385, lng: -122.291359}, {lat:  47.524387, lng: -122.291311}, {lat:  47.524388, lng: -122.291283}, {lat:  47.524381, lng: -122.291283}, {lat:  47.524382, lng: -122.291268}, {lat:  47.524114, lng: -122.291265}, {lat:  47.523479, lng: -122.291269}, {lat:  47.523055, lng: -122.291272}, {lat:  47.522941, lng: -122.291272}, {lat:  47.522759, lng: -122.291272}, {lat:  47.522328, lng: -122.291271}, {lat:  47.522287, lng: -122.291271}, {lat:  47.522246, lng: -122.291271}, {lat:  47.521848, lng: -122.29127}, {lat:  47.521807, lng: -122.29127}, {lat:  47.521559, lng: -122.29127}, {lat:  47.521545, lng: -122.29127}, {lat:  47.52149, lng: -122.291239}, {lat:  47.521399, lng: -122.291269}, {lat:  47.519957, lng: -122.291265}, {lat:  47.519259, lng: -122.291264}, {lat:  47.518514, lng: -122.291258}, {lat:  47.517936, lng: -122.291262}, {lat:  47.517597, lng: -122.291265}, {lat:  47.516986, lng: -122.291264}, {lat:  47.516889, lng: -122.291265}, {lat:  47.516531, lng: -122.291269}, {lat:  47.515954, lng: -122.291275}, {lat:  47.515415, lng: -122.291281}, {lat:  47.515018, lng: -122.291286}, {lat:  47.51489, lng: -122.291287}, {lat:  47.514889, lng: -122.291287}, {lat:  47.514106, lng: -122.291296}, {lat:  47.513841, lng: -122.291299}, {lat:  47.5137, lng: -122.2913}, {lat:  47.513659, lng: -122.291301}, {lat:  47.513613, lng: -122.291301}, {lat:  47.51353, lng: -122.291302}, {lat:  47.513417, lng: -122.291303}, {lat:  47.513306, lng: -122.291304}, {lat:  47.513266, lng: -122.291305}, {lat:  47.512936, lng: -122.291308}, {lat:  47.512481, lng: -122.291313}, {lat:  47.512208, lng: -122.291316}, {lat:  47.512124, lng: -122.291317}, {lat:  47.511753, lng: -122.291321}, {lat:  47.511699, lng: -122.291321}, {lat:  47.511215, lng: -122.291326}, {lat:  47.510697, lng: -122.291332}, {lat:  47.51023, lng: -122.291337}, {lat:  47.510159, lng: -122.291338}, {lat:  47.510199, lng: -122.287692}, {lat:  47.510225, lng: -122.286265}, {lat:  47.510227, lng: -122.285785}, {lat:  47.510156, lng: -122.284876}, {lat:  47.510069, lng: -122.283754}, {lat:  47.510061, lng: -122.283451}, {lat:  47.510056, lng: -122.283275}, {lat:  47.510051, lng: -122.283051}, {lat:  47.510029, lng: -122.282463}, {lat:  47.509883, lng: -122.279761}, {lat:  47.509858, lng: -122.278643}, {lat:  47.509853, lng: -122.2784}, {lat:  47.509492, lng: -122.278394}, {lat:  47.508906, lng: -122.278388}, {lat:  47.508871, lng: -122.27838}, {lat:  47.508222, lng: -122.278351}, {lat:  47.507994, lng: -122.278323}, {lat:  47.508004, lng: -122.27807}, {lat:  47.507998, lng: -122.277904}, {lat:  47.507973, lng: -122.277718}, {lat:  47.507942, lng: -122.277557}, {lat:  47.507898, lng: -122.277402}, {lat:  47.507845, lng: -122.27724}, {lat:  47.507842, lng: -122.277234}, {lat:  47.507839, lng: -122.277225}, {lat:  47.507773, lng: -122.277078}, {lat:  47.507231, lng: -122.276241}, {lat:  47.507143, lng: -122.2761}, {lat:  47.507131, lng: -122.276077}, {lat:  47.507104, lng: -122.276018}, {lat:  47.507025, lng: -122.275818}, {lat:  47.50701, lng: -122.27577}, {lat:  47.507008, lng: -122.275764}, {lat:  47.507005, lng: -122.275755}, {lat:  47.506945, lng: -122.275501}, {lat:  47.507062, lng: -122.275453}, {lat:  47.507117, lng: -122.275453}, {lat:  47.507199, lng: -122.275451}, {lat:  47.507522, lng: -122.275446}, {lat:  47.507844, lng: -122.275441}, {lat:  47.507989, lng: -122.275439}, {lat:  47.508936, lng: -122.275433}, {lat:  47.509639, lng: -122.275427}, {lat:  47.50979, lng: -122.275426}, {lat:  47.509759, lng: -122.274091}, {lat:  47.509758, lng: -122.274061}, {lat:  47.509702, lng: -122.271564}, {lat:  47.509669, lng: -122.270084}, {lat:  47.509664, lng: -122.270084}, {lat:  47.509663, lng: -122.270066}, {lat:  47.509539, lng: -122.270068}, {lat:  47.508784, lng: -122.27008}, {lat:  47.507027, lng: -122.270107}, {lat:  47.506147, lng: -122.270133}, {lat:  47.506092, lng: -122.270134}, {lat:  47.50586, lng: -122.270138}, {lat:  47.505028, lng: -122.270154}, {lat:  47.504938, lng: -122.270156}, {lat:  47.504477, lng: -122.270165}, {lat:  47.504352, lng: -122.270167}, {lat:  47.503177, lng: -122.270175}, {lat:  47.502719, lng: -122.270198}, {lat:  47.502631, lng: -122.270199}, {lat:  47.502559, lng: -122.2702}, {lat:  47.502549, lng: -122.2702}, {lat:  47.501936, lng: -122.270209}, {lat:  47.50192, lng: -122.270209}, {lat:  47.501506, lng: -122.270215}, {lat:  47.501449, lng: -122.270215}, {lat:  47.501449, lng: -122.270216}, {lat:  47.501449, lng: -122.270217}, {lat:  47.501464, lng: -122.270279}, {lat:  47.501611, lng: -122.270883}, {lat:  47.501551, lng: -122.270869}, {lat:  47.501457, lng: -122.270848}, {lat:  47.501233, lng: -122.270797}, {lat:  47.501037, lng: -122.270752}, {lat:  47.500795, lng: -122.270696}, {lat:  47.500808, lng: -122.270755}, {lat:  47.500793, lng: -122.270752}, {lat:  47.500404, lng: -122.270681}, {lat:  47.500312, lng: -122.270664}, {lat:  47.500287, lng: -122.270559}, {lat:  47.500246, lng: -122.270391}, {lat:  47.50021, lng: -122.270243}, {lat:  47.500207, lng: -122.270233}, {lat:  47.500156, lng: -122.270233}, {lat:  47.500149, lng: -122.270233}, {lat:  47.4992, lng: -122.270246}, {lat:  47.499072, lng: -122.270248}, {lat:  47.498915, lng: -122.27025}, {lat:  47.498879, lng: -122.270251}, {lat:  47.498305, lng: -122.270259}, {lat:  47.498267, lng: -122.270259}, {lat:  47.497705, lng: -122.270267}, {lat:  47.49769, lng: -122.270267}, {lat:  47.497618, lng: -122.270268}, {lat:  47.49756, lng: -122.270269}, {lat:  47.497546, lng: -122.270269}, {lat:  47.497396, lng: -122.270271}, {lat:  47.497355, lng: -122.270272}, {lat:  47.497096, lng: -122.270275}, {lat:  47.497096, lng: -122.270276}, {lat:  47.497029, lng: -122.270277}, {lat:  47.49677, lng: -122.270281}, {lat:  47.4967, lng: -122.270282}, {lat:  47.496409, lng: -122.270285}, {lat:  47.496283, lng: -122.270287}, {lat:  47.496217, lng: -122.270288}, {lat:  47.49605, lng: -122.27029}, {lat:  47.495996, lng: -122.270291}, {lat:  47.495932, lng: -122.270292}, {lat:  47.495883, lng: -122.270292}, {lat:  47.495818, lng: -122.270293}, {lat:  47.495745, lng: -122.270294}, {lat:  47.495702, lng: -122.270295}, {lat:  47.495653, lng: -122.270295}, {lat:  47.495627, lng: -122.270296}, {lat:  47.495516, lng: -122.270297}, {lat:  47.495514, lng: -122.270297}, {lat:  47.495515, lng: -122.270149}, {lat:  47.495515, lng: -122.270085}, {lat:  47.49552, lng: -122.269482}, {lat:  47.495521, lng: -122.26944}, {lat:  47.495521, lng: -122.269426}, {lat:  47.495531, lng: -122.268429}, {lat:  47.495532, lng: -122.268364}, {lat:  47.495535, lng: -122.268062}, {lat:  47.495537, lng: -122.267847}, {lat:  47.495538, lng: -122.267772}, {lat:  47.495547, lng: -122.266912}, {lat:  47.495547, lng: -122.266856}, {lat:  47.495547, lng: -122.266855}, {lat:  47.495552, lng: -122.266442}, {lat:  47.495567, lng: -122.264969}, {lat:  47.495568, lng: -122.264869}, {lat:  47.495573, lng: -122.26433}, {lat:  47.495574, lng: -122.26426}, {lat:  47.495575, lng: -122.264204}, {lat:  47.495576, lng: -122.264055}, {lat:  47.495583, lng: -122.263402}, {lat:  47.495598, lng: -122.261882}, {lat:  47.495614, lng: -122.260362}, {lat:  47.495621, lng: -122.259658}, {lat:  47.495621, lng: -122.259641}, {lat:  47.495872, lng: -122.259636}, {lat:  47.49599, lng: -122.259634}, {lat:  47.496001, lng: -122.259653}, {lat:  47.497352, lng: -122.259623}, {lat:  47.50016, lng: -122.259567}, {lat:  47.501308, lng: -122.259544}, {lat:  47.501312, lng: -122.259544}, {lat:  47.502543, lng: -122.25953}, {lat:  47.502544, lng: -122.259502}, {lat:  47.502584, lng: -122.258252}, {lat:  47.502585, lng: -122.258236}, {lat:  47.502587, lng: -122.258187}, {lat:  47.502594, lng: -122.258034}, {lat:  47.502603, lng: -122.257831}, {lat:  47.502611, lng: -122.257627}, {lat:  47.502613, lng: -122.257584}, {lat:  47.50262, lng: -122.257423}, {lat:  47.502624, lng: -122.25734}, {lat:  47.502629, lng: -122.257219}, {lat:  47.502635, lng: -122.257094}, {lat:  47.502638, lng: -122.257017}, {lat:  47.502645, lng: -122.256848}, {lat:  47.502646, lng: -122.256831}, {lat:  47.502647, lng: -122.25682}, {lat:  47.502659, lng: -122.256535}, {lat:  47.502669, lng: -122.256297}, {lat:  47.50268, lng: -122.256059}, {lat:  47.50269, lng: -122.255822}, {lat:  47.502701, lng: -122.255577}, {lat:  47.502711, lng: -122.255337}, {lat:  47.502728, lng: -122.254947}, {lat:  47.50274, lng: -122.254676}, {lat:  47.502757, lng: -122.254281}, {lat:  47.502762, lng: -122.254172}, {lat:  47.502768, lng: -122.254042}, {lat:  47.502768, lng: -122.25403}, {lat:  47.502777, lng: -122.253824}, {lat:  47.502778, lng: -122.25381}, {lat:  47.502782, lng: -122.253719}, {lat:  47.502789, lng: -122.253567}, {lat:  47.502799, lng: -122.253321}, {lat:  47.502809, lng: -122.25311}, {lat:  47.50281, lng: -122.253083}, {lat:  47.50281, lng: -122.253071}, {lat:  47.502811, lng: -122.253058}, {lat:  47.502821, lng: -122.252827}, {lat:  47.50283, lng: -122.252616}, {lat:  47.502831, lng: -122.25261}, {lat:  47.502831, lng: -122.252601}, {lat:  47.502832, lng: -122.252585}, {lat:  47.502843, lng: -122.252332}, {lat:  47.502858, lng: -122.251989}, {lat:  47.50287, lng: -122.251709}, {lat:  47.502873, lng: -122.251655}, {lat:  47.502877, lng: -122.251555}, {lat:  47.502878, lng: -122.251522}, {lat:  47.502884, lng: -122.25139}, {lat:  47.502901, lng: -122.251019}, {lat:  47.502901, lng: -122.250997}, {lat:  47.502907, lng: -122.250864}, {lat:  47.502905, lng: -122.250863}, {lat:  47.502717, lng: -122.250732}, {lat:  47.502521, lng: -122.250622}, {lat:  47.502372, lng: -122.250556}, {lat:  47.502221, lng: -122.250504}, {lat:  47.50135, lng: -122.250239}, {lat:  47.501134, lng: -122.250174}, {lat:  47.501101, lng: -122.250164}, {lat:  47.500805, lng: -122.250074}, {lat:  47.500393, lng: -122.249949}, {lat:  47.499348, lng: -122.249633}, {lat:  47.499347, lng: -122.249471}, {lat:  47.499359, lng: -122.249021}, {lat:  47.499362, lng: -122.2489}, {lat:  47.499361, lng: -122.248814}, {lat:  47.499359, lng: -122.2487}, {lat:  47.499356, lng: -122.248458}, {lat:  47.499351, lng: -122.248093}, {lat:  47.499348, lng: -122.247908}, {lat:  47.499347, lng: -122.247822}, {lat:  47.499345, lng: -122.247675}, {lat:  47.499342, lng: -122.247453}, {lat:  47.499341, lng: -122.24743}, {lat:  47.499338, lng: -122.247224}, {lat:  47.499338, lng: -122.247187}, {lat:  47.499335, lng: -122.246986}, {lat:  47.499334, lng: -122.246943}, {lat:  47.499332, lng: -122.246764}, {lat:  47.499331, lng: -122.246696}, {lat:  47.499329, lng: -122.246534}, {lat:  47.499328, lng: -122.246451}, {lat:  47.499326, lng: -122.24631}, {lat:  47.499324, lng: -122.246206}, {lat:  47.499322, lng: -122.246087}, {lat:  47.499322, lng: -122.246078}, {lat:  47.499321, lng: -122.24596}, {lat:  47.499319, lng: -122.245849}, {lat:  47.499317, lng: -122.245713}, {lat:  47.499316, lng: -122.245632}, {lat:  47.499313, lng: -122.245404}, {lat:  47.49931, lng: -122.245176}, {lat:  47.499309, lng: -122.245133}, {lat:  47.499303, lng: -122.244737}, {lat:  47.499303, lng: -122.24472}, {lat:  47.4993, lng: -122.244518}, {lat:  47.499297, lng: -122.244292}, {lat:  47.499294, lng: -122.244071}, {lat:  47.499291, lng: -122.243849}, {lat:  47.499288, lng: -122.24365}, {lat:  47.499287, lng: -122.243545}, {lat:  47.499285, lng: -122.243441}, {lat:  47.499282, lng: -122.243209}, {lat:  47.499281, lng: -122.243139}, {lat:  47.499279, lng: -122.242992}, {lat:  47.499276, lng: -122.242764}, {lat:  47.499272, lng: -122.242533}, {lat:  47.499269, lng: -122.242316}, {lat:  47.499266, lng: -122.242092}, {lat:  47.499263, lng: -122.241877}, {lat:  47.499261, lng: -122.241735}, {lat:  47.499259, lng: -122.2416}, {lat:  47.499259, lng: -122.241574}, {lat:  47.499257, lng: -122.241459}, {lat:  47.499256, lng: -122.241358}, {lat:  47.499252, lng: -122.241108}, {lat:  47.499252, lng: -122.2411}, {lat:  47.499249, lng: -122.240876}, {lat:  47.499552, lng: -122.240862}, {lat:  47.499585, lng: -122.240861}, {lat:  47.499633, lng: -122.240862}, {lat:  47.50052, lng: -122.240849}, {lat:  47.500629, lng: -122.240848}, {lat:  47.500784, lng: -122.240847}, {lat:  47.500937, lng: -122.240845}, {lat:  47.501082, lng: -122.240844}, {lat:  47.501232, lng: -122.240842}, {lat:  47.501382, lng: -122.240841}, {lat:  47.501463, lng: -122.240836}, {lat:  47.501466, lng: -122.240836}, {lat:  47.502227, lng: -122.240828}, {lat:  47.502692, lng: -122.240822}, {lat:  47.502883, lng: -122.240819}, {lat:  47.502885, lng: -122.240941}, {lat:  47.502886, lng: -122.240971}, {lat:  47.502887, lng: -122.241096}, {lat:  47.502888, lng: -122.241117}, {lat:  47.502889, lng: -122.241239}, {lat:  47.502891, lng: -122.241363}, {lat:  47.502891, lng: -122.241382}, {lat:  47.502897, lng: -122.241797}, {lat:  47.502897, lng: -122.241808}, {lat:  47.502904, lng: -122.24238}, {lat:  47.502915, lng: -122.243131}, {lat:  47.502923, lng: -122.243646}, {lat:  47.502924, lng: -122.243702}, {lat:  47.502926, lng: -122.243831}, {lat:  47.50293, lng: -122.244146}, {lat:  47.502934, lng: -122.244448}, {lat:  47.50294, lng: -122.24482}, {lat:  47.502941, lng: -122.244952}, {lat:  47.502943, lng: -122.245083}, {lat:  47.502943, lng: -122.245097}, {lat:  47.502951, lng: -122.245637}, {lat:  47.502959, lng: -122.246217}, {lat:  47.502982, lng: -122.247858}, {lat:  47.502995, lng: -122.248843}, {lat:  47.502996, lng: -122.248843}, {lat:  47.503076, lng: -122.248839}, {lat:  47.503838, lng: -122.248827}, {lat:  47.504021, lng: -122.248824}, {lat:  47.504134, lng: -122.248822}, {lat:  47.504792, lng: -122.248811}, {lat:  47.506116, lng: -122.24879}, {lat:  47.506259, lng: -122.248787}, {lat:  47.506278, lng: -122.248787}, {lat:  47.506376, lng: -122.248784}, {lat:  47.506376, lng: -122.248783}, {lat:  47.506362, lng: -122.248783}, {lat:  47.50636, lng: -122.248652}, {lat:  47.506352, lng: -122.248079}, {lat:  47.506351, lng: -122.24799}, {lat:  47.506351, lng: -122.247975}, {lat:  47.506318, lng: -122.247975}, {lat:  47.506255, lng: -122.247976}, {lat:  47.505988, lng: -122.24798}, {lat:  47.505791, lng: -122.247983}, {lat:  47.505593, lng: -122.247986}, {lat:  47.505289, lng: -122.24799}, {lat:  47.50405, lng: -122.248007}, {lat:  47.503852, lng: -122.24801}, {lat:  47.503655, lng: -122.248012}, {lat:  47.503458, lng: -122.248015}, {lat:  47.503194, lng: -122.248019}, {lat:  47.503067, lng: -122.248021}, {lat:  47.503033, lng: -122.245623}, {lat:  47.503179, lng: -122.245599}, {lat:  47.503262, lng: -122.245585}, {lat:  47.503342, lng: -122.245572}, {lat:  47.503509, lng: -122.245545}, {lat:  47.503675, lng: -122.245519}, {lat:  47.503814, lng: -122.245496}, {lat:  47.50389, lng: -122.245484}, {lat:  47.50394, lng: -122.245513}, {lat:  47.504059, lng: -122.245583}, {lat:  47.504169, lng: -122.245648}, {lat:  47.504278, lng: -122.245712}, {lat:  47.504427, lng: -122.2458}, {lat:  47.504585, lng: -122.245894}, {lat:  47.504747, lng: -122.245989}, {lat:  47.504798, lng: -122.246019}, {lat:  47.504848, lng: -122.246049}, {lat:  47.505098, lng: -122.246196}, {lat:  47.505234, lng: -122.246276}, {lat:  47.505303, lng: -122.246258}, {lat:  47.505316, lng: -122.246254}, {lat:  47.505518, lng: -122.246201}, {lat:  47.505719, lng: -122.246148}, {lat:  47.505879, lng: -122.246105}, {lat:  47.505964, lng: -122.246083}, {lat:  47.506045, lng: -122.246061}, {lat:  47.506207, lng: -122.246029}, {lat:  47.506322, lng: -122.246035}, {lat:  47.506376, lng: -122.246037}, {lat:  47.506504, lng: -122.246043}, {lat:  47.506559, lng: -122.246046}, {lat:  47.506614, lng: -122.246048}, {lat:  47.506793, lng: -122.246056}, {lat:  47.506972, lng: -122.246065}, {lat:  47.507149, lng: -122.246073}, {lat:  47.507233, lng: -122.246077}, {lat:  47.507304, lng: -122.246142}, {lat:  47.507404, lng: -122.246233}, {lat:  47.507515, lng: -122.246335}, {lat:  47.507626, lng: -122.246436}, {lat:  47.507763, lng: -122.246562}, {lat:  47.507904, lng: -122.246691}, {lat:  47.508075, lng: -122.246848}, {lat:  47.508211, lng: -122.246972}, {lat:  47.508327, lng: -122.246936}, {lat:  47.508568, lng: -122.246862}, {lat:  47.508937, lng: -122.246789}, {lat:  47.508961, lng: -122.246849}, {lat:  47.508992, lng: -122.246901}, {lat:  47.509028, lng: -122.246945}, {lat:  47.509069, lng: -122.24698}, {lat:  47.509114, lng: -122.247003}, {lat:  47.50916, lng: -122.247015}, {lat:  47.509207, lng: -122.247015}, {lat:  47.509254, lng: -122.247003}, {lat:  47.509292, lng: -122.246983}, {lat:  47.509664, lng: -122.247128}, {lat:  47.509706, lng: -122.247145}, {lat:  47.509701, lng: -122.24678}, {lat:  47.509698, lng: -122.246594}, {lat:  47.509697, lng: -122.246502}, {lat:  47.509734, lng: -122.245802}, {lat:  47.509724, lng: -122.245602}, {lat:  47.509714, lng: -122.245402}, {lat:  47.509679, lng: -122.245206}, {lat:  47.509677, lng: -122.245095}, {lat:  47.509675, lng: -122.244911}, {lat:  47.509662, lng: -122.24398}, {lat:  47.509715, lng: -122.243742}, {lat:  47.509697, lng: -122.243322}, {lat:  47.509692, lng: -122.243321}, {lat:  47.509691, lng: -122.243307}, {lat:  47.509652, lng: -122.243303}, {lat:  47.509643, lng: -122.242679}, {lat:  47.509622, lng: -122.241114}, {lat:  47.509593, lng: -122.239137}, {lat:  47.509588, lng: -122.238819}, {lat:  47.509588, lng: -122.238796}, {lat:  47.509576, lng: -122.238024}, {lat:  47.509574, lng: -122.237901}, {lat:  47.509574, lng: -122.23786}, {lat:  47.509572, lng: -122.2377}, {lat:  47.509569, lng: -122.237483}, {lat:  47.509567, lng: -122.237345}, {lat:  47.509567, lng: -122.237336}, {lat:  47.509565, lng: -122.237202}, {lat:  47.509564, lng: -122.237179}, {lat:  47.509563, lng: -122.237072}, {lat:  47.509562, lng: -122.236985}, {lat:  47.509562, lng: -122.236984}, {lat:  47.509561, lng: -122.236917}, {lat:  47.509559, lng: -122.236803}, {lat:  47.509557, lng: -122.236658}, {lat:  47.509557, lng: -122.236657}, {lat:  47.509556, lng: -122.236607}, {lat:  47.509556, lng: -122.236605}, {lat:  47.509553, lng: -122.236374}, {lat:  47.509553, lng: -122.236373}, {lat:  47.509552, lng: -122.23628}, {lat:  47.509594, lng: -122.236379}, {lat:  47.510032, lng: -122.237269}, {lat:  47.51025, lng: -122.237638}, {lat:  47.510368, lng: -122.237744}, {lat:  47.510531, lng: -122.237957}, {lat:  47.510668, lng: -122.238229}, {lat:  47.510769, lng: -122.238527}, {lat:  47.51088, lng: -122.238965}, {lat:  47.511054, lng: -122.239393}, {lat:  47.511091, lng: -122.239583}, {lat:  47.511183, lng: -122.239879}, {lat:  47.511184, lng: -122.240128}, {lat:  47.511223, lng: -122.240248}, {lat:  47.511222, lng: -122.240276}, {lat:  47.511231, lng: -122.240271}, {lat:  47.511277, lng: -122.240483}, {lat:  47.511297, lng: -122.240769}, {lat:  47.51128, lng: -122.240982}, {lat:  47.511263, lng: -122.241113}, {lat:  47.511264, lng: -122.241196}, {lat:  47.511505, lng: -122.242275}, {lat:  47.511584, lng: -122.24332}, {lat:  47.511552, lng: -122.243959}, {lat:  47.511517, lng: -122.244077}, {lat:  47.511526, lng: -122.24416}, {lat:  47.511686, lng: -122.245145}, {lat:  47.511751, lng: -122.245393}, {lat:  47.511807, lng: -122.245727}, {lat:  47.511934, lng: -122.245929}, {lat:  47.51198, lng: -122.246034}, {lat:  47.512016, lng: -122.246165}, {lat:  47.512117, lng: -122.246367}, {lat:  47.512172, lng: -122.246593}, {lat:  47.51222, lng: -122.246996}, {lat:  47.512266, lng: -122.247209}, {lat:  47.51233, lng: -122.247281}, {lat:  47.512502, lng: -122.247387}, {lat:  47.512556, lng: -122.247483}, {lat:  47.512576, lng: -122.24776}, {lat:  47.512693, lng: -122.247837}, {lat:  47.512643, lng: -122.248502}, {lat:  47.512599, lng: -122.248632}, {lat:  47.512601, lng: -122.248798}, {lat:  47.512667, lng: -122.24932}, {lat:  47.512731, lng: -122.249475}, {lat:  47.512857, lng: -122.249487}, {lat:  47.512921, lng: -122.249711}, {lat:  47.513048, lng: -122.249842}, {lat:  47.513111, lng: -122.24989}, {lat:  47.513166, lng: -122.249997}, {lat:  47.513229, lng: -122.250044}, {lat:  47.513322, lng: -122.250211}, {lat:  47.513375, lng: -122.250306}, {lat:  47.513448, lng: -122.250365}, {lat:  47.513538, lng: -122.250388}, {lat:  47.513583, lng: -122.250459}, {lat:  47.513656, lng: -122.250626}, {lat:  47.514188, lng: -122.251278}, {lat:  47.514281, lng: -122.251332}, {lat:  47.514572, lng: -122.251599}, {lat:  47.514935, lng: -122.252093}, {lat:  47.514936, lng: -122.252094}, {lat:  47.515215, lng: -122.252304}, {lat:  47.515596, lng: -122.252731}, {lat:  47.515786, lng: -122.253023}, {lat:  47.516087, lng: -122.253615}, {lat:  47.516332, lng: -122.253913}, {lat:  47.516721, lng: -122.254253}, {lat:  47.516829, lng: -122.254414}, {lat:  47.516892, lng: -122.254509}, {lat:  47.517642, lng: -122.255042}, {lat:  47.517888, lng: -122.255468}, {lat:  47.518616, lng: -122.256475}, {lat:  47.519471, lng: -122.257657}, {lat:  47.519632, lng: -122.258137}, {lat:  47.519801, lng: -122.258606}, {lat:  47.519978, lng: -122.259053}, {lat:  47.520067, lng: -122.259271}, {lat:  47.520197, lng: -122.259761}, {lat:  47.52027, lng: -122.260487}, {lat:  47.520557, lng: -122.259761}, {lat:  47.520594, lng: -122.25984}, {lat:  47.520809, lng: -122.260301}, {lat:  47.520693, lng: -122.260744}, {lat:  47.520729, lng: -122.261007}, {lat:  47.520862, lng: -122.261332}, {lat:  47.520947, lng: -122.261539}, {lat:  47.520973, lng: -122.261772}, {lat:  47.520922, lng: -122.261916}, {lat:  47.521103, lng: -122.262531}, {lat:  47.521402, lng: -122.262879}, {lat:  47.521511, lng: -122.263017}, {lat:  47.521719, lng: -122.263161}, {lat:  47.522025, lng: -122.26321}, {lat:  47.522412, lng: -122.26325}, {lat:  47.522636, lng: -122.263168}, {lat:  47.523085, lng: -122.263196}, {lat:  47.52329, lng: -122.263185}, {lat:  47.523345, lng: -122.263182}, {lat:  47.52346, lng: -122.263075}, {lat:  47.523953, lng: -122.262212}, {lat:  47.524033, lng: -122.262058}, {lat:  47.524104, lng: -122.26188}, {lat:  47.524094, lng: -122.261727}, {lat:  47.52403, lng: -122.26154}, {lat:  47.523848, lng: -122.261281}, {lat:  47.523802, lng: -122.261168}, {lat:  47.523818, lng: -122.260762}, {lat:  47.523924, lng: -122.260478}, {lat:  47.524049, lng: -122.260335}, {lat:  47.52422, lng: -122.26026}, {lat:  47.524533, lng: -122.260065}, {lat:  47.524937, lng: -122.259968}, {lat:  47.525307, lng: -122.260001}, {lat:  47.525828, lng: -122.259951}, {lat:  47.526251, lng: -122.260048}, {lat:  47.526505, lng: -122.260177}, {lat:  47.526711, lng: -122.260209}, {lat:  47.526837, lng: -122.260169}, {lat:  47.52688, lng: -122.26016}, {lat:  47.527044, lng: -122.260128}, {lat:  47.527315, lng: -122.2602}, {lat:  47.527594, lng: -122.260233}, {lat:  47.5279, lng: -122.26033}, {lat:  47.528072, lng: -122.260442}, {lat:  47.528388, lng: -122.260695}, {lat:  47.528949, lng: -122.261359}, {lat:  47.529138, lng: -122.261525}, {lat:  47.529196, lng: -122.261657}, {lat:  47.529217, lng: -122.26178}, {lat:  47.529201, lng: -122.261993}, {lat:  47.529217, lng: -122.262474}, {lat:  47.529318, lng: -122.262817}, {lat:  47.52952, lng: -122.26309}, {lat:  47.529843, lng: -122.2633}, {lat:  47.530231, lng: -122.263137}, {lat:  47.530482, lng: -122.263097}, {lat:  47.530823, lng: -122.263007}, {lat:  47.531201, lng: -122.262934}, {lat:  47.531594, lng: -122.262921}, {lat:  47.531705, lng: -122.262917}, {lat:  47.532119, lng: -122.262989}, {lat:  47.532363, lng: -122.263104}, {lat:  47.532689, lng: -122.263379}, {lat:  47.533023, lng: -122.263669}, {lat:  47.533331, lng: -122.263873}, {lat:  47.53389, lng: -122.264057}, {lat:  47.53416, lng: -122.264073}, {lat:  47.534457, lng: -122.264024}, {lat:  47.535022, lng: -122.263773}, {lat:  47.535219, lng: -122.26361}, {lat:  47.535482, lng: -122.263476}, {lat:  47.535506, lng: -122.263465}, {lat:  47.535757, lng: -122.263358}, {lat:  47.535855, lng: -122.263278}, {lat:  47.536267, lng: -122.262969}, {lat:  47.536365, lng: -122.262775}, {lat:  47.536419, lng: -122.262734}, {lat:  47.536553, lng: -122.262661}, {lat:  47.536803, lng: -122.262427}, {lat:  47.53717, lng: -122.262127}, {lat:  47.53744, lng: -122.262013}, {lat:  47.537979, lng: -122.261947}, {lat:  47.538483, lng: -122.26185}, {lat:  47.538788, lng: -122.261849}, {lat:  47.538904, lng: -122.261871}, {lat:  47.539095, lng: -122.261907}, {lat:  47.53967, lng: -122.261873}, {lat:  47.539815, lng: -122.261937}, {lat:  47.539987, lng: -122.26201}, {lat:  47.540238, lng: -122.261985}, {lat:  47.540417, lng: -122.261879}, {lat:  47.540614, lng: -122.261669}, {lat:  47.540846, lng: -122.261427}, {lat:  47.541096, lng: -122.261111}, {lat:  47.541568, lng: -122.260292}, {lat:  47.541772, lng: -122.259959}, {lat:  47.541915, lng: -122.259814}, {lat:  47.54213, lng: -122.259595}, {lat:  47.542299, lng: -122.259279}, {lat:  47.542451, lng: -122.259165}, {lat:  47.542711, lng: -122.259067}, {lat:  47.542837, lng: -122.258987}, {lat:  47.543383, lng: -122.258589}, {lat:  47.543428, lng: -122.258492}, {lat:  47.543553, lng: -122.258329}, {lat:  47.544063, lng: -122.257973}, {lat:  47.544342, lng: -122.257891}, {lat:  47.5447, lng: -122.257761}, {lat:  47.544921, lng: -122.257608}, {lat:  47.545274, lng: -122.257363}, {lat:  47.545622, lng: -122.257392}, {lat:  47.545793, lng: -122.257416}, {lat:  47.545968, lng: -122.257544}, {lat:  47.546194, lng: -122.25772}, {lat:  47.54642, lng: -122.257877}, {lat:  47.546591, lng: -122.257945}, {lat:  47.546871, lng: -122.258052}, {lat:  47.547285, lng: -122.258059}, {lat:  47.547733, lng: -122.257742}, {lat:  47.547948, lng: -122.257644}, {lat:  47.548326, lng: -122.257618}, {lat:  47.548478, lng: -122.257497}, {lat:  47.548611, lng: -122.257246}, {lat:  47.548681, lng: -122.256874}, {lat:  47.548945, lng: -122.256425}, {lat:  47.549159, lng: -122.255646}, {lat:  47.549002, lng: -122.255153}, {lat:  47.549082, lng: -122.254672}, {lat:  47.549093, lng: -122.254174}, {lat:  47.549175, lng: -122.253793}, {lat:  47.549152, lng: -122.253246}, {lat:  47.549084, lng: -122.252907}, {lat:  47.549023, lng: -122.252775}, {lat:  47.548924, lng: -122.252331}, {lat:  47.549165, lng: -122.251883}, {lat:  47.549352, lng: -122.251919}, {lat:  47.549225, lng: -122.25166}, {lat:  47.549204, lng: -122.251434}, {lat:  47.549267, lng: -122.251215}, {lat:  47.54932, lng: -122.251009}, {lat:  47.549376, lng: -122.250754}, {lat:  47.54955, lng: -122.250522}, {lat:  47.549736, lng: -122.250115}, {lat:  47.549827, lng: -122.249425}, {lat:  47.55007, lng: -122.249256}, {lat:  47.550808, lng: -122.248416}, {lat:  47.55117, lng: -122.248156}, {lat:  47.551272, lng: -122.247854}, {lat:  47.55163, lng: -122.247516}, {lat:  47.551902, lng: -122.247235}, {lat:  47.551976, lng: -122.247026}, {lat:  47.552155, lng: -122.246979}, {lat:  47.552338, lng: -122.246928}, {lat:  47.552502, lng: -122.246805}, {lat:  47.552568, lng: -122.246743}, {lat:  47.552634, lng: -122.246714}, {lat:  47.552732, lng: -122.246684}, {lat:  47.552938, lng: -122.246659}, {lat:  47.553121, lng: -122.246774}, {lat:  47.553503, lng: -122.2465}, {lat:  47.553647, lng: -122.246426}, {lat:  47.55383, lng: -122.246528}, {lat:  47.553883, lng: -122.24661}, {lat:  47.554055, lng: -122.246696}, {lat:  47.554228, lng: -122.246701}, {lat:  47.554336, lng: -122.246785}, {lat:  47.554423, lng: -122.246756}, {lat:  47.554648, lng: -122.246891}, {lat:  47.554852, lng: -122.246888}, {lat:  47.554951, lng: -122.246971}, {lat:  47.555068, lng: -122.246983}, {lat:  47.555194, lng: -122.246948}, {lat:  47.555398, lng: -122.247165}, {lat:  47.555593, lng: -122.24725}, {lat:  47.555646, lng: -122.247331}, {lat:  47.555715, lng: -122.247439}, {lat:  47.555854, lng: -122.247706}, {lat:  47.556064, lng: -122.247947}, {lat:  47.556292, lng: -122.247939}, {lat:  47.55637, lng: -122.247829}, {lat:  47.556511, lng: -122.247886}, {lat:  47.556743, lng: -122.247867}, {lat:  47.557106, lng: -122.247933}, {lat:  47.557277, lng: -122.247649}, {lat:  47.557952, lng: -122.247648}, {lat:  47.558285, lng: -122.247696}, {lat:  47.558375, lng: -122.247731}, {lat:  47.558474, lng: -122.247755}, {lat:  47.558601, lng: -122.247826}, {lat:  47.558827, lng: -122.248124}, {lat:  47.5589, lng: -122.248183}, {lat:  47.558981, lng: -122.248218}, {lat:  47.559307, lng: -122.248432}, {lat:  47.55937, lng: -122.248503}, {lat:  47.559451, lng: -122.24855}, {lat:  47.559687, lng: -122.248741}, {lat:  47.560122, lng: -122.249362}, {lat:  47.560295, lng: -122.249476}, {lat:  47.560423, lng: -122.24958}, {lat:  47.560495, lng: -122.24964}, {lat:  47.560634, lng: -122.249786}, {lat:  47.560863, lng: -122.249926}, {lat:  47.561149, lng: -122.250121}, {lat:  47.561348, lng: -122.250206}, {lat:  47.561598, lng: -122.250392}, {lat:  47.561731, lng: -122.250475}, {lat:  47.561822, lng: -122.250596}, {lat:  47.561992, lng: -122.250819}, {lat:  47.562029, lng: -122.251017}, {lat:  47.562065, lng: -122.251314}, {lat:  47.562063, lng: -122.251413}, {lat:  47.562094, lng: -122.251514}, {lat:  47.562072, lng: -122.251709}, {lat:  47.562144, lng: -122.252297}, {lat:  47.562086, lng: -122.252793}, {lat:  47.561857, lng: -122.253027}, {lat:  47.561752, lng: -122.253473}, {lat:  47.561664, lng: -122.254041}, {lat:  47.561562, lng: -122.25429}, {lat:  47.561622, lng: -122.255006}, {lat:  47.561513, lng: -122.2552}, {lat:  47.561298, lng: -122.255311}, {lat:  47.561017, lng: -122.255302}, {lat:  47.560683, lng: -122.25535}, {lat:  47.560457, lng: -122.255322}, {lat:  47.559801, lng: -122.255439}, {lat:  47.559589, lng: -122.255314}, {lat:  47.558577, lng: -122.255307}, {lat:  47.558379, lng: -122.25521}, {lat:  47.55801, lng: -122.255106}, {lat:  47.557018, lng: -122.254895}, {lat:  47.556803, lng: -122.254912}, {lat:  47.555873, lng: -122.254876}, {lat:  47.555579, lng: -122.254886}, {lat:  47.555354, lng: -122.2548}, {lat:  47.55506, lng: -122.254791}, {lat:  47.55494, lng: -122.254787}, {lat:  47.55482, lng: -122.254822}, {lat:  47.554708, lng: -122.254685}]
      ],
      { strokeColor: '#3399FF'}
    );
    var dist3a = handler.addPolygons(
      [
        [{lat:  47.641928, lng: -122.292917}, {lat:  47.641924, lng: -122.293157}, {lat:  47.642041, lng: -122.293502}, {lat:  47.642132, lng: -122.293766}, {lat:  47.642369, lng: -122.294155}, {lat:  47.642476, lng: -122.294299}, {lat:  47.642582, lng: -122.294423}, {lat:  47.642746, lng: -122.294348}, {lat:  47.642788, lng: -122.29427}, {lat:  47.64283, lng: -122.294191}, {lat:  47.642807, lng: -122.293909}, {lat:  47.642784, lng: -122.293628}, {lat:  47.64268, lng: -122.293323}, {lat:  47.642576, lng: -122.293079}, {lat:  47.642496, lng: -122.292956}, {lat:  47.642336, lng: -122.29279}, {lat:  47.642256, lng: -122.292708}, {lat:  47.642122, lng: -122.292623}, {lat:  47.642011, lng: -122.29278}, {lat:  47.641943, lng: -122.292817}, {lat:  47.641928, lng: -122.292917}]
      ],
    { strokeColor: '#33CC33'}
  );
  var dist3b = handler.addPolygons(
    [
      [{lat:  47.646509, lng: -122.294124}, {lat:  47.646471, lng: -122.293959}, {lat:  47.646514, lng: -122.293764}, {lat:  47.646531, lng: -122.29356}, {lat:  47.646441, lng: -122.293569}, {lat:  47.64619, lng: -122.293806}, {lat:  47.646201, lng: -122.294033}, {lat:  47.646257, lng: -122.294255}, {lat:  47.646175, lng: -122.294291}, {lat:  47.646068, lng: -122.294458}, {lat:  47.645994, lng: -122.294572}, {lat:  47.645979, lng: -122.294659}, {lat:  47.645952, lng: -122.294807}, {lat:  47.645803, lng: -122.295016}, {lat:  47.645817, lng: -122.295252}, {lat:  47.645842, lng: -122.295445}, {lat:  47.645825, lng: -122.295548}, {lat:  47.645853, lng: -122.29579}, {lat:  47.645799, lng: -122.295841}, {lat:  47.645755, lng: -122.295963}, {lat:  47.645725, lng: -122.296048}, {lat:  47.645687, lng: -122.296204}, {lat:  47.645684, lng: -122.296388}, {lat:  47.645681, lng: -122.296623}, {lat:  47.645678, lng: -122.29678}, {lat:  47.645674, lng: -122.297041}, {lat:  47.645689, lng: -122.297199}, {lat:  47.645705, lng: -122.29733}, {lat:  47.645722, lng: -122.29741}, {lat:  47.645716, lng: -122.297802}, {lat:  47.645745, lng: -122.29817}, {lat:  47.645711, lng: -122.298369}, {lat:  47.645688, lng: -122.298482}, {lat:  47.645729, lng: -122.298667}, {lat:  47.646002, lng: -122.298741}, {lat:  47.646205, lng: -122.298748}, {lat:  47.646295, lng: -122.29866}, {lat:  47.646372, lng: -122.298269}, {lat:  47.64638, lng: -122.297746}, {lat:  47.646371, lng: -122.297196}, {lat:  47.646355, lng: -122.296638}, {lat:  47.64645, lng: -122.296556}, {lat:  47.646581, lng: -122.295867}, {lat:  47.646613, lng: -122.295184}, {lat:  47.646553, lng: -122.294316}, {lat:  47.646509, lng: -122.294124}]
    ],
  { strokeColor: '#33CC33'}
  );
  var dist3c = handler.addPolygons(
    [
      [{lat:  47.646836, lng: -122.290618}, {lat:  47.646767, lng: -122.290585}, {lat:  47.646805, lng: -122.290354}, {lat:  47.646811, lng: -122.289993}, {lat:  47.646654, lng: -122.289647}, {lat:  47.646575, lng: -122.289443}, {lat:  47.646512, lng: -122.28918}, {lat:  47.646462, lng: -122.288858}, {lat:  47.646415, lng: -122.288415}, {lat:  47.646367, lng: -122.288012}, {lat:  47.64629, lng: -122.287729}, {lat:  47.646165, lng: -122.287643}, {lat:  47.646075, lng: -122.287581}, {lat:  47.645899, lng: -122.287575}, {lat:  47.645763, lng: -122.287651}, {lat:  47.645573, lng: -122.287645}, {lat:  47.645437, lng: -122.28768}, {lat:  47.645057, lng: -122.287708}, {lat:  47.644997, lng: -122.287545}, {lat:  47.645168, lng: -122.287551}, {lat:  47.645345, lng: -122.287517}, {lat:  47.645562, lng: -122.287484}, {lat:  47.645793, lng: -122.287451}, {lat:  47.645969, lng: -122.287457}, {lat:  47.646162, lng: -122.287453}, {lat:  47.646335, lng: -122.28745}, {lat:  47.646225, lng: -122.287106}, {lat:  47.646193, lng: -122.287004}, {lat:  47.64609, lng: -122.286619}, {lat:  47.645986, lng: -122.286355}, {lat:  47.645825, lng: -122.285939}, {lat:  47.645887, lng: -122.28575}, {lat:  47.645782, lng: -122.285463}, {lat:  47.64546, lng: -122.285254}, {lat:  47.645257, lng: -122.285238}, {lat:  47.645145, lng: -122.285251}, {lat:  47.644943, lng: -122.285437}, {lat:  47.644885, lng: -122.285676}, {lat:  47.644905, lng: -122.286158}, {lat:  47.644903, lng: -122.286278}, {lat:  47.644899, lng: -122.286519}, {lat:  47.644895, lng: -122.2868}, {lat:  47.644891, lng: -122.28706}, {lat:  47.644887, lng: -122.287287}, {lat:  47.644628, lng: -122.287037}, {lat:  47.644557, lng: -122.287098}, {lat:  47.644375, lng: -122.287123}, {lat:  47.64426, lng: -122.287561}, {lat:  47.644147, lng: -122.287838}, {lat:  47.643979, lng: -122.288153}, {lat:  47.64395, lng: -122.288332}, {lat:  47.644059, lng: -122.288256}, {lat:  47.644199, lng: -122.288192}, {lat:  47.644294, lng: -122.288245}, {lat:  47.644455, lng: -122.288205}, {lat:  47.64437, lng: -122.288347}, {lat:  47.644204, lng: -122.288541}, {lat:  47.644024, lng: -122.288688}, {lat:  47.643895, lng: -122.288848}, {lat:  47.643628, lng: -122.289003}, {lat:  47.643354, lng: -122.289195}, {lat:  47.643092, lng: -122.289467}, {lat:  47.642845, lng: -122.289659}, {lat:  47.642626, lng: -122.289812}, {lat:  47.642542, lng: -122.28997}, {lat:  47.642403, lng: -122.290206}, {lat:  47.642346, lng: -122.290404}, {lat:  47.642341, lng: -122.290725}, {lat:  47.642393, lng: -122.290847}, {lat:  47.642444, lng: -122.291049}, {lat:  47.642494, lng: -122.291332}, {lat:  47.642384, lng: -122.291449}, {lat:  47.642299, lng: -122.291706}, {lat:  47.642269, lng: -122.291885}, {lat:  47.642239, lng: -122.292085}, {lat:  47.642262, lng: -122.292326}, {lat:  47.642315, lng: -122.292409}, {lat:  47.642394, lng: -122.292572}, {lat:  47.642513, lng: -122.292736}, {lat:  47.642674, lng: -122.292862}, {lat:  47.64278, lng: -122.293026}, {lat:  47.642832, lng: -122.293128}, {lat:  47.642908, lng: -122.293491}, {lat:  47.64296, lng: -122.293654}, {lat:  47.642956, lng: -122.293934}, {lat:  47.643048, lng: -122.294118}, {lat:  47.643169, lng: -122.294182}, {lat:  47.643263, lng: -122.294185}, {lat:  47.643565, lng: -122.293995}, {lat:  47.643787, lng: -122.293642}, {lat:  47.644063, lng: -122.29333}, {lat:  47.644286, lng: -122.292936}, {lat:  47.64448, lng: -122.292622}, {lat:  47.644675, lng: -122.292308}, {lat:  47.644786, lng: -122.292111}, {lat:  47.644899, lng: -122.291794}, {lat:  47.645027, lng: -122.291457}, {lat:  47.645187, lng: -122.291623}, {lat:  47.645316, lng: -122.292028}, {lat:  47.645418, lng: -122.292433}, {lat:  47.645493, lng: -122.292857}, {lat:  47.645515, lng: -122.293178}, {lat:  47.645619, lng: -122.293502}, {lat:  47.645753, lng: -122.293587}, {lat:  47.645919, lng: -122.293392}, {lat:  47.64602, lng: -122.293297}, {lat:  47.646084, lng: -122.293238}, {lat:  47.646194, lng: -122.293121}, {lat:  47.646277, lng: -122.293003}, {lat:  47.646442, lng: -122.292848}, {lat:  47.646461, lng: -122.292744}, {lat:  47.646476, lng: -122.292408}, {lat:  47.646352, lng: -122.292304}, {lat:  47.646412, lng: -122.292165}, {lat:  47.646443, lng: -122.291886}, {lat:  47.6465, lng: -122.291707}, {lat:  47.646576, lng: -122.291526}, {lat:  47.64674, lng: -122.291086}, {lat:  47.646835, lng: -122.290898}, {lat:  47.646836, lng: -122.290618}]
    ],
  { strokeColor: '#33CC33'}
  );
  var dist3d = handler.addPolygons(
    [
      [{lat:  47.648782, lng: -122.317663}, {lat:  47.648626, lng: -122.317518}, {lat:  47.648201, lng: -122.317128}, {lat:  47.647863, lng: -122.316759}, {lat:  47.647488, lng: -122.316427}, {lat:  47.647286, lng: -122.316326}, {lat:  47.647097, lng: -122.316207}, {lat:  47.646883, lng: -122.316144}, {lat:  47.646667, lng: -122.316155}, {lat:  47.646375, lng: -122.316145}, {lat:  47.646071, lng: -122.316116}, {lat:  47.64574, lng: -122.316105}, {lat:  47.645614, lng: -122.316115}, {lat:  47.64541, lng: -122.316131}, {lat:  47.644983, lng: -122.316247}, {lat:  47.644702, lng: -122.316396}, {lat:  47.644496, lng: -122.316413}, {lat:  47.644152, lng: -122.316377}, {lat:  47.643907, lng: -122.316272}, {lat:  47.643762, lng: -122.316121}, {lat:  47.643766, lng: -122.31589}, {lat:  47.64334, lng: -122.315815}, {lat:  47.643163, lng: -122.31559}, {lat:  47.642993, lng: -122.315414}, {lat:  47.64276, lng: -122.315115}, {lat:  47.642623, lng: -122.31494}, {lat:  47.642413, lng: -122.314678}, {lat:  47.642214, lng: -122.314282}, {lat:  47.642312, lng: -122.313812}, {lat:  47.642334, lng: -122.313436}, {lat:  47.64229, lng: -122.313143}, {lat:  47.642235, lng: -122.312959}, {lat:  47.642164, lng: -122.31275}, {lat:  47.642069, lng: -122.312528}, {lat:  47.641917, lng: -122.31228}, {lat:  47.64194, lng: -122.311892}, {lat:  47.642093, lng: -122.311533}, {lat:  47.642244, lng: -122.31132}, {lat:  47.642395, lng: -122.31113}, {lat:  47.642595, lng: -122.310918}, {lat:  47.642651, lng: -122.310833}, {lat:  47.642655, lng: -122.310826}, {lat:  47.642741, lng: -122.310695}, {lat:  47.643271, lng: -122.310793}, {lat:  47.643261, lng: -122.308635}, {lat:  47.643707, lng: -122.308635}, {lat:  47.643832, lng: -122.307507}, {lat:  47.643887, lng: -122.307537}, {lat:  47.643898, lng: -122.307877}, {lat:  47.643993, lng: -122.308123}, {lat:  47.644072, lng: -122.308176}, {lat:  47.644072, lng: -122.308134}, {lat:  47.644071, lng: -122.308079}, {lat:  47.644071, lng: -122.307835}, {lat:  47.644069, lng: -122.307551}, {lat:  47.644069, lng: -122.307545}, {lat:  47.644069, lng: -122.307462}, {lat:  47.644067, lng: -122.307105}, {lat:  47.644067, lng: -122.307104}, {lat:  47.644067, lng: -122.306898}, {lat:  47.644068, lng: -122.307105}, {lat:  47.644068, lng: -122.307106}, {lat:  47.644068, lng: -122.307167}, {lat:  47.644071, lng: -122.307466}, {lat:  47.644072, lng: -122.307548}, {lat:  47.64423, lng: -122.307734}, {lat:  47.644234, lng: -122.307742}, {lat:  47.644263, lng: -122.307806}, {lat:  47.644285, lng: -122.30785}, {lat:  47.644317, lng: -122.3079}, {lat:  47.644347, lng: -122.307942}, {lat:  47.644352, lng: -122.307947}, {lat:  47.644394, lng: -122.307996}, {lat:  47.644439, lng: -122.308042}, {lat:  47.644485, lng: -122.308099}, {lat:  47.644515, lng: -122.308135}, {lat:  47.644531, lng: -122.308162}, {lat:  47.644545, lng: -122.308188}, {lat:  47.644546, lng: -122.308191}, {lat:  47.644559, lng: -122.308217}, {lat:  47.644567, lng: -122.308256}, {lat:  47.644572, lng: -122.308291}, {lat:  47.644574, lng: -122.308338}, {lat:  47.644628, lng: -122.308485}, {lat:  47.644624, lng: -122.308703}, {lat:  47.644885, lng: -122.308809}, {lat:  47.644902, lng: -122.308841}, {lat:  47.644954, lng: -122.308846}, {lat:  47.644979, lng: -122.308851}, {lat:  47.644994, lng: -122.308865}, {lat:  47.645007, lng: -122.308879}, {lat:  47.645018, lng: -122.308903}, {lat:  47.645028, lng: -122.308937}, {lat:  47.645035, lng: -122.308963}, {lat:  47.645045, lng: -122.30898}, {lat:  47.645059, lng: -122.308995}, {lat:  47.64507, lng: -122.309001}, {lat:  47.645089, lng: -122.309008}, {lat:  47.645096, lng: -122.309008}, {lat:  47.645145, lng: -122.30901}, {lat:  47.645146, lng: -122.309179}, {lat:  47.645184, lng: -122.30916}, {lat:  47.645279, lng: -122.309357}, {lat:  47.645391, lng: -122.30958}, {lat:  47.645617, lng: -122.30977}, {lat:  47.645896, lng: -122.309803}, {lat:  47.646193, lng: -122.309692}, {lat:  47.646293, lng: -122.309623}, {lat:  47.64644, lng: -122.309676}, {lat:  47.646556, lng: -122.309607}, {lat:  47.646706, lng: -122.309442}, {lat:  47.646831, lng: -122.309305}, {lat:  47.646857, lng: -122.309277}, {lat:  47.646974, lng: -122.309135}, {lat:  47.646993, lng: -122.308966}, {lat:  47.646981, lng: -122.30865}, {lat:  47.646993, lng: -122.308395}, {lat:  47.646997, lng: -122.308152}, {lat:  47.647033, lng: -122.307983}, {lat:  47.64701, lng: -122.307825}, {lat:  47.646899, lng: -122.307566}, {lat:  47.646935, lng: -122.307373}, {lat:  47.646938, lng: -122.307179}, {lat:  47.646943, lng: -122.306863}, {lat:  47.646963, lng: -122.306645}, {lat:  47.646994, lng: -122.306257}, {lat:  47.647015, lng: -122.304796}, {lat:  47.647043, lng: -122.303509}, {lat:  47.647027, lng: -122.302607}, {lat:  47.647042, lng: -122.302325}, {lat:  47.646984, lng: -122.301769}, {lat:  47.646962, lng: -122.301216}, {lat:  47.64695, lng: -122.300963}, {lat:  47.6469, lng: -122.300824}, {lat:  47.646875, lng: -122.300753}, {lat:  47.646809, lng: -122.300605}, {lat:  47.646703, lng: -122.300368}, {lat:  47.646564, lng: -122.300259}, {lat:  47.646449, lng: -122.300164}, {lat:  47.646437, lng: -122.299968}, {lat:  47.646346, lng: -122.299803}, {lat:  47.646208, lng: -122.299649}, {lat:  47.646155, lng: -122.299555}, {lat:  47.646048, lng: -122.299471}, {lat:  47.645987, lng: -122.299354}, {lat:  47.645873, lng: -122.299189}, {lat:  47.645751, lng: -122.29907}, {lat:  47.645657, lng: -122.29909}, {lat:  47.645518, lng: -122.299062}, {lat:  47.645441, lng: -122.298967}, {lat:  47.64532, lng: -122.298779}, {lat:  47.645214, lng: -122.298557}, {lat:  47.645055, lng: -122.298173}, {lat:  47.644886, lng: -122.297643}, {lat:  47.644511, lng: -122.297329}, {lat:  47.644228, lng: -122.297281}, {lat:  47.644059, lng: -122.297327}, {lat:  47.643987, lng: -122.297456}, {lat:  47.643964, lng: -122.297769}, {lat:  47.644031, lng: -122.298007}, {lat:  47.644048, lng: -122.298086}, {lat:  47.644045, lng: -122.298269}, {lat:  47.643913, lng: -122.2982}, {lat:  47.64379, lng: -122.298169}, {lat:  47.643634, lng: -122.297954}, {lat:  47.643494, lng: -122.297819}, {lat:  47.643356, lng: -122.297631}, {lat:  47.643287, lng: -122.297524}, {lat:  47.64343, lng: -122.297411}, {lat:  47.643435, lng: -122.297044}, {lat:  47.643586, lng: -122.2965}, {lat:  47.643756, lng: -122.296374}, {lat:  47.644095, lng: -122.29615}, {lat:  47.644256, lng: -122.296025}, {lat:  47.644422, lng: -122.296187}, {lat:  47.644483, lng: -122.296268}, {lat:  47.64466, lng: -122.296221}, {lat:  47.644913, lng: -122.295916}, {lat:  47.645058, lng: -122.295685}, {lat:  47.645099, lng: -122.295346}, {lat:  47.645034, lng: -122.294951}, {lat:  47.644965, lng: -122.294818}, {lat:  47.644808, lng: -122.294655}, {lat:  47.644578, lng: -122.294648}, {lat:  47.644171, lng: -122.294686}, {lat:  47.643835, lng: -122.294675}, {lat:  47.643693, lng: -122.29467}, {lat:  47.643607, lng: -122.294536}, {lat:  47.643475, lng: -122.294466}, {lat:  47.643271, lng: -122.294512}, {lat:  47.643059, lng: -122.294479}, {lat:  47.642907, lng: -122.294474}, {lat:  47.642797, lng: -122.294571}, {lat:  47.642629, lng: -122.294926}, {lat:  47.642454, lng: -122.2948}, {lat:  47.642269, lng: -122.294553}, {lat:  47.642098, lng: -122.294206}, {lat:  47.641965, lng: -122.294001}, {lat:  47.641815, lng: -122.294057}, {lat:  47.641666, lng: -122.294092}, {lat:  47.641529, lng: -122.294167}, {lat:  47.641353, lng: -122.294141}, {lat:  47.641245, lng: -122.294097}, {lat:  47.641166, lng: -122.293974}, {lat:  47.641224, lng: -122.293756}, {lat:  47.641363, lng: -122.29352}, {lat:  47.641515, lng: -122.293345}, {lat:  47.641624, lng: -122.293308}, {lat:  47.641721, lng: -122.293131}, {lat:  47.641862, lng: -122.292775}, {lat:  47.64192, lng: -122.292556}, {lat:  47.641991, lng: -122.292317}, {lat:  47.64205, lng: -122.292039}, {lat:  47.642134, lng: -122.291841}, {lat:  47.642082, lng: -122.291659}, {lat:  47.641924, lng: -122.291373}, {lat:  47.641876, lng: -122.29101}, {lat:  47.642019, lng: -122.290534}, {lat:  47.642132, lng: -122.290216}, {lat:  47.642408, lng: -122.289865}, {lat:  47.642713, lng: -122.289434}, {lat:  47.642906, lng: -122.28924}, {lat:  47.643098, lng: -122.289086}, {lat:  47.643182, lng: -122.288967}, {lat:  47.643347, lng: -122.288733}, {lat:  47.64316, lng: -122.288546}, {lat:  47.643054, lng: -122.288381}, {lat:  47.64313, lng: -122.288205}, {lat:  47.643365, lng: -122.2879}, {lat:  47.643498, lng: -122.287715}, {lat:  47.643718, lng: -122.287522}, {lat:  47.643783, lng: -122.28743}, {lat:  47.643829, lng: -122.287366}, {lat:  47.644047, lng: -122.287252}, {lat:  47.644166, lng: -122.287149}, {lat:  47.644239, lng: -122.286936}, {lat:  47.644259, lng: -122.286736}, {lat:  47.644242, lng: -122.286483}, {lat:  47.644253, lng: -122.286212}, {lat:  47.644244, lng: -122.285916}, {lat:  47.644093, lng: -122.285582}, {lat:  47.644001, lng: -122.285368}, {lat:  47.643925, lng: -122.285179}, {lat:  47.643861, lng: -122.284945}, {lat:  47.643721, lng: -122.28493}, {lat:  47.64361, lng: -122.284892}, {lat:  47.643484, lng: -122.284887}, {lat:  47.643469, lng: -122.284877}, {lat:  47.643052, lng: -122.285048}, {lat:  47.643048, lng: -122.285134}, {lat:  47.642997, lng: -122.28518}, {lat:  47.64296, lng: -122.285253}, {lat:  47.642804, lng: -122.285226}, {lat:  47.642761, lng: -122.285135}, {lat:  47.642726, lng: -122.285062}, {lat:  47.642704, lng: -122.284721}, {lat:  47.642723, lng: -122.284381}, {lat:  47.642704, lng: -122.283859}, {lat:  47.642684, lng: -122.283377}, {lat:  47.642744, lng: -122.282978}, {lat:  47.642938, lng: -122.282703}, {lat:  47.64303, lng: -122.282574}, {lat:  47.643029, lng: -122.281733}, {lat:  47.642846, lng: -122.281597}, {lat:  47.642723, lng: -122.281241}, {lat:  47.642675, lng: -122.280747}, {lat:  47.642698, lng: -122.280174}, {lat:  47.642746, lng: -122.279744}, {lat:  47.642849, lng: -122.279358}, {lat:  47.642717, lng: -122.278943}, {lat:  47.642806, lng: -122.278556}, {lat:  47.642817, lng: -122.278394}, {lat:  47.642824, lng: -122.27829}, {lat:  47.642684, lng: -122.277926}, {lat:  47.642507, lng: -122.277694}, {lat:  47.642282, lng: -122.27743}, {lat:  47.64205, lng: -122.277187}, {lat:  47.641816, lng: -122.277097}, {lat:  47.641582, lng: -122.276945}, {lat:  47.641358, lng: -122.276619}, {lat:  47.641189, lng: -122.276347}, {lat:  47.640956, lng: -122.276155}, {lat:  47.640858, lng: -122.276234}, {lat:  47.640743, lng: -122.276266}, {lat:  47.640533, lng: -122.276327}, {lat:  47.639997, lng: -122.27648}, {lat:  47.639702, lng: -122.276564}, {lat:  47.639417, lng: -122.276546}, {lat:  47.639363, lng: -122.276543}, {lat:  47.639099, lng: -122.276534}, {lat:  47.638765, lng: -122.276554}, {lat:  47.638532, lng: -122.276546}, {lat:  47.638458, lng: -122.277031}, {lat:  47.638171, lng: -122.277057}, {lat:  47.638131, lng: -122.276143}, {lat:  47.638029, lng: -122.276122}, {lat:  47.637737, lng: -122.276033}, {lat:  47.63748, lng: -122.276024}, {lat:  47.637253, lng: -122.275999}, {lat:  47.637239, lng: -122.276104}, {lat:  47.637046, lng: -122.276187}, {lat:  47.63695, lng: -122.276219}, {lat:  47.636935, lng: -122.276216}, {lat:  47.636789, lng: -122.276187}, {lat:  47.636667, lng: -122.276307}, {lat:  47.63651, lng: -122.276408}, {lat:  47.636186, lng: -122.276433}, {lat:  47.635874, lng: -122.276511}, {lat:  47.635509, lng: -122.276481}, {lat:  47.635162, lng: -122.276443}, {lat:  47.634891, lng: -122.276387}, {lat:  47.6346, lng: -122.276377}, {lat:  47.634331, lng: -122.276271}, {lat:  47.63406, lng: -122.276207}, {lat:  47.633874, lng: -122.276145}, {lat:  47.633742, lng: -122.276168}, {lat:  47.633694, lng: -122.27625}, {lat:  47.633616, lng: -122.276497}, {lat:  47.633485, lng: -122.276506}, {lat:  47.633233, lng: -122.276453}, {lat:  47.633177, lng: -122.276441}, {lat:  47.633036, lng: -122.276464}, {lat:  47.632877, lng: -122.276472}, {lat:  47.632577, lng: -122.27649}, {lat:  47.63223, lng: -122.276492}, {lat:  47.631967, lng: -122.276553}, {lat:  47.631779, lng: -122.276602}, {lat:  47.63162, lng: -122.276652}, {lat:  47.631431, lng: -122.276729}, {lat:  47.631129, lng: -122.276912}, {lat:  47.630935, lng: -122.27706}, {lat:  47.63092, lng: -122.277072}, {lat:  47.630712, lng: -122.277217}, {lat:  47.630514, lng: -122.277321}, {lat:  47.63038, lng: -122.277511}, {lat:  47.630151, lng: -122.277808}, {lat:  47.630016, lng: -122.278053}, {lat:  47.629684, lng: -122.278346}, {lat:  47.629446, lng: -122.278615}, {lat:  47.629201, lng: -122.278718}, {lat:  47.629022, lng: -122.278781}, {lat:  47.628805, lng: -122.278884}, {lat:  47.628655, lng: -122.278907}, {lat:  47.628495, lng: -122.278971}, {lat:  47.628318, lng: -122.278892}, {lat:  47.628177, lng: -122.278871}, {lat:  47.627965, lng: -122.278959}, {lat:  47.627843, lng: -122.279095}, {lat:  47.627808, lng: -122.279343}, {lat:  47.627592, lng: -122.27951}, {lat:  47.627385, lng: -122.279722}, {lat:  47.627218, lng: -122.279948}, {lat:  47.627003, lng: -122.280201}, {lat:  47.626909, lng: -122.280375}, {lat:  47.626864, lng: -122.28054}, {lat:  47.626792, lng: -122.280663}, {lat:  47.626691, lng: -122.280805}, {lat:  47.626578, lng: -122.280874}, {lat:  47.626491, lng: -122.281058}, {lat:  47.626298, lng: -122.281239}, {lat:  47.626198, lng: -122.28134}, {lat:  47.62607, lng: -122.28144}, {lat:  47.625927, lng: -122.281539}, {lat:  47.625862, lng: -122.281672}, {lat:  47.62572, lng: -122.281772}, {lat:  47.625593, lng: -122.281809}, {lat:  47.62548, lng: -122.281805}, {lat:  47.625477, lng: -122.281992}, {lat:  47.625397, lng: -122.282166}, {lat:  47.625367, lng: -122.282178}, {lat:  47.625242, lng: -122.282224}, {lat:  47.625157, lng: -122.282221}, {lat:  47.62513, lng: -122.282127}, {lat:  47.625074, lng: -122.282135}, {lat:  47.625038, lng: -122.282196}, {lat:  47.624923, lng: -122.282348}, {lat:  47.624681, lng: -122.282507}, {lat:  47.624426, lng: -122.282644}, {lat:  47.624158, lng: -122.282677}, {lat:  47.62394, lng: -122.28268}, {lat:  47.623687, lng: -122.282692}, {lat:  47.623426, lng: -122.282667}, {lat:  47.623265, lng: -122.282646}, {lat:  47.623084, lng: -122.28261}, {lat:  47.622802, lng: -122.282542}, {lat:  47.622636, lng: -122.282506}, {lat:  47.622548, lng: -122.282324}, {lat:  47.622385, lng: -122.282102}, {lat:  47.622262, lng: -122.281912}, {lat:  47.622114, lng: -122.28169}, {lat:  47.621905, lng: -122.281489}, {lat:  47.621972, lng: -122.281424}, {lat:  47.621863, lng: -122.281264}, {lat:  47.621743, lng: -122.281223}, {lat:  47.621665, lng: -122.281033}, {lat:  47.621571, lng: -122.280941}, {lat:  47.621573, lng: -122.280814}, {lat:  47.621393, lng: -122.280644}, {lat:  47.621309, lng: -122.280574}, {lat:  47.621218, lng: -122.280549}, {lat:  47.621068, lng: -122.280477}, {lat:  47.620958, lng: -122.280391}, {lat:  47.620904, lng: -122.280307}, {lat:  47.620787, lng: -122.280064}, {lat:  47.620698, lng: -122.279912}, {lat:  47.620543, lng: -122.27987}, {lat:  47.620387, lng: -122.279842}, {lat:  47.620275, lng: -122.279891}, {lat:  47.620001, lng: -122.280034}, {lat:  47.619693, lng: -122.28}, {lat:  47.61962, lng: -122.280034}, {lat:  47.619505, lng: -122.280126}, {lat:  47.61931, lng: -122.280168}, {lat:  47.619132, lng: -122.280113}, {lat:  47.618961, lng: -122.280204}, {lat:  47.618685, lng: -122.280194}, {lat:  47.618475, lng: -122.280212}, {lat:  47.618264, lng: -122.280205}, {lat:  47.618007, lng: -122.280076}, {lat:  47.617715, lng: -122.280066}, {lat:  47.617448, lng: -122.280082}, {lat:  47.617286, lng: -122.280052}, {lat:  47.616914, lng: -122.280016}, {lat:  47.616669, lng: -122.280103}, {lat:  47.616474, lng: -122.280157}, {lat:  47.616351, lng: -122.280246}, {lat:  47.616269, lng: -122.280306}, {lat:  47.616147, lng: -122.280326}, {lat:  47.616, lng: -122.28044}, {lat:  47.615838, lng: -122.280435}, {lat:  47.615692, lng: -122.280406}, {lat:  47.615407, lng: -122.280517}, {lat:  47.615285, lng: -122.280573}, {lat:  47.615127, lng: -122.280831}, {lat:  47.614977, lng: -122.281041}, {lat:  47.614789, lng: -122.281179}, {lat:  47.614544, lng: -122.281266}, {lat:  47.614292, lng: -122.281284}, {lat:  47.613902, lng: -122.281116}, {lat:  47.613677, lng: -122.281057}, {lat:  47.613329, lng: -122.281045}, {lat:  47.61304, lng: -122.281087}, {lat:  47.612726, lng: -122.281128}, {lat:  47.612473, lng: -122.281171}, {lat:  47.612134, lng: -122.28116}, {lat:  47.612052, lng: -122.281363}, {lat:  47.611929, lng: -122.281475}, {lat:  47.611716, lng: -122.281687}, {lat:  47.611539, lng: -122.281887}, {lat:  47.611534, lng: -122.28189}, {lat:  47.611293, lng: -122.282059}, {lat:  47.611083, lng: -122.282103}, {lat:  47.610858, lng: -122.281993}, {lat:  47.610502, lng: -122.281929}, {lat:  47.610189, lng: -122.281919}, {lat:  47.609839, lng: -122.282011}, {lat:  47.609558, lng: -122.282155}, {lat:  47.609347, lng: -122.282278}, {lat:  47.609259, lng: -122.282352}, {lat:  47.609014, lng: -122.282446}, {lat:  47.608768, lng: -122.282593}, {lat:  47.608522, lng: -122.282739}, {lat:  47.608172, lng: -122.282821}, {lat:  47.60778, lng: -122.282873}, {lat:  47.607536, lng: -122.28293}, {lat:  47.607225, lng: -122.282985}, {lat:  47.606944, lng: -122.28303}, {lat:  47.606769, lng: -122.2831}, {lat:  47.606744, lng: -122.28311}, {lat:  47.606538, lng: -122.283082}, {lat:  47.606449, lng: -122.283112}, {lat:  47.606324, lng: -122.283129}, {lat:  47.606169, lng: -122.283124}, {lat:  47.60608, lng: -122.283121}, {lat:  47.606021, lng: -122.283152}, {lat:  47.60583, lng: -122.283124}, {lat:  47.60555, lng: -122.283115}, {lat:  47.605417, lng: -122.28311}, {lat:  47.605262, lng: -122.283105}, {lat:  47.604951, lng: -122.283204}, {lat:  47.604851, lng: -122.2832}, {lat:  47.604561, lng: -122.283191}, {lat:  47.604428, lng: -122.283186}, {lat:  47.604376, lng: -122.28325}, {lat:  47.604011, lng: -122.283455}, {lat:  47.603883, lng: -122.28355}, {lat:  47.603211, lng: -122.284052}, {lat:  47.60306, lng: -122.284156}, {lat:  47.602781, lng: -122.283928}, {lat:  47.60229, lng: -122.284141}, {lat:  47.602165, lng: -122.284318}, {lat:  47.602069, lng: -122.283931}, {lat:  47.602022, lng: -122.283937}, {lat:  47.601901, lng: -122.284009}, {lat:  47.601809, lng: -122.284063}, {lat:  47.601733, lng: -122.284107}, {lat:  47.601684, lng: -122.284137}, {lat:  47.60165, lng: -122.284153}, {lat:  47.601588, lng: -122.284181}, {lat:  47.601585, lng: -122.284182}, {lat:  47.601583, lng: -122.28425}, {lat:  47.601511, lng: -122.284838}, {lat:  47.601381, lng: -122.284935}, {lat:  47.601317, lng: -122.284949}, {lat:  47.60088, lng: -122.285086}, {lat:  47.60067, lng: -122.285119}, {lat:  47.60032, lng: -122.285257}, {lat:  47.6002, lng: -122.285308}, {lat:  47.599363, lng: -122.285662}, {lat:  47.598614, lng: -122.286149}, {lat:  47.598461, lng: -122.286447}, {lat:  47.597989, lng: -122.286357}, {lat:  47.59777, lng: -122.28641}, {lat:  47.597199, lng: -122.286338}, {lat:  47.596889, lng: -122.286396}, {lat:  47.596855, lng: -122.286363}, {lat:  47.596824, lng: -122.286377}, {lat:  47.596726, lng: -122.286423}, {lat:  47.596642, lng: -122.286461}, {lat:  47.59663, lng: -122.286463}, {lat:  47.596622, lng: -122.286624}, {lat:  47.596374, lng: -122.286624}, {lat:  47.596352, lng: -122.286501}, {lat:  47.596311, lng: -122.286506}, {lat:  47.596217, lng: -122.286519}, {lat:  47.596224, lng: -122.286687}, {lat:  47.596001, lng: -122.28671}, {lat:  47.595978, lng: -122.286551}, {lat:  47.595816, lng: -122.286573}, {lat:  47.595797, lng: -122.286576}, {lat:  47.595804, lng: -122.28681}, {lat:  47.59574, lng: -122.286819}, {lat:  47.594598, lng: -122.286984}, {lat:  47.593762, lng: -122.287122}, {lat:  47.593516, lng: -122.287244}, {lat:  47.593227, lng: -122.287361}, {lat:  47.592695, lng: -122.28724}, {lat:  47.59246, lng: -122.286961}, {lat:  47.592338, lng: -122.286912}, {lat:  47.591062, lng: -122.286395}, {lat:  47.590506, lng: -122.286023}, {lat:  47.589585, lng: -122.285514}, {lat:  47.589495, lng: -122.285488}, {lat:  47.589451, lng: -122.285475}, {lat:  47.588785, lng: -122.285514}, {lat:  47.587621, lng: -122.285761}, {lat:  47.586591, lng: -122.286119}, {lat:  47.586671, lng: -122.28675}, {lat:  47.586458, lng: -122.286835}, {lat:  47.586322, lng: -122.286866}, {lat:  47.586189, lng: -122.286921}, {lat:  47.586048, lng: -122.28702}, {lat:  47.585563, lng: -122.287444}, {lat:  47.585508, lng: -122.287487}, {lat:  47.585451, lng: -122.287532}, {lat:  47.585209, lng: -122.287673}, {lat:  47.585112, lng: -122.287724}, {lat:  47.585107, lng: -122.287727}, {lat:  47.585024, lng: -122.287772}, {lat:  47.584801, lng: -122.287865}, {lat:  47.584599, lng: -122.287902}, {lat:  47.584156, lng: -122.287912}, {lat:  47.583288, lng: -122.287897}, {lat:  47.583186, lng: -122.287868}, {lat:  47.583113, lng: -122.287834}, {lat:  47.583036, lng: -122.287777}, {lat:  47.58294, lng: -122.287639}, {lat:  47.58284, lng: -122.28778}, {lat:  47.582799, lng: -122.287805}, {lat:  47.582599, lng: -122.287824}, {lat:  47.582509, lng: -122.287832}, {lat:  47.582509, lng: -122.287833}, {lat:  47.582459, lng: -122.287837}, {lat:  47.582431, lng: -122.287839}, {lat:  47.582341, lng: -122.287846}, {lat:  47.582174, lng: -122.287859}, {lat:  47.582107, lng: -122.287868}, {lat:  47.581987, lng: -122.287884}, {lat:  47.581924, lng: -122.287892}, {lat:  47.581854, lng: -122.287899}, {lat:  47.58184, lng: -122.287903}, {lat:  47.581814, lng: -122.287909}, {lat:  47.580028, lng: -122.288183}, {lat:  47.579851, lng: -122.28821}, {lat:  47.57972, lng: -122.288162}, {lat:  47.579679, lng: -122.288147}, {lat:  47.57936, lng: -122.288029}, {lat:  47.578342, lng: -122.287923}, {lat:  47.578342, lng: -122.287925}, {lat:  47.578341, lng: -122.288304}, {lat:  47.578341, lng: -122.288499}, {lat:  47.57834, lng: -122.288727}, {lat:  47.578341, lng: -122.289229}, {lat:  47.578351, lng: -122.289785}, {lat:  47.578345, lng: -122.290869}, {lat:  47.579647, lng: -122.290863}, {lat:  47.579647, lng: -122.290865}, {lat:  47.580959, lng: -122.290871}, {lat:  47.580961, lng: -122.290871}, {lat:  47.580963, lng: -122.291474}, {lat:  47.580963, lng: -122.291925}, {lat:  47.580964, lng: -122.292999}, {lat:  47.580965, lng: -122.294152}, {lat:  47.58097, lng: -122.294294}, {lat:  47.580972, lng: -122.294325}, {lat:  47.580975, lng: -122.295138}, {lat:  47.58098, lng: -122.296442}, {lat:  47.581115, lng: -122.296442}, {lat:  47.582025, lng: -122.297464}, {lat:  47.58153, lng: -122.297152}, {lat:  47.581265, lng: -122.296992}, {lat:  47.581018, lng: -122.297712}, {lat:  47.580979, lng: -122.297928}, {lat:  47.580986, lng: -122.299078}, {lat:  47.580993, lng: -122.300166}, {lat:  47.580994, lng: -122.300167}, {lat:  47.581242, lng: -122.300356}, {lat:  47.582507, lng: -122.301322}, {lat:  47.582591, lng: -122.301386}, {lat:  47.582597, lng: -122.301391}, {lat:  47.582763, lng: -122.301518}, {lat:  47.583145, lng: -122.30181}, {lat:  47.583656, lng: -122.302199}, {lat:  47.584457, lng: -122.302842}, {lat:  47.584507, lng: -122.302882}, {lat:  47.584542, lng: -122.30291}, {lat:  47.584547, lng: -122.302913}, {lat:  47.585494, lng: -122.302934}, {lat:  47.586324, lng: -122.302926}, {lat:  47.586328, lng: -122.304241}, {lat:  47.586333, lng: -122.305536}, {lat:  47.586337, lng: -122.306841}, {lat:  47.586342, lng: -122.308146}, {lat:  47.586347, lng: -122.30945}, {lat:  47.587746, lng: -122.309465}, {lat:  47.588426, lng: -122.309469}, {lat:  47.589083, lng: -122.309477}, {lat:  47.589393, lng: -122.309475}, {lat:  47.589468, lng: -122.309473}, {lat:  47.589571, lng: -122.309425}, {lat:  47.59001, lng: -122.309858}, {lat:  47.590373, lng: -122.310217}, {lat:  47.590831, lng: -122.310494}, {lat:  47.590855, lng: -122.310528}, {lat:  47.590856, lng: -122.310529}, {lat:  47.591016, lng: -122.310526}, {lat:  47.591463, lng: -122.311128}, {lat:  47.591718, lng: -122.31133}, {lat:  47.592113, lng: -122.311633}, {lat:  47.592579, lng: -122.311996}, {lat:  47.593445, lng: -122.31266}, {lat:  47.593727, lng: -122.312878}, {lat:  47.593731, lng: -122.312881}, {lat:  47.593927, lng: -122.313061}, {lat:  47.594059, lng: -122.313225}, {lat:  47.594188, lng: -122.313415}, {lat:  47.59429, lng: -122.3136}, {lat:  47.594311, lng: -122.313637}, {lat:  47.594432, lng: -122.313908}, {lat:  47.594561, lng: -122.314228}, {lat:  47.594674, lng: -122.314552}, {lat:  47.594743, lng: -122.314833}, {lat:  47.59478, lng: -122.315015}, {lat:  47.594816, lng: -122.315222}, {lat:  47.594838, lng: -122.315422}, {lat:  47.594852, lng: -122.315605}, {lat:  47.59486, lng: -122.315793}, {lat:  47.594864, lng: -122.315933}, {lat:  47.594864, lng: -122.316103}, {lat:  47.594849, lng: -122.316326}, {lat:  47.594826, lng: -122.316528}, {lat:  47.594787, lng: -122.316748}, {lat:  47.594739, lng: -122.316971}, {lat:  47.594699, lng: -122.317129}, {lat:  47.594699, lng: -122.317131}, {lat:  47.59466, lng: -122.31728}, {lat:  47.594706, lng: -122.317279}, {lat:  47.594882, lng: -122.317275}, {lat:  47.595045, lng: -122.317272}, {lat:  47.595197, lng: -122.317269}, {lat:  47.595674, lng: -122.317259}, {lat:  47.59582, lng: -122.317255}, {lat:  47.596605, lng: -122.317233}, {lat:  47.596659, lng: -122.317232}, {lat:  47.5975, lng: -122.317227}, {lat:  47.598338, lng: -122.317228}, {lat:  47.599189, lng: -122.317223}, {lat:  47.599189, lng: -122.317194}, {lat:  47.600017, lng: -122.317191}, {lat:  47.600107, lng: -122.317191}, {lat:  47.600115, lng: -122.317191}, {lat:  47.600124, lng: -122.317191}, {lat:  47.600126, lng: -122.317191}, {lat:  47.600129, lng: -122.317191}, {lat:  47.600132, lng: -122.317191}, {lat:  47.600135, lng: -122.317191}, {lat:  47.600137, lng: -122.31719}, {lat:  47.60014, lng: -122.31719}, {lat:  47.600143, lng: -122.31719}, {lat:  47.600146, lng: -122.31719}, {lat:  47.600148, lng: -122.31719}, {lat:  47.600151, lng: -122.31719}, {lat:  47.600154, lng: -122.31719}, {lat:  47.600157, lng: -122.31719}, {lat:  47.600159, lng: -122.31719}, {lat:  47.600162, lng: -122.31719}, {lat:  47.600165, lng: -122.31719}, {lat:  47.600168, lng: -122.317189}, {lat:  47.60017, lng: -122.317189}, {lat:  47.600173, lng: -122.317189}, {lat:  47.600176, lng: -122.317189}, {lat:  47.600178, lng: -122.317189}, {lat:  47.600181, lng: -122.317189}, {lat:  47.600184, lng: -122.317189}, {lat:  47.600187, lng: -122.317189}, {lat:  47.600189, lng: -122.317188}, {lat:  47.600192, lng: -122.317188}, {lat:  47.600195, lng: -122.317188}, {lat:  47.600198, lng: -122.317188}, {lat:  47.6002, lng: -122.317188}, {lat:  47.600203, lng: -122.317188}, {lat:  47.600206, lng: -122.317187}, {lat:  47.600209, lng: -122.317187}, {lat:  47.600211, lng: -122.317187}, {lat:  47.600214, lng: -122.317187}, {lat:  47.600217, lng: -122.317187}, {lat:  47.60022, lng: -122.317186}, {lat:  47.600222, lng: -122.317186}, {lat:  47.600225, lng: -122.317186}, {lat:  47.600228, lng: -122.317186}, {lat:  47.600231, lng: -122.317185}, {lat:  47.600233, lng: -122.317185}, {lat:  47.600236, lng: -122.317185}, {lat:  47.600239, lng: -122.317185}, {lat:  47.600241, lng: -122.317184}, {lat:  47.600244, lng: -122.317184}, {lat:  47.600247, lng: -122.317184}, {lat:  47.60025, lng: -122.317184}, {lat:  47.600252, lng: -122.317183}, {lat:  47.600255, lng: -122.317183}, {lat:  47.600258, lng: -122.317183}, {lat:  47.600261, lng: -122.317182}, {lat:  47.600263, lng: -122.317182}, {lat:  47.600266, lng: -122.317182}, {lat:  47.600269, lng: -122.317182}, {lat:  47.600272, lng: -122.317181}, {lat:  47.600274, lng: -122.317181}, {lat:  47.600277, lng: -122.317181}, {lat:  47.60028, lng: -122.31718}, {lat:  47.600282, lng: -122.31718}, {lat:  47.600285, lng: -122.31718}, {lat:  47.600288, lng: -122.317179}, {lat:  47.600291, lng: -122.317179}, {lat:  47.600293, lng: -122.317179}, {lat:  47.600296, lng: -122.317178}, {lat:  47.600299, lng: -122.317178}, {lat:  47.600302, lng: -122.317178}, {lat:  47.600304, lng: -122.317177}, {lat:  47.600307, lng: -122.317177}, {lat:  47.600309, lng: -122.317176}, {lat:  47.60031, lng: -122.317176}, {lat:  47.600313, lng: -122.317176}, {lat:  47.600315, lng: -122.317176}, {lat:  47.600318, lng: -122.317175}, {lat:  47.600321, lng: -122.317175}, {lat:  47.600323, lng: -122.317174}, {lat:  47.600326, lng: -122.317174}, {lat:  47.600329, lng: -122.317174}, {lat:  47.600332, lng: -122.317173}, {lat:  47.600334, lng: -122.317173}, {lat:  47.600337, lng: -122.317172}, {lat:  47.60034, lng: -122.317172}, {lat:  47.600343, lng: -122.317171}, {lat:  47.600345, lng: -122.317171}, {lat:  47.600348, lng: -122.317171}, {lat:  47.600351, lng: -122.31717}, {lat:  47.600353, lng: -122.31717}, {lat:  47.600356, lng: -122.317169}, {lat:  47.600359, lng: -122.317169}, {lat:  47.600362, lng: -122.317168}, {lat:  47.600364, lng: -122.317168}, {lat:  47.600367, lng: -122.317167}, {lat:  47.60037, lng: -122.317167}, {lat:  47.600372, lng: -122.317166}, {lat:  47.600375, lng: -122.317166}, {lat:  47.600378, lng: -122.317165}, {lat:  47.600381, lng: -122.317165}, {lat:  47.600383, lng: -122.317164}, {lat:  47.600386, lng: -122.317164}, {lat:  47.600389, lng: -122.317163}, {lat:  47.600391, lng: -122.317163}, {lat:  47.600394, lng: -122.317162}, {lat:  47.600397, lng: -122.317162}, {lat:  47.6004, lng: -122.317161}, {lat:  47.600402, lng: -122.317161}, {lat:  47.600405, lng: -122.31716}, {lat:  47.600408, lng: -122.317159}, {lat:  47.600411, lng: -122.317159}, {lat:  47.600413, lng: -122.317158}, {lat:  47.600416, lng: -122.317158}, {lat:  47.600419, lng: -122.317157}, {lat:  47.600421, lng: -122.317157}, {lat:  47.600424, lng: -122.317156}, {lat:  47.600427, lng: -122.317155}, {lat:  47.600429, lng: -122.317155}, {lat:  47.600432, lng: -122.317154}, {lat:  47.600435, lng: -122.317154}, {lat:  47.600438, lng: -122.317153}, {lat:  47.60044, lng: -122.317152}, {lat:  47.600443, lng: -122.317152}, {lat:  47.600446, lng: -122.317151}, {lat:  47.600448, lng: -122.31715}, {lat:  47.600451, lng: -122.31715}, {lat:  47.600454, lng: -122.317149}, {lat:  47.600457, lng: -122.317148}, {lat:  47.600459, lng: -122.317148}, {lat:  47.600462, lng: -122.317147}, {lat:  47.600465, lng: -122.317146}, {lat:  47.600467, lng: -122.317146}, {lat:  47.60047, lng: -122.317145}, {lat:  47.600473, lng: -122.317144}, {lat:  47.600476, lng: -122.317144}, {lat:  47.600478, lng: -122.317143}, {lat:  47.600481, lng: -122.317142}, {lat:  47.600484, lng: -122.317142}, {lat:  47.600486, lng: -122.317141}, {lat:  47.600489, lng: -122.31714}, {lat:  47.600492, lng: -122.31714}, {lat:  47.600494, lng: -122.317139}, {lat:  47.600497, lng: -122.317138}, {lat:  47.6005, lng: -122.317137}, {lat:  47.600502, lng: -122.317137}, {lat:  47.600505, lng: -122.317136}, {lat:  47.600508, lng: -122.317135}, {lat:  47.600511, lng: -122.317134}, {lat:  47.600513, lng: -122.317134}, {lat:  47.600516, lng: -122.317133}, {lat:  47.600519, lng: -122.317132}, {lat:  47.600521, lng: -122.317131}, {lat:  47.600524, lng: -122.317131}, {lat:  47.600527, lng: -122.31713}, {lat:  47.600529, lng: -122.317129}, {lat:  47.600532, lng: -122.317128}, {lat:  47.600535, lng: -122.317127}, {lat:  47.600537, lng: -122.317127}, {lat:  47.60054, lng: -122.317126}, {lat:  47.600543, lng: -122.317125}, {lat:  47.600546, lng: -122.317124}, {lat:  47.600548, lng: -122.317123}, {lat:  47.600551, lng: -122.317123}, {lat:  47.600554, lng: -122.317122}, {lat:  47.600556, lng: -122.317121}, {lat:  47.600559, lng: -122.31712}, {lat:  47.600562, lng: -122.317119}, {lat:  47.600564, lng: -122.317118}, {lat:  47.600567, lng: -122.317117}, {lat:  47.60057, lng: -122.317117}, {lat:  47.600572, lng: -122.317116}, {lat:  47.600575, lng: -122.317115}, {lat:  47.600578, lng: -122.317114}, {lat:  47.60058, lng: -122.317113}, {lat:  47.600583, lng: -122.317112}, {lat:  47.600586, lng: -122.317111}, {lat:  47.600588, lng: -122.31711}, {lat:  47.600591, lng: -122.31711}, {lat:  47.600594, lng: -122.317109}, {lat:  47.600596, lng: -122.317108}, {lat:  47.600599, lng: -122.317107}, {lat:  47.600602, lng: -122.317106}, {lat:  47.600604, lng: -122.317105}, {lat:  47.600607, lng: -122.317104}, {lat:  47.60061, lng: -122.317103}, {lat:  47.600612, lng: -122.317102}, {lat:  47.600615, lng: -122.317101}, {lat:  47.600618, lng: -122.3171}, {lat:  47.60062, lng: -122.317099}, {lat:  47.600623, lng: -122.317098}, {lat:  47.600626, lng: -122.317097}, {lat:  47.600628, lng: -122.317096}, {lat:  47.600631, lng: -122.317095}, {lat:  47.600634, lng: -122.317094}, {lat:  47.600636, lng: -122.317093}, {lat:  47.600639, lng: -122.317092}, {lat:  47.600642, lng: -122.317091}, {lat:  47.600644, lng: -122.31709}, {lat:  47.600647, lng: -122.317089}, {lat:  47.60065, lng: -122.317088}, {lat:  47.600652, lng: -122.317087}, {lat:  47.600655, lng: -122.317086}, {lat:  47.600658, lng: -122.317085}, {lat:  47.60066, lng: -122.317084}, {lat:  47.600663, lng: -122.317083}, {lat:  47.600666, lng: -122.317082}, {lat:  47.600669, lng: -122.317081}, {lat:  47.600671, lng: -122.31708}, {lat:  47.600674, lng: -122.317079}, {lat:  47.600676, lng: -122.317078}, {lat:  47.600679, lng: -122.317077}, {lat:  47.600682, lng: -122.317076}, {lat:  47.600684, lng: -122.317075}, {lat:  47.600687, lng: -122.317074}, {lat:  47.60069, lng: -122.317073}, {lat:  47.600692, lng: -122.317072}, {lat:  47.600695, lng: -122.31707}, {lat:  47.600698, lng: -122.317069}, {lat:  47.6007, lng: -122.317068}, {lat:  47.600703, lng: -122.317067}, {lat:  47.600706, lng: -122.317066}, {lat:  47.600708, lng: -122.317065}, {lat:  47.600711, lng: -122.317064}, {lat:  47.600713, lng: -122.317063}, {lat:  47.600716, lng: -122.317062}, {lat:  47.600719, lng: -122.31706}, {lat:  47.600721, lng: -122.317059}, {lat:  47.600724, lng: -122.317058}, {lat:  47.600727, lng: -122.317057}, {lat:  47.600729, lng: -122.317056}, {lat:  47.600732, lng: -122.317055}, {lat:  47.600734, lng: -122.317054}, {lat:  47.600737, lng: -122.317052}, {lat:  47.60074, lng: -122.317051}, {lat:  47.600742, lng: -122.31705}, {lat:  47.600745, lng: -122.317049}, {lat:  47.600748, lng: -122.317048}, {lat:  47.60075, lng: -122.317046}, {lat:  47.600753, lng: -122.317045}, {lat:  47.600755, lng: -122.317044}, {lat:  47.600758, lng: -122.317043}, {lat:  47.600761, lng: -122.317042}, {lat:  47.600763, lng: -122.31704}, {lat:  47.600766, lng: -122.317039}, {lat:  47.600771, lng: -122.317037}, {lat:  47.600773, lng: -122.317036}, {lat:  47.600776, lng: -122.317034}, {lat:  47.600779, lng: -122.317033}, {lat:  47.600781, lng: -122.317032}, {lat:  47.600784, lng: -122.317031}, {lat:  47.600786, lng: -122.317029}, {lat:  47.600789, lng: -122.317028}, {lat:  47.600792, lng: -122.317027}, {lat:  47.600794, lng: -122.317026}, {lat:  47.600797, lng: -122.317024}, {lat:  47.600799, lng: -122.317023}, {lat:  47.600802, lng: -122.317022}, {lat:  47.600805, lng: -122.31702}, {lat:  47.600807, lng: -122.317019}, {lat:  47.60081, lng: -122.317018}, {lat:  47.600812, lng: -122.317017}, {lat:  47.600815, lng: -122.317015}, {lat:  47.600818, lng: -122.317014}, {lat:  47.60082, lng: -122.317013}, {lat:  47.600823, lng: -122.317011}, {lat:  47.600825, lng: -122.31701}, {lat:  47.600828, lng: -122.317009}, {lat:  47.60083, lng: -122.317007}, {lat:  47.600833, lng: -122.317006}, {lat:  47.600836, lng: -122.317005}, {lat:  47.600838, lng: -122.317003}, {lat:  47.600841, lng: -122.317002}, {lat:  47.600843, lng: -122.317}, {lat:  47.600846, lng: -122.316999}, {lat:  47.600849, lng: -122.316998}, {lat:  47.600851, lng: -122.316996}, {lat:  47.600854, lng: -122.316995}, {lat:  47.600856, lng: -122.316994}, {lat:  47.600859, lng: -122.316992}, {lat:  47.600862, lng: -122.316991}, {lat:  47.600864, lng: -122.316989}, {lat:  47.600867, lng: -122.316988}, {lat:  47.600869, lng: -122.316987}, {lat:  47.600871, lng: -122.316985}, {lat:  47.600874, lng: -122.316984}, {lat:  47.600879, lng: -122.316981}, {lat:  47.600881, lng: -122.31698}, {lat:  47.600884, lng: -122.316978}, {lat:  47.600886, lng: -122.316977}, {lat:  47.600889, lng: -122.316976}, {lat:  47.600892, lng: -122.316974}, {lat:  47.600894, lng: -122.316973}, {lat:  47.600897, lng: -122.316972}, {lat:  47.600899, lng: -122.31697}, {lat:  47.600902, lng: -122.316969}, {lat:  47.600905, lng: -122.316968}, {lat:  47.600907, lng: -122.316966}, {lat:  47.60091, lng: -122.316965}, {lat:  47.600912, lng: -122.316963}, {lat:  47.600915, lng: -122.316962}, {lat:  47.600917, lng: -122.316961}, {lat:  47.60092, lng: -122.316959}, {lat:  47.600923, lng: -122.316958}, {lat:  47.600925, lng: -122.316957}, {lat:  47.600928, lng: -122.316956}, {lat:  47.60093, lng: -122.316954}, {lat:  47.600933, lng: -122.316953}, {lat:  47.600936, lng: -122.316952}, {lat:  47.600938, lng: -122.31695}, {lat:  47.600941, lng: -122.316949}, {lat:  47.600943, lng: -122.316948}, {lat:  47.600947, lng: -122.316946}, {lat:  47.600947, lng: -122.316946}, {lat:  47.600949, lng: -122.316945}, {lat:  47.600952, lng: -122.316944}, {lat:  47.600954, lng: -122.316942}, {lat:  47.600957, lng: -122.316941}, {lat:  47.60096, lng: -122.31694}, {lat:  47.600962, lng: -122.316939}, {lat:  47.600965, lng: -122.316937}, {lat:  47.600967, lng: -122.316936}, {lat:  47.60097, lng: -122.316935}, {lat:  47.600973, lng: -122.316934}, {lat:  47.600975, lng: -122.316932}, {lat:  47.600978, lng: -122.316931}, {lat:  47.600981, lng: -122.31693}, {lat:  47.600983, lng: -122.316929}, {lat:  47.600986, lng: -122.316928}, {lat:  47.600988, lng: -122.316926}, {lat:  47.600991, lng: -122.316925}, {lat:  47.600994, lng: -122.316924}, {lat:  47.600997, lng: -122.316923}, {lat:  47.600999, lng: -122.316922}, {lat:  47.601002, lng: -122.31692}, {lat:  47.601004, lng: -122.316919}, {lat:  47.601007, lng: -122.316918}, {lat:  47.60101, lng: -122.316917}, {lat:  47.601012, lng: -122.316916}, {lat:  47.601015, lng: -122.316915}, {lat:  47.601018, lng: -122.316913}, {lat:  47.60102, lng: -122.316912}, {lat:  47.601023, lng: -122.316911}, {lat:  47.601025, lng: -122.31691}, {lat:  47.601028, lng: -122.316909}, {lat:  47.601031, lng: -122.316908}, {lat:  47.601033, lng: -122.316907}, {lat:  47.601036, lng: -122.316906}, {lat:  47.601039, lng: -122.316904}, {lat:  47.601041, lng: -122.316903}, {lat:  47.601044, lng: -122.316902}, {lat:  47.601047, lng: -122.316901}, {lat:  47.601049, lng: -122.3169}, {lat:  47.601052, lng: -122.316899}, {lat:  47.601054, lng: -122.316898}, {lat:  47.601057, lng: -122.316897}, {lat:  47.60106, lng: -122.316896}, {lat:  47.601062, lng: -122.316895}, {lat:  47.601065, lng: -122.316894}, {lat:  47.601068, lng: -122.316893}, {lat:  47.60107, lng: -122.316892}, {lat:  47.601073, lng: -122.316891}, {lat:  47.601076, lng: -122.316889}, {lat:  47.601078, lng: -122.316888}, {lat:  47.601081, lng: -122.316887}, {lat:  47.601084, lng: -122.316886}, {lat:  47.601086, lng: -122.316885}, {lat:  47.601089, lng: -122.316884}, {lat:  47.601092, lng: -122.316883}, {lat:  47.601094, lng: -122.316882}, {lat:  47.601097, lng: -122.316881}, {lat:  47.6011, lng: -122.31688}, {lat:  47.601102, lng: -122.316879}, {lat:  47.601105, lng: -122.316878}, {lat:  47.601108, lng: -122.316877}, {lat:  47.60111, lng: -122.316876}, {lat:  47.601113, lng: -122.316875}, {lat:  47.601116, lng: -122.316874}, {lat:  47.601118, lng: -122.316874}, {lat:  47.601121, lng: -122.316873}, {lat:  47.601124, lng: -122.316872}, {lat:  47.601126, lng: -122.316871}, {lat:  47.601129, lng: -122.31687}, {lat:  47.601132, lng: -122.316869}, {lat:  47.601134, lng: -122.316868}, {lat:  47.601137, lng: -122.316867}, {lat:  47.60114, lng: -122.316866}, {lat:  47.601142, lng: -122.316865}, {lat:  47.601145, lng: -122.316864}, {lat:  47.601148, lng: -122.316863}, {lat:  47.60115, lng: -122.316862}, {lat:  47.601153, lng: -122.316862}, {lat:  47.601156, lng: -122.316861}, {lat:  47.601158, lng: -122.31686}, {lat:  47.601161, lng: -122.316859}, {lat:  47.601164, lng: -122.316858}, {lat:  47.601166, lng: -122.316857}, {lat:  47.601169, lng: -122.316856}, {lat:  47.601172, lng: -122.316855}, {lat:  47.601174, lng: -122.316855}, {lat:  47.601177, lng: -122.316854}, {lat:  47.60118, lng: -122.316853}, {lat:  47.601182, lng: -122.316852}, {lat:  47.601185, lng: -122.316851}, {lat:  47.601188, lng: -122.31685}, {lat:  47.60119, lng: -122.31685}, {lat:  47.601193, lng: -122.316849}, {lat:  47.601196, lng: -122.316848}, {lat:  47.601198, lng: -122.316847}, {lat:  47.601201, lng: -122.316846}, {lat:  47.601204, lng: -122.316845}, {lat:  47.601207, lng: -122.316845}, {lat:  47.601209, lng: -122.316844}, {lat:  47.601212, lng: -122.316843}, {lat:  47.601215, lng: -122.316842}, {lat:  47.601217, lng: -122.316842}, {lat:  47.60122, lng: -122.316841}, {lat:  47.601223, lng: -122.31684}, {lat:  47.601225, lng: -122.316839}, {lat:  47.601446, lng: -122.316782}, {lat:  47.601693, lng: -122.316782}, {lat:  47.601695, lng: -122.317823}, {lat:  47.601696, lng: -122.318098}, {lat:  47.601698, lng: -122.319403}, {lat:  47.601698, lng: -122.319575}, {lat:  47.6017, lng: -122.320737}, {lat:  47.601704, lng: -122.322447}, {lat:  47.601704, lng: -122.322459}, {lat:  47.601704, lng: -122.322616}, {lat:  47.601705, lng: -122.323486}, {lat:  47.601705, lng: -122.323501}, {lat:  47.601705, lng: -122.323555}, {lat:  47.601705, lng: -122.323581}, {lat:  47.601706, lng: -122.323741}, {lat:  47.601706, lng: -122.323796}, {lat:  47.601706, lng: -122.323796}, {lat:  47.601706, lng: -122.324284}, {lat:  47.601707, lng: -122.3243}, {lat:  47.601707, lng: -122.324374}, {lat:  47.601709, lng: -122.324952}, {lat:  47.601708, lng: -122.325048}, {lat:  47.601708, lng: -122.32528}, {lat:  47.601709, lng: -122.325833}, {lat:  47.60171, lng: -122.326331}, {lat:  47.60171, lng: -122.326351}, {lat:  47.60171, lng: -122.326452}, {lat:  47.60171, lng: -122.326566}, {lat:  47.60171, lng: -122.326576}, {lat:  47.601711, lng: -122.326868}, {lat:  47.601711, lng: -122.326878}, {lat:  47.601712, lng: -122.32737}, {lat:  47.601712, lng: -122.327656}, {lat:  47.601712, lng: -122.327658}, {lat:  47.601715, lng: -122.327658}, {lat:  47.60177, lng: -122.327658}, {lat:  47.601904, lng: -122.32767}, {lat:  47.602026, lng: -122.327697}, {lat:  47.602091, lng: -122.327732}, {lat:  47.602271, lng: -122.327885}, {lat:  47.602983, lng: -122.328536}, {lat:  47.603696, lng: -122.329189}, {lat:  47.603697, lng: -122.329189}, {lat:  47.604411, lng: -122.329843}, {lat:  47.604797, lng: -122.330198}, {lat:  47.604961, lng: -122.330346}, {lat:  47.605124, lng: -122.330495}, {lat:  47.605837, lng: -122.331148}, {lat:  47.6063, lng: -122.330041}, {lat:  47.607015, lng: -122.330691}, {lat:  47.607063, lng: -122.330576}, {lat:  47.607131, lng: -122.330414}, {lat:  47.607198, lng: -122.330253}, {lat:  47.607209, lng: -122.330228}, {lat:  47.607106, lng: -122.33014}, {lat:  47.607106, lng: -122.33014}, {lat:  47.606483, lng: -122.329607}, {lat:  47.606483, lng: -122.329607}, {lat:  47.606672, lng: -122.329154}, {lat:  47.606713, lng: -122.329057}, {lat:  47.60674, lng: -122.328993}, {lat:  47.606766, lng: -122.328929}, {lat:  47.60716, lng: -122.327989}, {lat:  47.607231, lng: -122.327818}, {lat:  47.607694, lng: -122.32671}, {lat:  47.607695, lng: -122.326708}, {lat:  47.608051, lng: -122.327034}, {lat:  47.608409, lng: -122.327361}, {lat:  47.609122, lng: -122.328013}, {lat:  47.609836, lng: -122.328666}, {lat:  47.610465, lng: -122.329241}, {lat:  47.610494, lng: -122.329255}, {lat:  47.610557, lng: -122.329246}, {lat:  47.610573, lng: -122.329232}, {lat:  47.610591, lng: -122.329215}, {lat:  47.611012, lng: -122.32821}, {lat:  47.611013, lng: -122.328207}, {lat:  47.611266, lng: -122.327602}, {lat:  47.611477, lng: -122.327099}, {lat:  47.611478, lng: -122.327096}, {lat:  47.611479, lng: -122.327097}, {lat:  47.611942, lng: -122.325989}, {lat:  47.611943, lng: -122.325987}, {lat:  47.612048, lng: -122.326083}, {lat:  47.612937, lng: -122.326896}, {lat:  47.612949, lng: -122.326907}, {lat:  47.612987, lng: -122.326942}, {lat:  47.613041, lng: -122.326991}, {lat:  47.613055, lng: -122.327003}, {lat:  47.61393, lng: -122.327805}, {lat:  47.614054, lng: -122.327918}, {lat:  47.614784, lng: -122.328586}, {lat:  47.614857, lng: -122.328653}, {lat:  47.614879, lng: -122.328673}, {lat:  47.614921, lng: -122.328712}, {lat:  47.614956, lng: -122.328744}, {lat:  47.615423, lng: -122.329171}, {lat:  47.615486, lng: -122.329229}, {lat:  47.615663, lng: -122.329391}, {lat:  47.615667, lng: -122.329394}, {lat:  47.61589, lng: -122.32931}, {lat:  47.61607, lng: -122.329248}, {lat:  47.616157, lng: -122.329217}, {lat:  47.616425, lng: -122.329131}, {lat:  47.616694, lng: -122.329052}, {lat:  47.616964, lng: -122.328979}, {lat:  47.617313, lng: -122.328896}, {lat:  47.617813, lng: -122.328798}, {lat:  47.618051, lng: -122.328759}, {lat:  47.618324, lng: -122.328722}, {lat:  47.618469, lng: -122.328706}, {lat:  47.618499, lng: -122.328702}, {lat:  47.618598, lng: -122.328691}, {lat:  47.618871, lng: -122.328668}, {lat:  47.619145, lng: -122.328652}, {lat:  47.61942, lng: -122.328643}, {lat:  47.619698, lng: -122.328641}, {lat:  47.619967, lng: -122.328642}, {lat:  47.620305, lng: -122.328644}, {lat:  47.620825, lng: -122.328647}, {lat:  47.620825, lng: -122.328647}, {lat:  47.621969, lng: -122.328654}, {lat:  47.623128, lng: -122.32866}, {lat:  47.62427, lng: -122.328666}, {lat:  47.625065, lng: -122.32867}, {lat:  47.625119, lng: -122.328671}, {lat:  47.625122, lng: -122.328671}, {lat:  47.625371, lng: -122.328672}, {lat:  47.625368, lng: -122.328677}, {lat:  47.625153, lng: -122.329035}, {lat:  47.625203, lng: -122.329153}, {lat:  47.625225, lng: -122.329227}, {lat:  47.625316, lng: -122.329536}, {lat:  47.62538, lng: -122.329788}, {lat:  47.625425, lng: -122.330021}, {lat:  47.625447, lng: -122.33019}, {lat:  47.62545, lng: -122.330453}, {lat:  47.625435, lng: -122.330656}, {lat:  47.625368, lng: -122.331132}, {lat:  47.625229, lng: -122.331903}, {lat:  47.625116, lng: -122.332332}, {lat:  47.624956, lng: -122.332943}, {lat:  47.624907, lng: -122.333129}, {lat:  47.624791, lng: -122.33349}, {lat:  47.624684, lng: -122.333948}, {lat:  47.624663, lng: -122.334063}, {lat:  47.624616, lng: -122.334185}, {lat:  47.624564, lng: -122.334287}, {lat:  47.625067, lng: -122.33429}, {lat:  47.625121, lng: -122.33429}, {lat:  47.625122, lng: -122.33429}, {lat:  47.625779, lng: -122.334293}, {lat:  47.625779, lng: -122.334321}, {lat:  47.62578, lng: -122.334451}, {lat:  47.625861, lng: -122.334539}, {lat:  47.625815, lng: -122.334656}, {lat:  47.625781, lng: -122.334768}, {lat:  47.625782, lng: -122.334989}, {lat:  47.625785, lng: -122.335817}, {lat:  47.62579, lng: -122.337122}, {lat:  47.625795, lng: -122.338426}, {lat:  47.625795, lng: -122.338546}, {lat:  47.625882, lng: -122.338487}, {lat:  47.626014, lng: -122.33843}, {lat:  47.626148, lng: -122.338305}, {lat:  47.626184, lng: -122.338271}, {lat:  47.62619, lng: -122.338265}, {lat:  47.626205, lng: -122.338252}, {lat:  47.626094, lng: -122.338083}, {lat:  47.626779, lng: -122.338037}, {lat:  47.627176, lng: -122.338081}, {lat:  47.627265, lng: -122.33808}, {lat:  47.627284, lng: -122.33808}, {lat:  47.627855, lng: -122.338042}, {lat:  47.627895, lng: -122.337245}, {lat:  47.628009, lng: -122.337221}, {lat:  47.627997, lng: -122.336222}, {lat:  47.627236, lng: -122.336196}, {lat:  47.627214, lng: -122.336364}, {lat:  47.626767, lng: -122.336419}, {lat:  47.626712, lng: -122.336234}, {lat:  47.626314, lng: -122.336192}, {lat:  47.626278, lng: -122.336064}, {lat:  47.626574, lng: -122.335385}, {lat:  47.6267, lng: -122.335207}, {lat:  47.626816, lng: -122.335098}, {lat:  47.626819, lng: -122.334901}, {lat:  47.626862, lng: -122.334565}, {lat:  47.626979, lng: -122.334372}, {lat:  47.627096, lng: -122.334235}, {lat:  47.627373, lng: -122.334161}, {lat:  47.627582, lng: -122.334139}, {lat:  47.627686, lng: -122.334171}, {lat:  47.627953, lng: -122.334139}, {lat:  47.628077, lng: -122.334143}, {lat:  47.628143, lng: -122.334116}, {lat:  47.628448, lng: -122.333737}, {lat:  47.628464, lng: -122.333692}, {lat:  47.62838, lng: -122.333618}, {lat:  47.628314, lng: -122.333574}, {lat:  47.62821, lng: -122.333542}, {lat:  47.628078, lng: -122.333425}, {lat:  47.628043, lng: -122.333283}, {lat:  47.628046, lng: -122.3331}, {lat:  47.628019, lng: -122.332987}, {lat:  47.628002, lng: -122.332818}, {lat:  47.627774, lng: -122.332796}, {lat:  47.628156, lng: -122.332067}, {lat:  47.629198, lng: -122.331997}, {lat:  47.629327, lng: -122.331939}, {lat:  47.629416, lng: -122.331731}, {lat:  47.629432, lng: -122.331626}, {lat:  47.629379, lng: -122.33135}, {lat:  47.62944, lng: -122.331099}, {lat:  47.629696, lng: -122.331087}, {lat:  47.629756, lng: -122.330962}, {lat:  47.629788, lng: -122.330731}, {lat:  47.630078, lng: -122.330383}, {lat:  47.630425, lng: -122.330058}, {lat:  47.630599, lng: -122.329895}, {lat:  47.630774, lng: -122.329606}, {lat:  47.631004, lng: -122.329487}, {lat:  47.631092, lng: -122.329364}, {lat:  47.631012, lng: -122.328982}, {lat:  47.630791, lng: -122.328531}, {lat:  47.631637, lng: -122.327337}, {lat:  47.632196, lng: -122.327203}, {lat:  47.632252, lng: -122.32719}, {lat:  47.632257, lng: -122.327189}, {lat:  47.632257, lng: -122.327041}, {lat:  47.632256, lng: -122.326964}, {lat:  47.632256, lng: -122.326927}, {lat:  47.632256, lng: -122.326761}, {lat:  47.632256, lng: -122.326705}, {lat:  47.632256, lng: -122.326207}, {lat:  47.632255, lng: -122.326071}, {lat:  47.632255, lng: -122.325087}, {lat:  47.632255, lng: -122.325075}, {lat:  47.632255, lng: -122.324957}, {lat:  47.632255, lng: -122.324934}, {lat:  47.632255, lng: -122.324796}, {lat:  47.632255, lng: -122.324409}, {lat:  47.632258, lng: -122.324408}, {lat:  47.632265, lng: -122.324403}, {lat:  47.632299, lng: -122.324382}, {lat:  47.63231, lng: -122.324376}, {lat:  47.632384, lng: -122.324332}, {lat:  47.632461, lng: -122.324289}, {lat:  47.632469, lng: -122.324284}, {lat:  47.632555, lng: -122.324238}, {lat:  47.632677, lng: -122.324177}, {lat:  47.632729, lng: -122.324152}, {lat:  47.632774, lng: -122.324133}, {lat:  47.632934, lng: -122.324067}, {lat:  47.633115, lng: -122.323994}, {lat:  47.633859, lng: -122.323691}, {lat:  47.6344, lng: -122.323471}, {lat:  47.634829, lng: -122.323334}, {lat:  47.634868, lng: -122.323321}, {lat:  47.634951, lng: -122.323295}, {lat:  47.634986, lng: -122.323284}, {lat:  47.635152, lng: -122.32323}, {lat:  47.63521, lng: -122.323216}, {lat:  47.635352, lng: -122.323178}, {lat:  47.635569, lng: -122.323128}, {lat:  47.635786, lng: -122.323083}, {lat:  47.635893, lng: -122.323063}, {lat:  47.635893, lng: -122.323069}, {lat:  47.636063, lng: -122.323037}, {lat:  47.6364, lng: -122.322993}, {lat:  47.636445, lng: -122.322987}, {lat:  47.636632, lng: -122.322963}, {lat:  47.636975, lng: -122.322936}, {lat:  47.637014, lng: -122.322935}, {lat:  47.63833, lng: -122.322904}, {lat:  47.639539, lng: -122.322877}, {lat:  47.639718, lng: -122.322873}, {lat:  47.640431, lng: -122.322856}, {lat:  47.641348, lng: -122.322834}, {lat:  47.641502, lng: -122.32283}, {lat:  47.642778, lng: -122.322795}, {lat:  47.642967, lng: -122.32279}, {lat:  47.64319, lng: -122.322784}, {lat:  47.64449, lng: -122.322753}, {lat:  47.645495, lng: -122.322729}, {lat:  47.645499, lng: -122.322729}, {lat:  47.645501, lng: -122.322729}, {lat:  47.645504, lng: -122.322729}, {lat:  47.645507, lng: -122.322729}, {lat:  47.64551, lng: -122.322728}, {lat:  47.645512, lng: -122.322728}, {lat:  47.645515, lng: -122.322728}, {lat:  47.645518, lng: -122.322728}, {lat:  47.645521, lng: -122.322728}, {lat:  47.645523, lng: -122.322728}, {lat:  47.645526, lng: -122.322728}, {lat:  47.645529, lng: -122.322728}, {lat:  47.645532, lng: -122.322728}, {lat:  47.645534, lng: -122.322728}, {lat:  47.645537, lng: -122.322728}, {lat:  47.64554, lng: -122.322728}, {lat:  47.645543, lng: -122.322728}, {lat:  47.645545, lng: -122.322728}, {lat:  47.645548, lng: -122.322728}, {lat:  47.645551, lng: -122.322728}, {lat:  47.645554, lng: -122.322727}, {lat:  47.645556, lng: -122.322727}, {lat:  47.645559, lng: -122.322727}, {lat:  47.645562, lng: -122.322727}, {lat:  47.645565, lng: -122.322727}, {lat:  47.645567, lng: -122.322727}, {lat:  47.64557, lng: -122.322727}, {lat:  47.645573, lng: -122.322727}, {lat:  47.645575, lng: -122.322727}, {lat:  47.645578, lng: -122.322727}, {lat:  47.645581, lng: -122.322727}, {lat:  47.645584, lng: -122.322727}, {lat:  47.645586, lng: -122.322727}, {lat:  47.645589, lng: -122.322727}, {lat:  47.645592, lng: -122.322727}, {lat:  47.645595, lng: -122.322726}, {lat:  47.645597, lng: -122.322726}, {lat:  47.6456, lng: -122.322726}, {lat:  47.645621, lng: -122.322726}, {lat:  47.645745, lng: -122.322723}, {lat:  47.645887, lng: -122.322714}, {lat:  47.64589, lng: -122.322714}, {lat:  47.645893, lng: -122.322714}, {lat:  47.645896, lng: -122.322714}, {lat:  47.645898, lng: -122.322714}, {lat:  47.645901, lng: -122.322714}, {lat:  47.645904, lng: -122.322713}, {lat:  47.645907, lng: -122.322713}, {lat:  47.645909, lng: -122.322713}, {lat:  47.645912, lng: -122.322713}, {lat:  47.645915, lng: -122.322713}, {lat:  47.645918, lng: -122.322713}, {lat:  47.64592, lng: -122.322712}, {lat:  47.645923, lng: -122.322712}, {lat:  47.645926, lng: -122.322712}, {lat:  47.645929, lng: -122.322712}, {lat:  47.645931, lng: -122.322712}, {lat:  47.645934, lng: -122.322712}, {lat:  47.645937, lng: -122.322712}, {lat:  47.64594, lng: -122.322711}, {lat:  47.645942, lng: -122.322711}, {lat:  47.645945, lng: -122.322711}, {lat:  47.645948, lng: -122.322711}, {lat:  47.64595, lng: -122.322711}, {lat:  47.645953, lng: -122.322711}, {lat:  47.645956, lng: -122.32271}, {lat:  47.645959, lng: -122.32271}, {lat:  47.645961, lng: -122.32271}, {lat:  47.645964, lng: -122.32271}, {lat:  47.645967, lng: -122.32271}, {lat:  47.64597, lng: -122.32271}, {lat:  47.645972, lng: -122.322709}, {lat:  47.645975, lng: -122.322709}, {lat:  47.645978, lng: -122.322709}, {lat:  47.645981, lng: -122.322709}, {lat:  47.645983, lng: -122.322709}, {lat:  47.645986, lng: -122.322709}, {lat:  47.645989, lng: -122.322708}, {lat:  47.645992, lng: -122.322708}, {lat:  47.645994, lng: -122.322708}, {lat:  47.646354, lng: -122.322687}, {lat:  47.646359, lng: -122.322687}, {lat:  47.646836, lng: -122.32266}, {lat:  47.646923, lng: -122.322656}, {lat:  47.647138, lng: -122.322644}, {lat:  47.648013, lng: -122.322596}, {lat:  47.648036, lng: -122.322595}, {lat:  47.648737, lng: -122.322581}, {lat:  47.648725, lng: -122.322367}, {lat:  47.650197, lng: -122.322343}, {lat:  47.651926, lng: -122.322274}, {lat:  47.652296, lng: -122.322257}, {lat:  47.652305, lng: -122.32207}, {lat:  47.6523, lng: -122.321801}, {lat:  47.652266, lng: -122.321545}, {lat:  47.652174, lng: -122.321273}, {lat:  47.652065, lng: -122.320929}, {lat:  47.651643, lng: -122.320406}, {lat:  47.651439, lng: -122.320285}, {lat:  47.65112, lng: -122.319935}, {lat:  47.650615, lng: -122.319507}, {lat:  47.650334, lng: -122.319087}, {lat:  47.650094, lng: -122.318874}, {lat:  47.649919, lng: -122.318727}, {lat:  47.649612, lng: -122.318511}, {lat:  47.649082, lng: -122.317985}, {lat:  47.64892, lng: -122.317792}, {lat:  47.648782, lng: -122.317663}]
    ],
  { strokeColor: '#33CC33'}
  );
  var district4a = handler.addPolygons(
    [
      [{lat:  47.650197, lng: -122.322343}, {lat:  47.648725, lng: -122.322367}, {lat:  47.648737, lng: -122.322581}, {lat:  47.648036, lng: -122.322595}, {lat:  47.648013, lng: -122.322596}, {lat:  47.647138, lng: -122.322644}, {lat:  47.646923, lng: -122.322656}, {lat:  47.646836, lng: -122.32266}, {lat:  47.646359, lng: -122.322687}, {lat:  47.646354, lng: -122.322687}, {lat:  47.645994, lng: -122.322708}, {lat:  47.645992, lng: -122.322708}, {lat:  47.645989, lng: -122.322708}, {lat:  47.645986, lng: -122.322709}, {lat:  47.645983, lng: -122.322709}, {lat:  47.645981, lng: -122.322709}, {lat:  47.645978, lng: -122.322709}, {lat:  47.645975, lng: -122.322709}, {lat:  47.645972, lng: -122.322709}, {lat:  47.64597, lng: -122.32271}, {lat:  47.645967, lng: -122.32271}, {lat:  47.645964, lng: -122.32271}, {lat:  47.645961, lng: -122.32271}, {lat:  47.645959, lng: -122.32271}, {lat:  47.645956, lng: -122.32271}, {lat:  47.645953, lng: -122.322711}, {lat:  47.64595, lng: -122.322711}, {lat:  47.645948, lng: -122.322711}, {lat:  47.645945, lng: -122.322711}, {lat:  47.645942, lng: -122.322711}, {lat:  47.64594, lng: -122.322711}, {lat:  47.645937, lng: -122.322712}, {lat:  47.645934, lng: -122.322712}, {lat:  47.645931, lng: -122.322712}, {lat:  47.645929, lng: -122.322712}, {lat:  47.645926, lng: -122.322712}, {lat:  47.645923, lng: -122.322712}, {lat:  47.64592, lng: -122.322712}, {lat:  47.645918, lng: -122.322713}, {lat:  47.645915, lng: -122.322713}, {lat:  47.645912, lng: -122.322713}, {lat:  47.645909, lng: -122.322713}, {lat:  47.645907, lng: -122.322713}, {lat:  47.645904, lng: -122.322713}, {lat:  47.645901, lng: -122.322714}, {lat:  47.645898, lng: -122.322714}, {lat:  47.645896, lng: -122.322714}, {lat:  47.645893, lng: -122.322714}, {lat:  47.64589, lng: -122.322714}, {lat:  47.645887, lng: -122.322714}, {lat:  47.645745, lng: -122.322723}, {lat:  47.645621, lng: -122.322726}, {lat:  47.6456, lng: -122.322726}, {lat:  47.645597, lng: -122.322726}, {lat:  47.645595, lng: -122.322726}, {lat:  47.645592, lng: -122.322727}, {lat:  47.645589, lng: -122.322727}, {lat:  47.645586, lng: -122.322727}, {lat:  47.645584, lng: -122.322727}, {lat:  47.645581, lng: -122.322727}, {lat:  47.645578, lng: -122.322727}, {lat:  47.645575, lng: -122.322727}, {lat:  47.645573, lng: -122.322727}, {lat:  47.64557, lng: -122.322727}, {lat:  47.645567, lng: -122.322727}, {lat:  47.645565, lng: -122.322727}, {lat:  47.645562, lng: -122.322727}, {lat:  47.645559, lng: -122.322727}, {lat:  47.645556, lng: -122.322727}, {lat:  47.645554, lng: -122.322727}, {lat:  47.645551, lng: -122.322728}, {lat:  47.645548, lng: -122.322728}, {lat:  47.645545, lng: -122.322728}, {lat:  47.645543, lng: -122.322728}, {lat:  47.64554, lng: -122.322728}, {lat:  47.645537, lng: -122.322728}, {lat:  47.645534, lng: -122.322728}, {lat:  47.645532, lng: -122.322728}, {lat:  47.645529, lng: -122.322728}, {lat:  47.645526, lng: -122.322728}, {lat:  47.645523, lng: -122.322728}, {lat:  47.645521, lng: -122.322728}, {lat:  47.645518, lng: -122.322728}, {lat:  47.645515, lng: -122.322728}, {lat:  47.645512, lng: -122.322728}, {lat:  47.64551, lng: -122.322728}, {lat:  47.645507, lng: -122.322729}, {lat:  47.645504, lng: -122.322729}, {lat:  47.645501, lng: -122.322729}, {lat:  47.645499, lng: -122.322729}, {lat:  47.645495, lng: -122.322729}, {lat:  47.64449, lng: -122.322753}, {lat:  47.64319, lng: -122.322784}, {lat:  47.642967, lng: -122.32279}, {lat:  47.642778, lng: -122.322795}, {lat:  47.641502, lng: -122.32283}, {lat:  47.641348, lng: -122.322834}, {lat:  47.640431, lng: -122.322856}, {lat:  47.639718, lng: -122.322873}, {lat:  47.639539, lng: -122.322877}, {lat:  47.63833, lng: -122.322904}, {lat:  47.637014, lng: -122.322935}, {lat:  47.636975, lng: -122.322936}, {lat:  47.636632, lng: -122.322963}, {lat:  47.636445, lng: -122.322987}, {lat:  47.6364, lng: -122.322993}, {lat:  47.636063, lng: -122.323037}, {lat:  47.635893, lng: -122.323069}, {lat:  47.635893, lng: -122.323063}, {lat:  47.635786, lng: -122.323083}, {lat:  47.635569, lng: -122.323128}, {lat:  47.635352, lng: -122.323178}, {lat:  47.63521, lng: -122.323216}, {lat:  47.635152, lng: -122.32323}, {lat:  47.634986, lng: -122.323284}, {lat:  47.634951, lng: -122.323295}, {lat:  47.634868, lng: -122.323321}, {lat:  47.634829, lng: -122.323334}, {lat:  47.6344, lng: -122.323471}, {lat:  47.633859, lng: -122.323691}, {lat:  47.633115, lng: -122.323994}, {lat:  47.632934, lng: -122.324067}, {lat:  47.632774, lng: -122.324133}, {lat:  47.632729, lng: -122.324152}, {lat:  47.632677, lng: -122.324177}, {lat:  47.632555, lng: -122.324238}, {lat:  47.632469, lng: -122.324284}, {lat:  47.632461, lng: -122.324289}, {lat:  47.632384, lng: -122.324332}, {lat:  47.63231, lng: -122.324376}, {lat:  47.632299, lng: -122.324382}, {lat:  47.632265, lng: -122.324403}, {lat:  47.632258, lng: -122.324408}, {lat:  47.632255, lng: -122.324409}, {lat:  47.632255, lng: -122.324796}, {lat:  47.632255, lng: -122.324934}, {lat:  47.632255, lng: -122.324957}, {lat:  47.632255, lng: -122.325075}, {lat:  47.632255, lng: -122.325087}, {lat:  47.632255, lng: -122.326071}, {lat:  47.632256, lng: -122.326207}, {lat:  47.632256, lng: -122.326705}, {lat:  47.632256, lng: -122.326761}, {lat:  47.632256, lng: -122.326927}, {lat:  47.632256, lng: -122.326964}, {lat:  47.632257, lng: -122.327041}, {lat:  47.632257, lng: -122.327189}, {lat:  47.632345, lng: -122.327177}, {lat:  47.632737, lng: -122.327122}, {lat:  47.633202, lng: -122.327211}, {lat:  47.633277, lng: -122.327225}, {lat:  47.633834, lng: -122.32716}, {lat:  47.634647, lng: -122.327103}, {lat:  47.634819, lng: -122.327953}, {lat:  47.635103, lng: -122.328067}, {lat:  47.635269, lng: -122.328369}, {lat:  47.635769, lng: -122.328259}, {lat:  47.636307, lng: -122.329437}, {lat:  47.636434, lng: -122.329505}, {lat:  47.636548, lng: -122.329509}, {lat:  47.636576, lng: -122.32951}, {lat:  47.636647, lng: -122.329512}, {lat:  47.636746, lng: -122.329621}, {lat:  47.63719, lng: -122.329736}, {lat:  47.637786, lng: -122.329698}, {lat:  47.638178, lng: -122.329567}, {lat:  47.638705, lng: -122.329614}, {lat:  47.639289, lng: -122.329692}, {lat:  47.639641, lng: -122.329704}, {lat:  47.63973, lng: -122.329695}, {lat:  47.639762, lng: -122.329692}, {lat:  47.639763, lng: -122.329692}, {lat:  47.640071, lng: -122.329661}, {lat:  47.640404, lng: -122.329586}, {lat:  47.640756, lng: -122.32954}, {lat:  47.641126, lng: -122.329582}, {lat:  47.641476, lng: -122.32968}, {lat:  47.642022, lng: -122.329728}, {lat:  47.642318, lng: -122.329565}, {lat:  47.642476, lng: -122.329455}, {lat:  47.642732, lng: -122.32929}, {lat:  47.642968, lng: -122.329154}, {lat:  47.643234, lng: -122.328857}, {lat:  47.643339, lng: -122.328288}, {lat:  47.643471, lng: -122.327843}, {lat:  47.643834, lng: -122.32761}, {lat:  47.644138, lng: -122.32758}, {lat:  47.644402, lng: -122.327466}, {lat:  47.644607, lng: -122.327637}, {lat:  47.644909, lng: -122.327729}, {lat:  47.645132, lng: -122.327655}, {lat:  47.645468, lng: -122.327339}, {lat:  47.645625, lng: -122.327277}, {lat:  47.645704, lng: -122.327245}, {lat:  47.646206, lng: -122.326956}, {lat:  47.646541, lng: -122.326762}, {lat:  47.64671, lng: -122.326564}, {lat:  47.647045, lng: -122.32633}, {lat:  47.647355, lng: -122.325952}, {lat:  47.647485, lng: -122.325609}, {lat:  47.647583, lng: -122.32551}, {lat:  47.647834, lng: -122.325356}, {lat:  47.648077, lng: -122.325227}, {lat:  47.648499, lng: -122.325048}, {lat:  47.648924, lng: -122.32499}, {lat:  47.649201, lng: -122.324912}, {lat:  47.649244, lng: -122.324901}, {lat:  47.649523, lng: -122.324828}, {lat:  47.649629, lng: -122.324671}, {lat:  47.649789, lng: -122.324502}, {lat:  47.649941, lng: -122.324259}, {lat:  47.650102, lng: -122.324031}, {lat:  47.650273, lng: -122.323847}, {lat:  47.650519, lng: -122.323617}, {lat:  47.651021, lng: -122.323469}, {lat:  47.651232, lng: -122.323433}, {lat:  47.651492, lng: -122.323343}, {lat:  47.651665, lng: -122.32325}, {lat:  47.651858, lng: -122.323158}, {lat:  47.652061, lng: -122.323023}, {lat:  47.652169, lng: -122.322815}, {lat:  47.65224, lng: -122.322591}, {lat:  47.652269, lng: -122.322454}, {lat:  47.652291, lng: -122.322352}, {lat:  47.652296, lng: -122.322257}, {lat:  47.651926, lng: -122.322274}, {lat:  47.650197, lng: -122.322343}]
    ],
    { strokeColor: '#9933FF'}
  );
  var district4b = handler.addPolygons(
    [
      [{lat:  47.692695, lng: -122.27145}, {lat:  47.69257, lng: -122.271109}, {lat:  47.692434, lng: -122.270828}, {lat:  47.692295, lng: -122.270536}, {lat:  47.692149, lng: -122.270286}, {lat:  47.692011, lng: -122.270092}, {lat:  47.691526, lng: -122.269354}, {lat:  47.6915, lng: -122.269305}, {lat:  47.691433, lng: -122.269182}, {lat:  47.69138, lng: -122.269083}, {lat:  47.691374, lng: -122.269073}, {lat:  47.691346, lng: -122.269025}, {lat:  47.691315, lng: -122.268974}, {lat:  47.691289, lng: -122.268932}, {lat:  47.691274, lng: -122.268908}, {lat:  47.691272, lng: -122.268905}, {lat:  47.69127, lng: -122.268902}, {lat:  47.691268, lng: -122.268899}, {lat:  47.691266, lng: -122.268896}, {lat:  47.691264, lng: -122.268893}, {lat:  47.691263, lng: -122.268892}, {lat:  47.691263, lng: -122.26889}, {lat:  47.691261, lng: -122.268887}, {lat:  47.691259, lng: -122.268885}, {lat:  47.691257, lng: -122.268882}, {lat:  47.691255, lng: -122.268879}, {lat:  47.691253, lng: -122.268876}, {lat:  47.691251, lng: -122.268873}, {lat:  47.691249, lng: -122.26887}, {lat:  47.691247, lng: -122.268867}, {lat:  47.691245, lng: -122.268865}, {lat:  47.691243, lng: -122.268862}, {lat:  47.691241, lng: -122.268859}, {lat:  47.691239, lng: -122.268856}, {lat:  47.691237, lng: -122.268853}, {lat:  47.691235, lng: -122.26885}, {lat:  47.691233, lng: -122.268847}, {lat:  47.691231, lng: -122.268845}, {lat:  47.691229, lng: -122.268842}, {lat:  47.691227, lng: -122.268839}, {lat:  47.691226, lng: -122.268836}, {lat:  47.691224, lng: -122.268833}, {lat:  47.691222, lng: -122.26883}, {lat:  47.69122, lng: -122.268828}, {lat:  47.691218, lng: -122.268825}, {lat:  47.691216, lng: -122.268822}, {lat:  47.691214, lng: -122.268819}, {lat:  47.691212, lng: -122.268816}, {lat:  47.69121, lng: -122.268814}, {lat:  47.691208, lng: -122.268811}, {lat:  47.691206, lng: -122.268808}, {lat:  47.691204, lng: -122.268805}, {lat:  47.691202, lng: -122.268802}, {lat:  47.6912, lng: -122.2688}, {lat:  47.691198, lng: -122.268797}, {lat:  47.691196, lng: -122.268794}, {lat:  47.691194, lng: -122.268791}, {lat:  47.691192, lng: -122.268788}, {lat:  47.69119, lng: -122.268786}, {lat:  47.691188, lng: -122.268783}, {lat:  47.691186, lng: -122.26878}, {lat:  47.691184, lng: -122.268777}, {lat:  47.691182, lng: -122.268775}, {lat:  47.69118, lng: -122.268772}, {lat:  47.691178, lng: -122.268769}, {lat:  47.691176, lng: -122.268766}, {lat:  47.691174, lng: -122.268764}, {lat:  47.691172, lng: -122.268761}, {lat:  47.69117, lng: -122.268758}, {lat:  47.691168, lng: -122.268755}, {lat:  47.691166, lng: -122.268753}, {lat:  47.691164, lng: -122.26875}, {lat:  47.691162, lng: -122.268747}, {lat:  47.69116, lng: -122.268744}, {lat:  47.691158, lng: -122.268742}, {lat:  47.691156, lng: -122.268739}, {lat:  47.691154, lng: -122.268736}, {lat:  47.691152, lng: -122.268733}, {lat:  47.69115, lng: -122.268731}, {lat:  47.691147, lng: -122.268728}, {lat:  47.691145, lng: -122.268725}, {lat:  47.691143, lng: -122.268723}, {lat:  47.691141, lng: -122.26872}, {lat:  47.691139, lng: -122.268717}, {lat:  47.691137, lng: -122.268714}, {lat:  47.691135, lng: -122.268712}, {lat:  47.691133, lng: -122.268709}, {lat:  47.691131, lng: -122.268706}, {lat:  47.691129, lng: -122.268704}, {lat:  47.691127, lng: -122.268701}, {lat:  47.691125, lng: -122.268698}, {lat:  47.691123, lng: -122.268695}, {lat:  47.691121, lng: -122.268693}, {lat:  47.691119, lng: -122.26869}, {lat:  47.691117, lng: -122.268687}, {lat:  47.691115, lng: -122.268685}, {lat:  47.691113, lng: -122.268682}, {lat:  47.691111, lng: -122.268679}, {lat:  47.691109, lng: -122.268676}, {lat:  47.691106, lng: -122.268674}, {lat:  47.691104, lng: -122.268671}, {lat:  47.691102, lng: -122.268668}, {lat:  47.6911, lng: -122.268666}, {lat:  47.691098, lng: -122.268663}, {lat:  47.691096, lng: -122.26866}, {lat:  47.691094, lng: -122.268658}, {lat:  47.691092, lng: -122.268655}, {lat:  47.69109, lng: -122.268652}, {lat:  47.691088, lng: -122.26865}, {lat:  47.691086, lng: -122.268647}, {lat:  47.691084, lng: -122.268645}, {lat:  47.691082, lng: -122.268642}, {lat:  47.691079, lng: -122.268639}, {lat:  47.691077, lng: -122.268637}, {lat:  47.691075, lng: -122.268634}, {lat:  47.691073, lng: -122.268631}, {lat:  47.691071, lng: -122.268629}, {lat:  47.691069, lng: -122.268626}, {lat:  47.691067, lng: -122.268624}, {lat:  47.691065, lng: -122.268621}, {lat:  47.691063, lng: -122.268618}, {lat:  47.691061, lng: -122.268616}, {lat:  47.691058, lng: -122.268613}, {lat:  47.691056, lng: -122.268611}, {lat:  47.691054, lng: -122.268608}, {lat:  47.691052, lng: -122.268605}, {lat:  47.69105, lng: -122.268603}, {lat:  47.691048, lng: -122.2686}, {lat:  47.691046, lng: -122.268598}, {lat:  47.691044, lng: -122.268595}, {lat:  47.691042, lng: -122.268593}, {lat:  47.691039, lng: -122.26859}, {lat:  47.691037, lng: -122.268587}, {lat:  47.691035, lng: -122.268585}, {lat:  47.691033, lng: -122.268582}, {lat:  47.691031, lng: -122.26858}, {lat:  47.691029, lng: -122.268577}, {lat:  47.691027, lng: -122.268575}, {lat:  47.691025, lng: -122.268572}, {lat:  47.691022, lng: -122.268569}, {lat:  47.69102, lng: -122.268567}, {lat:  47.691018, lng: -122.268564}, {lat:  47.691016, lng: -122.268562}, {lat:  47.691014, lng: -122.268559}, {lat:  47.691012, lng: -122.268557}, {lat:  47.69101, lng: -122.268554}, {lat:  47.691008, lng: -122.268552}, {lat:  47.691005, lng: -122.268549}, {lat:  47.691003, lng: -122.268547}, {lat:  47.691001, lng: -122.268544}, {lat:  47.690999, lng: -122.268542}, {lat:  47.690997, lng: -122.268539}, {lat:  47.690997, lng: -122.268539}, {lat:  47.690995, lng: -122.268537}, {lat:  47.690992, lng: -122.268534}, {lat:  47.69099, lng: -122.268532}, {lat:  47.690988, lng: -122.268529}, {lat:  47.690986, lng: -122.268527}, {lat:  47.690984, lng: -122.268524}, {lat:  47.690982, lng: -122.268522}, {lat:  47.690979, lng: -122.268519}, {lat:  47.690977, lng: -122.268517}, {lat:  47.690975, lng: -122.268514}, {lat:  47.690973, lng: -122.268512}, {lat:  47.690971, lng: -122.268509}, {lat:  47.690969, lng: -122.268507}, {lat:  47.690966, lng: -122.268504}, {lat:  47.690964, lng: -122.268502}, {lat:  47.690962, lng: -122.268499}, {lat:  47.69096, lng: -122.268497}, {lat:  47.690958, lng: -122.268494}, {lat:  47.690956, lng: -122.268492}, {lat:  47.690953, lng: -122.268489}, {lat:  47.690951, lng: -122.268487}, {lat:  47.690949, lng: -122.268485}, {lat:  47.690947, lng: -122.268482}, {lat:  47.690945, lng: -122.26848}, {lat:  47.690942, lng: -122.268477}, {lat:  47.69094, lng: -122.268475}, {lat:  47.690938, lng: -122.268472}, {lat:  47.690936, lng: -122.26847}, {lat:  47.690934, lng: -122.268467}, {lat:  47.690932, lng: -122.268465}, {lat:  47.690929, lng: -122.268463}, {lat:  47.690927, lng: -122.26846}, {lat:  47.690925, lng: -122.268458}, {lat:  47.690923, lng: -122.268455}, {lat:  47.69092, lng: -122.268453}, {lat:  47.690918, lng: -122.268451}, {lat:  47.690916, lng: -122.268448}, {lat:  47.690914, lng: -122.268446}, {lat:  47.690912, lng: -122.268443}, {lat:  47.690909, lng: -122.268441}, {lat:  47.690907, lng: -122.268439}, {lat:  47.690905, lng: -122.268436}, {lat:  47.690903, lng: -122.268434}, {lat:  47.690901, lng: -122.268431}, {lat:  47.690898, lng: -122.268429}, {lat:  47.690896, lng: -122.268427}, {lat:  47.690894, lng: -122.268424}, {lat:  47.690892, lng: -122.268422}, {lat:  47.690889, lng: -122.268419}, {lat:  47.690887, lng: -122.268417}, {lat:  47.690885, lng: -122.268415}, {lat:  47.690883, lng: -122.268412}, {lat:  47.690881, lng: -122.26841}, {lat:  47.690878, lng: -122.268408}, {lat:  47.690876, lng: -122.268405}, {lat:  47.690874, lng: -122.268403}, {lat:  47.690872, lng: -122.268401}, {lat:  47.690869, lng: -122.268398}, {lat:  47.690867, lng: -122.268396}, {lat:  47.690865, lng: -122.268393}, {lat:  47.690863, lng: -122.268391}, {lat:  47.69086, lng: -122.268389}, {lat:  47.690858, lng: -122.268386}, {lat:  47.690856, lng: -122.268384}, {lat:  47.690854, lng: -122.268382}, {lat:  47.690851, lng: -122.26838}, {lat:  47.690849, lng: -122.268377}, {lat:  47.690847, lng: -122.268375}, {lat:  47.690845, lng: -122.268373}, {lat:  47.690842, lng: -122.26837}, {lat:  47.69084, lng: -122.268368}, {lat:  47.690838, lng: -122.268366}, {lat:  47.690836, lng: -122.268363}, {lat:  47.690833, lng: -122.268361}, {lat:  47.690831, lng: -122.268359}, {lat:  47.690829, lng: -122.268357}, {lat:  47.690827, lng: -122.268354}, {lat:  47.690824, lng: -122.268352}, {lat:  47.690822, lng: -122.26835}, {lat:  47.69082, lng: -122.268347}, {lat:  47.690818, lng: -122.268345}, {lat:  47.690815, lng: -122.268343}, {lat:  47.690813, lng: -122.26834}, {lat:  47.690811, lng: -122.268338}, {lat:  47.690808, lng: -122.268336}, {lat:  47.690806, lng: -122.268334}, {lat:  47.690804, lng: -122.268331}, {lat:  47.690802, lng: -122.268329}, {lat:  47.690799, lng: -122.268327}, {lat:  47.690797, lng: -122.268325}, {lat:  47.690795, lng: -122.268322}, {lat:  47.690792, lng: -122.26832}, {lat:  47.69079, lng: -122.268318}, {lat:  47.690788, lng: -122.268316}, {lat:  47.690786, lng: -122.268313}, {lat:  47.690783, lng: -122.268311}, {lat:  47.690781, lng: -122.268309}, {lat:  47.690779, lng: -122.268307}, {lat:  47.690776, lng: -122.268305}, {lat:  47.690774, lng: -122.268302}, {lat:  47.690772, lng: -122.2683}, {lat:  47.690769, lng: -122.268298}, {lat:  47.690767, lng: -122.268296}, {lat:  47.690765, lng: -122.268294}, {lat:  47.690763, lng: -122.268291}, {lat:  47.69076, lng: -122.268289}, {lat:  47.690758, lng: -122.268287}, {lat:  47.690756, lng: -122.268285}, {lat:  47.690753, lng: -122.268283}, {lat:  47.690751, lng: -122.268281}, {lat:  47.690749, lng: -122.268278}, {lat:  47.690746, lng: -122.268276}, {lat:  47.690744, lng: -122.268274}, {lat:  47.690742, lng: -122.268272}, {lat:  47.690739, lng: -122.26827}, {lat:  47.690737, lng: -122.268268}, {lat:  47.690735, lng: -122.268265}, {lat:  47.690732, lng: -122.268263}, {lat:  47.69073, lng: -122.268261}, {lat:  47.690728, lng: -122.268259}, {lat:  47.690726, lng: -122.268257}, {lat:  47.690723, lng: -122.268255}, {lat:  47.690721, lng: -122.268252}, {lat:  47.690719, lng: -122.26825}, {lat:  47.690716, lng: -122.268248}, {lat:  47.690714, lng: -122.268246}, {lat:  47.690711, lng: -122.268244}, {lat:  47.690709, lng: -122.268242}, {lat:  47.690707, lng: -122.26824}, {lat:  47.690704, lng: -122.268238}, {lat:  47.690702, lng: -122.268236}, {lat:  47.6907, lng: -122.268233}, {lat:  47.690697, lng: -122.268231}, {lat:  47.690695, lng: -122.268229}, {lat:  47.690693, lng: -122.268227}, {lat:  47.69069, lng: -122.268225}, {lat:  47.690688, lng: -122.268223}, {lat:  47.690686, lng: -122.268221}, {lat:  47.690683, lng: -122.268219}, {lat:  47.690681, lng: -122.268217}, {lat:  47.690679, lng: -122.268215}, {lat:  47.690676, lng: -122.268213}, {lat:  47.690674, lng: -122.26821}, {lat:  47.690672, lng: -122.268208}, {lat:  47.690669, lng: -122.268206}, {lat:  47.690667, lng: -122.268204}, {lat:  47.690665, lng: -122.268202}, {lat:  47.690662, lng: -122.2682}, {lat:  47.69066, lng: -122.268198}, {lat:  47.690657, lng: -122.268196}, {lat:  47.690655, lng: -122.268194}, {lat:  47.690653, lng: -122.268192}, {lat:  47.69065, lng: -122.26819}, {lat:  47.690648, lng: -122.268188}, {lat:  47.690646, lng: -122.268186}, {lat:  47.690643, lng: -122.268184}, {lat:  47.690641, lng: -122.268182}, {lat:  47.690639, lng: -122.26818}, {lat:  47.690636, lng: -122.268177}, {lat:  47.690634, lng: -122.268175}, {lat:  47.690631, lng: -122.268173}, {lat:  47.690629, lng: -122.268171}, {lat:  47.690627, lng: -122.268169}, {lat:  47.690624, lng: -122.268167}, {lat:  47.690622, lng: -122.268165}, {lat:  47.69062, lng: -122.268163}, {lat:  47.690617, lng: -122.268161}, {lat:  47.690615, lng: -122.268159}, {lat:  47.690613, lng: -122.268157}, {lat:  47.69061, lng: -122.268155}, {lat:  47.690608, lng: -122.268153}, {lat:  47.690605, lng: -122.268151}, {lat:  47.690603, lng: -122.268149}, {lat:  47.690601, lng: -122.268147}, {lat:  47.690598, lng: -122.268145}, {lat:  47.690596, lng: -122.268143}, {lat:  47.690594, lng: -122.26814}, {lat:  47.690591, lng: -122.268138}, {lat:  47.690589, lng: -122.268136}, {lat:  47.690587, lng: -122.268134}, {lat:  47.690584, lng: -122.268132}, {lat:  47.690582, lng: -122.26813}, {lat:  47.690579, lng: -122.268128}, {lat:  47.690577, lng: -122.268126}, {lat:  47.690575, lng: -122.268124}, {lat:  47.690572, lng: -122.268122}, {lat:  47.69057, lng: -122.26812}, {lat:  47.690568, lng: -122.268118}, {lat:  47.690565, lng: -122.268116}, {lat:  47.690563, lng: -122.268114}, {lat:  47.690561, lng: -122.268112}, {lat:  47.690558, lng: -122.26811}, {lat:  47.690556, lng: -122.268108}, {lat:  47.690553, lng: -122.268106}, {lat:  47.690551, lng: -122.268104}, {lat:  47.690549, lng: -122.268101}, {lat:  47.690546, lng: -122.268099}, {lat:  47.690544, lng: -122.268097}, {lat:  47.690542, lng: -122.268095}, {lat:  47.690539, lng: -122.268093}, {lat:  47.690537, lng: -122.268091}, {lat:  47.690535, lng: -122.268089}, {lat:  47.690532, lng: -122.268087}, {lat:  47.69053, lng: -122.268085}, {lat:  47.690527, lng: -122.268083}, {lat:  47.690525, lng: -122.268081}, {lat:  47.690523, lng: -122.268079}, {lat:  47.69052, lng: -122.268077}, {lat:  47.690518, lng: -122.268075}, {lat:  47.690516, lng: -122.268073}, {lat:  47.690513, lng: -122.268071}, {lat:  47.690511, lng: -122.268069}, {lat:  47.690508, lng: -122.268067}, {lat:  47.690506, lng: -122.268064}, {lat:  47.690504, lng: -122.268062}, {lat:  47.690501, lng: -122.26806}, {lat:  47.690499, lng: -122.268058}, {lat:  47.690497, lng: -122.268056}, {lat:  47.690494, lng: -122.268054}, {lat:  47.690492, lng: -122.268052}, {lat:  47.69049, lng: -122.26805}, {lat:  47.690487, lng: -122.268048}, {lat:  47.690485, lng: -122.268046}, {lat:  47.690482, lng: -122.268044}, {lat:  47.69048, lng: -122.268042}, {lat:  47.690478, lng: -122.26804}, {lat:  47.690475, lng: -122.268038}, {lat:  47.690473, lng: -122.268036}, {lat:  47.690471, lng: -122.268034}, {lat:  47.690468, lng: -122.268032}, {lat:  47.690466, lng: -122.26803}, {lat:  47.690464, lng: -122.268027}, {lat:  47.690461, lng: -122.268025}, {lat:  47.690459, lng: -122.268023}, {lat:  47.690456, lng: -122.268021}, {lat:  47.690454, lng: -122.268019}, {lat:  47.690452, lng: -122.268017}, {lat:  47.690449, lng: -122.268015}, {lat:  47.690447, lng: -122.268013}, {lat:  47.690445, lng: -122.268011}, {lat:  47.690442, lng: -122.268009}, {lat:  47.69044, lng: -122.268007}, {lat:  47.690438, lng: -122.268005}, {lat:  47.690435, lng: -122.268003}, {lat:  47.690433, lng: -122.268001}, {lat:  47.69043, lng: -122.267999}, {lat:  47.690428, lng: -122.267997}, {lat:  47.690426, lng: -122.267995}, {lat:  47.690423, lng: -122.267993}, {lat:  47.690421, lng: -122.267991}, {lat:  47.690419, lng: -122.267988}, {lat:  47.690416, lng: -122.267986}, {lat:  47.690414, lng: -122.267984}, {lat:  47.690412, lng: -122.267982}, {lat:  47.690409, lng: -122.26798}, {lat:  47.690407, lng: -122.267978}, {lat:  47.690404, lng: -122.267976}, {lat:  47.690402, lng: -122.267974}, {lat:  47.6904, lng: -122.267972}, {lat:  47.690397, lng: -122.26797}, {lat:  47.690395, lng: -122.267968}, {lat:  47.690393, lng: -122.267966}, {lat:  47.69039, lng: -122.267964}, {lat:  47.690388, lng: -122.267962}, {lat:  47.690386, lng: -122.26796}, {lat:  47.690383, lng: -122.267958}, {lat:  47.690381, lng: -122.267956}, {lat:  47.690378, lng: -122.267954}, {lat:  47.690376, lng: -122.267951}, {lat:  47.690374, lng: -122.267949}, {lat:  47.690371, lng: -122.267947}, {lat:  47.690369, lng: -122.267945}, {lat:  47.690367, lng: -122.267943}, {lat:  47.690364, lng: -122.267941}, {lat:  47.690362, lng: -122.267939}, {lat:  47.69036, lng: -122.267937}, {lat:  47.690357, lng: -122.267935}, {lat:  47.690355, lng: -122.267933}, {lat:  47.690352, lng: -122.267931}, {lat:  47.69035, lng: -122.267929}, {lat:  47.690348, lng: -122.267927}, {lat:  47.690345, lng: -122.267925}, {lat:  47.690343, lng: -122.267923}, {lat:  47.690341, lng: -122.267921}, {lat:  47.690338, lng: -122.267919}, {lat:  47.690336, lng: -122.267917}, {lat:  47.690334, lng: -122.267914}, {lat:  47.690331, lng: -122.267912}, {lat:  47.690329, lng: -122.26791}, {lat:  47.690326, lng: -122.267908}, {lat:  47.690324, lng: -122.267906}, {lat:  47.690322, lng: -122.267904}, {lat:  47.690319, lng: -122.267902}, {lat:  47.690317, lng: -122.2679}, {lat:  47.690315, lng: -122.267898}, {lat:  47.690312, lng: -122.267896}, {lat:  47.69031, lng: -122.267894}, {lat:  47.690308, lng: -122.267892}, {lat:  47.690305, lng: -122.26789}, {lat:  47.690303, lng: -122.267888}, {lat:  47.6903, lng: -122.267886}, {lat:  47.690298, lng: -122.267884}, {lat:  47.690296, lng: -122.267882}, {lat:  47.690293, lng: -122.26788}, {lat:  47.690291, lng: -122.267878}, {lat:  47.690289, lng: -122.267875}, {lat:  47.690286, lng: -122.267873}, {lat:  47.690284, lng: -122.267871}, {lat:  47.690281, lng: -122.267869}, {lat:  47.690279, lng: -122.267867}, {lat:  47.690277, lng: -122.267865}, {lat:  47.690274, lng: -122.267863}, {lat:  47.690272, lng: -122.267861}, {lat:  47.69027, lng: -122.267859}, {lat:  47.690267, lng: -122.267857}, {lat:  47.690265, lng: -122.267855}, {lat:  47.690263, lng: -122.267853}, {lat:  47.69026, lng: -122.267851}, {lat:  47.690258, lng: -122.267849}, {lat:  47.690255, lng: -122.267847}, {lat:  47.690253, lng: -122.267845}, {lat:  47.690251, lng: -122.267843}, {lat:  47.690248, lng: -122.267841}, {lat:  47.690246, lng: -122.267838}, {lat:  47.690244, lng: -122.267836}, {lat:  47.690241, lng: -122.267834}, {lat:  47.690239, lng: -122.267832}, {lat:  47.690237, lng: -122.26783}, {lat:  47.690234, lng: -122.267828}, {lat:  47.690232, lng: -122.267826}, {lat:  47.690229, lng: -122.267824}, {lat:  47.690227, lng: -122.267822}, {lat:  47.690225, lng: -122.26782}, {lat:  47.690222, lng: -122.267818}, {lat:  47.69022, lng: -122.267816}, {lat:  47.690218, lng: -122.267814}, {lat:  47.690215, lng: -122.267812}, {lat:  47.690213, lng: -122.26781}, {lat:  47.690211, lng: -122.267807}, {lat:  47.690206, lng: -122.267804}, {lat:  47.690124, lng: -122.267729}, {lat:  47.690123, lng: -122.267729}, {lat:  47.690123, lng: -122.267687}, {lat:  47.690122, lng: -122.26752}, {lat:  47.690122, lng: -122.26752}, {lat:  47.690122, lng: -122.267497}, {lat:  47.69012, lng: -122.267307}, {lat:  47.69012, lng: -122.267245}, {lat:  47.690119, lng: -122.267118}, {lat:  47.690119, lng: -122.267117}, {lat:  47.690118, lng: -122.267012}, {lat:  47.690117, lng: -122.266865}, {lat:  47.690117, lng: -122.266743}, {lat:  47.690117, lng: -122.266743}, {lat:  47.690116, lng: -122.266547}, {lat:  47.690116, lng: -122.266493}, {lat:  47.690116, lng: -122.266492}, {lat:  47.690115, lng: -122.266307}, {lat:  47.690096, lng: -122.266286}, {lat:  47.68997, lng: -122.266088}, {lat:  47.689798, lng: -122.265901}, {lat:  47.689419, lng: -122.265583}, {lat:  47.689352, lng: -122.265431}, {lat:  47.689252, lng: -122.265153}, {lat:  47.689174, lng: -122.264907}, {lat:  47.689069, lng: -122.264655}, {lat:  47.688433, lng: -122.263867}, {lat:  47.687708, lng: -122.262971}, {lat:  47.687698, lng: -122.262192}, {lat:  47.687693, lng: -122.261825}, {lat:  47.687763, lng: -122.261804}, {lat:  47.687755, lng: -122.261645}, {lat:  47.687649, lng: -122.261563}, {lat:  47.687633, lng: -122.261182}, {lat:  47.687527, lng: -122.260774}, {lat:  47.687554, lng: -122.25969}, {lat:  47.687544, lng: -122.259293}, {lat:  47.687604, lng: -122.258852}, {lat:  47.68762, lng: -122.258664}, {lat:  47.687637, lng: -122.258449}, {lat:  47.687734, lng: -122.257707}, {lat:  47.687806, lng: -122.25714}, {lat:  47.68792, lng: -122.2567}, {lat:  47.688015, lng: -122.25641}, {lat:  47.688098, lng: -122.25623}, {lat:  47.688175, lng: -122.25609}, {lat:  47.68812, lng: -122.25583}, {lat:  47.688078, lng: -122.255689}, {lat:  47.688035, lng: -122.255598}, {lat:  47.687944, lng: -122.255519}, {lat:  47.687874, lng: -122.254913}, {lat:  47.687799, lng: -122.254482}, {lat:  47.687634, lng: -122.253978}, {lat:  47.68711, lng: -122.252248}, {lat:  47.686955, lng: -122.251907}, {lat:  47.686846, lng: -122.251771}, {lat:  47.686462, lng: -122.25089}, {lat:  47.68637, lng: -122.250628}, {lat:  47.68607, lng: -122.250057}, {lat:  47.686015, lng: -122.249902}, {lat:  47.685885, lng: -122.249366}, {lat:  47.685628, lng: -122.248545}, {lat:  47.685527, lng: -122.248261}, {lat:  47.685418, lng: -122.248082}, {lat:  47.685327, lng: -122.247962}, {lat:  47.685246, lng: -122.247891}, {lat:  47.684984, lng: -122.247748}, {lat:  47.684866, lng: -122.247617}, {lat:  47.684775, lng: -122.247404}, {lat:  47.684575, lng: -122.24707}, {lat:  47.684447, lng: -122.246915}, {lat:  47.684303, lng: -122.246795}, {lat:  47.684014, lng: -122.246736}, {lat:  47.683815, lng: -122.246451}, {lat:  47.683534, lng: -122.246154}, {lat:  47.683425, lng: -122.246082}, {lat:  47.683317, lng: -122.245975}, {lat:  47.683154, lng: -122.245867}, {lat:  47.682893, lng: -122.245785}, {lat:  47.682703, lng: -122.245761}, {lat:  47.68264, lng: -122.245737}, {lat:  47.681606, lng: -122.24576}, {lat:  47.681453, lng: -122.245784}, {lat:  47.681246, lng: -122.245856}, {lat:  47.681165, lng: -122.245868}, {lat:  47.681085, lng: -122.245916}, {lat:  47.681004, lng: -122.245939}, {lat:  47.680932, lng: -122.245974}, {lat:  47.680816, lng: -122.24607}, {lat:  47.680637, lng: -122.246309}, {lat:  47.680361, lng: -122.246773}, {lat:  47.680094, lng: -122.247165}, {lat:  47.67988, lng: -122.247416}, {lat:  47.679665, lng: -122.24757}, {lat:  47.679531, lng: -122.247665}, {lat:  47.679414, lng: -122.247712}, {lat:  47.679252, lng: -122.247702}, {lat:  47.679009, lng: -122.247702}, {lat:  47.678919, lng: -122.247773}, {lat:  47.678643, lng: -122.248152}, {lat:  47.678401, lng: -122.248355}, {lat:  47.678248, lng: -122.248344}, {lat:  47.678088, lng: -122.248582}, {lat:  47.677999, lng: -122.248748}, {lat:  47.677874, lng: -122.248878}, {lat:  47.677731, lng: -122.248985}, {lat:  47.67765, lng: -122.249021}, {lat:  47.677579, lng: -122.249081}, {lat:  47.67748, lng: -122.249129}, {lat:  47.677372, lng: -122.249212}, {lat:  47.677175, lng: -122.249283}, {lat:  47.677092, lng: -122.249371}, {lat:  47.677098, lng: -122.249572}, {lat:  47.677031, lng: -122.249751}, {lat:  47.676991, lng: -122.249826}, {lat:  47.676913, lng: -122.2499}, {lat:  47.676745, lng: -122.249913}, {lat:  47.67663, lng: -122.249862}, {lat:  47.676548, lng: -122.249764}, {lat:  47.676479, lng: -122.249704}, {lat:  47.676407, lng: -122.24974}, {lat:  47.676233, lng: -122.249782}, {lat:  47.676104, lng: -122.249816}, {lat:  47.675987, lng: -122.249888}, {lat:  47.675884, lng: -122.249942}, {lat:  47.675742, lng: -122.249975}, {lat:  47.675626, lng: -122.25001}, {lat:  47.675522, lng: -122.250073}, {lat:  47.675406, lng: -122.250107}, {lat:  47.675316, lng: -122.250123}, {lat:  47.675238, lng: -122.250178}, {lat:  47.675185, lng: -122.250271}, {lat:  47.675208, lng: -122.250415}, {lat:  47.675111, lng: -122.250497}, {lat:  47.674995, lng: -122.250464}, {lat:  47.67492, lng: -122.250367}, {lat:  47.674855, lng: -122.250384}, {lat:  47.674778, lng: -122.250419}, {lat:  47.674822, lng: -122.250488}, {lat:  47.674807, lng: -122.25062}, {lat:  47.674723, lng: -122.250608}, {lat:  47.674686, lng: -122.25053}, {lat:  47.674642, lng: -122.250453}, {lat:  47.674584, lng: -122.25047}, {lat:  47.674494, lng: -122.250486}, {lat:  47.674345, lng: -122.250538}, {lat:  47.674197, lng: -122.250651}, {lat:  47.674148, lng: -122.250695}, {lat:  47.673534, lng: -122.251251}, {lat:  47.673473, lng: -122.251421}, {lat:  47.673407, lng: -122.251484}, {lat:  47.673178, lng: -122.251705}, {lat:  47.673096, lng: -122.251818}, {lat:  47.673034, lng: -122.251902}, {lat:  47.672842, lng: -122.252009}, {lat:  47.67253, lng: -122.252233}, {lat:  47.672342, lng: -122.252399}, {lat:  47.672207, lng: -122.252232}, {lat:  47.672143, lng: -122.252392}, {lat:  47.672127, lng: -122.252534}, {lat:  47.672085, lng: -122.252604}, {lat:  47.672028, lng: -122.252672}, {lat:  47.671822, lng: -122.252737}, {lat:  47.671711, lng: -122.252815}, {lat:  47.671625, lng: -122.252981}, {lat:  47.671486, lng: -122.253154}, {lat:  47.671332, lng: -122.253331}, {lat:  47.671249, lng: -122.25341}, {lat:  47.671206, lng: -122.253507}, {lat:  47.67088, lng: -122.253983}, {lat:  47.670752, lng: -122.254142}, {lat:  47.670416, lng: -122.254559}, {lat:  47.670211, lng: -122.254842}, {lat:  47.670069, lng: -122.255095}, {lat:  47.669819, lng: -122.255462}, {lat:  47.669721, lng: -122.255561}, {lat:  47.669661, lng: -122.255649}, {lat:  47.669505, lng: -122.255867}, {lat:  47.669315, lng: -122.256133}, {lat:  47.669257, lng: -122.256211}, {lat:  47.669159, lng: -122.25635}, {lat:  47.668971, lng: -122.256593}, {lat:  47.668781, lng: -122.256805}, {lat:  47.668571, lng: -122.257103}, {lat:  47.668309, lng: -122.257456}, {lat:  47.668082, lng: -122.257793}, {lat:  47.667954, lng: -122.257867}, {lat:  47.667668, lng: -122.258176}, {lat:  47.667463, lng: -122.258418}, {lat:  47.666964, lng: -122.259167}, {lat:  47.666538, lng: -122.260052}, {lat:  47.666122, lng: -122.261165}, {lat:  47.665999, lng: -122.261647}, {lat:  47.665878, lng: -122.261866}, {lat:  47.66585, lng: -122.262017}, {lat:  47.665782, lng: -122.262205}, {lat:  47.665806, lng: -122.262358}, {lat:  47.665816, lng: -122.262567}, {lat:  47.665801, lng: -122.262681}, {lat:  47.665721, lng: -122.262869}, {lat:  47.665654, lng: -122.263057}, {lat:  47.665521, lng: -122.263357}, {lat:  47.665473, lng: -122.263655}, {lat:  47.665441, lng: -122.263974}, {lat:  47.665368, lng: -122.264331}, {lat:  47.66526, lng: -122.264768}, {lat:  47.665145, lng: -122.265274}, {lat:  47.6651, lng: -122.265512}, {lat:  47.665028, lng: -122.26585}, {lat:  47.664958, lng: -122.266121}, {lat:  47.664956, lng: -122.266127}, {lat:  47.66483, lng: -122.266403}, {lat:  47.664731, lng: -122.2667}, {lat:  47.664605, lng: -122.266996}, {lat:  47.664539, lng: -122.267116}, {lat:  47.664307, lng: -122.267166}, {lat:  47.663559, lng: -122.267022}, {lat:  47.663306, lng: -122.266915}, {lat:  47.663018, lng: -122.266868}, {lat:  47.662748, lng: -122.266883}, {lat:  47.662524, lng: -122.266958}, {lat:  47.662327, lng: -122.267104}, {lat:  47.662229, lng: -122.267225}, {lat:  47.66205, lng: -122.267365}, {lat:  47.661781, lng: -122.267477}, {lat:  47.661487, lng: -122.267511}, {lat:  47.661286, lng: -122.267586}, {lat:  47.66127, lng: -122.267584}, {lat:  47.660953, lng: -122.267542}, {lat:  47.660665, lng: -122.267603}, {lat:  47.659749, lng: -122.267796}, {lat:  47.659487, lng: -122.268}, {lat:  47.659156, lng: -122.268128}, {lat:  47.658901, lng: -122.268206}, {lat:  47.658785, lng: -122.268272}, {lat:  47.658587, lng: -122.268383}, {lat:  47.658322, lng: -122.268519}, {lat:  47.658007, lng: -122.26871}, {lat:  47.657682, lng: -122.268944}, {lat:  47.657557, lng: -122.269058}, {lat:  47.657402, lng: -122.2692}, {lat:  47.657266, lng: -122.26925}, {lat:  47.657114, lng: -122.269406}, {lat:  47.657034, lng: -122.269537}, {lat:  47.656786, lng: -122.270258}, {lat:  47.656582, lng: -122.270615}, {lat:  47.656521, lng: -122.270908}, {lat:  47.6562, lng: -122.271372}, {lat:  47.655932, lng: -122.271712}, {lat:  47.655793, lng: -122.271943}, {lat:  47.655692, lng: -122.272111}, {lat:  47.655184, lng: -122.27155}, {lat:  47.65498, lng: -122.271956}, {lat:  47.655451, lng: -122.272492}, {lat:  47.654628, lng: -122.273304}, {lat:  47.654102, lng: -122.273995}, {lat:  47.654101, lng: -122.273995}, {lat:  47.653691, lng: -122.274432}, {lat:  47.653433, lng: -122.274945}, {lat:  47.653291, lng: -122.275335}, {lat:  47.653185, lng: -122.27557}, {lat:  47.652891, lng: -122.275977}, {lat:  47.652596, lng: -122.276286}, {lat:  47.652389, lng: -122.276384}, {lat:  47.652021, lng: -122.276456}, {lat:  47.651903, lng: -122.276375}, {lat:  47.651768, lng: -122.276367}, {lat:  47.651236, lng: -122.276148}, {lat:  47.65092, lng: -122.275977}, {lat:  47.650694, lng: -122.275735}, {lat:  47.650576, lng: -122.275572}, {lat:  47.650286, lng: -122.275273}, {lat:  47.650168, lng: -122.275191}, {lat:  47.649943, lng: -122.275143}, {lat:  47.649655, lng: -122.275143}, {lat:  47.649152, lng: -122.275191}, {lat:  47.648972, lng: -122.275249}, {lat:  47.648615, lng: -122.275695}, {lat:  47.648463, lng: -122.275808}, {lat:  47.648284, lng: -122.276036}, {lat:  47.648222, lng: -122.276149}, {lat:  47.648089, lng: -122.27641}, {lat:  47.648044, lng: -122.27654}, {lat:  47.648029, lng: -122.276946}, {lat:  47.648077, lng: -122.27736}, {lat:  47.648134, lng: -122.277578}, {lat:  47.648187, lng: -122.277781}, {lat:  47.64836, lng: -122.278073}, {lat:  47.64856, lng: -122.278349}, {lat:  47.648678, lng: -122.278472}, {lat:  47.648804, lng: -122.278536}, {lat:  47.648921, lng: -122.278512}, {lat:  47.649118, lng: -122.278341}, {lat:  47.649297, lng: -122.278349}, {lat:  47.649622, lng: -122.278454}, {lat:  47.649749, lng: -122.278535}, {lat:  47.649913, lng: -122.278893}, {lat:  47.650013, lng: -122.279023}, {lat:  47.650211, lng: -122.279063}, {lat:  47.650391, lng: -122.279046}, {lat:  47.650688, lng: -122.27912}, {lat:  47.650806, lng: -122.279208}, {lat:  47.650878, lng: -122.279297}, {lat:  47.650952, lng: -122.279524}, {lat:  47.650961, lng: -122.279647}, {lat:  47.651125, lng: -122.279955}, {lat:  47.651225, lng: -122.280109}, {lat:  47.65156, lng: -122.280353}, {lat:  47.651833, lng: -122.28088}, {lat:  47.651923, lng: -122.281017}, {lat:  47.652348, lng: -122.281334}, {lat:  47.652466, lng: -122.281391}, {lat:  47.652736, lng: -122.281408}, {lat:  47.652924, lng: -122.281335}, {lat:  47.653291, lng: -122.281034}, {lat:  47.653373, lng: -122.28109}, {lat:  47.653439, lng: -122.2812}, {lat:  47.653555, lng: -122.281391}, {lat:  47.653682, lng: -122.281691}, {lat:  47.65371, lng: -122.281853}, {lat:  47.653748, lng: -122.282112}, {lat:  47.653958, lng: -122.282526}, {lat:  47.65413, lng: -122.282713}, {lat:  47.654221, lng: -122.282916}, {lat:  47.654466, lng: -122.283314}, {lat:  47.654639, lng: -122.283548}, {lat:  47.654685, lng: -122.283646}, {lat:  47.654659, lng: -122.283988}, {lat:  47.654637, lng: -122.284685}, {lat:  47.654647, lng: -122.284863}, {lat:  47.654721, lng: -122.285156}, {lat:  47.654876, lng: -122.285433}, {lat:  47.654894, lng: -122.28557}, {lat:  47.654762, lng: -122.285938}, {lat:  47.654872, lng: -122.286325}, {lat:  47.654954, lng: -122.286414}, {lat:  47.654758, lng: -122.286714}, {lat:  47.654758, lng: -122.286763}, {lat:  47.654758, lng: -122.286878}, {lat:  47.654804, lng: -122.286982}, {lat:  47.655067, lng: -122.287218}, {lat:  47.655121, lng: -122.287202}, {lat:  47.655191, lng: -122.287007}, {lat:  47.655251, lng: -122.286762}, {lat:  47.65527, lng: -122.286683}, {lat:  47.655432, lng: -122.286633}, {lat:  47.655765, lng: -122.286731}, {lat:  47.655931, lng: -122.286762}, {lat:  47.655982, lng: -122.286772}, {lat:  47.656135, lng: -122.286779}, {lat:  47.656163, lng: -122.286982}, {lat:  47.656127, lng: -122.287096}, {lat:  47.656128, lng: -122.287209}, {lat:  47.656219, lng: -122.287364}, {lat:  47.656508, lng: -122.287533}, {lat:  47.656652, lng: -122.287574}, {lat:  47.656697, lng: -122.28742}, {lat:  47.656795, lng: -122.287281}, {lat:  47.656804, lng: -122.287388}, {lat:  47.656787, lng: -122.287542}, {lat:  47.656824, lng: -122.287728}, {lat:  47.656879, lng: -122.287891}, {lat:  47.656988, lng: -122.287914}, {lat:  47.657051, lng: -122.288012}, {lat:  47.656989, lng: -122.288142}, {lat:  47.656908, lng: -122.28824}, {lat:  47.656326, lng: -122.288598}, {lat:  47.656254, lng: -122.288605}, {lat:  47.656181, lng: -122.288541}, {lat:  47.656145, lng: -122.288452}, {lat:  47.656162, lng: -122.288274}, {lat:  47.656304, lng: -122.287963}, {lat:  47.65632, lng: -122.287728}, {lat:  47.656203, lng: -122.287681}, {lat:  47.65597, lng: -122.287729}, {lat:  47.655727, lng: -122.287827}, {lat:  47.655342, lng: -122.288177}, {lat:  47.655209, lng: -122.288363}, {lat:  47.655138, lng: -122.288565}, {lat:  47.655043, lng: -122.289223}, {lat:  47.655027, lng: -122.289499}, {lat:  47.654966, lng: -122.289817}, {lat:  47.654869, lng: -122.290222}, {lat:  47.654807, lng: -122.290359}, {lat:  47.65479, lng: -122.290489}, {lat:  47.654736, lng: -122.290547}, {lat:  47.65461, lng: -122.290514}, {lat:  47.654367, lng: -122.290571}, {lat:  47.654196, lng: -122.290546}, {lat:  47.654035, lng: -122.290619}, {lat:  47.653946, lng: -122.290726}, {lat:  47.653912, lng: -122.291148}, {lat:  47.653881, lng: -122.291887}, {lat:  47.653788, lng: -122.292829}, {lat:  47.653795, lng: -122.29398}, {lat:  47.65377, lng: -122.294281}, {lat:  47.653644, lng: -122.294346}, {lat:  47.653651, lng: -122.293947}, {lat:  47.653631, lng: -122.293736}, {lat:  47.653568, lng: -122.293737}, {lat:  47.653524, lng: -122.293842}, {lat:  47.653554, lng: -122.294347}, {lat:  47.653519, lng: -122.294533}, {lat:  47.653402, lng: -122.294533}, {lat:  47.653356, lng: -122.294338}, {lat:  47.653373, lng: -122.294224}, {lat:  47.653301, lng: -122.294143}, {lat:  47.653203, lng: -122.294241}, {lat:  47.652736, lng: -122.294444}, {lat:  47.652782, lng: -122.294655}, {lat:  47.652685, lng: -122.294891}, {lat:  47.652677, lng: -122.295053}, {lat:  47.652687, lng: -122.295256}, {lat:  47.652798, lng: -122.295718}, {lat:  47.652798, lng: -122.295856}, {lat:  47.65273, lng: -122.296432}, {lat:  47.652759, lng: -122.296732}, {lat:  47.653176, lng: -122.297195}, {lat:  47.653239, lng: -122.297318}, {lat:  47.65333, lng: -122.297414}, {lat:  47.653401, lng: -122.297243}, {lat:  47.653562, lng: -122.297502}, {lat:  47.653664, lng: -122.297666}, {lat:  47.653657, lng: -122.298007}, {lat:  47.653454, lng: -122.298503}, {lat:  47.653452, lng: -122.298227}, {lat:  47.653469, lng: -122.298122}, {lat:  47.65345, lng: -122.297951}, {lat:  47.653351, lng: -122.297902}, {lat:  47.65328, lng: -122.298081}, {lat:  47.653247, lng: -122.298511}, {lat:  47.653171, lng: -122.299306}, {lat:  47.653153, lng: -122.299404}, {lat:  47.653082, lng: -122.299452}, {lat:  47.652461, lng: -122.299533}, {lat:  47.652422, lng: -122.29895}, {lat:  47.652375, lng: -122.29868}, {lat:  47.652247, lng: -122.298389}, {lat:  47.652075, lng: -122.298186}, {lat:  47.65201, lng: -122.297951}, {lat:  47.651902, lng: -122.297829}, {lat:  47.652234, lng: -122.297732}, {lat:  47.652584, lng: -122.297569}, {lat:  47.652764, lng: -122.297455}, {lat:  47.65261, lng: -122.297342}, {lat:  47.652492, lng: -122.297196}, {lat:  47.652136, lng: -122.296351}, {lat:  47.652017, lng: -122.296125}, {lat:  47.651847, lng: -122.296172}, {lat:  47.651747, lng: -122.296101}, {lat:  47.651513, lng: -122.296019}, {lat:  47.65136, lng: -122.296019}, {lat:  47.651136, lng: -122.296117}, {lat:  47.650939, lng: -122.296336}, {lat:  47.650804, lng: -122.296345}, {lat:  47.650688, lng: -122.296449}, {lat:  47.65059, lng: -122.296587}, {lat:  47.650214, lng: -122.296962}, {lat:  47.650161, lng: -122.297074}, {lat:  47.650161, lng: -122.297212}, {lat:  47.6501, lng: -122.297399}, {lat:  47.650109, lng: -122.29752}, {lat:  47.650201, lng: -122.297749}, {lat:  47.650418, lng: -122.297935}, {lat:  47.650553, lng: -122.297959}, {lat:  47.650698, lng: -122.29817}, {lat:  47.650646, lng: -122.298446}, {lat:  47.650592, lng: -122.298536}, {lat:  47.649767, lng: -122.298837}, {lat:  47.648735, lng: -122.299284}, {lat:  47.648555, lng: -122.299299}, {lat:  47.648321, lng: -122.299412}, {lat:  47.648233, lng: -122.299583}, {lat:  47.648174, lng: -122.299466}, {lat:  47.64816, lng: -122.299438}, {lat:  47.647971, lng: -122.299566}, {lat:  47.647783, lng: -122.299608}, {lat:  47.647656, lng: -122.299568}, {lat:  47.647585, lng: -122.299584}, {lat:  47.647613, lng: -122.299842}, {lat:  47.647544, lng: -122.300256}, {lat:  47.647528, lng: -122.300671}, {lat:  47.64753, lng: -122.300899}, {lat:  47.647549, lng: -122.301126}, {lat:  47.647525, lng: -122.302586}, {lat:  47.64759, lng: -122.304041}, {lat:  47.647582, lng: -122.304596}, {lat:  47.647568, lng: -122.305461}, {lat:  47.647523, lng: -122.306457}, {lat:  47.647515, lng: -122.306657}, {lat:  47.647519, lng: -122.306792}, {lat:  47.647607, lng: -122.307477}, {lat:  47.647668, lng: -122.307985}, {lat:  47.647709, lng: -122.308534}, {lat:  47.647785, lng: -122.309011}, {lat:  47.64793, lng: -122.309553}, {lat:  47.648037, lng: -122.309887}, {lat:  47.648216, lng: -122.310054}, {lat:  47.648243, lng: -122.31008}, {lat:  47.648321, lng: -122.310052}, {lat:  47.648398, lng: -122.309993}, {lat:  47.648549, lng: -122.310163}, {lat:  47.648603, lng: -122.31031}, {lat:  47.648655, lng: -122.310518}, {lat:  47.648709, lng: -122.310685}, {lat:  47.648663, lng: -122.31089}, {lat:  47.648888, lng: -122.311249}, {lat:  47.648938, lng: -122.311178}, {lat:  47.64904, lng: -122.311357}, {lat:  47.649245, lng: -122.311653}, {lat:  47.649464, lng: -122.311909}, {lat:  47.649587, lng: -122.31213}, {lat:  47.649686, lng: -122.312286}, {lat:  47.649909, lng: -122.312637}, {lat:  47.650084, lng: -122.312886}, {lat:  47.65037, lng: -122.313121}, {lat:  47.650538, lng: -122.313304}, {lat:  47.65063, lng: -122.313404}, {lat:  47.65068, lng: -122.313458}, {lat:  47.650851, lng: -122.313645}, {lat:  47.651032, lng: -122.313866}, {lat:  47.65124, lng: -122.314049}, {lat:  47.651368, lng: -122.314308}, {lat:  47.651522, lng: -122.314586}, {lat:  47.651597, lng: -122.314853}, {lat:  47.651632, lng: -122.315147}, {lat:  47.65169, lng: -122.315286}, {lat:  47.651713, lng: -122.315462}, {lat:  47.651738, lng: -122.315541}, {lat:  47.651742, lng: -122.315737}, {lat:  47.651753, lng: -122.315874}, {lat:  47.651764, lng: -122.315991}, {lat:  47.651749, lng: -122.316128}, {lat:  47.651801, lng: -122.316188}, {lat:  47.651853, lng: -122.316248}, {lat:  47.652271, lng: -122.316946}, {lat:  47.652531, lng: -122.316779}, {lat:  47.652727, lng: -122.317323}, {lat:  47.653191, lng: -122.317924}, {lat:  47.653571, lng: -122.318422}, {lat:  47.653883, lng: -122.318684}, {lat:  47.654072, lng: -122.318978}, {lat:  47.654202, lng: -122.319247}, {lat:  47.654213, lng: -122.31927}, {lat:  47.654329, lng: -122.319633}, {lat:  47.654396, lng: -122.319995}, {lat:  47.6544, lng: -122.320534}, {lat:  47.654392, lng: -122.321073}, {lat:  47.653706, lng: -122.321032}, {lat:  47.653706, lng: -122.321067}, {lat:  47.653707, lng: -122.321168}, {lat:  47.653709, lng: -122.32127}, {lat:  47.65371, lng: -122.321371}, {lat:  47.653711, lng: -122.321472}, {lat:  47.653712, lng: -122.321574}, {lat:  47.653713, lng: -122.321675}, {lat:  47.653714, lng: -122.321713}, {lat:  47.653714, lng: -122.321714}, {lat:  47.653896, lng: -122.321738}, {lat:  47.653917, lng: -122.321954}, {lat:  47.653735, lng: -122.32193}, {lat:  47.653718, lng: -122.322066}, {lat:  47.653718, lng: -122.322083}, {lat:  47.653721, lng: -122.322358}, {lat:  47.653723, lng: -122.322489}, {lat:  47.653723, lng: -122.3225}, {lat:  47.653703, lng: -122.322602}, {lat:  47.653651, lng: -122.322868}, {lat:  47.65365, lng: -122.322876}, {lat:  47.653643, lng: -122.322909}, {lat:  47.653627, lng: -122.32299}, {lat:  47.653623, lng: -122.32301}, {lat:  47.65361, lng: -122.323079}, {lat:  47.653592, lng: -122.323172}, {lat:  47.65356, lng: -122.323333}, {lat:  47.653544, lng: -122.323414}, {lat:  47.65352, lng: -122.323537}, {lat:  47.653497, lng: -122.323659}, {lat:  47.653464, lng: -122.323823}, {lat:  47.653447, lng: -122.323911}, {lat:  47.653433, lng: -122.323986}, {lat:  47.653423, lng: -122.324036}, {lat:  47.653422, lng: -122.324111}, {lat:  47.653418, lng: -122.324362}, {lat:  47.653463, lng: -122.324579}, {lat:  47.653426, lng: -122.325369}, {lat:  47.653385, lng: -122.325655}, {lat:  47.653323, lng: -122.325796}, {lat:  47.653268, lng: -122.326154}, {lat:  47.653262, lng: -122.326549}, {lat:  47.653236, lng: -122.326692}, {lat:  47.653083, lng: -122.326858}, {lat:  47.652964, lng: -122.326988}, {lat:  47.652619, lng: -122.327299}, {lat:  47.652152, lng: -122.327715}, {lat:  47.651757, lng: -122.328132}, {lat:  47.65135, lng: -122.328513}, {lat:  47.651565, lng: -122.328754}, {lat:  47.651574, lng: -122.328934}, {lat:  47.651472, lng: -122.329254}, {lat:  47.651274, lng: -122.329517}, {lat:  47.650785, lng: -122.330041}, {lat:  47.650483, lng: -122.330485}, {lat:  47.650266, lng: -122.330791}, {lat:  47.649895, lng: -122.331162}, {lat:  47.649692, lng: -122.331278}, {lat:  47.649597, lng: -122.33137}, {lat:  47.649381, lng: -122.331581}, {lat:  47.649071, lng: -122.331814}, {lat:  47.648126, lng: -122.331171}, {lat:  47.646982, lng: -122.332702}, {lat:  47.646934, lng: -122.332805}, {lat:  47.64672, lng: -122.332903}, {lat:  47.646342, lng: -122.332925}, {lat:  47.646037, lng: -122.332844}, {lat:  47.645494, lng: -122.332895}, {lat:  47.645091, lng: -122.333021}, {lat:  47.644876, lng: -122.333223}, {lat:  47.644731, lng: -122.33341}, {lat:  47.644701, lng: -122.333827}, {lat:  47.644473, lng: -122.334116}, {lat:  47.644459, lng: -122.33455}, {lat:  47.644459, lng: -122.33464}, {lat:  47.64446, lng: -122.334952}, {lat:  47.644461, lng: -122.335195}, {lat:  47.644461, lng: -122.335433}, {lat:  47.644462, lng: -122.335674}, {lat:  47.644462, lng: -122.335765}, {lat:  47.644674, lng: -122.336321}, {lat:  47.644795, lng: -122.336703}, {lat:  47.644831, lng: -122.336815}, {lat:  47.645084, lng: -122.337242}, {lat:  47.645235, lng: -122.337352}, {lat:  47.645293, lng: -122.337406}, {lat:  47.64563, lng: -122.336947}, {lat:  47.646275, lng: -122.337964}, {lat:  47.64685, lng: -122.338873}, {lat:  47.647179, lng: -122.339687}, {lat:  47.647478, lng: -122.340168}, {lat:  47.647604, lng: -122.34047}, {lat:  47.647713, lng: -122.340862}, {lat:  47.647824, lng: -122.341586}, {lat:  47.647888, lng: -122.342146}, {lat:  47.647939, lng: -122.342354}, {lat:  47.647939, lng: -122.342354}, {lat:  47.64794, lng: -122.34236}, {lat:  47.648048, lng: -122.342801}, {lat:  47.648061, lng: -122.342887}, {lat:  47.648081, lng: -122.343018}, {lat:  47.648116, lng: -122.343136}, {lat:  47.648146, lng: -122.343533}, {lat:  47.648246, lng: -122.34415}, {lat:  47.648324, lng: -122.34462}, {lat:  47.648378, lng: -122.345055}, {lat:  47.648556, lng: -122.346115}, {lat:  47.648589, lng: -122.346702}, {lat:  47.648562, lng: -122.346845}, {lat:  47.648525, lng: -122.346925}, {lat:  47.64828, lng: -122.347024}, {lat:  47.648097, lng: -122.347036}, {lat:  47.647944, lng: -122.347039}, {lat:  47.647749, lng: -122.347105}, {lat:  47.647662, lng: -122.347252}, {lat:  47.647637, lng: -122.347293}, {lat:  47.648523, lng: -122.347299}, {lat:  47.648745, lng: -122.347304}, {lat:  47.648844, lng: -122.347306}, {lat:  47.648844, lng: -122.347308}, {lat:  47.648915, lng: -122.347308}, {lat:  47.649045, lng: -122.347308}, {lat:  47.649136, lng: -122.347308}, {lat:  47.649139, lng: -122.347308}, {lat:  47.6492, lng: -122.347309}, {lat:  47.649224, lng: -122.347309}, {lat:  47.649347, lng: -122.347309}, {lat:  47.649407, lng: -122.347309}, {lat:  47.649989, lng: -122.347311}, {lat:  47.650141, lng: -122.347311}, {lat:  47.650952, lng: -122.347313}, {lat:  47.650954, lng: -122.347313}, {lat:  47.651351, lng: -122.347314}, {lat:  47.651417, lng: -122.347314}, {lat:  47.652624, lng: -122.347317}, {lat:  47.652646, lng: -122.347317}, {lat:  47.652726, lng: -122.347318}, {lat:  47.652768, lng: -122.347318}, {lat:  47.654133, lng: -122.347319}, {lat:  47.655395, lng: -122.347323}, {lat:  47.656657, lng: -122.347328}, {lat:  47.657742, lng: -122.347331}, {lat:  47.65865, lng: -122.347333}, {lat:  47.658675, lng: -122.347333}, {lat:  47.659333, lng: -122.347334}, {lat:  47.659579, lng: -122.347335}, {lat:  47.660046, lng: -122.347336}, {lat:  47.66048, lng: -122.347337}, {lat:  47.660525, lng: -122.347337}, {lat:  47.660567, lng: -122.347337}, {lat:  47.660759, lng: -122.347337}, {lat:  47.661393, lng: -122.347339}, {lat:  47.661393, lng: -122.347389}, {lat:  47.661393, lng: -122.347644}, {lat:  47.661393, lng: -122.347339}, {lat:  47.661432, lng: -122.34734}, {lat:  47.661474, lng: -122.34734}, {lat:  47.662021, lng: -122.347336}, {lat:  47.662074, lng: -122.347336}, {lat:  47.662131, lng: -122.347335}, {lat:  47.662871, lng: -122.34733}, {lat:  47.663584, lng: -122.347324}, {lat:  47.664296, lng: -122.347319}, {lat:  47.665009, lng: -122.347311}, {lat:  47.665009, lng: -122.347116}, {lat:  47.665007, lng: -122.346159}, {lat:  47.665007, lng: -122.346129}, {lat:  47.665007, lng: -122.346064}, {lat:  47.665007, lng: -122.346063}, {lat:  47.665004, lng: -122.344734}, {lat:  47.665004, lng: -122.344519}, {lat:  47.665002, lng: -122.343736}, {lat:  47.665006, lng: -122.343664}, {lat:  47.665035, lng: -122.342194}, {lat:  47.665037, lng: -122.342082}, {lat:  47.665036, lng: -122.340621}, {lat:  47.665035, lng: -122.340311}, {lat:  47.665035, lng: -122.340263}, {lat:  47.665034, lng: -122.340207}, {lat:  47.665034, lng: -122.3401}, {lat:  47.665035, lng: -122.33929}, {lat:  47.665035, lng: -122.339289}, {lat:  47.665034, lng: -122.339127}, {lat:  47.665035, lng: -122.339007}, {lat:  47.665035, lng: -122.338504}, {lat:  47.665035, lng: -122.337669}, {lat:  47.665035, lng: -122.33641}, {lat:  47.665036, lng: -122.335152}, {lat:  47.665036, lng: -122.333719}, {lat:  47.665036, lng: -122.33371}, {lat:  47.665036, lng: -122.33369}, {lat:  47.66502, lng: -122.331012}, {lat:  47.665017, lng: -122.330583}, {lat:  47.665012, lng: -122.329599}, {lat:  47.665009, lng: -122.329062}, {lat:  47.665003, lng: -122.328311}, {lat:  47.665003, lng: -122.328268}, {lat:  47.665003, lng: -122.328233}, {lat:  47.664997, lng: -122.327197}, {lat:  47.664991, lng: -122.326126}, {lat:  47.664988, lng: -122.325608}, {lat:  47.664984, lng: -122.325054}, {lat:  47.664978, lng: -122.323983}, {lat:  47.664975, lng: -122.323572}, {lat:  47.664971, lng: -122.322869}, {lat:  47.664971, lng: -122.322863}, {lat:  47.664971, lng: -122.322862}, {lat:  47.664971, lng: -122.322854}, {lat:  47.66497, lng: -122.322683}, {lat:  47.664969, lng: -122.3225}, {lat:  47.664964, lng: -122.32225}, {lat:  47.664963, lng: -122.322204}, {lat:  47.664964, lng: -122.322158}, {lat:  47.664966, lng: -122.321991}, {lat:  47.667137, lng: -122.32198}, {lat:  47.667278, lng: -122.321979}, {lat:  47.667727, lng: -122.321976}, {lat:  47.668608, lng: -122.32197}, {lat:  47.66933, lng: -122.321961}, {lat:  47.669334, lng: -122.321961}, {lat:  47.669466, lng: -122.321963}, {lat:  47.669529, lng: -122.321964}, {lat:  47.669542, lng: -122.321964}, {lat:  47.669993, lng: -122.32195}, {lat:  47.670098, lng: -122.321944}, {lat:  47.670556, lng: -122.321908}, {lat:  47.670728, lng: -122.321888}, {lat:  47.67077, lng: -122.321882}, {lat:  47.67133, lng: -122.3218}, {lat:  47.671386, lng: -122.32179}, {lat:  47.671511, lng: -122.321766}, {lat:  47.671678, lng: -122.321732}, {lat:  47.671847, lng: -122.321694}, {lat:  47.672011, lng: -122.321657}, {lat:  47.672142, lng: -122.321624}, {lat:  47.672232, lng: -122.321598}, {lat:  47.672235, lng: -122.321598}, {lat:  47.67224, lng: -122.321596}, {lat:  47.673282, lng: -122.321295}, {lat:  47.673727, lng: -122.321163}, {lat:  47.673976, lng: -122.321089}, {lat:  47.674334, lng: -122.320983}, {lat:  47.674334, lng: -122.32099}, {lat:  47.674334, lng: -122.320991}, {lat:  47.674362, lng: -122.320983}, {lat:  47.674815, lng: -122.320876}, {lat:  47.675855, lng: -122.320705}, {lat:  47.675857, lng: -122.320705}, {lat:  47.675858, lng: -122.320705}, {lat:  47.675877, lng: -122.320703}, {lat:  47.67615, lng: -122.320676}, {lat:  47.676424, lng: -122.320656}, {lat:  47.676699, lng: -122.320643}, {lat:  47.676973, lng: -122.320637}, {lat:  47.67725, lng: -122.320642}, {lat:  47.677512, lng: -122.320646}, {lat:  47.678045, lng: -122.320669}, {lat:  47.678238, lng: -122.320677}, {lat:  47.678444, lng: -122.320686}, {lat:  47.678444, lng: -122.320686}, {lat:  47.678746, lng: -122.320699}, {lat:  47.678775, lng: -122.3207}, {lat:  47.679259, lng: -122.320721}, {lat:  47.679503, lng: -122.320731}, {lat:  47.679586, lng: -122.320735}, {lat:  47.680202, lng: -122.320761}, {lat:  47.680728, lng: -122.320818}, {lat:  47.680893, lng: -122.320836}, {lat:  47.680933, lng: -122.32084}, {lat:  47.680942, lng: -122.320842}, {lat:  47.680955, lng: -122.320844}, {lat:  47.680959, lng: -122.320844}, {lat:  47.680989, lng: -122.320851}, {lat:  47.680989, lng: -122.320851}, {lat:  47.68099, lng: -122.320851}, {lat:  47.681068, lng: -122.320867}, {lat:  47.681075, lng: -122.320869}, {lat:  47.681133, lng: -122.320883}, {lat:  47.681176, lng: -122.320893}, {lat:  47.681261, lng: -122.320916}, {lat:  47.681284, lng: -122.320922}, {lat:  47.681392, lng: -122.320953}, {lat:  47.681412, lng: -122.32096}, {lat:  47.681499, lng: -122.320988}, {lat:  47.681514, lng: -122.320993}, {lat:  47.68163, lng: -122.32103}, {lat:  47.681699, lng: -122.321059}, {lat:  47.681712, lng: -122.321064}, {lat:  47.681736, lng: -122.321074}, {lat:  47.681818, lng: -122.321106}, {lat:  47.681863, lng: -122.321126}, {lat:  47.681923, lng: -122.321152}, {lat:  47.681935, lng: -122.321157}, {lat:  47.682028, lng: -122.321199}, {lat:  47.682033, lng: -122.321202}, {lat:  47.682132, lng: -122.32125}, {lat:  47.682236, lng: -122.321304}, {lat:  47.682289, lng: -122.321332}, {lat:  47.682339, lng: -122.321359}, {lat:  47.682441, lng: -122.321418}, {lat:  47.682543, lng: -122.321479}, {lat:  47.682644, lng: -122.321543}, {lat:  47.682662, lng: -122.321555}, {lat:  47.682723, lng: -122.321596}, {lat:  47.682744, lng: -122.32161}, {lat:  47.682843, lng: -122.321679}, {lat:  47.682942, lng: -122.32175}, {lat:  47.683039, lng: -122.321825}, {lat:  47.683165, lng: -122.321929}, {lat:  47.68326, lng: -122.322008}, {lat:  47.683355, lng: -122.32209}, {lat:  47.683448, lng: -122.322175}, {lat:  47.683541, lng: -122.322262}, {lat:  47.683633, lng: -122.322351}, {lat:  47.68364, lng: -122.322359}, {lat:  47.683681, lng: -122.3224}, {lat:  47.683723, lng: -122.322443}, {lat:  47.683813, lng: -122.322537}, {lat:  47.683901, lng: -122.322633}, {lat:  47.683988, lng: -122.322731}, {lat:  47.684074, lng: -122.322832}, {lat:  47.684088, lng: -122.322849}, {lat:  47.684142, lng: -122.322915}, {lat:  47.68423, lng: -122.323024}, {lat:  47.684264, lng: -122.323067}, {lat:  47.684994, lng: -122.324}, {lat:  47.685209, lng: -122.324275}, {lat:  47.685319, lng: -122.324416}, {lat:  47.685874, lng: -122.325124}, {lat:  47.686276, lng: -122.325638}, {lat:  47.686782, lng: -122.326284}, {lat:  47.686827, lng: -122.326341}, {lat:  47.687348, lng: -122.327007}, {lat:  47.687377, lng: -122.327044}, {lat:  47.68752, lng: -122.327226}, {lat:  47.687633, lng: -122.327353}, {lat:  47.687737, lng: -122.32747}, {lat:  47.687738, lng: -122.327471}, {lat:  47.687778, lng: -122.327515}, {lat:  47.687867, lng: -122.32761}, {lat:  47.687958, lng: -122.327702}, {lat:  47.687977, lng: -122.327721}, {lat:  47.688081, lng: -122.327827}, {lat:  47.688182, lng: -122.327916}, {lat:  47.688235, lng: -122.327964}, {lat:  47.688329, lng: -122.328047}, {lat:  47.688425, lng: -122.328127}, {lat:  47.688521, lng: -122.328205}, {lat:  47.688618, lng: -122.32828}, {lat:  47.688629, lng: -122.328288}, {lat:  47.688717, lng: -122.328353}, {lat:  47.688718, lng: -122.328354}, {lat:  47.688721, lng: -122.328356}, {lat:  47.688723, lng: -122.328358}, {lat:  47.688726, lng: -122.32836}, {lat:  47.688728, lng: -122.328361}, {lat:  47.688731, lng: -122.328363}, {lat:  47.688733, lng: -122.328365}, {lat:  47.688736, lng: -122.328367}, {lat:  47.688738, lng: -122.328368}, {lat:  47.688741, lng: -122.32837}, {lat:  47.688743, lng: -122.328372}, {lat:  47.688745, lng: -122.328374}, {lat:  47.688748, lng: -122.328376}, {lat:  47.68875, lng: -122.328377}, {lat:  47.688753, lng: -122.328379}, {lat:  47.688755, lng: -122.328381}, {lat:  47.688758, lng: -122.328383}, {lat:  47.68876, lng: -122.328384}, {lat:  47.688763, lng: -122.328386}, {lat:  47.688765, lng: -122.328388}, {lat:  47.688768, lng: -122.32839}, {lat:  47.68877, lng: -122.328391}, {lat:  47.688773, lng: -122.328393}, {lat:  47.688775, lng: -122.328395}, {lat:  47.688778, lng: -122.328397}, {lat:  47.68878, lng: -122.328398}, {lat:  47.688783, lng: -122.3284}, {lat:  47.688785, lng: -122.328402}, {lat:  47.688788, lng: -122.328404}, {lat:  47.68879, lng: -122.328405}, {lat:  47.688792, lng: -122.328407}, {lat:  47.688795, lng: -122.328409}, {lat:  47.688797, lng: -122.328411}, {lat:  47.6888, lng: -122.328412}, {lat:  47.688802, lng: -122.328414}, {lat:  47.688805, lng: -122.328416}, {lat:  47.688807, lng: -122.328417}, {lat:  47.68881, lng: -122.328419}, {lat:  47.688812, lng: -122.328421}, {lat:  47.688815, lng: -122.328423}, {lat:  47.688817, lng: -122.328424}, {lat:  47.68882, lng: -122.328426}, {lat:  47.688822, lng: -122.328428}, {lat:  47.688825, lng: -122.328429}, {lat:  47.688827, lng: -122.328431}, {lat:  47.68883, lng: -122.328433}, {lat:  47.688832, lng: -122.328435}, {lat:  47.688835, lng: -122.328436}, {lat:  47.688837, lng: -122.328438}, {lat:  47.68884, lng: -122.32844}, {lat:  47.688842, lng: -122.328441}, {lat:  47.688845, lng: -122.328443}, {lat:  47.688847, lng: -122.328445}, {lat:  47.68885, lng: -122.328447}, {lat:  47.688852, lng: -122.328448}, {lat:  47.688855, lng: -122.32845}, {lat:  47.688857, lng: -122.328452}, {lat:  47.68886, lng: -122.328453}, {lat:  47.688862, lng: -122.328455}, {lat:  47.688865, lng: -122.328457}, {lat:  47.688867, lng: -122.328458}, {lat:  47.68887, lng: -122.32846}, {lat:  47.688872, lng: -122.328462}, {lat:  47.688875, lng: -122.328463}, {lat:  47.688877, lng: -122.328465}, {lat:  47.68888, lng: -122.328467}, {lat:  47.688882, lng: -122.328468}, {lat:  47.688885, lng: -122.32847}, {lat:  47.688887, lng: -122.328472}, {lat:  47.68889, lng: -122.328474}, {lat:  47.688892, lng: -122.328475}, {lat:  47.688895, lng: -122.328477}, {lat:  47.688897, lng: -122.328479}, {lat:  47.6889, lng: -122.32848}, {lat:  47.688902, lng: -122.328482}, {lat:  47.688905, lng: -122.328484}, {lat:  47.688907, lng: -122.328485}, {lat:  47.68891, lng: -122.328487}, {lat:  47.688912, lng: -122.328489}, {lat:  47.688915, lng: -122.32849}, {lat:  47.688917, lng: -122.328492}, {lat:  47.68892, lng: -122.328493}, {lat:  47.688922, lng: -122.328495}, {lat:  47.688925, lng: -122.328497}, {lat:  47.688927, lng: -122.328498}, {lat:  47.68893, lng: -122.3285}, {lat:  47.688932, lng: -122.328502}, {lat:  47.688935, lng: -122.328503}, {lat:  47.688937, lng: -122.328505}, {lat:  47.68894, lng: -122.328507}, {lat:  47.688942, lng: -122.328508}, {lat:  47.688945, lng: -122.32851}, {lat:  47.688947, lng: -122.328512}, {lat:  47.68895, lng: -122.328513}, {lat:  47.688952, lng: -122.328515}, {lat:  47.688955, lng: -122.328516}, {lat:  47.688958, lng: -122.328518}, {lat:  47.68896, lng: -122.32852}, {lat:  47.688963, lng: -122.328522}, {lat:  47.688965, lng: -122.328523}, {lat:  47.688968, lng: -122.328525}, {lat:  47.68897, lng: -122.328527}, {lat:  47.688973, lng: -122.328528}, {lat:  47.688975, lng: -122.32853}, {lat:  47.688978, lng: -122.328531}, {lat:  47.68898, lng: -122.328533}, {lat:  47.688983, lng: -122.328535}, {lat:  47.688985, lng: -122.328536}, {lat:  47.688988, lng: -122.328538}, {lat:  47.68899, lng: -122.32854}, {lat:  47.688993, lng: -122.328541}, {lat:  47.688995, lng: -122.328543}, {lat:  47.688998, lng: -122.328544}, {lat:  47.689001, lng: -122.328546}, {lat:  47.689003, lng: -122.328547}, {lat:  47.689006, lng: -122.328549}, {lat:  47.689008, lng: -122.328551}, {lat:  47.689011, lng: -122.328552}, {lat:  47.689013, lng: -122.328554}, {lat:  47.689016, lng: -122.328555}, {lat:  47.689018, lng: -122.328557}, {lat:  47.689021, lng: -122.328559}, {lat:  47.689023, lng: -122.32856}, {lat:  47.689026, lng: -122.328562}, {lat:  47.689028, lng: -122.328564}, {lat:  47.689031, lng: -122.328565}, {lat:  47.689113, lng: -122.328619}, {lat:  47.689165, lng: -122.328647}, {lat:  47.689168, lng: -122.328648}, {lat:  47.68917, lng: -122.32865}, {lat:  47.689173, lng: -122.328651}, {lat:  47.689175, lng: -122.328652}, {lat:  47.689178, lng: -122.328654}, {lat:  47.689181, lng: -122.328656}, {lat:  47.689183, lng: -122.328657}, {lat:  47.689186, lng: -122.328658}, {lat:  47.689188, lng: -122.32866}, {lat:  47.689191, lng: -122.328661}, {lat:  47.689193, lng: -122.328663}, {lat:  47.689196, lng: -122.328664}, {lat:  47.689198, lng: -122.328666}, {lat:  47.689201, lng: -122.328667}, {lat:  47.689204, lng: -122.328669}, {lat:  47.689206, lng: -122.32867}, {lat:  47.689209, lng: -122.328672}, {lat:  47.689211, lng: -122.328673}, {lat:  47.689214, lng: -122.328675}, {lat:  47.689216, lng: -122.328676}, {lat:  47.689219, lng: -122.328678}, {lat:  47.689221, lng: -122.328679}, {lat:  47.689224, lng: -122.328681}, {lat:  47.689227, lng: -122.328682}, {lat:  47.689229, lng: -122.328683}, {lat:  47.689232, lng: -122.328685}, {lat:  47.689234, lng: -122.328686}, {lat:  47.689237, lng: -122.328688}, {lat:  47.689239, lng: -122.328689}, {lat:  47.689242, lng: -122.328691}, {lat:  47.689244, lng: -122.328692}, {lat:  47.689247, lng: -122.328694}, {lat:  47.68925, lng: -122.328695}, {lat:  47.689252, lng: -122.328696}, {lat:  47.689255, lng: -122.328698}, {lat:  47.689257, lng: -122.328699}, {lat:  47.68926, lng: -122.328701}, {lat:  47.689262, lng: -122.328702}, {lat:  47.689265, lng: -122.328704}, {lat:  47.689268, lng: -122.328705}, {lat:  47.68927, lng: -122.328706}, {lat:  47.689273, lng: -122.328708}, {lat:  47.689275, lng: -122.328709}, {lat:  47.689278, lng: -122.328711}, {lat:  47.68928, lng: -122.328712}, {lat:  47.689283, lng: -122.328714}, {lat:  47.689286, lng: -122.328715}, {lat:  47.689288, lng: -122.328716}, {lat:  47.689291, lng: -122.328718}, {lat:  47.689293, lng: -122.328719}, {lat:  47.689296, lng: -122.328721}, {lat:  47.689298, lng: -122.328722}, {lat:  47.689301, lng: -122.328724}, {lat:  47.689304, lng: -122.328725}, {lat:  47.689306, lng: -122.328726}, {lat:  47.689309, lng: -122.328728}, {lat:  47.689311, lng: -122.328729}, {lat:  47.689314, lng: -122.328731}, {lat:  47.689316, lng: -122.328732}, {lat:  47.689319, lng: -122.328733}, {lat:  47.689322, lng: -122.328735}, {lat:  47.689324, lng: -122.328736}, {lat:  47.689327, lng: -122.328737}, {lat:  47.689329, lng: -122.328739}, {lat:  47.689332, lng: -122.32874}, {lat:  47.689334, lng: -122.328742}, {lat:  47.689337, lng: -122.328743}, {lat:  47.68934, lng: -122.328744}, {lat:  47.689342, lng: -122.328746}, {lat:  47.689345, lng: -122.328747}, {lat:  47.689347, lng: -122.328749}, {lat:  47.689351, lng: -122.328751}, {lat:  47.689354, lng: -122.328752}, {lat:  47.689356, lng: -122.328753}, {lat:  47.689359, lng: -122.328755}, {lat:  47.689361, lng: -122.328756}, {lat:  47.689364, lng: -122.328757}, {lat:  47.689366, lng: -122.328759}, {lat:  47.689369, lng: -122.32876}, {lat:  47.689372, lng: -122.328761}, {lat:  47.689374, lng: -122.328763}, {lat:  47.689377, lng: -122.328764}, {lat:  47.689379, lng: -122.328766}, {lat:  47.689382, lng: -122.328767}, {lat:  47.689385, lng: -122.328768}, {lat:  47.689387, lng: -122.32877}, {lat:  47.68939, lng: -122.328771}, {lat:  47.689392, lng: -122.328772}, {lat:  47.689395, lng: -122.328774}, {lat:  47.689397, lng: -122.328775}, {lat:  47.6894, lng: -122.328776}, {lat:  47.689403, lng: -122.328778}, {lat:  47.689405, lng: -122.328779}, {lat:  47.689408, lng: -122.32878}, {lat:  47.68941, lng: -122.328782}, {lat:  47.689413, lng: -122.328783}, {lat:  47.689416, lng: -122.328784}, {lat:  47.689418, lng: -122.328786}, {lat:  47.689421, lng: -122.328787}, {lat:  47.689423, lng: -122.328788}, {lat:  47.689426, lng: -122.32879}, {lat:  47.689429, lng: -122.328791}, {lat:  47.689431, lng: -122.328792}, {lat:  47.689434, lng: -122.328794}, {lat:  47.689436, lng: -122.328795}, {lat:  47.689439, lng: -122.328796}, {lat:  47.689441, lng: -122.328798}, {lat:  47.689444, lng: -122.328799}, {lat:  47.689447, lng: -122.3288}, {lat:  47.689449, lng: -122.328802}, {lat:  47.689452, lng: -122.328803}, {lat:  47.689454, lng: -122.328804}, {lat:  47.689457, lng: -122.328805}, {lat:  47.68946, lng: -122.328807}, {lat:  47.689462, lng: -122.328808}, {lat:  47.689465, lng: -122.328809}, {lat:  47.689467, lng: -122.328811}, {lat:  47.68947, lng: -122.328812}, {lat:  47.689473, lng: -122.328813}, {lat:  47.689475, lng: -122.328815}, {lat:  47.689478, lng: -122.328816}, {lat:  47.68948, lng: -122.328817}, {lat:  47.689483, lng: -122.328818}, {lat:  47.689486, lng: -122.32882}, {lat:  47.689488, lng: -122.328821}, {lat:  47.689491, lng: -122.328822}, {lat:  47.689493, lng: -122.328824}, {lat:  47.689496, lng: -122.328825}, {lat:  47.689499, lng: -122.328826}, {lat:  47.689501, lng: -122.328827}, {lat:  47.689504, lng: -122.328829}, {lat:  47.689506, lng: -122.32883}, {lat:  47.689509, lng: -122.328831}, {lat:  47.689512, lng: -122.328833}, {lat:  47.689514, lng: -122.328834}, {lat:  47.689517, lng: -122.328835}, {lat:  47.689519, lng: -122.328836}, {lat:  47.689522, lng: -122.328838}, {lat:  47.689525, lng: -122.328839}, {lat:  47.689527, lng: -122.32884}, {lat:  47.68953, lng: -122.328842}, {lat:  47.689599, lng: -122.32888}, {lat:  47.689721, lng: -122.328929}, {lat:  47.689724, lng: -122.32893}, {lat:  47.689726, lng: -122.328931}, {lat:  47.689729, lng: -122.328932}, {lat:  47.689732, lng: -122.328933}, {lat:  47.689734, lng: -122.328935}, {lat:  47.689737, lng: -122.328936}, {lat:  47.68974, lng: -122.328937}, {lat:  47.689742, lng: -122.328938}, {lat:  47.689745, lng: -122.328939}, {lat:  47.689747, lng: -122.32894}, {lat:  47.68975, lng: -122.328941}, {lat:  47.689753, lng: -122.328942}, {lat:  47.689755, lng: -122.328943}, {lat:  47.689758, lng: -122.328944}, {lat:  47.689761, lng: -122.328946}, {lat:  47.689763, lng: -122.328947}, {lat:  47.689766, lng: -122.328948}, {lat:  47.689769, lng: -122.328949}, {lat:  47.689771, lng: -122.32895}, {lat:  47.689774, lng: -122.328951}, {lat:  47.689776, lng: -122.328952}, {lat:  47.689779, lng: -122.328953}, {lat:  47.689782, lng: -122.328955}, {lat:  47.689784, lng: -122.328956}, {lat:  47.689787, lng: -122.328957}, {lat:  47.68979, lng: -122.328958}, {lat:  47.689792, lng: -122.328959}, {lat:  47.689795, lng: -122.32896}, {lat:  47.689798, lng: -122.328961}, {lat:  47.6898, lng: -122.328962}, {lat:  47.689803, lng: -122.328963}, {lat:  47.689805, lng: -122.328964}, {lat:  47.689808, lng: -122.328965}, {lat:  47.689811, lng: -122.328966}, {lat:  47.689813, lng: -122.328968}, {lat:  47.689816, lng: -122.328969}, {lat:  47.689819, lng: -122.32897}, {lat:  47.689821, lng: -122.328971}, {lat:  47.689824, lng: -122.328972}, {lat:  47.689827, lng: -122.328973}, {lat:  47.689829, lng: -122.328974}, {lat:  47.689832, lng: -122.328975}, {lat:  47.689835, lng: -122.328976}, {lat:  47.689837, lng: -122.328977}, {lat:  47.68984, lng: -122.328978}, {lat:  47.689842, lng: -122.328979}, {lat:  47.689845, lng: -122.32898}, {lat:  47.689848, lng: -122.328981}, {lat:  47.68985, lng: -122.328982}, {lat:  47.689853, lng: -122.328984}, {lat:  47.689856, lng: -122.328985}, {lat:  47.689858, lng: -122.328986}, {lat:  47.689861, lng: -122.328987}, {lat:  47.689864, lng: -122.328988}, {lat:  47.689866, lng: -122.328989}, {lat:  47.689869, lng: -122.32899}, {lat:  47.689872, lng: -122.328991}, {lat:  47.689874, lng: -122.328992}, {lat:  47.689877, lng: -122.328993}, {lat:  47.68988, lng: -122.328994}, {lat:  47.689882, lng: -122.328995}, {lat:  47.689885, lng: -122.328996}, {lat:  47.689888, lng: -122.328997}, {lat:  47.68989, lng: -122.328998}, {lat:  47.689893, lng: -122.328999}, {lat:  47.689895, lng: -122.329}, {lat:  47.689898, lng: -122.329001}, {lat:  47.689901, lng: -122.329002}, {lat:  47.689903, lng: -122.329003}, {lat:  47.689906, lng: -122.329004}, {lat:  47.689909, lng: -122.329005}, {lat:  47.689911, lng: -122.329006}, {lat:  47.689914, lng: -122.329007}, {lat:  47.689917, lng: -122.329008}, {lat:  47.689919, lng: -122.329009}, {lat:  47.689922, lng: -122.32901}, {lat:  47.689925, lng: -122.329011}, {lat:  47.689927, lng: -122.329012}, {lat:  47.68993, lng: -122.329013}, {lat:  47.689933, lng: -122.329014}, {lat:  47.689935, lng: -122.329015}, {lat:  47.689938, lng: -122.329016}, {lat:  47.689941, lng: -122.329017}, {lat:  47.689943, lng: -122.329018}, {lat:  47.689946, lng: -122.329019}, {lat:  47.689949, lng: -122.32902}, {lat:  47.689951, lng: -122.329021}, {lat:  47.689954, lng: -122.329022}, {lat:  47.689957, lng: -122.329023}, {lat:  47.689959, lng: -122.329024}, {lat:  47.689962, lng: -122.329025}, {lat:  47.689965, lng: -122.329026}, {lat:  47.689967, lng: -122.329027}, {lat:  47.68997, lng: -122.329028}, {lat:  47.689973, lng: -122.329029}, {lat:  47.689975, lng: -122.32903}, {lat:  47.689978, lng: -122.329031}, {lat:  47.689981, lng: -122.329032}, {lat:  47.689983, lng: -122.329033}, {lat:  47.689986, lng: -122.329034}, {lat:  47.689989, lng: -122.329035}, {lat:  47.689991, lng: -122.329036}, {lat:  47.689994, lng: -122.329037}, {lat:  47.689997, lng: -122.329038}, {lat:  47.689999, lng: -122.329039}, {lat:  47.690002, lng: -122.32904}, {lat:  47.690005, lng: -122.329041}, {lat:  47.690007, lng: -122.329042}, {lat:  47.69001, lng: -122.329043}, {lat:  47.690013, lng: -122.329043}, {lat:  47.690015, lng: -122.329044}, {lat:  47.690018, lng: -122.329045}, {lat:  47.690021, lng: -122.329046}, {lat:  47.690023, lng: -122.329047}, {lat:  47.690026, lng: -122.329048}, {lat:  47.690029, lng: -122.329049}, {lat:  47.690031, lng: -122.32905}, {lat:  47.690034, lng: -122.329051}, {lat:  47.690037, lng: -122.329052}, {lat:  47.690039, lng: -122.329053}, {lat:  47.690042, lng: -122.329054}, {lat:  47.690045, lng: -122.329055}, {lat:  47.690047, lng: -122.329056}, {lat:  47.69005, lng: -122.329057}, {lat:  47.690052, lng: -122.329058}, {lat:  47.690093, lng: -122.329073}, {lat:  47.690114, lng: -122.329078}, {lat:  47.690117, lng: -122.329079}, {lat:  47.690119, lng: -122.32908}, {lat:  47.690122, lng: -122.329081}, {lat:  47.690125, lng: -122.329082}, {lat:  47.690127, lng: -122.329083}, {lat:  47.69013, lng: -122.329083}, {lat:  47.690133, lng: -122.329084}, {lat:  47.690135, lng: -122.329085}, {lat:  47.690138, lng: -122.329086}, {lat:  47.690141, lng: -122.329087}, {lat:  47.690143, lng: -122.329088}, {lat:  47.690146, lng: -122.329089}, {lat:  47.690149, lng: -122.32909}, {lat:  47.690151, lng: -122.32909}, {lat:  47.690154, lng: -122.329091}, {lat:  47.690157, lng: -122.329092}, {lat:  47.69016, lng: -122.329093}, {lat:  47.690162, lng: -122.329094}, {lat:  47.690165, lng: -122.329095}, {lat:  47.690168, lng: -122.329096}, {lat:  47.69017, lng: -122.329096}, {lat:  47.690173, lng: -122.329097}, {lat:  47.690176, lng: -122.329098}, {lat:  47.690178, lng: -122.329099}, {lat:  47.690181, lng: -122.3291}, {lat:  47.690184, lng: -122.329101}, {lat:  47.690186, lng: -122.329101}, {lat:  47.690189, lng: -122.329102}, {lat:  47.690192, lng: -122.329103}, {lat:  47.690194, lng: -122.329104}, {lat:  47.690197, lng: -122.329105}, {lat:  47.6902, lng: -122.329106}, {lat:  47.690202, lng: -122.329106}, {lat:  47.690205, lng: -122.329107}, {lat:  47.690208, lng: -122.329108}, {lat:  47.690211, lng: -122.329109}, {lat:  47.690213, lng: -122.32911}, {lat:  47.690216, lng: -122.32911}, {lat:  47.690219, lng: -122.329111}, {lat:  47.690221, lng: -122.329112}, {lat:  47.690224, lng: -122.329113}, {lat:  47.690227, lng: -122.329114}, {lat:  47.690229, lng: -122.329115}, {lat:  47.690232, lng: -122.329115}, {lat:  47.690235, lng: -122.329116}, {lat:  47.690237, lng: -122.329117}, {lat:  47.69024, lng: -122.329118}, {lat:  47.690243, lng: -122.329119}, {lat:  47.690245, lng: -122.329119}, {lat:  47.690248, lng: -122.32912}, {lat:  47.690251, lng: -122.329121}, {lat:  47.690254, lng: -122.329122}, {lat:  47.690256, lng: -122.329123}, {lat:  47.690259, lng: -122.329123}, {lat:  47.690262, lng: -122.329124}, {lat:  47.690264, lng: -122.329125}, {lat:  47.690267, lng: -122.329126}, {lat:  47.69027, lng: -122.329126}, {lat:  47.690272, lng: -122.329127}, {lat:  47.690275, lng: -122.329128}, {lat:  47.690278, lng: -122.329129}, {lat:  47.69028, lng: -122.32913}, {lat:  47.690283, lng: -122.32913}, {lat:  47.690286, lng: -122.329131}, {lat:  47.690288, lng: -122.329132}, {lat:  47.690291, lng: -122.329133}, {lat:  47.690294, lng: -122.329133}, {lat:  47.690297, lng: -122.329134}, {lat:  47.690299, lng: -122.329135}, {lat:  47.690302, lng: -122.329136}, {lat:  47.690305, lng: -122.329136}, {lat:  47.690307, lng: -122.329137}, {lat:  47.69031, lng: -122.329138}, {lat:  47.690313, lng: -122.329139}, {lat:  47.690315, lng: -122.329139}, {lat:  47.690318, lng: -122.32914}, {lat:  47.690321, lng: -122.329141}, {lat:  47.690323, lng: -122.329142}, {lat:  47.690326, lng: -122.329142}, {lat:  47.690329, lng: -122.329143}, {lat:  47.690332, lng: -122.329144}, {lat:  47.690334, lng: -122.329145}, {lat:  47.690337, lng: -122.329145}, {lat:  47.69034, lng: -122.329146}, {lat:  47.690342, lng: -122.329147}, {lat:  47.690345, lng: -122.329148}, {lat:  47.690348, lng: -122.329148}, {lat:  47.69035, lng: -122.329149}, {lat:  47.690353, lng: -122.32915}, {lat:  47.690356, lng: -122.329151}, {lat:  47.690359, lng: -122.329151}, {lat:  47.690361, lng: -122.329152}, {lat:  47.690364, lng: -122.329153}, {lat:  47.690367, lng: -122.329153}, {lat:  47.690369, lng: -122.329154}, {lat:  47.690372, lng: -122.329155}, {lat:  47.690375, lng: -122.329156}, {lat:  47.690377, lng: -122.329156}, {lat:  47.690377, lng: -122.329156}, {lat:  47.69038, lng: -122.329157}, {lat:  47.690383, lng: -122.329158}, {lat:  47.690386, lng: -122.329158}, {lat:  47.690388, lng: -122.329159}, {lat:  47.690391, lng: -122.32916}, {lat:  47.690394, lng: -122.329161}, {lat:  47.690396, lng: -122.329161}, {lat:  47.690399, lng: -122.329162}, {lat:  47.690402, lng: -122.329163}, {lat:  47.690404, lng: -122.329163}, {lat:  47.690407, lng: -122.329164}, {lat:  47.69041, lng: -122.329165}, {lat:  47.690413, lng: -122.329165}, {lat:  47.690415, lng: -122.329166}, {lat:  47.690418, lng: -122.329167}, {lat:  47.690421, lng: -122.329167}, {lat:  47.690423, lng: -122.329168}, {lat:  47.690426, lng: -122.329169}, {lat:  47.690429, lng: -122.32917}, {lat:  47.690431, lng: -122.32917}, {lat:  47.690434, lng: -122.329171}, {lat:  47.690437, lng: -122.329172}, {lat:  47.69044, lng: -122.329172}, {lat:  47.690442, lng: -122.329173}, {lat:  47.690445, lng: -122.329174}, {lat:  47.690445, lng: -122.329163}, {lat:  47.690445, lng: -122.329117}, {lat:  47.690443, lng: -122.328955}, {lat:  47.690441, lng: -122.328723}, {lat:  47.690441, lng: -122.328716}, {lat:  47.69044, lng: -122.328507}, {lat:  47.690439, lng: -122.328441}, {lat:  47.690439, lng: -122.328439}, {lat:  47.690439, lng: -122.328438}, {lat:  47.690439, lng: -122.328434}, {lat:  47.690439, lng: -122.328373}, {lat:  47.690438, lng: -122.328239}, {lat:  47.690438, lng: -122.328233}, {lat:  47.690428, lng: -122.327034}, {lat:  47.690428, lng: -122.327034}, {lat:  47.690428, lng: -122.327034}, {lat:  47.690428, lng: -122.32703}, {lat:  47.690428, lng: -122.327022}, {lat:  47.690428, lng: -122.32702}, {lat:  47.690428, lng: -122.327012}, {lat:  47.690418, lng: -122.325687}, {lat:  47.690418, lng: -122.32568}, {lat:  47.690407, lng: -122.324342}, {lat:  47.690407, lng: -122.32434}, {lat:  47.690398, lng: -122.323082}, {lat:  47.690398, lng: -122.323081}, {lat:  47.690397, lng: -122.323}, {lat:  47.690397, lng: -122.323}, {lat:  47.690383, lng: -122.320308}, {lat:  47.690376, lng: -122.318964}, {lat:  47.690369, lng: -122.317616}, {lat:  47.690368, lng: -122.317455}, {lat:  47.690366, lng: -122.316954}, {lat:  47.690365, lng: -122.316823}, {lat:  47.690362, lng: -122.316244}, {lat:  47.690357, lng: -122.315293}, {lat:  47.690356, lng: -122.315035}, {lat:  47.690356, lng: -122.315005}, {lat:  47.690355, lng: -122.314924}, {lat:  47.690354, lng: -122.314632}, {lat:  47.690353, lng: -122.314539}, {lat:  47.690351, lng: -122.314157}, {lat:  47.690351, lng: -122.314107}, {lat:  47.690348, lng: -122.313539}, {lat:  47.690348, lng: -122.3135}, {lat:  47.690348, lng: -122.313492}, {lat:  47.690348, lng: -122.313483}, {lat:  47.690348, lng: -122.313482}, {lat:  47.690347, lng: -122.313447}, {lat:  47.690345, lng: -122.312931}, {lat:  47.690341, lng: -122.312232}, {lat:  47.690339, lng: -122.312232}, {lat:  47.690332, lng: -122.311157}, {lat:  47.690324, lng: -122.310082}, {lat:  47.690324, lng: -122.31008}, {lat:  47.690326, lng: -122.31008}, {lat:  47.690322, lng: -122.309542}, {lat:  47.690322, lng: -122.309474}, {lat:  47.690314, lng: -122.308354}, {lat:  47.690313, lng: -122.30817}, {lat:  47.690311, lng: -122.307985}, {lat:  47.690311, lng: -122.30793}, {lat:  47.69031, lng: -122.307808}, {lat:  47.690304, lng: -122.306975}, {lat:  47.690304, lng: -122.306909}, {lat:  47.690303, lng: -122.306854}, {lat:  47.690302, lng: -122.306854}, {lat:  47.690294, lng: -122.305718}, {lat:  47.690283, lng: -122.304167}, {lat:  47.690266, lng: -122.301671}, {lat:  47.689982, lng: -122.30156}, {lat:  47.689688, lng: -122.301454}, {lat:  47.689449, lng: -122.301479}, {lat:  47.689449, lng: -122.301478}, {lat:  47.689451, lng: -122.301477}, {lat:  47.689451, lng: -122.301453}, {lat:  47.68945, lng: -122.301355}, {lat:  47.689434, lng: -122.298728}, {lat:  47.689426, lng: -122.297502}, {lat:  47.689426, lng: -122.297382}, {lat:  47.689426, lng: -122.29738}, {lat:  47.69024, lng: -122.297372}, {lat:  47.690242, lng: -122.297372}, {lat:  47.690241, lng: -122.297334}, {lat:  47.690241, lng: -122.297311}, {lat:  47.690241, lng: -122.297309}, {lat:  47.690238, lng: -122.296779}, {lat:  47.690235, lng: -122.296218}, {lat:  47.690235, lng: -122.296217}, {lat:  47.690234, lng: -122.296095}, {lat:  47.690234, lng: -122.296023}, {lat:  47.690234, lng: -122.296022}, {lat:  47.69023, lng: -122.295412}, {lat:  47.690228, lng: -122.29504}, {lat:  47.690226, lng: -122.294757}, {lat:  47.690224, lng: -122.294391}, {lat:  47.690218, lng: -122.293396}, {lat:  47.690218, lng: -122.293395}, {lat:  47.690214, lng: -122.292735}, {lat:  47.690212, lng: -122.292239}, {lat:  47.690212, lng: -122.292239}, {lat:  47.690206, lng: -122.291368}, {lat:  47.690203, lng: -122.290714}, {lat:  47.690202, lng: -122.290713}, {lat:  47.690201, lng: -122.290069}, {lat:  47.690198, lng: -122.28928}, {lat:  47.690194, lng: -122.288076}, {lat:  47.690194, lng: -122.288033}, {lat:  47.690192, lng: -122.287497}, {lat:  47.690189, lng: -122.286441}, {lat:  47.690189, lng: -122.286436}, {lat:  47.690187, lng: -122.286025}, {lat:  47.690186, lng: -122.285477}, {lat:  47.690185, lng: -122.285337}, {lat:  47.690185, lng: -122.285216}, {lat:  47.690185, lng: -122.285215}, {lat:  47.690182, lng: -122.284354}, {lat:  47.690181, lng: -122.284003}, {lat:  47.690179, lng: -122.283371}, {lat:  47.690175, lng: -122.28241}, {lat:  47.690175, lng: -122.282409}, {lat:  47.690175, lng: -122.28239}, {lat:  47.690565, lng: -122.282366}, {lat:  47.690596, lng: -122.282362}, {lat:  47.690599, lng: -122.282357}, {lat:  47.69061, lng: -122.282328}, {lat:  47.690625, lng: -122.282294}, {lat:  47.690642, lng: -122.282261}, {lat:  47.690659, lng: -122.28223}, {lat:  47.690677, lng: -122.2822}, {lat:  47.690696, lng: -122.282171}, {lat:  47.690703, lng: -122.282162}, {lat:  47.690707, lng: -122.282155}, {lat:  47.690715, lng: -122.282146}, {lat:  47.690716, lng: -122.282144}, {lat:  47.690737, lng: -122.282119}, {lat:  47.690759, lng: -122.282094}, {lat:  47.69078, lng: -122.282074}, {lat:  47.69078, lng: -122.282074}, {lat:  47.69078, lng: -122.282074}, {lat:  47.690782, lng: -122.282072}, {lat:  47.690805, lng: -122.282051}, {lat:  47.690829, lng: -122.282032}, {lat:  47.690854, lng: -122.282015}, {lat:  47.690876, lng: -122.282002}, {lat:  47.690877, lng: -122.282001}, {lat:  47.690878, lng: -122.282001}, {lat:  47.690879, lng: -122.282}, {lat:  47.690905, lng: -122.281986}, {lat:  47.690931, lng: -122.281975}, {lat:  47.690958, lng: -122.281965}, {lat:  47.690984, lng: -122.281957}, {lat:  47.691011, lng: -122.281952}, {lat:  47.691038, lng: -122.281948}, {lat:  47.691066, lng: -122.281946}, {lat:  47.691093, lng: -122.281947}, {lat:  47.691096, lng: -122.281947}, {lat:  47.69112, lng: -122.281949}, {lat:  47.691147, lng: -122.281953}, {lat:  47.691174, lng: -122.28196}, {lat:  47.691201, lng: -122.281968}, {lat:  47.691452, lng: -122.281654}, {lat:  47.691665, lng: -122.281511}, {lat:  47.691262, lng: -122.281191}, {lat:  47.690895, lng: -122.2807}, {lat:  47.690476, lng: -122.280417}, {lat:  47.690167, lng: -122.279972}, {lat:  47.690167, lng: -122.279959}, {lat:  47.690167, lng: -122.279958}, {lat:  47.690167, lng: -122.279958}, {lat:  47.690167, lng: -122.279879}, {lat:  47.690167, lng: -122.279837}, {lat:  47.690166, lng: -122.279431}, {lat:  47.690165, lng: -122.279234}, {lat:  47.690163, lng: -122.278619}, {lat:  47.690162, lng: -122.278347}, {lat:  47.690161, lng: -122.277937}, {lat:  47.69016, lng: -122.277772}, {lat:  47.69016, lng: -122.277653}, {lat:  47.69016, lng: -122.277532}, {lat:  47.690159, lng: -122.277464}, {lat:  47.690226, lng: -122.277457}, {lat:  47.690439, lng: -122.277426}, {lat:  47.690535, lng: -122.277389}, {lat:  47.690573, lng: -122.277272}, {lat:  47.690592, lng: -122.27715}, {lat:  47.690595, lng: -122.277012}, {lat:  47.691307, lng: -122.276733}, {lat:  47.69165, lng: -122.276596}, {lat:  47.692087, lng: -122.275567}, {lat:  47.692142, lng: -122.275356}, {lat:  47.692365, lng: -122.274457}, {lat:  47.692423, lng: -122.273908}, {lat:  47.692451, lng: -122.273707}, {lat:  47.692478, lng: -122.273612}, {lat:  47.692546, lng: -122.273484}, {lat:  47.692705, lng: -122.273262}, {lat:  47.692749, lng: -122.27316}, {lat:  47.692789, lng: -122.273012}, {lat:  47.692806, lng: -122.272813}, {lat:  47.692793, lng: -122.272633}, {lat:  47.692758, lng: -122.272436}, {lat:  47.692679, lng: -122.272179}, {lat:  47.69267, lng: -122.272071}, {lat:  47.692689, lng: -122.271972}, {lat:  47.692726, lng: -122.271912}, {lat:  47.692814, lng: -122.271851}, {lat:  47.692817, lng: -122.271848}, {lat:  47.69279, lng: -122.271756}, {lat:  47.692762, lng: -122.27166}, {lat:  47.692721, lng: -122.271536}, {lat:  47.692695, lng: -122.27145}]
    ],
    { strokeColor: '#9933FF'}
  );
  var dist5 = handler.addPolygons(
    [
      [{lat:  47.734129, lng: -122.355572}, {lat:  47.734136, lng: -122.359169}, {lat:  47.734139, lng: -122.36093}, {lat:  47.734141, lng: -122.36093}, {lat:  47.734141, lng: -122.360941}, {lat:  47.734141, lng: -122.361037}, {lat:  47.734141, lng: -122.361052}, {lat:  47.734141, lng: -122.361134}, {lat:  47.734141, lng: -122.361162}, {lat:  47.734141, lng: -122.361334}, {lat:  47.734143, lng: -122.361977}, {lat:  47.734143, lng: -122.362034}, {lat:  47.734143, lng: -122.362071}, {lat:  47.734143, lng: -122.362095}, {lat:  47.734143, lng: -122.362156}, {lat:  47.734143, lng: -122.362338}, {lat:  47.733939, lng: -122.37244}, {lat:  47.733931, lng: -122.374099}, {lat:  47.73393, lng: -122.374391}, {lat:  47.733927, lng: -122.374669}, {lat:  47.733548, lng: -122.374496}, {lat:  47.733093, lng: -122.374281}, {lat:  47.730312, lng: -122.373442}, {lat:  47.729853, lng: -122.373304}, {lat:  47.727703, lng: -122.373339}, {lat:  47.725986, lng: -122.373739}, {lat:  47.723288, lng: -122.375637}, {lat:  47.722418, lng: -122.376076}, {lat:  47.719729, lng: -122.376101}, {lat:  47.719431, lng: -122.376104}, {lat:  47.71808, lng: -122.375866}, {lat:  47.716841, lng: -122.376384}, {lat:  47.715612, lng: -122.377027}, {lat:  47.71433, lng: -122.377944}, {lat:  47.712844, lng: -122.379434}, {lat:  47.712491, lng: -122.379697}, {lat:  47.712119, lng: -122.379974}, {lat:  47.711708, lng: -122.380113}, {lat:  47.711428, lng: -122.380281}, {lat:  47.710563, lng: -122.380249}, {lat:  47.709377, lng: -122.380417}, {lat:  47.709124, lng: -122.380512}, {lat:  47.709118, lng: -122.380514}, {lat:  47.709119, lng: -122.38044}, {lat:  47.70911, lng: -122.380097}, {lat:  47.708919, lng: -122.37104}, {lat:  47.708919, lng: -122.368997}, {lat:  47.708786, lng: -122.36955}, {lat:  47.708489, lng: -122.370798}, {lat:  47.708379, lng: -122.370833}, {lat:  47.708301, lng: -122.370998}, {lat:  47.708315, lng: -122.371027}, {lat:  47.708317, lng: -122.371089}, {lat:  47.708242, lng: -122.371433}, {lat:  47.708242, lng: -122.371434}, {lat:  47.708239, lng: -122.371434}, {lat:  47.708235, lng: -122.371449}, {lat:  47.708234, lng: -122.371454}, {lat:  47.708233, lng: -122.371458}, {lat:  47.708232, lng: -122.371462}, {lat:  47.708232, lng: -122.371465}, {lat:  47.708231, lng: -122.371469}, {lat:  47.70823, lng: -122.371473}, {lat:  47.708229, lng: -122.371477}, {lat:  47.708228, lng: -122.371481}, {lat:  47.708227, lng: -122.371485}, {lat:  47.708226, lng: -122.371489}, {lat:  47.708225, lng: -122.371492}, {lat:  47.708224, lng: -122.371496}, {lat:  47.708224, lng: -122.3715}, {lat:  47.708223, lng: -122.371504}, {lat:  47.708222, lng: -122.371506}, {lat:  47.708222, lng: -122.371508}, {lat:  47.708221, lng: -122.371512}, {lat:  47.70822, lng: -122.371515}, {lat:  47.708219, lng: -122.371519}, {lat:  47.708217, lng: -122.371531}, {lat:  47.708216, lng: -122.371535}, {lat:  47.708215, lng: -122.371539}, {lat:  47.708215, lng: -122.371543}, {lat:  47.708214, lng: -122.371547}, {lat:  47.708213, lng: -122.371551}, {lat:  47.708212, lng: -122.371555}, {lat:  47.708212, lng: -122.371558}, {lat:  47.708211, lng: -122.371562}, {lat:  47.708211, lng: -122.371563}, {lat:  47.70821, lng: -122.371566}, {lat:  47.70821, lng: -122.37157}, {lat:  47.708209, lng: -122.371574}, {lat:  47.708208, lng: -122.371578}, {lat:  47.708208, lng: -122.371582}, {lat:  47.708207, lng: -122.371586}, {lat:  47.708206, lng: -122.37159}, {lat:  47.708205, lng: -122.371594}, {lat:  47.708205, lng: -122.371597}, {lat:  47.708204, lng: -122.371601}, {lat:  47.708203, lng: -122.371605}, {lat:  47.708203, lng: -122.371609}, {lat:  47.708202, lng: -122.371613}, {lat:  47.708201, lng: -122.371617}, {lat:  47.708201, lng: -122.371621}, {lat:  47.7082, lng: -122.371625}, {lat:  47.708199, lng: -122.371629}, {lat:  47.708199, lng: -122.371633}, {lat:  47.708198, lng: -122.371637}, {lat:  47.708198, lng: -122.371641}, {lat:  47.708197, lng: -122.371645}, {lat:  47.708196, lng: -122.371649}, {lat:  47.708196, lng: -122.371653}, {lat:  47.708196, lng: -122.371655}, {lat:  47.708195, lng: -122.371657}, {lat:  47.708195, lng: -122.371661}, {lat:  47.708194, lng: -122.371665}, {lat:  47.708193, lng: -122.371669}, {lat:  47.708193, lng: -122.371672}, {lat:  47.708192, lng: -122.371676}, {lat:  47.708192, lng: -122.371679}, {lat:  47.708192, lng: -122.371681}, {lat:  47.708191, lng: -122.371685}, {lat:  47.708191, lng: -122.371689}, {lat:  47.70819, lng: -122.371693}, {lat:  47.70819, lng: -122.371697}, {lat:  47.708189, lng: -122.371701}, {lat:  47.708189, lng: -122.371704}, {lat:  47.708188, lng: -122.371708}, {lat:  47.708188, lng: -122.371712}, {lat:  47.708187, lng: -122.371716}, {lat:  47.708187, lng: -122.37172}, {lat:  47.708186, lng: -122.371724}, {lat:  47.708186, lng: -122.371726}, {lat:  47.708186, lng: -122.371728}, {lat:  47.708185, lng: -122.371732}, {lat:  47.708184, lng: -122.371736}, {lat:  47.708184, lng: -122.371738}, {lat:  47.708184, lng: -122.37174}, {lat:  47.708184, lng: -122.371744}, {lat:  47.708183, lng: -122.371748}, {lat:  47.708183, lng: -122.371752}, {lat:  47.708182, lng: -122.371756}, {lat:  47.708182, lng: -122.37176}, {lat:  47.708182, lng: -122.371764}, {lat:  47.708181, lng: -122.371768}, {lat:  47.708181, lng: -122.371772}, {lat:  47.70818, lng: -122.371776}, {lat:  47.70818, lng: -122.37178}, {lat:  47.708179, lng: -122.371784}, {lat:  47.708179, lng: -122.371789}, {lat:  47.708179, lng: -122.371793}, {lat:  47.708178, lng: -122.371797}, {lat:  47.708178, lng: -122.371801}, {lat:  47.708178, lng: -122.371805}, {lat:  47.708177, lng: -122.371809}, {lat:  47.708177, lng: -122.371813}, {lat:  47.708177, lng: -122.371817}, {lat:  47.708176, lng: -122.371821}, {lat:  47.708176, lng: -122.371825}, {lat:  47.708176, lng: -122.371829}, {lat:  47.708175, lng: -122.371833}, {lat:  47.708175, lng: -122.371837}, {lat:  47.708175, lng: -122.371841}, {lat:  47.708174, lng: -122.371845}, {lat:  47.708174, lng: -122.371849}, {lat:  47.708174, lng: -122.371853}, {lat:  47.708173, lng: -122.371857}, {lat:  47.708173, lng: -122.371861}, {lat:  47.708173, lng: -122.371862}, {lat:  47.708173, lng: -122.371866}, {lat:  47.708173, lng: -122.37187}, {lat:  47.708172, lng: -122.371874}, {lat:  47.708172, lng: -122.371878}, {lat:  47.708172, lng: -122.371882}, {lat:  47.708172, lng: -122.371886}, {lat:  47.708172, lng: -122.37189}, {lat:  47.708171, lng: -122.371894}, {lat:  47.708171, lng: -122.371898}, {lat:  47.708171, lng: -122.371902}, {lat:  47.708171, lng: -122.371906}, {lat:  47.70817, lng: -122.37191}, {lat:  47.70817, lng: -122.371914}, {lat:  47.70817, lng: -122.371916}, {lat:  47.70817, lng: -122.371918}, {lat:  47.70817, lng: -122.371922}, {lat:  47.70817, lng: -122.371926}, {lat:  47.70817, lng: -122.37193}, {lat:  47.708169, lng: -122.371934}, {lat:  47.708169, lng: -122.371938}, {lat:  47.708169, lng: -122.371942}, {lat:  47.708169, lng: -122.371946}, {lat:  47.708169, lng: -122.37195}, {lat:  47.708169, lng: -122.371954}, {lat:  47.708169, lng: -122.371958}, {lat:  47.708169, lng: -122.371962}, {lat:  47.708168, lng: -122.371966}, {lat:  47.708168, lng: -122.371971}, {lat:  47.708168, lng: -122.371975}, {lat:  47.708168, lng: -122.371976}, {lat:  47.708168, lng: -122.371979}, {lat:  47.708168, lng: -122.371983}, {lat:  47.708168, lng: -122.371987}, {lat:  47.708168, lng: -122.371991}, {lat:  47.708168, lng: -122.371995}, {lat:  47.708168, lng: -122.371999}, {lat:  47.708168, lng: -122.372003}, {lat:  47.708168, lng: -122.372007}, {lat:  47.708168, lng: -122.372011}, {lat:  47.708168, lng: -122.372015}, {lat:  47.708168, lng: -122.372019}, {lat:  47.708168, lng: -122.372024}, {lat:  47.708168, lng: -122.372028}, {lat:  47.708168, lng: -122.372032}, {lat:  47.708168, lng: -122.372035}, {lat:  47.708168, lng: -122.37204}, {lat:  47.708168, lng: -122.372044}, {lat:  47.708168, lng: -122.372048}, {lat:  47.708168, lng: -122.372052}, {lat:  47.708168, lng: -122.372056}, {lat:  47.708168, lng: -122.37206}, {lat:  47.708168, lng: -122.372064}, {lat:  47.708168, lng: -122.372068}, {lat:  47.708168, lng: -122.372072}, {lat:  47.708168, lng: -122.372076}, {lat:  47.708168, lng: -122.37208}, {lat:  47.708168, lng: -122.372084}, {lat:  47.708168, lng: -122.372088}, {lat:  47.708168, lng: -122.372092}, {lat:  47.708168, lng: -122.372095}, {lat:  47.708168, lng: -122.372096}, {lat:  47.708169, lng: -122.3721}, {lat:  47.708169, lng: -122.372105}, {lat:  47.708169, lng: -122.372109}, {lat:  47.708169, lng: -122.372113}, {lat:  47.708169, lng: -122.372117}, {lat:  47.708169, lng: -122.372121}, {lat:  47.70817, lng: -122.372125}, {lat:  47.70817, lng: -122.372129}, {lat:  47.70817, lng: -122.372133}, {lat:  47.70817, lng: -122.372137}, {lat:  47.70817, lng: -122.372141}, {lat:  47.70817, lng: -122.372145}, {lat:  47.70817, lng: -122.372149}, {lat:  47.708171, lng: -122.372153}, {lat:  47.708171, lng: -122.372155}, {lat:  47.708171, lng: -122.372158}, {lat:  47.708171, lng: -122.372162}, {lat:  47.708171, lng: -122.372166}, {lat:  47.708172, lng: -122.37217}, {lat:  47.708172, lng: -122.372174}, {lat:  47.708172, lng: -122.372178}, {lat:  47.708172, lng: -122.372182}, {lat:  47.708173, lng: -122.372186}, {lat:  47.708173, lng: -122.37219}, {lat:  47.708173, lng: -122.372194}, {lat:  47.708173, lng: -122.372198}, {lat:  47.708174, lng: -122.372202}, {lat:  47.708174, lng: -122.372206}, {lat:  47.708174, lng: -122.37221}, {lat:  47.708174, lng: -122.372214}, {lat:  47.708174, lng: -122.372215}, {lat:  47.708175, lng: -122.372218}, {lat:  47.708175, lng: -122.372222}, {lat:  47.708175, lng: -122.372226}, {lat:  47.708176, lng: -122.37223}, {lat:  47.708176, lng: -122.372234}, {lat:  47.708176, lng: -122.372238}, {lat:  47.708177, lng: -122.372242}, {lat:  47.708177, lng: -122.372246}, {lat:  47.708177, lng: -122.372251}, {lat:  47.708178, lng: -122.372255}, {lat:  47.708178, lng: -122.372259}, {lat:  47.708178, lng: -122.372263}, {lat:  47.708179, lng: -122.372267}, {lat:  47.708179, lng: -122.372271}, {lat:  47.708179, lng: -122.372274}, {lat:  47.708179, lng: -122.372275}, {lat:  47.70818, lng: -122.372279}, {lat:  47.70818, lng: -122.372283}, {lat:  47.708181, lng: -122.372287}, {lat:  47.708181, lng: -122.372291}, {lat:  47.708182, lng: -122.372295}, {lat:  47.708182, lng: -122.372299}, {lat:  47.708182, lng: -122.372303}, {lat:  47.708183, lng: -122.372307}, {lat:  47.708183, lng: -122.372311}, {lat:  47.708184, lng: -122.372315}, {lat:  47.708184, lng: -122.372319}, {lat:  47.708185, lng: -122.372323}, {lat:  47.708185, lng: -122.372327}, {lat:  47.708186, lng: -122.372331}, {lat:  47.708186, lng: -122.372333}, {lat:  47.708186, lng: -122.372335}, {lat:  47.708187, lng: -122.372339}, {lat:  47.708187, lng: -122.372343}, {lat:  47.708187, lng: -122.372347}, {lat:  47.708188, lng: -122.372351}, {lat:  47.708188, lng: -122.372355}, {lat:  47.708189, lng: -122.372359}, {lat:  47.708189, lng: -122.372363}, {lat:  47.70819, lng: -122.372367}, {lat:  47.70819, lng: -122.372371}, {lat:  47.708191, lng: -122.372375}, {lat:  47.708192, lng: -122.372383}, {lat:  47.708193, lng: -122.372387}, {lat:  47.708193, lng: -122.372391}, {lat:  47.708193, lng: -122.372392}, {lat:  47.708194, lng: -122.372395}, {lat:  47.708195, lng: -122.372398}, {lat:  47.708195, lng: -122.372402}, {lat:  47.708196, lng: -122.372406}, {lat:  47.708196, lng: -122.37241}, {lat:  47.708197, lng: -122.372414}, {lat:  47.708198, lng: -122.372418}, {lat:  47.708198, lng: -122.372422}, {lat:  47.708199, lng: -122.372426}, {lat:  47.7082, lng: -122.37243}, {lat:  47.7082, lng: -122.372434}, {lat:  47.708201, lng: -122.372438}, {lat:  47.708201, lng: -122.372442}, {lat:  47.708202, lng: -122.372446}, {lat:  47.708203, lng: -122.37245}, {lat:  47.708304, lng: -122.373046}, {lat:  47.708304, lng: -122.37305}, {lat:  47.708305, lng: -122.373054}, {lat:  47.708306, lng: -122.373058}, {lat:  47.708306, lng: -122.373061}, {lat:  47.708307, lng: -122.373065}, {lat:  47.708308, lng: -122.373069}, {lat:  47.708308, lng: -122.373073}, {lat:  47.708309, lng: -122.373077}, {lat:  47.70831, lng: -122.373081}, {lat:  47.70831, lng: -122.373085}, {lat:  47.708311, lng: -122.373089}, {lat:  47.708311, lng: -122.373093}, {lat:  47.708312, lng: -122.373097}, {lat:  47.708313, lng: -122.373101}, {lat:  47.708313, lng: -122.373105}, {lat:  47.708314, lng: -122.373109}, {lat:  47.708315, lng: -122.373113}, {lat:  47.708315, lng: -122.373117}, {lat:  47.708316, lng: -122.373121}, {lat:  47.708317, lng: -122.373125}, {lat:  47.708317, lng: -122.373129}, {lat:  47.708318, lng: -122.373133}, {lat:  47.708318, lng: -122.373137}, {lat:  47.708319, lng: -122.373141}, {lat:  47.708319, lng: -122.373145}, {lat:  47.70832, lng: -122.373149}, {lat:  47.70832, lng: -122.373152}, {lat:  47.708321, lng: -122.373156}, {lat:  47.708322, lng: -122.37316}, {lat:  47.708322, lng: -122.373164}, {lat:  47.708323, lng: -122.373168}, {lat:  47.708323, lng: -122.373172}, {lat:  47.708324, lng: -122.373176}, {lat:  47.708324, lng: -122.37318}, {lat:  47.708325, lng: -122.373184}, {lat:  47.708326, lng: -122.373188}, {lat:  47.708326, lng: -122.373192}, {lat:  47.708327, lng: -122.373196}, {lat:  47.708327, lng: -122.3732}, {lat:  47.708328, lng: -122.373203}, {lat:  47.708328, lng: -122.373204}, {lat:  47.708328, lng: -122.373208}, {lat:  47.708329, lng: -122.373212}, {lat:  47.708329, lng: -122.373216}, {lat:  47.70833, lng: -122.37322}, {lat:  47.70833, lng: -122.373224}, {lat:  47.708331, lng: -122.373228}, {lat:  47.708331, lng: -122.373232}, {lat:  47.708332, lng: -122.373236}, {lat:  47.708332, lng: -122.37324}, {lat:  47.708333, lng: -122.373244}, {lat:  47.708333, lng: -122.373248}, {lat:  47.708334, lng: -122.373252}, {lat:  47.708334, lng: -122.373256}, {lat:  47.708335, lng: -122.37326}, {lat:  47.708335, lng: -122.373264}, {lat:  47.708336, lng: -122.373268}, {lat:  47.708336, lng: -122.373272}, {lat:  47.708337, lng: -122.373276}, {lat:  47.708338, lng: -122.37328}, {lat:  47.708338, lng: -122.373282}, {lat:  47.708338, lng: -122.373284}, {lat:  47.708338, lng: -122.373288}, {lat:  47.708339, lng: -122.373292}, {lat:  47.708339, lng: -122.373296}, {lat:  47.70834, lng: -122.3733}, {lat:  47.70834, lng: -122.373304}, {lat:  47.708341, lng: -122.373308}, {lat:  47.708341, lng: -122.373312}, {lat:  47.708342, lng: -122.373316}, {lat:  47.708342, lng: -122.37332}, {lat:  47.708342, lng: -122.373324}, {lat:  47.708343, lng: -122.373329}, {lat:  47.708343, lng: -122.373333}, {lat:  47.708344, lng: -122.373337}, {lat:  47.708344, lng: -122.373341}, {lat:  47.708345, lng: -122.373345}, {lat:  47.708345, lng: -122.373349}, {lat:  47.708346, lng: -122.373353}, {lat:  47.708346, lng: -122.373357}, {lat:  47.708346, lng: -122.373361}, {lat:  47.708347, lng: -122.373362}, {lat:  47.708347, lng: -122.373364}, {lat:  47.708347, lng: -122.373368}, {lat:  47.708348, lng: -122.373372}, {lat:  47.708348, lng: -122.373376}, {lat:  47.708348, lng: -122.37338}, {lat:  47.708349, lng: -122.373385}, {lat:  47.708349, lng: -122.373389}, {lat:  47.708349, lng: -122.373393}, {lat:  47.70835, lng: -122.373397}, {lat:  47.70835, lng: -122.373401}, {lat:  47.708351, lng: -122.373405}, {lat:  47.708351, lng: -122.373409}, {lat:  47.708351, lng: -122.373413}, {lat:  47.708352, lng: -122.373417}, {lat:  47.708352, lng: -122.373421}, {lat:  47.708352, lng: -122.373425}, {lat:  47.708353, lng: -122.373429}, {lat:  47.708353, lng: -122.373433}, {lat:  47.708354, lng: -122.373437}, {lat:  47.708354, lng: -122.373441}, {lat:  47.708354, lng: -122.373442}, {lat:  47.708354, lng: -122.373445}, {lat:  47.708355, lng: -122.373449}, {lat:  47.708355, lng: -122.373453}, {lat:  47.708355, lng: -122.373457}, {lat:  47.708355, lng: -122.373461}, {lat:  47.708356, lng: -122.373465}, {lat:  47.708356, lng: -122.373469}, {lat:  47.708356, lng: -122.373473}, {lat:  47.708357, lng: -122.373477}, {lat:  47.708357, lng: -122.373481}, {lat:  47.708357, lng: -122.373485}, {lat:  47.708358, lng: -122.373489}, {lat:  47.708358, lng: -122.373493}, {lat:  47.708358, lng: -122.373497}, {lat:  47.708359, lng: -122.373501}, {lat:  47.708359, lng: -122.373505}, {lat:  47.708359, lng: -122.373509}, {lat:  47.70836, lng: -122.373513}, {lat:  47.70836, lng: -122.373517}, {lat:  47.70836, lng: -122.373521}, {lat:  47.70836, lng: -122.373526}, {lat:  47.708361, lng: -122.37353}, {lat:  47.708361, lng: -122.373534}, {lat:  47.708361, lng: -122.373538}, {lat:  47.708361, lng: -122.373542}, {lat:  47.708362, lng: -122.373546}, {lat:  47.708362, lng: -122.37355}, {lat:  47.708362, lng: -122.373554}, {lat:  47.708362, lng: -122.373558}, {lat:  47.708363, lng: -122.373562}, {lat:  47.708363, lng: -122.373566}, {lat:  47.708363, lng: -122.37357}, {lat:  47.708363, lng: -122.373574}, {lat:  47.708364, lng: -122.373578}, {lat:  47.708364, lng: -122.373582}, {lat:  47.708364, lng: -122.373586}, {lat:  47.708364, lng: -122.37359}, {lat:  47.708365, lng: -122.373594}, {lat:  47.708365, lng: -122.373598}, {lat:  47.708365, lng: -122.373602}, {lat:  47.708365, lng: -122.373606}, {lat:  47.708365, lng: -122.37361}, {lat:  47.708366, lng: -122.373615}, {lat:  47.708366, lng: -122.373619}, {lat:  47.708366, lng: -122.373623}, {lat:  47.708366, lng: -122.373627}, {lat:  47.708366, lng: -122.373631}, {lat:  47.708366, lng: -122.373635}, {lat:  47.708367, lng: -122.373639}, {lat:  47.708367, lng: -122.373643}, {lat:  47.708367, lng: -122.373647}, {lat:  47.708367, lng: -122.373651}, {lat:  47.708367, lng: -122.373655}, {lat:  47.708367, lng: -122.373659}, {lat:  47.708368, lng: -122.373663}, {lat:  47.708368, lng: -122.373667}, {lat:  47.708368, lng: -122.373671}, {lat:  47.708368, lng: -122.373675}, {lat:  47.708368, lng: -122.373679}, {lat:  47.708368, lng: -122.373683}, {lat:  47.708369, lng: -122.373684}, {lat:  47.708369, lng: -122.373688}, {lat:  47.708369, lng: -122.373692}, {lat:  47.708369, lng: -122.373696}, {lat:  47.708369, lng: -122.3737}, {lat:  47.708369, lng: -122.373704}, {lat:  47.708369, lng: -122.373708}, {lat:  47.70837, lng: -122.373712}, {lat:  47.70837, lng: -122.373716}, {lat:  47.70837, lng: -122.37372}, {lat:  47.70837, lng: -122.373724}, {lat:  47.70837, lng: -122.373728}, {lat:  47.70837, lng: -122.373732}, {lat:  47.70837, lng: -122.373736}, {lat:  47.70837, lng: -122.37374}, {lat:  47.70837, lng: -122.373744}, {lat:  47.708371, lng: -122.373748}, {lat:  47.708371, lng: -122.373752}, {lat:  47.708371, lng: -122.373757}, {lat:  47.708371, lng: -122.373761}, {lat:  47.708371, lng: -122.373763}, {lat:  47.708371, lng: -122.373765}, {lat:  47.708371, lng: -122.373769}, {lat:  47.708371, lng: -122.373773}, {lat:  47.708371, lng: -122.373777}, {lat:  47.708371, lng: -122.373781}, {lat:  47.708371, lng: -122.373785}, {lat:  47.708371, lng: -122.373789}, {lat:  47.708371, lng: -122.373793}, {lat:  47.708371, lng: -122.373797}, {lat:  47.708371, lng: -122.373801}, {lat:  47.708371, lng: -122.373805}, {lat:  47.708371, lng: -122.373809}, {lat:  47.708371, lng: -122.373813}, {lat:  47.708371, lng: -122.373817}, {lat:  47.708371, lng: -122.373821}, {lat:  47.708371, lng: -122.373825}, {lat:  47.708372, lng: -122.37383}, {lat:  47.708372, lng: -122.373834}, {lat:  47.708372, lng: -122.373838}, {lat:  47.708372, lng: -122.373844}, {lat:  47.708373, lng: -122.374465}, {lat:  47.708373, lng: -122.374469}, {lat:  47.708373, lng: -122.374473}, {lat:  47.708373, lng: -122.374477}, {lat:  47.708373, lng: -122.374481}, {lat:  47.708373, lng: -122.374485}, {lat:  47.708373, lng: -122.374489}, {lat:  47.708373, lng: -122.374493}, {lat:  47.708373, lng: -122.374497}, {lat:  47.708373, lng: -122.374501}, {lat:  47.708373, lng: -122.374502}, {lat:  47.708373, lng: -122.374505}, {lat:  47.708372, lng: -122.374509}, {lat:  47.708372, lng: -122.374513}, {lat:  47.708372, lng: -122.374517}, {lat:  47.708372, lng: -122.37452}, {lat:  47.708372, lng: -122.374521}, {lat:  47.708372, lng: -122.374525}, {lat:  47.708371, lng: -122.374529}, {lat:  47.708371, lng: -122.374534}, {lat:  47.708371, lng: -122.374538}, {lat:  47.708371, lng: -122.374539}, {lat:  47.708371, lng: -122.374542}, {lat:  47.70837, lng: -122.374546}, {lat:  47.70837, lng: -122.37455}, {lat:  47.70837, lng: -122.374554}, {lat:  47.708369, lng: -122.374558}, {lat:  47.708369, lng: -122.374562}, {lat:  47.708369, lng: -122.374566}, {lat:  47.708368, lng: -122.37457}, {lat:  47.708368, lng: -122.374574}, {lat:  47.708368, lng: -122.374575}, {lat:  47.708367, lng: -122.374578}, {lat:  47.708367, lng: -122.374582}, {lat:  47.708366, lng: -122.374586}, {lat:  47.708366, lng: -122.37459}, {lat:  47.708365, lng: -122.374594}, {lat:  47.708365, lng: -122.374598}, {lat:  47.708364, lng: -122.374602}, {lat:  47.708364, lng: -122.374606}, {lat:  47.708363, lng: -122.37461}, {lat:  47.708363, lng: -122.374612}, {lat:  47.708363, lng: -122.374614}, {lat:  47.708362, lng: -122.374618}, {lat:  47.708362, lng: -122.374622}, {lat:  47.708361, lng: -122.374626}, {lat:  47.70836, lng: -122.37463}, {lat:  47.70836, lng: -122.374634}, {lat:  47.708359, lng: -122.374638}, {lat:  47.708358, lng: -122.374642}, {lat:  47.708358, lng: -122.374646}, {lat:  47.708357, lng: -122.374647}, {lat:  47.708357, lng: -122.374649}, {lat:  47.708356, lng: -122.374653}, {lat:  47.708355, lng: -122.374657}, {lat:  47.708355, lng: -122.374661}, {lat:  47.708354, lng: -122.374665}, {lat:  47.708353, lng: -122.374669}, {lat:  47.708352, lng: -122.374673}, {lat:  47.708352, lng: -122.374677}, {lat:  47.708351, lng: -122.374681}, {lat:  47.70835, lng: -122.374683}, {lat:  47.70835, lng: -122.374684}, {lat:  47.708349, lng: -122.374688}, {lat:  47.708348, lng: -122.374692}, {lat:  47.708347, lng: -122.374696}, {lat:  47.708346, lng: -122.3747}, {lat:  47.708345, lng: -122.374704}, {lat:  47.708345, lng: -122.374707}, {lat:  47.708344, lng: -122.374711}, {lat:  47.708343, lng: -122.374715}, {lat:  47.708342, lng: -122.374718}, {lat:  47.708342, lng: -122.374719}, {lat:  47.708341, lng: -122.374723}, {lat:  47.70834, lng: -122.374727}, {lat:  47.708339, lng: -122.37473}, {lat:  47.708337, lng: -122.374734}, {lat:  47.708336, lng: -122.374738}, {lat:  47.708335, lng: -122.374742}, {lat:  47.708334, lng: -122.374745}, {lat:  47.708333, lng: -122.374749}, {lat:  47.708333, lng: -122.374752}, {lat:  47.708332, lng: -122.374753}, {lat:  47.708331, lng: -122.374757}, {lat:  47.70833, lng: -122.37476}, {lat:  47.708329, lng: -122.374764}, {lat:  47.708327, lng: -122.374768}, {lat:  47.708326, lng: -122.374771}, {lat:  47.708325, lng: -122.374775}, {lat:  47.708324, lng: -122.374779}, {lat:  47.708323, lng: -122.374782}, {lat:  47.708322, lng: -122.374785}, {lat:  47.708321, lng: -122.374786}, {lat:  47.70832, lng: -122.374789}, {lat:  47.708319, lng: -122.374793}, {lat:  47.708318, lng: -122.374797}, {lat:  47.708316, lng: -122.3748}, {lat:  47.708315, lng: -122.374804}, {lat:  47.708314, lng: -122.374807}, {lat:  47.708312, lng: -122.374811}, {lat:  47.708311, lng: -122.374814}, {lat:  47.70831, lng: -122.374818}, {lat:  47.708308, lng: -122.374821}, {lat:  47.708307, lng: -122.374825}, {lat:  47.708305, lng: -122.374828}, {lat:  47.708304, lng: -122.374832}, {lat:  47.708302, lng: -122.374835}, {lat:  47.708301, lng: -122.374839}, {lat:  47.7083, lng: -122.374842}, {lat:  47.708298, lng: -122.374845}, {lat:  47.708297, lng: -122.374849}, {lat:  47.708295, lng: -122.374852}, {lat:  47.708294, lng: -122.374856}, {lat:  47.708292, lng: -122.374859}, {lat:  47.70829, lng: -122.374862}, {lat:  47.708289, lng: -122.374866}, {lat:  47.708287, lng: -122.374869}, {lat:  47.708286, lng: -122.374872}, {lat:  47.708284, lng: -122.374876}, {lat:  47.708283, lng: -122.374879}, {lat:  47.708281, lng: -122.374882}, {lat:  47.708279, lng: -122.374885}, {lat:  47.708278, lng: -122.374888}, {lat:  47.708276, lng: -122.374892}, {lat:  47.708274, lng: -122.374895}, {lat:  47.708273, lng: -122.374898}, {lat:  47.708271, lng: -122.374901}, {lat:  47.708269, lng: -122.374904}, {lat:  47.708267, lng: -122.374909}, {lat:  47.708265, lng: -122.374912}, {lat:  47.708264, lng: -122.374915}, {lat:  47.708262, lng: -122.374918}, {lat:  47.70826, lng: -122.374921}, {lat:  47.708258, lng: -122.374924}, {lat:  47.708256, lng: -122.374927}, {lat:  47.708255, lng: -122.37493}, {lat:  47.708253, lng: -122.374933}, {lat:  47.708251, lng: -122.374936}, {lat:  47.708249, lng: -122.374939}, {lat:  47.708247, lng: -122.374942}, {lat:  47.708245, lng: -122.374945}, {lat:  47.708244, lng: -122.374948}, {lat:  47.708242, lng: -122.374951}, {lat:  47.70824, lng: -122.374954}, {lat:  47.708238, lng: -122.374957}, {lat:  47.708236, lng: -122.37496}, {lat:  47.708234, lng: -122.374963}, {lat:  47.708232, lng: -122.374965}, {lat:  47.70823, lng: -122.374968}, {lat:  47.708228, lng: -122.374971}, {lat:  47.708226, lng: -122.374974}, {lat:  47.708224, lng: -122.374976}, {lat:  47.708222, lng: -122.374979}, {lat:  47.70822, lng: -122.374982}, {lat:  47.708218, lng: -122.374985}, {lat:  47.708216, lng: -122.374987}, {lat:  47.708215, lng: -122.374988}, {lat:  47.708214, lng: -122.37499}, {lat:  47.708212, lng: -122.374993}, {lat:  47.70821, lng: -122.374995}, {lat:  47.708208, lng: -122.374998}, {lat:  47.708205, lng: -122.375001}, {lat:  47.708203, lng: -122.375003}, {lat:  47.708201, lng: -122.375006}, {lat:  47.708199, lng: -122.375009}, {lat:  47.708197, lng: -122.375011}, {lat:  47.708196, lng: -122.375012}, {lat:  47.708195, lng: -122.375014}, {lat:  47.708193, lng: -122.375016}, {lat:  47.708191, lng: -122.375018}, {lat:  47.708188, lng: -122.375021}, {lat:  47.708186, lng: -122.375023}, {lat:  47.708184, lng: -122.375026}, {lat:  47.708182, lng: -122.375028}, {lat:  47.70818, lng: -122.375031}, {lat:  47.708177, lng: -122.375033}, {lat:  47.708176, lng: -122.375034}, {lat:  47.708175, lng: -122.375035}, {lat:  47.708173, lng: -122.375038}, {lat:  47.708171, lng: -122.37504}, {lat:  47.708168, lng: -122.375042}, {lat:  47.708166, lng: -122.375044}, {lat:  47.708164, lng: -122.375047}, {lat:  47.708162, lng: -122.375049}, {lat:  47.708159, lng: -122.375051}, {lat:  47.708157, lng: -122.375053}, {lat:  47.708156, lng: -122.375055}, {lat:  47.708155, lng: -122.375056}, {lat:  47.708152, lng: -122.375058}, {lat:  47.70815, lng: -122.37506}, {lat:  47.708148, lng: -122.375062}, {lat:  47.708145, lng: -122.375064}, {lat:  47.708143, lng: -122.375066}, {lat:  47.708141, lng: -122.375068}, {lat:  47.708138, lng: -122.37507}, {lat:  47.708136, lng: -122.375073}, {lat:  47.708134, lng: -122.375074}, {lat:  47.708134, lng: -122.375075}, {lat:  47.708131, lng: -122.375077}, {lat:  47.708129, lng: -122.375078}, {lat:  47.708126, lng: -122.37508}, {lat:  47.708124, lng: -122.375082}, {lat:  47.708121, lng: -122.375084}, {lat:  47.708119, lng: -122.375086}, {lat:  47.708117, lng: -122.375088}, {lat:  47.708114, lng: -122.37509}, {lat:  47.708112, lng: -122.375091}, {lat:  47.708112, lng: -122.375092}, {lat:  47.708109, lng: -122.375093}, {lat:  47.708107, lng: -122.375095}, {lat:  47.708104, lng: -122.375097}, {lat:  47.708102, lng: -122.375098}, {lat:  47.708097, lng: -122.375102}, {lat:  47.708094, lng: -122.375104}, {lat:  47.708092, lng: -122.375105}, {lat:  47.70809, lng: -122.375107}, {lat:  47.708089, lng: -122.375107}, {lat:  47.708087, lng: -122.375108}, {lat:  47.708084, lng: -122.37511}, {lat:  47.708082, lng: -122.375111}, {lat:  47.708079, lng: -122.375113}, {lat:  47.708077, lng: -122.375114}, {lat:  47.708074, lng: -122.375116}, {lat:  47.708072, lng: -122.375117}, {lat:  47.708069, lng: -122.375119}, {lat:  47.708067, lng: -122.37512}, {lat:  47.708064, lng: -122.375122}, {lat:  47.708061, lng: -122.375123}, {lat:  47.708059, lng: -122.375124}, {lat:  47.708056, lng: -122.375126}, {lat:  47.708053, lng: -122.375127}, {lat:  47.708051, lng: -122.375128}, {lat:  47.708048, lng: -122.37513}, {lat:  47.708046, lng: -122.375131}, {lat:  47.708045, lng: -122.375131}, {lat:  47.708043, lng: -122.375132}, {lat:  47.70804, lng: -122.375133}, {lat:  47.708038, lng: -122.375134}, {lat:  47.708035, lng: -122.375135}, {lat:  47.708034, lng: -122.375136}, {lat:  47.708032, lng: -122.375137}, {lat:  47.70803, lng: -122.375138}, {lat:  47.708027, lng: -122.375139}, {lat:  47.708025, lng: -122.37514}, {lat:  47.708022, lng: -122.375141}, {lat:  47.708019, lng: -122.375142}, {lat:  47.708017, lng: -122.375143}, {lat:  47.708014, lng: -122.375144}, {lat:  47.708011, lng: -122.375145}, {lat:  47.708009, lng: -122.375146}, {lat:  47.708006, lng: -122.375146}, {lat:  47.708003, lng: -122.375147}, {lat:  47.708001, lng: -122.375148}, {lat:  47.707998, lng: -122.375149}, {lat:  47.707995, lng: -122.37515}, {lat:  47.707992, lng: -122.375151}, {lat:  47.707989, lng: -122.375152}, {lat:  47.707987, lng: -122.375153}, {lat:  47.707984, lng: -122.375153}, {lat:  47.707981, lng: -122.375154}, {lat:  47.707978, lng: -122.375154}, {lat:  47.707976, lng: -122.375155}, {lat:  47.707973, lng: -122.375155}, {lat:  47.707972, lng: -122.375156}, {lat:  47.70797, lng: -122.375156}, {lat:  47.707968, lng: -122.375156}, {lat:  47.707965, lng: -122.375157}, {lat:  47.707962, lng: -122.375157}, {lat:  47.707959, lng: -122.375157}, {lat:  47.707957, lng: -122.375158}, {lat:  47.707955, lng: -122.375158}, {lat:  47.707954, lng: -122.375158}, {lat:  47.707951, lng: -122.375159}, {lat:  47.70795, lng: -122.375159}, {lat:  47.707948, lng: -122.375159}, {lat:  47.707946, lng: -122.375159}, {lat:  47.707943, lng: -122.375159}, {lat:  47.70794, lng: -122.375159}, {lat:  47.707937, lng: -122.375159}, {lat:  47.707935, lng: -122.375159}, {lat:  47.707932, lng: -122.37516}, {lat:  47.707929, lng: -122.37516}, {lat:  47.707928, lng: -122.37516}, {lat:  47.707926, lng: -122.37516}, {lat:  47.707924, lng: -122.37516}, {lat:  47.707921, lng: -122.375159}, {lat:  47.707907, lng: -122.375159}, {lat:  47.707905, lng: -122.375158}, {lat:  47.707902, lng: -122.375158}, {lat:  47.707899, lng: -122.375158}, {lat:  47.707896, lng: -122.375157}, {lat:  47.707894, lng: -122.375157}, {lat:  47.707891, lng: -122.375156}, {lat:  47.707888, lng: -122.375156}, {lat:  47.707885, lng: -122.375156}, {lat:  47.707883, lng: -122.375155}, {lat:  47.70788, lng: -122.375154}, {lat:  47.707877, lng: -122.375154}, {lat:  47.707875, lng: -122.375153}, {lat:  47.707872, lng: -122.375152}, {lat:  47.707871, lng: -122.375152}, {lat:  47.707869, lng: -122.375152}, {lat:  47.707867, lng: -122.375151}, {lat:  47.707864, lng: -122.37515}, {lat:  47.707861, lng: -122.37515}, {lat:  47.707858, lng: -122.375149}, {lat:  47.707856, lng: -122.375148}, {lat:  47.707853, lng: -122.375147}, {lat:  47.70785, lng: -122.375146}, {lat:  47.707848, lng: -122.375145}, {lat:  47.707847, lng: -122.375145}, {lat:  47.707845, lng: -122.375144}, {lat:  47.707842, lng: -122.375143}, {lat:  47.70784, lng: -122.375142}, {lat:  47.707839, lng: -122.375142}, {lat:  47.707837, lng: -122.375141}, {lat:  47.707835, lng: -122.37514}, {lat:  47.707832, lng: -122.375139}, {lat:  47.707829, lng: -122.375138}, {lat:  47.707827, lng: -122.375136}, {lat:  47.707824, lng: -122.375135}, {lat:  47.707821, lng: -122.375134}, {lat:  47.707819, lng: -122.375133}, {lat:  47.707818, lng: -122.375132}, {lat:  47.707816, lng: -122.375132}, {lat:  47.707814, lng: -122.37513}, {lat:  47.707811, lng: -122.375129}, {lat:  47.707798, lng: -122.375121}, {lat:  47.707797, lng: -122.37512}, {lat:  47.707796, lng: -122.37512}, {lat:  47.707793, lng: -122.375118}, {lat:  47.707791, lng: -122.375116}, {lat:  47.707789, lng: -122.375115}, {lat:  47.707788, lng: -122.375115}, {lat:  47.707786, lng: -122.375113}, {lat:  47.707783, lng: -122.375111}, {lat:  47.707781, lng: -122.37511}, {lat:  47.707778, lng: -122.375108}, {lat:  47.707776, lng: -122.375107}, {lat:  47.707776, lng: -122.375106}, {lat:  47.707773, lng: -122.375104}, {lat:  47.707771, lng: -122.375103}, {lat:  47.707769, lng: -122.375101}, {lat:  47.707767, lng: -122.375099}, {lat:  47.707766, lng: -122.375099}, {lat:  47.707764, lng: -122.375097}, {lat:  47.707761, lng: -122.375095}, {lat:  47.707759, lng: -122.375093}, {lat:  47.707757, lng: -122.375091}, {lat:  47.707754, lng: -122.375089}, {lat:  47.707752, lng: -122.375087}, {lat:  47.707749, lng: -122.375084}, {lat:  47.707747, lng: -122.375082}, {lat:  47.707745, lng: -122.37508}, {lat:  47.707742, lng: -122.375078}, {lat:  47.70774, lng: -122.375076}, {lat:  47.707738, lng: -122.375074}, {lat:  47.707738, lng: -122.375073}, {lat:  47.707736, lng: -122.375071}, {lat:  47.707733, lng: -122.375069}, {lat:  47.707731, lng: -122.375067}, {lat:  47.707729, lng: -122.375064}, {lat:  47.707727, lng: -122.375062}, {lat:  47.707724, lng: -122.37506}, {lat:  47.707722, lng: -122.375057}, {lat:  47.70772, lng: -122.375055}, {lat:  47.707719, lng: -122.375054}, {lat:  47.707718, lng: -122.375052}, {lat:  47.707716, lng: -122.37505}, {lat:  47.707714, lng: -122.375047}, {lat:  47.707712, lng: -122.375045}, {lat:  47.707709, lng: -122.375042}, {lat:  47.707707, lng: -122.375039}, {lat:  47.707705, lng: -122.375037}, {lat:  47.707703, lng: -122.375034}, {lat:  47.707702, lng: -122.375033}, {lat:  47.707701, lng: -122.375031}, {lat:  47.707699, lng: -122.375029}, {lat:  47.707697, lng: -122.375026}, {lat:  47.707695, lng: -122.375023}, {lat:  47.707694, lng: -122.375022}, {lat:  47.707693, lng: -122.37502}, {lat:  47.707691, lng: -122.375018}, {lat:  47.707689, lng: -122.375015}, {lat:  47.707687, lng: -122.375012}, {lat:  47.707686, lng: -122.37501}, {lat:  47.707685, lng: -122.375009}, {lat:  47.707683, lng: -122.375006}, {lat:  47.707681, lng: -122.375003}, {lat:  47.70768, lng: -122.375}, {lat:  47.707678, lng: -122.374997}, {lat:  47.707676, lng: -122.374994}, {lat:  47.707674, lng: -122.374991}, {lat:  47.707673, lng: -122.37499}, {lat:  47.707672, lng: -122.374988}, {lat:  47.70767, lng: -122.374986}, {lat:  47.70767, lng: -122.374985}, {lat:  47.707668, lng: -122.374982}, {lat:  47.707667, lng: -122.374979}, {lat:  47.707665, lng: -122.374976}, {lat:  47.707663, lng: -122.374973}, {lat:  47.707661, lng: -122.374969}, {lat:  47.70766, lng: -122.374966}, {lat:  47.707658, lng: -122.374963}, {lat:  47.707656, lng: -122.37496}, {lat:  47.707655, lng: -122.374957}, {lat:  47.707653, lng: -122.374954}, {lat:  47.707652, lng: -122.37495}, {lat:  47.70765, lng: -122.374947}, {lat:  47.707648, lng: -122.374944}, {lat:  47.707647, lng: -122.37494}, {lat:  47.707645, lng: -122.374937}, {lat:  47.707644, lng: -122.374934}, {lat:  47.707643, lng: -122.374933}, {lat:  47.707642, lng: -122.37493}, {lat:  47.707641, lng: -122.374927}, {lat:  47.70764, lng: -122.374926}, {lat:  47.707639, lng: -122.374923}, {lat:  47.707638, lng: -122.37492}, {lat:  47.707636, lng: -122.374916}, {lat:  47.707635, lng: -122.374913}, {lat:  47.707633, lng: -122.37491}, {lat:  47.707632, lng: -122.374906}, {lat:  47.707631, lng: -122.374905}, {lat:  47.707631, lng: -122.374903}, {lat:  47.707629, lng: -122.374899}, {lat:  47.707628, lng: -122.374895}, {lat:  47.707627, lng: -122.374892}, {lat:  47.707626, lng: -122.374888}, {lat:  47.707625, lng: -122.374888}, {lat:  47.707624, lng: -122.374885}, {lat:  47.707623, lng: -122.374881}, {lat:  47.707622, lng: -122.374877}, {lat:  47.707621, lng: -122.374875}, {lat:  47.70762, lng: -122.374874}, {lat:  47.707619, lng: -122.37487}, {lat:  47.707618, lng: -122.374866}, {lat:  47.707617, lng: -122.374863}, {lat:  47.707616, lng: -122.374859}, {lat:  47.707615, lng: -122.374855}, {lat:  47.707614, lng: -122.374851}, {lat:  47.707613, lng: -122.374848}, {lat:  47.707612, lng: -122.374845}, {lat:  47.707612, lng: -122.374844}, {lat:  47.707611, lng: -122.37484}, {lat:  47.70761, lng: -122.374836}, {lat:  47.707609, lng: -122.374833}, {lat:  47.707608, lng: -122.374829}, {lat:  47.707607, lng: -122.374825}, {lat:  47.707606, lng: -122.374821}, {lat:  47.707605, lng: -122.374817}, {lat:  47.707604, lng: -122.374814}, {lat:  47.707603, lng: -122.37481}, {lat:  47.707602, lng: -122.374806}, {lat:  47.707602, lng: -122.374802}, {lat:  47.707601, lng: -122.374798}, {lat:  47.7076, lng: -122.374795}, {lat:  47.707599, lng: -122.374791}, {lat:  47.707598, lng: -122.374787}, {lat:  47.707597, lng: -122.374783}, {lat:  47.707597, lng: -122.374782}, {lat:  47.707597, lng: -122.374781}, {lat:  47.707597, lng: -122.374779}, {lat:  47.707596, lng: -122.374775}, {lat:  47.707595, lng: -122.374771}, {lat:  47.707595, lng: -122.374767}, {lat:  47.707595, lng: -122.374766}, {lat:  47.707594, lng: -122.374763}, {lat:  47.707594, lng: -122.374759}, {lat:  47.707593, lng: -122.374755}, {lat:  47.707592, lng: -122.37475}, {lat:  47.707505, lng: -122.374093}, {lat:  47.705195, lng: -122.37408}, {lat:  47.705186, lng: -122.37408}, {lat:  47.705186, lng: -122.374042}, {lat:  47.705182, lng: -122.372747}, {lat:  47.705178, lng: -122.371393}, {lat:  47.705178, lng: -122.371296}, {lat:  47.705178, lng: -122.371294}, {lat:  47.705177, lng: -122.371026}, {lat:  47.705174, lng: -122.370313}, {lat:  47.705174, lng: -122.370294}, {lat:  47.705174, lng: -122.370154}, {lat:  47.705177, lng: -122.370154}, {lat:  47.705168, lng: -122.368746}, {lat:  47.705168, lng: -122.368745}, {lat:  47.705169, lng: -122.368745}, {lat:  47.705169, lng: -122.368623}, {lat:  47.705169, lng: -122.368621}, {lat:  47.705167, lng: -122.368078}, {lat:  47.705167, lng: -122.367982}, {lat:  47.705165, lng: -122.367411}, {lat:  47.705162, lng: -122.366633}, {lat:  47.705161, lng: -122.366077}, {lat:  47.70516, lng: -122.365955}, {lat:  47.705158, lng: -122.36572}, {lat:  47.705158, lng: -122.365715}, {lat:  47.705156, lng: -122.365503}, {lat:  47.705156, lng: -122.365442}, {lat:  47.705156, lng: -122.365415}, {lat:  47.705151, lng: -122.36472}, {lat:  47.705151, lng: -122.36471}, {lat:  47.705148, lng: -122.364273}, {lat:  47.705147, lng: -122.364249}, {lat:  47.705138, lng: -122.362999}, {lat:  47.705138, lng: -122.362939}, {lat:  47.705136, lng: -122.36268}, {lat:  47.705136, lng: -122.362628}, {lat:  47.705136, lng: -122.362622}, {lat:  47.705123, lng: -122.360887}, {lat:  47.705122, lng: -122.360765}, {lat:  47.705121, lng: -122.360643}, {lat:  47.705121, lng: -122.360642}, {lat:  47.705119, lng: -122.360378}, {lat:  47.705119, lng: -122.360368}, {lat:  47.705117, lng: -122.360009}, {lat:  47.705113, lng: -122.359498}, {lat:  47.705113, lng: -122.359437}, {lat:  47.705105, lng: -122.358433}, {lat:  47.705105, lng: -122.358409}, {lat:  47.705103, lng: -122.358109}, {lat:  47.705103, lng: -122.358095}, {lat:  47.705103, lng: -122.358088}, {lat:  47.705103, lng: -122.358072}, {lat:  47.705102, lng: -122.357987}, {lat:  47.705098, lng: -122.357475}, {lat:  47.705093, lng: -122.356781}, {lat:  47.705093, lng: -122.356724}, {lat:  47.705087, lng: -122.355964}, {lat:  47.705087, lng: -122.355875}, {lat:  47.705085, lng: -122.355661}, {lat:  47.705084, lng: -122.355575}, {lat:  47.705084, lng: -122.355453}, {lat:  47.704453, lng: -122.355446}, {lat:  47.70441, lng: -122.355446}, {lat:  47.704398, lng: -122.355446}, {lat:  47.704359, lng: -122.355445}, {lat:  47.703635, lng: -122.355438}, {lat:  47.70291, lng: -122.35543}, {lat:  47.702268, lng: -122.355423}, {lat:  47.702186, lng: -122.355422}, {lat:  47.701864, lng: -122.355419}, {lat:  47.701739, lng: -122.355418}, {lat:  47.701461, lng: -122.355415}, {lat:  47.700091, lng: -122.355401}, {lat:  47.699921, lng: -122.355399}, {lat:  47.69965, lng: -122.355396}, {lat:  47.699623, lng: -122.355396}, {lat:  47.699204, lng: -122.355391}, {lat:  47.698257, lng: -122.355381}, {lat:  47.697839, lng: -122.355377}, {lat:  47.696028, lng: -122.355358}, {lat:  47.694217, lng: -122.355339}, {lat:  47.692418, lng: -122.355321}, {lat:  47.692417, lng: -122.355321}, {lat:  47.692413, lng: -122.353952}, {lat:  47.692409, lng: -122.352622}, {lat:  47.692405, lng: -122.351292}, {lat:  47.692405, lng: -122.351291}, {lat:  47.692406, lng: -122.351291}, {lat:  47.692402, lng: -122.349934}, {lat:  47.692028, lng: -122.349929}, {lat:  47.691303, lng: -122.349921}, {lat:  47.690579, lng: -122.349912}, {lat:  47.690579, lng: -122.349907}, {lat:  47.690579, lng: -122.349892}, {lat:  47.690571, lng: -122.34722}, {lat:  47.690571, lng: -122.347215}, {lat:  47.690571, lng: -122.347207}, {lat:  47.690571, lng: -122.347202}, {lat:  47.690563, lng: -122.344522}, {lat:  47.690554, lng: -122.343449}, {lat:  47.690554, lng: -122.343446}, {lat:  47.690546, lng: -122.342373}, {lat:  47.690546, lng: -122.34237}, {lat:  47.690542, lng: -122.341828}, {lat:  47.690538, lng: -122.341296}, {lat:  47.690538, lng: -122.341294}, {lat:  47.690532, lng: -122.34048}, {lat:  47.69053, lng: -122.340222}, {lat:  47.69053, lng: -122.340218}, {lat:  47.690523, lng: -122.339276}, {lat:  47.690523, lng: -122.339264}, {lat:  47.690522, lng: -122.339134}, {lat:  47.690513, lng: -122.338084}, {lat:  47.690513, lng: -122.338078}, {lat:  47.690512, lng: -122.337953}, {lat:  47.690511, lng: -122.337786}, {lat:  47.690511, lng: -122.337701}, {lat:  47.690508, lng: -122.337417}, {lat:  47.690506, lng: -122.337129}, {lat:  47.690505, lng: -122.337023}, {lat:  47.690502, lng: -122.336577}, {lat:  47.690502, lng: -122.336562}, {lat:  47.690501, lng: -122.336516}, {lat:  47.690501, lng: -122.33644}, {lat:  47.6905, lng: -122.336327}, {lat:  47.6905, lng: -122.33632}, {lat:  47.6905, lng: -122.336319}, {lat:  47.6905, lng: -122.336311}, {lat:  47.6905, lng: -122.336305}, {lat:  47.690492, lng: -122.335217}, {lat:  47.690492, lng: -122.335215}, {lat:  47.690491, lng: -122.335207}, {lat:  47.690491, lng: -122.335094}, {lat:  47.69049, lng: -122.335039}, {lat:  47.69049, lng: -122.334973}, {lat:  47.69049, lng: -122.334972}, {lat:  47.690481, lng: -122.33387}, {lat:  47.690481, lng: -122.333868}, {lat:  47.69048, lng: -122.333751}, {lat:  47.69048, lng: -122.333748}, {lat:  47.690481, lng: -122.333747}, {lat:  47.69048, lng: -122.333747}, {lat:  47.690478, lng: -122.333462}, {lat:  47.690476, lng: -122.333184}, {lat:  47.690475, lng: -122.33311}, {lat:  47.690475, lng: -122.333109}, {lat:  47.690468, lng: -122.332128}, {lat:  47.69046, lng: -122.331088}, {lat:  47.69046, lng: -122.33106}, {lat:  47.690457, lng: -122.330729}, {lat:  47.690457, lng: -122.330728}, {lat:  47.690454, lng: -122.33032}, {lat:  47.690449, lng: -122.329723}, {lat:  47.690449, lng: -122.32972}, {lat:  47.690449, lng: -122.329707}, {lat:  47.690447, lng: -122.329371}, {lat:  47.690446, lng: -122.329316}, {lat:  47.690446, lng: -122.329315}, {lat:  47.690446, lng: -122.329312}, {lat:  47.690445, lng: -122.329174}, {lat:  47.690445, lng: -122.329163}, {lat:  47.690445, lng: -122.329117}, {lat:  47.690443, lng: -122.328955}, {lat:  47.690441, lng: -122.328723}, {lat:  47.690441, lng: -122.328716}, {lat:  47.69044, lng: -122.328507}, {lat:  47.690439, lng: -122.328441}, {lat:  47.690439, lng: -122.328439}, {lat:  47.690439, lng: -122.328438}, {lat:  47.690439, lng: -122.328434}, {lat:  47.690439, lng: -122.328373}, {lat:  47.690438, lng: -122.328239}, {lat:  47.690438, lng: -122.328233}, {lat:  47.690428, lng: -122.327034}, {lat:  47.690428, lng: -122.32703}, {lat:  47.690428, lng: -122.327022}, {lat:  47.690428, lng: -122.32702}, {lat:  47.690428, lng: -122.327012}, {lat:  47.690418, lng: -122.325687}, {lat:  47.690418, lng: -122.32568}, {lat:  47.690407, lng: -122.324342}, {lat:  47.690407, lng: -122.32434}, {lat:  47.690398, lng: -122.323082}, {lat:  47.690398, lng: -122.323081}, {lat:  47.690397, lng: -122.323}, {lat:  47.690383, lng: -122.320308}, {lat:  47.690376, lng: -122.318964}, {lat:  47.690369, lng: -122.317616}, {lat:  47.690368, lng: -122.317455}, {lat:  47.690366, lng: -122.316954}, {lat:  47.690365, lng: -122.316823}, {lat:  47.690362, lng: -122.316244}, {lat:  47.690357, lng: -122.315293}, {lat:  47.690356, lng: -122.315035}, {lat:  47.690356, lng: -122.315005}, {lat:  47.690355, lng: -122.314924}, {lat:  47.690354, lng: -122.314632}, {lat:  47.690353, lng: -122.314539}, {lat:  47.690351, lng: -122.314157}, {lat:  47.690351, lng: -122.314107}, {lat:  47.690348, lng: -122.313539}, {lat:  47.690348, lng: -122.3135}, {lat:  47.690348, lng: -122.313492}, {lat:  47.690348, lng: -122.313483}, {lat:  47.690348, lng: -122.313482}, {lat:  47.690347, lng: -122.313447}, {lat:  47.690345, lng: -122.312931}, {lat:  47.690341, lng: -122.312232}, {lat:  47.690339, lng: -122.312232}, {lat:  47.690332, lng: -122.311157}, {lat:  47.690324, lng: -122.310082}, {lat:  47.690324, lng: -122.31008}, {lat:  47.690326, lng: -122.31008}, {lat:  47.690322, lng: -122.309542}, {lat:  47.690322, lng: -122.309474}, {lat:  47.690314, lng: -122.308354}, {lat:  47.690313, lng: -122.30817}, {lat:  47.690311, lng: -122.307985}, {lat:  47.690311, lng: -122.30793}, {lat:  47.69031, lng: -122.307808}, {lat:  47.690304, lng: -122.306975}, {lat:  47.690304, lng: -122.306909}, {lat:  47.690303, lng: -122.306854}, {lat:  47.690302, lng: -122.306854}, {lat:  47.690294, lng: -122.305718}, {lat:  47.690283, lng: -122.304167}, {lat:  47.690266, lng: -122.301671}, {lat:  47.689982, lng: -122.30156}, {lat:  47.689688, lng: -122.301454}, {lat:  47.689449, lng: -122.301479}, {lat:  47.689449, lng: -122.301478}, {lat:  47.689451, lng: -122.301477}, {lat:  47.689451, lng: -122.301453}, {lat:  47.68945, lng: -122.301355}, {lat:  47.689434, lng: -122.298728}, {lat:  47.689426, lng: -122.297502}, {lat:  47.689426, lng: -122.297382}, {lat:  47.689426, lng: -122.29738}, {lat:  47.69024, lng: -122.297372}, {lat:  47.690242, lng: -122.297372}, {lat:  47.690241, lng: -122.297334}, {lat:  47.690241, lng: -122.297311}, {lat:  47.690241, lng: -122.297309}, {lat:  47.690238, lng: -122.296779}, {lat:  47.690235, lng: -122.296218}, {lat:  47.690235, lng: -122.296217}, {lat:  47.690234, lng: -122.296095}, {lat:  47.690234, lng: -122.296023}, {lat:  47.690234, lng: -122.296022}, {lat:  47.69023, lng: -122.295412}, {lat:  47.690228, lng: -122.29504}, {lat:  47.690226, lng: -122.294757}, {lat:  47.690224, lng: -122.294391}, {lat:  47.690218, lng: -122.293396}, {lat:  47.690218, lng: -122.293395}, {lat:  47.690214, lng: -122.292735}, {lat:  47.690212, lng: -122.292239}, {lat:  47.690206, lng: -122.291368}, {lat:  47.690203, lng: -122.290714}, {lat:  47.690202, lng: -122.290713}, {lat:  47.690201, lng: -122.290069}, {lat:  47.690198, lng: -122.28928}, {lat:  47.690194, lng: -122.288076}, {lat:  47.690194, lng: -122.288033}, {lat:  47.690192, lng: -122.287497}, {lat:  47.690189, lng: -122.286441}, {lat:  47.690189, lng: -122.286436}, {lat:  47.690187, lng: -122.286025}, {lat:  47.690186, lng: -122.285477}, {lat:  47.690185, lng: -122.285337}, {lat:  47.690185, lng: -122.285216}, {lat:  47.690185, lng: -122.285215}, {lat:  47.690182, lng: -122.284354}, {lat:  47.690181, lng: -122.284003}, {lat:  47.690179, lng: -122.283371}, {lat:  47.690175, lng: -122.28241}, {lat:  47.690175, lng: -122.282409}, {lat:  47.690175, lng: -122.28239}, {lat:  47.690565, lng: -122.282366}, {lat:  47.690596, lng: -122.282362}, {lat:  47.690599, lng: -122.282357}, {lat:  47.69061, lng: -122.282328}, {lat:  47.690625, lng: -122.282294}, {lat:  47.690642, lng: -122.282261}, {lat:  47.690659, lng: -122.28223}, {lat:  47.690677, lng: -122.2822}, {lat:  47.690696, lng: -122.282171}, {lat:  47.690703, lng: -122.282162}, {lat:  47.690707, lng: -122.282155}, {lat:  47.690715, lng: -122.282146}, {lat:  47.690716, lng: -122.282144}, {lat:  47.690737, lng: -122.282119}, {lat:  47.690759, lng: -122.282094}, {lat:  47.69078, lng: -122.282074}, {lat:  47.690782, lng: -122.282072}, {lat:  47.690805, lng: -122.282051}, {lat:  47.690829, lng: -122.282032}, {lat:  47.690854, lng: -122.282015}, {lat:  47.690876, lng: -122.282002}, {lat:  47.690877, lng: -122.282001}, {lat:  47.690878, lng: -122.282001}, {lat:  47.690879, lng: -122.282}, {lat:  47.690905, lng: -122.281986}, {lat:  47.690931, lng: -122.281975}, {lat:  47.690958, lng: -122.281965}, {lat:  47.690984, lng: -122.281957}, {lat:  47.691011, lng: -122.281952}, {lat:  47.691038, lng: -122.281948}, {lat:  47.691066, lng: -122.281946}, {lat:  47.691093, lng: -122.281947}, {lat:  47.691096, lng: -122.281947}, {lat:  47.69112, lng: -122.281949}, {lat:  47.691147, lng: -122.281953}, {lat:  47.691174, lng: -122.28196}, {lat:  47.691201, lng: -122.281968}, {lat:  47.691452, lng: -122.281654}, {lat:  47.691665, lng: -122.281511}, {lat:  47.691262, lng: -122.281191}, {lat:  47.690895, lng: -122.2807}, {lat:  47.690476, lng: -122.280417}, {lat:  47.690167, lng: -122.279972}, {lat:  47.690167, lng: -122.279959}, {lat:  47.690167, lng: -122.279958}, {lat:  47.690167, lng: -122.279879}, {lat:  47.690167, lng: -122.279837}, {lat:  47.690166, lng: -122.279431}, {lat:  47.690165, lng: -122.279234}, {lat:  47.690163, lng: -122.278619}, {lat:  47.690162, lng: -122.278347}, {lat:  47.690161, lng: -122.277937}, {lat:  47.69016, lng: -122.277772}, {lat:  47.69016, lng: -122.277653}, {lat:  47.69016, lng: -122.277532}, {lat:  47.690159, lng: -122.277464}, {lat:  47.690226, lng: -122.277457}, {lat:  47.690439, lng: -122.277426}, {lat:  47.690535, lng: -122.277389}, {lat:  47.690573, lng: -122.277272}, {lat:  47.690592, lng: -122.27715}, {lat:  47.690595, lng: -122.277012}, {lat:  47.691307, lng: -122.276733}, {lat:  47.69165, lng: -122.276596}, {lat:  47.692087, lng: -122.275567}, {lat:  47.692142, lng: -122.275356}, {lat:  47.692365, lng: -122.274457}, {lat:  47.692423, lng: -122.273908}, {lat:  47.692451, lng: -122.273707}, {lat:  47.692478, lng: -122.273612}, {lat:  47.692546, lng: -122.273484}, {lat:  47.692705, lng: -122.273262}, {lat:  47.692749, lng: -122.27316}, {lat:  47.692789, lng: -122.273012}, {lat:  47.692806, lng: -122.272813}, {lat:  47.692793, lng: -122.272633}, {lat:  47.692758, lng: -122.272436}, {lat:  47.692679, lng: -122.272179}, {lat:  47.69267, lng: -122.272071}, {lat:  47.692689, lng: -122.271972}, {lat:  47.692726, lng: -122.271912}, {lat:  47.692814, lng: -122.271851}, {lat:  47.692817, lng: -122.271848}, {lat:  47.69279, lng: -122.271756}, {lat:  47.692762, lng: -122.27166}, {lat:  47.692721, lng: -122.271536}, {lat:  47.692695, lng: -122.27145}, {lat:  47.69257, lng: -122.271109}, {lat:  47.692434, lng: -122.270828}, {lat:  47.692295, lng: -122.270536}, {lat:  47.692149, lng: -122.270286}, {lat:  47.692011, lng: -122.270092}, {lat:  47.691526, lng: -122.269354}, {lat:  47.6915, lng: -122.269305}, {lat:  47.691433, lng: -122.269182}, {lat:  47.69138, lng: -122.269083}, {lat:  47.691374, lng: -122.269073}, {lat:  47.691346, lng: -122.269025}, {lat:  47.691315, lng: -122.268974}, {lat:  47.691289, lng: -122.268932}, {lat:  47.691274, lng: -122.268908}, {lat:  47.691272, lng: -122.268905}, {lat:  47.69127, lng: -122.268902}, {lat:  47.691268, lng: -122.268899}, {lat:  47.691266, lng: -122.268896}, {lat:  47.691264, lng: -122.268893}, {lat:  47.691263, lng: -122.268892}, {lat:  47.691263, lng: -122.26889}, {lat:  47.691261, lng: -122.268887}, {lat:  47.691259, lng: -122.268885}, {lat:  47.691257, lng: -122.268882}, {lat:  47.691255, lng: -122.268879}, {lat:  47.691253, lng: -122.268876}, {lat:  47.691251, lng: -122.268873}, {lat:  47.691249, lng: -122.26887}, {lat:  47.691247, lng: -122.268867}, {lat:  47.691245, lng: -122.268865}, {lat:  47.691243, lng: -122.268862}, {lat:  47.691241, lng: -122.268859}, {lat:  47.691239, lng: -122.268856}, {lat:  47.691237, lng: -122.268853}, {lat:  47.691235, lng: -122.26885}, {lat:  47.691233, lng: -122.268847}, {lat:  47.691231, lng: -122.268845}, {lat:  47.691229, lng: -122.268842}, {lat:  47.691227, lng: -122.268839}, {lat:  47.691226, lng: -122.268836}, {lat:  47.691224, lng: -122.268833}, {lat:  47.691222, lng: -122.26883}, {lat:  47.69122, lng: -122.268828}, {lat:  47.691218, lng: -122.268825}, {lat:  47.691216, lng: -122.268822}, {lat:  47.691214, lng: -122.268819}, {lat:  47.691212, lng: -122.268816}, {lat:  47.69121, lng: -122.268814}, {lat:  47.691208, lng: -122.268811}, {lat:  47.691206, lng: -122.268808}, {lat:  47.691204, lng: -122.268805}, {lat:  47.691202, lng: -122.268802}, {lat:  47.6912, lng: -122.2688}, {lat:  47.691198, lng: -122.268797}, {lat:  47.691196, lng: -122.268794}, {lat:  47.691194, lng: -122.268791}, {lat:  47.691192, lng: -122.268788}, {lat:  47.69119, lng: -122.268786}, {lat:  47.691188, lng: -122.268783}, {lat:  47.691186, lng: -122.26878}, {lat:  47.691184, lng: -122.268777}, {lat:  47.691182, lng: -122.268775}, {lat:  47.69118, lng: -122.268772}, {lat:  47.691178, lng: -122.268769}, {lat:  47.691176, lng: -122.268766}, {lat:  47.691174, lng: -122.268764}, {lat:  47.691172, lng: -122.268761}, {lat:  47.69117, lng: -122.268758}, {lat:  47.691168, lng: -122.268755}, {lat:  47.691166, lng: -122.268753}, {lat:  47.691164, lng: -122.26875}, {lat:  47.691162, lng: -122.268747}, {lat:  47.69116, lng: -122.268744}, {lat:  47.691158, lng: -122.268742}, {lat:  47.691156, lng: -122.268739}, {lat:  47.691154, lng: -122.268736}, {lat:  47.691152, lng: -122.268733}, {lat:  47.69115, lng: -122.268731}, {lat:  47.691147, lng: -122.268728}, {lat:  47.691145, lng: -122.268725}, {lat:  47.691143, lng: -122.268723}, {lat:  47.691141, lng: -122.26872}, {lat:  47.691139, lng: -122.268717}, {lat:  47.691137, lng: -122.268714}, {lat:  47.691135, lng: -122.268712}, {lat:  47.691133, lng: -122.268709}, {lat:  47.691131, lng: -122.268706}, {lat:  47.691129, lng: -122.268704}, {lat:  47.691127, lng: -122.268701}, {lat:  47.691125, lng: -122.268698}, {lat:  47.691123, lng: -122.268695}, {lat:  47.691121, lng: -122.268693}, {lat:  47.691119, lng: -122.26869}, {lat:  47.691117, lng: -122.268687}, {lat:  47.691115, lng: -122.268685}, {lat:  47.691113, lng: -122.268682}, {lat:  47.691111, lng: -122.268679}, {lat:  47.691109, lng: -122.268676}, {lat:  47.691106, lng: -122.268674}, {lat:  47.691104, lng: -122.268671}, {lat:  47.691102, lng: -122.268668}, {lat:  47.6911, lng: -122.268666}, {lat:  47.691098, lng: -122.268663}, {lat:  47.691096, lng: -122.26866}, {lat:  47.691094, lng: -122.268658}, {lat:  47.691092, lng: -122.268655}, {lat:  47.69109, lng: -122.268652}, {lat:  47.691088, lng: -122.26865}, {lat:  47.691086, lng: -122.268647}, {lat:  47.691084, lng: -122.268645}, {lat:  47.691082, lng: -122.268642}, {lat:  47.691079, lng: -122.268639}, {lat:  47.691077, lng: -122.268637}, {lat:  47.691075, lng: -122.268634}, {lat:  47.691073, lng: -122.268631}, {lat:  47.691071, lng: -122.268629}, {lat:  47.691069, lng: -122.268626}, {lat:  47.691067, lng: -122.268624}, {lat:  47.691065, lng: -122.268621}, {lat:  47.691063, lng: -122.268618}, {lat:  47.691061, lng: -122.268616}, {lat:  47.691058, lng: -122.268613}, {lat:  47.691056, lng: -122.268611}, {lat:  47.691054, lng: -122.268608}, {lat:  47.691052, lng: -122.268605}, {lat:  47.69105, lng: -122.268603}, {lat:  47.691048, lng: -122.2686}, {lat:  47.691046, lng: -122.268598}, {lat:  47.691044, lng: -122.268595}, {lat:  47.691042, lng: -122.268593}, {lat:  47.691039, lng: -122.26859}, {lat:  47.691037, lng: -122.268587}, {lat:  47.691035, lng: -122.268585}, {lat:  47.691033, lng: -122.268582}, {lat:  47.691031, lng: -122.26858}, {lat:  47.691029, lng: -122.268577}, {lat:  47.691027, lng: -122.268575}, {lat:  47.691025, lng: -122.268572}, {lat:  47.691022, lng: -122.268569}, {lat:  47.69102, lng: -122.268567}, {lat:  47.691018, lng: -122.268564}, {lat:  47.691016, lng: -122.268562}, {lat:  47.691014, lng: -122.268559}, {lat:  47.691012, lng: -122.268557}, {lat:  47.69101, lng: -122.268554}, {lat:  47.691008, lng: -122.268552}, {lat:  47.691005, lng: -122.268549}, {lat:  47.691003, lng: -122.268547}, {lat:  47.691001, lng: -122.268544}, {lat:  47.690999, lng: -122.268542}, {lat:  47.690997, lng: -122.268539}, {lat:  47.690995, lng: -122.268537}, {lat:  47.690992, lng: -122.268534}, {lat:  47.69099, lng: -122.268532}, {lat:  47.690988, lng: -122.268529}, {lat:  47.690986, lng: -122.268527}, {lat:  47.690984, lng: -122.268524}, {lat:  47.690982, lng: -122.268522}, {lat:  47.690979, lng: -122.268519}, {lat:  47.690977, lng: -122.268517}, {lat:  47.690975, lng: -122.268514}, {lat:  47.690973, lng: -122.268512}, {lat:  47.690971, lng: -122.268509}, {lat:  47.690969, lng: -122.268507}, {lat:  47.690966, lng: -122.268504}, {lat:  47.690964, lng: -122.268502}, {lat:  47.690962, lng: -122.268499}, {lat:  47.69096, lng: -122.268497}, {lat:  47.690958, lng: -122.268494}, {lat:  47.690956, lng: -122.268492}, {lat:  47.690953, lng: -122.268489}, {lat:  47.690951, lng: -122.268487}, {lat:  47.690949, lng: -122.268485}, {lat:  47.690947, lng: -122.268482}, {lat:  47.690945, lng: -122.26848}, {lat:  47.690942, lng: -122.268477}, {lat:  47.69094, lng: -122.268475}, {lat:  47.690938, lng: -122.268472}, {lat:  47.690936, lng: -122.26847}, {lat:  47.690934, lng: -122.268467}, {lat:  47.690932, lng: -122.268465}, {lat:  47.690929, lng: -122.268463}, {lat:  47.690927, lng: -122.26846}, {lat:  47.690925, lng: -122.268458}, {lat:  47.690923, lng: -122.268455}, {lat:  47.69092, lng: -122.268453}, {lat:  47.690918, lng: -122.268451}, {lat:  47.690916, lng: -122.268448}, {lat:  47.690914, lng: -122.268446}, {lat:  47.690912, lng: -122.268443}, {lat:  47.690909, lng: -122.268441}, {lat:  47.690907, lng: -122.268439}, {lat:  47.690905, lng: -122.268436}, {lat:  47.690903, lng: -122.268434}, {lat:  47.690901, lng: -122.268431}, {lat:  47.690898, lng: -122.268429}, {lat:  47.690896, lng: -122.268427}, {lat:  47.690894, lng: -122.268424}, {lat:  47.690892, lng: -122.268422}, {lat:  47.690889, lng: -122.268419}, {lat:  47.690887, lng: -122.268417}, {lat:  47.690885, lng: -122.268415}, {lat:  47.690883, lng: -122.268412}, {lat:  47.690881, lng: -122.26841}, {lat:  47.690878, lng: -122.268408}, {lat:  47.690876, lng: -122.268405}, {lat:  47.690874, lng: -122.268403}, {lat:  47.690872, lng: -122.268401}, {lat:  47.690869, lng: -122.268398}, {lat:  47.690867, lng: -122.268396}, {lat:  47.690865, lng: -122.268393}, {lat:  47.690863, lng: -122.268391}, {lat:  47.69086, lng: -122.268389}, {lat:  47.690858, lng: -122.268386}, {lat:  47.690856, lng: -122.268384}, {lat:  47.690854, lng: -122.268382}, {lat:  47.690851, lng: -122.26838}, {lat:  47.690849, lng: -122.268377}, {lat:  47.690847, lng: -122.268375}, {lat:  47.690845, lng: -122.268373}, {lat:  47.690842, lng: -122.26837}, {lat:  47.69084, lng: -122.268368}, {lat:  47.690838, lng: -122.268366}, {lat:  47.690836, lng: -122.268363}, {lat:  47.690833, lng: -122.268361}, {lat:  47.690831, lng: -122.268359}, {lat:  47.690829, lng: -122.268357}, {lat:  47.690827, lng: -122.268354}, {lat:  47.690824, lng: -122.268352}, {lat:  47.690822, lng: -122.26835}, {lat:  47.69082, lng: -122.268347}, {lat:  47.690818, lng: -122.268345}, {lat:  47.690815, lng: -122.268343}, {lat:  47.690813, lng: -122.26834}, {lat:  47.690811, lng: -122.268338}, {lat:  47.690808, lng: -122.268336}, {lat:  47.690806, lng: -122.268334}, {lat:  47.690804, lng: -122.268331}, {lat:  47.690802, lng: -122.268329}, {lat:  47.690799, lng: -122.268327}, {lat:  47.690797, lng: -122.268325}, {lat:  47.690795, lng: -122.268322}, {lat:  47.690792, lng: -122.26832}, {lat:  47.69079, lng: -122.268318}, {lat:  47.690788, lng: -122.268316}, {lat:  47.690786, lng: -122.268313}, {lat:  47.690783, lng: -122.268311}, {lat:  47.690781, lng: -122.268309}, {lat:  47.690779, lng: -122.268307}, {lat:  47.690776, lng: -122.268305}, {lat:  47.690774, lng: -122.268302}, {lat:  47.690772, lng: -122.2683}, {lat:  47.690769, lng: -122.268298}, {lat:  47.690767, lng: -122.268296}, {lat:  47.690765, lng: -122.268294}, {lat:  47.690763, lng: -122.268291}, {lat:  47.69076, lng: -122.268289}, {lat:  47.690758, lng: -122.268287}, {lat:  47.690756, lng: -122.268285}, {lat:  47.690753, lng: -122.268283}, {lat:  47.690751, lng: -122.268281}, {lat:  47.690749, lng: -122.268278}, {lat:  47.690746, lng: -122.268276}, {lat:  47.690744, lng: -122.268274}, {lat:  47.690742, lng: -122.268272}, {lat:  47.690739, lng: -122.26827}, {lat:  47.690737, lng: -122.268268}, {lat:  47.690735, lng: -122.268265}, {lat:  47.690732, lng: -122.268263}, {lat:  47.69073, lng: -122.268261}, {lat:  47.690728, lng: -122.268259}, {lat:  47.690726, lng: -122.268257}, {lat:  47.690723, lng: -122.268255}, {lat:  47.690721, lng: -122.268252}, {lat:  47.690719, lng: -122.26825}, {lat:  47.690716, lng: -122.268248}, {lat:  47.690714, lng: -122.268246}, {lat:  47.690711, lng: -122.268244}, {lat:  47.690709, lng: -122.268242}, {lat:  47.690707, lng: -122.26824}, {lat:  47.690704, lng: -122.268238}, {lat:  47.690702, lng: -122.268236}, {lat:  47.6907, lng: -122.268233}, {lat:  47.690697, lng: -122.268231}, {lat:  47.690695, lng: -122.268229}, {lat:  47.690693, lng: -122.268227}, {lat:  47.69069, lng: -122.268225}, {lat:  47.690688, lng: -122.268223}, {lat:  47.690686, lng: -122.268221}, {lat:  47.690683, lng: -122.268219}, {lat:  47.690681, lng: -122.268217}, {lat:  47.690679, lng: -122.268215}, {lat:  47.690676, lng: -122.268213}, {lat:  47.690674, lng: -122.26821}, {lat:  47.690672, lng: -122.268208}, {lat:  47.690669, lng: -122.268206}, {lat:  47.690667, lng: -122.268204}, {lat:  47.690665, lng: -122.268202}, {lat:  47.690662, lng: -122.2682}, {lat:  47.69066, lng: -122.268198}, {lat:  47.690657, lng: -122.268196}, {lat:  47.690655, lng: -122.268194}, {lat:  47.690653, lng: -122.268192}, {lat:  47.69065, lng: -122.26819}, {lat:  47.690648, lng: -122.268188}, {lat:  47.690646, lng: -122.268186}, {lat:  47.690643, lng: -122.268184}, {lat:  47.690641, lng: -122.268182}, {lat:  47.690639, lng: -122.26818}, {lat:  47.690636, lng: -122.268177}, {lat:  47.690634, lng: -122.268175}, {lat:  47.690631, lng: -122.268173}, {lat:  47.690629, lng: -122.268171}, {lat:  47.690627, lng: -122.268169}, {lat:  47.690624, lng: -122.268167}, {lat:  47.690622, lng: -122.268165}, {lat:  47.69062, lng: -122.268163}, {lat:  47.690617, lng: -122.268161}, {lat:  47.690615, lng: -122.268159}, {lat:  47.690613, lng: -122.268157}, {lat:  47.69061, lng: -122.268155}, {lat:  47.690608, lng: -122.268153}, {lat:  47.690605, lng: -122.268151}, {lat:  47.690603, lng: -122.268149}, {lat:  47.690601, lng: -122.268147}, {lat:  47.690598, lng: -122.268145}, {lat:  47.690596, lng: -122.268143}, {lat:  47.690594, lng: -122.26814}, {lat:  47.690591, lng: -122.268138}, {lat:  47.690589, lng: -122.268136}, {lat:  47.690587, lng: -122.268134}, {lat:  47.690584, lng: -122.268132}, {lat:  47.690582, lng: -122.26813}, {lat:  47.690579, lng: -122.268128}, {lat:  47.690577, lng: -122.268126}, {lat:  47.690575, lng: -122.268124}, {lat:  47.690572, lng: -122.268122}, {lat:  47.69057, lng: -122.26812}, {lat:  47.690568, lng: -122.268118}, {lat:  47.690565, lng: -122.268116}, {lat:  47.690563, lng: -122.268114}, {lat:  47.690561, lng: -122.268112}, {lat:  47.690558, lng: -122.26811}, {lat:  47.690556, lng: -122.268108}, {lat:  47.690553, lng: -122.268106}, {lat:  47.690551, lng: -122.268104}, {lat:  47.690549, lng: -122.268101}, {lat:  47.690546, lng: -122.268099}, {lat:  47.690544, lng: -122.268097}, {lat:  47.690542, lng: -122.268095}, {lat:  47.690539, lng: -122.268093}, {lat:  47.690537, lng: -122.268091}, {lat:  47.690535, lng: -122.268089}, {lat:  47.690532, lng: -122.268087}, {lat:  47.69053, lng: -122.268085}, {lat:  47.690527, lng: -122.268083}, {lat:  47.690525, lng: -122.268081}, {lat:  47.690523, lng: -122.268079}, {lat:  47.69052, lng: -122.268077}, {lat:  47.690518, lng: -122.268075}, {lat:  47.690516, lng: -122.268073}, {lat:  47.690513, lng: -122.268071}, {lat:  47.690511, lng: -122.268069}, {lat:  47.690508, lng: -122.268067}, {lat:  47.690506, lng: -122.268064}, {lat:  47.690504, lng: -122.268062}, {lat:  47.690501, lng: -122.26806}, {lat:  47.690499, lng: -122.268058}, {lat:  47.690497, lng: -122.268056}, {lat:  47.690494, lng: -122.268054}, {lat:  47.690492, lng: -122.268052}, {lat:  47.69049, lng: -122.26805}, {lat:  47.690487, lng: -122.268048}, {lat:  47.690485, lng: -122.268046}, {lat:  47.690482, lng: -122.268044}, {lat:  47.69048, lng: -122.268042}, {lat:  47.690478, lng: -122.26804}, {lat:  47.690475, lng: -122.268038}, {lat:  47.690473, lng: -122.268036}, {lat:  47.690471, lng: -122.268034}, {lat:  47.690468, lng: -122.268032}, {lat:  47.690466, lng: -122.26803}, {lat:  47.690464, lng: -122.268027}, {lat:  47.690461, lng: -122.268025}, {lat:  47.690459, lng: -122.268023}, {lat:  47.690456, lng: -122.268021}, {lat:  47.690454, lng: -122.268019}, {lat:  47.690452, lng: -122.268017}, {lat:  47.690449, lng: -122.268015}, {lat:  47.690447, lng: -122.268013}, {lat:  47.690445, lng: -122.268011}, {lat:  47.690442, lng: -122.268009}, {lat:  47.69044, lng: -122.268007}, {lat:  47.690438, lng: -122.268005}, {lat:  47.690435, lng: -122.268003}, {lat:  47.690433, lng: -122.268001}, {lat:  47.69043, lng: -122.267999}, {lat:  47.690428, lng: -122.267997}, {lat:  47.690426, lng: -122.267995}, {lat:  47.690423, lng: -122.267993}, {lat:  47.690421, lng: -122.267991}, {lat:  47.690419, lng: -122.267988}, {lat:  47.690416, lng: -122.267986}, {lat:  47.690414, lng: -122.267984}, {lat:  47.690412, lng: -122.267982}, {lat:  47.690409, lng: -122.26798}, {lat:  47.690407, lng: -122.267978}, {lat:  47.690404, lng: -122.267976}, {lat:  47.690402, lng: -122.267974}, {lat:  47.6904, lng: -122.267972}, {lat:  47.690397, lng: -122.26797}, {lat:  47.690395, lng: -122.267968}, {lat:  47.690393, lng: -122.267966}, {lat:  47.69039, lng: -122.267964}, {lat:  47.690388, lng: -122.267962}, {lat:  47.690386, lng: -122.26796}, {lat:  47.690383, lng: -122.267958}, {lat:  47.690381, lng: -122.267956}, {lat:  47.690378, lng: -122.267954}, {lat:  47.690376, lng: -122.267951}, {lat:  47.690374, lng: -122.267949}, {lat:  47.690371, lng: -122.267947}, {lat:  47.690369, lng: -122.267945}, {lat:  47.690367, lng: -122.267943}, {lat:  47.690364, lng: -122.267941}, {lat:  47.690362, lng: -122.267939}, {lat:  47.69036, lng: -122.267937}, {lat:  47.690357, lng: -122.267935}, {lat:  47.690355, lng: -122.267933}, {lat:  47.690352, lng: -122.267931}, {lat:  47.69035, lng: -122.267929}, {lat:  47.690348, lng: -122.267927}, {lat:  47.690345, lng: -122.267925}, {lat:  47.690343, lng: -122.267923}, {lat:  47.690341, lng: -122.267921}, {lat:  47.690338, lng: -122.267919}, {lat:  47.690336, lng: -122.267917}, {lat:  47.690334, lng: -122.267914}, {lat:  47.690331, lng: -122.267912}, {lat:  47.690329, lng: -122.26791}, {lat:  47.690326, lng: -122.267908}, {lat:  47.690324, lng: -122.267906}, {lat:  47.690322, lng: -122.267904}, {lat:  47.690319, lng: -122.267902}, {lat:  47.690317, lng: -122.2679}, {lat:  47.690315, lng: -122.267898}, {lat:  47.690312, lng: -122.267896}, {lat:  47.69031, lng: -122.267894}, {lat:  47.690308, lng: -122.267892}, {lat:  47.690305, lng: -122.26789}, {lat:  47.690303, lng: -122.267888}, {lat:  47.6903, lng: -122.267886}, {lat:  47.690298, lng: -122.267884}, {lat:  47.690296, lng: -122.267882}, {lat:  47.690293, lng: -122.26788}, {lat:  47.690291, lng: -122.267878}, {lat:  47.690289, lng: -122.267875}, {lat:  47.690286, lng: -122.267873}, {lat:  47.690284, lng: -122.267871}, {lat:  47.690281, lng: -122.267869}, {lat:  47.690279, lng: -122.267867}, {lat:  47.690277, lng: -122.267865}, {lat:  47.690274, lng: -122.267863}, {lat:  47.690272, lng: -122.267861}, {lat:  47.69027, lng: -122.267859}, {lat:  47.690267, lng: -122.267857}, {lat:  47.690265, lng: -122.267855}, {lat:  47.690263, lng: -122.267853}, {lat:  47.69026, lng: -122.267851}, {lat:  47.690258, lng: -122.267849}, {lat:  47.690255, lng: -122.267847}, {lat:  47.690253, lng: -122.267845}, {lat:  47.690251, lng: -122.267843}, {lat:  47.690248, lng: -122.267841}, {lat:  47.690246, lng: -122.267838}, {lat:  47.690244, lng: -122.267836}, {lat:  47.690241, lng: -122.267834}, {lat:  47.690239, lng: -122.267832}, {lat:  47.690237, lng: -122.26783}, {lat:  47.690234, lng: -122.267828}, {lat:  47.690232, lng: -122.267826}, {lat:  47.690229, lng: -122.267824}, {lat:  47.690227, lng: -122.267822}, {lat:  47.690225, lng: -122.26782}, {lat:  47.690222, lng: -122.267818}, {lat:  47.69022, lng: -122.267816}, {lat:  47.690218, lng: -122.267814}, {lat:  47.690215, lng: -122.267812}, {lat:  47.690213, lng: -122.26781}, {lat:  47.690211, lng: -122.267807}, {lat:  47.690206, lng: -122.267804}, {lat:  47.690124, lng: -122.267729}, {lat:  47.690123, lng: -122.267729}, {lat:  47.690123, lng: -122.267687}, {lat:  47.690122, lng: -122.26752}, {lat:  47.690122, lng: -122.267497}, {lat:  47.69012, lng: -122.267307}, {lat:  47.69012, lng: -122.267245}, {lat:  47.690119, lng: -122.267118}, {lat:  47.690119, lng: -122.267117}, {lat:  47.690118, lng: -122.267012}, {lat:  47.690117, lng: -122.266865}, {lat:  47.690117, lng: -122.266743}, {lat:  47.690116, lng: -122.266547}, {lat:  47.690116, lng: -122.266493}, {lat:  47.690116, lng: -122.266492}, {lat:  47.690115, lng: -122.266307}, {lat:  47.690179, lng: -122.26638}, {lat:  47.690326, lng: -122.266472}, {lat:  47.690748, lng: -122.266737}, {lat:  47.69083, lng: -122.26686}, {lat:  47.691031, lng: -122.267273}, {lat:  47.691293, lng: -122.267484}, {lat:  47.692022, lng: -122.267524}, {lat:  47.69224, lng: -122.267759}, {lat:  47.692404, lng: -122.268092}, {lat:  47.692861, lng: -122.269221}, {lat:  47.693024, lng: -122.269424}, {lat:  47.69335, lng: -122.269789}, {lat:  47.693587, lng: -122.270196}, {lat:  47.693797, lng: -122.270772}, {lat:  47.693954, lng: -122.2713}, {lat:  47.694064, lng: -122.271625}, {lat:  47.694227, lng: -122.271754}, {lat:  47.694285, lng: -122.271072}, {lat:  47.694411, lng: -122.27108}, {lat:  47.694556, lng: -122.271267}, {lat:  47.694387, lng: -122.271454}, {lat:  47.694344, lng: -122.271795}, {lat:  47.694416, lng: -122.271885}, {lat:  47.694569, lng: -122.271884}, {lat:  47.69482, lng: -122.271648}, {lat:  47.695052, lng: -122.271544}, {lat:  47.695566, lng: -122.271632}, {lat:  47.695597, lng: -122.272168}, {lat:  47.695768, lng: -122.272224}, {lat:  47.696046, lng: -122.272053}, {lat:  47.69619, lng: -122.272045}, {lat:  47.696516, lng: -122.272345}, {lat:  47.696886, lng: -122.272589}, {lat:  47.697175, lng: -122.272663}, {lat:  47.697321, lng: -122.272653}, {lat:  47.697849, lng: -122.27262}, {lat:  47.698307, lng: -122.272474}, {lat:  47.698568, lng: -122.272458}, {lat:  47.698801, lng: -122.272303}, {lat:  47.699124, lng: -122.272238}, {lat:  47.699332, lng: -122.272263}, {lat:  47.699701, lng: -122.272441}, {lat:  47.700035, lng: -122.272547}, {lat:  47.70053, lng: -122.272611}, {lat:  47.701008, lng: -122.272724}, {lat:  47.701523, lng: -122.273}, {lat:  47.70173, lng: -122.273024}, {lat:  47.70199, lng: -122.27299}, {lat:  47.702234, lng: -122.273041}, {lat:  47.702433, lng: -122.27317}, {lat:  47.702813, lng: -122.273544}, {lat:  47.702976, lng: -122.273673}, {lat:  47.703, lng: -122.273685}, {lat:  47.703733, lng: -122.274029}, {lat:  47.704204, lng: -122.274355}, {lat:  47.705322, lng: -122.274727}, {lat:  47.705582, lng: -122.274719}, {lat:  47.705889, lng: -122.274785}, {lat:  47.706096, lng: -122.274857}, {lat:  47.706357, lng: -122.274873}, {lat:  47.706887, lng: -122.274767}, {lat:  47.707158, lng: -122.2748}, {lat:  47.707698, lng: -122.274929}, {lat:  47.708032, lng: -122.275043}, {lat:  47.708312, lng: -122.275197}, {lat:  47.70852, lng: -122.275342}, {lat:  47.708827, lng: -122.275505}, {lat:  47.709323, lng: -122.275691}, {lat:  47.709838, lng: -122.275834}, {lat:  47.709881, lng: -122.275846}, {lat:  47.710047, lng: -122.275932}, {lat:  47.710674, lng: -122.276016}, {lat:  47.710936, lng: -122.276154}, {lat:  47.711355, lng: -122.276377}, {lat:  47.711693, lng: -122.27634}, {lat:  47.712098, lng: -122.276396}, {lat:  47.712287, lng: -122.276397}, {lat:  47.712575, lng: -122.276436}, {lat:  47.712843, lng: -122.276544}, {lat:  47.71318, lng: -122.27668}, {lat:  47.713351, lng: -122.276728}, {lat:  47.713901, lng: -122.27694}, {lat:  47.714361, lng: -122.277166}, {lat:  47.714431, lng: -122.276769}, {lat:  47.714548, lng: -122.276809}, {lat:  47.714677, lng: -122.277199}, {lat:  47.715091, lng: -122.277239}, {lat:  47.715433, lng: -122.277362}, {lat:  47.715542, lng: -122.277459}, {lat:  47.71557, lng: -122.277621}, {lat:  47.715989, lng: -122.277793}, {lat:  47.716084, lng: -122.277832}, {lat:  47.716895, lng: -122.278059}, {lat:  47.716938, lng: -122.277669}, {lat:  47.7171, lng: -122.277694}, {lat:  47.71704, lng: -122.2781}, {lat:  47.717292, lng: -122.278164}, {lat:  47.717407, lng: -122.277783}, {lat:  47.717551, lng: -122.277815}, {lat:  47.717463, lng: -122.278239}, {lat:  47.718022, lng: -122.278385}, {lat:  47.718081, lng: -122.277891}, {lat:  47.718143, lng: -122.277911}, {lat:  47.718224, lng: -122.277937}, {lat:  47.718226, lng: -122.277937}, {lat:  47.718166, lng: -122.278432}, {lat:  47.718798, lng: -122.278692}, {lat:  47.71906, lng: -122.278838}, {lat:  47.719129, lng: -122.278432}, {lat:  47.719149, lng: -122.278435}, {lat:  47.719238, lng: -122.278448}, {lat:  47.719258, lng: -122.278845}, {lat:  47.719447, lng: -122.278928}, {lat:  47.719464, lng: -122.27862}, {lat:  47.719479, lng: -122.278617}, {lat:  47.719514, lng: -122.278671}, {lat:  47.719584, lng: -122.278782}, {lat:  47.719594, lng: -122.279349}, {lat:  47.719703, lng: -122.279603}, {lat:  47.719859, lng: -122.279992}, {lat:  47.72005, lng: -122.280308}, {lat:  47.720285, lng: -122.280488}, {lat:  47.720781, lng: -122.28065}, {lat:  47.721232, lng: -122.280795}, {lat:  47.721656, lng: -122.281008}, {lat:  47.72189, lng: -122.281023}, {lat:  47.722402, lng: -122.280957}, {lat:  47.722914, lng: -122.28081}, {lat:  47.723112, lng: -122.280777}, {lat:  47.723768, lng: -122.280598}, {lat:  47.724153, lng: -122.280428}, {lat:  47.724728, lng: -122.280232}, {lat:  47.725007, lng: -122.280176}, {lat:  47.725366, lng: -122.28016}, {lat:  47.72551, lng: -122.280134}, {lat:  47.725816, lng: -122.280135}, {lat:  47.725961, lng: -122.280183}, {lat:  47.726177, lng: -122.280354}, {lat:  47.726353, lng: -122.280369}, {lat:  47.726547, lng: -122.280385}, {lat:  47.72697, lng: -122.280507}, {lat:  47.727386, lng: -122.280783}, {lat:  47.727656, lng: -122.280856}, {lat:  47.727774, lng: -122.28093}, {lat:  47.727928, lng: -122.281207}, {lat:  47.728046, lng: -122.28128}, {lat:  47.728262, lng: -122.281343}, {lat:  47.728478, lng: -122.281327}, {lat:  47.728631, lng: -122.281351}, {lat:  47.728839, lng: -122.28144}, {lat:  47.729201, lng: -122.281726}, {lat:  47.729426, lng: -122.281799}, {lat:  47.729749, lng: -122.281806}, {lat:  47.729974, lng: -122.281733}, {lat:  47.730199, lng: -122.281612}, {lat:  47.7308, lng: -122.281448}, {lat:  47.731195, lng: -122.281245}, {lat:  47.731378, lng: -122.281407}, {lat:  47.731664, lng: -122.281803}, {lat:  47.731928, lng: -122.282245}, {lat:  47.732373, lng: -122.282886}, {lat:  47.732679, lng: -122.28341}, {lat:  47.732848, lng: -122.283737}, {lat:  47.733061, lng: -122.283936}, {lat:  47.73364, lng: -122.284134}, {lat:  47.733654, lng: -122.284486}, {lat:  47.733656, lng: -122.284621}, {lat:  47.733662, lng: -122.284811}, {lat:  47.733665, lng: -122.284897}, {lat:  47.733665, lng: -122.284902}, {lat:  47.733689, lng: -122.285814}, {lat:  47.733726, lng: -122.285884}, {lat:  47.733738, lng: -122.285972}, {lat:  47.733734, lng: -122.286397}, {lat:  47.73373, lng: -122.286686}, {lat:  47.73373, lng: -122.286726}, {lat:  47.733727, lng: -122.287065}, {lat:  47.733735, lng: -122.288444}, {lat:  47.733738, lng: -122.289768}, {lat:  47.733742, lng: -122.290514}, {lat:  47.733742, lng: -122.291097}, {lat:  47.733753, lng: -122.292426}, {lat:  47.733753, lng: -122.292433}, {lat:  47.733751, lng: -122.292433}, {lat:  47.733751, lng: -122.292435}, {lat:  47.733762, lng: -122.29381}, {lat:  47.733769, lng: -122.294692}, {lat:  47.733773, lng: -122.295163}, {lat:  47.733774, lng: -122.295306}, {lat:  47.733784, lng: -122.296519}, {lat:  47.733784, lng: -122.29652}, {lat:  47.733795, lng: -122.297877}, {lat:  47.733806, lng: -122.299229}, {lat:  47.733806, lng: -122.29923}, {lat:  47.733817, lng: -122.300586}, {lat:  47.733828, lng: -122.301955}, {lat:  47.733846, lng: -122.303599}, {lat:  47.733856, lng: -122.304574}, {lat:  47.73386, lng: -122.304844}, {lat:  47.733874, lng: -122.305994}, {lat:  47.733876, lng: -122.306137}, {lat:  47.733876, lng: -122.306171}, {lat:  47.733889, lng: -122.307326}, {lat:  47.733896, lng: -122.308045}, {lat:  47.733904, lng: -122.308696}, {lat:  47.733919, lng: -122.310048}, {lat:  47.73395, lng: -122.312749}, {lat:  47.73395, lng: -122.31275}, {lat:  47.733975, lng: -122.315443}, {lat:  47.733988, lng: -122.31676}, {lat:  47.734001, lng: -122.318117}, {lat:  47.734026, lng: -122.320801}, {lat:  47.734039, lng: -122.322219}, {lat:  47.734052, lng: -122.323589}, {lat:  47.734059, lng: -122.324457}, {lat:  47.73406, lng: -122.324523}, {lat:  47.734061, lng: -122.324734}, {lat:  47.734062, lng: -122.324868}, {lat:  47.734063, lng: -122.324982}, {lat:  47.734065, lng: -122.325246}, {lat:  47.734062, lng: -122.32532}, {lat:  47.734069, lng: -122.325655}, {lat:  47.734073, lng: -122.326216}, {lat:  47.734074, lng: -122.326382}, {lat:  47.734093, lng: -122.328881}, {lat:  47.734103, lng: -122.330226}, {lat:  47.734114, lng: -122.331579}, {lat:  47.734125, lng: -122.33303}, {lat:  47.73413, lng: -122.333749}, {lat:  47.734135, lng: -122.334276}, {lat:  47.734135, lng: -122.334277}, {lat:  47.734134, lng: -122.335333}, {lat:  47.734134, lng: -122.335546}, {lat:  47.734134, lng: -122.335926}, {lat:  47.734133, lng: -122.336983}, {lat:  47.734132, lng: -122.338076}, {lat:  47.734132, lng: -122.338631}, {lat:  47.734131, lng: -122.339687}, {lat:  47.734131, lng: -122.339688}, {lat:  47.73413, lng: -122.340744}, {lat:  47.73413, lng: -122.341034}, {lat:  47.73413, lng: -122.341337}, {lat:  47.734129, lng: -122.342393}, {lat:  47.734128, lng: -122.343425}, {lat:  47.734128, lng: -122.344005}, {lat:  47.734127, lng: -122.344994}, {lat:  47.734127, lng: -122.345097}, {lat:  47.734127, lng: -122.345098}, {lat:  47.734127, lng: -122.345211}, {lat:  47.734127, lng: -122.3463}, {lat:  47.734127, lng: -122.347802}, {lat:  47.734127, lng: -122.347803}, {lat:  47.734128, lng: -122.350507}, {lat:  47.734128, lng: -122.351774}, {lat:  47.734128, lng: -122.35304}, {lat:  47.734128, lng: -122.35426}, {lat:  47.734129, lng: -122.355571}]
    ],
    { strokeColor: '#FF9900'}
  );
  var dist6 = handler.addPolygons(
    [
      [{lat:  47.709119, lng: -122.38044}, {lat:  47.709118, lng: -122.380514}, {lat:  47.708945, lng: -122.380579}, {lat:  47.708461, lng: -122.380761}, {lat:  47.707501, lng: -122.381772}, {lat:  47.706725, lng: -122.382588}, {lat:  47.704626, lng: -122.385369}, {lat:  47.703823, lng: -122.386824}, {lat:  47.702961, lng: -122.388656}, {lat:  47.702259, lng: -122.390687}, {lat:  47.701721, lng: -122.392142}, {lat:  47.699644, lng: -122.397762}, {lat:  47.698641, lng: -122.400372}, {lat:  47.697937, lng: -122.401793}, {lat:  47.697872, lng: -122.401879}, {lat:  47.696704, lng: -122.40342}, {lat:  47.695924, lng: -122.403928}, {lat:  47.695652, lng: -122.40405}, {lat:  47.695008, lng: -122.404335}, {lat:  47.694785, lng: -122.404672}, {lat:  47.694574, lng: -122.405215}, {lat:  47.694233, lng: -122.405825}, {lat:  47.693544, lng: -122.406501}, {lat:  47.69304, lng: -122.406503}, {lat:  47.692588, lng: -122.406132}, {lat:  47.691146, lng: -122.404}, {lat:  47.690351, lng: -122.403253}, {lat:  47.689866, lng: -122.403052}, {lat:  47.687239, lng: -122.403493}, {lat:  47.686735, lng: -122.403357}, {lat:  47.686734, lng: -122.403357}, {lat:  47.686394, lng: -122.403663}, {lat:  47.685917, lng: -122.403663}, {lat:  47.685547, lng: -122.403394}, {lat:  47.684953, lng: -122.403428}, {lat:  47.683901, lng: -122.40363}, {lat:  47.681981, lng: -122.404647}, {lat:  47.681641, lng: -122.404916}, {lat:  47.681317, lng: -122.405019}, {lat:  47.680638, lng: -122.405937}, {lat:  47.680335, lng: -122.406375}, {lat:  47.676934, lng: -122.408135}, {lat:  47.676709, lng: -122.409965}, {lat:  47.676331, lng: -122.410391}, {lat:  47.67584, lng: -122.409627}, {lat:  47.675535, lng: -122.409151}, {lat:  47.675381, lng: -122.40905}, {lat:  47.674947, lng: -122.408442}, {lat:  47.674787, lng: -122.408408}, {lat:  47.674372, lng: -122.408678}, {lat:  47.674199, lng: -122.408697}, {lat:  47.674011, lng: -122.40844}, {lat:  47.673684, lng: -122.407934}, {lat:  47.673133, lng: -122.407807}, {lat:  47.672972, lng: -122.407648}, {lat:  47.67293, lng: -122.407607}, {lat:  47.672889, lng: -122.407566}, {lat:  47.672799, lng: -122.407292}, {lat:  47.672592, lng: -122.407124}, {lat:  47.672319, lng: -122.40665}, {lat:  47.672109, lng: -122.406629}, {lat:  47.671635, lng: -122.406583}, {lat:  47.670581, lng: -122.406312}, {lat:  47.669188, lng: -122.404859}, {lat:  47.668578, lng: -122.403991}, {lat:  47.668029, lng: -122.40321}, {lat:  47.668029, lng: -122.403209}, {lat:  47.667994, lng: -122.403113}, {lat:  47.667955, lng: -122.403006}, {lat:  47.667919, lng: -122.40291}, {lat:  47.66788, lng: -122.402803}, {lat:  47.667806, lng: -122.4026}, {lat:  47.667731, lng: -122.402397}, {lat:  47.667657, lng: -122.402194}, {lat:  47.667582, lng: -122.401991}, {lat:  47.667578, lng: -122.401978}, {lat:  47.667575, lng: -122.401972}, {lat:  47.667565, lng: -122.401944}, {lat:  47.667508, lng: -122.401788}, {lat:  47.667332, lng: -122.401423}, {lat:  47.667235, lng: -122.401223}, {lat:  47.667143, lng: -122.401032}, {lat:  47.667133, lng: -122.401012}, {lat:  47.666851, lng: -122.400226}, {lat:  47.666733, lng: -122.400186}, {lat:  47.66672, lng: -122.40016}, {lat:  47.666622, lng: -122.399958}, {lat:  47.666525, lng: -122.399757}, {lat:  47.666468, lng: -122.39964}, {lat:  47.666417, lng: -122.399311}, {lat:  47.66581, lng: -122.396875}, {lat:  47.665749, lng: -122.396917}, {lat:  47.665626, lng: -122.396412}, {lat:  47.665566, lng: -122.396168}, {lat:  47.665584, lng: -122.39607}, {lat:  47.665592, lng: -122.396022}, {lat:  47.665628, lng: -122.395819}, {lat:  47.665655, lng: -122.395666}, {lat:  47.665661, lng: -122.395628}, {lat:  47.665699, lng: -122.395414}, {lat:  47.665734, lng: -122.395517}, {lat:  47.665786, lng: -122.395708}, {lat:  47.666236, lng: -122.395454}, {lat:  47.666347, lng: -122.394784}, {lat:  47.666529, lng: -122.394791}, {lat:  47.666536, lng: -122.393779}, {lat:  47.667356, lng: -122.393781}, {lat:  47.667532, lng: -122.393626}, {lat:  47.667545, lng: -122.393411}, {lat:  47.66752, lng: -122.393207}, {lat:  47.66733, lng: -122.393133}, {lat:  47.667356, lng: -122.392136}, {lat:  47.667011, lng: -122.392043}, {lat:  47.667047, lng: -122.391532}, {lat:  47.666822, lng: -122.391376}, {lat:  47.666743, lng: -122.391157}, {lat:  47.666857, lng: -122.390878}, {lat:  47.667386, lng: -122.390843}, {lat:  47.667634, lng: -122.390703}, {lat:  47.667629, lng: -122.39046}, {lat:  47.667512, lng: -122.390335}, {lat:  47.667422, lng: -122.390278}, {lat:  47.667356, lng: -122.389884}, {lat:  47.667378, lng: -122.389615}, {lat:  47.667401, lng: -122.389346}, {lat:  47.667083, lng: -122.389281}, {lat:  47.667104, lng: -122.38912}, {lat:  47.667286, lng: -122.389099}, {lat:  47.667211, lng: -122.388705}, {lat:  47.667042, lng: -122.388416}, {lat:  47.667, lng: -122.388253}, {lat:  47.667147, lng: -122.388124}, {lat:  47.667113, lng: -122.387987}, {lat:  47.666934, lng: -122.387832}, {lat:  47.66693, lng: -122.387828}, {lat:  47.666728, lng: -122.387569}, {lat:  47.666594, lng: -122.38743}, {lat:  47.666438, lng: -122.387464}, {lat:  47.666506, lng: -122.387777}, {lat:  47.666595, lng: -122.387928}, {lat:  47.666511, lng: -122.38802}, {lat:  47.665718, lng: -122.386913}, {lat:  47.665556, lng: -122.386691}, {lat:  47.665541, lng: -122.38666}, {lat:  47.665501, lng: -122.386606}, {lat:  47.665421, lng: -122.3865}, {lat:  47.665402, lng: -122.386474}, {lat:  47.665179, lng: -122.386155}, {lat:  47.664973, lng: -122.385896}, {lat:  47.664798, lng: -122.385625}, {lat:  47.664759, lng: -122.385291}, {lat:  47.664786, lng: -122.385245}, {lat:  47.664815, lng: -122.385202}, {lat:  47.664817, lng: -122.385198}, {lat:  47.664812, lng: -122.385191}, {lat:  47.664791, lng: -122.38516}, {lat:  47.664738, lng: -122.385091}, {lat:  47.664681, lng: -122.385012}, {lat:  47.66461, lng: -122.384922}, {lat:  47.664591, lng: -122.384898}, {lat:  47.664581, lng: -122.384886}, {lat:  47.664578, lng: -122.384883}, {lat:  47.664577, lng: -122.384886}, {lat:  47.664541, lng: -122.384954}, {lat:  47.664515, lng: -122.385006}, {lat:  47.664503, lng: -122.385018}, {lat:  47.664494, lng: -122.385009}, {lat:  47.664456, lng: -122.384964}, {lat:  47.664418, lng: -122.384916}, {lat:  47.66436, lng: -122.384849}, {lat:  47.664307, lng: -122.384789}, {lat:  47.664269, lng: -122.384747}, {lat:  47.664265, lng: -122.384742}, {lat:  47.664268, lng: -122.384737}, {lat:  47.664281, lng: -122.384713}, {lat:  47.664306, lng: -122.384661}, {lat:  47.664345, lng: -122.384583}, {lat:  47.664389, lng: -122.384501}, {lat:  47.664366, lng: -122.384466}, {lat:  47.66463, lng: -122.383986}, {lat:  47.664527, lng: -122.383826}, {lat:  47.664389, lng: -122.383869}, {lat:  47.66419, lng: -122.383622}, {lat:  47.664058, lng: -122.383761}, {lat:  47.663868, lng: -122.383455}, {lat:  47.663969, lng: -122.38323}, {lat:  47.663825, lng: -122.383069}, {lat:  47.663747, lng: -122.38291}, {lat:  47.663982, lng: -122.382401}, {lat:  47.663774, lng: -122.38225}, {lat:  47.663566, lng: -122.382039}, {lat:  47.663421, lng: -122.382021}, {lat:  47.66326, lng: -122.38192}, {lat:  47.663026, lng: -122.382344}, {lat:  47.662804, lng: -122.382024}, {lat:  47.662533, lng: -122.381738}, {lat:  47.662511, lng: -122.381581}, {lat:  47.662288, lng: -122.381309}, {lat:  47.662114, lng: -122.381026}, {lat:  47.661907, lng: -122.380803}, {lat:  47.661877, lng: -122.380658}, {lat:  47.661799, lng: -122.38063}, {lat:  47.661776, lng: -122.380625}, {lat:  47.661728, lng: -122.380554}, {lat:  47.661625, lng: -122.380401}, {lat:  47.661521, lng: -122.380248}, {lat:  47.661418, lng: -122.380094}, {lat:  47.661391, lng: -122.380055}, {lat:  47.661391, lng: -122.380145}, {lat:  47.661377, lng: -122.380124}, {lat:  47.661376, lng: -122.380078}, {lat:  47.661241, lng: -122.379877}, {lat:  47.661136, lng: -122.379601}, {lat:  47.66094, lng: -122.378907}, {lat:  47.660674, lng: -122.377904}, {lat:  47.661218, lng: -122.377579}, {lat:  47.661172, lng: -122.377394}, {lat:  47.661082, lng: -122.37728}, {lat:  47.660868, lng: -122.377211}, {lat:  47.660903, lng: -122.376563}, {lat:  47.66102, lng: -122.376518}, {lat:  47.661034, lng: -122.376222}, {lat:  47.661045, lng: -122.376016}, {lat:  47.661145, lng: -122.375958}, {lat:  47.661067, lng: -122.37566}, {lat:  47.660948, lng: -122.375338}, {lat:  47.660808, lng: -122.375259}, {lat:  47.660684, lng: -122.375267}, {lat:  47.660614, lng: -122.375288}, {lat:  47.660614, lng: -122.375196}, {lat:  47.660614, lng: -122.374993}, {lat:  47.660614, lng: -122.374907}, {lat:  47.660614, lng: -122.37479}, {lat:  47.660614, lng: -122.374587}, {lat:  47.660614, lng: -122.374385}, {lat:  47.660614, lng: -122.374182}, {lat:  47.660615, lng: -122.373979}, {lat:  47.660615, lng: -122.37382}, {lat:  47.660615, lng: -122.373795}, {lat:  47.660683, lng: -122.373733}, {lat:  47.660711, lng: -122.373538}, {lat:  47.660692, lng: -122.373182}, {lat:  47.6606, lng: -122.372234}, {lat:  47.660399, lng: -122.372215}, {lat:  47.660369, lng: -122.372173}, {lat:  47.660227, lng: -122.371973}, {lat:  47.660079, lng: -122.371766}, {lat:  47.659935, lng: -122.371564}, {lat:  47.659839, lng: -122.371429}, {lat:  47.659834, lng: -122.371422}, {lat:  47.659799, lng: -122.371374}, {lat:  47.659777, lng: -122.371334}, {lat:  47.659879, lng: -122.371178}, {lat:  47.659791, lng: -122.370966}, {lat:  47.659687, lng: -122.370779}, {lat:  47.659483, lng: -122.370588}, {lat:  47.659327, lng: -122.370497}, {lat:  47.659097, lng: -122.370366}, {lat:  47.659042, lng: -122.37031}, {lat:  47.658975, lng: -122.370217}, {lat:  47.658842, lng: -122.37003}, {lat:  47.658774, lng: -122.369935}, {lat:  47.658765, lng: -122.369876}, {lat:  47.65849, lng: -122.369425}, {lat:  47.658242, lng: -122.369007}, {lat:  47.658104, lng: -122.368955}, {lat:  47.657575, lng: -122.368133}, {lat:  47.657559, lng: -122.367834}, {lat:  47.65735, lng: -122.367606}, {lat:  47.657219, lng: -122.367097}, {lat:  47.657145, lng: -122.367111}, {lat:  47.657099, lng: -122.367314}, {lat:  47.6569, lng: -122.367134}, {lat:  47.656882, lng: -122.366912}, {lat:  47.656755, lng: -122.366845}, {lat:  47.65659, lng: -122.36687}, {lat:  47.656543, lng: -122.366803}, {lat:  47.656538, lng: -122.366795}, {lat:  47.656279, lng: -122.36633}, {lat:  47.656153, lng: -122.366105}, {lat:  47.656153, lng: -122.366103}, {lat:  47.656155, lng: -122.366103}, {lat:  47.656156, lng: -122.366103}, {lat:  47.656148, lng: -122.366091}, {lat:  47.656146, lng: -122.366091}, {lat:  47.656143, lng: -122.366086}, {lat:  47.656135, lng: -122.366072}, {lat:  47.656042, lng: -122.365906}, {lat:  47.65597, lng: -122.365775}, {lat:  47.65595, lng: -122.36574}, {lat:  47.655795, lng: -122.365462}, {lat:  47.655634, lng: -122.365174}, {lat:  47.655609, lng: -122.365127}, {lat:  47.65549, lng: -122.364915}, {lat:  47.655478, lng: -122.364892}, {lat:  47.655479, lng: -122.364891}, {lat:  47.655476, lng: -122.364889}, {lat:  47.655425, lng: -122.364796}, {lat:  47.655362, lng: -122.36468}, {lat:  47.655306, lng: -122.364578}, {lat:  47.655279, lng: -122.364529}, {lat:  47.655135, lng: -122.364263}, {lat:  47.655016, lng: -122.364046}, {lat:  47.654963, lng: -122.363949}, {lat:  47.654948, lng: -122.363921}, {lat:  47.654839, lng: -122.363721}, {lat:  47.654792, lng: -122.363634}, {lat:  47.654621, lng: -122.36332}, {lat:  47.654508, lng: -122.363113}, {lat:  47.654449, lng: -122.363005}, {lat:  47.654418, lng: -122.362949}, {lat:  47.654416, lng: -122.362945}, {lat:  47.654407, lng: -122.362928}, {lat:  47.654278, lng: -122.362691}, {lat:  47.654226, lng: -122.362596}, {lat:  47.654145, lng: -122.362447}, {lat:  47.654142, lng: -122.362442}, {lat:  47.654066, lng: -122.362295}, {lat:  47.653897, lng: -122.361973}, {lat:  47.653867, lng: -122.361916}, {lat:  47.653384, lng: -122.360993}, {lat:  47.653383, lng: -122.360991}, {lat:  47.653336, lng: -122.360902}, {lat:  47.65331, lng: -122.360852}, {lat:  47.653302, lng: -122.360835}, {lat:  47.653227, lng: -122.360677}, {lat:  47.652991, lng: -122.360134}, {lat:  47.652562, lng: -122.359346}, {lat:  47.652267, lng: -122.358787}, {lat:  47.65225, lng: -122.358754}, {lat:  47.651886, lng: -122.358017}, {lat:  47.65163, lng: -122.357435}, {lat:  47.650958, lng: -122.355964}, {lat:  47.650759, lng: -122.355574}, {lat:  47.650505, lng: -122.355063}, {lat:  47.650316, lng: -122.354718}, {lat:  47.650245, lng: -122.354563}, {lat:  47.650236, lng: -122.354545}, {lat:  47.650229, lng: -122.354529}, {lat:  47.650209, lng: -122.354485}, {lat:  47.650096, lng: -122.354238}, {lat:  47.650083, lng: -122.354211}, {lat:  47.650041, lng: -122.354118}, {lat:  47.650015, lng: -122.354061}, {lat:  47.649987, lng: -122.354}, {lat:  47.649936, lng: -122.353888}, {lat:  47.649931, lng: -122.353876}, {lat:  47.649929, lng: -122.353872}, {lat:  47.649875, lng: -122.353753}, {lat:  47.649821, lng: -122.353632}, {lat:  47.649779, lng: -122.35354}, {lat:  47.649765, lng: -122.353508}, {lat:  47.649712, lng: -122.35339}, {lat:  47.649656, lng: -122.353267}, {lat:  47.649631, lng: -122.353211}, {lat:  47.649628, lng: -122.353203}, {lat:  47.649621, lng: -122.353189}, {lat:  47.649614, lng: -122.353173}, {lat:  47.649529, lng: -122.352981}, {lat:  47.649477, lng: -122.352867}, {lat:  47.649438, lng: -122.352779}, {lat:  47.649428, lng: -122.352755}, {lat:  47.649408, lng: -122.35271}, {lat:  47.649384, lng: -122.352655}, {lat:  47.64933, lng: -122.352534}, {lat:  47.649328, lng: -122.352529}, {lat:  47.649276, lng: -122.352412}, {lat:  47.649223, lng: -122.352291}, {lat:  47.649169, lng: -122.35217}, {lat:  47.649116, lng: -122.352049}, {lat:  47.649111, lng: -122.352039}, {lat:  47.649067, lng: -122.351939}, {lat:  47.649067, lng: -122.351927}, {lat:  47.649062, lng: -122.351927}, {lat:  47.649008, lng: -122.351806}, {lat:  47.648955, lng: -122.351685}, {lat:  47.648901, lng: -122.351564}, {lat:  47.648848, lng: -122.351442}, {lat:  47.64879, lng: -122.351311}, {lat:  47.648789, lng: -122.351309}, {lat:  47.648729, lng: -122.351175}, {lat:  47.648648, lng: -122.35099}, {lat:  47.648086, lng: -122.349912}, {lat:  47.648002, lng: -122.34975}, {lat:  47.647996, lng: -122.349739}, {lat:  47.647982, lng: -122.349696}, {lat:  47.647944, lng: -122.349588}, {lat:  47.647657, lng: -122.348748}, {lat:  47.647628, lng: -122.348684}, {lat:  47.647593, lng: -122.348605}, {lat:  47.647485, lng: -122.34836}, {lat:  47.647438, lng: -122.34807}, {lat:  47.64749, lng: -122.34769}, {lat:  47.647624, lng: -122.347316}, {lat:  47.647637, lng: -122.347293}, {lat:  47.648523, lng: -122.347299}, {lat:  47.648745, lng: -122.347304}, {lat:  47.648844, lng: -122.347306}, {lat:  47.648844, lng: -122.347308}, {lat:  47.648915, lng: -122.347308}, {lat:  47.649045, lng: -122.347308}, {lat:  47.649136, lng: -122.347308}, {lat:  47.649139, lng: -122.347308}, {lat:  47.6492, lng: -122.347309}, {lat:  47.649224, lng: -122.347309}, {lat:  47.649347, lng: -122.347309}, {lat:  47.649407, lng: -122.347309}, {lat:  47.649989, lng: -122.347311}, {lat:  47.650141, lng: -122.347311}, {lat:  47.650952, lng: -122.347313}, {lat:  47.650954, lng: -122.347313}, {lat:  47.651351, lng: -122.347314}, {lat:  47.651417, lng: -122.347314}, {lat:  47.652624, lng: -122.347317}, {lat:  47.652646, lng: -122.347317}, {lat:  47.652726, lng: -122.347318}, {lat:  47.652768, lng: -122.347318}, {lat:  47.654133, lng: -122.347319}, {lat:  47.655395, lng: -122.347323}, {lat:  47.656657, lng: -122.347328}, {lat:  47.657742, lng: -122.347331}, {lat:  47.65865, lng: -122.347333}, {lat:  47.658675, lng: -122.347333}, {lat:  47.659333, lng: -122.347334}, {lat:  47.659579, lng: -122.347335}, {lat:  47.660046, lng: -122.347336}, {lat:  47.66048, lng: -122.347337}, {lat:  47.660525, lng: -122.347337}, {lat:  47.660567, lng: -122.347337}, {lat:  47.660759, lng: -122.347337}, {lat:  47.661393, lng: -122.347389}, {lat:  47.661393, lng: -122.347644}, {lat:  47.661393, lng: -122.347339}, {lat:  47.661432, lng: -122.34734}, {lat:  47.661474, lng: -122.34734}, {lat:  47.662021, lng: -122.347336}, {lat:  47.662074, lng: -122.347336}, {lat:  47.662131, lng: -122.347335}, {lat:  47.662871, lng: -122.34733}, {lat:  47.663584, lng: -122.347324}, {lat:  47.664296, lng: -122.347319}, {lat:  47.665009, lng: -122.347311}, {lat:  47.665009, lng: -122.347116}, {lat:  47.665007, lng: -122.346159}, {lat:  47.665007, lng: -122.346129}, {lat:  47.665007, lng: -122.346064}, {lat:  47.665007, lng: -122.346063}, {lat:  47.665004, lng: -122.344734}, {lat:  47.665004, lng: -122.344519}, {lat:  47.665002, lng: -122.343736}, {lat:  47.665006, lng: -122.343664}, {lat:  47.665035, lng: -122.342194}, {lat:  47.665037, lng: -122.342082}, {lat:  47.665036, lng: -122.340621}, {lat:  47.665035, lng: -122.340311}, {lat:  47.665035, lng: -122.340263}, {lat:  47.665034, lng: -122.340207}, {lat:  47.665034, lng: -122.3401}, {lat:  47.665035, lng: -122.33929}, {lat:  47.665035, lng: -122.339289}, {lat:  47.665034, lng: -122.339127}, {lat:  47.665035, lng: -122.339007}, {lat:  47.665035, lng: -122.338504}, {lat:  47.665035, lng: -122.337669}, {lat:  47.665035, lng: -122.33641}, {lat:  47.665036, lng: -122.335152}, {lat:  47.665036, lng: -122.333719}, {lat:  47.665036, lng: -122.33371}, {lat:  47.665036, lng: -122.33369}, {lat:  47.66502, lng: -122.331012}, {lat:  47.665017, lng: -122.330583}, {lat:  47.665012, lng: -122.329599}, {lat:  47.665009, lng: -122.329062}, {lat:  47.665003, lng: -122.328311}, {lat:  47.665003, lng: -122.328268}, {lat:  47.665003, lng: -122.328233}, {lat:  47.664997, lng: -122.327197}, {lat:  47.664991, lng: -122.326126}, {lat:  47.664988, lng: -122.325608}, {lat:  47.664984, lng: -122.325054}, {lat:  47.664978, lng: -122.323983}, {lat:  47.664975, lng: -122.323572}, {lat:  47.664971, lng: -122.322869}, {lat:  47.664971, lng: -122.322863}, {lat:  47.664971, lng: -122.322862}, {lat:  47.664971, lng: -122.322854}, {lat:  47.66497, lng: -122.322683}, {lat:  47.664969, lng: -122.3225}, {lat:  47.664964, lng: -122.32225}, {lat:  47.664963, lng: -122.322204}, {lat:  47.664964, lng: -122.322158}, {lat:  47.664966, lng: -122.321991}, {lat:  47.667137, lng: -122.32198}, {lat:  47.667278, lng: -122.321979}, {lat:  47.667727, lng: -122.321976}, {lat:  47.668608, lng: -122.32197}, {lat:  47.66933, lng: -122.321961}, {lat:  47.669334, lng: -122.321961}, {lat:  47.669466, lng: -122.321963}, {lat:  47.669529, lng: -122.321964}, {lat:  47.669542, lng: -122.321964}, {lat:  47.669993, lng: -122.32195}, {lat:  47.670098, lng: -122.321944}, {lat:  47.670556, lng: -122.321908}, {lat:  47.670728, lng: -122.321888}, {lat:  47.67077, lng: -122.321882}, {lat:  47.67133, lng: -122.3218}, {lat:  47.671386, lng: -122.32179}, {lat:  47.671511, lng: -122.321766}, {lat:  47.671678, lng: -122.321732}, {lat:  47.671847, lng: -122.321694}, {lat:  47.672011, lng: -122.321657}, {lat:  47.672142, lng: -122.321624}, {lat:  47.672232, lng: -122.321598}, {lat:  47.672235, lng: -122.321598}, {lat:  47.67224, lng: -122.321596}, {lat:  47.673282, lng: -122.321295}, {lat:  47.673727, lng: -122.321163}, {lat:  47.673976, lng: -122.321089}, {lat:  47.674334, lng: -122.320983}, {lat:  47.674334, lng: -122.32099}, {lat:  47.674334, lng: -122.320991}, {lat:  47.674362, lng: -122.320983}, {lat:  47.674815, lng: -122.320876}, {lat:  47.675855, lng: -122.320705}, {lat:  47.675857, lng: -122.320705}, {lat:  47.675858, lng: -122.320705}, {lat:  47.675877, lng: -122.320703}, {lat:  47.67615, lng: -122.320676}, {lat:  47.676424, lng: -122.320656}, {lat:  47.676699, lng: -122.320643}, {lat:  47.676973, lng: -122.320637}, {lat:  47.67725, lng: -122.320642}, {lat:  47.677512, lng: -122.320646}, {lat:  47.678045, lng: -122.320669}, {lat:  47.678238, lng: -122.320677}, {lat:  47.678444, lng: -122.320686}, {lat:  47.678746, lng: -122.320699}, {lat:  47.678775, lng: -122.3207}, {lat:  47.679259, lng: -122.320721}, {lat:  47.679503, lng: -122.320731}, {lat:  47.679586, lng: -122.320735}, {lat:  47.680202, lng: -122.320761}, {lat:  47.680728, lng: -122.320818}, {lat:  47.680893, lng: -122.320836}, {lat:  47.680933, lng: -122.32084}, {lat:  47.680942, lng: -122.320842}, {lat:  47.680955, lng: -122.320844}, {lat:  47.680959, lng: -122.320844}, {lat:  47.680989, lng: -122.320851}, {lat:  47.68099, lng: -122.320851}, {lat:  47.681068, lng: -122.320867}, {lat:  47.681075, lng: -122.320869}, {lat:  47.681133, lng: -122.320883}, {lat:  47.681176, lng: -122.320893}, {lat:  47.681261, lng: -122.320916}, {lat:  47.681284, lng: -122.320922}, {lat:  47.681392, lng: -122.320953}, {lat:  47.681412, lng: -122.32096}, {lat:  47.681499, lng: -122.320988}, {lat:  47.681514, lng: -122.320993}, {lat:  47.68163, lng: -122.32103}, {lat:  47.681699, lng: -122.321059}, {lat:  47.681712, lng: -122.321064}, {lat:  47.681736, lng: -122.321074}, {lat:  47.681818, lng: -122.321106}, {lat:  47.681863, lng: -122.321126}, {lat:  47.681923, lng: -122.321152}, {lat:  47.681935, lng: -122.321157}, {lat:  47.682028, lng: -122.321199}, {lat:  47.682033, lng: -122.321202}, {lat:  47.682132, lng: -122.32125}, {lat:  47.682236, lng: -122.321304}, {lat:  47.682289, lng: -122.321332}, {lat:  47.682339, lng: -122.321359}, {lat:  47.682441, lng: -122.321418}, {lat:  47.682543, lng: -122.321479}, {lat:  47.682644, lng: -122.321543}, {lat:  47.682662, lng: -122.321555}, {lat:  47.682723, lng: -122.321596}, {lat:  47.682744, lng: -122.32161}, {lat:  47.682843, lng: -122.321679}, {lat:  47.682942, lng: -122.32175}, {lat:  47.683039, lng: -122.321825}, {lat:  47.683165, lng: -122.321929}, {lat:  47.68326, lng: -122.322008}, {lat:  47.683355, lng: -122.32209}, {lat:  47.683448, lng: -122.322175}, {lat:  47.683541, lng: -122.322262}, {lat:  47.683633, lng: -122.322351}, {lat:  47.68364, lng: -122.322359}, {lat:  47.683681, lng: -122.3224}, {lat:  47.683723, lng: -122.322443}, {lat:  47.683813, lng: -122.322537}, {lat:  47.683901, lng: -122.322633}, {lat:  47.683988, lng: -122.322731}, {lat:  47.684074, lng: -122.322832}, {lat:  47.684088, lng: -122.322849}, {lat:  47.684142, lng: -122.322915}, {lat:  47.68423, lng: -122.323024}, {lat:  47.684264, lng: -122.323067}, {lat:  47.684994, lng: -122.324}, {lat:  47.685209, lng: -122.324275}, {lat:  47.685319, lng: -122.324416}, {lat:  47.685874, lng: -122.325124}, {lat:  47.686276, lng: -122.325638}, {lat:  47.686782, lng: -122.326284}, {lat:  47.686827, lng: -122.326341}, {lat:  47.687348, lng: -122.327007}, {lat:  47.687377, lng: -122.327044}, {lat:  47.68752, lng: -122.327226}, {lat:  47.687633, lng: -122.327353}, {lat:  47.687737, lng: -122.32747}, {lat:  47.687738, lng: -122.327471}, {lat:  47.687778, lng: -122.327515}, {lat:  47.687867, lng: -122.32761}, {lat:  47.687958, lng: -122.327702}, {lat:  47.687977, lng: -122.327721}, {lat:  47.688081, lng: -122.327827}, {lat:  47.688182, lng: -122.327916}, {lat:  47.688235, lng: -122.327964}, {lat:  47.688329, lng: -122.328047}, {lat:  47.688425, lng: -122.328127}, {lat:  47.688521, lng: -122.328205}, {lat:  47.688618, lng: -122.32828}, {lat:  47.688629, lng: -122.328288}, {lat:  47.688717, lng: -122.328353}, {lat:  47.688718, lng: -122.328354}, {lat:  47.688721, lng: -122.328356}, {lat:  47.688723, lng: -122.328358}, {lat:  47.688726, lng: -122.32836}, {lat:  47.688728, lng: -122.328361}, {lat:  47.688731, lng: -122.328363}, {lat:  47.688733, lng: -122.328365}, {lat:  47.688736, lng: -122.328367}, {lat:  47.688738, lng: -122.328368}, {lat:  47.688741, lng: -122.32837}, {lat:  47.688743, lng: -122.328372}, {lat:  47.688745, lng: -122.328374}, {lat:  47.688748, lng: -122.328376}, {lat:  47.68875, lng: -122.328377}, {lat:  47.688753, lng: -122.328379}, {lat:  47.688755, lng: -122.328381}, {lat:  47.688758, lng: -122.328383}, {lat:  47.68876, lng: -122.328384}, {lat:  47.688763, lng: -122.328386}, {lat:  47.688765, lng: -122.328388}, {lat:  47.688768, lng: -122.32839}, {lat:  47.68877, lng: -122.328391}, {lat:  47.688773, lng: -122.328393}, {lat:  47.688775, lng: -122.328395}, {lat:  47.688778, lng: -122.328397}, {lat:  47.68878, lng: -122.328398}, {lat:  47.688783, lng: -122.3284}, {lat:  47.688785, lng: -122.328402}, {lat:  47.688788, lng: -122.328404}, {lat:  47.68879, lng: -122.328405}, {lat:  47.688792, lng: -122.328407}, {lat:  47.688795, lng: -122.328409}, {lat:  47.688797, lng: -122.328411}, {lat:  47.6888, lng: -122.328412}, {lat:  47.688802, lng: -122.328414}, {lat:  47.688805, lng: -122.328416}, {lat:  47.688807, lng: -122.328417}, {lat:  47.68881, lng: -122.328419}, {lat:  47.688812, lng: -122.328421}, {lat:  47.688815, lng: -122.328423}, {lat:  47.688817, lng: -122.328424}, {lat:  47.68882, lng: -122.328426}, {lat:  47.688822, lng: -122.328428}, {lat:  47.688825, lng: -122.328429}, {lat:  47.688827, lng: -122.328431}, {lat:  47.68883, lng: -122.328433}, {lat:  47.688832, lng: -122.328435}, {lat:  47.688835, lng: -122.328436}, {lat:  47.688837, lng: -122.328438}, {lat:  47.68884, lng: -122.32844}, {lat:  47.688842, lng: -122.328441}, {lat:  47.688845, lng: -122.328443}, {lat:  47.688847, lng: -122.328445}, {lat:  47.68885, lng: -122.328447}, {lat:  47.688852, lng: -122.328448}, {lat:  47.688855, lng: -122.32845}, {lat:  47.688857, lng: -122.328452}, {lat:  47.68886, lng: -122.328453}, {lat:  47.688862, lng: -122.328455}, {lat:  47.688865, lng: -122.328457}, {lat:  47.688867, lng: -122.328458}, {lat:  47.68887, lng: -122.32846}, {lat:  47.688872, lng: -122.328462}, {lat:  47.688875, lng: -122.328463}, {lat:  47.688877, lng: -122.328465}, {lat:  47.68888, lng: -122.328467}, {lat:  47.688882, lng: -122.328468}, {lat:  47.688885, lng: -122.32847}, {lat:  47.688887, lng: -122.328472}, {lat:  47.68889, lng: -122.328474}, {lat:  47.688892, lng: -122.328475}, {lat:  47.688895, lng: -122.328477}, {lat:  47.688897, lng: -122.328479}, {lat:  47.6889, lng: -122.32848}, {lat:  47.688902, lng: -122.328482}, {lat:  47.688905, lng: -122.328484}, {lat:  47.688907, lng: -122.328485}, {lat:  47.68891, lng: -122.328487}, {lat:  47.688912, lng: -122.328489}, {lat:  47.688915, lng: -122.32849}, {lat:  47.688917, lng: -122.328492}, {lat:  47.68892, lng: -122.328493}, {lat:  47.688922, lng: -122.328495}, {lat:  47.688925, lng: -122.328497}, {lat:  47.688927, lng: -122.328498}, {lat:  47.68893, lng: -122.3285}, {lat:  47.688932, lng: -122.328502}, {lat:  47.688935, lng: -122.328503}, {lat:  47.688937, lng: -122.328505}, {lat:  47.68894, lng: -122.328507}, {lat:  47.688942, lng: -122.328508}, {lat:  47.688945, lng: -122.32851}, {lat:  47.688947, lng: -122.328512}, {lat:  47.68895, lng: -122.328513}, {lat:  47.688952, lng: -122.328515}, {lat:  47.688955, lng: -122.328516}, {lat:  47.688958, lng: -122.328518}, {lat:  47.68896, lng: -122.32852}, {lat:  47.688963, lng: -122.328522}, {lat:  47.688965, lng: -122.328523}, {lat:  47.688968, lng: -122.328525}, {lat:  47.68897, lng: -122.328527}, {lat:  47.688973, lng: -122.328528}, {lat:  47.688975, lng: -122.32853}, {lat:  47.688978, lng: -122.328531}, {lat:  47.68898, lng: -122.328533}, {lat:  47.688983, lng: -122.328535}, {lat:  47.688985, lng: -122.328536}, {lat:  47.688988, lng: -122.328538}, {lat:  47.68899, lng: -122.32854}, {lat:  47.688993, lng: -122.328541}, {lat:  47.688995, lng: -122.328543}, {lat:  47.688998, lng: -122.328544}, {lat:  47.689001, lng: -122.328546}, {lat:  47.689003, lng: -122.328547}, {lat:  47.689006, lng: -122.328549}, {lat:  47.689008, lng: -122.328551}, {lat:  47.689011, lng: -122.328552}, {lat:  47.689013, lng: -122.328554}, {lat:  47.689016, lng: -122.328555}, {lat:  47.689018, lng: -122.328557}, {lat:  47.689021, lng: -122.328559}, {lat:  47.689023, lng: -122.32856}, {lat:  47.689026, lng: -122.328562}, {lat:  47.689028, lng: -122.328564}, {lat:  47.689031, lng: -122.328565}, {lat:  47.689113, lng: -122.328619}, {lat:  47.689165, lng: -122.328647}, {lat:  47.689168, lng: -122.328648}, {lat:  47.68917, lng: -122.32865}, {lat:  47.689173, lng: -122.328651}, {lat:  47.689175, lng: -122.328652}, {lat:  47.689178, lng: -122.328654}, {lat:  47.689181, lng: -122.328656}, {lat:  47.689183, lng: -122.328657}, {lat:  47.689186, lng: -122.328658}, {lat:  47.689188, lng: -122.32866}, {lat:  47.689191, lng: -122.328661}, {lat:  47.689193, lng: -122.328663}, {lat:  47.689196, lng: -122.328664}, {lat:  47.689198, lng: -122.328666}, {lat:  47.689201, lng: -122.328667}, {lat:  47.689204, lng: -122.328669}, {lat:  47.689206, lng: -122.32867}, {lat:  47.689209, lng: -122.328672}, {lat:  47.689211, lng: -122.328673}, {lat:  47.689214, lng: -122.328675}, {lat:  47.689216, lng: -122.328676}, {lat:  47.689219, lng: -122.328678}, {lat:  47.689221, lng: -122.328679}, {lat:  47.689224, lng: -122.328681}, {lat:  47.689227, lng: -122.328682}, {lat:  47.689229, lng: -122.328683}, {lat:  47.689232, lng: -122.328685}, {lat:  47.689234, lng: -122.328686}, {lat:  47.689237, lng: -122.328688}, {lat:  47.689239, lng: -122.328689}, {lat:  47.689242, lng: -122.328691}, {lat:  47.689244, lng: -122.328692}, {lat:  47.689247, lng: -122.328694}, {lat:  47.68925, lng: -122.328695}, {lat:  47.689252, lng: -122.328696}, {lat:  47.689255, lng: -122.328698}, {lat:  47.689257, lng: -122.328699}, {lat:  47.68926, lng: -122.328701}, {lat:  47.689262, lng: -122.328702}, {lat:  47.689265, lng: -122.328704}, {lat:  47.689268, lng: -122.328705}, {lat:  47.68927, lng: -122.328706}, {lat:  47.689273, lng: -122.328708}, {lat:  47.689275, lng: -122.328709}, {lat:  47.689278, lng: -122.328711}, {lat:  47.68928, lng: -122.328712}, {lat:  47.689283, lng: -122.328714}, {lat:  47.689286, lng: -122.328715}, {lat:  47.689288, lng: -122.328716}, {lat:  47.689291, lng: -122.328718}, {lat:  47.689293, lng: -122.328719}, {lat:  47.689296, lng: -122.328721}, {lat:  47.689298, lng: -122.328722}, {lat:  47.689301, lng: -122.328724}, {lat:  47.689304, lng: -122.328725}, {lat:  47.689306, lng: -122.328726}, {lat:  47.689309, lng: -122.328728}, {lat:  47.689311, lng: -122.328729}, {lat:  47.689314, lng: -122.328731}, {lat:  47.689316, lng: -122.328732}, {lat:  47.689319, lng: -122.328733}, {lat:  47.689322, lng: -122.328735}, {lat:  47.689324, lng: -122.328736}, {lat:  47.689327, lng: -122.328737}, {lat:  47.689329, lng: -122.328739}, {lat:  47.689332, lng: -122.32874}, {lat:  47.689334, lng: -122.328742}, {lat:  47.689337, lng: -122.328743}, {lat:  47.68934, lng: -122.328744}, {lat:  47.689342, lng: -122.328746}, {lat:  47.689345, lng: -122.328747}, {lat:  47.689347, lng: -122.328749}, {lat:  47.689351, lng: -122.328751}, {lat:  47.689354, lng: -122.328752}, {lat:  47.689356, lng: -122.328753}, {lat:  47.689359, lng: -122.328755}, {lat:  47.689361, lng: -122.328756}, {lat:  47.689364, lng: -122.328757}, {lat:  47.689366, lng: -122.328759}, {lat:  47.689369, lng: -122.32876}, {lat:  47.689372, lng: -122.328761}, {lat:  47.689374, lng: -122.328763}, {lat:  47.689377, lng: -122.328764}, {lat:  47.689379, lng: -122.328766}, {lat:  47.689382, lng: -122.328767}, {lat:  47.689385, lng: -122.328768}, {lat:  47.689387, lng: -122.32877}, {lat:  47.68939, lng: -122.328771}, {lat:  47.689392, lng: -122.328772}, {lat:  47.689395, lng: -122.328774}, {lat:  47.689397, lng: -122.328775}, {lat:  47.6894, lng: -122.328776}, {lat:  47.689403, lng: -122.328778}, {lat:  47.689405, lng: -122.328779}, {lat:  47.689408, lng: -122.32878}, {lat:  47.68941, lng: -122.328782}, {lat:  47.689413, lng: -122.328783}, {lat:  47.689416, lng: -122.328784}, {lat:  47.689418, lng: -122.328786}, {lat:  47.689421, lng: -122.328787}, {lat:  47.689423, lng: -122.328788}, {lat:  47.689426, lng: -122.32879}, {lat:  47.689429, lng: -122.328791}, {lat:  47.689431, lng: -122.328792}, {lat:  47.689434, lng: -122.328794}, {lat:  47.689436, lng: -122.328795}, {lat:  47.689439, lng: -122.328796}, {lat:  47.689441, lng: -122.328798}, {lat:  47.689444, lng: -122.328799}, {lat:  47.689447, lng: -122.3288}, {lat:  47.689449, lng: -122.328802}, {lat:  47.689452, lng: -122.328803}, {lat:  47.689454, lng: -122.328804}, {lat:  47.689457, lng: -122.328805}, {lat:  47.68946, lng: -122.328807}, {lat:  47.689462, lng: -122.328808}, {lat:  47.689465, lng: -122.328809}, {lat:  47.689467, lng: -122.328811}, {lat:  47.68947, lng: -122.328812}, {lat:  47.689473, lng: -122.328813}, {lat:  47.689475, lng: -122.328815}, {lat:  47.689478, lng: -122.328816}, {lat:  47.68948, lng: -122.328817}, {lat:  47.689483, lng: -122.328818}, {lat:  47.689486, lng: -122.32882}, {lat:  47.689488, lng: -122.328821}, {lat:  47.689491, lng: -122.328822}, {lat:  47.689493, lng: -122.328824}, {lat:  47.689496, lng: -122.328825}, {lat:  47.689499, lng: -122.328826}, {lat:  47.689501, lng: -122.328827}, {lat:  47.689504, lng: -122.328829}, {lat:  47.689506, lng: -122.32883}, {lat:  47.689509, lng: -122.328831}, {lat:  47.689512, lng: -122.328833}, {lat:  47.689514, lng: -122.328834}, {lat:  47.689517, lng: -122.328835}, {lat:  47.689519, lng: -122.328836}, {lat:  47.689522, lng: -122.328838}, {lat:  47.689525, lng: -122.328839}, {lat:  47.689527, lng: -122.32884}, {lat:  47.68953, lng: -122.328842}, {lat:  47.689599, lng: -122.32888}, {lat:  47.689721, lng: -122.328929}, {lat:  47.689724, lng: -122.32893}, {lat:  47.689726, lng: -122.328931}, {lat:  47.689729, lng: -122.328932}, {lat:  47.689732, lng: -122.328933}, {lat:  47.689734, lng: -122.328935}, {lat:  47.689737, lng: -122.328936}, {lat:  47.68974, lng: -122.328937}, {lat:  47.689742, lng: -122.328938}, {lat:  47.689745, lng: -122.328939}, {lat:  47.689747, lng: -122.32894}, {lat:  47.68975, lng: -122.328941}, {lat:  47.689753, lng: -122.328942}, {lat:  47.689755, lng: -122.328943}, {lat:  47.689758, lng: -122.328944}, {lat:  47.689761, lng: -122.328946}, {lat:  47.689763, lng: -122.328947}, {lat:  47.689766, lng: -122.328948}, {lat:  47.689769, lng: -122.328949}, {lat:  47.689771, lng: -122.32895}, {lat:  47.689774, lng: -122.328951}, {lat:  47.689776, lng: -122.328952}, {lat:  47.689779, lng: -122.328953}, {lat:  47.689782, lng: -122.328955}, {lat:  47.689784, lng: -122.328956}, {lat:  47.689787, lng: -122.328957}, {lat:  47.68979, lng: -122.328958}, {lat:  47.689792, lng: -122.328959}, {lat:  47.689795, lng: -122.32896}, {lat:  47.689798, lng: -122.328961}, {lat:  47.6898, lng: -122.328962}, {lat:  47.689803, lng: -122.328963}, {lat:  47.689805, lng: -122.328964}, {lat:  47.689808, lng: -122.328965}, {lat:  47.689811, lng: -122.328966}, {lat:  47.689813, lng: -122.328968}, {lat:  47.689816, lng: -122.328969}, {lat:  47.689819, lng: -122.32897}, {lat:  47.689821, lng: -122.328971}, {lat:  47.689824, lng: -122.328972}, {lat:  47.689827, lng: -122.328973}, {lat:  47.689829, lng: -122.328974}, {lat:  47.689832, lng: -122.328975}, {lat:  47.689835, lng: -122.328976}, {lat:  47.689837, lng: -122.328977}, {lat:  47.68984, lng: -122.328978}, {lat:  47.689842, lng: -122.328979}, {lat:  47.689845, lng: -122.32898}, {lat:  47.689848, lng: -122.328981}, {lat:  47.68985, lng: -122.328982}, {lat:  47.689853, lng: -122.328984}, {lat:  47.689856, lng: -122.328985}, {lat:  47.689858, lng: -122.328986}, {lat:  47.689861, lng: -122.328987}, {lat:  47.689864, lng: -122.328988}, {lat:  47.689866, lng: -122.328989}, {lat:  47.689869, lng: -122.32899}, {lat:  47.689872, lng: -122.328991}, {lat:  47.689874, lng: -122.328992}, {lat:  47.689877, lng: -122.328993}, {lat:  47.68988, lng: -122.328994}, {lat:  47.689882, lng: -122.328995}, {lat:  47.689885, lng: -122.328996}, {lat:  47.689888, lng: -122.328997}, {lat:  47.68989, lng: -122.328998}, {lat:  47.689893, lng: -122.328999}, {lat:  47.689895, lng: -122.329}, {lat:  47.689898, lng: -122.329001}, {lat:  47.689901, lng: -122.329002}, {lat:  47.689903, lng: -122.329003}, {lat:  47.689906, lng: -122.329004}, {lat:  47.689909, lng: -122.329005}, {lat:  47.689911, lng: -122.329006}, {lat:  47.689914, lng: -122.329007}, {lat:  47.689917, lng: -122.329008}, {lat:  47.689919, lng: -122.329009}, {lat:  47.689922, lng: -122.32901}, {lat:  47.689925, lng: -122.329011}, {lat:  47.689927, lng: -122.329012}, {lat:  47.68993, lng: -122.329013}, {lat:  47.689933, lng: -122.329014}, {lat:  47.689935, lng: -122.329015}, {lat:  47.689938, lng: -122.329016}, {lat:  47.689941, lng: -122.329017}, {lat:  47.689943, lng: -122.329018}, {lat:  47.689946, lng: -122.329019}, {lat:  47.689949, lng: -122.32902}, {lat:  47.689951, lng: -122.329021}, {lat:  47.689954, lng: -122.329022}, {lat:  47.689957, lng: -122.329023}, {lat:  47.689959, lng: -122.329024}, {lat:  47.689962, lng: -122.329025}, {lat:  47.689965, lng: -122.329026}, {lat:  47.689967, lng: -122.329027}, {lat:  47.68997, lng: -122.329028}, {lat:  47.689973, lng: -122.329029}, {lat:  47.689975, lng: -122.32903}, {lat:  47.689978, lng: -122.329031}, {lat:  47.689981, lng: -122.329032}, {lat:  47.689983, lng: -122.329033}, {lat:  47.689986, lng: -122.329034}, {lat:  47.689989, lng: -122.329035}, {lat:  47.689991, lng: -122.329036}, {lat:  47.689994, lng: -122.329037}, {lat:  47.689997, lng: -122.329038}, {lat:  47.689999, lng: -122.329039}, {lat:  47.690002, lng: -122.32904}, {lat:  47.690005, lng: -122.329041}, {lat:  47.690007, lng: -122.329042}, {lat:  47.69001, lng: -122.329043}, {lat:  47.690013, lng: -122.329043}, {lat:  47.690015, lng: -122.329044}, {lat:  47.690018, lng: -122.329045}, {lat:  47.690021, lng: -122.329046}, {lat:  47.690023, lng: -122.329047}, {lat:  47.690026, lng: -122.329048}, {lat:  47.690029, lng: -122.329049}, {lat:  47.690031, lng: -122.32905}, {lat:  47.690034, lng: -122.329051}, {lat:  47.690037, lng: -122.329052}, {lat:  47.690039, lng: -122.329053}, {lat:  47.690042, lng: -122.329054}, {lat:  47.690045, lng: -122.329055}, {lat:  47.690047, lng: -122.329056}, {lat:  47.69005, lng: -122.329057}, {lat:  47.690052, lng: -122.329058}, {lat:  47.690093, lng: -122.329073}, {lat:  47.690114, lng: -122.329078}, {lat:  47.690117, lng: -122.329079}, {lat:  47.690119, lng: -122.32908}, {lat:  47.690122, lng: -122.329081}, {lat:  47.690125, lng: -122.329082}, {lat:  47.690127, lng: -122.329083}, {lat:  47.69013, lng: -122.329083}, {lat:  47.690133, lng: -122.329084}, {lat:  47.690135, lng: -122.329085}, {lat:  47.690138, lng: -122.329086}, {lat:  47.690141, lng: -122.329087}, {lat:  47.690143, lng: -122.329088}, {lat:  47.690146, lng: -122.329089}, {lat:  47.690149, lng: -122.32909}, {lat:  47.690151, lng: -122.32909}, {lat:  47.690154, lng: -122.329091}, {lat:  47.690157, lng: -122.329092}, {lat:  47.69016, lng: -122.329093}, {lat:  47.690162, lng: -122.329094}, {lat:  47.690165, lng: -122.329095}, {lat:  47.690168, lng: -122.329096}, {lat:  47.69017, lng: -122.329096}, {lat:  47.690173, lng: -122.329097}, {lat:  47.690176, lng: -122.329098}, {lat:  47.690178, lng: -122.329099}, {lat:  47.690181, lng: -122.3291}, {lat:  47.690184, lng: -122.329101}, {lat:  47.690186, lng: -122.329101}, {lat:  47.690189, lng: -122.329102}, {lat:  47.690192, lng: -122.329103}, {lat:  47.690194, lng: -122.329104}, {lat:  47.690197, lng: -122.329105}, {lat:  47.6902, lng: -122.329106}, {lat:  47.690202, lng: -122.329106}, {lat:  47.690205, lng: -122.329107}, {lat:  47.690208, lng: -122.329108}, {lat:  47.690211, lng: -122.329109}, {lat:  47.690213, lng: -122.32911}, {lat:  47.690216, lng: -122.32911}, {lat:  47.690219, lng: -122.329111}, {lat:  47.690221, lng: -122.329112}, {lat:  47.690224, lng: -122.329113}, {lat:  47.690227, lng: -122.329114}, {lat:  47.690229, lng: -122.329115}, {lat:  47.690232, lng: -122.329115}, {lat:  47.690235, lng: -122.329116}, {lat:  47.690237, lng: -122.329117}, {lat:  47.69024, lng: -122.329118}, {lat:  47.690243, lng: -122.329119}, {lat:  47.690245, lng: -122.329119}, {lat:  47.690248, lng: -122.32912}, {lat:  47.690251, lng: -122.329121}, {lat:  47.690254, lng: -122.329122}, {lat:  47.690256, lng: -122.329123}, {lat:  47.690259, lng: -122.329123}, {lat:  47.690262, lng: -122.329124}, {lat:  47.690264, lng: -122.329125}, {lat:  47.690267, lng: -122.329126}, {lat:  47.69027, lng: -122.329126}, {lat:  47.690272, lng: -122.329127}, {lat:  47.690275, lng: -122.329128}, {lat:  47.690278, lng: -122.329129}, {lat:  47.69028, lng: -122.32913}, {lat:  47.690283, lng: -122.32913}, {lat:  47.690286, lng: -122.329131}, {lat:  47.690288, lng: -122.329132}, {lat:  47.690291, lng: -122.329133}, {lat:  47.690294, lng: -122.329133}, {lat:  47.690297, lng: -122.329134}, {lat:  47.690299, lng: -122.329135}, {lat:  47.690302, lng: -122.329136}, {lat:  47.690305, lng: -122.329136}, {lat:  47.690307, lng: -122.329137}, {lat:  47.69031, lng: -122.329138}, {lat:  47.690313, lng: -122.329139}, {lat:  47.690315, lng: -122.329139}, {lat:  47.690318, lng: -122.32914}, {lat:  47.690321, lng: -122.329141}, {lat:  47.690323, lng: -122.329142}, {lat:  47.690326, lng: -122.329142}, {lat:  47.690329, lng: -122.329143}, {lat:  47.690332, lng: -122.329144}, {lat:  47.690334, lng: -122.329145}, {lat:  47.690337, lng: -122.329145}, {lat:  47.69034, lng: -122.329146}, {lat:  47.690342, lng: -122.329147}, {lat:  47.690345, lng: -122.329148}, {lat:  47.690348, lng: -122.329148}, {lat:  47.69035, lng: -122.329149}, {lat:  47.690353, lng: -122.32915}, {lat:  47.690356, lng: -122.329151}, {lat:  47.690359, lng: -122.329151}, {lat:  47.690361, lng: -122.329152}, {lat:  47.690364, lng: -122.329153}, {lat:  47.690367, lng: -122.329153}, {lat:  47.690369, lng: -122.329154}, {lat:  47.690372, lng: -122.329155}, {lat:  47.690375, lng: -122.329156}, {lat:  47.690377, lng: -122.329156}, {lat:  47.69038, lng: -122.329157}, {lat:  47.690383, lng: -122.329158}, {lat:  47.690386, lng: -122.329158}, {lat:  47.690388, lng: -122.329159}, {lat:  47.690391, lng: -122.32916}, {lat:  47.690394, lng: -122.329161}, {lat:  47.690396, lng: -122.329161}, {lat:  47.690399, lng: -122.329162}, {lat:  47.690402, lng: -122.329163}, {lat:  47.690404, lng: -122.329163}, {lat:  47.690407, lng: -122.329164}, {lat:  47.69041, lng: -122.329165}, {lat:  47.690413, lng: -122.329165}, {lat:  47.690415, lng: -122.329166}, {lat:  47.690418, lng: -122.329167}, {lat:  47.690421, lng: -122.329167}, {lat:  47.690423, lng: -122.329168}, {lat:  47.690426, lng: -122.329169}, {lat:  47.690429, lng: -122.32917}, {lat:  47.690431, lng: -122.32917}, {lat:  47.690434, lng: -122.329171}, {lat:  47.690437, lng: -122.329172}, {lat:  47.69044, lng: -122.329172}, {lat:  47.690442, lng: -122.329173}, {lat:  47.690445, lng: -122.329174}, {lat:  47.690446, lng: -122.329312}, {lat:  47.690446, lng: -122.329315}, {lat:  47.690446, lng: -122.329316}, {lat:  47.690447, lng: -122.329371}, {lat:  47.690449, lng: -122.329707}, {lat:  47.690449, lng: -122.32972}, {lat:  47.690449, lng: -122.329723}, {lat:  47.690454, lng: -122.33032}, {lat:  47.690457, lng: -122.330728}, {lat:  47.690457, lng: -122.330729}, {lat:  47.69046, lng: -122.33106}, {lat:  47.69046, lng: -122.331088}, {lat:  47.690468, lng: -122.332128}, {lat:  47.690475, lng: -122.333109}, {lat:  47.690475, lng: -122.33311}, {lat:  47.690476, lng: -122.333184}, {lat:  47.690478, lng: -122.333462}, {lat:  47.69048, lng: -122.333747}, {lat:  47.690481, lng: -122.333747}, {lat:  47.69048, lng: -122.333748}, {lat:  47.69048, lng: -122.333751}, {lat:  47.690481, lng: -122.333868}, {lat:  47.690481, lng: -122.33387}, {lat:  47.69049, lng: -122.334972}, {lat:  47.69049, lng: -122.334973}, {lat:  47.69049, lng: -122.335039}, {lat:  47.690491, lng: -122.335094}, {lat:  47.690491, lng: -122.335207}, {lat:  47.690492, lng: -122.335215}, {lat:  47.690492, lng: -122.335217}, {lat:  47.6905, lng: -122.336305}, {lat:  47.6905, lng: -122.336311}, {lat:  47.6905, lng: -122.336319}, {lat:  47.6905, lng: -122.33632}, {lat:  47.6905, lng: -122.336327}, {lat:  47.690501, lng: -122.33644}, {lat:  47.690501, lng: -122.336516}, {lat:  47.690502, lng: -122.336562}, {lat:  47.690502, lng: -122.336577}, {lat:  47.690505, lng: -122.337023}, {lat:  47.690506, lng: -122.337129}, {lat:  47.690508, lng: -122.337417}, {lat:  47.690511, lng: -122.337701}, {lat:  47.690511, lng: -122.337786}, {lat:  47.690512, lng: -122.337953}, {lat:  47.690513, lng: -122.338078}, {lat:  47.690513, lng: -122.338084}, {lat:  47.690522, lng: -122.339134}, {lat:  47.690523, lng: -122.339264}, {lat:  47.690523, lng: -122.339276}, {lat:  47.69053, lng: -122.340218}, {lat:  47.69053, lng: -122.340222}, {lat:  47.690532, lng: -122.34048}, {lat:  47.690538, lng: -122.341294}, {lat:  47.690538, lng: -122.341296}, {lat:  47.690542, lng: -122.341828}, {lat:  47.690546, lng: -122.34237}, {lat:  47.690546, lng: -122.342373}, {lat:  47.690554, lng: -122.343446}, {lat:  47.690554, lng: -122.343449}, {lat:  47.690563, lng: -122.344522}, {lat:  47.690571, lng: -122.347202}, {lat:  47.690571, lng: -122.347207}, {lat:  47.690571, lng: -122.347215}, {lat:  47.690571, lng: -122.34722}, {lat:  47.690579, lng: -122.349892}, {lat:  47.690579, lng: -122.349907}, {lat:  47.690579, lng: -122.349912}, {lat:  47.691303, lng: -122.349921}, {lat:  47.692028, lng: -122.349929}, {lat:  47.692402, lng: -122.349934}, {lat:  47.692406, lng: -122.351291}, {lat:  47.692405, lng: -122.351291}, {lat:  47.692405, lng: -122.351292}, {lat:  47.692409, lng: -122.352622}, {lat:  47.692413, lng: -122.353952}, {lat:  47.692417, lng: -122.355321}, {lat:  47.692418, lng: -122.355321}, {lat:  47.694217, lng: -122.355339}, {lat:  47.696028, lng: -122.355358}, {lat:  47.697839, lng: -122.355377}, {lat:  47.698257, lng: -122.355381}, {lat:  47.699204, lng: -122.355391}, {lat:  47.699623, lng: -122.355396}, {lat:  47.69965, lng: -122.355396}, {lat:  47.699921, lng: -122.355399}, {lat:  47.700091, lng: -122.355401}, {lat:  47.701461, lng: -122.355415}, {lat:  47.701739, lng: -122.355418}, {lat:  47.701864, lng: -122.355419}, {lat:  47.702186, lng: -122.355422}, {lat:  47.702268, lng: -122.355423}, {lat:  47.70291, lng: -122.35543}, {lat:  47.703635, lng: -122.355438}, {lat:  47.704359, lng: -122.355445}, {lat:  47.704398, lng: -122.355446}, {lat:  47.70441, lng: -122.355446}, {lat:  47.704453, lng: -122.355446}, {lat:  47.705084, lng: -122.355453}, {lat:  47.705084, lng: -122.355575}, {lat:  47.705085, lng: -122.355661}, {lat:  47.705087, lng: -122.355875}, {lat:  47.705087, lng: -122.355964}, {lat:  47.705093, lng: -122.356724}, {lat:  47.705093, lng: -122.356781}, {lat:  47.705098, lng: -122.357475}, {lat:  47.705102, lng: -122.357987}, {lat:  47.705103, lng: -122.358072}, {lat:  47.705103, lng: -122.358088}, {lat:  47.705103, lng: -122.358095}, {lat:  47.705103, lng: -122.358109}, {lat:  47.705105, lng: -122.358409}, {lat:  47.705105, lng: -122.358433}, {lat:  47.705113, lng: -122.359437}, {lat:  47.705113, lng: -122.359498}, {lat:  47.705117, lng: -122.360009}, {lat:  47.705119, lng: -122.360368}, {lat:  47.705119, lng: -122.360378}, {lat:  47.705121, lng: -122.360642}, {lat:  47.705121, lng: -122.360643}, {lat:  47.705122, lng: -122.360765}, {lat:  47.705123, lng: -122.360887}, {lat:  47.705136, lng: -122.362622}, {lat:  47.705136, lng: -122.362628}, {lat:  47.705136, lng: -122.36268}, {lat:  47.705138, lng: -122.362939}, {lat:  47.705138, lng: -122.362999}, {lat:  47.705147, lng: -122.364249}, {lat:  47.705148, lng: -122.364273}, {lat:  47.705151, lng: -122.36471}, {lat:  47.705151, lng: -122.36472}, {lat:  47.705156, lng: -122.365415}, {lat:  47.705156, lng: -122.365442}, {lat:  47.705156, lng: -122.365503}, {lat:  47.705158, lng: -122.365715}, {lat:  47.705158, lng: -122.36572}, {lat:  47.70516, lng: -122.365955}, {lat:  47.705161, lng: -122.366077}, {lat:  47.705162, lng: -122.366633}, {lat:  47.705165, lng: -122.367411}, {lat:  47.705167, lng: -122.367982}, {lat:  47.705167, lng: -122.368078}, {lat:  47.705169, lng: -122.368621}, {lat:  47.705169, lng: -122.368623}, {lat:  47.705169, lng: -122.368745}, {lat:  47.705168, lng: -122.368745}, {lat:  47.705168, lng: -122.368746}, {lat:  47.705177, lng: -122.370154}, {lat:  47.705174, lng: -122.370154}, {lat:  47.705174, lng: -122.370294}, {lat:  47.705174, lng: -122.370313}, {lat:  47.705177, lng: -122.371026}, {lat:  47.705178, lng: -122.371294}, {lat:  47.705178, lng: -122.371296}, {lat:  47.705178, lng: -122.371393}, {lat:  47.705182, lng: -122.372747}, {lat:  47.705186, lng: -122.374042}, {lat:  47.705186, lng: -122.37408}, {lat:  47.705195, lng: -122.37408}, {lat:  47.707505, lng: -122.374093}, {lat:  47.707592, lng: -122.37475}, {lat:  47.707593, lng: -122.374755}, {lat:  47.707594, lng: -122.374759}, {lat:  47.707594, lng: -122.374763}, {lat:  47.707595, lng: -122.374766}, {lat:  47.707595, lng: -122.374767}, {lat:  47.707595, lng: -122.374771}, {lat:  47.707596, lng: -122.374775}, {lat:  47.707597, lng: -122.374779}, {lat:  47.707597, lng: -122.374781}, {lat:  47.707597, lng: -122.374782}, {lat:  47.707597, lng: -122.374783}, {lat:  47.707598, lng: -122.374787}, {lat:  47.707599, lng: -122.374791}, {lat:  47.7076, lng: -122.374795}, {lat:  47.707601, lng: -122.374798}, {lat:  47.707602, lng: -122.374802}, {lat:  47.707602, lng: -122.374806}, {lat:  47.707603, lng: -122.37481}, {lat:  47.707604, lng: -122.374814}, {lat:  47.707605, lng: -122.374817}, {lat:  47.707606, lng: -122.374821}, {lat:  47.707607, lng: -122.374825}, {lat:  47.707608, lng: -122.374829}, {lat:  47.707609, lng: -122.374833}, {lat:  47.70761, lng: -122.374836}, {lat:  47.707611, lng: -122.37484}, {lat:  47.707612, lng: -122.374844}, {lat:  47.707612, lng: -122.374845}, {lat:  47.707613, lng: -122.374848}, {lat:  47.707614, lng: -122.374851}, {lat:  47.707615, lng: -122.374855}, {lat:  47.707616, lng: -122.374859}, {lat:  47.707617, lng: -122.374863}, {lat:  47.707618, lng: -122.374866}, {lat:  47.707619, lng: -122.37487}, {lat:  47.70762, lng: -122.374874}, {lat:  47.707621, lng: -122.374875}, {lat:  47.707622, lng: -122.374877}, {lat:  47.707623, lng: -122.374881}, {lat:  47.707624, lng: -122.374885}, {lat:  47.707625, lng: -122.374888}, {lat:  47.707626, lng: -122.374888}, {lat:  47.707627, lng: -122.374892}, {lat:  47.707628, lng: -122.374895}, {lat:  47.707629, lng: -122.374899}, {lat:  47.707631, lng: -122.374903}, {lat:  47.707631, lng: -122.374905}, {lat:  47.707632, lng: -122.374906}, {lat:  47.707633, lng: -122.37491}, {lat:  47.707635, lng: -122.374913}, {lat:  47.707636, lng: -122.374916}, {lat:  47.707638, lng: -122.37492}, {lat:  47.707639, lng: -122.374923}, {lat:  47.70764, lng: -122.374926}, {lat:  47.707641, lng: -122.374927}, {lat:  47.707642, lng: -122.37493}, {lat:  47.707643, lng: -122.374933}, {lat:  47.707644, lng: -122.374934}, {lat:  47.707645, lng: -122.374937}, {lat:  47.707647, lng: -122.37494}, {lat:  47.707648, lng: -122.374944}, {lat:  47.70765, lng: -122.374947}, {lat:  47.707652, lng: -122.37495}, {lat:  47.707653, lng: -122.374954}, {lat:  47.707655, lng: -122.374957}, {lat:  47.707656, lng: -122.37496}, {lat:  47.707658, lng: -122.374963}, {lat:  47.70766, lng: -122.374966}, {lat:  47.707661, lng: -122.374969}, {lat:  47.707663, lng: -122.374973}, {lat:  47.707665, lng: -122.374976}, {lat:  47.707667, lng: -122.374979}, {lat:  47.707668, lng: -122.374982}, {lat:  47.70767, lng: -122.374985}, {lat:  47.70767, lng: -122.374986}, {lat:  47.707672, lng: -122.374988}, {lat:  47.707673, lng: -122.37499}, {lat:  47.707674, lng: -122.374991}, {lat:  47.707676, lng: -122.374994}, {lat:  47.707678, lng: -122.374997}, {lat:  47.70768, lng: -122.375}, {lat:  47.707681, lng: -122.375003}, {lat:  47.707683, lng: -122.375006}, {lat:  47.707685, lng: -122.375009}, {lat:  47.707686, lng: -122.37501}, {lat:  47.707687, lng: -122.375012}, {lat:  47.707689, lng: -122.375015}, {lat:  47.707691, lng: -122.375018}, {lat:  47.707693, lng: -122.37502}, {lat:  47.707694, lng: -122.375022}, {lat:  47.707695, lng: -122.375023}, {lat:  47.707697, lng: -122.375026}, {lat:  47.707699, lng: -122.375029}, {lat:  47.707701, lng: -122.375031}, {lat:  47.707702, lng: -122.375033}, {lat:  47.707703, lng: -122.375034}, {lat:  47.707705, lng: -122.375037}, {lat:  47.707707, lng: -122.375039}, {lat:  47.707709, lng: -122.375042}, {lat:  47.707712, lng: -122.375045}, {lat:  47.707714, lng: -122.375047}, {lat:  47.707716, lng: -122.37505}, {lat:  47.707718, lng: -122.375052}, {lat:  47.707719, lng: -122.375054}, {lat:  47.70772, lng: -122.375055}, {lat:  47.707722, lng: -122.375057}, {lat:  47.707724, lng: -122.37506}, {lat:  47.707727, lng: -122.375062}, {lat:  47.707729, lng: -122.375064}, {lat:  47.707731, lng: -122.375067}, {lat:  47.707733, lng: -122.375069}, {lat:  47.707736, lng: -122.375071}, {lat:  47.707738, lng: -122.375073}, {lat:  47.707738, lng: -122.375074}, {lat:  47.70774, lng: -122.375076}, {lat:  47.707742, lng: -122.375078}, {lat:  47.707745, lng: -122.37508}, {lat:  47.707747, lng: -122.375082}, {lat:  47.707749, lng: -122.375084}, {lat:  47.707752, lng: -122.375087}, {lat:  47.707754, lng: -122.375089}, {lat:  47.707757, lng: -122.375091}, {lat:  47.707759, lng: -122.375093}, {lat:  47.707761, lng: -122.375095}, {lat:  47.707764, lng: -122.375097}, {lat:  47.707766, lng: -122.375099}, {lat:  47.707767, lng: -122.375099}, {lat:  47.707769, lng: -122.375101}, {lat:  47.707771, lng: -122.375103}, {lat:  47.707773, lng: -122.375104}, {lat:  47.707776, lng: -122.375106}, {lat:  47.707776, lng: -122.375107}, {lat:  47.707778, lng: -122.375108}, {lat:  47.707781, lng: -122.37511}, {lat:  47.707783, lng: -122.375111}, {lat:  47.707786, lng: -122.375113}, {lat:  47.707788, lng: -122.375115}, {lat:  47.707789, lng: -122.375115}, {lat:  47.707791, lng: -122.375116}, {lat:  47.707793, lng: -122.375118}, {lat:  47.707796, lng: -122.37512}, {lat:  47.707797, lng: -122.37512}, {lat:  47.707798, lng: -122.375121}, {lat:  47.707811, lng: -122.375129}, {lat:  47.707814, lng: -122.37513}, {lat:  47.707816, lng: -122.375132}, {lat:  47.707818, lng: -122.375132}, {lat:  47.707819, lng: -122.375133}, {lat:  47.707821, lng: -122.375134}, {lat:  47.707824, lng: -122.375135}, {lat:  47.707827, lng: -122.375136}, {lat:  47.707829, lng: -122.375138}, {lat:  47.707832, lng: -122.375139}, {lat:  47.707835, lng: -122.37514}, {lat:  47.707837, lng: -122.375141}, {lat:  47.707839, lng: -122.375142}, {lat:  47.70784, lng: -122.375142}, {lat:  47.707842, lng: -122.375143}, {lat:  47.707845, lng: -122.375144}, {lat:  47.707847, lng: -122.375145}, {lat:  47.707848, lng: -122.375145}, {lat:  47.70785, lng: -122.375146}, {lat:  47.707853, lng: -122.375147}, {lat:  47.707856, lng: -122.375148}, {lat:  47.707858, lng: -122.375149}, {lat:  47.707861, lng: -122.37515}, {lat:  47.707864, lng: -122.37515}, {lat:  47.707867, lng: -122.375151}, {lat:  47.707869, lng: -122.375152}, {lat:  47.707871, lng: -122.375152}, {lat:  47.707872, lng: -122.375152}, {lat:  47.707875, lng: -122.375153}, {lat:  47.707877, lng: -122.375154}, {lat:  47.70788, lng: -122.375154}, {lat:  47.707883, lng: -122.375155}, {lat:  47.707885, lng: -122.375156}, {lat:  47.707888, lng: -122.375156}, {lat:  47.707891, lng: -122.375156}, {lat:  47.707894, lng: -122.375157}, {lat:  47.707896, lng: -122.375157}, {lat:  47.707899, lng: -122.375158}, {lat:  47.707902, lng: -122.375158}, {lat:  47.707905, lng: -122.375158}, {lat:  47.707907, lng: -122.375159}, {lat:  47.707921, lng: -122.375159}, {lat:  47.707924, lng: -122.37516}, {lat:  47.707926, lng: -122.37516}, {lat:  47.707928, lng: -122.37516}, {lat:  47.707929, lng: -122.37516}, {lat:  47.707932, lng: -122.37516}, {lat:  47.707935, lng: -122.375159}, {lat:  47.707937, lng: -122.375159}, {lat:  47.70794, lng: -122.375159}, {lat:  47.707943, lng: -122.375159}, {lat:  47.707946, lng: -122.375159}, {lat:  47.707948, lng: -122.375159}, {lat:  47.70795, lng: -122.375159}, {lat:  47.707951, lng: -122.375159}, {lat:  47.707954, lng: -122.375158}, {lat:  47.707955, lng: -122.375158}, {lat:  47.707957, lng: -122.375158}, {lat:  47.707959, lng: -122.375157}, {lat:  47.707962, lng: -122.375157}, {lat:  47.707965, lng: -122.375157}, {lat:  47.707968, lng: -122.375156}, {lat:  47.70797, lng: -122.375156}, {lat:  47.707972, lng: -122.375156}, {lat:  47.707973, lng: -122.375155}, {lat:  47.707976, lng: -122.375155}, {lat:  47.707978, lng: -122.375154}, {lat:  47.707981, lng: -122.375154}, {lat:  47.707984, lng: -122.375153}, {lat:  47.707987, lng: -122.375153}, {lat:  47.707989, lng: -122.375152}, {lat:  47.707992, lng: -122.375151}, {lat:  47.707995, lng: -122.37515}, {lat:  47.707998, lng: -122.375149}, {lat:  47.708001, lng: -122.375148}, {lat:  47.708003, lng: -122.375147}, {lat:  47.708006, lng: -122.375146}, {lat:  47.708009, lng: -122.375146}, {lat:  47.708011, lng: -122.375145}, {lat:  47.708014, lng: -122.375144}, {lat:  47.708017, lng: -122.375143}, {lat:  47.708019, lng: -122.375142}, {lat:  47.708022, lng: -122.375141}, {lat:  47.708025, lng: -122.37514}, {lat:  47.708027, lng: -122.375139}, {lat:  47.70803, lng: -122.375138}, {lat:  47.708032, lng: -122.375137}, {lat:  47.708034, lng: -122.375136}, {lat:  47.708035, lng: -122.375135}, {lat:  47.708038, lng: -122.375134}, {lat:  47.70804, lng: -122.375133}, {lat:  47.708043, lng: -122.375132}, {lat:  47.708045, lng: -122.375131}, {lat:  47.708046, lng: -122.375131}, {lat:  47.708048, lng: -122.37513}, {lat:  47.708051, lng: -122.375128}, {lat:  47.708053, lng: -122.375127}, {lat:  47.708056, lng: -122.375126}, {lat:  47.708059, lng: -122.375124}, {lat:  47.708061, lng: -122.375123}, {lat:  47.708064, lng: -122.375122}, {lat:  47.708067, lng: -122.37512}, {lat:  47.708069, lng: -122.375119}, {lat:  47.708072, lng: -122.375117}, {lat:  47.708074, lng: -122.375116}, {lat:  47.708077, lng: -122.375114}, {lat:  47.708079, lng: -122.375113}, {lat:  47.708082, lng: -122.375111}, {lat:  47.708084, lng: -122.37511}, {lat:  47.708087, lng: -122.375108}, {lat:  47.708089, lng: -122.375107}, {lat:  47.70809, lng: -122.375107}, {lat:  47.708092, lng: -122.375105}, {lat:  47.708094, lng: -122.375104}, {lat:  47.708097, lng: -122.375102}, {lat:  47.708102, lng: -122.375098}, {lat:  47.708104, lng: -122.375097}, {lat:  47.708107, lng: -122.375095}, {lat:  47.708109, lng: -122.375093}, {lat:  47.708112, lng: -122.375092}, {lat:  47.708112, lng: -122.375091}, {lat:  47.708114, lng: -122.37509}, {lat:  47.708117, lng: -122.375088}, {lat:  47.708119, lng: -122.375086}, {lat:  47.708121, lng: -122.375084}, {lat:  47.708124, lng: -122.375082}, {lat:  47.708126, lng: -122.37508}, {lat:  47.708129, lng: -122.375078}, {lat:  47.708131, lng: -122.375077}, {lat:  47.708134, lng: -122.375075}, {lat:  47.708134, lng: -122.375074}, {lat:  47.708136, lng: -122.375073}, {lat:  47.708138, lng: -122.37507}, {lat:  47.708141, lng: -122.375068}, {lat:  47.708143, lng: -122.375066}, {lat:  47.708145, lng: -122.375064}, {lat:  47.708148, lng: -122.375062}, {lat:  47.70815, lng: -122.37506}, {lat:  47.708152, lng: -122.375058}, {lat:  47.708155, lng: -122.375056}, {lat:  47.708156, lng: -122.375055}, {lat:  47.708157, lng: -122.375053}, {lat:  47.708159, lng: -122.375051}, {lat:  47.708162, lng: -122.375049}, {lat:  47.708164, lng: -122.375047}, {lat:  47.708166, lng: -122.375044}, {lat:  47.708168, lng: -122.375042}, {lat:  47.708171, lng: -122.37504}, {lat:  47.708173, lng: -122.375038}, {lat:  47.708175, lng: -122.375035}, {lat:  47.708176, lng: -122.375034}, {lat:  47.708177, lng: -122.375033}, {lat:  47.70818, lng: -122.375031}, {lat:  47.708182, lng: -122.375028}, {lat:  47.708184, lng: -122.375026}, {lat:  47.708186, lng: -122.375023}, {lat:  47.708188, lng: -122.375021}, {lat:  47.708191, lng: -122.375018}, {lat:  47.708193, lng: -122.375016}, {lat:  47.708195, lng: -122.375014}, {lat:  47.708196, lng: -122.375012}, {lat:  47.708197, lng: -122.375011}, {lat:  47.708199, lng: -122.375009}, {lat:  47.708201, lng: -122.375006}, {lat:  47.708203, lng: -122.375003}, {lat:  47.708205, lng: -122.375001}, {lat:  47.708208, lng: -122.374998}, {lat:  47.70821, lng: -122.374995}, {lat:  47.708212, lng: -122.374993}, {lat:  47.708214, lng: -122.37499}, {lat:  47.708215, lng: -122.374988}, {lat:  47.708216, lng: -122.374987}, {lat:  47.708218, lng: -122.374985}, {lat:  47.70822, lng: -122.374982}, {lat:  47.708222, lng: -122.374979}, {lat:  47.708224, lng: -122.374976}, {lat:  47.708226, lng: -122.374974}, {lat:  47.708228, lng: -122.374971}, {lat:  47.70823, lng: -122.374968}, {lat:  47.708232, lng: -122.374965}, {lat:  47.708234, lng: -122.374963}, {lat:  47.708236, lng: -122.37496}, {lat:  47.708238, lng: -122.374957}, {lat:  47.70824, lng: -122.374954}, {lat:  47.708242, lng: -122.374951}, {lat:  47.708244, lng: -122.374948}, {lat:  47.708245, lng: -122.374945}, {lat:  47.708247, lng: -122.374942}, {lat:  47.708249, lng: -122.374939}, {lat:  47.708251, lng: -122.374936}, {lat:  47.708253, lng: -122.374933}, {lat:  47.708255, lng: -122.37493}, {lat:  47.708256, lng: -122.374927}, {lat:  47.708258, lng: -122.374924}, {lat:  47.70826, lng: -122.374921}, {lat:  47.708262, lng: -122.374918}, {lat:  47.708264, lng: -122.374915}, {lat:  47.708265, lng: -122.374912}, {lat:  47.708267, lng: -122.374909}, {lat:  47.708269, lng: -122.374904}, {lat:  47.708271, lng: -122.374901}, {lat:  47.708273, lng: -122.374898}, {lat:  47.708274, lng: -122.374895}, {lat:  47.708276, lng: -122.374892}, {lat:  47.708278, lng: -122.374888}, {lat:  47.708279, lng: -122.374885}, {lat:  47.708281, lng: -122.374882}, {lat:  47.708283, lng: -122.374879}, {lat:  47.708284, lng: -122.374876}, {lat:  47.708286, lng: -122.374872}, {lat:  47.708287, lng: -122.374869}, {lat:  47.708289, lng: -122.374866}, {lat:  47.70829, lng: -122.374862}, {lat:  47.708292, lng: -122.374859}, {lat:  47.708294, lng: -122.374856}, {lat:  47.708295, lng: -122.374852}, {lat:  47.708297, lng: -122.374849}, {lat:  47.708298, lng: -122.374845}, {lat:  47.7083, lng: -122.374842}, {lat:  47.708301, lng: -122.374839}, {lat:  47.708302, lng: -122.374835}, {lat:  47.708304, lng: -122.374832}, {lat:  47.708305, lng: -122.374828}, {lat:  47.708307, lng: -122.374825}, {lat:  47.708308, lng: -122.374821}, {lat:  47.70831, lng: -122.374818}, {lat:  47.708311, lng: -122.374814}, {lat:  47.708312, lng: -122.374811}, {lat:  47.708314, lng: -122.374807}, {lat:  47.708315, lng: -122.374804}, {lat:  47.708316, lng: -122.3748}, {lat:  47.708318, lng: -122.374797}, {lat:  47.708319, lng: -122.374793}, {lat:  47.70832, lng: -122.374789}, {lat:  47.708321, lng: -122.374786}, {lat:  47.708322, lng: -122.374785}, {lat:  47.708323, lng: -122.374782}, {lat:  47.708324, lng: -122.374779}, {lat:  47.708325, lng: -122.374775}, {lat:  47.708326, lng: -122.374771}, {lat:  47.708327, lng: -122.374768}, {lat:  47.708329, lng: -122.374764}, {lat:  47.70833, lng: -122.37476}, {lat:  47.708331, lng: -122.374757}, {lat:  47.708332, lng: -122.374753}, {lat:  47.708333, lng: -122.374752}, {lat:  47.708333, lng: -122.374749}, {lat:  47.708334, lng: -122.374745}, {lat:  47.708335, lng: -122.374742}, {lat:  47.708336, lng: -122.374738}, {lat:  47.708337, lng: -122.374734}, {lat:  47.708339, lng: -122.37473}, {lat:  47.70834, lng: -122.374727}, {lat:  47.708341, lng: -122.374723}, {lat:  47.708342, lng: -122.374719}, {lat:  47.708342, lng: -122.374718}, {lat:  47.708343, lng: -122.374715}, {lat:  47.708344, lng: -122.374711}, {lat:  47.708345, lng: -122.374707}, {lat:  47.708345, lng: -122.374704}, {lat:  47.708346, lng: -122.3747}, {lat:  47.708347, lng: -122.374696}, {lat:  47.708348, lng: -122.374692}, {lat:  47.708349, lng: -122.374688}, {lat:  47.70835, lng: -122.374684}, {lat:  47.70835, lng: -122.374683}, {lat:  47.708351, lng: -122.374681}, {lat:  47.708352, lng: -122.374677}, {lat:  47.708352, lng: -122.374673}, {lat:  47.708353, lng: -122.374669}, {lat:  47.708354, lng: -122.374665}, {lat:  47.708355, lng: -122.374661}, {lat:  47.708355, lng: -122.374657}, {lat:  47.708356, lng: -122.374653}, {lat:  47.708357, lng: -122.374649}, {lat:  47.708357, lng: -122.374647}, {lat:  47.708358, lng: -122.374646}, {lat:  47.708358, lng: -122.374642}, {lat:  47.708359, lng: -122.374638}, {lat:  47.70836, lng: -122.374634}, {lat:  47.70836, lng: -122.37463}, {lat:  47.708361, lng: -122.374626}, {lat:  47.708362, lng: -122.374622}, {lat:  47.708362, lng: -122.374618}, {lat:  47.708363, lng: -122.374614}, {lat:  47.708363, lng: -122.374612}, {lat:  47.708363, lng: -122.37461}, {lat:  47.708364, lng: -122.374606}, {lat:  47.708364, lng: -122.374602}, {lat:  47.708365, lng: -122.374598}, {lat:  47.708365, lng: -122.374594}, {lat:  47.708366, lng: -122.37459}, {lat:  47.708366, lng: -122.374586}, {lat:  47.708367, lng: -122.374582}, {lat:  47.708367, lng: -122.374578}, {lat:  47.708368, lng: -122.374575}, {lat:  47.708368, lng: -122.374574}, {lat:  47.708368, lng: -122.37457}, {lat:  47.708369, lng: -122.374566}, {lat:  47.708369, lng: -122.374562}, {lat:  47.708369, lng: -122.374558}, {lat:  47.70837, lng: -122.374554}, {lat:  47.70837, lng: -122.37455}, {lat:  47.70837, lng: -122.374546}, {lat:  47.708371, lng: -122.374542}, {lat:  47.708371, lng: -122.374539}, {lat:  47.708371, lng: -122.374538}, {lat:  47.708371, lng: -122.374534}, {lat:  47.708371, lng: -122.374529}, {lat:  47.708372, lng: -122.374525}, {lat:  47.708372, lng: -122.374521}, {lat:  47.708372, lng: -122.37452}, {lat:  47.708372, lng: -122.374517}, {lat:  47.708372, lng: -122.374513}, {lat:  47.708372, lng: -122.374509}, {lat:  47.708373, lng: -122.374505}, {lat:  47.708373, lng: -122.374502}, {lat:  47.708373, lng: -122.374501}, {lat:  47.708373, lng: -122.374497}, {lat:  47.708373, lng: -122.374493}, {lat:  47.708373, lng: -122.374489}, {lat:  47.708373, lng: -122.374485}, {lat:  47.708373, lng: -122.374481}, {lat:  47.708373, lng: -122.374477}, {lat:  47.708373, lng: -122.374473}, {lat:  47.708373, lng: -122.374469}, {lat:  47.708373, lng: -122.374465}, {lat:  47.708372, lng: -122.373844}, {lat:  47.708372, lng: -122.373838}, {lat:  47.708372, lng: -122.373834}, {lat:  47.708372, lng: -122.37383}, {lat:  47.708371, lng: -122.373825}, {lat:  47.708371, lng: -122.373821}, {lat:  47.708371, lng: -122.373817}, {lat:  47.708371, lng: -122.373813}, {lat:  47.708371, lng: -122.373809}, {lat:  47.708371, lng: -122.373805}, {lat:  47.708371, lng: -122.373801}, {lat:  47.708371, lng: -122.373797}, {lat:  47.708371, lng: -122.373793}, {lat:  47.708371, lng: -122.373789}, {lat:  47.708371, lng: -122.373785}, {lat:  47.708371, lng: -122.373781}, {lat:  47.708371, lng: -122.373777}, {lat:  47.708371, lng: -122.373773}, {lat:  47.708371, lng: -122.373769}, {lat:  47.708371, lng: -122.373765}, {lat:  47.708371, lng: -122.373763}, {lat:  47.708371, lng: -122.373761}, {lat:  47.708371, lng: -122.373757}, {lat:  47.708371, lng: -122.373752}, {lat:  47.708371, lng: -122.373748}, {lat:  47.70837, lng: -122.373744}, {lat:  47.70837, lng: -122.37374}, {lat:  47.70837, lng: -122.373736}, {lat:  47.70837, lng: -122.373732}, {lat:  47.70837, lng: -122.373728}, {lat:  47.70837, lng: -122.373724}, {lat:  47.70837, lng: -122.37372}, {lat:  47.70837, lng: -122.373716}, {lat:  47.70837, lng: -122.373712}, {lat:  47.708369, lng: -122.373708}, {lat:  47.708369, lng: -122.373704}, {lat:  47.708369, lng: -122.3737}, {lat:  47.708369, lng: -122.373696}, {lat:  47.708369, lng: -122.373692}, {lat:  47.708369, lng: -122.373688}, {lat:  47.708369, lng: -122.373684}, {lat:  47.708368, lng: -122.373683}, {lat:  47.708368, lng: -122.373679}, {lat:  47.708368, lng: -122.373675}, {lat:  47.708368, lng: -122.373671}, {lat:  47.708368, lng: -122.373667}, {lat:  47.708368, lng: -122.373663}, {lat:  47.708367, lng: -122.373659}, {lat:  47.708367, lng: -122.373655}, {lat:  47.708367, lng: -122.373651}, {lat:  47.708367, lng: -122.373647}, {lat:  47.708367, lng: -122.373643}, {lat:  47.708367, lng: -122.373639}, {lat:  47.708366, lng: -122.373635}, {lat:  47.708366, lng: -122.373631}, {lat:  47.708366, lng: -122.373627}, {lat:  47.708366, lng: -122.373623}, {lat:  47.708366, lng: -122.373619}, {lat:  47.708366, lng: -122.373615}, {lat:  47.708365, lng: -122.37361}, {lat:  47.708365, lng: -122.373606}, {lat:  47.708365, lng: -122.373602}, {lat:  47.708365, lng: -122.373598}, {lat:  47.708365, lng: -122.373594}, {lat:  47.708364, lng: -122.37359}, {lat:  47.708364, lng: -122.373586}, {lat:  47.708364, lng: -122.373582}, {lat:  47.708364, lng: -122.373578}, {lat:  47.708363, lng: -122.373574}, {lat:  47.708363, lng: -122.37357}, {lat:  47.708363, lng: -122.373566}, {lat:  47.708363, lng: -122.373562}, {lat:  47.708362, lng: -122.373558}, {lat:  47.708362, lng: -122.373554}, {lat:  47.708362, lng: -122.37355}, {lat:  47.708362, lng: -122.373546}, {lat:  47.708361, lng: -122.373542}, {lat:  47.708361, lng: -122.373538}, {lat:  47.708361, lng: -122.373534}, {lat:  47.708361, lng: -122.37353}, {lat:  47.70836, lng: -122.373526}, {lat:  47.70836, lng: -122.373521}, {lat:  47.70836, lng: -122.373517}, {lat:  47.70836, lng: -122.373513}, {lat:  47.708359, lng: -122.373509}, {lat:  47.708359, lng: -122.373505}, {lat:  47.708359, lng: -122.373501}, {lat:  47.708358, lng: -122.373497}, {lat:  47.708358, lng: -122.373493}, {lat:  47.708358, lng: -122.373489}, {lat:  47.708357, lng: -122.373485}, {lat:  47.708357, lng: -122.373481}, {lat:  47.708357, lng: -122.373477}, {lat:  47.708356, lng: -122.373473}, {lat:  47.708356, lng: -122.373469}, {lat:  47.708356, lng: -122.373465}, {lat:  47.708355, lng: -122.373461}, {lat:  47.708355, lng: -122.373457}, {lat:  47.708355, lng: -122.373453}, {lat:  47.708355, lng: -122.373449}, {lat:  47.708354, lng: -122.373445}, {lat:  47.708354, lng: -122.373442}, {lat:  47.708354, lng: -122.373441}, {lat:  47.708354, lng: -122.373437}, {lat:  47.708353, lng: -122.373433}, {lat:  47.708353, lng: -122.373429}, {lat:  47.708352, lng: -122.373425}, {lat:  47.708352, lng: -122.373421}, {lat:  47.708352, lng: -122.373417}, {lat:  47.708351, lng: -122.373413}, {lat:  47.708351, lng: -122.373409}, {lat:  47.708351, lng: -122.373405}, {lat:  47.70835, lng: -122.373401}, {lat:  47.70835, lng: -122.373397}, {lat:  47.708349, lng: -122.373393}, {lat:  47.708349, lng: -122.373389}, {lat:  47.708349, lng: -122.373385}, {lat:  47.708348, lng: -122.37338}, {lat:  47.708348, lng: -122.373376}, {lat:  47.708348, lng: -122.373372}, {lat:  47.708347, lng: -122.373368}, {lat:  47.708347, lng: -122.373364}, {lat:  47.708347, lng: -122.373362}, {lat:  47.708346, lng: -122.373361}, {lat:  47.708346, lng: -122.373357}, {lat:  47.708346, lng: -122.373353}, {lat:  47.708345, lng: -122.373349}, {lat:  47.708345, lng: -122.373345}, {lat:  47.708344, lng: -122.373341}, {lat:  47.708344, lng: -122.373337}, {lat:  47.708343, lng: -122.373333}, {lat:  47.708343, lng: -122.373329}, {lat:  47.708342, lng: -122.373324}, {lat:  47.708342, lng: -122.37332}, {lat:  47.708342, lng: -122.373316}, {lat:  47.708341, lng: -122.373312}, {lat:  47.708341, lng: -122.373308}, {lat:  47.70834, lng: -122.373304}, {lat:  47.70834, lng: -122.3733}, {lat:  47.708339, lng: -122.373296}, {lat:  47.708339, lng: -122.373292}, {lat:  47.708338, lng: -122.373288}, {lat:  47.708338, lng: -122.373284}, {lat:  47.708338, lng: -122.373282}, {lat:  47.708338, lng: -122.37328}, {lat:  47.708337, lng: -122.373276}, {lat:  47.708336, lng: -122.373272}, {lat:  47.708336, lng: -122.373268}, {lat:  47.708335, lng: -122.373264}, {lat:  47.708335, lng: -122.37326}, {lat:  47.708334, lng: -122.373256}, {lat:  47.708334, lng: -122.373252}, {lat:  47.708333, lng: -122.373248}, {lat:  47.708333, lng: -122.373244}, {lat:  47.708332, lng: -122.37324}, {lat:  47.708332, lng: -122.373236}, {lat:  47.708331, lng: -122.373232}, {lat:  47.708331, lng: -122.373228}, {lat:  47.70833, lng: -122.373224}, {lat:  47.70833, lng: -122.37322}, {lat:  47.708329, lng: -122.373216}, {lat:  47.708329, lng: -122.373212}, {lat:  47.708328, lng: -122.373208}, {lat:  47.708328, lng: -122.373204}, {lat:  47.708328, lng: -122.373203}, {lat:  47.708327, lng: -122.3732}, {lat:  47.708327, lng: -122.373196}, {lat:  47.708326, lng: -122.373192}, {lat:  47.708326, lng: -122.373188}, {lat:  47.708325, lng: -122.373184}, {lat:  47.708324, lng: -122.37318}, {lat:  47.708324, lng: -122.373176}, {lat:  47.708323, lng: -122.373172}, {lat:  47.708323, lng: -122.373168}, {lat:  47.708322, lng: -122.373164}, {lat:  47.708322, lng: -122.37316}, {lat:  47.708321, lng: -122.373156}, {lat:  47.70832, lng: -122.373152}, {lat:  47.70832, lng: -122.373149}, {lat:  47.708319, lng: -122.373145}, {lat:  47.708319, lng: -122.373141}, {lat:  47.708318, lng: -122.373137}, {lat:  47.708318, lng: -122.373133}, {lat:  47.708317, lng: -122.373129}, {lat:  47.708317, lng: -122.373125}, {lat:  47.708316, lng: -122.373121}, {lat:  47.708315, lng: -122.373117}, {lat:  47.708315, lng: -122.373113}, {lat:  47.708314, lng: -122.373109}, {lat:  47.708313, lng: -122.373105}, {lat:  47.708313, lng: -122.373101}, {lat:  47.708312, lng: -122.373097}, {lat:  47.708311, lng: -122.373093}, {lat:  47.708311, lng: -122.373089}, {lat:  47.70831, lng: -122.373085}, {lat:  47.70831, lng: -122.373081}, {lat:  47.708309, lng: -122.373077}, {lat:  47.708308, lng: -122.373073}, {lat:  47.708308, lng: -122.373069}, {lat:  47.708307, lng: -122.373065}, {lat:  47.708306, lng: -122.373061}, {lat:  47.708306, lng: -122.373058}, {lat:  47.708305, lng: -122.373054}, {lat:  47.708304, lng: -122.37305}, {lat:  47.708304, lng: -122.373046}, {lat:  47.708203, lng: -122.37245}, {lat:  47.708202, lng: -122.372446}, {lat:  47.708201, lng: -122.372442}, {lat:  47.708201, lng: -122.372438}, {lat:  47.7082, lng: -122.372434}, {lat:  47.7082, lng: -122.37243}, {lat:  47.708199, lng: -122.372426}, {lat:  47.708198, lng: -122.372422}, {lat:  47.708198, lng: -122.372418}, {lat:  47.708197, lng: -122.372414}, {lat:  47.708196, lng: -122.37241}, {lat:  47.708196, lng: -122.372406}, {lat:  47.708195, lng: -122.372402}, {lat:  47.708195, lng: -122.372398}, {lat:  47.708194, lng: -122.372395}, {lat:  47.708193, lng: -122.372392}, {lat:  47.708193, lng: -122.372391}, {lat:  47.708193, lng: -122.372387}, {lat:  47.708192, lng: -122.372383}, {lat:  47.708191, lng: -122.372375}, {lat:  47.70819, lng: -122.372371}, {lat:  47.70819, lng: -122.372367}, {lat:  47.708189, lng: -122.372363}, {lat:  47.708189, lng: -122.372359}, {lat:  47.708188, lng: -122.372355}, {lat:  47.708188, lng: -122.372351}, {lat:  47.708187, lng: -122.372347}, {lat:  47.708187, lng: -122.372343}, {lat:  47.708187, lng: -122.372339}, {lat:  47.708186, lng: -122.372335}, {lat:  47.708186, lng: -122.372333}, {lat:  47.708186, lng: -122.372331}, {lat:  47.708185, lng: -122.372327}, {lat:  47.708185, lng: -122.372323}, {lat:  47.708184, lng: -122.372319}, {lat:  47.708184, lng: -122.372315}, {lat:  47.708183, lng: -122.372311}, {lat:  47.708183, lng: -122.372307}, {lat:  47.708182, lng: -122.372303}, {lat:  47.708182, lng: -122.372299}, {lat:  47.708182, lng: -122.372295}, {lat:  47.708181, lng: -122.372291}, {lat:  47.708181, lng: -122.372287}, {lat:  47.70818, lng: -122.372283}, {lat:  47.70818, lng: -122.372279}, {lat:  47.708179, lng: -122.372275}, {lat:  47.708179, lng: -122.372274}, {lat:  47.708179, lng: -122.372271}, {lat:  47.708179, lng: -122.372267}, {lat:  47.708178, lng: -122.372263}, {lat:  47.708178, lng: -122.372259}, {lat:  47.708178, lng: -122.372255}, {lat:  47.708177, lng: -122.372251}, {lat:  47.708177, lng: -122.372246}, {lat:  47.708177, lng: -122.372242}, {lat:  47.708176, lng: -122.372238}, {lat:  47.708176, lng: -122.372234}, {lat:  47.708176, lng: -122.37223}, {lat:  47.708175, lng: -122.372226}, {lat:  47.708175, lng: -122.372222}, {lat:  47.708175, lng: -122.372218}, {lat:  47.708174, lng: -122.372215}, {lat:  47.708174, lng: -122.372214}, {lat:  47.708174, lng: -122.37221}, {lat:  47.708174, lng: -122.372206}, {lat:  47.708174, lng: -122.372202}, {lat:  47.708173, lng: -122.372198}, {lat:  47.708173, lng: -122.372194}, {lat:  47.708173, lng: -122.37219}, {lat:  47.708173, lng: -122.372186}, {lat:  47.708172, lng: -122.372182}, {lat:  47.708172, lng: -122.372178}, {lat:  47.708172, lng: -122.372174}, {lat:  47.708172, lng: -122.37217}, {lat:  47.708171, lng: -122.372166}, {lat:  47.708171, lng: -122.372162}, {lat:  47.708171, lng: -122.372158}, {lat:  47.708171, lng: -122.372155}, {lat:  47.708171, lng: -122.372153}, {lat:  47.70817, lng: -122.372149}, {lat:  47.70817, lng: -122.372145}, {lat:  47.70817, lng: -122.372141}, {lat:  47.70817, lng: -122.372137}, {lat:  47.70817, lng: -122.372133}, {lat:  47.70817, lng: -122.372129}, {lat:  47.70817, lng: -122.372125}, {lat:  47.708169, lng: -122.372121}, {lat:  47.708169, lng: -122.372117}, {lat:  47.708169, lng: -122.372113}, {lat:  47.708169, lng: -122.372109}, {lat:  47.708169, lng: -122.372105}, {lat:  47.708169, lng: -122.3721}, {lat:  47.708168, lng: -122.372096}, {lat:  47.708168, lng: -122.372095}, {lat:  47.708168, lng: -122.372092}, {lat:  47.708168, lng: -122.372088}, {lat:  47.708168, lng: -122.372084}, {lat:  47.708168, lng: -122.37208}, {lat:  47.708168, lng: -122.372076}, {lat:  47.708168, lng: -122.372072}, {lat:  47.708168, lng: -122.372068}, {lat:  47.708168, lng: -122.372064}, {lat:  47.708168, lng: -122.37206}, {lat:  47.708168, lng: -122.372056}, {lat:  47.708168, lng: -122.372052}, {lat:  47.708168, lng: -122.372048}, {lat:  47.708168, lng: -122.372044}, {lat:  47.708168, lng: -122.37204}, {lat:  47.708168, lng: -122.372035}, {lat:  47.708168, lng: -122.372032}, {lat:  47.708168, lng: -122.372028}, {lat:  47.708168, lng: -122.372024}, {lat:  47.708168, lng: -122.372019}, {lat:  47.708168, lng: -122.372015}, {lat:  47.708168, lng: -122.372011}, {lat:  47.708168, lng: -122.372007}, {lat:  47.708168, lng: -122.372003}, {lat:  47.708168, lng: -122.371999}, {lat:  47.708168, lng: -122.371995}, {lat:  47.708168, lng: -122.371991}, {lat:  47.708168, lng: -122.371987}, {lat:  47.708168, lng: -122.371983}, {lat:  47.708168, lng: -122.371979}, {lat:  47.708168, lng: -122.371976}, {lat:  47.708168, lng: -122.371975}, {lat:  47.708168, lng: -122.371971}, {lat:  47.708168, lng: -122.371966}, {lat:  47.708169, lng: -122.371962}, {lat:  47.708169, lng: -122.371958}, {lat:  47.708169, lng: -122.371954}, {lat:  47.708169, lng: -122.37195}, {lat:  47.708169, lng: -122.371946}, {lat:  47.708169, lng: -122.371942}, {lat:  47.708169, lng: -122.371938}, {lat:  47.708169, lng: -122.371934}, {lat:  47.70817, lng: -122.37193}, {lat:  47.70817, lng: -122.371926}, {lat:  47.70817, lng: -122.371922}, {lat:  47.70817, lng: -122.371918}, {lat:  47.70817, lng: -122.371916}, {lat:  47.70817, lng: -122.371914}, {lat:  47.70817, lng: -122.37191}, {lat:  47.708171, lng: -122.371906}, {lat:  47.708171, lng: -122.371902}, {lat:  47.708171, lng: -122.371898}, {lat:  47.708171, lng: -122.371894}, {lat:  47.708172, lng: -122.37189}, {lat:  47.708172, lng: -122.371886}, {lat:  47.708172, lng: -122.371882}, {lat:  47.708172, lng: -122.371878}, {lat:  47.708172, lng: -122.371874}, {lat:  47.708173, lng: -122.37187}, {lat:  47.708173, lng: -122.371866}, {lat:  47.708173, lng: -122.371862}, {lat:  47.708173, lng: -122.371861}, {lat:  47.708173, lng: -122.371857}, {lat:  47.708174, lng: -122.371853}, {lat:  47.708174, lng: -122.371849}, {lat:  47.708174, lng: -122.371845}, {lat:  47.708175, lng: -122.371841}, {lat:  47.708175, lng: -122.371837}, {lat:  47.708175, lng: -122.371833}, {lat:  47.708176, lng: -122.371829}, {lat:  47.708176, lng: -122.371825}, {lat:  47.708176, lng: -122.371821}, {lat:  47.708177, lng: -122.371817}, {lat:  47.708177, lng: -122.371813}, {lat:  47.708177, lng: -122.371809}, {lat:  47.708178, lng: -122.371805}, {lat:  47.708178, lng: -122.371801}, {lat:  47.708178, lng: -122.371797}, {lat:  47.708179, lng: -122.371793}, {lat:  47.708179, lng: -122.371789}, {lat:  47.708179, lng: -122.371784}, {lat:  47.70818, lng: -122.37178}, {lat:  47.70818, lng: -122.371776}, {lat:  47.708181, lng: -122.371772}, {lat:  47.708181, lng: -122.371768}, {lat:  47.708182, lng: -122.371764}, {lat:  47.708182, lng: -122.37176}, {lat:  47.708182, lng: -122.371756}, {lat:  47.708183, lng: -122.371752}, {lat:  47.708183, lng: -122.371748}, {lat:  47.708184, lng: -122.371744}, {lat:  47.708184, lng: -122.37174}, {lat:  47.708184, lng: -122.371738}, {lat:  47.708184, lng: -122.371736}, {lat:  47.708185, lng: -122.371732}, {lat:  47.708186, lng: -122.371728}, {lat:  47.708186, lng: -122.371726}, {lat:  47.708186, lng: -122.371724}, {lat:  47.708187, lng: -122.37172}, {lat:  47.708187, lng: -122.371716}, {lat:  47.708188, lng: -122.371712}, {lat:  47.708188, lng: -122.371708}, {lat:  47.708189, lng: -122.371704}, {lat:  47.708189, lng: -122.371701}, {lat:  47.70819, lng: -122.371697}, {lat:  47.70819, lng: -122.371693}, {lat:  47.708191, lng: -122.371689}, {lat:  47.708191, lng: -122.371685}, {lat:  47.708192, lng: -122.371681}, {lat:  47.708192, lng: -122.371679}, {lat:  47.708192, lng: -122.371676}, {lat:  47.708193, lng: -122.371672}, {lat:  47.708193, lng: -122.371669}, {lat:  47.708194, lng: -122.371665}, {lat:  47.708195, lng: -122.371661}, {lat:  47.708195, lng: -122.371657}, {lat:  47.708196, lng: -122.371655}, {lat:  47.708196, lng: -122.371653}, {lat:  47.708196, lng: -122.371649}, {lat:  47.708197, lng: -122.371645}, {lat:  47.708198, lng: -122.371641}, {lat:  47.708198, lng: -122.371637}, {lat:  47.708199, lng: -122.371633}, {lat:  47.708199, lng: -122.371629}, {lat:  47.7082, lng: -122.371625}, {lat:  47.708201, lng: -122.371621}, {lat:  47.708201, lng: -122.371617}, {lat:  47.708202, lng: -122.371613}, {lat:  47.708203, lng: -122.371609}, {lat:  47.708203, lng: -122.371605}, {lat:  47.708204, lng: -122.371601}, {lat:  47.708205, lng: -122.371597}, {lat:  47.708205, lng: -122.371594}, {lat:  47.708206, lng: -122.37159}, {lat:  47.708207, lng: -122.371586}, {lat:  47.708208, lng: -122.371582}, {lat:  47.708208, lng: -122.371578}, {lat:  47.708209, lng: -122.371574}, {lat:  47.70821, lng: -122.37157}, {lat:  47.70821, lng: -122.371566}, {lat:  47.708211, lng: -122.371563}, {lat:  47.708211, lng: -122.371562}, {lat:  47.708212, lng: -122.371558}, {lat:  47.708212, lng: -122.371555}, {lat:  47.708213, lng: -122.371551}, {lat:  47.708214, lng: -122.371547}, {lat:  47.708215, lng: -122.371543}, {lat:  47.708215, lng: -122.371539}, {lat:  47.708216, lng: -122.371535}, {lat:  47.708217, lng: -122.371531}, {lat:  47.708219, lng: -122.371519}, {lat:  47.70822, lng: -122.371515}, {lat:  47.708221, lng: -122.371512}, {lat:  47.708222, lng: -122.371508}, {lat:  47.708222, lng: -122.371506}, {lat:  47.708223, lng: -122.371504}, {lat:  47.708224, lng: -122.3715}, {lat:  47.708224, lng: -122.371496}, {lat:  47.708225, lng: -122.371492}, {lat:  47.708226, lng: -122.371489}, {lat:  47.708227, lng: -122.371485}, {lat:  47.708228, lng: -122.371481}, {lat:  47.708229, lng: -122.371477}, {lat:  47.70823, lng: -122.371473}, {lat:  47.708231, lng: -122.371469}, {lat:  47.708232, lng: -122.371465}, {lat:  47.708232, lng: -122.371462}, {lat:  47.708233, lng: -122.371458}, {lat:  47.708234, lng: -122.371454}, {lat:  47.708235, lng: -122.371449}, {lat:  47.708239, lng: -122.371434}, {lat:  47.708242, lng: -122.371434}, {lat:  47.708242, lng: -122.371433}, {lat:  47.708317, lng: -122.371089}, {lat:  47.708315, lng: -122.371027}, {lat:  47.708301, lng: -122.370998}, {lat:  47.708379, lng: -122.370833}, {lat:  47.708489, lng: -122.370798}, {lat:  47.708786, lng: -122.36955}, {lat:  47.708919, lng: -122.368997}, {lat:  47.708919, lng: -122.37104}, {lat:  47.70911, lng: -122.380097}]
    ],
    { strokeColor: '#FFFF00'}
  );

  var dist7 = handler.addPolygons(
    [
      [{lat:  47.66547, lng: -122.399937}, {lat:  47.665847, lng: -122.400937}, {lat:  47.665999, lng: -122.401785}, {lat:  47.666144, lng: -122.402594}, {lat:  47.666247, lng: -122.403573}, {lat:  47.666517, lng: -122.406145}, {lat:  47.666518, lng: -122.406163}, {lat:  47.666521, lng: -122.406213}, {lat:  47.666528, lng: -122.406366}, {lat:  47.666538, lng: -122.406569}, {lat:  47.666542, lng: -122.406652}, {lat:  47.666549, lng: -122.406662}, {lat:  47.66662, lng: -122.40677}, {lat:  47.666682, lng: -122.406863}, {lat:  47.666715, lng: -122.406992}, {lat:  47.667287, lng: -122.40804}, {lat:  47.667462, lng: -122.40804}, {lat:  47.667503, lng: -122.4081}, {lat:  47.667544, lng: -122.408162}, {lat:  47.667559, lng: -122.408169}, {lat:  47.667617, lng: -122.40819}, {lat:  47.667798, lng: -122.40811}, {lat:  47.667806, lng: -122.408107}, {lat:  47.667815, lng: -122.408103}, {lat:  47.667842, lng: -122.408091}, {lat:  47.667961, lng: -122.408039}, {lat:  47.66807, lng: -122.408038}, {lat:  47.668591, lng: -122.407767}, {lat:  47.669508, lng: -122.407768}, {lat:  47.669509, lng: -122.407769}, {lat:  47.670439, lng: -122.408445}, {lat:  47.671044, lng: -122.408445}, {lat:  47.6711, lng: -122.408469}, {lat:  47.671105, lng: -122.408474}, {lat:  47.671169, lng: -122.408502}, {lat:  47.671331, lng: -122.408646}, {lat:  47.671665, lng: -122.408963}, {lat:  47.67168, lng: -122.410033}, {lat:  47.671696, lng: -122.411455}, {lat:  47.671499, lng: -122.412875}, {lat:  47.670949, lng: -122.414974}, {lat:  47.670303, lng: -122.41699}, {lat:  47.670126, lng: -122.417545}, {lat:  47.668254, lng: -122.421168}, {lat:  47.667173, lng: -122.422723}, {lat:  47.665581, lng: -122.424449}, {lat:  47.664416, lng: -122.425466}, {lat:  47.663728, lng: -122.428135}, {lat:  47.663336, lng: -122.430742}, {lat:  47.662838, lng: -122.432098}, {lat:  47.662265, lng: -122.436191}, {lat:  47.662061, lng: -122.436833}, {lat:  47.661694, lng: -122.437206}, {lat:  47.66151, lng: -122.436394}, {lat:  47.661096, lng: -122.434534}, {lat:  47.660779, lng: -122.434193}, {lat:  47.66057, lng: -122.433621}, {lat:  47.660281, lng: -122.433449}, {lat:  47.659728, lng: -122.432705}, {lat:  47.659362, lng: -122.431556}, {lat:  47.659317, lng: -122.430176}, {lat:  47.657759, lng: -122.427532}, {lat:  47.656799, lng: -122.426382}, {lat:  47.656663, lng: -122.426009}, {lat:  47.656273, lng: -122.425433}, {lat:  47.655956, lng: -122.425129}, {lat:  47.653945, lng: -122.422424}, {lat:  47.652615, lng: -122.420936}, {lat:  47.651378, lng: -122.419923}, {lat:  47.651251, lng: -122.419819}, {lat:  47.650726, lng: -122.419246}, {lat:  47.650383, lng: -122.41901}, {lat:  47.649806, lng: -122.418805}, {lat:  47.648758, lng: -122.418061}, {lat:  47.648028, lng: -122.417793}, {lat:  47.64686, lng: -122.417996}, {lat:  47.645582, lng: -122.418065}, {lat:  47.644964, lng: -122.418315}, {lat:  47.644918, lng: -122.418333}, {lat:  47.644098, lng: -122.418233}, {lat:  47.642908, lng: -122.417693}, {lat:  47.641327, lng: -122.416511}, {lat:  47.640577, lng: -122.415765}, {lat:  47.639961, lng: -122.414921}, {lat:  47.638525, lng: -122.41262}, {lat:  47.635887, lng: -122.408396}, {lat:  47.63516, lng: -122.406942}, {lat:  47.634032, lng: -122.404544}, {lat:  47.633345, lng: -122.402313}, {lat:  47.632507, lng: -122.400287}, {lat:  47.63226, lng: -122.399472}, {lat:  47.63182, lng: -122.39802}, {lat:  47.631109, lng: -122.394572}, {lat:  47.630806, lng: -122.391732}, {lat:  47.630811, lng: -122.390853}, {lat:  47.631014, lng: -122.390277}, {lat:  47.631266, lng: -122.388485}, {lat:  47.631346, lng: -122.387746}, {lat:  47.631431, lng: -122.386968}, {lat:  47.631583, lng: -122.385577}, {lat:  47.632976, lng: -122.385305}, {lat:  47.632999, lng: -122.384936}, {lat:  47.633044, lng: -122.38419}, {lat:  47.626536, lng: -122.384061}, {lat:  47.626464, lng: -122.38237}, {lat:  47.632907, lng: -122.382366}, {lat:  47.633161, lng: -122.381214}, {lat:  47.626458, lng: -122.381186}, {lat:  47.626397, lng: -122.379868}, {lat:  47.633181, lng: -122.379795}, {lat:  47.632725, lng: -122.378746}, {lat:  47.632543, lng: -122.378308}, {lat:  47.631446, lng: -122.378173}, {lat:  47.629573, lng: -122.378177}, {lat:  47.628584, lng: -122.378041}, {lat:  47.626944, lng: -122.378007}, {lat:  47.626895, lng: -122.378}, {lat:  47.626846, lng: -122.377988}, {lat:  47.626799, lng: -122.377969}, {lat:  47.626755, lng: -122.377945}, {lat:  47.626715, lng: -122.377915}, {lat:  47.626678, lng: -122.377881}, {lat:  47.626646, lng: -122.377842}, {lat:  47.626619, lng: -122.3778}, {lat:  47.626597, lng: -122.377754}, {lat:  47.626582, lng: -122.377707}, {lat:  47.626572, lng: -122.377657}, {lat:  47.626568, lng: -122.377607}, {lat:  47.626623, lng: -122.376589}, {lat:  47.626548, lng: -122.376258}, {lat:  47.626532, lng: -122.376028}, {lat:  47.626346, lng: -122.375347}, {lat:  47.626272, lng: -122.374587}, {lat:  47.626262, lng: -122.374347}, {lat:  47.626185, lng: -122.373865}, {lat:  47.625096, lng: -122.371247}, {lat:  47.624848, lng: -122.370603}, {lat:  47.624675, lng: -122.369974}, {lat:  47.624511, lng: -122.369511}, {lat:  47.62387, lng: -122.368621}, {lat:  47.623414, lng: -122.368059}, {lat:  47.623073, lng: -122.367639}, {lat:  47.62217, lng: -122.366472}, {lat:  47.620925, lng: -122.364863}, {lat:  47.620577, lng: -122.363883}, {lat:  47.620105, lng: -122.36307}, {lat:  47.619508, lng: -122.362464}, {lat:  47.618864, lng: -122.361585}, {lat:  47.618662, lng: -122.360875}, {lat:  47.618575, lng: -122.360816}, {lat:  47.618003, lng: -122.360435}, {lat:  47.616923, lng: -122.358845}, {lat:  47.61665, lng: -122.358168}, {lat:  47.615715, lng: -122.356851}, {lat:  47.61509, lng: -122.355619}, {lat:  47.614967, lng: -122.355486}, {lat:  47.614997, lng: -122.357399}, {lat:  47.614925, lng: -122.357386}, {lat:  47.614549, lng: -122.356678}, {lat:  47.614572, lng: -122.354551}, {lat:  47.614446, lng: -122.354338}, {lat:  47.614275, lng: -122.354017}, {lat:  47.614287, lng: -122.354749}, {lat:  47.614117, lng: -122.354728}, {lat:  47.614119, lng: -122.355751}, {lat:  47.613904, lng: -122.355757}, {lat:  47.613873, lng: -122.355647}, {lat:  47.613539, lng: -122.35504}, {lat:  47.613559, lng: -122.353721}, {lat:  47.613566, lng: -122.352832}, {lat:  47.61344, lng: -122.352621}, {lat:  47.613064, lng: -122.351992}, {lat:  47.613047, lng: -122.352747}, {lat:  47.612815, lng: -122.352382}, {lat:  47.61275, lng: -122.353168}, {lat:  47.612594, lng: -122.35318}, {lat:  47.612582, lng: -122.353158}, {lat:  47.612249, lng: -122.352505}, {lat:  47.612249, lng: -122.352481}, {lat:  47.612249, lng: -122.352504}, {lat:  47.612248, lng: -122.352503}, {lat:  47.612269, lng: -122.350457}, {lat:  47.612016, lng: -122.350022}, {lat:  47.61197, lng: -122.351597}, {lat:  47.61072, lng: -122.349479}, {lat:  47.610218, lng: -122.348627}, {lat:  47.610546, lng: -122.348409}, {lat:  47.610632, lng: -122.34809}, {lat:  47.610401, lng: -122.347403}, {lat:  47.609887, lng: -122.346435}, {lat:  47.609775, lng: -122.346224}, {lat:  47.609316, lng: -122.345353}, {lat:  47.608933, lng: -122.344796}, {lat:  47.608958, lng: -122.346362}, {lat:  47.608645, lng: -122.345872}, {lat:  47.608645, lng: -122.345673}, {lat:  47.608427, lng: -122.345395}, {lat:  47.608389, lng: -122.343818}, {lat:  47.608177, lng: -122.343446}, {lat:  47.608015, lng: -122.343669}, {lat:  47.607746, lng: -122.343673}, {lat:  47.607592, lng: -122.343675}, {lat:  47.607579, lng: -122.34426}, {lat:  47.607277, lng: -122.343781}, {lat:  47.607291, lng: -122.343075}, {lat:  47.607061, lng: -122.342887}, {lat:  47.60711, lng: -122.342431}, {lat:  47.606881, lng: -122.342019}, {lat:  47.606895, lng: -122.341709}, {lat:  47.606838, lng: -122.341605}, {lat:  47.606781, lng: -122.341503}, {lat:  47.606555, lng: -122.341518}, {lat:  47.606319, lng: -122.341995}, {lat:  47.606315, lng: -122.342837}, {lat:  47.605933, lng: -122.342508}, {lat:  47.605857, lng: -122.340546}, {lat:  47.605676, lng: -122.340378}, {lat:  47.605645, lng: -122.342116}, {lat:  47.605241, lng: -122.34184}, {lat:  47.605258, lng: -122.340619}, {lat:  47.604626, lng: -122.340274}, {lat:  47.604635, lng: -122.339461}, {lat:  47.60443, lng: -122.339271}, {lat:  47.604416, lng: -122.340452}, {lat:  47.603906, lng: -122.340029}, {lat:  47.603891, lng: -122.338994}, {lat:  47.603578, lng: -122.338978}, {lat:  47.603559, lng: -122.339259}, {lat:  47.602254, lng: -122.339242}, {lat:  47.602232, lng: -122.339769}, {lat:  47.602144, lng: -122.339752}, {lat:  47.60203, lng: -122.33973}, {lat:  47.602012, lng: -122.339216}, {lat:  47.601775, lng: -122.33922}, {lat:  47.601798, lng: -122.337898}, {lat:  47.601597, lng: -122.337935}, {lat:  47.601557, lng: -122.336604}, {lat:  47.601203, lng: -122.336326}, {lat:  47.600805, lng: -122.336155}, {lat:  47.600782, lng: -122.336983}, {lat:  47.600506, lng: -122.336967}, {lat:  47.600384, lng: -122.339706}, {lat:  47.599746, lng: -122.339601}, {lat:  47.599724, lng: -122.337391}, {lat:  47.599226, lng: -122.337439}, {lat:  47.59921, lng: -122.337441}, {lat:  47.59921, lng: -122.337395}, {lat:  47.599209, lng: -122.336798}, {lat:  47.599208, lng: -122.336107}, {lat:  47.599208, lng: -122.336092}, {lat:  47.599208, lng: -122.335909}, {lat:  47.599208, lng: -122.335869}, {lat:  47.599207, lng: -122.335727}, {lat:  47.599207, lng: -122.335669}, {lat:  47.599207, lng: -122.335582}, {lat:  47.599207, lng: -122.33544}, {lat:  47.599207, lng: -122.335362}, {lat:  47.599205, lng: -122.334188}, {lat:  47.599203, lng: -122.333287}, {lat:  47.599203, lng: -122.332882}, {lat:  47.599201, lng: -122.331578}, {lat:  47.599201, lng: -122.331557}, {lat:  47.599199, lng: -122.330276}, {lat:  47.599198, lng: -122.329679}, {lat:  47.599197, lng: -122.329035}, {lat:  47.599197, lng: -122.328989}, {lat:  47.600034, lng: -122.328977}, {lat:  47.600708, lng: -122.328984}, {lat:  47.60085, lng: -122.328985}, {lat:  47.600873, lng: -122.328986}, {lat:  47.601351, lng: -122.328984}, {lat:  47.601714, lng: -122.329022}, {lat:  47.601714, lng: -122.328966}, {lat:  47.601714, lng: -122.32896}, {lat:  47.601714, lng: -122.328909}, {lat:  47.601713, lng: -122.328373}, {lat:  47.601713, lng: -122.327988}, {lat:  47.601712, lng: -122.327658}, {lat:  47.601715, lng: -122.327658}, {lat:  47.60177, lng: -122.327658}, {lat:  47.601904, lng: -122.32767}, {lat:  47.602026, lng: -122.327697}, {lat:  47.602091, lng: -122.327732}, {lat:  47.602271, lng: -122.327885}, {lat:  47.602983, lng: -122.328536}, {lat:  47.603696, lng: -122.329189}, {lat:  47.603697, lng: -122.329189}, {lat:  47.604411, lng: -122.329843}, {lat:  47.604797, lng: -122.330198}, {lat:  47.604961, lng: -122.330346}, {lat:  47.605124, lng: -122.330495}, {lat:  47.605837, lng: -122.331148}, {lat:  47.6063, lng: -122.330041}, {lat:  47.607015, lng: -122.330691}, {lat:  47.607063, lng: -122.330576}, {lat:  47.607131, lng: -122.330414}, {lat:  47.607198, lng: -122.330253}, {lat:  47.607209, lng: -122.330228}, {lat:  47.607106, lng: -122.33014}, {lat:  47.606483, lng: -122.329607}, {lat:  47.606672, lng: -122.329154}, {lat:  47.606713, lng: -122.329057}, {lat:  47.60674, lng: -122.328993}, {lat:  47.606766, lng: -122.328929}, {lat:  47.60716, lng: -122.327989}, {lat:  47.607231, lng: -122.327818}, {lat:  47.607694, lng: -122.32671}, {lat:  47.607695, lng: -122.326708}, {lat:  47.608051, lng: -122.327034}, {lat:  47.608409, lng: -122.327361}, {lat:  47.609122, lng: -122.328013}, {lat:  47.609836, lng: -122.328666}, {lat:  47.610465, lng: -122.329241}, {lat:  47.610494, lng: -122.329255}, {lat:  47.610557, lng: -122.329246}, {lat:  47.610573, lng: -122.329232}, {lat:  47.610591, lng: -122.329215}, {lat:  47.611012, lng: -122.32821}, {lat:  47.611013, lng: -122.328207}, {lat:  47.611266, lng: -122.327602}, {lat:  47.611477, lng: -122.327099}, {lat:  47.611478, lng: -122.327096}, {lat:  47.611479, lng: -122.327097}, {lat:  47.611942, lng: -122.325989}, {lat:  47.611943, lng: -122.325987}, {lat:  47.612048, lng: -122.326083}, {lat:  47.612937, lng: -122.326896}, {lat:  47.612949, lng: -122.326907}, {lat:  47.612987, lng: -122.326942}, {lat:  47.613041, lng: -122.326991}, {lat:  47.613055, lng: -122.327003}, {lat:  47.61393, lng: -122.327805}, {lat:  47.614054, lng: -122.327918}, {lat:  47.614784, lng: -122.328586}, {lat:  47.614857, lng: -122.328653}, {lat:  47.614879, lng: -122.328673}, {lat:  47.614921, lng: -122.328712}, {lat:  47.614956, lng: -122.328744}, {lat:  47.615423, lng: -122.329171}, {lat:  47.615486, lng: -122.329229}, {lat:  47.615663, lng: -122.329391}, {lat:  47.615667, lng: -122.329394}, {lat:  47.61589, lng: -122.32931}, {lat:  47.61607, lng: -122.329248}, {lat:  47.616157, lng: -122.329217}, {lat:  47.616425, lng: -122.329131}, {lat:  47.616694, lng: -122.329052}, {lat:  47.616964, lng: -122.328979}, {lat:  47.617313, lng: -122.328896}, {lat:  47.617813, lng: -122.328798}, {lat:  47.618051, lng: -122.328759}, {lat:  47.618324, lng: -122.328722}, {lat:  47.618469, lng: -122.328706}, {lat:  47.618499, lng: -122.328702}, {lat:  47.618598, lng: -122.328691}, {lat:  47.618871, lng: -122.328668}, {lat:  47.619145, lng: -122.328652}, {lat:  47.61942, lng: -122.328643}, {lat:  47.619698, lng: -122.328641}, {lat:  47.619967, lng: -122.328642}, {lat:  47.620305, lng: -122.328644}, {lat:  47.620825, lng: -122.328647}, {lat:  47.621969, lng: -122.328654}, {lat:  47.623128, lng: -122.32866}, {lat:  47.62427, lng: -122.328666}, {lat:  47.625065, lng: -122.32867}, {lat:  47.625119, lng: -122.328671}, {lat:  47.625122, lng: -122.328671}, {lat:  47.625371, lng: -122.328672}, {lat:  47.625368, lng: -122.328677}, {lat:  47.625153, lng: -122.329035}, {lat:  47.625203, lng: -122.329153}, {lat:  47.625225, lng: -122.329227}, {lat:  47.625316, lng: -122.329536}, {lat:  47.62538, lng: -122.329788}, {lat:  47.625425, lng: -122.330021}, {lat:  47.625447, lng: -122.33019}, {lat:  47.62545, lng: -122.330453}, {lat:  47.625435, lng: -122.330656}, {lat:  47.625368, lng: -122.331132}, {lat:  47.625229, lng: -122.331903}, {lat:  47.625116, lng: -122.332332}, {lat:  47.624956, lng: -122.332943}, {lat:  47.624907, lng: -122.333129}, {lat:  47.624791, lng: -122.33349}, {lat:  47.624684, lng: -122.333948}, {lat:  47.624663, lng: -122.334063}, {lat:  47.624616, lng: -122.334185}, {lat:  47.624564, lng: -122.334287}, {lat:  47.625067, lng: -122.33429}, {lat:  47.625121, lng: -122.33429}, {lat:  47.625122, lng: -122.33429}, {lat:  47.625779, lng: -122.334293}, {lat:  47.625779, lng: -122.334321}, {lat:  47.62578, lng: -122.334451}, {lat:  47.625861, lng: -122.334539}, {lat:  47.625815, lng: -122.334656}, {lat:  47.625781, lng: -122.334768}, {lat:  47.625782, lng: -122.334989}, {lat:  47.625785, lng: -122.335817}, {lat:  47.62579, lng: -122.337122}, {lat:  47.625795, lng: -122.338426}, {lat:  47.625795, lng: -122.338546}, {lat:  47.625882, lng: -122.338487}, {lat:  47.626014, lng: -122.33843}, {lat:  47.626148, lng: -122.338305}, {lat:  47.626184, lng: -122.338271}, {lat:  47.62619, lng: -122.338265}, {lat:  47.626205, lng: -122.338252}, {lat:  47.626255, lng: -122.338329}, {lat:  47.626558, lng: -122.338789}, {lat:  47.627919, lng: -122.339356}, {lat:  47.628378, lng: -122.339752}, {lat:  47.628635, lng: -122.339733}, {lat:  47.628687, lng: -122.339481}, {lat:  47.628946, lng: -122.339349}, {lat:  47.629278, lng: -122.339361}, {lat:  47.629569, lng: -122.33961}, {lat:  47.629729, lng: -122.339756}, {lat:  47.630212, lng: -122.340476}, {lat:  47.630496, lng: -122.340528}, {lat:  47.630965, lng: -122.340573}, {lat:  47.632252, lng: -122.340517}, {lat:  47.633168, lng: -122.34016}, {lat:  47.63333, lng: -122.340169}, {lat:  47.633644, lng: -122.340006}, {lat:  47.633986, lng: -122.340038}, {lat:  47.63476, lng: -122.340056}, {lat:  47.636991, lng: -122.34004}, {lat:  47.637135, lng: -122.339999}, {lat:  47.637523, lng: -122.340114}, {lat:  47.638025, lng: -122.340308}, {lat:  47.638091, lng: -122.340333}, {lat:  47.63893, lng: -122.340772}, {lat:  47.639066, lng: -122.340836}, {lat:  47.63917, lng: -122.340931}, {lat:  47.639433, lng: -122.341135}, {lat:  47.63957, lng: -122.341243}, {lat:  47.639744, lng: -122.341379}, {lat:  47.640203, lng: -122.341599}, {lat:  47.640496, lng: -122.341755}, {lat:  47.640807, lng: -122.341998}, {lat:  47.641363, lng: -122.342308}, {lat:  47.641666, lng: -122.342436}, {lat:  47.641929, lng: -122.342619}, {lat:  47.641974, lng: -122.342854}, {lat:  47.642238, lng: -122.34295}, {lat:  47.642411, lng: -122.343068}, {lat:  47.642667, lng: -122.343242}, {lat:  47.642917, lng: -122.343456}, {lat:  47.643074, lng: -122.343591}, {lat:  47.643521, lng: -122.34397}, {lat:  47.643909, lng: -122.344304}, {lat:  47.644113, lng: -122.344515}, {lat:  47.644447, lng: -122.345123}, {lat:  47.644904, lng: -122.3461}, {lat:  47.645344, lng: -122.347087}, {lat:  47.645432, lng: -122.347295}, {lat:  47.64559, lng: -122.347668}, {lat:  47.645742, lng: -122.348024}, {lat:  47.646015, lng: -122.348567}, {lat:  47.64628, lng: -122.349005}, {lat:  47.646566, lng: -122.349276}, {lat:  47.646845, lng: -122.349441}, {lat:  47.646879, lng: -122.349471}, {lat:  47.647062, lng: -122.349631}, {lat:  47.647069, lng: -122.349641}, {lat:  47.647119, lng: -122.349753}, {lat:  47.647178, lng: -122.349887}, {lat:  47.647191, lng: -122.349915}, {lat:  47.647236, lng: -122.350017}, {lat:  47.6473, lng: -122.350162}, {lat:  47.647344, lng: -122.350262}, {lat:  47.647373, lng: -122.350327}, {lat:  47.647427, lng: -122.350448}, {lat:  47.647481, lng: -122.35057}, {lat:  47.647535, lng: -122.350691}, {lat:  47.647589, lng: -122.350813}, {lat:  47.647643, lng: -122.350934}, {lat:  47.647676, lng: -122.35101}, {lat:  47.64781, lng: -122.351311}, {lat:  47.647858, lng: -122.351418}, {lat:  47.647876, lng: -122.351459}, {lat:  47.647922, lng: -122.351563}, {lat:  47.647976, lng: -122.351685}, {lat:  47.64803, lng: -122.351808}, {lat:  47.648085, lng: -122.35193}, {lat:  47.648139, lng: -122.352052}, {lat:  47.648184, lng: -122.352154}, {lat:  47.648191, lng: -122.352168}, {lat:  47.648228, lng: -122.352253}, {lat:  47.648248, lng: -122.352297}, {lat:  47.648302, lng: -122.352419}, {lat:  47.648356, lng: -122.352542}, {lat:  47.64841, lng: -122.352664}, {lat:  47.648465, lng: -122.352786}, {lat:  47.648519, lng: -122.352908}, {lat:  47.648562, lng: -122.353006}, {lat:  47.648653, lng: -122.35321}, {lat:  47.648744, lng: -122.353415}, {lat:  47.648789, lng: -122.353515}, {lat:  47.648805, lng: -122.353552}, {lat:  47.648842, lng: -122.353635}, {lat:  47.648894, lng: -122.353751}, {lat:  47.648947, lng: -122.35387}, {lat:  47.648957, lng: -122.353892}, {lat:  47.649005, lng: -122.353997}, {lat:  47.649059, lng: -122.354119}, {lat:  47.649065, lng: -122.354132}, {lat:  47.649092, lng: -122.354191}, {lat:  47.64911, lng: -122.354231}, {lat:  47.649166, lng: -122.354354}, {lat:  47.649226, lng: -122.354488}, {lat:  47.649264, lng: -122.354569}, {lat:  47.649287, lng: -122.354621}, {lat:  47.649343, lng: -122.354743}, {lat:  47.649398, lng: -122.354864}, {lat:  47.649418, lng: -122.354907}, {lat:  47.649449, lng: -122.354975}, {lat:  47.649472, lng: -122.355026}, {lat:  47.649693, lng: -122.355607}, {lat:  47.650038, lng: -122.356386}, {lat:  47.650555, lng: -122.357433}, {lat:  47.651042, lng: -122.35843}, {lat:  47.651322, lng: -122.359003}, {lat:  47.651894, lng: -122.360136}, {lat:  47.651973, lng: -122.360282}, {lat:  47.652024, lng: -122.360328}, {lat:  47.652066, lng: -122.360413}, {lat:  47.65208, lng: -122.36044}, {lat:  47.652095, lng: -122.36047}, {lat:  47.65212, lng: -122.360694}, {lat:  47.652397, lng: -122.361075}, {lat:  47.652417, lng: -122.36111}, {lat:  47.652454, lng: -122.361181}, {lat:  47.652525, lng: -122.361316}, {lat:  47.652544, lng: -122.361353}, {lat:  47.652558, lng: -122.361379}, {lat:  47.652582, lng: -122.361619}, {lat:  47.652272, lng: -122.361784}, {lat:  47.65237, lng: -122.362399}, {lat:  47.65244, lng: -122.362924}, {lat:  47.652598, lng: -122.362886}, {lat:  47.652644, lng: -122.363076}, {lat:  47.653009, lng: -122.362944}, {lat:  47.653064, lng: -122.363178}, {lat:  47.652846, lng: -122.363316}, {lat:  47.652923, lng: -122.363435}, {lat:  47.65286, lng: -122.363709}, {lat:  47.652748, lng: -122.363937}, {lat:  47.652792, lng: -122.364258}, {lat:  47.652739, lng: -122.364518}, {lat:  47.652686, lng: -122.364705}, {lat:  47.652794, lng: -122.364752}, {lat:  47.652849, lng: -122.364958}, {lat:  47.652928, lng: -122.364961}, {lat:  47.653009, lng: -122.365428}, {lat:  47.653105, lng: -122.365577}, {lat:  47.653239, lng: -122.365771}, {lat:  47.653398, lng: -122.36566}, {lat:  47.653475, lng: -122.365721}, {lat:  47.653571, lng: -122.365899}, {lat:  47.653799, lng: -122.365747}, {lat:  47.653922, lng: -122.366027}, {lat:  47.653503, lng: -122.366419}, {lat:  47.653657, lng: -122.366643}, {lat:  47.654104, lng: -122.366295}, {lat:  47.654371, lng: -122.366798}, {lat:  47.654219, lng: -122.367127}, {lat:  47.654534, lng: -122.367691}, {lat:  47.654839, lng: -122.36821}, {lat:  47.655125, lng: -122.368743}, {lat:  47.655391, lng: -122.369319}, {lat:  47.655674, lng: -122.368849}, {lat:  47.655602, lng: -122.369646}, {lat:  47.655807, lng: -122.369711}, {lat:  47.656055, lng: -122.369546}, {lat:  47.656447, lng: -122.368993}, {lat:  47.656712, lng: -122.369612}, {lat:  47.656801, lng: -122.369572}, {lat:  47.657278, lng: -122.370417}, {lat:  47.657649, lng: -122.371025}, {lat:  47.657682, lng: -122.371079}, {lat:  47.657682, lng: -122.371123}, {lat:  47.657677, lng: -122.371706}, {lat:  47.657671, lng: -122.372434}, {lat:  47.65756, lng: -122.372504}, {lat:  47.657568, lng: -122.372607}, {lat:  47.657745, lng: -122.37276}, {lat:  47.657792, lng: -122.37291}, {lat:  47.657755, lng: -122.373336}, {lat:  47.65776, lng: -122.373659}, {lat:  47.657092, lng: -122.373754}, {lat:  47.657124, lng: -122.375464}, {lat:  47.657649, lng: -122.375659}, {lat:  47.657696, lng: -122.375793}, {lat:  47.657722, lng: -122.376015}, {lat:  47.657774, lng: -122.37622}, {lat:  47.657779, lng: -122.376238}, {lat:  47.656007, lng: -122.376264}, {lat:  47.655993, lng: -122.376514}, {lat:  47.656008, lng: -122.376824}, {lat:  47.655964, lng: -122.377043}, {lat:  47.655891, lng: -122.377247}, {lat:  47.655827, lng: -122.378129}, {lat:  47.655853, lng: -122.380221}, {lat:  47.655889, lng: -122.382358}, {lat:  47.659024, lng: -122.382366}, {lat:  47.659471, lng: -122.382396}, {lat:  47.659495, lng: -122.382721}, {lat:  47.659781, lng: -122.383303}, {lat:  47.659975, lng: -122.383576}, {lat:  47.660224, lng: -122.383799}, {lat:  47.660648, lng: -122.383801}, {lat:  47.661009, lng: -122.384401}, {lat:  47.661272, lng: -122.384838}, {lat:  47.661406, lng: -122.384977}, {lat:  47.661544, lng: -122.385342}, {lat:  47.66155, lng: -122.385529}, {lat:  47.661678, lng: -122.385988}, {lat:  47.661885, lng: -122.386583}, {lat:  47.662186, lng: -122.387489}, {lat:  47.662449, lng: -122.387431}, {lat:  47.662668, lng: -122.38784}, {lat:  47.662894, lng: -122.388369}, {lat:  47.662819, lng: -122.388539}, {lat:  47.663129, lng: -122.389459}, {lat:  47.66329, lng: -122.389558}, {lat:  47.663403, lng: -122.389829}, {lat:  47.663318, lng: -122.390053}, {lat:  47.663353, lng: -122.390941}, {lat:  47.663356, lng: -122.39103}, {lat:  47.663397, lng: -122.391325}, {lat:  47.663439, lng: -122.392021}, {lat:  47.663219, lng: -122.392254}, {lat:  47.663222, lng: -122.392628}, {lat:  47.66339, lng: -122.392861}, {lat:  47.663393, lng: -122.393137}, {lat:  47.66331, lng: -122.393254}, {lat:  47.663301, lng: -122.393841}, {lat:  47.663298, lng: -122.394575}, {lat:  47.663326, lng: -122.395057}, {lat:  47.66334, lng: -122.395337}, {lat:  47.663639, lng: -122.395761}, {lat:  47.663805, lng: -122.396088}, {lat:  47.663928, lng: -122.396292}, {lat:  47.664107, lng: -122.396419}, {lat:  47.66436, lng: -122.396895}, {lat:  47.664544, lng: -122.397262}, {lat:  47.664602, lng: -122.397308}, {lat:  47.664628, lng: -122.397384}, {lat:  47.66471, lng: -122.397625}, {lat:  47.664717, lng: -122.397649}, {lat:  47.664707, lng: -122.397656}, {lat:  47.665117, lng: -122.39904}]
    ],
    { strokeColor: '#996633'}
  );
    markers = handler.addMarkers( gon.hash );
    handler.bounds.extendWith(markers);
    handler.fitMapToBounds();
    handler.getMap().setZoom(11);
  });
}
;

(function() {


}).call(this);
// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or vendor/assets/javascripts of plugins, if any, can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// compiled file.
//
// Read Sprockets README (https://github.com/sstephenson/sprockets#sprockets-directives) for details
// about supported directives.
//






;
