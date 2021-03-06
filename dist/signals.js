(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.signals = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
exports.signal = require('./lib/signal');
},{"./lib/signal":2}],2:[function(require,module,exports){
/**
 * Creates a new signal.
 *
 * @param name The optional name of the signal displayed in error messages.
 */
function signal(name) {
    var handlers = [], connections = [],
        isEmitting = false, isPendingDisconnectAll = false;

    name = String(name || '') || 'Unknown';

    // s(handler, priority)
    // s(handler, thisObj)
    // s(handler, thisObj, priority)
    function s(handler, thisObj, priority) {
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
    }

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

    s.unlock = function () {
        return s;
    };

    s.lock = function (key) {
        if (!key) {
            throw new Error("[" + name + "] Cannot lock a signal with a falsy key.");
        }

        function ss() {
            return s.apply(void 0, [].slice.call(arguments));
        }

        ss.emit = function () {
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

/**
 * If returned from a handler connected to a signal it will cancel the signal
 * and no other connected handlers will be invoked.
 */
signal.CANCEL = {};

module.exports = signal;
},{}]},{},[1])(1)
});
//# sourceMappingURL=signals.js.map
