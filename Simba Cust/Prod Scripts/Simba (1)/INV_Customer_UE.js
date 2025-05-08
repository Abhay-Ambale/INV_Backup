/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version  Date            	Author          Remarks
 * 1.00     12 April 2018		Supriya G		This script is used to set the Order category for website customers
 * 
 */

function Customer_BL(type, form) {
	var currContext		= nlapiGetContext();
	var execContext		= currContext.getExecutionContext();
	
	nlapiLogExecution('DEBUG', 'execContext', type+' '+execContext);
	if((type == 'create' || type == 'copy') && execContext == 'userinterface'){		
		//form.getField('isinactive').setDisplayType('disabled');
	}
	
	if(type == 'edit' && execContext == 'userinterface'){		
		var appprovalStatus = nlapiGetFieldValue('custentity_inv_approval_status');
		var isinactive 		= nlapiGetFieldValue('isinactive');
	
		if(isinactive == 'T' && appprovalStatus != APPROVED){
			//form.getField('isinactive').setDisplayType('disabled');
		}
	}
	
	if(type == 'view'){
		var approvalSt		= nlapiGetFieldValue('custentity_inv_approval_status');
		if(approvalSt == 1)
			form.setTitle('Customer Pending Approval');
	}
}

function Customer_BS(type) {
	var currContext		= nlapiGetContext();
	var execContext		= currContext.getExecutionContext();
	
	nlapiLogExecution('DEBUG', 'execContext', type+' '+execContext);		
		
	if(type == 'create' &&  execContext == 'suitelet') {
		var companyname		= nlapiGetFieldValue('companyname');
		var etailCustId		= nlapiGetFieldValue('custentity_celigo_etail_cust_id');
		var budgetCat 		= nlapiGetFieldValue('custentity_sg_customer_budget_category');
		
		nlapiLogExecution('DEBUG', 'companyname', companyname);
		nlapiLogExecution('DEBUG', 'etailCustId', etailCustId);
		nlapiLogExecution('DEBUG', 'budgetCat', budgetCat);
		
		// budgetCat = 20 = Website Online
		if(_validateData(etailCustId) && budgetCat == 20){
			nlapiSetFieldValue('custentity_inv_customer_order_category', ORDER_CAT_ONLINE);
			nlapiSetFieldValue('custentity_inv_class', 28);
		}		
	}
	
	if(type == 'create'){
		var etailCustId	= nlapiGetFieldValue('custentity_celigo_etail_cust_id');
		var terms		= nlapiGetFieldValue('terms');		
		nlapiLogExecution('DEBUG', 'terms', terms);
		
		if(!_validateData(etailCustId) && terms != 13) // Term 13 = Cash
		{
			nlapiSetFieldValue('isinactive', 'T');
			nlapiSetFieldValue('custentity_inv_approval_status', PENDING_APPROVAL);
		}
		else{
			nlapiSetFieldValue('isinactive', 'F');
			nlapiSetFieldValue('custentity_inv_approval_status', APPROVED);
		}
	}
	
	if(type == 'edit'){
		var terms			= nlapiGetFieldValue('terms');
		var approveStatus	= nlapiGetFieldValue('custentity_inv_approval_status');
		
		var oldRec 			= nlapiGetOldRecord();
		var oldTerms 		= oldRec && oldRec.getFieldValue('terms');
		
		if(approveStatus == APPROVED && oldTerms == 13 && terms != 13){			
			nlapiSetFieldValue('custentity_inv_approval_status', PENDING_APPROVAL);
		}
	}
}

// Function to set Customer name for MIS
function Customer_AS(type) {
	var currContext		= nlapiGetContext();
	var execContext		= currContext.getExecutionContext();
	
	nlapiLogExecution('DEBUG', 'Customer_AS execContext', type+' '+execContext);
	
	if(type == 'create' || type == 'edit'){
		var recId		= nlapiGetRecordId();
		var parentId	= nlapiGetFieldValue('parent');
		var isinactive	= nlapiGetFieldValue('isinactive');
		if(isinactive == 'F'){
			if(_validateData(parentId)){
				nlapiSubmitField('customer', recId, 'custentity_inv_cust_name_mis', parentId);
			}else{
				nlapiSubmitField('customer', recId, 'custentity_inv_cust_name_mis', recId);
			}
		}
	}
}