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
function EFM_Image_AS(type){
	var currContext		= nlapiGetContext();
	var execContext		= currContext.getExecutionContext();
	
	nlapiLogExecution('DEBUG', 'execContext', execContext);	
	if(type == 'create' &&  execContext == 'csvimport') {		
		var errorMsg		= '';
		var relatedIfId		= '';
		var parentRef		= '';
		var isTrackingExist	= '';
		var efmStatus		= 1;
		var recType			= nlapiGetRecordType();		
		var recId			= nlapiGetRecordId();
		
		var configRec		= nlapiLoadConfiguration('companypreferences');
		var parentRefId		= configRec.getFieldValue('custscript_inv_efm_fc_parent_ref_id');
		nlapiLogExecution('debug', 'companypreferences parentRefId', parentRefId);
		
		var efmFcImgObj		= nlapiLoadRecord(recType, recId);
		var trackingNumber 	= efmFcImgObj.getFieldValue('custrecord_inv_efm_img_tracking_number');
		var fcImageLink		= efmFcImgObj.getFieldValue('custrecord_inv_efm_img_image_link');
		nlapiLogExecution('debug', 'trackingNumber', trackingNumber);
		
		// Code added on 22 March 2019
		var parentLink 		= efmFcImgObj.getFieldValue('custrecord_efm_img_parent_link');
		nlapiLogExecution('debug', 'from csv parentLink', parentLink);
		if(_validateData(parentLink) && Number(parentLink) > 0){
			parentRefId		= parentLink;
		}
		nlapiLogExecution('debug', 'final parentRefId', parentRefId);
		
		if(_validateData(trackingNumber)){
			var efcFcSearch 	= nlapiSearchRecord("customrecord_inv_efm_fc_child",null,
										[
										   ["custrecord_inv_efm_fc_tracking_number","is", trackingNumber],
										   "AND", 
										   ["custrecord_inv_efm_fc_status","anyof","1"]
										], 
										[
										   new nlobjSearchColumn("internalid")
										]
									);
			if(_validateData(efcFcSearch) && efcFcSearch.length > 0){
				nlapiLogExecution('debug', 'efcFcSearch.length', efcFcSearch.length);
				for(var i = 0; i<efcFcSearch.length; i++){
					efcFcId		= efcFcSearch[i].getValue("internalid");
					nlapiLogExecution('debug', 'efcFcId', efcFcId);
					
					nlapiSubmitField('customrecord_inv_efm_fc_child', efcFcId, ['custrecord_inv_efm_fc_image_link'], [fcImageLink]);					
				}												
			}else{
				errorMsg		= 'Tracking number not found';				
				efmStatus		= 2;
			}
		}
		
		efmFcImgObj.setFieldValue('custrecord_inv_efm_img_status', efmStatus);
		efmFcImgObj.setFieldValue('custrecord_efm_img_parent_link', parentRefId);
		efmFcImgObj.setFieldValue('custrecord_inv_efm_img_error', errorMsg);
		nlapiSubmitRecord(efmFcImgObj);
	}
}