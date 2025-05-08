/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version  Date            Author          Remarks
 * 1.00     3 Aug 2018		Supriya G		This script is used to set the Credit Term days
 *												
 * 
 */


function Vendor_BS(type) {	
	if(type == 'create' || type == 'edit'){		
		var terms		= nlapiGetFieldValue('terms');		
		if(_validateData(terms)){			
			try{
				nlapiSetFieldValue('custentity_inv_credit_term_days', '');
				var daysSearch = nlapiSearchRecord("customrecord_inv_credit_term_days",null,
									[
									   ["custrecord_inv_credit_term","anyof", terms]
									], 
									[
									   new nlobjSearchColumn("custrecord_inv_credit_term_days")
									]
									);

				if(_validateData(daysSearch)){
					var termDays = daysSearch[0].getValue("custrecord_inv_credit_term_days");
					
					nlapiSetFieldValue('custentity_inv_credit_term_days', termDays);
				}				
			}catch(e){
				nlapiLogExecution('ERROR','Error in function Vendor_BS :','Details: ' + e);
			}			
		}
	}
}