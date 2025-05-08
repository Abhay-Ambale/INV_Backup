/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version  Date            Author          Remarks
 * 1.00     11 May 2018		Supriya G		This script is used to set the relevant fields from WO to transfer order
 * 
 */

function TransferOrder_PI(type){
	if(type == 'create'){
		var woId 		= gup('woid');
		var poId 		= gup('poid');
		if(_validateData(woId) && _validateData(poId)){
			var poObj		= nlapiLoadRecord('purchaseorder', poId);
			var supplier	= poObj.getFieldValue('entity');
			nlapiSetFieldValue('custbody_inv_outsourced_po_ref', poId);
			nlapiSetFieldValue('custbody_inv_supplier', supplier);
			//nlapiSetFieldValue('custbody_inv_supplier_cmt_bin', supplierBin);
						
			var woObj		= nlapiLoadRecord('workorder', woId);
			var woCat		= woObj.getFieldValue('custbody_inv_wo_category');
			//var supplier	= woObj.getFieldValue('custbody_inv_supplier');
			//var supplierBin	= woObj.getFieldValue('custbody_inv_supplier_cmt_bin');
			var lineCount	= woObj.getLineItemCount('item');
			nlapiSetFieldValue('subsidiary', woObj.getFieldValue('subsidiary'));
			nlapiSetFieldValue('custbody_inv_wo_ref', woId);
						
			/* if(woCat == 2){
				nlapiSetFieldValue('transferlocation', woObj.getFieldValue('location'));
			}
			if(woCat == 3){
				nlapiSetFieldValue('location', woObj.getFieldValue('location'));
			} */	
			
			for(var i = 1; i<=lineCount; i++) {
				if(woObj.getLineItemValue('item', 'itemtype', i) != 'Service'){
					nlapiSelectNewLineItem('item');
					for(key in WoToTransferOrderLFObj) {				
						if(_validateData(woObj.getLineItemValue('item', key, i))){
							nlapiSetCurrentLineItemValue('item', WoToTransferOrderLFObj[key], woObj.getLineItemValue('item', key, i), true, true);
						}					
					}
					nlapiCommitLineItem('item');
				}
			}
		}
	}
}


function TransferOrder_FC(type, name){
	if(name == 'location'){
		var woId		= nlapiGetFieldValue('custbody_inv_wo_ref');
		if(_validateData(woId)){
			var woObj	= nlapiLoadRecord('workorder', woId);
			nlapiSetFieldValue('transferlocation', woObj.getFieldValue('location'));
		}
	}
}