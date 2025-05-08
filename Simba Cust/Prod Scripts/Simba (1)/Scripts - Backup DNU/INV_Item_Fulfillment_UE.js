/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version  Date            Author          Remarks
 * 1.00     26 Mar 2018		Supriya G		Auto creation of Intercompny Item Receipt, Vendor Bill and Invoice.
 * 
 */

 var SHIP_STATUS = {
    Picked: 'A',
    Packed: 'B',
    Shipped: 'C'
};

// SO00245159
/* function ItemFulfillment_BS(type){
	nlapiLogExecution('DEBUG', 'In ItemFulfillment_BS type', type);
	
	if(type == 'create' || type == 'edit'){
		var binArr	= [];
		var cnt 	= nlapiGetLineItemCount('item');
		
		var recd 	= nlapiGetNewRecord();
		nlapiLogExecution('DEBUG', 'recd', JSON.stringify(recd));
			
			
		for (var line = 1; line <= cnt; line++) {
			//var ifInvDetSubRec = [];
			
			var itemId	 	= nlapiGetLineItemValue('item', 'item', line);			
			var itemRecType	= nlapiLookupField('item', itemId, 'recordtype');
			
			
			var subrecord = nlapiEditLineItemSubrecord('item', 'inventorydetail', line);
			nlapiLogExecution('DEBUG', 'subrecord 1', JSON.stringify(subrecord));
			
			nlapiSelectLineItem('item', line);
			var subrecord = nlapiViewCurrentLineItemSubrecord('item', 'inventorydetail');
			nlapiLogExecution('DEBUG', 'subrecord', JSON.stringify(subrecord));
			if(subrecord != null)
			{
				subLineCount = subrecord.getLineItemCount('inventoryassignment');
				nlapiLogExecution('DEBUG', 'subLineCount', subLineCount);
				for( j = 1 ; j <= subLineCount; j++)
				{				
					subrecord.selectLineItem('inventoryassignment', j);					
					var binnumber	= subrecord.getCurrentLineItemValue('inventoryassignment', 'binnumber');
					nlapiLogExecution('DEBUG', 'binnumber', binnumber);
					
					binArr.push(binnumber);
				}
			}
		}
		
		if(binArr.length > 0){
			var binSearch 	= nlapiSearchRecord("bin",null,
								[
								   ["custrecord_inv_is_receipt_bin","is","T"], 
								   "AND", 
								   ["internalid","anyof", binArr]
								], 
								[
								   new nlobjSearchColumn("binnumber")
								]
								);
			if(_validateData(binSearch) && binSearch.length > 0){
				var binnumber	= binSearch[0].getValue("binnumber");
				throw nlapiCreateError('ERROR', 'You can not fulfill items from the receiting bin ('+binnumber+')', true);
			}
		}
	}
} */

/* function ItemFulfillment_BS(type){
	var currContext		= nlapiGetContext();
	var execContext		= currContext.getExecutionContext();
	
	nlapiLogExecution('DEBUG', 'In ItemFulfillment_BS type', type+ ' = '+execContext);
	
	if(type == 'create' && execContext == 'suitelet'){
		var createdfrom		= nlapiGetFieldValue('createdfrom');		
		var createdfromType = _getTypeOfCreatedFrom(createdfrom);
		nlapiLogExecution('DEBUG', 'createdfromType', createdfromType);
		
		if(createdfromType == 'SalesOrd'){
			var soObj 			= nlapiLoadRecord('salesorder', createdfrom);
			var cnt 			= nlapiGetLineItemCount('item');
			nlapiLogExecution('DEBUG', 'cnt', cnt);
			
			for (var line = 1; line <= cnt; line++) {
				var itemId	 	= nlapiGetLineItemValue('item', 'item', line);
				var itemName 	= nlapiGetLineItemText('item', 'item', line);
				var ifOrderline	= nlapiGetLineItemValue('item', 'orderline', line);
				var ifLoc	 	= nlapiGetLineItemValue('item', 'location', line);
				nlapiLogExecution('DEBUG', 'ifOrderline', ifOrderline);
				nlapiLogExecution('DEBUG', 'ifLoc', ifLoc);
				
				for (var s = 1; s <= soObj.getLineItemCount('item'); s++) {
					
					var soLine		= soObj.getLineItemValue('item', 'line', s);
					var soLoc		= soObj.getLineItemValue('item', 'location', s);				
						
					if(soLine == ifOrderline){
						nlapiLogExecution('DEBUG', 'soLine', soLine);
						nlapiLogExecution('DEBUG', 'soLoc', soLoc);
						if(soLoc != ifLoc){
							var msg = 'Picking Location does not match with Sales Order location for item - '+itemName;
							throw nlapiCreateError('Invalid Action', msg, true);
						}
					}
				}
			}
		}
	}
} */

// User Event script after Submit : Auto creation of Intercompny Item Receipt, Vendor Bill and Invoice.
function ItemFulfillment_AS(type, form){
	var recType		= nlapiGetRecordType();
	var recId		= nlapiGetRecordId();
	
	nlapiLogExecution('DEBUG', 'In ItemFulfillment_AS type', type+ ' = '+recType);
	if(_validateData(recId) && (type=='create' || type=='copy' || type=='edit' || type=='ship'))
	{
		var recObj			= nlapiLoadRecord(recType, recId);
		var createdfrom		= recObj.getFieldValue('createdfrom');
		var shipstatus		= recObj.getFieldValue('shipstatus');
		var subsidiaryId 	= recObj.getFieldValue('subsidiary');
		
		nlapiLogExecution('DEBUG', 'createdfrom', createdfrom);
		// Old Rec
		var oldRecord 		= nlapiGetOldRecord();
		var oldShipstatus 	= oldRecord && oldRecord.getFieldValue('shipstatus');
		//var oldShipstatus	= ''; // TODO : Comment this line
		
		var createdfromType = _getTypeOfCreatedFrom(createdfrom);
		nlapiLogExecution('DEBUG', 'createdfromType', createdfromType);
		if(createdfromType == 'SalesOrd'){
			var soObj 			= nlapiLoadRecord('salesorder', createdfrom);
			var intercotrans 	= soObj.getFieldValue('intercotransaction');
			var autoInvEmail 	= soObj.getFieldValue('custbody_kl_auto_invoice_email_check');
			var autoIr 			= soObj.getFieldValue('custbody_inv_auto_ic_ir');
					
			if(_validateData(intercotrans) && autoIr == 'T' && oldShipstatus != shipstatus && shipstatus == SHIP_STATUS.Shipped) {
				var invId 	= _createInterComInvoice(createdfrom); // TODO : Uncomment this line
				var irId 	= _createInterComItemReceipt(soObj);			
				if(_validateData(irId)){
					_createInterComBill(intercotrans, irId, invId); // TODO : Uncomment this line
				}
			}
		}		
	}			
}

/* function _getTypeOfCreatedFrom(createdFrom){
	var type = '';
	try{
		var tranSearch = nlapiSearchRecord("transaction",null,
							[
							   ["internalidnumber","equalto",createdFrom], 
							   "AND", 
							   ["mainline","is","T"]
							], 
							[
							   new nlobjSearchColumn("type")
							]
							);
							
		if(_validateData(tranSearch)){
			type = tranSearch[0].getValue("type");
		}
		
		return type;
	}catch(e){
		nlapiLogExecution('ERROR','Error in function _getTypeOfCreatedFrom :','Details: ' + e);
	}
} */

// Auto creation of Intercompny Invoice
function _createInterComInvoice(soId) {
    try {
		if(_validateData(soId)){
			var items 	= {};
			var record 	= nlapiGetNewRecord();       
			for (var line = 1; line <= record.getLineItemCount('item'); line++) {
				var orderline = record.getLineItemValue('item', 'orderline', line);
				var quantity = record.getLineItemValue('item', 'quantity', line);
				
				items[orderline] = quantity;
			}
			//nlapiLogExecution('DEBUG', '_createInterComInvoice', 'items: ' + JSON.stringify(items));
					
			var invObj 	= nlapiTransformRecord('salesorder', soId, 'invoice');			
			var lines 	= invObj.getLineItemCount('item');
			for (line = lines; line >= 1; line--) {
				var lineId = invObj.getLineItemValue('item', 'orderline', line);
				//nlapiLogExecution('DEBUG', '_createInterComInvoice', 'line: ' + line + ', lineId: ' + lineId);
				if (!!items[lineId]) {
					invObj.selectLineItem('item', line);
					invObj.setCurrentLineItemValue('item', 'quantity', items[lineId]);
					invObj.commitLineItem('item');
				}
				else {
					invObj.removeLineItem("item", line);
				}
			}            
			var invoiceId 	= nlapiSubmitRecord(invObj, true, true);
			nlapiLogExecution('DEBUG', '_createInterComInvoice:createInvoice', 'invoiceId: ' + invoiceId);
			
			return invoiceId;
		}
    } catch (exp) {
        nlapiLogExecution('ERROR', '_createInterComInvoice', exp.toString());
	}
}

// Auto creation of Intercompny Vendor Bill
function _createInterComBill(poId, irId, invId) {
   try {
		if(_validateData(poId) && _validateData(irId)){
			var items 	= {};
			var record 	= nlapiLoadRecord('itemreceipt', irId);       
			for (var line = 1; line <= record.getLineItemCount('item'); line++) {
				var orderline 	= record.getLineItemValue('item', 'orderline', line);
				var quantity 	= record.getLineItemValue('item', 'quantity', line);
				
				items[orderline] = quantity;
			}
			//nlapiLogExecution('DEBUG', '_createInterComBill', 'items: ' + JSON.stringify(items));
					
			var billObj = nlapiTransformRecord('purchaseorder', poId, 'vendorbill');
			billObj.setFieldValue('approvalstatus', 2); // 2 = Approved
			if(_validateData(invId)){
				billObj.setFieldValue('tranid', invId);
			}
			var lines 	= billObj.getLineItemCount('item');
			for (line = lines; line >= 1; line--) {
				var lineId 	= billObj.getLineItemValue('item', 'orderline', line);
				//nlapiLogExecution('DEBUG', '_createInterComBill', 'line: ' + line + ', lineId: ' + lineId);
				if (!!items[lineId]) {
					billObj.selectLineItem('item', line);
					billObj.setCurrentLineItemValue('item', 'quantity', items[lineId]);
					billObj.commitLineItem('item');
				}
				else {
					billObj.removeLineItem("item", line);
				}
			}            
			var billId 	= nlapiSubmitRecord(billObj, true, true);
			nlapiLogExecution('DEBUG', '_createInterComBill:createBill', 'billId: ' + billId);					
		}
    } catch (exp) {
        nlapiLogExecution('ERROR', '_createInterComBill', exp.toString());
	}
}


// Auto creation of Intercompny Item Receipt
function _createInterComItemReceipt(soObj){
	
	try{
		if(_validateData(soObj)){
			var items 	= {};
			//var itemArr	= {};
			var soId 	= soObj.getId();
			var poId 	= soObj.getFieldValue('intercotransaction');
			
			var recId	= nlapiGetRecordId();
			var ifObj 	= nlapiLoadRecord('itemfulfillment', recId);
			//nlapiLogExecution('DEBUG', 'ifObj', JSON.stringify(ifObj));
			
			for (var line = 1; line <= ifObj.getLineItemCount('item'); line++) {
				var ifInvDetSubRec = [];
				
				var itemId	 	= ifObj.getLineItemValue('item', 'item', line);
				var orderline 	= ifObj.getLineItemValue('item', 'orderline', line);
				var quantity 	= ifObj.getLineItemValue('item', 'quantity', line);
				var itemRecType	= nlapiLookupField('item', itemId, 'recordtype');
				
				ifObj.selectLineItem('item', line);
				var subrecord = ifObj.viewCurrentLineItemSubrecord('item', 'inventorydetail');
				//nlapiLogExecution('DEBUG', 'subrecord', JSON.stringify(subrecord));
				if(subrecord != null)
				{
					subLineCount = subrecord.getLineItemCount('inventoryassignment');
					//nlapiLogExecution('DEBUG', 'subLineCount', subLineCount);
					for( j = 1 ; j <= subLineCount; j++)
					{
						var lotNumber	= '';
						subrecord.selectLineItem('inventoryassignment', j);
						if(itemRecType == 'lotnumberedinventoryitem' || itemRecType == 'lotnumberedassemblyitem')	
						{
							lotNumber 	= subrecord.getCurrentLineItemText('inventoryassignment', 'issueinventorynumber');
						}
						var binnumber	= subrecord.getCurrentLineItemValue('inventoryassignment', 'binnumber');
						var qty	 		= subrecord.getCurrentLineItemValue('inventoryassignment', 'quantity');
						
						ifInvDetSubRec.push({lotNumber:lotNumber, binnumber:binnumber, qty:qty});
					}
				}
								
				var itemArr	= {'quantity':quantity, 'itemRecType': itemRecType, 'invdet':ifInvDetSubRec};
				orderline	= '';
				items[itemId+'_'+orderline] = itemArr;
				
			}		
			//nlapiLogExecution('DEBUG', 'item_fulfillment', 'items: ' + JSON.stringify(items));
			
			
			var irObj 		= nlapiTransformRecord('purchaseorder', poId, 'itemreceipt');
			var loc 		= irObj.getFieldValue('location');
			var receiptBin 	= _getSingleReceiptBin(loc);
			
			var lines = irObj.getLineItemCount('item');
			for (line = 1; line <= lines; line++) {
				var itemId	 		= irObj.getLineItemValue('item', 'item', line);
				var orderline 		= irObj.getLineItemValue('item', 'orderline', line);
				var lineLocation 	= irObj.getLineItemValue('item', 'location', line);
				var inventorydetailavail 	= irObj.getLineItemValue('item', 'inventorydetailavail', line);
				
				nlapiLogExecution('DEBUG', 'itemId inventorydetailavail', itemId +' == '+inventorydetailavail);
				
				orderline	= '';
				if(_validateData(items[itemId+'_'+orderline])){
					
					irObj.setLineItemValue('item', 'quantity', line, items[itemId+'_'+orderline].quantity);
					
					if(inventorydetailavail == 'T'){
						var itemRecType		= items[itemId+'_'+orderline].itemRecType;
						var invDet			= items[itemId+'_'+orderline].invdet;
											
						irObj.selectLineItem('item', line);					
						var irDetail 		= irObj.createCurrentLineItemSubrecord('item', 'inventorydetail');
						var subLineCount 	= irDetail.getLineItemCount('inventoryassignment');
						//nlapiLogExecution('DEBUG', 'itemId subLineCount', itemId +' == '+subLineCount);
						if(subLineCount > 0){
							for(var j = subLineCount ;subLineCount > 0 && j >= 1; j--)
							{
								irDetail.removeLineItem('inventoryassignment', j);						
							}
						}
						
						if(invDet.length > 0){
							for(var i=0; i<invDet.length; i++){
								//nlapiLogExecution('DEBUG', 'invDet[i]: ', invDet[i].lotNumber+' => '+invDet[i].binnumber+' => '+invDet[i].qty);
								irDetail.selectNewLineItem('inventoryassignment');
								if(_validateData(invDet[i].lotNumber)){
									irDetail.setCurrentLineItemValue('inventoryassignment', 'receiptinventorynumber', invDet[i].lotNumber);
								}
								if(_validateData(receiptBin)){
									irDetail.setCurrentLineItemValue('inventoryassignment', 'binnumber', receiptBin);
								}
								irDetail.setCurrentLineItemValue('inventoryassignment', 'quantity', invDet[i].qty);
								irDetail.commitLineItem('inventoryassignment');
							} 
						}
						else{
							irDetail.selectNewLineItem('inventoryassignment');
							if(_validateData(receiptBin)){
								irDetail.setCurrentLineItemValue('inventoryassignment', 'binnumber', receiptBin);
							}
							irDetail.setCurrentLineItemValue('inventoryassignment', 'quantity', items[itemId+'_'+orderline].quantity);
							irDetail.commitLineItem('inventoryassignment');
						}
						irDetail.commit();				
						irObj.commitLineItem('item');
					}
				}
				else{
					//remove line from IR
					irObj.setLineItemValue('item', 'itemreceive', line, 'F');
				}						
			}
			//nlapiLogExecution('DEBUG', 'irObj', JSON.stringify(irObj));
			var irId = nlapiSubmitRecord(irObj);
			nlapiLogExecution('DEBUG', 'Item Recipt Created ', irId);
			
			return irId;
		}
	}catch(e){
		nlapiLogExecution('ERROR','Error in function _updateInterCompanyTrans :','Details: ' + e);
	}
}


function _checkPreferredBinSet(itemId, loc){
	var prefBinExist  = 0;
	var itemSearch = nlapiSearchRecord("item",null,
						[
						   ["internalid","anyof", itemId], 
						   "AND", 
						   ["preferredbin","is","T"], 
						   "AND", 
						   ["binnumber.location","anyof", loc]
						], 
						[											   
						   new nlobjSearchColumn("binnumber"),											   
						   new nlobjSearchColumn("location","binNumber",null)
						]
					);						
	if(_validateData(itemSearch) && itemSearch.length > 0){
		prefBinExist = 1;
	}
	
	return prefBinExist;
}

function _getSingleReceiptBin(loc){
	var receiptBin 	= '';
	try{
		var binSearch 	= nlapiSearchRecord("bin",null,
							[
							   ["custrecord_inv_is_receipt_bin","is","T"], 
							   "AND", 
							   ["inactive","is","F"], 
							   "AND", 
							   ["location","anyof", loc]
							], 
							[
							   new nlobjSearchColumn("binnumber").setSort(false),							   
							   new nlobjSearchColumn("internalid")
							]
						);
		if(_validateData(binSearch)){
			receiptBin = binSearch[0].getValue("internalid");
		}
		
		return receiptBin;
	}catch(e){
		nlapiLogExecution('ERROR','Error in function _getFirstReceiptBin :','Details: ' + e);
	}
}