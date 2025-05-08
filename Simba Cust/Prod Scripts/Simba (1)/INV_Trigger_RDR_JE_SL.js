/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
 || This suitelet script is used to display and select lines from the custom record 		||
 || 'Customers Rebate Discount Royalties' to trigger the month end Journal. 				||
 || Scheduled script triggers in post action to create a RDR Journal 						||
 || for each selected line/record. 															||
 || 'INV Trigger RDR JE SL' with NetSuite in Suitescript 2.0 								||
 ||                                                               							||
 ||                                                               							||
 ||  Version      Date           Author         	Remarks                   				||
 ||    1.0     27/10/2020    Supriya Gunjal    		Initial Commit	  						||
 ||  	  																					||
  \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
  
/**
 * @NApiVersion 2.0
 * @NScriptType Suitelet
*/ 
  
var COMM,RECORD,SEARCH, SERVERWIDGET, RUNTIME, TASK, REDIRECT;
define(['./Library_Files/INV_common_functions_LIB.js','N/record','N/search','N/ui/serverWidget', 'N/runtime', 'N/task', 'N/redirect'], INV_Trigger_RDR_JE_SL);

function INV_Trigger_RDR_JE_SL(comm, record, search, serverWidget, runtime, task, redirect)
{
	COMM   		= comm;
	RECORD    	= record;
	SEARCH 		= search;
	SERVERWIDGET = serverWidget;	
	RUNTIME		= runtime;
	TASK		= task;
	REDIRECT	= redirect;
	
	return{
		onRequest: _onRequest
	}
}

function _onRequest(context)
{
	var rdrIdsArr	= [];
	var sublistId 	= 'custpage_rdrsublist';
	var request		= context.request;
	var scriptObj 	= RUNTIME.getCurrentScript();
	
	if(context.request.method === 'POST'){
			
		var jeDate 			= request.parameters.custpage_date;
		var stDate 			= request.parameters.custpage_startdate;
		var endDate 		= request.parameters.custpage_enddate;
		var reversalDate 	= request.parameters.custpage_reversal_date;
		
		var lineCount 	= request.getLineCount({group : sublistId});
		//log.debug("jeDate", jeDate);		
		
		for(var i = 0; i < lineCount; i++) {
			var isSelect 		= request.getSublistValue({group:sublistId, name: 'custpage_select',line: i});
			var internalid 		= request.getSublistValue({group:sublistId, name: 'custpage_internalid',line: i});
			
			if(isSelect == 'T'){
				rdrIdsArr.push(internalid);				
			}
		}
		
		var sch​edu​leS​cri​ptT​ask​Obj​ 			= TASK.create({taskType: TASK.TaskType.SCHEDULED_SCRIPT});
		sch​edu​leS​cri​ptT​ask​Obj​.scriptId		= 'customscript_inv_trigger_rdr_je_sch';
		sch​edu​leS​cri​ptT​ask​Obj​.deploymentId 	= 'customdeploy_inv_trigger_rdr_je_sch';
		sch​edu​leS​cri​ptT​ask​Obj​.params 		= {"custscript_inv_rdr_je_date":jeDate, "custscript_inv_rdr_st_date":stDate, "custscript_inv_rdr_end_date":endDate,"custscript_inv_rdr_reversal_date":reversalDate, "custscript_inv_rdr_ids":rdrIdsArr.toString()};
		var sch​edu​leS​cri​ptT​ask​Id			= sch​edu​leS​cri​ptT​ask​Obj​.submit();
				
		do{
			flag 	= 0;
			var sch​edu​leS​cri​ptT​ask​Status	= TASK.checkStatus({taskId: sch​edu​leS​cri​ptT​ask​Id});			
			//log.debug('Inside Do - status ', sch​edu​leS​cri​ptT​ask​Status.status);
			
			if(sch​edu​leS​cri​ptT​ask​Status.status === TASK.TaskStatus.COMPLETE){
				flag = 1;
				log.debug({title: 'sch​edu​leS​cri​ptT​ask​Status.status final', details: sch​edu​leS​cri​ptT​ask​Status.status});				
			}
			
			if(sch​edu​leS​cri​ptT​ask​Status.status === TASK.TaskStatus.FAILED){
				flag = 1;
				log.error({title: 'sch​edu​leS​cri​ptT​ask​Status.status FAILED final', details: sch​edu​leS​cri​ptT​ask​Status.status});				
			}				
		}
		while(flag == 0);
		
		REDIRECT.toSuitelet({scriptId: scriptObj.id, deploymentId: scriptObj.deploymentId});
	}	
	
	var form 	= SERVERWIDGET.createForm({title : 'Trigger RDR Journals'});
	form.clientScriptModulePath = './INV_Trigger_RDR_JE_CL.js';
	
	var stDate 	= form.addField({id:'custpage_startdate', label:'Start Date', type:SERVERWIDGET.FieldType.DATE});	
	var endDate	= form.addField({id:'custpage_enddate', label:'End Date', type:SERVERWIDGET.FieldType.DATE});	
	var jeDate 	= form.addField({id:'custpage_date', label:'Journal Date', type:SERVERWIDGET.FieldType.DATE});	
	var isReversal 		= form.addField({id:'custpage_isreversal', label:'Reversal', type:SERVERWIDGET.FieldType.CHECKBOX});	
	var reversalDate 	= form.addField({id:'custpage_reversal_date', label:'Reversal Date', type:SERVERWIDGET.FieldType.DATE});	
	
	stDate.isMandatory 	= true;
	endDate.isMandatory = true;
	jeDate.isMandatory 	= true;
	
	var sublist = form.addSublist({id:'custpage_rdrsublist', type:SERVERWIDGET.SublistType.LIST, label:'RDR'});
	sublist.addField({id:'custpage_select', label:'Select', type:SERVERWIDGET.FieldType.CHECKBOX});
	sublist.addField({id:'custpage_internalid', label:'Id', type:SERVERWIDGET.FieldType.TEXT}).updateDisplayType({displayType : SERVERWIDGET.FieldDisplayType.HIDDEN });
	sublist.addField({id:'custpage_subsidiary', label:'Subsidiary', type:SERVERWIDGET.FieldType.TEXT});
	sublist.addField({id:'custpage_expense_type', label:'Expense Type', type:SERVERWIDGET.FieldType.SELECT, source: 'customlist_inv_expense_type_list'}).updateDisplayType({displayType : SERVERWIDGET.FieldDisplayType.INLINE });
	sublist.addField({id:'custpage_search_name', label:'Search Name', type:SERVERWIDGET.FieldType.TEXT});
	sublist.addField({id:'custpage_rate', label:'Rate', type:SERVERWIDGET.FieldType.PERCENT}).updateDisplayType({displayType : SERVERWIDGET.FieldDisplayType.INLINE });
	sublist.addField({id:'custpage_debit_account', label:'Debit Account', type:SERVERWIDGET.FieldType.SELECT, source: 'account'}).updateDisplayType({displayType : SERVERWIDGET.FieldDisplayType.INLINE });
	sublist.addField({id:'custpage_credit_account', label:'Credit Account', type:SERVERWIDGET.FieldType.SELECT, source: 'account'}).updateDisplayType({displayType : SERVERWIDGET.FieldDisplayType.INLINE });
	sublist.addField({id:'custpage_customer', label:'Customer', type:SERVERWIDGET.FieldType.SELECT, source: 'customer'}).updateDisplayType({displayType : SERVERWIDGET.FieldDisplayType.INLINE });
	sublist.addField({id:'custpage_actual_discount_search', label:'Actual Discount Search', type:SERVERWIDGET.FieldType.TEXT}).updateDisplayType({displayType : SERVERWIDGET.FieldDisplayType.INLINE });
	
	var line 	= 0;
	var rdrSearchObj 	= _searchCustomerRDR();
	
	rdrSearchObj.run().each(function(result){				
		sublist.setSublistValue({id:'custpage_internalid', line:line, value: result.getValue({name: "internalid"})});
		sublist.setSublistValue({id:'custpage_subsidiary', line:line, value: result.getText({name: "custrecord_inv_rdr_subsidiary"})});
		sublist.setSublistValue({id:'custpage_expense_type', line:line, value: result.getValue({name: "custrecord_inv_rdr_expense_type"})});			
		sublist.setSublistValue({id:'custpage_search_name', line:line, value: result.getValue({name: "custrecord_inv_rdr_search_name"})});			
		sublist.setSublistValue({id:'custpage_rate', line:line, value: result.getValue({name: "custrecord_inv_rdr_rate"})});
		sublist.setSublistValue({id:'custpage_debit_account', line:line, value: result.getValue({name: "custrecord_inv_rdr_debit_account"})});
		sublist.setSublistValue({id:'custpage_credit_account', line:line, value: result.getValue({name: "custrecord_inv_rdr_credit_account"})});
		
		if(_validateData(result.getValue({name: "custrecord_inv_rdr_customer"})))
			sublist.setSublistValue({id:'custpage_customer', line:line, value: result.getValue({name: "custrecord_inv_rdr_customer"})});
		
		if(_validateData(result.getValue({name: "custrecord_inv_rdr_actual_disc_search"})))
			sublist.setSublistValue({id:'custpage_actual_discount_search', line:line, value: result.getValue({name: "custrecord_inv_rdr_actual_disc_search"})});
					
		line++;
		return true;		  
	});
	
	sublist.addMarkAllButtons();
	form.addSubmitButton({label : 'Trigger Journals'});
	form.addResetButton({label : 'Reset'});
	context.response.writePage(form);	
}

function _searchCustomerRDR()
{	
	try{
		var rdrSearchObj = SEARCH.create({
							   type: "customrecord_inv_customer_rdr",
							   filters:
							   [
								  ["isinactive","is","F"]
							   ],
							   columns:
							   [
								  SEARCH.createColumn({name: "internalid", label: "Internal ID"}),
								  SEARCH.createColumn({name: "custrecord_inv_rdr_subsidiary", label: "Subsidiary"}),
								  SEARCH.createColumn({name: "custrecord_inv_rdr_expense_type", label: "Expense Type", sort: SEARCH.Sort.DESC}),
								  SEARCH.createColumn({name: "custrecord_inv_rdr_search_name", label: "Search Name"}),
								  SEARCH.createColumn({name: "custrecord_inv_rdr_search_id", label: "Search ID"}),
								  SEARCH.createColumn({name: "custrecord_inv_rdr_rate", label: "Rate"}),
								  SEARCH.createColumn({name: "custrecord_inv_rdr_debit_account", label: "Debit Account"}),
								  SEARCH.createColumn({name: "custrecord_inv_rdr_credit_account", label: "Credit Account"}),
								  SEARCH.createColumn({name: "custrecord_inv_rdr_customer", label: "Customer"}),
								  SEARCH.createColumn({name: "custrecord_inv_rdr_actual_disc_search", label: "Actual Discount Search"})
							   ]
							});
		var resultCount = rdrSearchObj.runPaged().count;
		//log.debug("rdrSearchObj result count", resultCount);
	}catch (e) {
		log.error({title: 'Error In _searchCustomerRDR: '+e.name, details: e.message});
		
	}
	
	return rdrSearchObj;
}