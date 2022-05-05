export interface Response {
	id: string,
	modulename: string,
	statuscode: number,
	detailedstatus?: string,
	content: unknown
}