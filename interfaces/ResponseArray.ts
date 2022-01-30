import { DetailedStatus } from '../enums/DetailedStatus';
import { Response } from './Response';

export class ResponseArray extends Array<Response> {
	/**
	 * Flat array of contents
	 * @param this 
	 * @returns Array of all contents combined.
	 */
	getContentsFlat(this: Array<Response>): unknown[] {
		return this.map((r) => r.content).flat();
	}

	/**
	 * Counts the amount of jobs that timed out in other modules during this request
	 * @param this 
	 * @returns Number of timeouts
	 */
	countTimeouts(this: Response[]): number {
		let sum = 0;
		this.filter((r) => r.statuscode == 207 && r.detailedstatus.startsWith(DetailedStatus.PARTIAL_TIMEOUT))
			.map((r) => r.detailedstatus)
			.forEach(t => {
				sum += parseInt(t.split("|")[1])
			})
		return sum;
	}
}