/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version  Date            Author          Remarks
 * 1.00     31 May 2018		Supriya G		This script is used to
 * 
 */


function RFQ_BL(type, form, request) {
	var currContext		= nlapiGetContext();
	var execContext		= currContext.getExecutionContext();
	
	if((type == 'create' || type == 'edit' || type == 'view' || type == 'copy') && execContext == 'userinterface'){
		var total = form.getField('total');
		if(_validateData(total)) {
			total.setDisplayType('hidden');
		}
		
		var currency = form.getField('currency');
		if(_validateData(currency)) {
			//currency.setDisplayType('hidden');
		}
		
		var exchangerate = form.getField('exchangerate');
		if(_validateData(exchangerate)) {
			//exchangerate.setDisplayType('hidden');
		}
		
		// line level fields
		var subList = form.getSubList('line');
		if(_validateData(subList)) {
			if(_validateData(subList.getField('history'))) {
				subList.getField('history').setDisplayType('hidden');
			}
			if(_validateData(subList.getField('account'))) {
				subList.getField('account').setDisplayType('hidden');
			}
			if(_validateData(subList.getField('amount'))) {
				subList.getField('amount').setDisplayType('hidden');
			}
		}
	}
	
	if(type =='view' && execContext == 'userinterface'){
		var basePath	= request.getURL();
		basePath		= basePath.substring(0,basePath.indexOf("/app"));
		var suitURL		= nlapiResolveURL("SUITELET", "customscript_inv_rfq_sl","customdeploy_inv_rfq_sl", null);
		var mainURL		= basePath + suitURL +'&recId='+nlapiGetRecordId()+'&recType='+nlapiGetRecordType()+'&isPrint=F';
		form.addButton("custpage_print_pdf", 'Print PDF',"window.open('"+mainURL+"', '_blank');");
	}
}