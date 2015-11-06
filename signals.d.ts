declare module "@dschnare/signals" {
	export var signal: SignalFunction;

	export interface SignalFunction {
		(): Signal;
		(name: string): Signal;
		CANCEL: Object;
	}

	export interface Signal {
		(handler: (...args: Array<any>) => void): Connection;
		(handler: (...args: Array<any>) => void, priority: number): Connection;
		(handler: (...args: Array<any>) => void, thisObj: any): Connection;
		(handler: (...args: Array<any>) => void, thisObj: any, priority: number): Connection;
		once(handler: (...args: Array<any>) => void): Connection;
		once(handler: (...args: Array<any>) => void, priority: number): Connection;
		once(handler: (...args: Array<any>) => void, thisObj: any): Connection;
		once(handler: (...args: Array<any>) => void, thisObj: any, priority: number): Connection;
		emit(...args: Array<any>): boolean;
		lock(key: any): Signal;
		unlock(key: any): Signal;
		disconnectAll(): void;
	}

	export interface Connection {
		disconnect(): void;
	}
}