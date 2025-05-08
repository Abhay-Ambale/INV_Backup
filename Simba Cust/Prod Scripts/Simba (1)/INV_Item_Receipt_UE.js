/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version  Date            Author          Remarks
 * 1.00     16 Feb 2021		Supriya G		Set Shipment Header at body level same as line level
 * 
 */
 
 function ItemReceipt_BS(){
	if(type=='create')
	{
		var shipmentHeader	= nlapiGetFieldValue('custbody_kl_shipment_header');
		if(!_validateData(shipmentHeader)){
			var lineSHid 	= nlapiGetLineItemValue('item', 'custcol_kl_shipment_header', 1);
			nlapiSetFieldValue('custbody_kl_shipment_header', lineSHid, false, false);
		}
	}
 }
 
/* // User Event script Before load : Show button to process magnum.
function ItemReceipt_BL(){
	if(type =='view' && execContext == 'userinterface'){
		var recId			= nlapiGetRecordId();
		var correspondPO	= nlapiGetFieldValue('createdfrom');
		nlapiLogExecution('DEBUG', 'In ItemReceipt_BL correspondPO ', correspondPO);
		
		if(_validateData(correspondPO)){
			var transSearch 	= nlapiSearchRecord("transaction",null,
										[
										   ["internalidnumber", "equalto", correspondPO], 
										   "AND", 
										   ["mainline","is","T"], 
										   "AND", 
										   ["custbody_inv_interco_magnum_po_ref.intercostatus","anyof","2"],
										   "AND", 
											["custbody_inv_interco_magnum_po_ref.mainline","is","T"]
										], 
										[
											new nlobjSearchColumn("custbody_inv_interco_magnum_po_ref"), 
											new nlobjSearchColumn("intercotransaction","custbody_inv_interco_magnum_po_ref",null)
										]
									);
			if(_validateData(transSearch)){
				var icPO 	= transSearch[0].getValue("custbody_inv_interco_magnum_po_ref");
				var icSO 	= transSearch[0].getValue("intercotransaction", "custbody_inv_interco_magnum_po_ref", null);
				
				nlapiLogExecution('DEBUG', 'In ItemReceipt_AS icSO ', icSO);			
				if(_validateData(icSO)) {
					var mainURL 	= nlapiResolveURL('SUITELET','customscript_inv_magnum_ic_if','customdeploy_inv_magnum_ic_if', true)+'&ir='+recId;
					form.addButton("custpage_magnum_process", 'Process',"window.open('"+mainURL+"', '_blank');");
				}
			}
		}
		
	}	
} */

 
/* // User Event script after Submit : Auto set the Total IR Amount on Shipment Header Record.
function ItemReceipt_AS(type, form){
	var recType		= nlapiGetRecordType();
	var recId		= nlapiGetRecordId();
	var createdfrom	= nlapiGetFieldValue('createdfrom');
	
	if(type=='create' || type=='edit' || type=='delete')
	{
		var oldRecord 			= nlapiGetOldRecord();
		var shipmentHeaderOld 	= oldRecord && oldRecord.getFieldValue('custbody_inv_shipment_header');
		
		var shipmentHeader		= nlapiGetFieldValue('custbody_inv_shipment_header');
		var shipmentHeaderId	= shipmentHeader;
		if(!_validateData(shipmentHeader))
			shipmentHeaderId	= shipmentHeaderOld;
		
		nlapiLogExecution('DEBUG', 'In ItemReceipt_AS shipmentHeader ', type+ ' = '+shipmentHeaderId);
		if(_validateData(shipmentHeaderId)){
			var irSearch 	= nlapiSearchRecord("itemreceipt",null,
									[
									   ["type","anyof","ItemRcpt"], 
									   "AND", 
									   ["custbody_inv_shipment_header","anyof",shipmentHeaderId], 
									   "AND", 
									   ["mainline","is","T"]
									], 
									[
									   new nlobjSearchColumn("fxamount",null,"SUM")
									]
									);
			if(_validateData(irSearch)){
				var amount 	= irSearch[0].getValue("fxamount", null,"SUM");	
				nlapiLogExecution('DEBUG', 'In amount ', amount);				
				nlapiSubmitField('customrecord_os_shiphead', shipmentHeaderId, 'custrecord_kl_shipment_total', amount);				
			}
		}
	}

	if(type=='create' && _validateData(createdfrom)){		
		var correspondPO	= createdfrom;
		nlapiLogExecution('DEBUG', 'In ItemReceipt_AS correspondPO ', correspondPO);
		var transSearch 	= nlapiSearchRecord("transaction",null,
									[
									   ["internalidnumber", "equalto", correspondPO], 
									   "AND", 
									   ["mainline","is","T"], 
									   "AND", 
									   ["custbody_inv_interco_magnum_po_ref.intercostatus","anyof","2"],
									   "AND", 
										["custbody_inv_interco_magnum_po_ref.mainline","is","T"]
									], 
									[
										new nlobjSearchColumn("custbody_inv_interco_magnum_po_ref"), 
										new nlobjSearchColumn("intercotransaction","custbody_inv_interco_magnum_po_ref",null)
									]
								);
		if(_validateData(transSearch)){
			var icPO 	= transSearch[0].getValue("custbody_inv_interco_magnum_po_ref");
			var icSO 	= transSearch[0].getValue("intercotransaction", "custbody_inv_interco_magnum_po_ref", null);
			
			nlapiLogExecution('DEBUG', 'In ItemReceipt_AS icSO ', icSO);			
			if(_validateData(icSO)) {
				// Call Suitlet
				var url 	= nlapiResolveURL('SUITELET','customscript_inv_magnum_ic_if','customdeploy_inv_magnum_ic_if', true)+'&ir='+recId;
				var responseObj = nlapiRequestURL(url, null, null, null);
			}
		}
	}
} */