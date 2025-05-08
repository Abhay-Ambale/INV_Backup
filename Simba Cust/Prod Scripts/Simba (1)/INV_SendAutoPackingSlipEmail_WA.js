/**
 * @NApiVersion 2.0
 * @NScriptType WorkflowActionScript
 * @NModuleScope Public
 */

/*
 * Module Description
 * 
 * Version    Date               Author            Remarks
 * 1.0        5th Oct 2021     Supriya G           Send Auto Packing Slip Email 
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
	var emailTemplateId = 13;
	var senderId = 18649;
	log.debug("email recordid", recordId);	
	
	try {		
		var autoPackingSlip = currentRecord.getValue({fieldId: 'custbody_kl_auto_packing_slip_check'});
		var subsidiary = currentRecord.getValue({fieldId: 'subsidiary'});
		var receipientEmails = currentRecord.getValue({fieldId: 'custbody_inv_multiple_packing_emails'});
		
		var receipientEmailsArr = receipientEmails.split(",");		
		var trackingNumbers = getTrackingNumbers(recordId);
		trackingNumbers = trackingNumbers.toString();

		log.debug("autoPackingSlip "+ autoPackingSlip);
		log.debug("subsidiary "+ subsidiary);
		log.debug("receipientEmails "+ receipientEmails);
		log.debug("receipientEmailsArr  ", receipientEmailsArr);
		log.debug("trackingNumbers  ", trackingNumbers);
		
		if(subsidiary == 20) { // NZ
			senderId = 18650;
			emailTemplateId = 15;
		}else if(subsidiary == 18) { // Esquare
			senderId = 18653;
			emailTemplateId = 17;
		}else {
			senderId = 18649;
			emailTemplateId = 13;
		}
		
		var emailMergeResult = RENDER.mergeEmail({
			templateId: emailTemplateId,
			transactionId: recordId
		});	

		var emailBody = emailMergeResult.body;
		emailBody = emailBody.replace("@trackingnumbers@", trackingNumbers); 

		 //Print --> convert the record into a PDF or HTML object 
		var transactionPdfObj = RENDER.transaction({
			 entityId:recordId,
			 printMode:RENDER.PrintMode.PDF
		});
		log.debug("transactionPdfObj", transactionPdfObj);
		transactionPdfObj.name = 'packingslip.pdf';
		  
		if (receipientEmails && senderId) {
			EMAIL.send({
				author: senderId,
				recipients: receipientEmails,
				subject: emailMergeResult.subject,
				body: emailBody,
				attachments:[transactionPdfObj],
				relatedRecords: {
					transactionId: recordId
				}
			});
			log.debug("email sent");
			
			var recObj = RECORD.load({ type: RECORD.Type.ITEM_FULFILLMENT, id: recordId, isDynamic: true });
			recObj.setValue({fieldId: 'custbody_inv_packing_emails_sent', value:true});
			var recordId = recObj.save();
		}
		else {
			log.debug("email sent issue receipientId senderId", receipientEmails + ":" + senderId);
		}
	} catch (e) {
		log.error("Error on workflow script email", e);
	}	
}

function getTrackingNumbers (ifId) {
    var trackingNosArr = [];
    try{		
		log.debug('getTrackingNumbers ifId ', ifId);
        var ifSearchObj = SEARCH.create({
            type: 'itemfulfillment',
            filters:
            [
                ["type","anyof","ItemShip"], 
				"AND", 
				["mainline","is","T"],				
				"AND", 
				["internalidnumber","equalto", ifId]
            ],
            columns:
            [
                SEARCH.createColumn({name: "trackingnumbers", label: "Tracking Numbers"})
            ]
        });

        ifSearchObj.run().each(function(result){
            var trackingNumbers = result.getValue('trackingnumbers');			
			trackingNosArr.push(trackingNumbers);
            return true;
        });
        log.debug('getTrackingNumbers trackingNosArr ', trackingNosArr);
    
        return trackingNosArr;		
    }
    catch (e) {
        log.error('ERROR in getTrackingNumbers  '+ifId, e);
    }
}