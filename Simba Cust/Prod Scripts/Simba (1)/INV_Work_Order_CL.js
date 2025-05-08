/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version  Date            Author          Remarks
 * 1.00     4 Apr 2018		Supriya G
 * 
 */

// WO00010945
function WorkOrder_PI(type){
	if(type == 'create' || type == 'edit'){
		var createdfrom		= nlapiGetFieldValue('createdfrom');
		if(_validateData(createdfrom)){			
			//nlapiDisableField('custbody_inv_wo_category', true);
		}
	}
	if(type == 'create'){
		var createdfrom		= nlapiGetFieldValue('createdfrom');
		var line 			= gup('soline');
		var specord			= gup('specord');
		if(_validateData(createdfrom) && _validateData(line)){
			nlapiSetFieldValue('custbody_inv_sales_order_ref', createdfrom);
			
			var soRec 	= nlapiLoadRecord('salesorder', createdfrom);
			var lineNum = soRec.findLineItemValue('item', 'line', line);
            if (lineNum > 0) {                
				var woCat = soRec.getLineItemValue('item', 'custcol_inv_wo_cat', lineNum);
				nlapiSetFieldValue('custbody_inv_wo_category', woCat);						
				
				if(woCat == 3 && specord == 'T'){
					alert('This assembly item has tag the category as "Outsourced-Shipped from Our Location. Hence you can not create special Work Order. Please create standalone Work Order to proceed further."');
					
					window.location.href = nlapiResolveURL('RECORD', 'salesorder', createdfrom);
					return false;
				}
			}
		}
	}
}

function WorkOrder_SR(type){
	var flagService 	= 1;
	var woCat			= nlapiGetFieldValue('custbody_inv_wo_category');
	var supplier		= nlapiGetFieldValue('custbody_inv_supplier');
	var supplierBin		= nlapiGetFieldValue('custbody_inv_supplier_cmt_bin');
	
	if(_validateData(woCat) && woCat == 3){		
		var strConfirm = confirm("This is an outsourced work order, hence confirm the location set is correct.");
		if(strConfirm == false) {
			return false;
		}		
	}
	
	if(_validateData(woCat) && woCat != 1 && !_validateData(supplier)){
		alert('Please select the value of Supplier');
		return false;
	}
	
	if(_validateData(woCat) && woCat != 1 && !_validateData(supplierBin)){
		alert('Please select the value of Supplier CMT Bin');
		return false;
	}
	
	if(_validateData(woCat)){
		flagService = 0;
		itemCount	= nlapiGetLineItemCount('item');
		for(var k = 1; k <= itemCount; k++) {
			var itemtype 	= nlapiGetLineItemValue('item', 'itemtype', k);
		
			if(_validateData(itemtype) && itemtype == 'Service'){
				flagService = 1;
				return true;
			}
		}
	}
	
	if(flagService == 0) { 	
		alert('Line level Service item such as Labour - CMT is missing. Please do the needful.');
		return false;
	}
	
	return true;
}
