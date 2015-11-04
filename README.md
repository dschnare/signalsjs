# Signalsjs

Signalsjs is a light weight signal library. Signals are a replacement for typical
event-based architectures, the benefit is that objects create signals as part of their
API so it's easier for signal consumers.

		// Let's use a UI widget or component as an example, one that can be dragged and dropped.

		var widget = {
			// Notify connected handlers that we are ready to be interacted with.
			// NOTE: The string we pass is the name of the signal. This name is only
			// used when a signal throws an error.
			ready: signals.signal('widget.ready'),

			// Notify connected handlers that we have been dropped.
			dropped: signals.signal('widget.dropped'),

			// Notify connected handlers that we are disposed.
			disposed: signals.signal('widget.disposed'),

			// Other properties ...

			doThings: function () {
				// no op
			}
		};


		// Somewhere in code we connect to the widget's signals we're interested in.

		widget.ready.connect(function () {
			// Do things with the widget after it's ready.
			widget.doThings();

			widget.dropped(function () {
				// Do something after the widget has been dropped.
			});

			widget.disposed(function () {
				widget.ready.disconnectAll();
				widget.dropped.disconnectAll();
				// Signals are smart enough to wait for the 'disposed' signal
				// to finish notifying all connected handlers before it disconnects them.
				widget.disposed.disconnectAll();
			});
		});


		// The widget emits a signal by calling a signal's emit() method.
		// Let's create an init() method for our widget that initializes our widget
		// and then emits some signals.

		widget.init = function (domEl) {
			domEl.addEventListener('drop', function () {
				widget.dropped.emit();
			}, false);

			// Maybe do some asynchronous initialization...

			widget.ready.emit();
		};



# Prioritized handlers and cancelling



# Locked signals



# Slots



# API

See the `signals.d.ts` file for the complete API documentation.



# Development Environment

