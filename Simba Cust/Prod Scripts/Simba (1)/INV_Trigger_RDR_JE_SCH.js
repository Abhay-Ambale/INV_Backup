 /* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
 ||   This Scheduled script is used to trigger RDR Journals				||
 ||   with NetSuite in Suitescript 2.0                                  ||
 ||                                                              		||
 ||                                                               		||
 ||  Version  Date            Author        	Remarks                 ||
 ||  1.0      27th Oct 2020   Supriya Gunjal  	Initial commit          || 
 ||                                                              		||
  \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
 
/**
 * @NApiVersion 2.0
 * @NScriptType ScheduledScript
 */
 
var RUNTIME, TASK, EMAIL, RECORD, FORMAT, SEARCH;

define(['./Library_Files/INV_common_functions_LIB.js', 'N/runtime', 'N/task', 'N/email', 'N/record', 'N/format', 'N/search'], runJeScheduled);

function runJeScheduled(comm, runtime, task, email, record, format, search) {
	COMM   		= comm;
	RUNTIME 	= runtime;
	EMAIL		= email;
	RECORD		= record;
	FORMAT		= format;	
	SEARCH		= search;
	TASK		= task;
	
	return {
		execute: _createRDRJournals
	}
}

function _createRDRJournals(context)
{
	var jeArr		= [];
	var sublistId 	= 'custpage_rdrsublist';
	var scriptObj 	= RUNTIME.getCurrentScript();
	var jeDate 		= scriptObj.getParameter({name: 'custscript_inv_rdr_je_date'});
	var stDate 		= scriptObj.getParameter({name: 'custscript_inv_rdr_st_date'});
	var endDate 	= scriptObj.getParameter({name: 'custscript_inv_rdr_end_date'});
	var reversalDate = scriptObj.getParameter({name: 'custscript_inv_rdr_reversal_date'});
	var rdrIds 		= scriptObj.getParameter({name: 'custscript_inv_rdr_ids'});
	rdrIds			= rdrIds.split(",");
	log.debug({title:'rdrIds', details:rdrIds});
	
	try{
		var rdrSearchObj = _searchRDRsByIds(rdrIds);
		rdrSearchObj.run().each(function(result){				
			var internalid 		= result.getValue({name: "internalid"});
			var subsidiaryId 	= result.getValue({name: "custrecord_inv_rdr_subsidiary"});
			var expenseType 	= result.getValue({name: "custrecord_inv_rdr_expense_type"});			
			var searchId 		= result.getValue({name: "custrecord_inv_rdr_search_id"});			
			var searchName 		= result.getValue({name: "custrecord_inv_rdr_search_name"});			
			var rate 			= result.getValue({name: "custrecord_inv_rdr_rate"});
			var debitAccount 	= result.getValue({name: "custrecord_inv_rdr_debit_account"});
			var creditAccount 	= result.getValue({name: "custrecord_inv_rdr_credit_account"});
			var memo 			= result.getValue({name: "custrecord_inv_rdr_memo"});
			var actualDiscSearchId	= result.getValue({name: "custrecord_inv_rdr_actual_disc_search_id"});
			
			rate 	= rate.replace("%", '');			
			log.debug({title:'searchId', details:searchId});
			log.debug({title:'rate', details:Number(rate)});
			
			// Create Journal
			try{				
				// Load search result to create JE lines
				var searchObj 	= SEARCH.load({id: searchId});
				var defaultFilters = searchObj.filters;
				if(_validateData(stDate) && _validateData(endDate)){
					var dateFilter = SEARCH.createFilter({name: 'trandate', operator: SEARCH.Operator.WITHIN, values : [stDate, endDate]});
					defaultFilters.push(dateFilter);
				}
		
				var resultCount = searchObj.runPaged().count;
				log.debug({title:'resultCount', details:resultCount});
				if(resultCount > 0){
					var jeObj 		= RECORD.create({type: RECORD.Type.JOURNAL_ENTRY, isDynamic: true});			
					jeObj.setValue({fieldId: 'subsidiary', value: subsidiaryId});
					jeObj.setValue({fieldId: 'trandate', value: _parseDate(jeDate)});
					jeObj.setValue({fieldId: 'memo', value: searchName+' ('+stDate+' - '+endDate+')'});				
					
					if(_validateData(reversalDate)){
						jeObj.setValue({fieldId: 'reversaldate', value: _parseDate(reversalDate)});
						jeObj.setValue({fieldId: 'reversaldefer', value: true});
					}
					
					searchObj.run().each(function(rs){				
						var customerId 	= rs.getValue({name: "custentity_inv_cust_name_mis", join: "customerMain", summary: "GROUP"});					
						var amount 		= rs.getValue({name: "amount", summary: "SUM"});
						var jeAmount 	= (Number(amount) * Number(rate)) / 100;
						jeAmount		= jeAmount.toFixed(2);
						log.debug({title:'jeAmount for amount '+amount, details:jeAmount});
						log.debug({title:'actualDiscSearchId', details:actualDiscSearchId});
						
						if(_validateData(actualDiscSearchId)){
							var actualDiscount 	= _getActualDiscountAmt(actualDiscSearchId, stDate, endDate);
							var newJeAmount 	= Number(jeAmount) - Number(actualDiscount);
							jeAmount 			= newJeAmount;
							log.debug({title:'newJeAmount ', details:newJeAmount});
						}
						
						var dbAccount	= debitAccount;
						var crAccount	= creditAccount;
						if(Number(jeAmount) < 0){
							jeAmount	= Math.abs(jeAmount);
							var temp1 	= debitAccount;
							var temp2 	= creditAccount;
							dbAccount 	= temp2;
							crAccount 	= temp1;
						}
						
						jeObj.selectNewLine({sublistId: 'line'});					
						jeObj.setCurrentSublistValue({sublistId:'line', fieldId:'account', value:dbAccount});
						jeObj.setCurrentSublistValue({sublistId:'line', fieldId:'debit', value:Number(jeAmount)});
						jeObj.setCurrentSublistValue({sublistId:'line', fieldId:'entity', value:customerId});
						jeObj.setCurrentSublistValue({sublistId:'line', fieldId:'memo', value:memo});
						jeObj.commitLine({sublistId: 'line'});
					
						jeObj.selectNewLine({sublistId: 'line'});					
						jeObj.setCurrentSublistValue({sublistId:'line', fieldId:'account', value:crAccount});
						jeObj.setCurrentSublistValue({sublistId:'line', fieldId:'credit', value:Number(jeAmount)});
						jeObj.setCurrentSublistValue({sublistId:'line', fieldId:'entity', value:customerId});
						jeObj.setCurrentSublistValue({sublistId:'line', fieldId:'memo', value:memo});						
						jeObj.commitLine({sublistId: 'line'});
						
						return true;		  
					});		
				
					var journalId 	= jeObj.save({enableSourcing: true});
					log.debug({title:'journalId', details:journalId});				
					
					if(_validateData(journalId)){
						var fieldLookUp = SEARCH.lookupFields({
												type: SEARCH.Type.JOURNAL_ENTRY,
												id: journalId,
												columns: ['tranid', 'currency']
											});
						
						var JeNumber 	= fieldLookUp.tranid;
						jeArr.push(JeNumber);
					}					
				}
			}
			catch (e) {
				log.error({title: 'Error In _createRDRJournals : '+e.name, details: e.message});		
			}
			
			return true;		  
		});
		
		if(jeArr.length > 0){
			var bodyMsg	= 'Hello,<br><br>Below RDR Journals are created.<br>';
			bodyMsg		+= jeArr.toString();
			bodyMsg		+= '<br><br>Thanks,<br>Simba Team';
			
			var currUserObj 	= RUNTIME.getCurrentUser();
			log.debug({title:'currUserObj', details:currUserObj.id});		
			 
			EMAIL.send({
				author: 20430,
				recipients: currUserObj.id,
				subject: 'Simba - RDR Journals Created',
				body: bodyMsg
			});
		}
		else{
			var currUserObj = RUNTIME.getCurrentUser();
			var bodyMsg		= 'Hello,<br><br>No transactions for the selected period to create RDR Journal.<br>';			
			bodyMsg			+= '<br><br>Thanks,<br>Simba Team';				
			 
			EMAIL.send({
				author: 20430,
				recipients: currUserObj.id,
				subject: 'Simba - No RDR Journals created for the period',
				body: bodyMsg
			});
		}
	}
	catch (e) {
		log.error({title: 'Error In _createRDRJournals _searchRDRsByIds: '+e.name, details: e.message});		
	}
}

function _getActualDiscountAmt(searchId, stDate, endDate)
{
	var amount			= 0;
	try{
		var searchObj 		= SEARCH.load({id: searchId});
		var defaultFilters 	= searchObj.filters;
		if(_validateData(stDate) && _validateData(endDate)){
			var dateFilter 	= SEARCH.createFilter({name: 'trandate', operator: SEARCH.Operator.WITHIN, values : [stDate, endDate]});
			defaultFilters.push(dateFilter);
		}
		searchObj.run().each(function(result){				
			amount 		= result.getValue({name: "amount", summary: "SUM"});
			amount		= Math.abs(amount);
			
			return false;		  
		});
	}
	catch (e) {
		log.error({title: 'Error In _getActualDiscountAmt '+e.name, details: e.message});		
	}
	
	return amount;
}

function _searchRDRsByIds(rdrIds){
	try{		

		var rdrSearchObj = SEARCH.create({
							   type: "customrecord_inv_customer_rdr",
							   filters:
							   [
								  ["isinactive","is","F"],
								  "AND", 
								  ["internalid","anyof",rdrIds]
							   ],
							   columns:
							   [
								  SEARCH.createColumn({name: "internalid", label: "Internal ID"}),
								  SEARCH.createColumn({name: "custrecord_inv_rdr_subsidiary", label: "Subsidiary"}),
								  SEARCH.createColumn({name: "custrecord_inv_rdr_expense_type", label: "Expense Type", sort: SEARCH.Sort.DESC}),								 
								  SEARCH.createColumn({name: "custrecord_inv_rdr_search_id", label: "Search ID"}),
								  SEARCH.createColumn({name: "custrecord_inv_rdr_search_name", label: "Search Name"}),
								  SEARCH.createColumn({name: "custrecord_inv_rdr_rate", label: "Rate"}),
								  SEARCH.createColumn({name: "custrecord_inv_rdr_debit_account", label: "Debit Account"}),
								  SEARCH.createColumn({name: "custrecord_inv_rdr_credit_account", label: "Credit Account"}),
								  SEARCH.createColumn({name: "custrecord_inv_rdr_customer", label: "Customer"}),
								  SEARCH.createColumn({name: "custrecord_inv_rdr_actual_disc_search_id", label: "Actual Discount Search"}),
								  SEARCH.createColumn({name: "custrecord_inv_rdr_memo", label: "Memo"}),
							   ]
							});
		var resultCount = rdrSearchObj.runPaged().count;
		log.debug("rdrSearchObj result count", resultCount);
	}catch (e) {
		log.error({title: 'Error In _searchRDRsByIds: '+e.name, details: e.message});		
	}
	
	return rdrSearchObj;
}

function _parseDate(date) {
	var convertedDate = FORMAT.parse({
							value: date, 
							type: FORMAT.Type.DATE
						});
	
	return convertedDate;
}