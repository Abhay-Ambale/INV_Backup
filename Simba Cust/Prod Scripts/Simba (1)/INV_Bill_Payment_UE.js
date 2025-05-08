/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version  Date            Author          Remarks
 * 1.00     19 Dec 2018		Supriya G		Bill Payment
 * 
 */

// Before Submit
function BillPaymnet_BS(type){
	var refnumArr 	= [];
	if(type == 'create' || type == 'edit'){
		var lineCount	= nlapiGetLineItemCount('apply');
		if(lineCount > 0){
			for(var i = 1; i<=lineCount; i++) {	
				var refnum = nlapiGetLineItemValue('apply', 'refnum', i);
				var apply = nlapiGetLineItemValue('apply', 'apply', i);
				if(apply == 'T'){
					refnumArr.push(refnum);
				}
			}
		}
		
		nlapiSetFieldValue('custbody_inv_vb_paid_ref', refnumArr.join(', '));
	}
}