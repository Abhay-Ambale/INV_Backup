/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version  Date            Author          Remarks
 * 1.00     31 May 2018		Supriya G		This script is used to
 * 
 */


function PurchaseOrder_BL(type, form){
	var currContext		= nlapiGetContext();
	var execContext		= currContext.getExecutionContext();
	
	/* if(type == 'create' && execContext == 'userinterface'){
		var customform 	= nlapiGetFieldValue('customform');
		if(customform == FRM_PO_IC_MAGNUM){
			var configRec		= nlapiLoadConfiguration('companypreferences');
			var MFM 			= configRec.getFieldValue('custscript_inv_mfm');
			
			//nlapiLogExecution('debug', 'MFM', MFM);
			nlapiSetFieldValue('custbody_inv_mfm', MFM);
		}
	} */
	
	if(type == 'create' || type == 'edit' || type == 'view' || type == 'copy'){
		//form.getField('custbody_inv_mfm').setDisplayType('hidden');
		form.getField('approvalstatus').setDisplayType('disabled');	
	}
	
	if(type == 'view'){
		var recId			= nlapiGetRecordId();
		var approvalstatus 	= nlapiGetFieldValue('approvalstatus');
		var woId 			= nlapiGetFieldValue('custbody_inv_wo_ref');
		var toId 			= nlapiGetFieldValue('custbody_inv_outsourced_to_ref');
		var intercoTrx		= nlapiGetFieldValue('intercotransaction');
		if(approvalstatus == '2' && _validateData(woId) && !_validateData(toId)){
			var toStr = '';
			toStr = "javascript:";
			toStr += "try{";			
			toStr += "window.location.href='/app/accounting/transactions/trnfrord.nl?woid="+woId+"&poid="+recId+"'";
			toStr += "}catch(e){alert(e);}";
			form.addButton('custpage_create_to','Create Transfer Order', toStr);
		}
		
		// Hide Close button : 19 Dec 18
		if(_validateData(intercoTrx)){
			var btnClose 	= form.getButton('closeremaining');
			var soRec		= nlapiLookupField('salesorder', intercoTrx, ['status']);
			var stats 		= soRec.status;
			if(stats != 'Closed' && btnClose != null){
				btnClose.setVisible(false);
			}
		}
		
		// Button to upload document
		if(ROLE_UPLOAD_FILE.indexOf(currContext.getRole()) != -1){
			var url = nlapiResolveURL('SUITELET', 'customscript_inv_upload_file', 'customdeploy_inv_upload_file')+'&tid=' + nlapiGetRecordId() + '&recordType=' + nlapiGetRecordType()+'&l=T';
			
			var toStr = '';
			toStr = "javascript:";
			toStr += "try{";			
			//toStr += "window.location.href='"+url+"'";
			toStr += "window.open('"+url+"','Upload File', 'width=500,height=250, top=200, left=350');";
			toStr += "}catch(e){alert(e);}";
			form.addButton('custpage_upload_file','Upload File', toStr);
		}
	}
	
	if(type == 'copy'){		
		var lineCnt = nlapiGetLineItemCount('item');		
		for(var i=1;i<=lineCnt;i++){
			nlapiSetLineItemValue('item', 'custcol_kl_quantity_shipped', i, '');
			nlapiSetLineItemValue('item', 'custcol_os_shipment_ref', i, '');
			nlapiSetLineItemValue('item', 'custcol_kl_shipment_header', i, '0');
		}
	}
}

function PurchaseOrder_BS(type){
	var currContext		= nlapiGetContext();
	var execContext		= currContext.getExecutionContext();
	var customform 	    = nlapiGetFieldValue('customform');
	nlapiLogExecution('DEBUG','customform','customform->>'+customform);
	
	if(type == 'create' && execContext == 'userinterface'){
		var intercoSub		= nlapiGetFieldValue('custbody_inv_intercompany_subsidiary');
		nlapiLogExecution('debug', 'intercompany_subsidiary', intercoSub);
		
		if(_validateData(intercoSub)){
			nlapiSetFieldValue('custbody_inv_po_approval_status', 3);
			nlapiSetFieldValue('approvalstatus', 2);
		}			
	}

  	//Added by Prajval on 11 June 2019 ================
	if((type == 'create' || type == 'edit') && execContext == 'csvimport')
	{
		var itemArr		= [];
		var trandate	= nlapiGetFieldValue('trandate');
		var outside120	= nlapiGetFieldValue('custbody_inv_forecast_outside_120_days');
		var leadDays	= _getSupplierLeadDays();
		var etaWhDate	= nlapiDateToString(nlapiAddDays(nlapiStringToDate(trandate), Math.abs(leadDays)), 'dd/mm/yyyy');
		var lineCnt 	= nlapiGetLineItemCount('item');
		
		for(var i=1;i<=lineCnt;i++)
		{
			if(type == 'create')
			{
				if(outside120 == 'F') {
					nlapiSetLineItemValue('item', 'custcol_os_delivery_request_date', i, etaWhDate);			
				}
				
				var expRecpDate = nlapiGetLineItemValue('item','custcol_os_delivery_request_date',i);
				if(_validateData(expRecpDate))
				{
					var dt = nlapiStringToDate(expRecpDate,'date');				
					var m  = dt.getMonth();				
					var y  = dt.getFullYear();				
					var demandPlanReceiptDt = new Date(y, m, 1);				
					demandPlanReceiptDt 	= nlapiDateToString(demandPlanReceiptDt, 'dd/mm/yyyy');	
					nlapiSetLineItemValue('item','expectedreceiptdate',i,demandPlanReceiptDt);
				}
			}
			
			// Set rate as item's location avg cost
			var itemId		= nlapiGetLineItemValue('item','item',i);	
			itemArr.push(itemId);
			
		} // end of for
		
		if(itemArr.length > 0){
			var itemLocAvgCostArr 	= _getLocationAvgCost(itemArr);			
			if(itemLocAvgCostArr.length > 0){
				nlapiSetFieldValue('approvalstatus', 2);
				for(var i=1; i<=lineCnt; i++)	{
					var itemId		= nlapiGetLineItemValue('item','item',i);
					if(_validateData(itemLocAvgCostArr[itemId])){
						nlapiSetLineItemValue('item', 'rate', i, itemLocAvgCostArr[itemId]);
					}
				} // end of for
			}
		}
	}
	
	//=================================================
	//Added by Prajval on 6 Feb 2020 ================
	if(type == 'create' && execContext == 'csvimport' && customform == FRM_PO_1SG_PROCU)//.1 SG Purchase Order - Procurement Form
	{
		var lineCnt = nlapiGetLineItemCount('item');
		var AllItem = [];
		var data = '';
		var indx=1;
		if(lineCnt > 0)
		{
			for(var k=1;k<=lineCnt;k++)
			{
				var item = nlapiGetLineItemValue('item','item',k);
				var itemTxt = nlapiGetLineItemText('item','item',k);
				var qty  = nlapiGetLineItemValue('item','quantity',k);
				if(_validateData(item))
				{
					var itemRec		= nlapiLookupField('item', item, ['custitem_os_identification']);
					var packQty 	= itemRec.custitem_os_identification;
					if(Number(packQty) > 0){
						var recQty 	= Math.floor(Number(qty)/Number(packQty))*Number(packQty);
						var maxrecQty = Math.ceil(Number(qty)/Number(packQty))*Number(packQty);
						if(recQty != qty || maxrecQty != qty)
						{
							AllItem.push(itemTxt);
							data += indx+')Item '+itemTxt+'- Recommended Qty '+recQty+' or '+maxrecQty+', ';
							indx++;
						}
					}
				}
			}
			if(_validateData(AllItem))
			{
				var fileInfo = data.substring(0,data.length-2);
				var mailInfo = fileInfo.replace(',','<br/>');
				var CurrUser = nlapiGetUser();
				
				nlapiSendEmail(CurrUser,CurrUser,'Quantity on PO Lines not in Multiples','The PO Upload has generated an error, since the following Items are not in Multiples of Carton Quantity:<br/>'+mailInfo);
				
				throw nlapiCreateError('Quantity on PO Lines not in Multiples','Given items are not in Multiples of Carton Quantity. '+fileInfo, true);
			}
			
		}
	}
	//=================================================
}

// get Items Intercomapny Location Average Cost
function _getLocationAvgCost(itemArr) {	
	var itemLocAvgCostArr	= [];
	var intercompSub	= nlapiGetFieldValue('custbody_inv_intercompany_subsidiary');
	var intercompLoc	= nlapiGetFieldValue('custbody_inv_intercompany_loc');
	
	if(_validateData(intercompSub) && _validateData(intercompLoc)){				
		var itemSearch 	= nlapiSearchRecord("item",null,
							[
							   ["internalid","anyof",itemArr], 
							   "AND", 
							   ["inventorylocation","anyof",intercompLoc]
							], 
							[									   
							   new nlobjSearchColumn("internalid"),
							   new nlobjSearchColumn("locationaveragecost")
							]
							);
		if(_validateData(itemSearch) && itemSearch.length > 0){
			for(var i = 0; i<itemSearch.length; i++){
				var internalid	= itemSearch[i].getValue("internalid");
				var locAvgCost	= itemSearch[i].getValue("locationaveragecost");
				
				itemLocAvgCostArr[internalid] = locAvgCost;
			}
							
		}			
	}	
	return itemLocAvgCostArr;
}

function PurchaseOrder_AS(type){
	var poId 			= nlapiGetRecordId();
	var currContext		= nlapiGetContext();
	var execContext		= currContext.getExecutionContext();
	var poRefs			= [];
	
	nlapiLogExecution('debug', 'PurchaseOrder_AS type', type);
	nlapiLogExecution('debug', 'execContext', execContext);
	
	if(type == 'create' && execContext == 'userinterface'){
		var recId		= nlapiGetRecordId();
		var customform 	= nlapiGetFieldValue('customform');
		if(customform == 196){
			var woId 	= nlapiGetFieldValue('custbody_inv_wo_ref');
			nlapiLogExecution('debug', 'woId', woId);
			if(_validateData(woId)){				
				var woObj		= nlapiLoadRecord('workorder', woId);
				poRef 			= woObj.getFieldValues('custbody_inv_process_order_refs');
				nlapiLogExecution('debug', 'poRef', poRef);			
				
				if(_validateData(poRef)) {
					poRefs 		= [].concat(poRef);					
					
				}
				nlapiLogExecution('debug', 'poRefs 1', poRefs);
				poRefs.push(recId);
				nlapiLogExecution('debug', 'poRef 2', poRef);
				
				woObj.setFieldValue('custbody_inv_process_order_refs', [].concat(poRefs));
				nlapiSubmitRecord(woObj);
			}
		}
	}
	
	// If PO Approval through the Mass Update set the Approval Status as approved
	if(type == 'xedit' && execContext == 'userevent'){
		var poApproval		= nlapiGetFieldValue('custbody_inv_po_approval_status');
				
		if(poApproval == 3){
			var poRec 			= nlapiLoadRecord('purchaseorder', poId);
			var approvalStatus 	= poRec.getFieldValue('approvalstatus');
			if(approvalStatus == 1){
				poRec.setFieldValue('approvalstatus', 2);
				nlapiSubmitRecord(poRec);
			}
		}
	}
	
	if(type == 'edit'){		
		//_sendEmailOnPOApproval(type);		
	}
}

function _sendEmailOnPOApproval(type)
{	
	var createdByName	= '';
	if(type == 'edit'){
		try{
			var oldRecord 		= nlapiGetOldRecord();
			var apprStatusOld 	= oldRecord && oldRecord.getFieldValue('approvalstatus');			
			
			var poId 			= nlapiGetRecordId();
			var poRec 			= nlapiLoadRecord('purchaseorder', poId);
			var tranid 			= poRec.getFieldValue('tranid');
			var approvalstatus	= poRec.getFieldValue('approvalstatus');
			var createdBy 		= poRec.getFieldValue('recordcreatedby');				
			
			nlapiLogExecution('debug', 'tranid', tranid);
			nlapiLogExecution('debug', 'createdBy', createdBy);
			
			if(apprStatusOld == '1' && approvalstatus == '2'){				
				var poLink			= '<a href="https://system.na2.netsuite.com/app/accounting/transactions/purchord.nl?id='+poId+'" target="_blank">'+tranid+'</a>';
								
				if(_validateData(createdBy)){
					var empRec		= nlapiLookupField('employee', createdBy, ['firstname']);
					createdByName 	= empRec.firstname;
				}
				
				var fromEmail		= EMAIL_NOTIFICATION_ID;  // Employee : Simba Notifications
				var subject			= 'SIMBA : Purchase Order Approved : '+tranid;
				var body			= '<p>Hi '+createdByName+',</p>';
				body				+= '<p>Purchase Order '+poLink+' has been approved. Please do the needful.</p>';
				body				+= '<p>Regards</p>';
				
				var emailToId		= createdBy;			
				
				nlapiLogExecution('debug', 'emailToId', emailToId);
				nlapiLogExecution('debug', 'createdByName', createdByName);							
				
				if(_validateData(emailToId)){		
					nlapiSendEmail(fromEmail, emailToId, subject, body, null, null, null, null, null);
					nlapiSendEmail(fromEmail, 28377, subject, body, null, null, null, null, null);
				}
			}
		}
		catch(e){
			nlapiLogExecution('ERROR','ERROR',e)
		}
	}
}

function _getSupplierLeadDays()
{
	var leadDays		= 0;
	var vendorId		= nlapiGetFieldValue('entity');	
	if(_validateData(vendorId)){	
		var vendorRec	= nlapiLookupField('vendor', vendorId, ['custentity_inv_lead_days']);
		leadDays 		= vendorRec.custentity_inv_lead_days;
	}
	
	return leadDays;
}

// Transit Time is calculated as per new custom record 'Transit Time Port'
function _getTransitTime(deptPort, destPort)
{
	var transitTime		= '';	
	if(_validateData(deptPort) && _validateData(destPort)){
		var transitTimeSearch 	= nlapiSearchRecord("customrecord_inv_transit_time_port",null,
										[
										   ["custrecord_inv_departure_port","anyof",deptPort], 
										   "AND", 
										   ["custrecord_inv_destination_port","anyof", destPort]
										], 
										[										  
										   new nlobjSearchColumn("custrecord_inv_transit_time_port_days")
										]
									);
		if(_validateData(transitTimeSearch) && transitTimeSearch.length > 0){
			transitTime			= transitTimeSearch[0].getValue("custrecord_inv_transit_time_port_days");
		}
	}
	
	return transitTime;
}