/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version  Date            Author          Remarks
 * 1.00     11 May 2018		Supriya G		
 * 
 */

function WorkOrder_BL(type, form){
	var currContext		= nlapiGetContext();
	var execContext		= currContext.getExecutionContext();
	
	nlapiLogExecution('debug', 'type execContext', type+' => '+execContext);
	if(type == 'view' && execContext == 'userinterface'){
		var recId		= nlapiGetRecordId();
		var woCat		= nlapiGetFieldValue('custbody_inv_wo_category');
		var toRef		= nlapiGetFieldValue('custbody_inv_to_ref');
		var itemCount	= nlapiGetLineItemCount('item');		
		var btnBuild 	= form.getButton('createbuild');
		if(btnBuild != null && _validateData(woCat) && woCat != '1'){
			for(var k = 1; k <= itemCount; k++) {
				var itemtype 	= nlapiGetLineItemValue('item', 'itemtype', k);
				var poId 		= nlapiGetLineItemValue('item', 'itemsourcetransaction', k);
				nlapiLogExecution('debug', 'poId', poId);
				if(_validateData(itemtype) && itemtype == 'Service' && poId == 'Spec. Ord.'){
					btnBuild.setVisible(false);
					
					// display message
					var suffmsg = form.addField('custpage_suff_msg','inlinehtml',null,null,null);
					if(_validateData(form.getField('tranid'))) {
						form.insertField(suffmsg,'tranid');
					}					
					var finalMsg 	= "<font color=\"red\" size=\"2\">You cannot build this Work Order, since Purchase Order for Outsourced Vendor for his Service is not yet created.</font>";			
					suffmsg.setDefaultValue(finalMsg);
				}
			}
		}
		
		if(_validateData(woCat) && woCat != '1' && !_validateData(toRef)){
			var toStr = '';
			toStr = "javascript:";
			toStr += "try{";			
			toStr += "window.location.href='/app/accounting/transactions/trnfrord.nl?woid="+recId+"'";
			toStr += "}catch(e){alert(e);}";
			form.addButton('custpage_create_to','Create Transfer Order', toStr);
		}		
	}
}

function WorkOrder_AS(type){
	var currContext		= nlapiGetContext();
	var execContext		= currContext.getExecutionContext();
	
	nlapiLogExecution('debug', 'type execContext', type+' => '+execContext);
	if(type == 'create' && execContext == 'userinterface'){
		var recId		= nlapiGetRecordId();
		var createdfrom	= nlapiGetFieldValue('createdfrom');
		var queryStr	= nlapiGetFieldValue('entryformquerystring');	
		var soline 		= gqp('soline',queryStr);
		var specord 	= gqp('specord',queryStr);		
		
		//nlapiLogExecution('debug', 'recId', recId);
		//nlapiLogExecution('debug', 'queryStr', queryStr)
		
		if(_validateData(soline) && !_validateData(specord)){
			nlapiLogExecution('debug', 'soline', soline)
			var soRec 	= nlapiLoadRecord('salesorder', createdfrom);
			var lineNum = soRec.findLineItemValue('item', 'line', soline);
            if (lineNum > 0) {                
				soRec.setLineItemValue('item', 'custcol_inv_standalone_wo', lineNum, recId);
			}
			nlapiSubmitRecord(soRec);
		}		
	}
}