 /* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
 ||   This is a Scheduled Script for to set DD TO date on Sales Order   ||
 ||   in Suitescript 2.0 							                    ||
 ||                                                              		||
 ||                                                               		||
 ||  Version Date         Author        	Remarks                   	||
 ||  1.0     Mar 10 2020  Supriya Gunjal  	Initial commit            	|| 
  \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
 
/**
 * @NApiVersion 2.0
 * @NScriptType ScheduledScript
 */
 
var SFTP, RUNTIME, FORMAT, SEARCH;
define(['./Integration/INV_Integrations_LIB', 'N/runtime', 'N/record', 'N/format', 'N/search'], runSODDTOScheduled);

function runSODDTOScheduled(INV_Integrations_LIB, runtime, record, format, search) {
	COMMONFUNC	= INV_Integrations_LIB;
	RUNTIME 	= runtime;
	RECORD		= record;
	FORMAT		= format;	
	SEARCH		= search;
	return {
		execute: execute_SO_DDTO
	}
}

function execute_SO_DDTO(context) {
		
	try {
		var pdays			= 120;
		var scriptObj 		= RUNTIME.getCurrentScript();
		log.debug({title: '>>>> Start ', details:scriptObj.getRemainingUsage()});
		
		var soSearchObj 	= _getSOSearchResult(pdays);
		soSearchObj.run().each(function(result){
			var soId 		= result.getValue({name: "internalid"});
			var soLineId 	= result.getValue({name: "line"});
			var newDate		= result.getValue({name: "formuladate"});
			
			var newDDTODate = FORMAT.parse({value: newDate, type: FORMAT.Type.DATE});
			log.debug({title: 'soId: '+soId+' soLineId: '+soLineId, details: 'new DD TO Date: '+newDDTODate});
			
			try {
				// Load SO and set DD TO date
				var soObj 		= RECORD.load({ type: RECORD.Type.SALES_ORDER, id: soId, isDynamic: true});
				var lineNumber 	= soObj.findSublistLineWithValue({sublistId: 'item', fieldId: 'line', value: soLineId});
				
				soObj.selectLine({sublistId: 'item',line: lineNumber});
				soObj.setCurrentSublistValue({sublistId: 'item', fieldId:'custcol_os_delivery_date_to', value:newDDTODate});
				soObj.commitLine({sublistId: 'item'});
				
				var id = soObj.save({enableSourcing: true, ignoreMandatoryFields: false});				
				//log.debug({title: 'SO updated ', details: id});
			}
			catch (e) {
				log.error({title: 'Error In execute_SO_DDTO: '+e.name, details: e.message});		
			}		
			return true;
		});
		
	}
	catch (e) {
		log.error({title: 'Error In execute_SO_DDTO: '+e.name, details: e.message});		
	}	
}

function _getSOSearchResult(pdays)
{
	var filters	 = [];
		filters.push(["type","anyof","SalesOrd"]);
		filters.push('AND');
		filters.push(["status","anyof","SalesOrd:D","SalesOrd:F","SalesOrd:E","SalesOrd:B"]);
		filters.push('AND');
		filters.push(["mainline","is","F"]);
		filters.push('AND');
		filters.push(["cogs","is","F"]);
		filters.push('AND');
		filters.push(["taxline","is","F"]);
		filters.push('AND');
		filters.push(["shipping","is","F"]);
		filters.push('AND');
		filters.push(["trandate","on","today"]);
		filters.push('AND');
		filters.push(["subsidiary","anyof","6","7"]);
		filters.push('AND');
		filters.push(["formulanumeric: {quantity}-nvl({quantityshiprecv},0)-nvl({quantitycommitted},0)","greaterthan","0"]);
		filters.push('AND');
		filters.push([["formulanumeric: CASE WHEN {custcol_os_delivery_date_to} < {custbody_os_delivereybydate} + "+pdays+" THEN 1 ELSE 0 END","equalto","1"],"OR",["custcol_os_delivery_date_to","isempty",""]]);
			
		var searchObj 		= SEARCH.create({type: "salesorder",
								   filters:
								   [
										filters										
								   ],
								   columns:
								   [
								   
									  SEARCH.createColumn({name: "internalid", label: "Internal ID", sort: SEARCH.Sort.DESC}),
									  SEARCH.createColumn({name: "line", label: "Line ID"}),
									  SEARCH.createColumn({name: "item", label: "Item"}),
									  SEARCH.createColumn({name: "custbody_os_delivereybydate", label: "Deliverey By Date"}),
									  SEARCH.createColumn({name: "formuladate", formula: "{custbody_os_delivereybydate} + 120", label: "Date +120"})	  
								   ]
								});
								
		var searchResultCount = searchObj.runPaged().count;
		log.debug("_getSOSearchResult result count",searchResultCount);
		
		return searchObj;
}