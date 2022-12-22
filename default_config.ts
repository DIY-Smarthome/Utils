import { Configdata } from "./interfaces/Configdata";

export const timeout: number = 1000;
export const pass:string = "";
export const config: Configdata = { timeout, pass };
export function MergeConfig(...overwrites: Configdata[]): Configdata{
	return {
		timeout: fillParam("timeout", overwrites),
		pass: fillParam("pass", overwrites)
	};
}
// Hierarchy of parameters:
// CLI Params
// Config file Params
// Default Params
function fillParam(paramName:string, params: Configdata[]): any{
	for (let i = 0; i < params.length; i++){
		if (params[i][paramName])
			return params[i][paramName];
	}
	return config[paramName];
}
export default config;