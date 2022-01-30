// eslint-disable-next-line @typescript-eslint/ban-types
import { CancelableSleep } from './CancelableSleep';
import { Binder } from './Binder';
// eslint-disable-next-line @typescript-eslint/ban-types
export default class Delegate<T extends Function>{
	funcs: Binder<T>[] = [];
	timeout: number;
	constructor(timeout = Math.pow(2, 31) - 1, func?: T, classcontext: unknown = null) {
		if (func)
			this.funcs.push(new Binder(func, classcontext));
		this.timeout = timeout;
	}

	/**
	 * Bind a new Function with context
	 * @param func The function to bind
	 * @param classcontext its matching context (classinstance or null if global)
	 * @returns success (false if already bound)
	 */
	bind(func: T, classcontext: unknown = null): boolean {
		const binder = this.funcs.find(c => c.context == classcontext) //check if there is a binder to this context
		if (binder && binder.func == func) //if there is also a matching function, it is already bound
			return false;

		this.funcs.push(new Binder(func, classcontext));//else save the new binder
		return true;
	}

	/**
	 * Removes the function from the delegate
	 * @param func the function to remove
	 * @param classcontext its matching context (classinstance or null if global)
	 * @returns sucess (false if it wasn't bound)
	 */
	unbind(func: T, classcontext: unknown = null): boolean {
		const binder = this.funcs.find(c => c.context == classcontext) //check if there is a binder to this context
		if (!binder || binder.func != func) //if there is no binder or its function isn't matching, it wasn't bound
			return false;

		this.funcs.splice(this.funcs.indexOf(new Binder(func, classcontext))); //else remove the binder
		return true;
	}

	private static NO_RESULT = "NO_RESULT";

	/**
	 * Invokes all bound functions in series
	 * @param timeout number of ms until the processing is stopped (null to use the preconfigured timeout)
	 * @param params parameters to invoke the functions with
	 * @returns all results that finished before timeout and a count, how many were cut off
	 */
	async invoke(timeout: number, ...params: unknown[]): Promise<[unknown[], number]> {
		const results: unknown[] = [];
		const sleepPromise = new CancelableSleep(timeout ?? this.timeout);//Initialize class (not the promise!)
		let cancel = false; //Prepare Canceltoken

		// eslint-disable-next-line no-async-promise-executor
		const prm = new Promise(async (resolve) => { //"Working Promise", Promise is used to split execution from timeout
			for (const func of this.funcs) {
				if (cancel) //If canceltoken is set, abort
					break;
				results.push(await func.func.apply(func.context, params)); //execute function and save results
			}
			sleepPromise.cancel(); //if finished, cancel timeout promise to prevent sleeps from keeping the process running
			if (!cancel)
				resolve(results); //return the results, if not already done by timeout
		})

		await Promise.race([ //Run "working promise" vs timeout
			prm, // "working promise"
			// eslint-disable-next-line no-async-promise-executor
			new Promise<void>(async (resolve) => {
				await sleepPromise.sleep(); //start timeout promise
				cancel = true; //if timeout is finished, set canceltoken for "working promise"
				resolve();//end the "race";
			})
		]);

		let filtered = results.filter((element) => { //filter all functions that timed out
			return element !== Delegate.NO_RESULT;
		})

		const unfinished = this.funcs.length - filtered.length; //calculate timeouts

		filtered =filtered.filter((element) => { //filter all functions that gave no result
			return element !== undefined;
		});

		return [results, unfinished];
	}

	/**
	 * Invokes all bound functions in parallel
	 * @param timeout number of ms until the processing is stopped (null to use the preconfigured timeout)
	 * @param params parameters to invoke the functions with
	 * @returns all results that finished before timeout and a count, how many were cut off
	 */
	async invokeAsync(timeout: number, ...params: unknown[]): Promise<[unknown[], number]> {
		const jobQueue = [];
		const sleepPromise = new CancelableSleep(timeout ?? this.timeout); //Initialize class (not the promise!)
		for (const func of this.funcs) {
			jobQueue.push(Promise.race([func.func.apply(func.context, params), sleepPromise.sleep()])); //Prepare function and timeout promise
		}


		return (await Promise.all(jobQueue)//Execute all functions
			.then((res) => {
				sleepPromise.cancel(); //if finished, cancel timeout promise to free memory

				let filtered = res.filter((element) => { //filter all functions that timed out
					return element !== Delegate.NO_RESULT;
				})

				const unfinished = this.funcs.length - filtered.length; //calculate timeouts

				filtered = filtered.filter((element) => { //filter all functions that gave no result
					return element !== undefined;
				});
				return [filtered, unfinished];
			}))
	}
}