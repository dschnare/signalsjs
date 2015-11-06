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

    s.once = function (handler, thisObj, priority) {
        var con = s(function () {
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

signal.CANCEL = {};

module.exports = signal;