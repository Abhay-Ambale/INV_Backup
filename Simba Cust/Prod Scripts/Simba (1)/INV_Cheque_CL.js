/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version  Date            Author          Remarks
 * 1.00     4 Apr 2018		Supriya G		Trigger alert if Advance Payment field is checked
 * 
 */

// Trigger alert if Advance Payment field is checked
function Cheque_PI(){
	var advPay		= nlapiGetFieldValue('custbody_inv_advance_payment');
	var creditRefId	= nlapiGetFieldValue('custbody_inv_vendor_credit_ref');
	if(advPay == 'T' && _validateData(creditRefId)){
		nlapiDisableField('custbody_inv_advance_payment', true);
	}
}
function Cheque_SR(){
	var advPay		= nlapiGetFieldValue('custbody_inv_advance_payment');
	var creditRefId	= nlapiGetFieldValue('custbody_inv_vendor_credit_ref');
	var creditRef	= nlapiGetFieldText('custbody_inv_vendor_credit_ref');
	
		
	if(advPay == 'T' && !_validateData(creditRefId)){
		var error 			= 0;
		var expenseCount	= nlapiGetLineItemCount('expense');
		for(var k = 1; k <= expenseCount; k++) {
			var account 	= nlapiGetLineItemValue('expense', 'account', k);
			if(account != 560){
				error = 1;
			}
		}
		if(error == 1){
			alert("For advance payment line level expense account should be '1212 Prepayments - Supplier'");		
			return false;
		}
	
		var strConfirm = confirm("You have marked this cheque as Advance Payment, this will auto creates the Supplier Bill Credit.");
		if(strConfirm == false) {
			return false;
		}
	}
	
	if(_validateData(creditRefId)){
		var strConfirm = confirm("Any change to this cheque, must be marked on corresponding Bill Credit '"+creditRef+"' manually.");
		if(strConfirm == false) {
			return false;
		}
	}
	
	return true;
}