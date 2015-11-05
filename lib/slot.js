module.exports = function (handler, thisObj, priority) {
    var connections = [];

    var slot = function (signal) {
        if (typeof signal === 'function' && signal.connect) {
            var connection = signal.connect(handler, thisObj, priority);
            connections.push(connection);
            return connection;
        } else {
            return handler.apply(thisObj, [].slice.call(arguments));
        }
    };

    slot.disconnectAll = function () {
        while (connections.length) {
            connections.pop().disconnect();
        }
    };

    return slot;
};