/**
 * Creates a new signal.
 *
 * @param name The optional name of the signal displayed in error messages.
 */
function signal(name) {
    var handlers = [], connections = [],
        isEmitting = false, isPendingDisconnectAll = false;

    name = String(name || '') || 'Unknown';

    return {
        // emit(...args)
        emit: function () {
            var args, cancelled = false;

            isEmitting = true;
            cancelled = false;
            args = [].slice.call(arguments);

            for (var k = 0, l = handlers.length; k < l && !cancelled; k += 1) {
                cancelled = signal.CANCEL === handlers[k].apply(undefined, args);
            }

            isEmitting = false;

            if (isPendingDisconnectAll) {
                isPendingDisconnectAll = false;
                this.disconnectAll();
            }

            return !cancelled;
        },

        // connect(handler, priority)
        // connect(handler, thisObj)
        // connect(handler, thisObj, priority)
        connect: function (handler, thisObj, priority) {
            if (!isNaN(thisObj)) {
                priority = thisObj;
                thisObj = undefined;
            }

            if (isNaN(priority)) {
                priority = 1000;
            }

            var proxyHandler = function () {
                var args = [].slice.call(arguments);
                handler.apply(thisObj, args);
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
        },

        lock: function (key) {
            var unlockedSignal = this;

            if (!key) {
                throw new Error("[" + name + "] Cannot lock a signal with a falsy key.");
            }

            return {
                emit: function () {
                    throw new Error("[" + name + "] Cannot emit a locked signal.");
                },
                lock: function () {
                    throw new Error("[" + name + "] Cannot lock a locked signal.");
                },
                unlock: function (aKey) {
                    if (aKey === key) {
                        return unlockedSignal;
                    }

                    throw new Error("[" + name + "] Failed to unlock a locked signal.");

                },
                connect: unlockedSignal.connect,
                disconnectAll: unlockedSignal.disconnectAll
            };
        },

        unlock: function (aKey) {
            return this;
        },

        disconnectAll: function () {
          if (isEmitting || isPendingDisconnectAll) {
            isPendingDisconnectAll = true;
          } else {
            while (connections.length) {
              connections.pop().disconnect();
            }
          }
        }
    };
}

function prioritize(a, b) {
    return b.priority - a.priority;
}

/**
 * If returned from a handler connected to a signal it will cancel the signal
 * and no other connected handlers will be invoked.
 */
signal.CANCEL = {};

module.exports = signal;