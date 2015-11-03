(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.signals = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
exports.signal = require('./lib/signal');
exports.slot = require('./lib/slot');
},{"./lib/signal":2,"./lib/slot":3}],2:[function(require,module,exports){
/**
 * Creates a new signal.
 *
 * @param name The optional name of the signal displayed in error messages.
 */
module.exports = function (name) {
    var signal, handlers = [];
    name = String(name || '') || 'Unknown';

    return signal = {
        emit: function () {
            var args = [].slice.call(arguments);
            handlers.forEach(function (handler) {
                handler.apply(undefined, args);
            });
        },
        
        connect: function (handler, thisObj) {
            var proxyHandler = function () {
                var args = [].slice.call(arguments);
                handler.apply(thisObj, args);
            };
            handlers.push(proxyHandler);
            return {
                disconnect: function () {
                    if (handler) {
                        handler = null;
                        var k = handlers.indexOf(proxyHandler);
                        handlers.splice(k, 1);
                        proxyHandler = null;
                    }
                }
            };
        },
        
        lock: function (key) {
            return {
                connect: signal.connect,
                emit: function () {
                    throw new Error("[" + name + "] Cannot emit a locked signal.");
                },
                lock: function (aKey) {
                    throw new Error("[" + name + "] Cannot lock a locked signal.");
                },
                unlock: function (aKey) {
                    if (aKey === key) {
                        return signal;
                    }
                    throw new Error("[" + name + "] Failed to unlock a locked signal.");
                }
            };
        },
        
        unlock: function (key) {
            return this;
        }
    };
};
},{}],3:[function(require,module,exports){
module.exports = function (handler) {
    var connections = [];
    
    var slot = function (signal) {
        var connection = signal.connect(handler);
        connections.push(connection);
        return connection;
    };
    
    slot.disconnectAll = function () {
        while (connections.length) {
            connections.pop().disconnect();
        }
    };
    
    return slot;
};
},{}]},{},[1])(1)
});
//# sourceMappingURL=signals.js.map
