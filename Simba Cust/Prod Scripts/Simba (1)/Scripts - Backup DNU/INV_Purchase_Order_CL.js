/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version  Date            Author          Remarks
 * 1.00     25 May 2018		Supriya G		This script is used to set the item MFM and update the rate
 * 
 */


function PurchaseOrder_PI(type){
	/* var customform 	= nlapiGetFieldValue('customform');
	 if(customform == FRM_PO_IC_MAGNUM){
		nlapiDisableLineItemField('item', 'rate', true);	
	} */
	
	if(type == 'copy'){
		nlapiSetFieldValue('approvalstatus', 1);
		nlapiSetFieldValue('custbody_inv_po_approval_status', 1);
	}
	if(type == 'create'){
		nlapiSetFieldValue('approvalstatus', 1);
		customform 	= nlapiGetFieldValue('customform');
		
		// If Outsourced Process Order
		if(customform == 196){
			var woId 		= gup('woid');
			if(_validateData(woId)){				
				var woObj		= nlapiLoadRecord('workorder', woId);
				
				nlapiSetFieldValue('custbody_inv_wo_ref', woId);
				nlapiSetFieldValue('entity', woObj.getFieldValue('custbody_inv_supplier'));
				nlapiSetFieldValue('subsidiary', woObj.getFieldValue('subsidiary'));
				//nlapiSetFieldValue('location', woObj.getFieldValue('location'));
				
				var lineCount	= woObj.getLineItemCount('item');
				for(var i = 1; i<=lineCount; i++) {
					if(woObj.getLineItemValue('item', 'itemtype', i) == 'Service'){						
						nlapiSelectNewLineItem('item');						
						nlapiSetCurrentLineItemValue('item', 'item', woObj.getLineItemValue('item', 'item', i),true,true);
						nlapiSetCurrentLineItemValue('item', 'quantity', woObj.getLineItemValue('item', 'quantity', i),true,true);
						nlapiSetCurrentLineItemValue('item', 'rate', 0 ,true,true);
						nlapiCommitLineItem('item');
					}
				}
			}
		}
	}
}

/* function PurchaseOrder_SR(){	
	var customform 	= nlapiGetFieldValue('customform');
	if(customform == FRM_PO_IC_MAGNUM){
		var entity 			= nlapiGetFieldValue('entity');
		var actualSupplier 	= nlapiGetFieldValue('custbody_inv_actual_supplier');
		
		if(_validateData(entity)){
			//alert(entity);
			var vendorCat 		= nlapiLookupField('vendor', entity, 'category');			
			if(vendorCat != 7){
				alert('Please select Intercompany Magnum Supplier only');
				return false;
			}
			
			if(!_validateData(actualSupplier)){
				alert('Please select actual supplier.');
				return false;
			}
		}
	}
	
	return true;
} */

function PurchaseOrder_FC(type, name){
	var customform 	= nlapiGetFieldValue('customform');	
	/* if(customform == FRM_PO_IC_MAGNUM && type == 'item' && name == 'custcol_inv_actual_supplier_rate'){
		var actualRate		= nlapiGetCurrentLineItemValue('item', 'custcol_inv_actual_supplier_rate');
		var itemMfm			= nlapiGetCurrentLineItemValue('item', 'custcol_inv_mfm');
		
		if(_validateData(actualRate)){
			var itemMfm 		= parseInt(itemMfm);		
			if(itemMfm > 0){
				var newrate 	= Number(actualRate) + Number((Number(actualRate) * Number(itemMfm))/100);
				newrate 		= newrate.toFixed(2);
				nlapiSetCurrentLineItemValue('item', 'rate', newrate, false, false);
			}else {
				nlapiSetCurrentLineItemValue('item', 'rate', Number(actualRate), false, false);
			}
		}
	} */
		
	if(type == 'item' && name == 'custcol_os_delivery_request_date'){	
		var expectedReceiptDt		= nlapiGetCurrentLineItemValue('item', 'custcol_os_delivery_request_date');
		
		if(_validateData(expectedReceiptDt)){
			var dt 		= nlapiStringToDate(expectedReceiptDt, 'date');
			var m 		= dt.getMonth();
			var y 		= dt.getFullYear();		
			
			var demandPlanReceiptDt 	= new Date(y, m, 1);		
			demandPlanReceiptDt 		= nlapiDateToString(demandPlanReceiptDt, 'dd/mm/yyyy');			
			nlapiSetCurrentLineItemValue('item', 'expectedreceiptdate', demandPlanReceiptDt, false, false);
		}
	}
	
	if(name == 'custbody_inv_planned_etd'){
		var plannedEtd 			= nlapiGetFieldValue('custbody_inv_planned_etd');
		if(_validateData(plannedEtd)){
			var lines			= nlapiGetLineItemCount('item');
			for (var i = 1; i <= lines; i++) {
				var plannedEtdLine 	= nlapiGetLineItemValue('item', 'custcol_os_planned_etd', i);
				if(!_validateData(plannedEtdLine)){
					nlapiSetLineItemValue('item', 'custcol_os_planned_etd', i, plannedEtd);
				}
			}
		}
	}
	
	if(name == 'custbody_inv_original_etd'){
		var originalEtd			= nlapiGetFieldValue('custbody_inv_original_etd');
		if(_validateData(originalEtd)){
			var lines			= nlapiGetLineItemCount('item');
			for (var i = 1; i <= lines; i++) {
				var originalEtdLine 	= nlapiGetLineItemValue('item', 'custcol_kl_edt', i);
				if(!_validateData(originalEtdLine)){
					nlapiSetLineItemValue('item', 'custcol_kl_edt', i, originalEtd);
				}
			}
		}
	}
}

/* function PurchaseOrder_VL(type){
	var customform 		= nlapiGetFieldValue('customform');
	var actualRate		= nlapiGetCurrentLineItemValue('item', 'custcol_inv_actual_supplier_rate');
	var expectedRecDt	= nlapiGetCurrentLineItemValue('item', 'custcol_os_delivery_request_date');
	if(customform == FRM_PO_IC_MAGNUM && !_validateData(actualRate)){
		alert('Please enter a value for actual supplier rate.');
		return false;
	}
	
	if(!_validateData(expectedRecDt)){
		alert('Please enter a value for expected receipt date.');
		return false;
	}
	return true;
} */

function PurchaseOrder_PS(type, name){
	var customform 	= nlapiGetFieldValue('customform');	
	
	if(name == 'entity'){
		nlapiSetFieldValue('custbody_inv_intercompany_subsidiary', '');
		
		var entity				= nlapiGetFieldValue('entity');
		if(_validateData(entity)){
			var representingSub = nlapiLookupField('vendor', entity,'representingsubsidiary');
			if(_validateData(representingSub)){
				nlapiSetFieldValue('custbody_inv_intercompany_subsidiary', representingSub);
			}		
		}		
	}
	
	if(name == 'subsidiary'){
		var woId		= nlapiGetFieldValue('custbody_inv_wo_ref');
		if(_validateData(woId)){
			var woObj	= nlapiLoadRecord('workorder', woId);
			nlapiSetFieldValue('location', woObj.getFieldValue('location'));
		}
	}
	
	if(type == 'item' && name == 'item'){
		var itemId 				= nlapiGetCurrentLineItemValue('item', 'item');
		if(_validateData(itemId)){
			// Set Planned ETD and Original ETD
			var plannedEtd		= nlapiGetFieldValue('custbody_inv_planned_etd');
			var originalEtd		= nlapiGetFieldValue('custbody_inv_original_etd');			
			var plannedEtdLine 	= nlapiGetCurrentLineItemValue('item', 'custcol_os_planned_etd');
			var originalEtdLine	= nlapiGetCurrentLineItemValue('item', 'custcol_kl_edt');
						
			if(!_validateData(plannedEtdLine))
				nlapiSetCurrentLineItemValue('item', 'custcol_os_planned_etd', plannedEtd, false, false);
			if(!_validateData(originalEtdLine))
				nlapiSetCurrentLineItemValue('item', 'custcol_kl_edt', originalEtd, false, false);
			
			
			// Set EXPECTED RECEIPT DATE		
			var trandate			= nlapiGetFieldValue('trandate');
			var shipToCountry		= nlapiGetFieldValue('custbody_inv_ship_to_country');
			var supplierCountry		= nlapiGetFieldValue('custbody_inv_supplier_country');
			if(_validateData(shipToCountry) && _validateData(supplierCountry)){
				var transitTimeSearch 	= nlapiSearchRecord("customrecord_inv_transit_time",null,
											[
											   ["custrecord_inv_supplier_country","anyof",supplierCountry], 
											   "AND", 
											   ["custrecord_inv_ship_to_country","anyof", shipToCountry]
											], 
											[										  
											   new nlobjSearchColumn("custrecord_inv_transit_time_days")
											]
											);
				if(_validateData(transitTimeSearch) && transitTimeSearch.length > 0){
					var transitTime			= transitTimeSearch[0].getValue("custrecord_inv_transit_time_days");				
					var expectedReceiptDate	= nlapiDateToString(nlapiAddDays(nlapiStringToDate(trandate), Math.abs(transitTime)), 'dd/mm/yyyy');			
					nlapiSetCurrentLineItemValue('item', 'custcol_os_delivery_request_date', expectedReceiptDate, true, true);
				}
			}
			
			// For Intercompany PO Set Average Cost				
			var intercompSub		= nlapiGetFieldValue('custbody_inv_intercompany_subsidiary');
			var intercompLoc		= nlapiGetFieldValue('custbody_inv_intercompany_loc');
			
			if(_validateData(intercompSub) && _validateData(intercompLoc)){				
				var itemSearch 		= nlapiSearchRecord("item",null,
										[
										   ["internalidnumber","equalto",itemId], 
										   "AND", 
										   ["inventorylocation","anyof",intercompLoc]
										], 
										[									   
										   new nlobjSearchColumn("locationaveragecost")
										]
										);
				if(_validateData(itemSearch) && itemSearch.length > 0){
					var locAvgCost		= itemSearch[0].getValue("locationaveragecost");					
					nlapiSetCurrentLineItemValue('item', 'rate', locAvgCost, false, false);
				}
			}
		}
	}
}