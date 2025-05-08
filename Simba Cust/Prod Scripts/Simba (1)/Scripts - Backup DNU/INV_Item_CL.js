/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version  Date            Author          Remarks
 * 1.00     1 July 2018		Supriya G		This script is used to set the 
 * 
 */


function Item_FC(type, name){
	if(name == 'custitem_inv_auto_upc_code'){
		var autoUpcCode		= nlapiGetFieldValue('custitem_inv_auto_upc_code');
		var autoItemName	= nlapiGetFieldValue('custitem_inv_auto_item_name_number');
		var itemInitial		= nlapiGetFieldValue('custitem_os_item_initial_name');
		
		if(autoUpcCode == 'T') {
			nlapiGetField('upccode').setDisplayType('disabled');
			nlapiGetField('custitem_inv_scan_pack_barcode').setDisplayType('disabled');
			nlapiGetField('custitem_inv_carton_barcode').setDisplayType('disabled');
			
			if(!_validateData(itemInitial) && autoItemName == 'T'){
				nlapiSetFieldValue('itemid', 'To Be Generated');
			}
		}
		else{
			nlapiGetField('upccode').setDisplayType('normal');
			nlapiGetField('custitem_inv_scan_pack_barcode').setDisplayType('normal');
			nlapiGetField('custitem_inv_carton_barcode').setDisplayType('normal');
			
			if(_validateData(itemInitial) && autoItemName == 'T' && autoUpcCode == 'F'){
				var itemid = 'P99'+itemInitial.substr(0,8);
				nlapiSetFieldValue('itemid', itemid);			
			}
		}
	}
	
	if(name == 'custitem_inv_auto_item_name_number'){
		var autoItemName	= nlapiGetFieldValue('custitem_inv_auto_item_name_number');
		var autoUpcCode		= nlapiGetFieldValue('custitem_inv_auto_upc_code');
		var itemInitial		= nlapiGetFieldValue('custitem_os_item_initial_name');
		
		if(autoItemName == 'T'){
			nlapiSetFieldValue('itemid','To Be Generated');
			nlapiGetField('itemid').setDisplayType('disabled');
		}
		else{
			nlapiGetField('itemid').setDisplayType('normal');
			nlapiSetFieldValue('itemid','');
		}
		
		if(_validateData(itemInitial) && autoItemName == 'T' && autoUpcCode == 'F'){
			var itemid = 'P99'+itemInitial.substr(0,8);
			nlapiSetFieldValue('itemid', itemid);			
		}
	}
	
	if(name == 'custitem_os_item_initial_name'){
		var itemInitial		= nlapiGetFieldValue('custitem_os_item_initial_name');
		var autoItemName	= nlapiGetFieldValue('custitem_inv_auto_item_name_number');
		var autoUpcCode		= nlapiGetFieldValue('custitem_inv_auto_upc_code');
		
		if(_validateData(itemInitial) && autoItemName == 'T' && autoUpcCode == 'F'){
			var itemid = 'P99'+itemInitial.substr(0,8);
			nlapiSetFieldValue('itemid', itemid);			
		}
		else{
			nlapiSetFieldValue('itemid', 'To Be Generated');
		}
	}
}

function Item_SR(type, name){
	var itemInitial		= nlapiGetFieldValue('custitem_os_item_initial_name');
	var autoItemName	= nlapiGetFieldValue('custitem_inv_auto_item_name_number');
	var autoUpcCode		= nlapiGetFieldValue('custitem_inv_auto_upc_code');
	
	if(!_validateData(itemInitial) && autoItemName == 'T' && autoUpcCode == 'F'){
		alert('Please enter value for: Item Initial name');
		return false;
	}
	
	return true;
}