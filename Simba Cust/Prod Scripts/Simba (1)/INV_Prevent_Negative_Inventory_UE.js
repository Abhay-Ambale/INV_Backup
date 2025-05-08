/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version  Date            Author          Remarks
 * 1.00     2 May 2018		Supriya G		This Script is used to prevent to be the Negative Inventory
 * 
 */


// User Event script after Submit : Auto creation of Intercompny Item Receipt, Vendor Bill and Invoice.
function preventNegativeInv_BS(type, form){
	var recType		= nlapiGetRecordType();
	var recId		= nlapiGetRecordId();
	var itemArr		= [];	
	nlapiLogExecution('DEBUG', 'In preventNegativeInv_BS type', type+ ' = '+recType);
	
	if(recType == 'inventorytransfer'){
		itemArr = _preventNegInvInvTrf(type);
	}
	else if(recType == 'cashsale'){
		itemArr	= _preventNegInvTxn(type);		
	}
	else if(recType == 'vendorcredit'){
		var createdfrom 	= nlapiGetFieldValue('createdfrom');
		if(!_validateData(createdfrom)){
			itemArr	= _preventNegInvVendorCreditTxn(type);
		}		
	}
	else if(recType == 'assemblybuild'){
		itemArr	= _preventNegInvAssemblyBuildTxn(type);		
	}
	else if(recType == 'invoice'){
		var createdfromType = '';
		var createdfrom 	= nlapiGetFieldValue('createdfrom');
		if(_validateData(createdfrom)){
			createdfromType = _getTypeOfCreatedFrom(createdfrom);
		}
		nlapiLogExecution('DEBUG', 'createdfromType', createdfromType);
		if(createdfromType != 'SalesOrd'){
			itemArr	= _preventNegInvTxn(type);
		}
	}
	nlapiLogExecution('DEBUG', 'itemArr', itemArr);
	if(itemArr.length > 0){
		var msg = 'Quantity entered is more than quantity Onhand for the selected location for the following items \r\n';
		throw nlapiCreateError('Invalid Action', msg+itemArr.join("\r\n"), true);
	}			
}

function _preventNegInvInvTrf(type)
{
	var itemArr = [];
	if(type=='create' || type=='edit')
	{		
		var itemCnt = nlapiGetLineItemCount('inventory');				
		for (var line = 1; line <= itemCnt; line++) {			
			var item	 	= nlapiGetLineItemText('inventory', 'item', line);
			var qty		 	= nlapiGetLineItemValue('inventory', 'adjustqtyby', line);
			var qtyOnHand	= nlapiGetLineItemValue('inventory', 'quantityonhand', line);
			//var binitem 	= nlapiGetLineItemValue('inventory', 'binitem', line);
			//var invDetReq 	= nlapiGetLineItemValue('inventory', 'inventorydetailreq', line);			
			
			if(Number(qty) > Number(qtyOnHand)){
				itemArr.push(item+' : Onhand='+qtyOnHand+', Transfer qty='+qty);
			}
		}
	}
	return itemArr;
}

function _preventNegInvTxn(type)
{	
	var itemArr		= [];	
	
	if(type=='create')
	{		
		var loc 	= nlapiGetFieldValue('location');		
		var itemCnt = nlapiGetLineItemCount('item');
		
		/* nlapiLogExecution('DEBUG', 'type', type+' loc: '+loc);
		nlapiLogExecution('debug', 'itemCnt', itemCnt); */
		
		for (var line = 1; line <= itemCnt; line++) {
			var itemId	 	= nlapiGetLineItemValue('item', 'item', line);
			var item	 	= nlapiGetLineItemText('item', 'item', line);
			var qty	 		= nlapiGetLineItemValue('item', 'quantity', line);
			
			var itemSearch 	= nlapiSearchRecord("item",null,
								[
								   ["internalidnumber","equalto",itemId], 
								   "AND", 
								   ["inventorylocation","anyof",loc]
								], 
								[
								   new nlobjSearchColumn("type"), 
								   new nlobjSearchColumn("usebins"),								   
								   new nlobjSearchColumn("locationquantityonhand")
								]
							);
			if(_validateData(itemSearch)){
				var itemType 		= itemSearch[0].getValue("type");
				var usebins	 		= itemSearch[0].getValue("usebins");
				var locQtyOnHand 	= itemSearch[0].getValue("locationquantityonhand");
				
				if(!_validateData(locQtyOnHand)) locQtyOnHand = 0;
				
				/* nlapiLogExecution('debug', 'itemType', itemType);
				nlapiLogExecution('debug', 'usebins', usebins);
				nlapiLogExecution('debug', 'locQtyOnHand', locQtyOnHand); */

				if((itemType == 'InvtPart' || itemType =='Assembly') && (Number(qty) > Number(locQtyOnHand))){				
					itemArr.push(item+' : Onhand='+locQtyOnHand+', quantity='+qty);
				}
			}
		}		
		
	}	
	return itemArr;
}

function _preventNegInvVendorCreditTxn(type)
{	
	var itemArr		= [];	
	
	if(type=='create')
	{		
		var itemCnt = nlapiGetLineItemCount('item');		
		//nlapiLogExecution('debug', 'itemCnt', itemCnt);
		
		if(itemCnt > 0){
			for (var line = 1; line <= itemCnt; line++) {
				var itemId	 	= nlapiGetLineItemValue('item', 'item', line);
				var item	 	= nlapiGetLineItemText('item', 'item', line);
				var qty	 		= nlapiGetLineItemValue('item', 'quantity', line);
				var loc	 		= nlapiGetLineItemValue('item', 'location', line);
				var locName		= nlapiGetLineItemText('item', 'location', line);
				
				if(_validateData(itemId) && _validateData(loc)){
					var itemSearch 	= nlapiSearchRecord("item",null,
										[
										   ["internalidnumber","equalto",itemId], 
										   "AND", 
										   ["inventorylocation","anyof",loc]
										], 
										[
										   new nlobjSearchColumn("type"), 
										   new nlobjSearchColumn("usebins"),								   
										   new nlobjSearchColumn("locationquantityonhand")
										]
									);
					if(_validateData(itemSearch)){
						var itemType 		= itemSearch[0].getValue("type");
						var usebins	 		= itemSearch[0].getValue("usebins");
						var locQtyOnHand 	= itemSearch[0].getValue("locationquantityonhand");
						
						if(!_validateData(locQtyOnHand)) locQtyOnHand = 0;
						
						/* nlapiLogExecution('debug', 'itemType', itemType);
						nlapiLogExecution('debug', 'usebins', usebins);
						nlapiLogExecution('debug', 'locQtyOnHand', locQtyOnHand); */

						if((itemType == 'InvtPart' || itemType =='Assembly') && (Number(qty) > Number(locQtyOnHand))){				
							itemArr.push(item+' : Location='+locName+', Onhand='+locQtyOnHand+', quantity='+qty);
						}
					}
				}
			}		
		}
	}	
	return itemArr;
}

function _preventNegInvAssemblyBuildTxn(type)
{	
	var itemArr		= [];	
	
	if(type=='create')
	{		
		var loc 	= nlapiGetFieldValue('location');		
		var itemCnt = nlapiGetLineItemCount('component');
		
		/* nlapiLogExecution('DEBUG', 'type', type+' loc: '+loc);
		nlapiLogExecution('debug', 'itemCnt', itemCnt); */
		
		for (var line = 1; line <= itemCnt; line++) {
			var itemId	 	= nlapiGetLineItemValue('component', 'item', line);
			var item	 	= nlapiGetLineItemText('component', 'item', line);
			var qty	 		= nlapiGetLineItemValue('component', 'quantity', line);			
	
			var itemSearch 	= nlapiSearchRecord("item",null,
								[
								   ["internalidnumber","equalto",itemId], 
								   "AND", 
								   ["inventorylocation","anyof",loc]
								], 
								[
								   new nlobjSearchColumn("type"),
								   new nlobjSearchColumn("name"),
								   new nlobjSearchColumn("usebins"),								   
								   new nlobjSearchColumn("locationquantityonhand")
								]
							);
			if(_validateData(itemSearch)){
				var itemType 		= itemSearch[0].getValue("type");
				var itemName 		= itemSearch[0].getValue("name");
				var usebins	 		= itemSearch[0].getValue("usebins");
				var locQtyOnHand 	= itemSearch[0].getValue("locationquantityonhand");
				
				if(!_validateData(locQtyOnHand)) locQtyOnHand = 0;
				
				/* nlapiLogExecution('debug', 'itemType', itemType);
				nlapiLogExecution('debug', 'usebins', usebins);
				nlapiLogExecution('debug', 'locQtyOnHand', locQtyOnHand); */

				if((itemType == 'InvtPart' || itemType =='Assembly') && (Number(qty) > Number(locQtyOnHand))){				
					itemArr.push(itemName+' : Onhand='+locQtyOnHand+', quantity='+qty);
				}
			}
		}		
		
	}	
	return itemArr;
}