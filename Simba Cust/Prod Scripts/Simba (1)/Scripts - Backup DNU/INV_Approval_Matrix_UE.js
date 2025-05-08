/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version  Date            	Author          Remarks
 * 1.00     12 April 2018		Supriya G		This script is used to disable the approver 2
 * 
 */


// User Event script Before Load
function ApprovalMatrix_BL(type, form, request) {
	var currContext		= nlapiGetContext();
	var execContext		= currContext.getExecutionContext();
	
	if(type == 'edit' && execContext == 'userinterface'){
		var itemType	= nlapiGetFieldValue('custrecord_inv_item_type');
		if(!_validateData(itemType)){
			//form.getField('custrecord_inv_approver_role2').setDisplayType('disabled');
		}
	}
}