/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version  Date            	Author          Remarks
 * 1.00     12 April 2018		Supriya G		This script is used to set the previous version of estimate and disable the rate/amount
 * 
 */


// User Event script Before Load
function Estimate_PI(type){
	if(type == 'copy'){
		//nlapiSetFieldValue('custbody_inv_txn_approval_status', PENDING_APPROVAL);
		var nxtVer 	= gup('nxtVer');
		var id 		= gup('id');
		if(nxtVer == 'T' && _validateData(id)){
			nlapiSetFieldValue('custbody_inv_previous_version', id);			
		}
	}
}

// CLient script : POST SOURCING FUNCTION
function Estimate_PS(type, name)
{
	//var appStatus = nlapiGetFieldValue('custbody_inv_txn_approval_status');
	var tranid = nlapiGetFieldValue('tranid');
	if(type == 'item' && name == 'item'){		
		//if(appStatus == PENDING_APPROVAL){
		if(tranid != 'To Be Generated'){
			nlapiDisableLineItemField('item', 'rate', true);
			nlapiDisableLineItemField('item', 'amount', true);			
		}
		else{
			nlapiDisableLineItemField('item', 'rate', false);
			nlapiDisableLineItemField('item', 'amount', false);
		}
	}
}

function Estimate_FC(type, name){
	if(name == 'shipaddresslist' || name == 'shippingtaxcode')
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