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