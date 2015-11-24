declare module "@dschnare/signalsjs" {
	/**
	 * Create a new signal.
	 */
	export var signal: SignalFunction;

	export interface SignalFunction {
		/**
		 * Create a new signal.
		 */
		(): Signal;
		/**
		 * Create a new signal.
		 *
		 * @param name The name of the signal displayed in error messages.
		 */
		(name: string): Signal;
		/**
		 * If returned from a handler connected to a signal it will cancel the signal
		 * and no other connected handlers will be invoked.
		 */
		CANCEL: Object;
	}

	/**
	 * A signal that can emit and have connected handlers.
	 */
	export interface Signal {
		/**
		 * Connects a handler to the signal.
		 *
		 * @param handler The function to connect.
		 * @param priority The priority of the handler, higher priority handlers will be called before lower priority handlers.
		 * @param thisObj The context that the handler will be called with.
		 * @return A new connection object.
		 */
		connect(handler: (...args: Array<any>) => void): Connection;
		connect(handler: (...args: Array<any>) => void, priority: number): Connection;
		connect(handler: (...args: Array<any>) => void, thisObj: any): Connection;
		connect(handler: (...args: Array<any>) => void, thisObj: any, priority: number): Connection;
		/**
		 * Connects a handler to the signal, but will automatically disconnect the handler after its been called once.
		 *
		 * @param handler The function to connect.
		 * @param priority The priority of the handler, higher priority handlers will be called before lower priority handlers.
		 * @param thisObj The context that the handler will be called with.
		 * @return A new connection object.
		 */
		once(handler: (...args: Array<any>) => void): Connection;
		once(handler: (...args: Array<any>) => void, priority: number): Connection;
		once(handler: (...args: Array<any>) => void, thisObj: any): Connection;
		once(handler: (...args: Array<any>) => void, thisObj: any, priority: number): Connection;
		/**
		 * Attempts to emit the signal. This will throw if the signal is locked.
		 *
		 * @param args The arguments to pass to the connected handlers.
		 * @return True if signal emission was not canclled, false otherwise.
		 */
		emit(...args: Array<any>): boolean;
		/**
		 * Attempts to emit the signal asynchronously. This will throw if the signal is locked.
		 *
		 * @param args The arguments to pass to the connected handlers as an array.
		 * @param complete The function to call when the emission has completed.
		 * @param duration The duration to wait before calling emit. If not specified then waits until the thread is free.
		 */
		emitAsync(args: Array<any>, complete: (success: boolean) => void);
		emitAsync(args: Array<any>, complete: (success: boolean) => void, duration: number);
		/**
		 * Attempts to lock the signal using the specified key. This will throw if the signal is locked.
		 *
		 * @return A locked signal
		 */
		lock(key: any): Signal;
		/**
		 * Attempts to unlock the signal using the specified key.
		 * If the key does not match the key used to lock the signal then this will throw.
		 *
		 * @return An unlocked signal.
		 */
		unlock(key: any): Signal;
		/**
		 * Disconnects all connected handlers.
		 */
		disconnectAll(): void;
	}

	/**
	 * The connection between a signal and a handler.
	 */
	export interface Connection {
		/**
		 * Disconnects the connected handler that is managed by this connection.
		 */
		disconnect(): void;
	}
}