/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version    Date            Author          Remarks
 * 2.00     22 Oct 2020		  Prajval		    
 * 
 */
/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
*/
var COMM,REC,SEARCH;
define(['./Library_Files/INV_common_functions_LIB.js','N/record','N/search'],INV_Support_Case_UE);
	function INV_Support_Case_UE(comm,record,search)
	{
		COMM   = comm;
		REC    = record;
		SEARCH = search;
		return{
			afterSubmit:afterSubmit
		}
	}
	function afterSubmit(context)
	{		
		var subject 	= '';
		var currRec 	= context.newRecord;
		var recId   	= currRec.id;
		log.debug('recId-->>'+recId, context.type);
		if((context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT)&& _validateData(recId))
		{
			var caseRecObj 	= REC.load({type:'supportcase',id:recId,isDynamic:true});
			var customform 	= caseRecObj.getValue({fieldId:'customform'});
			if(_validateData(customform) && customform == FRM_INV_CASE_INVOICE_DIS)
			{
				var caseSrchObj = SEARCH.create({
				   type: "supportcase",
				   filters:
				   [
					  ["internalid","anyof",recId],
					  "AND", 
					  ["transaction.type","anyof","CustInvc"]
				   ],
				   columns:
				   [
					  SEARCH.createColumn({
						 name: "tranid",
						 join: "transaction",
						 label: "Document Number"
					  })
				   ]
				});
				var searchResultCount = caseSrchObj.runPaged().count;
				caseSrchObj.run().each(function(result){
					var docNo  = result.getValue({name: "tranid",join: "transaction"});
					log.debug('docNo','docNo->>'+docNo);
					if(_validateData(docNo))
					{
						subject = 'Invoice Dispute #'+docNo;						
						caseRecObj.setValue({fieldId:'title',value:subject});						
					}
					return false;
				});
				
			}
			var caseId = caseRecObj.save();
			//log.debug('caseId','caseId->>'+caseId);
		}
	}