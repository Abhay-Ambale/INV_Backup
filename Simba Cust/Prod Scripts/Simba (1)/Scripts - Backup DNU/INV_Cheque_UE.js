/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version  Date            Author          Remarks
 * 1.00     4 Apr 2018		Supriya G		Create Vendor Credit if Advance Payment is checked
 * 
 */

// Before Submit
function Cheque_BS(type){
	var creditRef	= nlapiGetFieldValue('custbody_inv_vendor_credit_ref');
	if(type == 'delete' && _validateData(creditRef)){
		throw nlapiCreateError('Invalid Action', 'This cheque has Bill Credit attached, hence you can not delete this cheque.', true);
	}
}

// Create Vendor Credit if Advance Payment is checked
function Cheque_AS(type){	
	var currContext		= nlapiGetContext();
	var execContext		= currContext.getExecutionContext();
		
	if((type == 'create' || type == 'edit') &&  execContext == 'userinterface') {
		var recType		= nlapiGetRecordType();
		var recId		= nlapiGetRecordId();
		
		var checkObj	= nlapiLoadRecord('check', recId);
		var advPay 		= checkObj.getFieldValue('custbody_inv_advance_payment');
		var creditRef 	= checkObj.getFieldValue('custbody_inv_vendor_credit_ref');
		var checkstatus = checkObj.getFieldValue('status');
		
		if(advPay == 'T' && !_validateData(creditRef) && !_validateData(checkstatus)){
			var lineCount	= checkObj.getLineItemCount('expense');
			if(lineCount > 0){
				_createBillCredit(checkObj);
			}
		}	
	}
}

function _createBillCredit(checkObj){	
	try{
		var recId		= nlapiGetRecordId();
		var lineCount	= checkObj.getLineItemCount('expense');
		
		var ceditObj 	= nlapiCreateRecord('vendorcredit');
		
		var tranid 		= checkObj.getFieldValue('tranid');
		if(_validateData(tranid)){
			tranid			= 'CHQ'+tranid;
			ceditObj.setFieldValue('tranid', tranid);
		}
		for(key in CheckToBillCreditBFObj) {
			if(_validateData(checkObj.getFieldValue(key)))
			{
				ceditObj.setFieldValue(CheckToBillCreditBFObj[key], checkObj.getFieldValue(key));			
			}	   
		}		
		
		for(var i = 1; i<=lineCount; i++) {	
			for(key in CheckToBillCreditLFObj) {				
				//nlapiLogExecution('DEBUG', 'key', key+' '+checkObj.getLineItemValue('expense', key, i));				
				if(_validateData(checkObj.getLineItemValue('expense', key, i))){
					ceditObj.setLineItemValue('expense', CheckToBillCreditLFObj[key], i, checkObj.getLineItemValue('expense', key, i));
				}
			}
		}
		
		//nlapiLogExecution('DEBUG', 'ceditObj', JSON.stringify(ceditObj));
		var creditId = nlapiSubmitRecord(ceditObj, true);
		nlapiLogExecution('debug', 'creditId', creditId);
					
		if(_validateData(creditId)) {
			nlapiSubmitField('check', recId, 'custbody_inv_vendor_credit_ref', creditId);
			nlapiSubmitField('vendorcredit', creditId, 'custbody_inv_cheque_ref', recId);
		} 
	}catch (e){
		nlapiLogExecution('ERROR', 'ERROR _createBillCredit : ', e);
	}
}