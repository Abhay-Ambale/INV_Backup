/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version  Date            Author          Remarks
 * 1.00     4 Apr 2018		Supriya G		For Intercompny SO, Checked Auto I/C IR
 *											Auto Release Finance Hold if ourverdue balances within credit limit and overdue days within limit
 * 
 */
 
function SalesOrder_BL(type){
	var currContext		= nlapiGetContext();
	var execContext		= currContext.getExecutionContext();
	
	nlapiLogExecution('debug', 'type execContext', type+' => '+execContext);	
	if(execContext == 'userinterface'){
		if(type == 'create' || type == 'edit' || type == 'view' || type == 'copy') {
			form.getField('custbody_inv_finance_hold').setDisplayType('disabled');
			
			var orderCat	= nlapiGetFieldValue('custbody_inv_order_category');
			if(orderCat != ORDER_CAT_TRADING) {
				form.getField('custbody_inv_overdue_bal_days').setDisplayType('hidden');
				form.getField('custbody_inv_unbilled_orders_amt').setDisplayType('hidden');
				form.getField('custbody_inv_outstanding_balance').setDisplayType('hidden');
				form.getField('custbody_inv_total_unbilled_outstand').setDisplayType('hidden');
				form.getField('custbody_inv_deposit_bal_amt').setDisplayType('hidden');
			}	
		}
		
		if(type == 'edit') {
			form.getField('custbody_inv_order_category').setDisplayType('disabled');
		}
		
		if(type == 'view') {
			var financeHold = nlapiGetFieldValue('custbody_inv_finance_hold');
			if(_validateData(financeHold) && financeHold == 'T'){
				form.setTitle('On Finance Hold');
				btnFulfill 	= form.getButton('process');
				if (btnFulfill != null){
					btnFulfill.setVisible(false);
				}
			}
			
			var soId 	= nlapiGetRecordId();
			var entity 	= nlapiGetFieldValue('entity');
			var lineCnt = nlapiGetLineItemCount('item');
			//url = nlapiResolveURL('SUITELET','customscript_vst_tag_shipmnttrackr_ui_sl','customdeploy_vst_tag_shipmnttrackr_ui_sl');
			for(var i = 1; i <= lineCnt; i++)
			{				
				var line 		= nlapiGetLineItemValue('item', 'line', i);
				var itemId 		= nlapiGetLineItemValue('item', 'item', i);
				var itemtype 	= nlapiGetLineItemValue('item', 'itemtype', i);
				var qty		 	= nlapiGetLineItemValue('item', 'quantitybackordered', i);
				var woCat 		= nlapiGetLineItemValue('item', 'custcol_inv_wo_cat', i);
				var cwoid	 	= nlapiGetLineItemValue('item', 'custcol_inv_standalone_wo', i);
				var createwo 	= nlapiGetLineItemValue('item', 'createwo', i);
				var woid 		= nlapiGetLineItemValue('item', 'woid', i);
				if(!_validateData(cwoid) && !_validateData(woid) && itemtype == 'Assembly' && _validateData(woCat) && woCat == 3){
					var url 	= nlapiResolveURL('RECORD', 'workorder')+'&soid='+soId+'&soline='+line+'&entity='+entity+'&assemblyitem='+itemId+'&quantity='+qty;
					nlapiSetLineItemValue('item', 'custcol_inv_create_wo', i, '<a class="dottedlink" href="'+url+'">Create WO</a>');
				}
			}
		}
	}
}


function SalesOrder_BS(type){
	var currContext		= nlapiGetContext();
	var execContext		= currContext.getExecutionContext();
	var entity 			= nlapiGetFieldValue('entity');
	
	// For Intercompny SO, Checked Auto I/C IR
	var intercotrans	= nlapiGetFieldValue('intercotransaction');		
	if(_validateData(intercotrans) && type == 'create'){
		nlapiSetFieldValue('custbody_inv_auto_ic_ir', 'T');		
	}
	
	// Set Finance Hold and Order type as Online for Web Orders
	if(type == 'create' && execContext == 'suitelet'){
		var etailOrderId	= nlapiGetFieldValue('custbody_celigo_etail_order_id');		
		if(_validateData(etailOrderId)) {
			nlapiSetFieldValue('custbody_inv_finance_hold', 'T');
			nlapiSetFieldValue('custbody_inv_order_category', ORDER_CAT_ONLINE);
		}
	}
	
	// UnSet Finance Hold if order is for Outlet
	/* if(type == 'create' && execContext == 'userinterface'){
		var custRec 		= nlapiLoadRecord('customer', entity);
		var budgetCat 		= custRec.getFieldValue('custentity_sg_customer_budget_category');
		
		if(budgetCat == 16){ // Budget Cat = 16 = Outlet
			nlapiSetFieldValue('custbody_inv_finance_hold', 'F');
		}
	} */
	
	// Class
	if(type == 'create'){
		var entity		= nlapiGetFieldValue('entity');
		if(_validateData(entity)){
			var custRec 		= nlapiLoadRecord('customer', entity);
			var custClass 		= custRec.getFieldValue('custentity_inv_class');
			var budgetCat 		= custRec.getFieldValue('custentity_sg_customer_budget_category');
			
			nlapiSetFieldValue('class', custClass);
			
			// UnSet Finance Hold if order is for Outlet
			if(budgetCat == 16 && execContext == 'userinterface'){ // Budget Cat = 16 = Outlet
				nlapiSetFieldValue('custbody_inv_finance_hold', 'F');
			}
		}
	}
}

function SalesOrder_AS(type){
	var soId 			= nlapiGetRecordId();	
	var currContext		= nlapiGetContext();
	var execContext		= currContext.getExecutionContext();
	
	nlapiLogExecution('debug', 'type ', type);
	nlapiLogExecution('debug', 'execContext ', execContext);
	
	// Auto release Finance Hold based on the Overdue Balance Days and Credit limit should not beyond the Total unbilled outstanding
	if(type == 'create' && execContext == 'userinterface'){			
		var soRec 			= nlapiLoadRecord('salesorder', soId);
		var entity 			= soRec.getFieldValue('entity');
		var orderCat		= soRec.getFieldValue('custbody_inv_order_category');
		var financeHold		= soRec.getFieldValue('custbody_inv_finance_hold');
						
		if(_validateData(orderCat) && orderCat == ORDER_CAT_TRADING){			
			var custRec 		= nlapiLoadRecord('customer', entity);
			var creditLimit 	= custRec.getFieldValue('creditlimit');
			var overdueBal 		= custRec.getFieldValue('overduebalance');
			var unbilledAmt 	= custRec.getFieldValue('unbilledorders');
			var overdueBalDays 	= custRec.getFieldValue('daysoverdue');
			var deposite 		= custRec.getFieldValue('depositbalance');
			var total			= (Number(overdueBal) + Number(unbilledAmt)) - Number(deposite);
			
			soRec.setFieldValue('custbody_inv_outstanding_balance', Number(overdueBal));
			soRec.setFieldValue('custbody_inv_unbilled_orders_amt', Number(unbilledAmt));
			soRec.setFieldValue('custbody_inv_total_unbilled_outstand', Number(total));
			soRec.setFieldValue('custbody_inv_overdue_bal_days', Number(overdueBalDays));
			soRec.setFieldValue('custbody_inv_deposit_bal_amt', Number(deposite));
						
			if(_validateData(creditLimit)){
				var configRec			= nlapiLoadConfiguration('companypreferences');
				var maxOverDueAllowed 	= configRec.getFieldValue('custscript_inv_max_overdue_days_allowed');	
						
				if(!_validateData(total)) total = 0;
				if(!_validateData(overdueBalDays)) overdueBalDays = 0;
				
				//nlapiLogExecution('debug', 'total', total);			
				//nlapiLogExecution('debug', 'overdueBalDays', overdueBalDays);
				//nlapiLogExecution('debug', 'creditLimit', creditLimit);
				//nlapiLogExecution('debug', 'maxOverDueAllowed', maxOverDueAllowed);
				
				if(Number(maxOverDueAllowed) > Number(overdueBalDays) && Number(creditLimit) > Number(total)){
					nlapiLogExecution('debug', 'YES Unset Finance_hold', '');
					soRec.setFieldValue('custbody_inv_finance_hold', 'F');
				}
			}
			
			nlapiSubmitRecord(soRec,true);
		}
	}
}


/* function SalesOrder_BS(type){
	var currContext		= nlapiGetContext();
	var execContext		= currContext.getExecutionContext();
	var entity 			= nlapiGetFieldValue('entity');
	
	// For Intercompny SO, Checked Auto I/C IR
	var intercotrans	= nlapiGetFieldValue('intercotransaction');		
	if(_validateData(intercotrans) && type == 'create'){
		nlapiSetFieldValue('custbody_inv_auto_ic_ir', 'T');		
	}
	
	// Set Finance Hold and Order type as Online for Web Orders
	if(type == 'create' && execContext == 'suitelet'){
		var etailOrderId	= nlapiGetFieldValue('custbody_celigo_etail_order_id');		
		if(_validateData(etailOrderId)) {
			nlapiSetFieldValue('custbody_inv_finance_hold', 'T');
			nlapiSetFieldValue('custbody_inv_order_category', ORDER_CAT_ONLINE);
		}
	}
	
	// Auto release Finance Hold based on the Overdue Balance Days and Credit limit should not beyond the Total unbilled outstanding
	if(type == 'create' && execContext == 'userinterface'){		
		var orderCat		= nlapiGetFieldValue('custbody_inv_order_category');
		var financeHold		= nlapiGetFieldValue('custbody_inv_finance_hold');
		
		var custRec 		= nlapiLoadRecord('customer', entity);
		var budgetCat 		= custRec.getFieldValue('custentity_sg_customer_budget_category');
		
		if(budgetCat != 16){ // Budget Cat = 16 = Outlet
			nlapiSetFieldValue('custbody_inv_finance_hold', 'T');
		}
		if(_validateData(orderCat) && orderCat == ORDER_CAT_TRADING){			
			//var custRec		= nlapiLookupField('customer', entity, ['creditlimit', 'overduebalance', 'unbilledorders', 'daysoverdue']);
			var creditLimit 	= custRec.getFieldValue('creditlimit');
			var overdueBal 		= custRec.getFieldValue('overduebalance');
			var unbilledAmt 	= custRec.getFieldValue('unbilledorders');
			var overdueBalDays 	= custRec.getFieldValue('daysoverdue');
			var deposite 		= custRec.getFieldValue('depositbalance');
			var total			= (Number(overdueBal) + Number(unbilledAmt)) - Number(deposite);
			
			nlapiSetFieldValue('custbody_inv_outstanding_balance', Number(overdueBal));
			nlapiSetFieldValue('custbody_inv_unbilled_orders_amt', Number(unbilledAmt));
			nlapiSetFieldValue('custbody_inv_total_unbilled_outstand', Number(total));
			nlapiSetFieldValue('custbody_inv_overdue_bal_days', Number(overdueBalDays));
			nlapiSetFieldValue('custbody_inv_deposit_bal_amt', Number(deposite));
						
			if(_validateData(creditLimit)){
				var configRec			= nlapiLoadConfiguration('companypreferences');
				var maxOverDueAllowed 	= configRec.getFieldValue('custscript_inv_max_overdue_days_allowed');	
						
				if(!_validateData(total)) total = 0;
				if(!_validateData(overdueBalDays)) overdueBalDays = 0;
				
				//nlapiLogExecution('debug', 'total', total);			
				//nlapiLogExecution('debug', 'overdueBalDays', overdueBalDays);
				//nlapiLogExecution('debug', 'creditLimit', creditLimit);
				//nlapiLogExecution('debug', 'maxOverDueAllowed', maxOverDueAllowed);
				
				if(Number(maxOverDueAllowed) > Number(overdueBalDays) && Number(creditLimit) > Number(total)){
					nlapiLogExecution('debug', 'YES Unset Finance_hold', '');
					nlapiSetFieldValue('custbody_inv_finance_hold', 'F');
				}
			}
		}
	}
} */