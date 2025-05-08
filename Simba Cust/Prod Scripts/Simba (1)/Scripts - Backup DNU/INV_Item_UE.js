/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version  Date            	Author          Remarks
 * 1.00     25 April 2018		Supriya G		This script is used to inactivating Item when created
 *												
 * 
 */

function Item_BL(type, form) {
	var currContext		= nlapiGetContext();
	var execContext		= currContext.getExecutionContext();
	
	if((type == 'create' || type == 'copy') && execContext == 'userinterface'){		
		form.getField('isinactive').setDisplayType('disabled');
		form.getField('includechildren').setDisplayType('disabled');
		form.getField('upccode').setDisplayType('disabled');
		nlapiSetFieldValue('custitem_inv_auto_upc_code', 'T');
	}
	
	if(type == 'edit' && execContext == 'userinterface'){		
		var appprovalStatus = nlapiGetFieldValue('custitem_inv_appproval_status');
		var isinactive 		= nlapiGetFieldValue('isinactive');
		var upccode 		= nlapiGetFieldValue('upccode');
		var autoUpcCode		= nlapiGetFieldValue('custitem_inv_auto_upc_code');
	
		if(isinactive == 'T' && appprovalStatus != APPROVED_ITEM){
			form.getField('isinactive').setDisplayType('disabled');
		}
		
		if(_validateData(upccode) && autoUpcCode == 'T') {
			form.getField('upccode').setDisplayType('disabled');
			form.getField('custitem_inv_auto_upc_code').setDisplayType('disabled');
		}
	}
}

 // recordType = inventoryitem / assemblyitem
function Item_BS(type) {
	var recType		= nlapiGetRecordType();	
	var exeContext	= nlapiGetContext().getExecutionContext();
	nlapiLogExecution('debug','Item_BL getExecutionContext', nlapiGetContext().getExecutionContext());
	
	if(type == 'create' && (exeContext == 'userinterface' || exeContext == 'csvimport')){
		nlapiSetFieldValue('isinactive', 'T');	
	}	
}

function Item_AS(type) {
	var recId		= nlapiGetRecordId();
	var recType		= nlapiGetRecordType();
	var exeContext	= nlapiGetContext().getExecutionContext();
	
	if((type == 'create' || type == 'edit') && (exeContext == 'userinterface' || exeContext == 'csvimport')&& (recType == 'inventoryitem' || recType == 'assemblyitem')){
		var recId			= nlapiGetRecordId();
		var autoUpcCode		= nlapiGetFieldValue('custitem_inv_auto_upc_code');
		var upccode			= nlapiGetFieldValue('upccode');
		
		var oldRecord 		= nlapiGetOldRecord();
		var oldUpccode 		= oldRecord && oldRecord.getFieldValue('upccode');
		
		nlapiLogExecution('debug', 'recType', recType);
		nlapiLogExecution('debug', 'current upccode', upccode);
		nlapiLogExecution('debug', 'oldUpccode', oldUpccode);
		
		if(type=='create' && autoUpcCode == 'T'){
			_generateUpcCode(recId, recType, type);
		}
			
		if(type=='edit' && autoUpcCode == 'T' && oldUpccode != upccode){
			_generateUpcCode(recId, recType, type);
		}
	}
}
function _generateUpcCode(recId, recType, type){
	var rawcode = '';
	var filters = [];
	var columns = [];
		
	filters.push(new nlobjSearchFilter('isinactive', null, 'is', false));	
	columns.push(new nlobjSearchColumn('internalid'));
	columns.push(new nlobjSearchColumn('custrecord_inv_upc_start_no'));
	columns.push(new nlobjSearchColumn('custrecord_inv_upc_latest_used_number'));				
	
	var srchResults = nlapiSearchRecord('customrecord_inv_upc_code', null, filters, columns);	
	if(_validateData(srchResults) && srchResults.length > 0)
	{					
		var upcCodeId		= srchResults[0].getValue('internalid');
		var startNo 		= srchResults[0].getValue('custrecord_inv_upc_start_no');
		var latestUsedNo 	= srchResults[0].getValue('custrecord_inv_upc_latest_used_number');	
		
		rawcode 			= Number(latestUsedNo)+1;
		if(!_validateData(latestUsedNo)) rawcode = startNo;
		rawcode				= rawcode.toString();

		//nlapiLogExecution('debug', 'upcCodeId', upcCodeId);
		nlapiLogExecution('debug', 'rawcode length='+rawcode.length, rawcode);		
		if(_validateData(rawcode) && rawcode.length == 12) {
			// UPC Code
			var res 		= rawcode.split('');			
			var oddsum 		= Number(res[1])+Number(res[3])+Number(res[5])+Number(res[7])+Number(res[9])+Number(res[11]);
			var evensum 	= Number(res[0])+Number(res[2])+Number(res[4])+Number(res[6])+Number(res[8])+Number(res[10]);
			
			oddsum			= Number(oddsum) * 3;
			var sum 		= Number(oddsum) + Number(evensum);			
			var multiple 	= sum + (10 - sum % 10);
			var checkDigit 	= Number(multiple) - Number(sum);			
			var upcCode		= rawcode+checkDigit;		
			
			// Scan Pack Barcode
			if(checkDigit < 3)
				var scanPackDigit 	= Number(checkDigit) + 10 - 3;
			else 
				var scanPackDigit 	= Number(checkDigit) - 3;
			var scanPackBarcode		= 1+rawcode+scanPackDigit;			
			
			// Carton Barcode
			if(checkDigit < 6)
				var cartonDigit 	= Number(checkDigit) + 10 - 6;
			else 
				var cartonDigit 	= Number(checkDigit) - 6;
			var cartonBarcode		= 2+rawcode+cartonDigit;
			
			try{				
				var itemid			= nlapiGetFieldValue('itemid');
				var autoItemName	= nlapiGetFieldValue('custitem_inv_auto_item_name_number');
				
				if(autoItemName == 'T'){
					itemid 			= 'P00'+upcCode.substr(-8,8);
				}
				
				if(type == 'create') {
					nlapiSubmitField(recType, recId, ['upccode', 'custitem_inv_scan_pack_barcode', 'custitem_inv_carton_barcode', 'itemid'], [upcCode, scanPackBarcode, cartonBarcode, itemid]);
				}
				else{
					nlapiSubmitField(recType, recId, ['upccode', 'custitem_inv_scan_pack_barcode', 'custitem_inv_carton_barcode'], [upcCode, scanPackBarcode, cartonBarcode]);
				}
				
				nlapiSubmitField('customrecord_inv_upc_code', upcCodeId, 'custrecord_inv_upc_latest_used_number', rawcode);
			} catch (exp) {
				nlapiLogExecution('ERROR', '_generateUpcCode', exp.toString());
			}
		}	
	}
}
