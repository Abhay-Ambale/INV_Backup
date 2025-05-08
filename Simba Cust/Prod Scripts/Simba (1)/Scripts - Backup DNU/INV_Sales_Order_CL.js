/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version  Date            Author          Remarks
 * 1.00     4 Apr 2018		Supriya G		For Intercompny SO, Disable Auto Email, Enable Auto I/C IR
 * 
 */

// For Intercompny SO, Disable Auto Email, Enable Auto I/C IR
function SalesOrder_PI(type){
	
	var intercotrans	= nlapiGetFieldValue('intercotransaction');
		
	if(_validateData(intercotrans) && type == 'edit'){
		nlapiSetFieldValue('custbody_kl_auto_invoice_email_check', 'F');
		nlapiSetFieldValue('custbody_inv_auto_ic_ir', 'T');
		nlapiDisableField('custbody_inv_auto_ic_ir', false);
		nlapiDisableField('custbody_kl_auto_invoice_email_check', true);
	}
	else{
		// disable auto_ic_ir checkbox
		nlapiDisableField('custbody_inv_auto_ic_ir', true);
		nlapiDisableField('custbody_kl_auto_invoice_email_check', false);
	}
	if(type == 'create' || type == 'copy'){
		nlapiSetFieldValue('custbody_inv_finance_hold', 'T');
	}	
}

function SalesOrder_PS(type, name){
	if(name == 'entity')
	{
		var unbilledAmt 	= nlapiGetFieldValue('custbody_inv_unbilled_orders_amt');
		var outstandingAmt 	= nlapiGetFieldValue('custbody_inv_outstanding_balance');
		
		var total = Number(unbilledAmt) + Number(outstandingAmt);
		nlapiSetFieldValue('custbody_inv_total_unbilled_outstand', total);
	}
		
	/* if(type == 'item' && name == 'item'){
		//console.log('type ='+type+', name='+name);
		var locBody 	= nlapiGetFieldValue('location');
		if(_validateData(locBody)){
			var loc = nlapiGetCurrentLineItemValue('item', 'location');			
			if(!_validateData(loc)){
				 nlapiSetCurrentLineItemValue('item', 'location', locBody, false, false);
			}
		}
	} */
}

function SalesOrder_FC(type, name){
	if(name == 'shipaddresslist')
	{
		var entity 				= nlapiGetFieldValue('entity');
		var shipaddressId 		= nlapiGetFieldValue('shipaddresslist');		
		if(_validateData(shipaddressId) && _validateData(entity)){			
			var addressSearch 	= nlapiSearchRecord("customer",null,
									[
									   ["internalidnumber","equalto",entity]
									], 
									[
									   new nlobjSearchColumn("addressinternalid","Address",null), 
									   new nlobjSearchColumn("custrecord_kl_packing_instructions","Address",null), 
									   new nlobjSearchColumn("custrecord_kl_shipping_instructions","Address",null)
									]
									);
			if(_validateData(addressSearch) && addressSearch.length > 0){
				for(var i=0; i<addressSearch.length; i++){
					var addressId 		= addressSearch[i].getValue("addressinternalid", "Address");
					if(shipaddressId == addressId){
						var packingInst = addressSearch[i].getValue("custrecord_kl_packing_instructions", "Address");
						var shipInst 	= addressSearch[i].getValue("custrecord_kl_shipping_instructions", "Address");
						
						nlapiSetFieldValue('custbody_kl_packing_instructions', packingInst);
						nlapiSetFieldValue('custbody_kl_shipping_instructions', shipInst);
					}
				}			
			}
		}
		else{
			nlapiSetFieldValue('custbody_kl_packing_instructions', '');
			nlapiSetFieldValue('custbody_kl_shipping_instructions', '');	
		}
	}
}

function SalesOrder_VL(type)
{
	var itemId		= nlapiGetCurrentLineItemValue('item', 'item');
	var itemtype	= nlapiGetCurrentLineItemValue('item', 'itemtype');
	var woCat		= nlapiGetCurrentLineItemValue('item', 'custcol_inv_wo_cat');
	if(itemtype == 'Assembly' && !_validateData(woCat)){
		alert('Please select Work Order Category');
		return false;
	}
	
	return true;
}

var flag = 'manual'; //added by User
function SalesOrder_Recalc(type)
{
	if (type!='item') return;
    if (flag!='script')
    {
		flag			= 'script'; //added by script
		var line 		= nlapiGetCurrentLineItemIndex('item');
		var itemId		= nlapiGetCurrentLineItemValue('item', 'item');
		var qty			= nlapiGetCurrentLineItemValue('item', 'quantity');
		var rfidItem	= nlapiGetCurrentLineItemValue('item', 'custcol_inv_rfid_item');
		//var rfidItem	= nlapiLookupField('item', itemId, 'custitem_inv_rfid_item');
		
		var preItemId		= nlapiGetLineItemValue('item', 'item', Number(line)-1);
		
		if(_validateData(rfidItem) && preItemId != rfidItem){		
			nlapiInsertLineItem('item', line);
			nlapiSetCurrentLineItemValue('item','item', rfidItem, false, true);
			nlapiSetCurrentLineItemValue('item','quantity', qty, false, true);
			nlapiSetCurrentLineItemValue('item','rate', 0, false, true);
			nlapiSetCurrentLineItemValue('item','amount', 0, false, true);
			nlapiCommitLineItem('item');
		}
		flag		= 'manual'; //added by User
    }
}

function SalesOrder_SR(){
	var intercostatus 	= nlapiGetFieldValue(intercostatus);
	var orderCat 		= nlapiGetFieldValue('custbody_inv_order_category');
	
	if(_validateData(intercostatus) && !_validateData(orderCat)){
		alert('Order Category is not set on this Customer record.');
		return false;
	}
	
	return true;
}