var test = require('tape');
var signal = require('./signal');

test('signals should emit and call registered handlers', function (t) {
	var s = signal();
	var connection = s(function (value) {
		t.equal(value, 10);
	});

	s.emit(10);
	connection.disconnect();
	s.emit(20);
	s.emit(30);

	s(function (value) {
		t.equal(value, 20);
	});
	s(function (value) {
		t.equal(value, 20);
	});
	s(function (value) {
		t.equal(value, 20);
	});
	s.emit(20);
	s.disconnectAll();
	s.emit(200);

	s(function (value) {
		t.equal(value, 20);
		s.disconnectAll();
	});
	s(function (value) {
		t.equal(value, 20);
	});
	s(function (value) {
		t.equal(value, 20);
	});
	s.emit(20);
	s.emit(200);

	t.end();
});

test('signals should call all handlers even when disconnectAll() is called within an emission', function (t) {
	var s = signal();

	t.plan(3);

	s(function (value) {
		t.equal(value, 20);
		s.disconnectAll();
	});
	s(function (value) {
		t.equal(value, 20);
	});
	s(function (value) {
		t.equal(value, 20);
	});
	s.emit(20);
});

test('signals should not emit when locked', function (t) {
	var s = signal();
	s(function (value) {
		t.equal(value, 10);
	});

	s.emit(10);
	t.doesNotThrow(s.unlock());
	t.ok(s.unlock() === s);
	t.throws(s.lock.bind(s, ''));
	s = s.lock({});
	t.throws(s.lock.bind(s));
	t.throws(s.emit.bind(s, 20));
	t.throws(s.emit.bind(s, 30));
	t.end();
});

test('signals should emit after being unlocked', function (t) {
	var s = signal();
	var key = {};
	s(function (value) {
		t.equal(value, 10);
	});

	s.emit(10);
	s = s.lock(key);
	s(function (value) {
		t.equal(value, 10);
	});
	t.throws(s.emit.bind(s, 20));
	t.throws(s.unlock.bind(s, {}));
	s = s.unlock(key);
	t.doesNotThrow(s.unlock.bind(s, key));
	s.emit(10);
	t.end();
});

test('signals should not call lower priority handlers when cancelled', function (t) {
	var s = signal();
	var key = {};

	/* istanbul ignore next  */
	s(function () {
		t.fail('This handler should not be called.');
	});
	s.lock(key)(function (value) {
		t.equal(value, 10);
	}, 1001);
	s(function (value) {
		t.equal(value, 10);
		return signal.CANCEL;
	});

	s.emit(10);
	s.emit(10);
	t.end();
});

test('signals should call handlers with the specified thisObj', function (t) {
	var s = signal();
	var ctx = {};

	s(function () {
		t.ok(this === ctx);
	}, ctx, 200);
	s(function () {
		t.ok(this === ctx);
	}, ctx);

	s.emit();
	t.end();
});

test('signals should call handlers once if they use the once() API', function (t) {
	var s = signal();

	t.plan(1);

	s.once(function (value) {
		t.equal(value, 20);
	});

	s.emit(20);
	s.emit(40);
});