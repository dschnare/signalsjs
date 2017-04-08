var test = require('tape');
var signal = require('../lib/signal');

test('signals should emit and call registered handlers', function (t) {
  var s = signal();
  var connection = s.connect(function (value) {
    t.equal(value, 10);
  });

  s.emit(10);
  connection.disconnect();
  s.emit(20);
  s.emit(30);

  s.connect(function (value) {
    t.equal(value, 20);
  });
  s.connect(function (value) {
    t.equal(value, 20);
  });
  s.connect(function (value) {
    t.equal(value, 20);
  });
  s.emit(20);
  s.disconnectAll();
  s.emit(200);

  s.connect(function (value) {
    t.equal(value, 20);
    s.disconnectAll();
  });
  s.connect(function (value) {
    t.equal(value, 20);
  });
  s.connect(function (value) {
    t.equal(value, 20);
  });
  s.emit(20);
  s.emit(200);

  t.end();
});

test('signals should call all handlers even when disconnectAll() is called within an emission', function (t) {
  var s = signal();

  t.plan(3);

  s.connect(function (value) {
    t.equal(value, 20);
    s.disconnectAll();
  });
  s.connect(function (value) {
    t.equal(value, 20);
  });
  s.connect(function (value) {
    t.equal(value, 20);
  });
  s.emit(20);
});

test('signals should not emit when locked', function (t) {
  var s = signal();
  s.connect(function (value) {
    t.equal(value, 10);
  });

  s.emit(10);
  s.emitAsync([10], function (success) {
    t.ok(success);
    t.end();
  });
  t.doesNotThrow(s.unlock.bind(s));
  t.ok(s.unlock() === s);
  t.throws(s.lock.bind(s, ''));
  s = s.lock({});
  t.throws(s.lock.bind(s));
  t.throws(s.emitAsync.bind(s, 20));
  t.throws(s.emit.bind(s, 20));
  t.throws(s.emit.bind(s, 30));
});

test('signals should emit after being unlocked', function (t) {
  var s = signal();
  var key = {};
  s.connect(function (value) {
    t.equal(value, 10);
  });

  s.emit(10);
  s = s.lock(key);
  s.connect(function (value) {
    t.equal(value, 10);
  });
  t.throws(s.emit.bind(s, 20));
  t.throws(s.unlock.bind(s, {}));
  s = s.unlock(key);

  s.emitAsync([10], function (success) {
    t.ok(success);
    s.emit = function (v) {
      t.equal(v, 2);
      t.end();
    };
    s.emitAsync([2]);
  }, 0);

  t.doesNotThrow(s.unlock.bind(s, key));
  s.emit(10);
});

test('signals should not call lower priority handlers when cancelled', function (t) {
  var s = signal();
  var key = {};

  /* istanbul ignore next  */
  s.connect(function () {
    t.fail('This handler should not be called.');
  });
  s.lock(key).connect(function (value) {
    t.equal(value, 10);
  }, 1001);
  s.connect(function (value) {
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

  s.connect(function () {
    t.ok(this === ctx);
  }, ctx, 200);
  s.connect(function () {
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