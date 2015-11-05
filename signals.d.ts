declare module "signals" {
	export var signal: SignalFunction
	export function slot(handler: (...args: Array<any>) => void): Slot

	export interface SignalFunction {
		(): Signal
		(name: string): Signal
		CANCEL: Object
	}

	export interface Signal {
		emit(...args: Array<any>): boolean
		connect(handler: (...args: Array<any>) => void): Connection
		connect(handler: (...args: Array<any>) => void, priority: number): Connection
		connect(handler: (...args: Array<any>) => void, thisObj: any): Connection
		connect(handler: (...args: Array<any>) => void, thisObj: any, priority: number): Connection
		lock(key: any): Signal
		unlock(key: any): Signal
		disconnectAll(): void
	}

	export interface Connection {
		disconnect(): void
	}

	export interface Slot {
		(signal: Signal): Connection
		(...args: Array<any>): any
		disconnectAll(): void
	}
}