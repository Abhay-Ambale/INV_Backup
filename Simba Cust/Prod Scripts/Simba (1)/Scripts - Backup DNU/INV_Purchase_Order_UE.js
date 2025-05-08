/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version  Date            Author          Remarks
 * 1.00     31 May 2018		Supriya G		This script is used to
 * 
 */


function PurchaseOrder_BL(type, form){
	var currContext		= nlapiGetContext();
	var execContext		= currContext.getExecutionContext();
	
	/* if(type == 'create' && execContext == 'userinterface'){
		var customform 	= nlapiGetFieldValue('customform');
		if(customform == FRM_PO_IC_MAGNUM){
			var configRec		= nlapiLoadConfiguration('companypreferences');
			var MFM 			= configRec.getFieldValue('custscript_inv_mfm');
			
			//nlapiLogExecution('debug', 'MFM', MFM);
			nlapiSetFieldValue('custbody_inv_mfm', MFM);
		}
	} */
	
	if(type == 'create' || type == 'edit' || type == 'view' || type == 'copy'){
		//form.getField('custbody_inv_mfm').setDisplayType('hidden');
		form.getField('approvalstatus').setDisplayType('disabled');	
	}
	
	if(type == 'view'){
		var recId			= nlapiGetRecordId();
		var approvalstatus 	= nlapiGetFieldValue('approvalstatus');
		var woId 			= nlapiGetFieldValue('custbody_inv_wo_ref');
		var toId 			= nlapiGetFieldValue('custbody_inv_outsourced_to_ref');
		if(approvalstatus == '2' && _validateData(woId) && !_validateData(toId)){
			var toStr = '';
			toStr = "javascript:";
			toStr += "try{";			
			toStr += "window.location.href='/app/accounting/transactions/trnfrord.nl?woid="+woId+"&poid="+recId+"'";
			toStr += "}catch(e){alert(e);}";
			form.addButton('custpage_create_to','Create Transfer Order', toStr);
		}
	}
}

function PurchaseOrder_AS(type){
	var currContext		= nlapiGetContext();
	var execContext		= currContext.getExecutionContext();
	var poRefs			= [];
	
	if(type == 'create' && execContext == 'userinterface'){
		var recId		= nlapiGetRecordId();
		var customform 	= nlapiGetFieldValue('customform');
		if(customform == 196){
			var woId 	= nlapiGetFieldValue('custbody_inv_wo_ref');
			nlapiLogExecution('debug', 'woId', woId);
			if(_validateData(woId)){				
				var woObj		= nlapiLoadRecord('workorder', woId);
				poRef 			= woObj.getFieldValues('custbody_inv_process_order_refs');
				nlapiLogExecution('debug', 'poRef', poRef);			
				
				if(_validateData(poRef)) {
					poRefs 		= [].concat(poRef);					
					
				}
				nlapiLogExecution('debug', 'poRefs 1', poRefs);
				poRefs.push(recId);
				nlapiLogExecution('debug', 'poRef 2', poRef);
				
				woObj.setFieldValue('custbody_inv_process_order_refs', [].concat(poRefs));
				nlapiSubmitRecord(woObj);
			}
		}
	}
}