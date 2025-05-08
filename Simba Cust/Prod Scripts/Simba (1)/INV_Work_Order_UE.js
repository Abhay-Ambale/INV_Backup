/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version  Date            Author          Remarks
 * 1.00     11 May 2018		Supriya G		
 * 
 */

 // WO00010981
 // Process Order Refs, TO Ref
function WorkOrder_BL(type, form){
	var currContext		= nlapiGetContext();
	var execContext		= currContext.getExecutionContext();
	
	nlapiLogExecution('debug', 'type execContext', type+' => '+execContext);
	if(type == 'view' && execContext == 'userinterface'){
		var finalMsg 	= '';
		var showPoButton 	= 1;
		var recId		= nlapiGetRecordId();
		var wostatus	= nlapiGetFieldValue('orderstatus');
		var woCat		= nlapiGetFieldValue('custbody_inv_wo_category');
		var poRef		= [].concat(nlapiGetFieldValues('custbody_inv_process_order_refs'));
		nlapiLogExecution('debug', 'poRef', poRef);
						
		var itemCount	= nlapiGetLineItemCount('item');		
		var btnBuild 	= form.getButton('createbuild');
		if(_validateData(woCat) && woCat != '1' && wostatus != 'G'){
			
			if(!_validateData(poRef)){				
				finalMsg 		= "<font color=\"red\" size=\"2\">You cannot build this Work Order, since Purchase Order for Outsourced Vendor for his Service is not yet created.</font>";
				if(btnBuild != null)
					btnBuild.setVisible(false);
			}else {				
				var poSearch = nlapiSearchRecord("purchaseorder",null,
												[
												   ["type","anyof","PurchOrd"], 
												   "AND", 
												   ["internalid","anyof", poRef], 
												   "AND", 
												   ["approvalstatus","anyof","1"], 
												   "AND", 
												   ["mainline","is","T"]
												], 
												[
												   new nlobjSearchColumn("tranid")
												]
												);
				if(_validateData(poSearch) && poSearch.length > 0){
					var tranid		= poSearch[0].getValue("tranid");
					finalMsg 		= "<font color=\"red\" size=\"2\">You cannot build this Work Order, since Purchase Order <b>"+tranid+"</b> for Outsourced Vendor for his Service is not yet approved.</font>";
					
					showPoButton	= 0;
					if(btnBuild != null) btnBuild.setVisible(false);
				}			
				
			}
			
			// display message
			if(_validateData(finalMsg)){				
				var suffmsg 	= form.addField('custpage_suff_msg','inlinehtml',null,null,null);
				if(_validateData(form.getField('tranid'))) {
					form.insertField(suffmsg,'tranid');
				}					
				suffmsg.setDefaultValue(finalMsg);		
			}			
		}
		
		if(_validateData(woCat) && woCat != '1' && showPoButton == 1 && wostatus != 'G'){
			var poStr = '';
			poStr 	= "javascript:";
			poStr 	+= "try{";			
			poStr 	+= "window.location.href='/app/accounting/transactions/purchord.nl?cf=196&woid="+recId+"'";
			poStr 	+= "}catch(e){alert(e);}";
			form.addButton('custpage_create_po','Create Purchase Order', poStr);
		}
		/*  */		
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