function signal(name) {
  var handlers = [], connections = [],
    isEmitting = false, isPendingDisconnectAll = false;

  name = String(name || '') || 'Unknown';

  var s = {};

  // connect(handler, priority)
  // connect(handler, thisObj)
  // connect(handler, thisObj, priority)
  s.connect = function (handler, thisObj, priority) {
    if (!isNaN(thisObj)) {
      priority = thisObj;
      thisObj = undefined;
    }

    if (isNaN(priority)) {
      priority = 1000;
    }

    var proxyHandler = function () {
      var args = [].slice.call(arguments);
      return handler.apply(thisObj, args);
    };
    proxyHandler.priority = priority;

    handlers.push(proxyHandler);
    handlers.sort(prioritize);

    var connection = {
      disconnect: function () {
        if (handler) {
          handler = null;
          var k = handlers.indexOf(proxyHandler);
          handlers.splice(k, 1);
          proxyHandler = null;
        }
      }
    };

    connections.push(connection);

    return connection;
  };

  s.once = function (handler, thisObj, priority) {
    var con = s.connect(function () {
      con.disconnect();
      return handler.apply(this, [].slice.call(arguments));
    }, thisObj, priority);
    return con;
  };

  // emit(...args)
  s.emit = function () {
    var args, cancelled;

    isEmitting = true;
    args = [].slice.call(arguments);

    for (var k = handlers.length - 1; k >= 0 && !cancelled; k -= 1) {
      cancelled = signal.CANCEL === handlers[k].apply(undefined, args);
    }

    isEmitting = false;

    if (isPendingDisconnectAll) {
      isPendingDisconnectAll = false;
      this.disconnectAll();
    }

    return !cancelled;
  };

  // emitAsync(args, complete)
  // emitAsync(args, complete, duration)
  s.emitAsync = function (args, complete, duration) {
    var self = this;
    function fn() {
      var success = self.emit.apply(self, args);
      if (typeof complete === 'function') {
          complete(success);
      }
    }

    if (duration >= 0) {
      setTimeout(fn, duration);
    } else {
      /*istanbul ignore next*/
      try {
        process.nextTick(fn);
      } catch (_) {
        setTimeout(fn, 0);
      }
    }
  };

  s.unlock = function () {
    return s;
  };

  s.lock = function (key) {
    if (!key) {
      throw new Error("[" + name + "] Cannot lock a signal with a falsy key.");
    }

    function F() { this.consructor = F; }
    F.prototype = this;
    var ss = new F();

    ss.emit = ss.emitAsync = function () {
      throw new Error("[" + name + "] Cannot emit a locked signal.");
    };
    ss.unlock = function (aKey) {
      if (aKey === key) {
          return s;
      }
      throw new Error("[" + name + "] Failed to unlock locked signal.");
    };
    ss.lock = function () {
      throw new Error("[" + name + "] Cannot lock a locked signal.");
    };

    return ss;
  };

  s.disconnectAll = function () {
    if (isEmitting || isPendingDisconnectAll) {
      isPendingDisconnectAll = true;
    } else {
      while (connections.length) {
        connections.pop().disconnect();
      }
    }

    return s;
  };

  return s;
}

function prioritize(a, b) {
  return a.priority - b.priority;
}

signal.CANCEL = {};

module.exports = signal;