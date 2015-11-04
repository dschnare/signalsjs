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