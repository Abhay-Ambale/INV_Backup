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
				nlapiSetFieldValue('custbody_inv_po_category', 3); // PO Category = 3 = Outsourced PO 
				
				var lineCount	= woObj.getLineItemCount('item');
				for(var i = 1; i<=lineCount; i++) {
					if(woObj.getLineItemValue('item', 'itemtype', i) == 'Service'){						
						nlapiSelectNewLineItem('item');						
						nlapiSetCurrentLineItemValue('item', 'item', woObj.getLineItemValue('item', 'item', i),true,true);
						nlapiSetCurrentLineItemValue('item', 'quantity', woObj.getLineItemValue('item', 'quantity', i),true,true);
						nlapiSetCurrentLineItemValue('item', 'description', woObj.getLineItemValue('item', 'description', i),true,true);
						nlapiSetCurrentLineItemValue('item', 'rate', 0 ,true,true);
						nlapiCommitLineItem('item');
					}
				}
			}
		}
	}
}

function PurchaseOrder_SR(){	
	var entity		= nlapiGetFieldValue('entity');
	var poCat		= nlapiGetFieldValue('custbody_inv_po_category');
	var intercompLoc	= nlapiGetFieldValue('custbody_inv_intercompany_loc');
	if(_validateData(entity)){
		var representingSub = nlapiLookupField('vendor', entity,'representingsubsidiary');
		
		//console.log('PurchaseOrder_SR representingSub', representingSub);
		if(_validateData(representingSub)){
			nlapiSetFieldValue('custbody_inv_po_category', 4); // PO Category = 4 = Intercompany 
		
			if(!_validateData(intercompLoc)){
				alert('Please select Intercompany Location.');
				return false;
			}
		}
		
		if(!_validateData(representingSub) && poCat == '4'){
			alert('Purchase Order Category selected is Intercompany. Hence choose Intercomapny Supplier only.');
			return false;
		}
	}
	
	return true;
}

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
	
	if(name == 'location'){
		nlapiSetFieldValue('custbody_inv_intercompany_subsidiary', '');
		
		var entity				= nlapiGetFieldValue('entity');
		if(_validateData(entity)){
			var representingSub = nlapiLookupField('vendor', entity,'representingsubsidiary');
			console.log('representingSub FC', representingSub);
			if(_validateData(representingSub)){
				nlapiSetFieldValue('custbody_inv_intercompany_subsidiary', representingSub);
				nlapiSetFieldValue('custbody_inv_po_category', 4); // PO Category = 4 = Intercompany 
			}		
		}		
	}
	
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
			nlapiSetFieldValue('custbody_inv_forced_planned_etd', 'F');
			/* var lines			= nlapiGetLineItemCount('item');
			for (var i = 1; i <= lines; i++) {
				var plannedEtdLine 	= nlapiGetLineItemValue('item', 'custcol_os_planned_etd', i);
				if(!_validateData(plannedEtdLine)){
					nlapiSetLineItemValue('item', 'custcol_os_planned_etd', i, plannedEtd);					
				}
			} */
		}
	}
	
	if(name == 'custbody_inv_original_etd'){
		var originalEtd			= nlapiGetFieldValue('custbody_inv_original_etd');
		if(_validateData(originalEtd)){
			nlapiSetFieldValue('custbody_inv_forced_original_etd', 'F');
			/* var lines			= nlapiGetLineItemCount('item');
			for (var i = 1; i <= lines; i++) {
				var originalEtdLine 	= nlapiGetLineItemValue('item', 'custcol_kl_edt', i);
				if(!_validateData(originalEtdLine)){
					nlapiSetLineItemValue('item', 'custcol_kl_edt', i, originalEtd);
				}
			} */
		}
	}

	// Added on 23 Feb 2024
	if(type == 'item' && name == 'custcol_os_planned_etd'){
		// Set EXPECTED RECEIPT DATE		
		var plannedEtd			= nlapiGetCurrentLineItemValue('item', 'custcol_os_planned_etd');
		var deptPort			= nlapiGetFieldValue('custbody_inv_departure_port');
		var destPort			= nlapiGetFieldValue('custbody_inv_destination_port');
		var customform 			= nlapiGetFieldValue('customform');
		
		// SG Purchase Order - Procurement
		if(customform == 187) {
			if(!_validateData(deptPort) || !_validateData(destPort)){
				alert('Please select \'Departure Port\' and \'Destination Port\' in order to update \'ETA WH\' and \'Demand Plannned Receipt Date\'');
			}
			
			if(_validateData(deptPort) && _validateData(destPort) && _validateData(plannedEtd)){			
				var transitTime 	= _getTransitTime();
			
				if(_validateData(transitTime)){
					var etaWhDate	= nlapiDateToString(nlapiAddDays(nlapiStringToDate(plannedEtd), Math.abs(transitTime)), 'dd/mm/yyyy');
					nlapiSetCurrentLineItemValue('item', 'custcol_os_delivery_request_date', etaWhDate, true, true);
				}		
			}
		}
	}
	
	/* if(type == 'item' && name == 'custcol_os_planned_etd'){
		// Set EXPECTED RECEIPT DATE		
		var plannedEtd			= nlapiGetCurrentLineItemValue('item', 'custcol_os_planned_etd');	
		var deliveryDt			= nlapiGetCurrentLineItemValue('item', 'custcol_os_delivery_request_date');
		var shipToCountry		= nlapiGetFieldValue('custbody_inv_ship_to_country');
		var supplierCountry		= nlapiGetFieldValue('custbody_inv_supplier_country');
		if(_validateData(shipToCountry) && _validateData(supplierCountry) && _validateData(plannedEtd)){			
			var transitTime 	= _getTransitTime();			
			if(_validateData(transitTime)){
				transitTime 	= Number(transitTime) + 3; // As per Amanda's mail dated on 18 July 2019 trasitTime + 3 days = ETA WH 
				var expectedReceiptDate		= nlapiDateToString(nlapiAddDays(nlapiStringToDate(plannedEtd), Math.abs(transitTime)), 'dd/mm/yyyy');nlapiSetCurrentLineItemValue('item', 'custcol_os_delivery_request_date', expectedReceiptDate, true, true);
			}		
		}
	} */
	
	/* if(type == 'item' && name == 'custcol_os_planned_etd'){
		// Set EXPECTED RECEIPT DATE		
		var plannedEtd			= nlapiGetCurrentLineItemValue('item', 'custcol_os_planned_etd');	
		var deliveryDt			= nlapiGetCurrentLineItemValue('item', 'custcol_os_delivery_request_date');
		var deptPort			= nlapiGetFieldValue('custbody_inv_departure_port');
		var destPort			= nlapiGetFieldValue('custbody_inv_destination_port');
		
		if(!_validateData(deptPort) || !_validateData(destPort)){
			alert('Please select \'Departure Port\' and \'Destination Port\' in order to update \'ETA WH\' and \'Demand Plannned Receipt Date\'');
		}
		
		if(_validateData(deptPort) && _validateData(destPort) && _validateData(plannedEtd)){			
			var transitTime 	= _getTransitTime();
		
			if(_validateData(transitTime)){
				transitTime 	= Number(transitTime); // + 3; // As per Amanda's mail dated on 18 July 2019 trasitTime + 3 days = ETA WH 
				var expectedReceiptDate		= nlapiDateToString(nlapiAddDays(nlapiStringToDate(plannedEtd), Math.abs(transitTime)), 'dd/mm/yyyy');
				nlapiSetCurrentLineItemValue('item', 'custcol_os_delivery_request_date', expectedReceiptDate, true, true);
			}		
		}
	} */
	
	
	/*
	// Commented By Supriya on 23 Feb 2024
	// As per Amanda's Request on 1st Dec 2020
	if(name == 'trandate'){		
		var trandate	= nlapiGetFieldValue('trandate');
		var outside120	= nlapiGetFieldValue('custbody_inv_forecast_outside_120_days');
		var trandtArr 	= trandate.split("/");
		var varDate		= new Date(trandtArr[1]+'/'+trandtArr[0]+'/'+trandtArr[2]);
		var startdate 	= new Date('12/15/2020');			
		varDate.setHours(0,0,0,0);
		startdate.setHours(0,0,0,0);			

		if(varDate.getTime() >= startdate.getTime() && outside120 == 'F') {				
			var leadDays	= _getSupplierLeadDays();
			var etaWhDate	= nlapiDateToString(nlapiAddDays(nlapiStringToDate(trandate), Math.abs(leadDays)), 'dd/mm/yyyy');
			var lines		= nlapiGetLineItemCount('item');			
			for (var i = 1; i <= lines; i++) {
				nlapiSelectLineItem('item',i);
				nlapiSetCurrentLineItemValue('item', 'custcol_os_delivery_request_date', etaWhDate, true, true);
				nlapiCommitLineItem('item');
			}
		}
	}*/
	
	if(name == 'custbody_inv_intercompany_loc'){
		var intercompLoc	= nlapiGetFieldValue('custbody_inv_intercompany_loc');		
		if(_validateData(intercompLoc)){
			var lines		= nlapiGetLineItemCount('item');			
			for (var i = 1; i <= lines; i++) {
				var itemId 	= nlapiGetLineItemValue('item', 'item', i);		
				
				if(_validateData(itemId)){
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
						//alert('locAvgCost '+locAvgCost);
						
						nlapiSelectLineItem('item',i);
						nlapiSetCurrentLineItemValue('item', 'rate', Number(locAvgCost), true, true);
						nlapiCommitLineItem('item');
					}
				}
			}
		}		
	}
	
	// Calculate CBM
	if(type == 'item' && name == 'quantity'){		
		var customform			= nlapiGetFieldValue('customform');
		var itemId 				= nlapiGetCurrentLineItemValue('item', 'item');
				
		if(_validateData(itemId) && customform == 187){
			_calculateCBM(itemId);
		}
		// Added by Prajval on 6 Feb 2020===============
		var qty			= nlapiGetCurrentLineItemValue('item', 'quantity');
		if(_validateData(itemId) && customform == FRM_PO_1SG_PROCU)
		{
			var itemRec		= nlapiLookupField('item', itemId, ['custitem_os_identification']);
			var packQty 	= itemRec.custitem_os_identification;
			if(Number(packQty) > 0){
				var recQty 	= Math.floor(Number(qty)/Number(packQty))*Number(packQty);
				var maxrecQty = Math.ceil(Number(qty)/Number(packQty))*Number(packQty);
				if(recQty != qty || maxrecQty != qty)
					alert('Recommended quantity is '+recQty+' or '+maxrecQty);
			}
		}
		//=============================================
	}

	// FORCED PLANNED - ETD
	if(name == 'custbody_inv_forced_planned_etd'){
		var transitTime			= '';
		var plannedETD			= nlapiGetFieldValue('custbody_inv_planned_etd');
		var forcedPlannedETD	= nlapiGetFieldValue('custbody_inv_forced_planned_etd');
		var deptPort			= nlapiGetFieldValue('custbody_inv_departure_port');
		var destPort			= nlapiGetFieldValue('custbody_inv_destination_port');
		
		/* if((!_validateData(deptPort) || !_validateData(destPort)) && forcedPlannedETD == 'T' && _validateData(plannedETD)){
			alert('Please select \'Departure Port\' and \'Destination Port\' in order to update \'Planned ETD\'');
		} */
		
		//if(forcedPlannedETD == 'T' && _validateData(plannedETD) && _validateData(deptPort) && _validateData(destPort)){
		if(forcedPlannedETD == 'T' && _validateData(plannedETD)){
			//var conf = confirm('This will override existing \'Planned ETD\', \'ETA WH\' and \'Demand Plannned Receipt Date\' on each Item line level.');
			var conf = confirm('This will override existing \'Planned ETD\', \'ETA WH\' and \'Demand Plannned Receipt Date\' on each Item line level. Please wait for process to complete.');
			if(conf) {
				var lines		= nlapiGetLineItemCount('item');			
				for (var i = 1; i <= lines; i++) {
					nlapiSelectLineItem('item',i);
					nlapiSetCurrentLineItemValue('item', 'custcol_os_planned_etd', plannedETD, true, true);
					nlapiCommitLineItem('item');

					/*nlapiSetLineItemValue('item', 'custcol_os_planned_etd', i, plannedETD, true, true);					
					var transitTime = _getTransitTime();
					alert('transitTime '+transitTime);

					if(_validateData(transitTime)){
						var etaWhDate	= nlapiDateToString(nlapiAddDays(nlapiStringToDate(plannedETD), Math.abs(transitTime)), 'dd/mm/yyyy');
						alert('etaWhDate '+etaWhDate);
						nlapiSetLineItemValue('item', 'custcol_os_delivery_request_date', i, etaWhDate, true, true);
					}*/
					

					/* // Set EXPECTED RECEIPT DATE
					if(_validateData(transitTime)){						
						var expectedReceiptDate	= nlapiDateToString(nlapiAddDays(nlapiStringToDate(plannedETD), Math.abs(transitTime)), 'dd/mm/yyyy');
						//nlapiSetLineItemValue('item', 'custcol_os_delivery_request_date', i, expectedReceiptDate, true, true);
						nlapiSelectLineItem('item',i);
						nlapiSetCurrentLineItemValue('item', 'custcol_os_delivery_request_date', expectedReceiptDate, true, true);
						nlapiCommitLineItem('item');						
					} */
				}
			}
			else{
				nlapiSetFieldValue('custbody_inv_forced_planned_etd', 'F');
			}
		}
	}
	
	// FORCED ORIGINAL ETD = Planned ETA
	if(name == 'custbody_inv_forced_original_etd'){
		var originalETD			= nlapiGetFieldValue('custbody_inv_original_etd');
		var forcedOrigETD	= nlapiGetFieldValue('custbody_inv_forced_original_etd');
		if(forcedOrigETD == 'T' && _validateData(originalETD)){
			var conf = confirm('This will override existing Planned ETA on each Item line level.');
			if(conf){
				var lines		= nlapiGetLineItemCount('item');			
				for (var i = 1; i <= lines; i++) {												
					nlapiSetLineItemValue('item', 'custcol_kl_edt', i, originalETD);
				}
			}
			else{
				nlapiSetFieldValue('custbody_inv_forced_original_etd', 'F');
			}
		}
	}
	
	//Added by Prajval on 7 June 2019 ================
	if((name == 'custbody_inv_core_product_po')&&(customform == 187))
	{
		if(nlapiGetFieldValue('custbody_inv_core_product_po')=='T')
		{
			var tranDate = nlapiGetFieldValue('trandate');
			var dateObj = nlapiStringToDate(tranDate);
			var addDays = nlapiAddDays(dateObj,15);
			var resultDate = nlapiDateToString(addDays,'date');
			nlapiSetFieldValue('custbody_inv_planned_etd',resultDate,false,false);
			nlapiSetFieldValue('custbody_inv_original_etd',resultDate,false,false);
			nlapiSetFieldValue('message','Core Product - Shipment in 15 days',false,false);
			nlapiSetFieldValue('custbody_inv_forced_planned_etd','F',false,false);
			nlapiSetFieldValue('custbody_inv_forced_original_etd','F',false,false);
		}
		else{
			nlapiSetFieldValue('custbody_inv_planned_etd','',false,false);
			nlapiSetFieldValue('custbody_inv_original_etd','',false,false);
			nlapiSetFieldValue('message','',false,false);
			nlapiSetFieldValue('custbody_inv_forced_planned_etd','F',false,false);
			nlapiSetFieldValue('custbody_inv_forced_original_etd','F',false,false);
		}
		
	}
	//=================================================
}

// Transit Time is calculated as per new custom record 'Transit Time Port'
function _getTransitTime()
{
	var transitTime		= '';
	var deptPort		= nlapiGetFieldValue('custbody_inv_departure_port');
	var destPort		= nlapiGetFieldValue('custbody_inv_destination_port');
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
			transitTime		= transitTimeSearch[0].getValue("custrecord_inv_transit_time_port_days");
		}
	}
	
	return transitTime;
}

function _getSupplierLeadDays()
{
	var leadDays		= 120;
	var vendorId		= nlapiGetFieldValue('entity');	
	if(_validateData(vendorId)){	
		var vendorRec	= nlapiLookupField('vendor', vendorId, ['custentity_inv_lead_days']);
		leadDays 		= vendorRec.custentity_inv_lead_days;
	}
	
	if(!_validateData(leadDays)) leadDays = 120;
	
	return leadDays;
}

function _calculateCBM(itemId)
{
	if(_validateData(itemId)){
		var qty 			= nlapiGetCurrentLineItemValue('item', 'quantity');
		var itemRec			= nlapiLookupField('item', itemId, ['custitem_inv_carton_length', 'custitem_inv_carton_width', 'custitem_inv_carton_height', 'custitem_os_identification']);
		var cartonLength 	= itemRec.custitem_inv_carton_length;
		var cartonWidth 	= itemRec.custitem_inv_carton_width;
		var cartonHeight 	= itemRec.custitem_inv_carton_height;
		var packQty 		= itemRec.custitem_os_identification;
							
		if(_validateData(cartonLength) && _validateData(cartonWidth) && _validateData(cartonHeight) && _validateData(packQty)){
			var CBM			= (Number(qty) / Number(packQty)) * ((Number(cartonLength)* Number(cartonWidth) * Number(cartonHeight))/1000000);
			
			nlapiSetCurrentLineItemValue('item', 'custcol_inv_cbm', CBM.toFixed(2));
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
			console.log('representingSub', representingSub);
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
			var deliveryDt		= nlapiGetCurrentLineItemValue('item', 'custcol_os_delivery_request_date');
						
			if(!_validateData(plannedEtdLine))
				nlapiSetCurrentLineItemValue('item', 'custcol_os_planned_etd', plannedEtd, true, true);
			if(!_validateData(originalEtdLine))
				nlapiSetCurrentLineItemValue('item', 'custcol_kl_edt', originalEtd, false, false);
					
			/*
			// Set ETA WH as per Amanda's Request on 1 Dec 2020
			var trandate	= nlapiGetFieldValue('trandate');
			var outside120	= nlapiGetFieldValue('custbody_inv_forecast_outside_120_days');
			var trandtArr 	= trandate.split("/");
			var varDate		= new Date(trandtArr[1]+'/'+trandtArr[0]+'/'+trandtArr[2]);
			var startdate 	= new Date('12/15/2020');			
			varDate.setHours(0,0,0,0);
			startdate.setHours(0,0,0,0);			

			if(varDate.getTime() >= startdate.getTime() && outside120 == 'F') {				
				var leadDays	= _getSupplierLeadDays();
				var etaWhDate	= nlapiDateToString(nlapiAddDays(nlapiStringToDate(trandate), Math.abs(leadDays)), 'dd/mm/yyyy');
				nlapiSetCurrentLineItemValue('item', 'custcol_os_delivery_request_date', etaWhDate, true, true);
			}
			*/
					
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
			
			// CBM
			var customform			= nlapiGetFieldValue('customform');
			if(customform == 187){
				_calculateCBM(itemId);
				//setPrice_Incoterm();
			}
		}
	}
}
// Added by Prajval on 6 Feb 2020===============
function PurchaseOrder_VL(type)
{
	var customform	= nlapiGetFieldValue('customform');
	nlapiLogExecution('DEBUG','customform','customform->>'+customform);
	if(type == 'item' && customform == FRM_PO_1SG_PROCU)//.1 SG Purchase Order - Procurement Form
	{
		var itemId = nlapiGetCurrentLineItemValue('item', 'item');
		var qty = nlapiGetCurrentLineItemValue('item', 'quantity');
		
		if(_validateData(itemId))
		{
			var itemRec		= nlapiLookupField('item', itemId, ['custitem_os_identification']);
			var packQty 	= itemRec.custitem_os_identification;
			if(Number(packQty) > 0){
				var recQty 	= Math.floor(Number(qty)/Number(packQty))*Number(packQty);
				var maxrecQty = Math.ceil(Number(qty)/Number(packQty))*Number(packQty);
				if(recQty != qty || maxrecQty != qty)
				{
					alert('Recommended quantity is '+recQty+' or '+maxrecQty);
					return false;
				}
			}
		}
	}
	
	// Set ETA WH as per Amanda's Request on 1 Dec 2020
	/* var trandate	= nlapiGetFieldValue('trandate');
	var outside120	= nlapiGetFieldValue('custbody_inv_forecast_outside_120_days');
	var trandtArr 	= trandate.split("/");
	var varDate		= new Date(trandtArr[1]+'/'+trandtArr[0]+'/'+trandtArr[2]);
	var startdate 	= new Date('12/15/2020');			
	varDate.setHours(0,0,0,0);
	startdate.setHours(0,0,0,0);			

	if(varDate.getTime() >= startdate.getTime() && outside120 == 'F') {				
		var leadDays	= _getSupplierLeadDays();
		var etaWhDate	= nlapiDateToString(nlapiAddDays(nlapiStringToDate(trandate), Math.abs(leadDays)), 'dd/mm/yyyy');
		nlapiSetCurrentLineItemValue('item', 'custcol_os_delivery_request_date', etaWhDate, true, true);
		
		var dt = nlapiStringToDate(etaWhDate, 'date');				
		var m  = dt.getMonth();				
		var y  = dt.getFullYear();				
		var demandPlanReceiptDt = new Date(y, m, 1);				
		demandPlanReceiptDt 	= nlapiDateToString(demandPlanReceiptDt, 'dd/mm/yyyy');	
		nlapiSetCurrentLineItemValue('item','expectedreceiptdate', demandPlanReceiptDt, true, true);
	} */
	
	return true;
}
//================================================

// 7 July 2022 Incoterm Price 
function setPrice_Incoterm() {
	var poSupplier = nlapiGetFieldValue('entity');
	var poSubsidiary = nlapiGetFieldValue('subsidiary');
	var pocurrency = nlapiGetFieldValue('currency');
	var poIncoterm = nlapiGetFieldValue('incoterm');
	var itemId = nlapiGetCurrentLineItemValue('item', 'item');
	var incoPrice;
	if (itemId) {
		if (!_validateData(poIncoterm)) {
			alert("Please select the Incoterm");
			nlapiSetCurrentLineItemValue('item', 'rate', "", true, true);
			nlapiSetCurrentLineItemValue('item', 'item', "", true, true);
			nlapiSetCurrentLineItemValue('item', 'vendorname', "", true, true);
			nlapiSetCurrentLineItemValue('item', 'description', "", true, true);
		}
		else {
			var priceSearch = nlapiSearchRecord("customrecord_inv_item_supplier_inco_term", null,
				[
					["custrecord_inv_vendor", "anyof", poSupplier],
					"AND",
					["custrecord_inv_subsidiary", "anyof", poSubsidiary],
					"AND",
					["custrecord_inv_currency", "anyof", pocurrency],
					"AND",
					["custrecord_inv_inco_terms", "anyof", poIncoterm],
					"AND",
					["custrecord_inv_item", "anyof", itemId]
				],
				[
					new nlobjSearchColumn('custrecord_inv_purchase_price')
				]
			);
			if (priceSearch) {
				incoPrice = priceSearch[0].getValue('custrecord_inv_purchase_price');
			}
			
			if (!_validateData(incoPrice)) {
				alert("IncoTerm Price is not mentioned");
			}
			else {
				nlapiSetCurrentLineItemValue('item', 'rate', incoPrice, true, true);
			}
			
		}
	}
}