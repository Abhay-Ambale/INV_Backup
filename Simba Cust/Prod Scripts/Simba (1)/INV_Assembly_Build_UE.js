/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version  Date            Author          Remarks
 * 1.00     11 May 2018		Supriya G		
 * 
 */

function AssemblyBuild_BL(type, form){
	var currContext		= nlapiGetContext();
	var execContext		= currContext.getExecutionContext();
	
	if(type == 'view'){
		var recId			= nlapiGetRecordId();
		var woId 			= nlapiGetFieldValue('createdfrom');
		var woCat 			= nlapiGetFieldValue('custbody_inv_wo_category');
		var toRef 			= nlapiGetFieldValue('custbody_inv_outsourced_to_ref');
		
		if(woCat == 3 && !_validateData(toRef)){
			var toStr = '';
			toStr = "javascript:";
			toStr += "try{";			
			toStr += "window.location.href='/app/accounting/transactions/trnfrord.nl?buildid="+recId+"'";
			toStr += "}catch(e){alert(e);}";
			form.addButton('custpage_create_to','Create Transfer Order', toStr);
		}
	}
}