/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version    Date            Author          Remarks
 * 2.00     18 Nov 2020		  Supriya		    
 * 
 */
 /**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
*/
var CURRREC,COMM,RUNTIME,SEARCH,RECORD;
define(['N/currentRecord','./INV_Integrations_LIB','N/runtime','N/search','N/record', 'N/url'],INV_ApplyLandedCost_CL);

function INV_ApplyLandedCost_CL(currentRecord,comm,runtime,search,record,url)
{
	CURRREC 	= currentRecord,
	COMM    	= comm,
	RUNTIME 	= runtime,
	SEARCH  	= search,
	RECORD 		= record;
	URL			= url;
	return{
		//fieldChanged: _fieldChanged,
		saveRecord: _saveRecord,
		onClickReset: onClickReset
	}
}

function onClickReset(scriptId, deploymentId){	
	var SuiteletURL = URL.resolveScript({scriptId: scriptId, deploymentId: deploymentId});
	window.location.href = SuiteletURL;
}


function _saveRecord(context)
{	
	var currentRecord 	= context.currentRecord;
	var container 		= currentRecord.getValue({fieldId : 'custpage_container'});
	var currency 		= currentRecord.getValue({fieldId : 'custpage_currency'});
	var lineCount  		= currentRecord.getLineCount({sublistId:'custpage_irlist'});
	
	if(_validateData(container) && _validateData(currency) && lineCount > 0){
		var lineNumber = currentRecord.findSublistLineWithValue({sublistId: 'custpage_irlist', fieldId: 'custpage_select', value: 'T'});
		//console.log('lineNumber====>>'+lineNumber);
		if(lineNumber == -1) {
			alert("Please select atleast one Item Reciept.");
			return false;
		}
		
		var lineCount  	= currentRecord.getLineCount({sublistId:'custpage_lclist'});
		var costCatFlag	= 0;
		for(var i=0;i<lineCount;i++){		
			var amount  = currentRecord.getSublistValue({sublistId:'custpage_lclist',fieldId:'custpage_amount',line:i});
			if(_validateData(amount) && Number(amount)>0){
				costCatFlag	= 1;
			}
		}
		if(costCatFlag == 0) {
			alert("Please enter Landed Cost Category amount.");
			return false;
		}
		
		if(!confirm('Are you sure you want to apply this landed cost to selected Item Receipts?')) {
		  return false;
		}
	}
	return true;
}

/* function _fieldChanged(context)
{
	var fieldId 	= context.fieldId;
	var currRec 	= CURRREC.get(); 
	
	if(fieldId == 'custpage_shipmentheader')
	{
		var shipHedr 	= currRec.getValue({fieldId:'custpage_shipmentheader'});
		//alert('shipHedr '+shipHedr);
		
		var fieldLookUp = SEARCH.lookupFields({
								type: 'customrecord_os_shiphead',
								id: shipHedr,
								columns: ['custrecord_os_sh_containernum', 'custrecord_os_ship_reference']
							});
							
		var container 	= fieldLookUp.custrecord_os_sh_containernum;
		var shipRef 	= fieldLookUp.custrecord_os_ship_reference;	
		
		currRec.setValue({fieldId:'custpage_container', value:container, ignoreFieldChange: true, forceSyncSourcing: false});
	}
	
	if(fieldId == 'custpage_container')
	{
		var container 	= currRec.getValue({fieldId:'custpage_container'});						
		
		if(_validateData(container)){
			var shipHedr 	= _getShipHeaderByContainer(container);
			currRec.setValue({fieldId:'custpage_shipmentheader', value:shipHedr, ignoreFieldChange: true, forceSyncSourcing: false})
		}		
	}
} */

function _getShipHeaderByContainer(container)
{
	var shipHedr = '';
	try {		
		var shipHedrSearchObj = SEARCH.create({
								   type: "customrecord_os_shiphead",
								   filters:
								   [
									   ["custrecord_os_sh_containernum","is", container]
								   ],
								   columns:
								   [									 
									  SEARCH.createColumn({name: "internalid", label: "Internal ID"})
								   ]
								});
		var searchResultCount = shipHedrSearchObj.runPaged().count;
		if(searchResultCount == 1){
			shipHedrSearchObj.run().each(function(result){
				shipHedr = result.getValue({name: "internalid"});
				return false;
			});
		}
		
		
	}catch (e) {
		log.error({title: 'Error In _getFolderId: '+e.name, details: e.message});
		
	}
	return shipHedr;
}