/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version  Date            	Author          Remarks
 * 1.00     27 June 2018		Supriya G		This script is used to set the class on Invoice
 *												
 * 
 */


function Invoice_BS(type) {
	if(type == 'create'){
		var entity		= nlapiGetFieldValue('entity');
		if(_validateData(entity)){
			var custClass	= nlapiLookupField('customer', entity, 'custentity_inv_class');
			nlapiLogExecution('debug', 'custClass', custClass);
			nlapiSetFieldValue('class', custClass)
		}
	}
}