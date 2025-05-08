/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version  Date            	Author          Remarks
 * 1.00     12 April 2018		Supriya G		This script is used to hide SO, Invoice, Cash sale button when status is processed/Closed or
 *												custom approval status is pending approval 
 * 
 */


// User Event script Before Load
function Estimate_BL(type, form, request) {
	var currContext		= nlapiGetContext();
	var execContext		= currContext.getExecutionContext();
	
	if(type == 'view' &&  execContext == 'userinterface') {		
		//var approvalStatus	= nlapiGetFieldValue('custbody_inv_txn_approval_status');
		var currStatus		= nlapiGetFieldValue('status');
		
		//if(approvalStatus == PENDING_APPROVAL || approvalStatus == REJECTED || currStatus == 'Processed' || currStatus == 'Closed'){
		if(currStatus == 'Processed' || currStatus == 'Closed'){
			btnSO 	= form.getButton('createsalesord');
			if (btnSO != null){
				btnSO.setVisible(false);
			}

			btnCashSale	= form.getButton('createcashsale');
			if (btnCashSale != null){
				btnCashSale.setVisible(false);
			}
			
			btnInvoice	= form.getButton('createinvoice');
			if (btnInvoice != null){
				btnInvoice.setVisible(false);
			}
		}
		
		//if((approvalStatus == APPROVED || approvalStatus == REJECTED) && currStatus != 'Processed'){
		if(currStatus != 'Processed'){
			var nxtVerStr = '';
			nxtVerStr = "javascript:";
			nxtVerStr += "try{";			
			nxtVerStr += "window.location.href=document.location.toString()+'&e=T&memdoc=0&nxtVer=T'";
			nxtVerStr += "}catch(e){alert(e);}";
			form.addButton('custpage_nxt_version','Next Version', nxtVerStr);
		}
	} // end of type == 'view'
	
	if((type == 'create' || type == 'edit' || type == 'copy') &&  execContext == 'userinterface'){
		var title = form.getField('title');
		title.setMandatory(true);
	}
	
	if(type == 'edit' &&  execContext == 'userinterface'){
		var currStatus		= nlapiGetFieldValue('status');
		if(currStatus == 'Closed'){
			form.getField('probability').setDisplayType('disabled');
		}
	}
}

function Estimate_BS(type) {
	if(type == 'create'){
		var entity		= nlapiGetFieldValue('entity');
		if(_validateData(entity)){
			var custClass	= nlapiLookupField('customer', entity, 'custentity_inv_class');
			nlapiLogExecution('debug', 'custClass', custClass);
			nlapiSetFieldValue('class', custClass)
		}
	}
}

function Estimate_AS(type) {	
	if(type == 'create'){
		var recId	= nlapiGetRecordId();
		var rec 	= nlapiLoadRecord('estimate', recId);
		var dt 		= rec.getFieldValue('createddate');
		var dtArr 	= dt.split(' ');
		var curDate = dtArr[0];
		
		//nlapiLogExecution('DEBUG', 'dt', dt);
		//nlapiLogExecution('DEBUG', 'curDate', curDate);		
		//nlapiLogExecution('DEBUG', 'nlapiGetFieldValue createddate', nlapiGetFieldValue('createddate'));
		
		var preVer = rec.getFieldValue('custbody_inv_previous_version');
		if(_validateData(preVer)){
			var estObj = nlapiLoadRecord('estimate', preVer);
			estObj.setFieldValue('probability', '0');
			estObj.setFieldValue('expectedclosedate', curDate);
			nlapiSubmitRecord(estObj);
		}
	}
}