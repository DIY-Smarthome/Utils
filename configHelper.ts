import { Configdata } from "./interfaces/Configdata";
import parseCLIConfig from 'minimist';
import * as fs from 'fs';


const timeout: number = 1000;
const pass:string = "";
const defaultConfig: Configdata = { timeout, pass };
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
	return defaultConfig[paramName];
}

let configData: Configdata;
function getConfig() {
	if (configData)
		return configData;
	
	const cliParams = parseCLIConfig(process.argv.slice(2));

	// Hierarchy of parameters:
	// CLI Params
	// Config file Params
	// Default Params
	if (cliParams["configfile"])
		configData = JSON.parse(fs.readFileSync(cliParams["configfile"]).toString());
	
	configData = MergeConfig(cliParams, configData);
	return configData;
}
export default getConfig;