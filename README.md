# Signalsjs

Signalsjs is a light weight signal library. Signals are a replacement for typical
event-based architectures. The benefit is that objects create signals as part of their API.

	// Let's use a UI widget or component as an example, one that can be dragged and dropped.

	var widget = {
		// Notify connected handlers that we are ready to be interacted with.
		// NOTE: The string we pass is the name of the signal. This name is only
		// used when a signal throws an error.
		initialized: signals.signal('widget.initialized'),

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

	widget.initialized(function () {
		// Do things with the widget after it's ready.
		widget.doThings();

		widget.dropped(function () {
			// Do something after the widget has been dropped.
		});

		widget.disposed(function () {
			// disconnectAll() will disconnect all connected handlers from a signal.
			widget.initialized.disconnectAll();
			widget.dropped.disconnectAll();

			// We're "in" a "disposed" signal emission so calling disconnectAll() should
			// be problem because it will remove all connect handlers without giving them
			// a chance to respond to the signal. However, signals are smart. If disconnectAll()
			// is called during a signal's emission then it will wait for the connected handlers
			// to be called before disconnecting them.
			widget.disposed.disconnectAll();
		});
	});


	// The widget emits a signal by calling a signal's emit() method.
	// Let's create an init() method for our widget that initializes our widget
	// and then emits some signals. When calling emit() you can pass any number of
	// arguments and they will be passed to the connected handlers.

	widget.init = function (domEl) {
		domEl.addEventListener('drop', function (event) {
			// Pass along the drop target perhaps.
			widget.dropped.emit(event.target);
		}, false);

		// Maybe do some asynchronous initialization...

		widget.initialized.emit();
	};



# Connections

Each time you connect to a signal a connection object is returned that has a `disconnect()` method.
When this method is called the connection will be disconnected from the signal and the handler will
no longer be called when the signal emits. This method can be called after the connection has been
disconnected without any side effects.

	var dropped_c = widget.dropped(myHandler);
	dropped_c.disconnect();

	// This won't call our handler.
	widget.dropped.emit();




# Prioritized handlers and cancelling

When connecting a handler to a signal you can specify a few options that affect how
it's called and its priority relative to other connected handlers.

Using our widget as an example, let's look at how we might connect to its signals using these options.

	// Pass a `this` object so that our handler will be called in this context.
	widget.initialized(myHandler, theThisObj);

	// Pass a priority so that our handler is placed before lower priority handlers.
	// The default priority is 1000 if not specified.
	widget.initialized(myHandler, 2000);

	// Provide both options in one go.
	widget.initialized(myHandler, theThisObj, 2000);

Prioritizing connected handlers comes in handy if you want to cancel a signal so that other
connected handlers are not called. To cancel a signal a connected handler must return
`signals.signal.CANCEL`.

	widget.dropped(function () {
		// Decide to cancel the signal.
		return signals.signal.CANCEL;
	}, 2000);

As an API author you can determine if a signal has been cancelled by checking the return value of `emit()`.

	if (widget.dropped.emit()) {
		// dropped signal was not cancelled
	} else {
		// dropped signal was cancelled
	}



# Locked signals

As an API author you may want to restrict you can emit your signals, that is make the signals `emit()` private
while keeping the rest of the signal API public. You can do this by locking the signal when calling `lock()`.

	var key = {};
	widget.init = function () {
		widget.dropped = signals.signal('widget.dropped').lock(key);
	};

This locks the `dropped` signal so that no one can emit the signal. If it's attempted the `emit()` will throw an error.

	// Somewhere in code outside of the widget...
	// This will throw an error.
	widget.dropped.emit();

The API author can must unlock the signal before calling `emit()`.

	// In widget code somewhere...
	widget.dropped.unlock(key).emit();

Because the key is used to lock and unlock your signals you'll want to keep it privately scoped to just widget code.
A convenient way of doing this is using a closure.

	function makeWidget(opts) {
		var key = {}, widget;

		widget = {
			dropped: signals.signal().lock(key)
		};

		// init
		opts.domEl.addEventListener('drop', function (event) {
			widget.dropped.unlock(key).emit();
		});

		return widget;
	}


# Advanced example

Now take a look at a video player component as an example. When hooking the controls for a video player
it's common to have to write code like this.

	// Somewhere in the code that integrates the controls with the video player component.
	controls.addEventListener('volumeChange', function (event) {
		videoPlayer.volume(event.newValue);
	});
	controls.addEventListener('muteChange', function (event) {
		videoPlayer.mute(event.newValue);
	});
	controls.addEventListener('playAction', function (event) {
		videoPlayer.mute(event.newValue);
	});

	// And just in case the video player has its volume and mute state changed outside of the controls
	// we have to keep our control's state in sync with the video player.
	videoPlayer.addEventListener('volumeChange', function (event) {
		controls.volume(event.newValue);
	});
	videoPlayer.addEventListener('muteChange', function (event) {
		controls.mute(event.newValue);
	});

Using signals this can be written much more concisely.

	videoPlayer.volumeChanged(controls.volume);
	videoPlayer.muteChanged(controls.mute);
	controls.volumeChanged(videoPlayer.volume);
	controls.muteChanged(videoPlayer.mute);
	controls.playAction(videoPlayer.play);

The beauty of this architecture is that other components can just as easily be hooked up in a similar fashion.
Now here's the signal code needed to pull this off.

	// Controls //

	// The signal that indicates some play control has been interacted with.
	controls.playAction = signals.signal('controls.playAction');

	// The signal that indicates that the volume state has changed.
	controls.volumeChanged = signals.signal('controls.volume');

	// The signal that indicates that the mute state has changed.
	controls.muteChanged = signals.signal('controls.mute');

	// Now our volume and mute getter/setter methods.
	controls.volume = function (volume) {
		if (arguments.length === 0) {
			return this._volume;
		}

		if (volume !== this._volume) {
			this._volume = volume;
			this.volumeChanged.emit(volume);
		}
	};

	controls.mute = function (mute) {
		if (arguments.length === 0) {
			return this._mute;
		}

		if (mute !== this._mute) {
			this._mute = mute;
			this.muteChanged.emit(mute);
		}
	};


	// Video Player //

	// The signal that indicates that the volume state has changed.
	videoPlayer.volumeChanged = signals.signal('videoPlayer.volumeChanged');

	// The signal that indicates that the mute state has changed.
	videoPlayer.muteChanged = signals.signal('videoPlayer.muteChanged');

	videoPlayer.volume = function (volume) {
		if (arguments.length === 0) {
			return this._volume;
		}

		if (mute !== this._mute) {
			this._volume = volume;
			this.volumeChanged.emit(volume);
		}
	};

	// Now our volume and mute getter/setter methods.
	videoPlayer.mute = function (mute) {
		if (arguments.length === 0) {
			return this._mute;
		}

		if (mute !== this._mute) {
			this._mute = mute;
			this.muteChanged.emit(mute);
		}
	};

	videoPlayer.play = function () {
		if (this._state !== 'PLAYING' {
			this._state = 'PLAYING';
			// this.doStuffToPlayTheVideo();
		}
	};



# API

See the `signals.d.ts` file for the complete API documentation.



# Development Environment

