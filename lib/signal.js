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
    }

    // emit(...args)
    s.emit = function () {
        var args, cancelled;

        isEmitting = true;

        for (var k = 0, l = handlers.length; k < l && !cancelled; k += 1) {
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
    return b.priority - a.priority;
}

/**
 * If returned from a handler connected to a signal it will cancel the signal
 * and no other connected handlers will be invoked.
 */
signal.CANCEL = {};

module.exports = signal;