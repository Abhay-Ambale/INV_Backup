/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version    Date            Author          Remarks
 * 1.00     3 Sept 2020		 Supriya		This script is used to send an email to Warehouse team to release the hold of order and Ship the goods to customer if the customer is fully deposited or fully paid the order amount for the location Baswater Commercial/ Baswater Retail
 *											
 * 
 */
 
function sendReleseHoldEmail(type)
{
	if(type == 'create')
	{
		var recId 			= nlapiGetRecordId();
		var recType 		= nlapiGetRecordType();
		
		var recipientEmails	= nlapiGetContext().getSetting('SCRIPT', 'custscript_inv_holdemail_recipient');			
		var templateId 		= nlapiGetContext().getSetting('SCRIPT', 'custscript_inv_holdemail_template');
		
		//nlapiLogExecution('DEBUG','recType','recType->>'+recType);
		//nlapiLogExecution('DEBUG','templateId','templateId->>'+templateId);
		//nlapiLogExecution('DEBUG','recipient','recipient->>'+recipientEmails);
		
		
		if(recType == 'customerdeposit'){			
			CustDepositEmail(recId, templateId, recipientEmails);
		}
		
		if(recType == 'customerpayment'){
			CustPaymentEmail(recId, templateId, recipientEmails);
		}
	}
}

function CustDepositEmail(recId, templateId, recipientEmails)
{
	try 
	{
		var custDepoId 		= recId;		
		var custDepoRec 	= nlapiLoadRecord('customerdeposit',custDepoId);			
		var soId 			= custDepoRec.getFieldValue('salesorder');		
								
		if(_validateData(soId))
		{
			var srchResults = nlapiSearchRecord("customerdeposit",null,
									[
									   ["type","anyof","CustDep"], 
									   "AND", 
									   ["salesorder","noneof","@NONE@"], 
									   "AND", 
									   ["salesorder.custbody_inv_hold_until_paid","anyof","2"],  // Hold Until Paid = 2 = Yes
									   "AND", 
									   ["salesorder.internalidnumber","equalto", soId],
									   "AND",										   
									   ["salesorder.location","anyof","15","12"] // Baswater Commercial = 12,  Baswater Retail = 15
									], 
									[
									   new nlobjSearchColumn("fxamount",null,"SUM"), 
									   new nlobjSearchColumn("fxamount","salesOrder","MAX"),
									   new nlobjSearchColumn("salesrep","salesOrder","GROUP"),
									   new nlobjSearchColumn("createdby","salesOrder","GROUP")
									]
									);
		
			if(_validateData(srchResults) && srchResults.length > 0)
			{					
				var totalDepositAmt 	= srchResults[0].getValue('fxamount', null, 'SUM');
				var salesOrderAmt 		= srchResults[0].getValue('fxamount', 'salesOrder', "MAX");
				var salesRep			= srchResults[0].getValue('salesrep','salesOrder','GROUP');
				var createdby			= srchResults[0].getValue('createdby','salesOrder','GROUP');	
				
				var salesRepEmail 		= nlapiLookupField('employee', salesRep, 'email');
				if(Number(salesRep) != Number(createdby)){
					var createdbyEmail 	= nlapiLookupField('employee', createdby, 'email');					
					salesRepEmail		= salesRepEmail+', '+createdbyEmail;
				}
				
				nlapiLogExecution('DEBUG','totalDepositAmt for custDepoId '+custDepoId, 'totalDepositAmt->>'+totalDepositAmt);
				nlapiLogExecution('DEBUG','salesOrderAmt','salesOrderAmt->>'+salesOrderAmt);
				nlapiLogExecution('DEBUG','salesRep','salesRepEmail->>'+salesRepEmail);
				nlapiLogExecution('DEBUG','salesRep','createdbyEmail->>'+createdbyEmail);
							
				
				if(Number(totalDepositAmt) >= Number(salesOrderAmt))
				{						
					var records = new Object();
					records['transaction'] = custDepoId;
					
					if(!_validateData(templateId)){
						throw nlapiCreateError('MISSING_EMAIL_TEMPLATE', 'Email Template is missing. Please set Email Template in Script Deployment parameter.', false);
					}
					
					var emailMerger = nlapiCreateEmailMerger(templateId);
					emailMerger.setTransaction(custDepoId);

					var mergeResult = emailMerger.merge();							
					var Subject 	= mergeResult.getSubject();							
					var Body 		= mergeResult.getBody(); 						
					var userId 		= nlapiGetUser();
										
					recipientEmails	= salesRepEmail+','+recipientEmails;
											
					nlapiSendEmail(userId, recipientEmails, Subject, Body, null, null, records, null, true);
					nlapiLogExecution('DEBUG','Email Sent','Email Sent to recipient->>>'+recipientEmails);							
				}
			}
		}			
		
	}catch(e){
		var errString =  'CustDepositEmail ' + e.name + ' : ' + e.type + ' : ' + e.message;
		nlapiLogExecution('DEBUG','After Submit CustDepositEmail Error', errString);
	}

}
 
function CustPaymentEmail(recId, templateId, recipientEmails)
{
	try 
	{
		var custPaymentId 	= recId;	
		var custPaymentRec 	= nlapiLoadRecord('customerpayment',custPaymentId);			
		
		var srchResults = nlapiSearchRecord("customerpayment",null,
								[
								   ["type","anyof","CustPymt"], 
								   "AND", 
								   ["mainline","is","F"], 
								   "AND", 
								   ["internalidnumber","equalto", custPaymentId], 
								   "AND", 
								   ["appliedtotransaction.type","anyof","CustInvc"], // Amount Remaining = 0
								   "AND", 
								   ["appliedtotransaction.fxamountremaining","equalto","0.00"],  // Invoice - Amount Remaining = 0
								   "AND", 
								   ["appliedtotransaction.custbody_inv_hold_until_paid","anyof","2"],  //Invoice - Hold Until Paid = 2 = Yes
								   "AND", 
								   ["appliedtotransaction.location","anyof","12","15"]  //Baswater Commercial = 12, Baswater Retail = 15
								], 
								[
								   new nlobjSearchColumn("appliedtotransaction"), 
								   new nlobjSearchColumn("createdfrom","appliedToTransaction",null),
								   new nlobjSearchColumn("salesrep","appliedToTransaction",null)
								]
								);
		
		if(_validateData(srchResults) && srchResults.length > 0)
		{
			nlapiLogExecution('DEBUG','srchResults.length','srchResults.length->>'+srchResults.length);
			for(var i = 0; i<srchResults.length; i++)
			{					
				var invoiceId 		= srchResults[i].getValue('appliedToTransaction', null);
				var soId 			= srchResults[i].getValue('createdfrom', 'appliedToTransaction', null);
				var salesRep		= srchResults[i].getValue('salesrep','appliedToTransaction', null);					
				var salesRepEmail 	= nlapiLookupField('employee', salesRep, 'email');
				
				var createdby 		= nlapiLookupField('salesorder', soId, 'createdby');
				if(Number(salesRep) != Number(createdby)){
					var createdbyEmail 	= nlapiLookupField('employee', createdby, 'email');					
					salesRepEmail		= salesRepEmail+', '+createdbyEmail;
				}
				
				
				nlapiLogExecution('DEBUG','invoiceId','invoiceId->>'+invoiceId);
				nlapiLogExecution('DEBUG','soId','soId->>'+soId);
				nlapiLogExecution('DEBUG','salesRep','salesRepEmail->>'+salesRepEmail);					
										
				var records = new Object();
				records['transaction'] = invoiceId;
				
				if(!_validateData(templateId)){
					throw nlapiCreateError('MISSING_EMAIL_TEMPLATE', 'Email Template is missing. Please set Email Template in Script Deployment parameter.', false);
				}
				
				var emailMerger = nlapiCreateEmailMerger(templateId);
				emailMerger.setTransaction(invoiceId);

				var mergeResult = emailMerger.merge();							
				var Subject 	= mergeResult.getSubject();							
				var Body 		= mergeResult.getBody(); 						
				var userId 		= nlapiGetUser();
				
				recipientEmails	= salesRepEmail+','+recipientEmails;
										
				nlapiSendEmail(userId, recipientEmails, Subject, Body, null, null, records, null, true);
				nlapiLogExecution('DEBUG','Email Sent','Email Sent to recipient->>>'+recipientEmails);							
				
			}
		}
		
	}catch(e){
		var errString =  'CustPaymentEmail ' + e.name + ' : ' + e.type + ' : ' + e.message;
		nlapiLogExecution('DEBUG','After Submit CustPaymentEmail Error', errString);
	}	
}