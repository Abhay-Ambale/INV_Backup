/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version  Date            Author          Remarks
 * 1.00     29 Mar 2018		Supriya G	Initial creation
 * 
 */

// Item Type
var ITEM_TYPE_INVENTORY = 1;
var ITEM_TYPE_ASSEMBLY 	= 5;

// Entity Type
var ENTITY_TYPE_CUSTOMER = 2;

// Transaction Type
var TXN_TYPE_BILL		= 17;
var TXN_TYPE_ESTIMATE	= 6;
var TXN_TYPE_SALESORDER	= 31;
var TXN_TYPE_PURCHASEORDER	= 15;

// User Event script Before Load
function SetApprovalMatrix_BL(type, form, request) {
	var filters		= [];
	var columns		= [];
	
	var recType			= nlapiGetRecordType();
	var recId			= nlapiGetRecordId();	
	var currContext		= nlapiGetContext();
	var execContext		= currContext.getExecutionContext();
	
	nlapiLogExecution('debug','recType',recType);
	
	if(type == 'view' &&  execContext == 'userinterface') {
					
		//var currObj			= nlapiLoadRecord(recType, recId);
		//var isinactive		= currObj.getFieldValue('isinactive');
		var isinactive			= nlapiGetFieldValue('isinactive');
		var subsidiary			= nlapiGetFieldValue('subsidiary');		
		nlapiLogExecution('debug','subsidiary',subsidiary);
		
		if(recType =='inventoryitem' || recType =='assemblyitem'){
			var itemType 		= ITEM_TYPE_INVENTORY;
			if(recType == 'assemblyitem') itemType = ITEM_TYPE_ASSEMBLY;
			
			var currAppStatus	= nlapiGetFieldValue('custitem_inv_appproval_status');			
						
			// If current status rejected by Accounts Manager resend for AM Approval by Customer Service Manager
			if(currAppStatus == REJECTED_AM && currContext.getRole() == ROLE_CUSTOMER_SERVICE_MANAGER){
				var apprvStr = _getApproveStr('custitem_inv_appproval_status', PENDING_APPROVAL_AM);
				form.addButton('custpage_apprv','Send For GM Approval',apprvStr);
			}
						
			// If current status rejected by Finance Manager resend for FM Approval by Customer Service Manager
			if(currAppStatus == REJECTED_FM && currContext.getRole() == ROLE_CUSTOMER_SERVICE_MANAGER){
				var apprvStr = _getApproveStr('custitem_inv_appproval_status', PENDING_APPROVAL_FM);
				form.addButton('custpage_apprv','Send For FM Approval',apprvStr);
			}
			
			// If current status is Pending AM / FM  Approval display button to Approve / Reject			
			if(_validateData(subsidiary) && (currAppStatus == PENDING_APPROVAL_AM || currAppStatus == PENDING_APPROVAL_FM)){
				subsidiary		= subsidiary.split('');
				
				filters.push(new nlobjSearchFilter('isinactive', null, 'is', false));
				filters.push(new nlobjSearchFilter('custrecord_inv_approval_subsidiary', null, 'anyof', subsidiary));				
				filters.push(new nlobjSearchFilter('custrecord_inv_item_type', null, 'anyof', itemType));
			
				columns.push(new nlobjSearchColumn('custrecord_inv_approval_status'));
				columns.push(new nlobjSearchColumn('custrecord_inv_approver_role1'));
				//columns.push(new nlobjSearchColumn('custrecord_inv_approver_role2'));
				
				var srchResults = nlapiSearchRecord('customrecord_inv_approval_matrix', null, filters, columns);				
				if(_validateData(srchResults) && srchResults.length > 0)
				{
					for(var i=0; i<srchResults.length; i++)
					{						
						var approvalStatus 	= srchResults[i].getValue('custrecord_inv_approval_status');
						var approverRole1 	= srchResults[i].getValue('custrecord_inv_approver_role1');
						//var approverRole2 	= srchResults[0].getValue('custrecord_inv_approver_role2');
						
						/* nlapiLogExecution('debug','currAppStatus',currAppStatus);
						nlapiLogExecution('debug','approverRole1',approverRole1);					
						nlapiLogExecution('debug','currContext.getRole()',currContext.getRole());
						nlapiLogExecution('debug','approverRole1 indexOf',approverRole1.indexOf(currContext.getRole())); */
						
						
						// Buttons for Accounts Manager
						if(currAppStatus == PENDING_APPROVAL_AM && approverRole1.indexOf(currContext.getRole()) != -1)
						{	
							nlapiLogExecution('debug','approverRole1',approverRole1);
							//var apprvStr = _getApproveStr('custitem_inv_appproval_status', PENDING_APPROVAL_FM);
							var apprvStr = _getApproveStr2('custitem_inv_appproval_status', APPROVED_ITEM);
							form.addButton('custpage_apprv','Approve',apprvStr);		
							
							var rejectStr = _getRejectStr('custitem_inv_appproval_status', REJECTED_AM);						
							form.addButton("custpage_reject",'Reject', rejectStr);
							
							break;
						}					
					
						/* if(currAppStatus == PENDING_APPROVAL_FM && approverRole2.indexOf(currContext.getRole()) != -1)
						{	
							// Buttons for Finance Manager						
							var apprvStr = _getApproveStr2('custitem_inv_appproval_status', APPROVED_ITEM);
							form.addButton('custpage_apprv','Approve',apprvStr);		
							
							var rejectStr = _getRejectStr('custitem_inv_appproval_status', REJECTED_FM);						
							form.addButton("custpage_reject",'Reject', rejectStr); 
						} */
					}
				}
			}
		} // end of recType =='inventoryitem'
		else if(recType =='vendorbill'){
			var currAppStatus	= nlapiGetFieldValue('approvalstatus');
			if(currAppStatus == PENDING_APPROVAL){
				filters.push(new nlobjSearchFilter('isinactive', null, 'is', false));
				filters.push(new nlobjSearchFilter('custrecord_inv_approval_subsidiary', null, 'anyof', subsidiary));
				filters.push(new nlobjSearchFilter('custrecord_inv_txn_type', null, 'anyof', TXN_TYPE_BILL));			
				columns.push(new nlobjSearchColumn('custrecord_inv_approval_status'));
				columns.push(new nlobjSearchColumn('custrecord_inv_approver_role1'));				
				
				var srchResults = nlapiSearchRecord('customrecord_inv_approval_matrix', null, filters, columns);
				if(_validateData(srchResults) && srchResults.length > 0)
				{					
					var approverRole1 	= srchResults[0].getValue('custrecord_inv_approver_role1');
					
					nlapiLogExecution('debug', 'vendorbill approverRole1', approverRole1);

					// Buttons for Approver 1
					if(approverRole1.indexOf(currContext.getRole()) != -1){						
						var apprvStr = _getApproveStr('approvalstatus', APPROVED);
						form.addButton('custpage_apprv','Approve',apprvStr);
						
						var rejectStr = _getRejectBillStr('approvalstatus', 3);
						form.addButton("custpage_reject",'Reject', rejectStr); 
					}
				}
				else{
					nlapiLogExecution('debug', 'vendorbill approve', 'No result');
				}
			}
		} // end of recType =='vendorbill'
		/* else if(recType =='estimate'){
			var currAppStatus	= nlapiGetFieldValue('custbody_inv_txn_approval_status');
			if(currAppStatus == PENDING_APPROVAL){
				filters.push(new nlobjSearchFilter('isinactive', null, 'is', false));
				filters.push(new nlobjSearchFilter('custrecord_inv_approval_subsidiary', null, 'anyof', subsidiary));
				filters.push(new nlobjSearchFilter('custrecord_inv_txn_type', null, 'anyof', TXN_TYPE_ESTIMATE));			
				columns.push(new nlobjSearchColumn('custrecord_inv_approval_status'));
				columns.push(new nlobjSearchColumn('custrecord_inv_approver_role1'));				
				
				var srchResults = nlapiSearchRecord('customrecord_inv_approval_matrix', null, filters, columns);
				if(_validateData(srchResults) && srchResults.length > 0)
				{					
					var approverRole1 	= srchResults[0].getValue('custrecord_inv_approver_role1');
					
					// Buttons for Approver 1
					if(approverRole1.indexOf(currContext.getRole()) != -1){						
						var apprvStr = _getApproveStr('custbody_inv_txn_approval_status', APPROVED);
						form.addButton('custpage_apprv','Approve',apprvStr);
						
						var rejectStr = _getRejectStr('custbody_inv_txn_approval_status', REJECTED);						
						form.addButton("custpage_reject",'Reject', rejectStr); 
					}
				}
			}
		} // end of recType =='estimate' */
		else if(recType =='salesorder'){
			var financeHold		= nlapiGetFieldValue('custbody_inv_finance_hold');
			var orderCat		= nlapiGetFieldValue('custbody_inv_order_category');
			var entity			= nlapiGetFieldValue('entity');
			var orderCat		= nlapiGetFieldValue('custbody_inv_order_category');
			var orderstatus		= nlapiGetFieldValue('orderstatus');
			var manualApproval	= nlapiGetFieldValue('custbody_inv_manual_approval_req');
			
			if(manualApproval == 'T' && orderstatus == 'A'){
				filters.push(new nlobjSearchFilter('isinactive', null, 'is', false));
				filters.push(new nlobjSearchFilter('custrecord_inv_approval_subsidiary', null, 'anyof', subsidiary));
				filters.push(new nlobjSearchFilter('custrecord_inv_txn_type', null, 'anyof', TXN_TYPE_SALESORDER));
				filters.push(new nlobjSearchFilter('custrecord_inv_txn_status', null, 'anyof', 11));
				
				columns.push(new nlobjSearchColumn('custrecord_inv_approval_status'));
				columns.push(new nlobjSearchColumn('custrecord_inv_approver_role1'));				
				
				var srchResults = nlapiSearchRecord('customrecord_inv_approval_matrix', null, filters, columns);
				if(_validateData(srchResults) && srchResults.length > 0)
				{					
					var approverRole1 	= srchResults[0].getValue('custrecord_inv_approver_role1');
					nlapiLogExecution('debug', 'approverRole1', approverRole1);
					
					// Buttons for Approver 1					
					if(approverRole1.indexOf(currContext.getRole()) == -1){
						btnApprove 	= form.getButton('approve');
						if (btnApprove != null){
							btnApprove.setVisible(false);
						}						
					}
				}
			}
			
			//nlapiLogExecution('debug', 'subsidiary', subsidiary);
			nlapiLogExecution('debug', 'orderCat', orderCat);
			if(financeHold == 'T'){
				filters.push(new nlobjSearchFilter('isinactive', null, 'is', false));
				filters.push(new nlobjSearchFilter('custrecord_inv_approval_subsidiary', null, 'anyof', subsidiary));
				filters.push(new nlobjSearchFilter('custrecord_inv_txn_type', null, 'anyof', TXN_TYPE_SALESORDER));
				if(_validateData(orderCat)){
					filters.push(new nlobjSearchFilter('custrecord_inv_so_type', null, 'anyof', orderCat));
				}
				else{
					filters.push(new nlobjSearchFilter('custrecord_inv_so_type', null, 'anyof', '@NONE@'));
				}
				columns.push(new nlobjSearchColumn('custrecord_inv_approval_status'));
				columns.push(new nlobjSearchColumn('custrecord_inv_approver_role1'));				
				
				var srchResults = nlapiSearchRecord('customrecord_inv_approval_matrix', null, filters, columns);
				if(_validateData(srchResults) && srchResults.length > 0)
				{					
					var approverRole1 	= srchResults[0].getValue('custrecord_inv_approver_role1');
					nlapiLogExecution('debug', 'approverRole1', approverRole1);
					
					// Buttons for Approver 1
					if(approverRole1.indexOf(currContext.getRole()) != -1){						
						var apprvStr = _getApproveStr('custbody_inv_finance_hold', 'F');
						form.addButton('custpage_clearhold','Clear Hold',apprvStr);					
					}
				}
			}
		}// end of recType =='salesorder'
		else if(recType =='customer'){
			var currAppStatus	= nlapiGetFieldValue('custentity_inv_approval_status');						
			if(currAppStatus == PENDING_APPROVAL){
				filters.push(new nlobjSearchFilter('isinactive', null, 'is', false));
				filters.push(new nlobjSearchFilter('custrecord_inv_approval_subsidiary', null, 'anyof', subsidiary));
				filters.push(new nlobjSearchFilter('custrecord_inv_entity_type', null, 'anyof', ENTITY_TYPE_CUSTOMER));			
				columns.push(new nlobjSearchColumn('custrecord_inv_approval_status'));
				columns.push(new nlobjSearchColumn('custrecord_inv_approver_role1'));				
				
				var srchResults = nlapiSearchRecord('customrecord_inv_approval_matrix', null, filters, columns);
				if(_validateData(srchResults) && srchResults.length > 0)
				{					
					var approverRole1 	= srchResults[0].getValue('custrecord_inv_approver_role1');
					
					// Buttons for Approver 1
					if(approverRole1.indexOf(currContext.getRole()) != -1){						
						var apprvStr = _getApproveStr2('custentity_inv_approval_status', APPROVED);
						form.addButton('custpage_apprv','Approve',apprvStr);
						
						//var rejectStr = _getRejectStr('custentity_inv_approval_status', REJECTED);						
						//form.addButton("custpage_reject",'Reject', rejectStr); 
					}
				}
			}
		} // end of recType =='customer'
		else if(recType =='purchaseorder'){			
			var currAppStatus	= nlapiGetFieldValue('approvalstatus');
			var customAppStatus	= nlapiGetFieldValue('custbody_inv_po_approval_status');
			var intercoSub		= nlapiGetFieldValue('custbody_inv_intercompany_subsidiary');	
			var poCategory		= nlapiGetFieldValue('custbody_inv_po_category');		
			if(currAppStatus == PENDING_APPROVAL){
				filters.push(new nlobjSearchFilter('isinactive', null, 'is', false));
				filters.push(new nlobjSearchFilter('custrecord_inv_approval_subsidiary', null, 'anyof', subsidiary));
				filters.push(new nlobjSearchFilter('custrecord_inv_txn_type', null, 'anyof', TXN_TYPE_PURCHASEORDER));
				
				if(_validateData(poCategory))
					filters.push(new nlobjSearchFilter('custrecord_inv_po_category', null, 'anyof', poCategory));
								
				columns.push(new nlobjSearchColumn('custrecord_inv_approval_status'));
				columns.push(new nlobjSearchColumn('custrecord_inv_approver_role1'));
				columns.push(new nlobjSearchColumn('custrecord_inv_approver_role2'));			
				
				var srchResults = nlapiSearchRecord('customrecord_inv_approval_matrix', null, filters, columns);
				if(_validateData(srchResults) && srchResults.length > 0)
				{					
					var approverRole1 	= srchResults[0].getValue('custrecord_inv_approver_role1');
					var approverRole2 	= srchResults[0].getValue('custrecord_inv_approver_role2');					
										
					if(customAppStatus == 1 && approverRole1.indexOf(currContext.getRole()) != -1){
						if(_validateData(approverRole2))
							var apprvStr 	= _getApproveStr('custbody_inv_po_approval_status', 2);
						else
							var apprvStr 	= _getApproveStr3('custbody_inv_po_approval_status', 3);
						
						form.addButton('custpage_apprv','Approve',apprvStr);					
					}					
					
					if(customAppStatus == 2 && approverRole2.indexOf(currContext.getRole()) != -1){
						var apprvStr 	= _getApproveStr3('custbody_inv_po_approval_status', 3);						
						form.addButton('custpage_apprv','Approve',apprvStr);
					}
					
				}
			}
		}
		
	} // end of type == 'view'
}


function _getApproveStr(fieldToUpdate, updatedStatus)
{
	var apprvStr = "";
	
	apprvStr = "javascript:";
	apprvStr += "try{";
	//apprvStr += "var Obj = nlapiLoadRecord(nlapiGetRecordType(),nlapiGetRecordId());";					
	//apprvStr += "Obj.setFieldValue('"+fieldToUpdate+"', "+updatedStatus+");";
		
	apprvStr += "nlapiSubmitField(nlapiGetRecordType(), nlapiGetRecordId(), '"+fieldToUpdate+"', '"+updatedStatus+"');";	
	//apprvStr += "nlapiSubmitRecord(Obj);";
	apprvStr += "window.location.reload();";
	apprvStr += "}catch(e){alert(e.message);}";
	
	return apprvStr;
}

//function _getApproveItemStr(fieldsToUpdate, setValues)
function _getApproveStr2(fieldToUpdate, updatedStatus)
{
	var apprvStr = "";					
	apprvStr = "javascript:";
	apprvStr += "try{";
	apprvStr += "var Obj = nlapiLoadRecord(nlapiGetRecordType(),nlapiGetRecordId());";
	apprvStr += "Obj.setFieldValue('"+fieldToUpdate+"', "+updatedStatus+");";
	//apprvStr += "Obj.setFieldValue('custitem_inv_appproval_status', "+APPROVED_ITEM+");";
	apprvStr += "Obj.setFieldValue('isinactive', 'F');";	
	apprvStr += "nlapiSubmitRecord(Obj);";
	apprvStr += "window.location.reload();";
	apprvStr += "}catch(e){alert(e.message);}";
	
	return apprvStr;
}

function _getApproveStr3(fieldToUpdate, updatedStatus)
{
	var apprvStr = "";					
	apprvStr = "javascript:";
	apprvStr += "try{";
	apprvStr += "var Obj = nlapiLoadRecord(nlapiGetRecordType(),nlapiGetRecordId());";
	apprvStr += "Obj.setFieldValue('"+fieldToUpdate+"', "+updatedStatus+");";
	apprvStr += "Obj.setFieldValue('approvalstatus', 2);";	
	apprvStr += "nlapiSubmitRecord(Obj);";
	apprvStr += "window.location.reload();";
	apprvStr += "}catch(e){alert(e.message);}";
	
	return apprvStr;
}

function _getRejectBillStr(fieldToUpdate, updatedStatus)
{	
	var rejectStr = "";
	var msg		= "Are you sure, you want to reject this bill?";
	rejectStr = "javascript:";
	rejectStr +="try {if(confirm('"+msg+"') == true) {";
	rejectStr += "var Obj = nlapiLoadRecord(nlapiGetRecordType(),nlapiGetRecordId());";
	rejectStr += "var tranid = Obj.getFieldValue('tranid');";
	rejectStr += "var tranid = tranid+' Rejected';";
	rejectStr += "Obj.setFieldValue('"+fieldToUpdate+"',"+updatedStatus+");";
	rejectStr += "Obj.setFieldValue('tranid', tranid);";
	rejectStr += "var recId = nlapiSubmitRecord(Obj,true);";
	//rejectStr += "alert('recId====>>'+recId);";
	rejectStr += "window.location.reload();";
	rejectStr +="}}";
	rejectStr += "catch(e){";
	//rejectStr += "alert('Error1:====>>'+e.getDetails());";
	rejectStr += "window.location.reload()";
	rejectStr += "}";
	
	return rejectStr;
}

function _getRejectStr(fieldToUpdate, updatedStatus)
{	
	var rejectStr = "";
	var msg		= "Are you sure about rejection? You can add reasons for rejection under User Note tab.";
	rejectStr = "javascript:";
	rejectStr +="try {if(confirm('"+msg+"') == true) {";
	rejectStr += "var Obj = nlapiLoadRecord(nlapiGetRecordType(),nlapiGetRecordId());";
	rejectStr += "Obj.setFieldValue('"+fieldToUpdate+"',"+updatedStatus+");";
	rejectStr += "var recId = nlapiSubmitRecord(Obj,true);";
	//rejectStr += "alert('recId====>>'+recId);";
	rejectStr += "window.location.reload();";
	rejectStr +="}}";
	rejectStr += "catch(e){";
	//rejectStr += "alert('Error1:====>>'+e.getDetails());";
	rejectStr += "window.location.reload()";
	rejectStr += "}";
	
	return rejectStr;
}

/*
// Item Type
[{"value":"","text":""},{"value":"5","text":"Assembly/Bill of Materials"},{"value":"11","text":"Description"},{"value":"8","text":"Discount"},{"value":"17","text":"Download Item"},{"value":"16","text":"End of Item Group"},{"value":"19","text":"Expense"},{"value":"18","text":"Gift Certificate"},{"value":"1","text":"Inventory Item"},{"value":"7","text":"Item Group"},{"value":"6","text":"Kit/Package"},{"value":"9","text":"Markup"},{"value":"2","text":"Non-inventory Item"},{"value":"4","text":"Other Charge"},{"value":"12","text":"Payment"},{"value":"14","text":"Sales Tax Group"},{"value":"13","text":"Sales Tax Item"},{"value":"3","text":"Service"},{"value":"15","text":"Shipping Cost Item"},{"value":"10","text":"Subtotal"},{"value":"20","text":"{Subscription Plan}"}]



// Transaction Type
[{"value":"","text":""},{"value":"34","text":"Assembly Build"},{"value":"35","text":"Assembly Unbuild"},{"value":"17","text":"Bill"},{"value":"20","text":"Bill Credit"},{"value":"18","text":"Bill Payment"},{"value":"42","text":"Bin Putaway Worksheet"},{"value":"45","text":"Bin Transfer"},{"value":"29","text":"Cash Refund"},{"value":"5","text":"Cash Sale"},{"value":"22","text":"CCard Refund"},{"value":"3","text":"Cheque"},{"value":"21","text":"Credit Card"},{"value":"10","text":"Credit Memo"},{"value":"36","text":"Currency Revaluation"},{"value":"40","text":"Customer Deposit"},{"value":"30","text":"Customer Refund"},{"value":"4","text":"Deposit"},{"value":"41","text":"Deposit Application"},{"value":"6","text":"Estimate"},{"value":"28","text":"Expense Report"},{"value":"52","text":"Finance Charge"},{"value":"70","text":"GL Impact Adjustment"},{"value":"11","text":"Inventory Adjustment"},{"value":"57","text":"Inventory Count"},{"value":"14","text":"Inventory Distribution"},{"value":"12","text":"Inventory Transfer"},{"value":"13","text":"Inventory Worksheet"},{"value":"7","text":"Invoice"},{"value":"32","text":"Item Fulfillment"},{"value":"16","text":"Item Receipt"},{"value":"1","text":"Journal"},{"value":"37","text":"Opportunity"},{"value":"9","text":"Payment"},{"value":"59","text":"Purchase Contract"},{"value":"15","text":"Purchase Order"},{"value":"33","text":"Return Authorisation"},{"value":"31","text":"Sales Order"},{"value":"23","text":"Sales Tax Payment"},{"value":"8","text":"Statement Charge"},{"value":"50","text":"Tegata Payable"},{"value":"49","text":"Tegata Receivable"},{"value":"2","text":"Transfer"},{"value":"48","text":"Transfer Order"},{"value":"43","text":"Vendor Return Authorization"},{"value":"44","text":"Work Order"}]


Entity Type
[{"value":"","text":""},{"value":"4","text":"Contact"},{"value":"2","text":"Customer"},{"value":"3","text":"Employee"},{"value":"12","text":"Generic Resource"},{"value":"9","text":"Group"},{"value":"5","text":"Other Name"},{"value":"10","text":"Partner"},{"value":"6","text":"Project"},{"value":"13","text":"Project Template"},{"value":"1","text":"Supplier"}]

*/