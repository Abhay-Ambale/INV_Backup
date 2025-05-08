 /* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
 ||   This client script is deployed as Client Script 					||
 ||   'INV Trigger RDR JE CL' with NetSuite in Suitescript 2.0          ||
 ||                                                              		||
 ||                                                               		||
 ||  Version Date         Author        	Remarks                   	||
 ||  1.0     Sep 28 2020  Supriya Gunjal  	Initial commit            	|| 
  \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
  
/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
*/
var COMM, CURR_REC, SEARCH;
define(['./Library_Files/INV_common_functions_LIB.js','N/currentRecord','N/search'], INV_Trigger_RDR_JE_CL);

function INV_Trigger_RDR_JE_CL(comm, currentRecord, search)
{
	COMM   		= comm;
	CURR_REC   	= currentRecord;
	SEARCH 		= search;
	
	return{
		saveRecord: _saveRecord
	}
}

function _saveRecord(context)
{	
	var currentRecord 	= context.currentRecord;
	var JeDate 			= currentRecord.getValue({fieldId : 'custpage_date'});
	var isReversal 		= currentRecord.getValue({fieldId : 'custpage_isreversal'});
	var reversalDate 	= currentRecord.getValue({fieldId : 'custpage_reversal_date'});
	
	if(isReversal && !_validateData(reversalDate)){
		alert("Please enter 'Reversal Date' for Reversal Journal");
		return false;
	}
	
	if(!isReversal && _validateData(reversalDate)){
		alert("Please check 'Reversal' checkbox to trigger Reversal Journal");
		return false;
	}
	
	if(_validateData(JeDate)){
		var lineNumber = currentRecord.findSublistLineWithValue({sublistId: 'custpage_rdrsublist', fieldId: 'custpage_select', value: 'T'});
		console.log('lineNumber====>>'+lineNumber);
		if(lineNumber == -1) {
			alert("Please select atleast one line to trigger Journal.");
			return false;
		}
	}
	return true;
}