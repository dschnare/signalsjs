/**
 * Creates a new signal.
 *
 * @param name The optional name of the signal displayed in error messages.
 */
function signal(name) {
    var handlers = [], connections = [], key = null,
        isLocked = false, isEmitting = false, isPendingDisconnectAll = false;

    name = String(name || '') || 'Unknown';

    return {
        isLocked: function () {
            return isLocked;
        },

        // emit(...args)
        emit: function () {
            if (isLocked) {
                throw new Error("[" + name + "] Cannot emit a locked signal.");
            } else {
                isEmitting = true;
                var cancelled = false, args = [].slice.call(arguments);

                for (var k = 0, l = handlers.length; k < l && !cancelled; k += 1) {
                    cancelled = signal.CANCEL === handlers[k].apply(undefined, args);
                }

                isEmitting = false;

                if (isPendingDisconnectAll) {
                    isPendingDisconnectAll = false;
                    this.disconnectAll();
                }
            }
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

        lock: function (aKey) {
            if (isLocked) {
                return this;
            } if (aKey) {
                key = aKey;
                isLocked = true;
                return this;
            } else {
                throw new Error("[" + name + "] Cannot lock a signal with a falsy key.");
            }
        },

        unlock: function (aKey) {
            if (isLocked) {
                if (aKey === key) {
                    key = null;
                    isLocked = false;
                    return this;
                } else {
                    throw new Error("[" + name + "] Failed to unlock a locked signal.");
                }
            } else {
                return this;
            }
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