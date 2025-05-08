/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version  Date            Author          Remarks
 * 1.00     14 May 2018		Supriya G		This script is used to set the cross reference of Transfer Order on Work Order 
 * 
 */

function TransferOrder_AS(type){
	if(type == 'create'){
		var toRefs 		= [];
		var recId		= nlapiGetRecordId();
		var woId 		= nlapiGetFieldValue('custbody_inv_wo_ref');
		var poId 		= nlapiGetFieldValue('custbody_inv_outsourced_po_ref');
		if(_validateData(woId)){
			//nlapiSubmitField('workorder', woId, 'custbody_inv_to_ref', recId);
			var woObj		= nlapiLoadRecord('workorder', woId);
			toRef 			= woObj.getFieldValues('custbody_inv_to_ref');
			nlapiLogExecution('debug', 'toRef', toRef);			
			
			if(_validateData(toRef)) {
				toRefs 		= [].concat(toRef);			
			}
			nlapiLogExecution('debug', 'toRefs 1', toRefs);
			toRefs.push(recId);
			nlapiLogExecution('debug', 'toRefs 2', toRefs);
			
			woObj.setFieldValue('custbody_inv_to_ref', [].concat(toRefs));
			nlapiSubmitRecord(woObj);
		}
		
		if(_validateData(poId)){
			nlapiSubmitField('purchaseorder', poId, 'custbody_inv_outsourced_to_ref', recId);			
		}
	}
}