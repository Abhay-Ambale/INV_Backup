/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version  Date            Author          Remarks
 * 1.00     11 Apr 2018		Supriya G		Default approval of Vendor Bill if created from PO
 * 
 */

// Before Submit
function VendorBill_PI(type){
	var createdfrom	= nlapiGetFieldValue('createdfrom');

	if(type == 'create' || type == 'copy' || type == 'edit'){
		nlapiDisableField('approvalstatus', true);
	}
	
	if(type == 'copy'){
		var transform = gup('transform');
		if(transform == 'purchord'){
			nlapiSetFieldValue('approvalstatus', 2);
		}
	}
}