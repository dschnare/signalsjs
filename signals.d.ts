declare module "signals" {
	export var signal: SignalFunction
	export function slot(handler: (...args: Array<any>) => void): Slot

	export interface SignalFunction {
		(): Signal
		(name: string): Signal
		CANCEL: Object
	}

	export interface Signal {
		isLocked(): boolean
		emit(...args: Array<any>)
		connect(handler: (...args: Array<any>) => void): Connection
		connect(handler: (...args: Array<any>) => void, priority: number): Connection
		connect(handler: (...args: Array<any>) => void, thisObj: any): Connection
		connect(handler: (...args: Array<any>) => void, thisObj: any, priority: number): Connection
		lock(key: any): Signal
		unlock(key: any): Signal
		disconnectAll()
	}

	export interface Connection {
		disconnect()
	}

	export interface Slot {
		(signal: Signal): Connection
		disconnectAll()
	}
}