export interface Response {
	modulename: string,
	statuscode: number,
	detailedstatus?: string,
	content: unknown
}