/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version  Date            Author          Remarks
 * 1.00     25 May 2018		Supriya G		This script is used to create corresponding po against Magnum PO
 * 
 */


function approvePurchaseOrder_SL(request, response){
	if (request.getMethod() == 'GET')
	{		
		basePath		= request.getURL();
		if(_validateData(basePath)) basePath = basePath.substring(0,basePath.indexOf("/app"));

		var poid		= request.getParameter('pid');
		nlapiLogExecution('debug', 'param poid', poid);
		if(!_validateData(poid))
			throw nlapiCreateError('ERROR', 'Missing Parameter', true);
		try{
			var recPo			= nlapiLoadRecord('purchaseorder', poid);
			var customform 		= recPo.getFieldValue('customform');
			var approvalstatus 	= recPo.getFieldValue('approvalstatus');
			var actualSupplier 	= recPo.getFieldValue('custbody_inv_actual_supplier');
			var shipaddress 	= recPo.getFieldValue('shipaddress');
			
			if(customform == FRM_PO_IC_MAGNUM && approvalstatus == PENDING_APPROVAL){				
				var rec 	= nlapiCreateRecord('purchaseorder');
				rec.setFieldValue('customform', FRM_PO_SG_DEFAULT);
				rec.setFieldValue('entity', actualSupplier);
				rec.setFieldValue('subsidiary', SUBSID_MAGNUM); // Subsidiary = Magnum = 4
				rec.setFieldValue('location', LOC_MAGNUM);
				rec.setFieldValue('custbody_inv_interco_magnum_po_ref', poid);
				rec.setFieldValue('approvalstatus', APPROVED);
				rec.setFieldValue('custbody_inv_po_shipping_address', shipaddress);
				
				//nlapiLogExecution('debug', 'shipaddress', shipaddress);
				//nlapiLogExecution('debug', 'approvalstatus', APPROVED);
				
				var cnt 	= recPo.getLineItemCount('item');
				for (var line = 1; line <= cnt; line++) {
					if(recPo.getLineItemValue('item', 'itemtype', line) != 'Service'){						
						for(key in MagnumPoToCorresPoLFObj) {				
							if(_validateData(recPo.getLineItemValue('item', key, line))){
								rec.setLineItemValue('item', MagnumPoToCorresPoLFObj[key], line, recPo.getLineItemValue('item', key, line));
							}					
						}
						rec.setLineItemValue('item', 'taxcode', line, TAXCODE_SINGAPORE);						
					}
				}
				var newPoId = nlapiSubmitRecord(rec);
				nlapiLogExecution('debug', 'newPoId', newPoId);
				
				if(_validateData(newPoId)) {
					recPo.setFieldValue('approvalstatus', APPROVED);
					recPo.setFieldValue('custbody_inv_corresponding_po_ref', newPoId);
					nlapiSubmitRecord(recPo);

					nlapiSubmitField('purchaseorder', newPoId, ['custbody_inv_interco_magnum_po_ref', 'approvalstatus'], [poid, APPROVED]);
				}
			}
						
			nlapiSetRedirectURL('RECORD', 'purchaseorder', poid, false);
			
		}catch (e){
			nlapiLogExecution('ERROR', 'ERROR approvePurchaseOrder_SL : ', e);
			throw nlapiCreateError('ERROR', 'ERROR approvePurchaseOrder_SL :: '+e, true);
		}	
	}
}


function createInterCompIF(request){
	nlapiLogExecution('debug', 'request', request.getMethod());
	
	if (request.getMethod() == 'GET')
	{
		var icSO 		= '';
		var irId		= request.getParameter('ir');
		nlapiLogExecution('debug', 'param irId', irId);
		
		try{
			if(_validateData(irId)){
				var items 			= {};
				var irObj			= nlapiLoadRecord('itemreceipt', irId);
				var correspondPO	= irObj.getFieldValue('createdfrom');
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
					icSO 	= transSearch[0].getValue("intercotransaction", "custbody_inv_interco_magnum_po_ref",null);
					nlapiLogExecution('debug', 'icSO', icSO);
				}							
				//nlapiLogExecution('DEBUG', 'irObj', JSON.stringify(irObj));
				
				for (var line = 1; line <= irObj.getLineItemCount('item'); line++) {
					var irInvDetSubRec = [];
					
					var itemId	 	= irObj.getLineItemValue('item', 'item', line);
					var orderline 	= irObj.getLineItemValue('item', 'orderline', line);
					var quantity 	= irObj.getLineItemValue('item', 'quantity', line);
					var itemRecType	= nlapiLookupField('item', itemId, 'recordtype');
					
					irObj.selectLineItem('item', line);
					var subrecord = irObj.viewCurrentLineItemSubrecord('item', 'inventorydetail');
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
							
							irInvDetSubRec.push({lotNumber:lotNumber, binnumber:binnumber, qty:qty});
						}
					}
								
					var itemArr	= {'quantity':quantity, 'itemRecType': itemRecType, 'invdet':irInvDetSubRec};
					orderline	= '';
					items[itemId+'_'+orderline] = itemArr;
					
				}		
				nlapiLogExecution('DEBUG', 'item_fulfillment', 'items: ' + JSON.stringify(items));
				
				
				var ifObj 		= nlapiTransformRecord('salesorder', icSO, 'itemfulfillment');
				
				ifObj.setFieldValue('shipstatus', 'C');
				//var loc 		= ifObj.getFieldValue('location');
				//var receiptBin 	= _getSingleReceiptBin(loc);
				nlapiLogExecution('DEBUG', 'ifObj 1', JSON.stringify(ifObj));
				
				var lines = ifObj.getLineItemCount('item');
				nlapiLogExecution('DEBUG', 'lines===', lines);
				for (line = 1; line <= lines; line++) {
					var itemId	 		= ifObj.getLineItemValue('item', 'item', line);
					var orderline 		= ifObj.getLineItemValue('item', 'orderline', line);
					var lineLocation 	= ifObj.getLineItemValue('item', 'location', line);
					var inventorydetailavail 	= ifObj.getLineItemValue('item', 'inventorydetailavail', line);
					
					//ifObj.setLineItemValue('item', 'itemreceive', line, 'T');
					nlapiLogExecution('DEBUG', 'itemId inventorydetailavail', itemId +' == '+inventorydetailavail);
					
					orderline			= '';
					if(_validateData(items[itemId+'_'+orderline])){
						
						ifObj.setLineItemValue('item', 'quantity', line, items[itemId+'_'+orderline].quantity);					
						if(inventorydetailavail == 'T'){
							var itemRecType		= items[itemId+'_'+orderline].itemRecType;
							var invDet			= items[itemId+'_'+orderline].invdet;							
							
							ifObj.selectLineItem('item', line);					
							var ifDetail 		= ifObj.createCurrentLineItemSubrecord('item', 'inventorydetail');
							var subLineCount 	= ifDetail.getLineItemCount('inventoryassignment');							
							if(subLineCount > 0){
								for(var j = subLineCount ;subLineCount > 0 && j >= 1; j--){
									ifDetail.removeLineItem('inventoryassignment', j);						
								}
							}
						
							for(var i=0; i<invDet.length; i++){
								//nlapiLogExecution('DEBUG', 'invDet[i]: ', invDet[i].lotNumber+' => '+invDet[i].binnumber+' => '+invDet[i].qty);
								ifDetail.selectNewLineItem('inventoryassignment');
								if(_validateData(invDet[i].lotNumber)){
									ifDetail.setCurrentLineItemValue('inventoryassignment', 'receiptinventorynumber', invDet[i].lotNumber);
								}
								if(_validateData(invDet[i].binnumber)){
									ifDetail.setCurrentLineItemValue('inventoryassignment', 'binnumber', invDet[i].binnumber);
								}
								ifDetail.setCurrentLineItemValue('inventoryassignment', 'quantity', invDet[i].qty);
								ifDetail.commitLineItem('inventoryassignment');
							}						
							ifDetail.commit();				
							ifObj.commitLineItem('item');
						}
					}
					else{
						//remove line from IR
						ifObj.setLineItemValue('item', 'itemreceive', line, 'F');
					}						
				}
				//nlapiLogExecution('DEBUG', 'ifObj 2 ==', JSON.stringify(ifObj));
				var irId = nlapiSubmitRecord(ifObj);
				nlapiLogExecution('DEBUG', 'Item Fulfillment Created ', irId);
				
				//return irId;
			}
		}catch(e){
			nlapiLogExecution('ERROR','Error in function _updateInterCompanyTrans :','Details: ' + e);
		}
	}
}