/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version  Date            	Author          Remarks
 * 1.00     27 June 2018		Supriya G		This script is used to set the class on Invoice, Credit Memo
 *												
 * 
 */


function SetClassOnTrxn_BS(type) {
	if(type == 'create'){
		
		var entity		= nlapiGetFieldValue('entity');
		var invClass	= nlapiGetFieldValue('class');
		if(_validateData(entity) && !_validateData(invClass)){
			var custClass	= nlapiLookupField('customer', entity, 'custentity_inv_class');
			nlapiLogExecution('debug', 'custClass', custClass);
			nlapiSetFieldValue('class', custClass);
		}
	}
}