/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version  Date            Author          Remarks
 * 1.00     1 Feb 2019		Supriya G		This User Event script validates the data, update the Item Fulfillments
 * 
 */

// Before Submit
// Need to do After Submit
function EFM_FC_AS(type){
	var currContext		= nlapiGetContext();
	var execContext		= currContext.getExecutionContext();
	
	nlapiLogExecution('DEBUG', 'execContext', execContext);	
	if(type == 'create' &&  execContext == 'csvimport') {		
		var errorMsg		= '';
		var relatedIfId		= '';
		var parentRef		= '';
		var sellValue		= '';
		var freightCost		= '';
		var isTrackingExist	= '';
		var efmStatus		= 1;
		var recType			= nlapiGetRecordType();		
		var recId			= nlapiGetRecordId();
		
		var configRec		= nlapiLoadConfiguration('companypreferences');
		var parentRefId		= configRec.getFieldValue('custscript_inv_efm_fc_parent_ref_id');
		//nlapiLogExecution('debug', 'parentRefId', parentRefId);
		
		var efmFcObj		= nlapiLoadRecord(recType, recId);
		var trackingNumber 	= efmFcObj.getFieldValue('custrecord_inv_efm_fc_tracking_number');
		var netCost 		= efmFcObj.getFieldValue('custrecord_inv_efm_fc_net_cost');
		freightCost			= netCost;
		
		// Code added on 22 March 2019
		var parentLink 		= efmFcObj.getFieldValue('custrecord_efm_fc_parent_link');
		if(_validateData(parentLink) && parentLink > 0){
			parentRefId		= parentLink;
		}
		
		nlapiLogExecution('debug', 'trackingNumber', trackingNumber);
		if(_validateData(trackingNumber)){
			isTrackingExist		= _checkTrackingNumberProcessed(trackingNumber);
			nlapiLogExecution('debug', 'isTrackingExist', isTrackingExist);
			if(isTrackingExist == 1){
				errorMsg		= 'Tracking Number already exist.';				
				efmStatus		= 2;
			}
		}
		if(_validateData(trackingNumber) && isTrackingExist == 0){
			var fulfillmentSearch 	= nlapiSearchRecord("itemfulfillment",null,
										[
										   ["type","anyof","ItemShip"], 
										   "AND",
										   ["mainline","any",""], 
										   "AND", 
										   ["shipping","is","F"], 
										   "AND", 
										   ["cogs","is","F"], 
										   "AND", 
										   ["taxline","is","F"],
										   "AND",
										   ["trackingnumber","is", trackingNumber]
										], 
										[
										   new nlobjSearchColumn("internalid",null,"GROUP"),    
										   new nlobjSearchColumn("formulacurrency", null, "SUM").setFormula("{quantity} * {custcol_inv_item_selling_price}")
										]
									);
			if(_validateData(fulfillmentSearch) && fulfillmentSearch.length > 0){
				nlapiLogExecution('debug', 'fulfillmentSearch.length', fulfillmentSearch.length);
				if(fulfillmentSearch.length == 1){
					relatedIfId		= fulfillmentSearch[0].getValue("internalid", null, "GROUP");
					sellValue		= fulfillmentSearch[0].getValue("formulacurrency", null, "SUM");
				}
				else {
					var sum	= 0;
					for(var i=0; i<fulfillmentSearch.length; i++){
						var ifValue	= fulfillmentSearch[i].getValue("formulacurrency", null, "SUM");						
						sum			= sum + Number(ifValue);
					}
					nlapiLogExecution('debug', 'sum ', sum);
					
					// create new records for other fulfillments
					var lineSum		= 0;
					for(var i=1; i< fulfillmentSearch.length; i++){
						var ifId	= fulfillmentSearch[i].getValue("internalid", null, "GROUP");
						var ifValue	= fulfillmentSearch[i].getValue("formulacurrency", null, "SUM");		
						
						var newFrieghtCost 	= (Number(ifValue) / Number(sum)) * Number(netCost);						
						newFrieghtCost		= Number(newFrieghtCost).toFixed(2);
						lineSum				= Number(lineSum) + Number(newFrieghtCost);
						nlapiLogExecution('debug', 'ifValue '+i, ifValue);
						nlapiLogExecution('debug', 'newFrieghtCost '+i, newFrieghtCost);
						
						var newRecObj 		= nlapiCreateRecord(recType);	
						newRecObj.setFieldValue('custrecord_inv_efm_fc_tracking_number', trackingNumber);
						newRecObj.setFieldValue('custrecord_inv_efm_fc_items_qty_pallets', efmFcObj.getFieldValue('custrecord_inv_efm_fc_items_qty_pallets'));
						newRecObj.setFieldValue('custrecord_inv_efm_fc_weight', efmFcObj.getFieldValue('custrecord_inv_efm_fc_weight'));
						newRecObj.setFieldValue('custrecord_inv_efm_fc_volume', efmFcObj.getFieldValue('custrecord_inv_efm_fc_volume'));
						newRecObj.setFieldValue('custrecord_inv_efm_fc_net_cost', efmFcObj.getFieldValue('custrecord_inv_efm_fc_net_cost'));						
						newRecObj.setFieldValue('custrecord_inv_efm_fc_status', 1); // 1= Successful						
						newRecObj.setFieldValue('custrecord_efm_fc_parent_link', parentRefId);						
						newRecObj.setFieldValue('custrecord_inv_efm_fc_related_ifs', ifId);
						newRecObj.setFieldValue('custrecord_inv_efm_fc_sell_value', ifValue);
						newRecObj.setFieldValue('custrecord_inv_efm_fc_freight_cost', Number(newFrieghtCost));
						nlapiSubmitRecord(newRecObj);
					}

					// set first Item Fulfillment id for current record
					relatedIfId		= fulfillmentSearch[0].getValue("internalid", null, "GROUP");
					sellValue		= fulfillmentSearch[0].getValue("formulacurrency", null, "SUM");
					//freightCost 	= (Number(sellValue) / Number(sum)) * Number(netCost);					
					freightCost		= Number(netCost) - Number(lineSum);
					
					nlapiLogExecution('debug', 'lineSum ', lineSum);
					nlapiLogExecution('debug', 'netCost ', netCost);
				}				
			}else{
				errorMsg		= 'Item Fulfillment not found.';				
				efmStatus		= 2;
			}
		}
		
		efmFcObj.setFieldValue('custrecord_inv_efm_fc_status', efmStatus);
		efmFcObj.setFieldValue('custrecord_inv_efm_fc_freight_cost', freightCost);
		efmFcObj.setFieldValue('custrecord_inv_efm_fc_sell_value', sellValue);
		efmFcObj.setFieldValue('custrecord_efm_fc_parent_link', parentRefId);
		efmFcObj.setFieldValue('custrecord_inv_efm_fc_error', errorMsg);
		efmFcObj.setFieldValue('custrecord_inv_efm_fc_related_ifs', relatedIfId);
		nlapiSubmitRecord(efmFcObj);
	}
}

function _checkTrackingNumberProcessed(trackingNumber){
	var isExist = 0;
	if(_validateData(trackingNumber)){
		var efmFcSearch = nlapiSearchRecord("customrecord_inv_efm_fc_child",null,
								[
								   ["custrecord_inv_efm_fc_tracking_number","is", trackingNumber], 
								   "AND", 
								   ["custrecord_inv_efm_fc_related_ifs","noneof","@NONE@"]
								], 
								[
								   new nlobjSearchColumn("internalid")
								]
							);
		if(_validateData(efmFcSearch) && efmFcSearch.length > 0){
			isExist = 1;
		}
	}
	
	return isExist;
}