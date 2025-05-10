/**
 * Polyfills for older browsers
 */

// Array.find polyfill
if (!Array.prototype.find) {
  Array.prototype.find = function(predicate) {
    if (this == null) {
      throw new TypeError('Array.prototype.find called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return value;
      }
    }
    return undefined;
  };
}

// Array.map polyfill
if (!Array.prototype.map) {
  Array.prototype.map = function(callback) {
    if (this == null) {
      throw new TypeError('Array.prototype.map called on null or undefined');
    }
    if (typeof callback !== 'function') {
      throw new TypeError(callback + ' is not a function');
    }
    
    var array = Object(this);
    var length = array.length >>> 0;
    var result = new Array(length);
    var thisArg = arguments[1];
    
    for (var i = 0; i < length; i++) {
      if (i in array) {
        result[i] = callback.call(thisArg, array[i], i, array);
      }
    }
    
    return result;
  };
}

// URLSearchParams polyfill (simplified)
if (typeof window !== 'undefined' && !window.URLSearchParams) {
  window.URLSearchParams = function(init) {
    this.params = {};
    
    if (init) {
      // Remove leading '?' if present
      var query = typeof init === 'string' ? init : '';
      if (query.charAt(0) === '?') {
        query = query.slice(1);
      }
      
      // Parse the query string
      var pairs = query.split('&');
      for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        var key = decodeURIComponent(pair[0] || '');
        var value = decodeURIComponent(pair[1] || '');
        
        if (key) {
          this.params[key] = value;
        }
      }
    }
  };
  
  window.URLSearchParams.prototype.get = function(name) {
    return name in this.params ? this.params[name] : null;
  };
  
  window.URLSearchParams.prototype.set = function(name, value) {
    this.params[name] = value;
  };
  
  window.URLSearchParams.prototype.append = function(name, value) {
    this.params[name] = value;
  };
  
  window.URLSearchParams.prototype.toString = function() {
    var pairs = [];
    for (var key in this.params) {
      if (this.params.hasOwnProperty(key)) {
        pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(this.params[key]));
      }
    }
    return pairs.join('&');
  };
}

console.log('Polyfills loaded successfully');
