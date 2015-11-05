var test = require('tape');
var signal = require('./signal');

test('signals should emit and call registered handlers', function (t) {
	var action = signal();
	var connection = action.connect(function (value) {
		t.equal(value, 10);
	});

	action.emit(10);
	connection.disconnect();
	action.emit(20);
	action.emit(30);
	t.end();
});

test('signals should not emit when locked', function (t) {
	var action = signal();
	action.connect(function (value) {
		t.equal(value, 10);
	});

	action.emit(10);
	action = action.lock({});
	t.throws(action.lock.bind(action));
	t.throws(action.emit.bind(action, 20));
	t.throws(action.emit.bind(action, 30));
	t.end();
});

test('signals should emit after being unlocked', function (t) {
	var action = signal();
	var key = {};
	action.connect(function (value) {
		t.equal(value, 10);
	});

	action.emit(10);
	action = action.lock(key);
	t.throws(action.emit.bind(action, 20));
	t.throws(action.unlock.bind(action, {}));
	action = action.unlock(key);
	t.doesNotThrow(action.unlock.bind(action, key));
	action.emit(10);
	t.end();
});