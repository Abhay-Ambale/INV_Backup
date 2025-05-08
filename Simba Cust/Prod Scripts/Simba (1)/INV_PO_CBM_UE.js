/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version  Date            Author          Remarks
 * 1.00     1 Aug 2021		Supriya G		This script is used to set CBM
 * 
 */

function PurchaseOrder_BS(type){
	var currContext		= nlapiGetContext();
	var execContext		= currContext.getExecutionContext();
	var customform 	    = nlapiGetFieldValue('customform');
	  	
	if((type == 'create' || type == 'edit') && customform == FRM_PO_1SG_PROCU){
		var lineCnt 	= nlapiGetLineItemCount('item');
		
		for(var i=1;i<=lineCnt;i++) {							
			var itemId	= nlapiGetLineItemValue('item','item',i);			
			var qty		= nlapiGetLineItemValue('item','quantity',i);
			
			if(_validateData(itemId)) {
				var itemRec			= nlapiLookupField('item', itemId, ['custitem_inv_carton_length', 'custitem_inv_carton_width', 'custitem_inv_carton_height', 'custitem_os_identification']);
				var cartonLength 	= itemRec.custitem_inv_carton_length;
				var cartonWidth 	= itemRec.custitem_inv_carton_width;
				var cartonHeight 	= itemRec.custitem_inv_carton_height;
				var packQty 		= itemRec.custitem_os_identification;
									
				if(_validateData(cartonLength) && _validateData(cartonWidth) && _validateData(cartonHeight) && _validateData(packQty)){
					var CBM			= (Number(qty) / Number(packQty)) * ((Number(cartonLength)* Number(cartonWidth) * Number(cartonHeight))/1000000);
					nlapiSetLineItemValue('item', 'custcol_inv_cbm', i, CBM.toFixed(2));
				}
			}			
		}	
	}	
}