//Used to save function with matching classcontext
export class Binder<T>{
	func: T;
	context: unknown;
	constructor(func: T, context?: unknown) {
		this.func = func;
		this.context = context;
	}
}