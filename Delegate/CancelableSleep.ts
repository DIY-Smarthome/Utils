export class CancelableSleep {
	timeout: NodeJS.Timeout | undefined;
	duration: number;
	private promise: Promise<string> | undefined;
	private resolver: (value: string | PromiseLike<string>) => void;
	constructor(ms: number) {
		this.duration = ms;
		this.timeout;
	}

	/**
	 * Sleep for the specified amount of time 
	 */
	async sleep(): Promise<string> {
		if (!this.promise) {
			this.promise = new Promise<string>((resolve) => {
				this.resolver = resolve; //Save function for premature resolving
				this.timeout = setTimeout(() => resolve("NO_RESULT"), this.duration); //sleep logic
				this.timeout.unref();//Don't let the timeout keep the process alive
			})
		}
		return this.promise;
	}

	/**
	 * Cancel current 
	 */
	cancel() {
		clearTimeout(this.timeout); //Stop the timeout
		this.resolver.call(this); //Prematurely resolve the sleep promise
	}
}