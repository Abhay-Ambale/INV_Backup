/**
 * @NApiVersion 2.0
 * @NScriptType WorkflowActionScript
 * @NModuleScope Public
 */

/*
 * Module Description
 * 
 * Version    Date               Author            Remarks
 * 1.0        5th Oct 2021     Supriya G           Send Auto Invoice Email 
 *                                              
 * 											   
 */
 
define(['N/runtime', 'N/record', 'N/search', 'N/email', 'N/render'], runWorkflowAction);

function runWorkflowAction(runtime, record, search, email, render) {
	RUNTIME = runtime;
	RECORD = record;
    SEARCH = search;
	EMAIL = email;
	RENDER = render;
	
    return {        
        onAction: onAction
    }
}

function onAction(context) {
	var currentRecord = context.newRecord;
	var recordId = currentRecord.id;
	var emailTemplateId = 12;
	var senderId = 18649;
	log.debug("email recordid", recordId);	
	
	try {		
		var autoInvoice = currentRecord.getValue({fieldId: 'custbody_kl_auto_invoice_email_check'});
		var subsidiary = currentRecord.getValue({fieldId: 'subsidiary'});
		var receipientEmails = currentRecord.getValue({fieldId: 'custbody_inv_multiple_invoice_emails'});
		
		var receipientEmailsArr = receipientEmails.split(",");
		
		log.debug("autoInvoice "+ autoInvoice);
		log.debug("subsidiary "+ subsidiary);
		log.debug("receipientEmails "+ receipientEmails);
		log.debug("receipientEmailsArr  ", receipientEmailsArr);
		
		if(subsidiary == 20) { // NZ
			senderId = 18651;
			emailTemplateId = 14;
		}else if(subsidiary == 18) { // Esquare
			senderId = 18653;
			emailTemplateId = 16;
		}else {
			senderId = 18649;
			emailTemplateId = 12;
		}
		
		var emailMergeResult = RENDER.mergeEmail({
			templateId: emailTemplateId,
			transactionId: recordId
		});
		
		 //Print --> convert the record into a PDF or HTML object 
		  var transactionPdfObj = RENDER.transaction({
			 entityId:recordId,
			 printMode:RENDER.PrintMode.PDF
		  });
		  
		if (receipientEmails && senderId) {
			EMAIL.send({
				author: senderId,
				recipients: receipientEmails,
				subject: emailMergeResult.subject,
				body: emailMergeResult.body,
				attachments:[transactionPdfObj],
				relatedRecords: {
					transactionId: recordId
				}
			});
			log.debug("email sent");
		}
		else {
			log.debug("email sent issue receipientId senderId", receipientEmails + ":" + senderId);
		}
	} catch (e) {
		log.error("Error on workflow script email", e);
	}	
}