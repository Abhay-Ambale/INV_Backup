/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version  Date            Author          Remarks
 * 1.00     28 Sep 2018		Supriya G		Set Line total at body level
 * 
 */

function ItemReceipt_PI(type){
	if(type == 'copy' || type == 'edit'){
		_setSummaryTotal();
	}
}

function ItemReceipt_FC(type, name){	
	if(type == 'item' && (name == 'quantity' || name == 'rate' || name == 'itemreceive')){	
		var quantity		= nlapiGetCurrentLineItemValue('item', 'quantity');
		var rate			= nlapiGetCurrentLineItemValue('item', 'rate');	
		var itemreceive		= nlapiGetCurrentLineItemValue('item', 'itemreceive');
		
		if(itemreceive == 'F'){
			nlapiSetCurrentLineItemValue('item', 'custcol_kl_itemrec_line_total', 0, false, false);			
			_setSummaryTotal();	
		}
		else{
			if(_validateData(quantity) && _validateData(rate)){			
				var lineTotal 	= Number(quantity) * Number(rate);			
				nlapiSetCurrentLineItemValue('item', 'custcol_kl_itemrec_line_total', lineTotal, false, false);			
				_setSummaryTotal();
			}
		}
	}	
}

function _setSummaryTotal()
{
	var summaryTotal 	= 0;
	var lineCount		= nlapiGetLineItemCount('item');
	for(var i = 1; i<=lineCount; i++) {
		var lineTotal	= nlapiGetLineItemValue('item', 'custcol_kl_itemrec_line_total', i);		
		summaryTotal	= Number(summaryTotal) + Number(lineTotal);
	}
	
	nlapiSetFieldValue('custbody_inv_summary_total', summaryTotal.toFixed(2));
}