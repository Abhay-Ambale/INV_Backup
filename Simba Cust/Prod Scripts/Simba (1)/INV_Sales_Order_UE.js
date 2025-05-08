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
	var filters			= [];
	var columns			= [];
		
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
		
       if(type == 'copy') {
			nlapiSetFieldValue('custbody_inv_hold_until_paid', '');
			nlapiSetFieldValue('custbody_kl_packing_instructions', '');
		}
		
		
		// Andrews Change Request :
		// When {source} = Web Services AND (Created By = SPS Commerce (InternalID#6438) OR Joyce A Guerrero (InternalID#162934)) AND "WMS Transaction Status” = Picking OR Packing Then Disable Edit button
		if(type == 'view' || type == 'edit') {
			var soId			= nlapiGetRecordId();
			var source 			= nlapiGetFieldValue('source');
			var createdby 		= nlapiGetFieldValue('recordcreatedby');
			var wmsTraxStatus 	= nlapiGetFieldValue('custbody_sg_wms_transaction_status');
			
			//nlapiLogExecution('debug', '============ view source ', source);
			//nlapiLogExecution('debug', '============ view createdby ', createdby);
			//nlapiLogExecution('debug', '============ view wmsTraxStatus ', wmsTraxStatus);
			
			if(source == 'Web Services' && (createdby == '6438' || createdby == '162934') && (wmsTraxStatus =='6' || wmsTraxStatus == '7')){				
				if(type == 'view'){
					btnEdit 	= form.getButton('edit');
					if (btnEdit != null){
						btnEdit.setVisible(false);
					}
				}
				
				if(type == 'edit'){
					nlapiSetRedirectURL('RECORD','salesorder', soId, false, null);
				}
			}
		}
		// End
      
		if(type == 'view') {			
			var financeHold = nlapiGetFieldValue('custbody_inv_finance_hold');
			if(_validateData(financeHold) && financeHold == 'T'){
				form.setTitle('On Finance Hold');
				btnFulfill 	= form.getButton('process');
				if (btnFulfill != null){
					btnFulfill.setVisible(false);
				}
			}
			
			var soId 		= nlapiGetRecordId();
			var entity 		= nlapiGetFieldValue('entity');
			var orderstatus = nlapiGetFieldValue('orderstatus');
			var lineCnt = nlapiGetLineItemCount('item');
			//url = nlapiResolveURL('SUITELET','customscript_vst_tag_shipmnttrackr_ui_sl','customdeploy_vst_tag_shipmnttrackr_ui_sl');
			if(orderstatus == 'A' || orderstatus == 'B' || orderstatus == 'D' || orderstatus == 'E'){
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
}


function SalesOrder_BS(type){
	var currContext		= nlapiGetContext();
	var execContext		= currContext.getExecutionContext();
	var entity 			= nlapiGetFieldValue('entity');
	var filters			= [];
	var columns			= [];
	
	// For Intercompny SO, Checked Auto I/C IR
	var intercotrans	= nlapiGetFieldValue('intercotransaction');		
	//if(_validateData(intercotrans) && type == 'create'){
		//nlapiSetFieldValue('custbody_inv_auto_ic_ir', 'T');		
	//}
	
	nlapiLogExecution('debug', '============ SalesOrder_BS ', type);
	nlapiLogExecution('debug', 'execContext ', execContext);
	
	// Set Finance Hold and Order type as Online for Web Orders
	if(type == 'create' && execContext == 'suitelet'){	
		var etailOrderId	= nlapiGetFieldValue('custbody_celigo_etail_order_id');
		var magOrderId		= nlapiGetFieldValue('custbody_celigo_mag2_order_number');
		nlapiLogExecution('debug', '============ magOrderId ', magOrderId);
		if(_validateData(magOrderId)) {
			var subsidiary	= nlapiGetFieldValue('subsidiary');
			var shipmethod	= nlapiGetFieldValue('shipmethod');
			nlapiLogExecution('debug', 'subsidiary ', subsidiary);
			nlapiLogExecution('debug', 'shipmethod ', shipmethod);
						
			filters.push(new nlobjSearchFilter('isinactive', null, 'is', false));
			filters.push(new nlobjSearchFilter('custrecord_inv_ship_map_subsid', null, 'anyof', subsidiary));
			//filters.push(new nlobjSearchFilter('custrecord_inv_ship_map_magento', null, 'anyof', shipmethod));
							
			columns.push(new nlobjSearchColumn('custrecord_inv_ship_map_ns'));			
			
			var srchResults = nlapiSearchRecord('customrecord_inv_shipping_method_mapping', null, filters, columns);
			if(_validateData(srchResults) && srchResults.length > 0)
			{					
				var nsShippingMethod 	= srchResults[0].getValue('custrecord_inv_ship_map_ns');				
				nlapiLogExecution('debug', 'nsShippingMethod ', nsShippingMethod);
				
				nlapiSetFieldValue('shipmethod', nsShippingMethod);
			}			
			
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
		var subsidiary	= nlapiGetFieldValue('subsidiary');
		if(_validateData(entity)){
			var custRec 		= nlapiLoadRecord('customer', entity);
			var custClass 		= custRec.getFieldValue('custentity_inv_class');
			var budgetCat 		= custRec.getFieldValue('custentity_sg_customer_budget_category');			
					
			nlapiSetFieldValue('class', custClass);
			
			var manualApproval	= nlapiGetFieldValue('custbody_inv_manual_approval_req');
			if(manualApproval == 'T'){
				nlapiSetFieldValue('orderstatus', 'A');
			}
			
			// UnSet Finance Hold if order is for Outlet
			if(budgetCat == 16 && execContext == 'userinterface'){ // Budget Cat = 16 = Outlet
				nlapiSetFieldValue('custbody_inv_finance_hold', 'F');
			}
			
			var orderCat 		= nlapiGetFieldValue('custbody_inv_order_category');
			if(orderCat == ORDER_CAT_INTERCOMPANY && execContext == 'userinterface'){ // ORDER_CAT_INTERCOMPANY = 4 
				nlapiSetFieldValue('custbody_inv_finance_hold', 'F');
			}
			
			// UnSet Finance Hold if order is for USA = 17
			if(subsidiary == '17'){
				nlapiSetFieldValue('custbody_inv_finance_hold', 'F');
			}
		}
	}
	//Added by Prajval on 11 Aug 2020  to set shipping Method based on 'Customer Shipping Method' record
	if(type == 'create' || type == 'edit')
	{
		var entity = nlapiGetFieldValue('entity');
		var locat  = nlapiGetFieldValue('location');

		if(_validateData(entity) && _validateData(locat))
		{		
			var shipMeth = _getShipMethodData(entity,locat);
			nlapiLogExecution('DEBUG','shipMeth','shipMeth->>'+shipMeth);
			if(_validateData(shipMeth))
			{
				nlapiSetFieldValue('shipmethod',shipMeth,false)
			}
		}
		
		// DD TO Date (line) = Delivery By Date (Body), Expected Ship Date(line) = Ship date (Body)
		if(type == 'create')
		{
			var shipdate	= nlapiGetFieldValue('shipdate');
			var deliveryDt 	= nlapiGetFieldValue('custbody_os_delivereybydate');
			var lineCount	= nlapiGetLineItemCount('item');
			for(var i = 1; i<=lineCount; i++) {
				nlapiSetLineItemValue('item', 'custcol_os_delivery_date_to' , i, deliveryDt);
				
				var expectedshipdate = nlapiGetLineItemValue('item', 'expectedshipdate' , i);
				if(!_validateData(expectedshipdate)){
					nlapiSetLineItemValue('item', 'expectedshipdate' , i, shipdate);
				}			
			}
		}
	}
	//==
	
	//Added by Prajval on 21 Feb 19
	if(execContext == 'csvimport')
	{
		nlapiLogExecution('DEBUG','csvimport','code is run using csvimport->>'+execContext);
		var transDate		= "";
		var noOfDaysToAdd	= "";
		var varId			= "";
		var rsltDate		= "";
		var transfinalDate  = "";
		var rsltShipDate	= "";
		var rsltDeliveryDate = "";
		var ship			= "";
		var delivery		= "";
		var autocaldate		= "";
		var custFields      = ['custentity_inv_shipdate_add_days','custentity_inv_delivery_bydate_add_days','custentity_inv_auto_cal_delivery_date'];
		
		transDate		    = nlapiGetFieldValue('trandate');
     	varId			    = nlapiGetFieldValue('entity');
		if (_validateData(varId) &&  _validateData(transDate))
		{
			noOfDayToAdd	   =  nlapiLookupField('customer',varId,custFields);
			ship			   =  noOfDayToAdd.custentity_inv_shipdate_add_days;
			delivery		   =  noOfDayToAdd.custentity_inv_delivery_bydate_add_days;
			autocaldate        =  noOfDayToAdd.custentity_inv_auto_cal_delivery_date;
			if(autocaldate == 'T')
			{
				if(_validateData(ship) && ship > 0){					
					transfinalDate      =  nlapiStringToDate(transDate);			
					rsltShipDate	    =  CalcDate(transfinalDate,ship);
					nlapiSetFieldValue('shipdate',rsltShipDate,false,false);
				}
				else{
					nlapiSetFieldValue('shipdate',transDate,false,false);
				}
				if(_validateData(delivery) && delivery > 0){
					if(!_validateData(rsltShipDate)) rsltShipDate = transDate;
					transfinalDate      =  nlapiStringToDate(rsltShipDate);
					rsltDeliveryDate    =  CalcDate(transfinalDate,delivery);
					nlapiSetFieldValue('custbody_os_delivereybydate',rsltDeliveryDate,false,false);
					nlapiSetFieldValue('custbody_os_deliveredby',rsltDeliveryDate,false,false);
				}
				else{
					nlapiSetFieldValue('custbody_os_delivereybydate',transDate,false,false);
					nlapiSetFieldValue('custbody_os_deliveredby',transDate,false,false);
				}
			}
		}
	}
	//use to set ship date & delivery date on sales order from customer record
}

function SalesOrder_AS(type){
	var soId 			= nlapiGetRecordId();	
	var currContext		= nlapiGetContext();
	var execContext		= currContext.getExecutionContext();
	
	nlapiLogExecution('debug', 'SalesOrder_AS type soId ', soId);
	
	// Auto release Finance Hold based on the Overdue Balance Days and Credit limit should not beyond the Total unbilled outstanding
	if(type == 'create' && (execContext == 'userinterface' || execContext == 'csvimport')){			
		var soRec 			= nlapiLoadRecord('salesorder', soId);
		var entity 			= soRec.getFieldValue('entity');
		var orderCat		= soRec.getFieldValue('custbody_inv_order_category');
		var financeHold		= soRec.getFieldValue('custbody_inv_finance_hold');
		var subsidiary		= soRec.getFieldValue('subsidiary');
		if(_validateData(orderCat) && orderCat == ORDER_CAT_TRADING){
			var sendHoldEmail	= 1;
			var custRec 		= nlapiLoadRecord('customer', entity);
			var creditLimit 	= custRec.getFieldValue('creditlimit');
			var overdueBal 		= custRec.getFieldValue('overduebalance');
			var unbilledAmt 	= custRec.getFieldValue('unbilledorders');
			var overdueBalDays 	= custRec.getFieldValue('daysoverdue');
			var deposite 		= custRec.getFieldValue('depositbalance');
			var ediCustomer		= custRec.getFieldValue('custentity_inv_edicustomer');
			var total			= (Number(overdueBal) + Number(unbilledAmt)) - Number(deposite);
			
			// Do not process Finance Hold if order is for USA subsidiary = 17 and customer is EDI Customer
			//if(ediCustomer=='F'){
			if(ediCustomer=='F' && subsidiary != '17'){
				soRec.setFieldValue('custbody_inv_finance_hold', 'T'); // for csv set finiance hold = T
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
						sendHoldEmail	= 0;
					}		
				}			
				// Send email for SO On Finance Hold 
				if(sendHoldEmail == 1){				
					_sendEmailOnFinanceHold(soRec);
				}
				
				nlapiSubmitRecord(soRec,true);
			}
		}
		
		if(!_validateData(orderCat) && financeHold == 'T'){
			_sendEmailOnFinanceHold(soRec);
		}
	}	
	
	if(type == 'xedit' || (execContext == 'userinterface' || execContext == 'csvimport')){		
		_sendClearHoldEmail(type);		
	}
}

function _getShipMethodData(entity,locat)
{
	var resultData = '';
	var srchResults = nlapiSearchRecord("customrecord_inv_customer_shipping",null,
					[
					   ["isinactive","is","F"], 
					   "AND", 
					   ["custrecord_inv_cust_ship_customer","anyof",entity], 
					   "AND", 
					   ["custrecord_inv_cust_ship_location","anyof",locat]
					], 
					[
					   new nlobjSearchColumn("custrecord_inv_cust_ship_customer"), 
					   new nlobjSearchColumn("custrecord_inv_cust_ship_location"), 
					   new nlobjSearchColumn("custrecord_inv_cust_ship_shipping"),
					   new nlobjSearchColumn("internalid").setSort(true)
					]
				);
	nlapiLogExecution('DEBUG','srchResults','srchResults->>'+srchResults);
	if(_validateData(srchResults) && srchResults.length > 0)
	{
		var resultData = srchResults[0].getValue('custrecord_inv_cust_ship_shipping');
		nlapiLogExecution('DEBUG', 'resultData', 'resultData->>'+resultData);
	}
	return resultData;
}

function _sendEmailOnFinanceHold(soRec)
{
	var createdByName		= '';
	try{		
		var soId 			= nlapiGetRecordId();
		var tranid 			= soRec.getFieldValue('tranid');
		var entity			= soRec.getFieldText('entity');
		var financeHold		= soRec.getFieldValue('custbody_inv_finance_hold');
		var createdBy 		= soRec.getFieldValue('recordcreatedby');
		var orderCat 		= soRec.getFieldValue('custbody_inv_order_category');
		var subsidiary 		= soRec.getFieldValue('subsidiary');
		var filters 		= [];
		var columns 		= [];
		var emailArray 		= [];
				
		filters.push(new nlobjSearchFilter('isinactive', null, 'is', false));
		filters.push(new nlobjSearchFilter('custrecord_inv_approval_subsidiary', null, 'anyof', subsidiary));
		filters.push(new nlobjSearchFilter('custrecord_inv_txn_type', null, 'anyof', 31)); // Sales Order = 31
		filters.push(new nlobjSearchFilter('custrecord_inv_so_type', null, 'anyof', ORDER_CAT_TRADING));		
		columns.push(new nlobjSearchColumn('custrecord_inv_approver_role1'));
		
		var srchResults = nlapiSearchRecord('customrecord_inv_approval_matrix', null, filters, columns);	
		if(_validateData(srchResults) && srchResults.length > 0)
		{			
			var approverRole1 	= srchResults[0].getValue('custrecord_inv_approver_role1');
			nlapiLogExecution('debug', 'approverRole1', approverRole1);			
			
			approverRole1		= approverRole1.split(',');
			nlapiLogExecution('debug', 'approverRole1 2', approverRole1);			
			
			var employeeSearch = nlapiSearchRecord("employee",null,
									[
										["role","anyof", approverRole1],
									    "AND", 
										["role","noneof","3"],
										"AND", 
										["email","doesnotcontain","@invitratech.com"]
									], 
									[
									   new nlobjSearchColumn("internalid"), 
									   new nlobjSearchColumn("email")
									]
								);
			if(_validateData(employeeSearch) && employeeSearch.length > 0){				
				for (var i in employeeSearch) {
				  emailArray[i] = employeeSearch[i].getValue('email');
				}
			}			
		}		
		
		if(emailArray.length > 0){
			nlapiLogExecution('debug', 'emailArray', emailArray);
			
			var soLink			= '<a href="https://system.na2.netsuite.com/app/accounting/transactions/salesord.nl?id='+soId+'" target="_blank">'+tranid+'</a>';
			var fromEmail		= createdBy;
			var subject			= 'SIMBA : Sales Order On Finance Hold : '+tranid;
			var body			= '<p>Hello</p>';
			body				+= '<p>The Sales Order '+soLink+' against the customer <b>'+entity+'</b> is on Finance Hold. Please do the needful.</p>';
			body				+= '<p>Regards</p>';
			
			var records 			= new Object();
			records['transaction'] 	= soId;			
			nlapiSendEmail(fromEmail, emailArray, subject, body, null, null, records, null, null);
			//nlapiSendEmail(fromEmail, 'supriya@invitratech.com', subject, body, null, null, null, null, null);			
		}
	}
	catch(e){
		nlapiLogExecution('ERROR','ERROR',e)
	}
}

function _sendClearHoldEmail(type)
{	
	var createdByName	= '';
	if(type == 'xedit'){
		try{
			var oldRecord 		= nlapiGetOldRecord();
			var financeHoldOld 	= oldRecord && oldRecord.getFieldValue('custbody_inv_finance_hold');			
			
			var soId 			= nlapiGetRecordId();
			var soRec 			= nlapiLoadRecord('salesorder', soId);
			var tranid 			= soRec.getFieldValue('tranid');
			var financeHold		= soRec.getFieldValue('custbody_inv_finance_hold');
			var createdBy 		= soRec.getFieldValue('recordcreatedby');
			var orderCat 		= soRec.getFieldValue('custbody_inv_order_category');			
			
			nlapiLogExecution('debug', 'financeHoldOld', financeHoldOld);
			nlapiLogExecution('debug', 'financeHold', financeHold);
			
			if(financeHoldOld == 'T' && financeHold == 'F' && (orderCat == ORDER_CAT_TRADING || orderCat == '')){				
				var soLink			= '<a href="https://system.na2.netsuite.com/app/accounting/transactions/salesord.nl?id='+soId+'" target="_blank">'+tranid+'</a>';
				//nlapiLogExecution('debug', 'createdBy', createdBy);
				
				if(_validateData(createdBy)){
					var empRec		= nlapiLookupField('employee', createdBy, ['firstname']);
					createdByName 	= empRec.firstname;
				}
				
				var fromEmail		= EMAIL_NOTIFICATION_ID;  // Employee : Simba Notifications
				var subject			= 'SIMBA : Finance Hold Cleared for '+tranid;
				var body			= '<p>Hi '+createdByName+',</p>';
				body				+= '<p>Finance Hold has been cleared for the Sales Order '+soLink+'. Please do the needful.</p>';
				body				+= '<p>Regards</p>';
				
				var emailToId		= createdBy;			
				
				nlapiLogExecution('debug', 'createdBy', createdBy);
				nlapiLogExecution('debug', 'createdByName', createdByName);							
				
				var records 			= new Object();
				records['transaction'] 	= soId;	
			
				if(_validateData(emailToId)){		
					nlapiSendEmail(fromEmail, emailToId, subject, body, null, null, records, null, null);
					//nlapiSendEmail(fromEmail, 28377, subject, body, null, null, null, null, null);
				}
			}
		}
		catch(e){
			nlapiLogExecution('ERROR','ERROR',e)
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