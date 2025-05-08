/**
 * This script is governed by the license agreement located in the script directory.
 * By installing and using this script the end user acknowledges that they have accepted and
 * agree with all terms and conditions contained in the license agreement. All code remains the
 * exclusive property of Klugo Group Ltd and the end user agrees that they will not attempt to
 * copy, distribute, or reverse engineer this script, in whole or in part.
 **/
/**
 * Module Description
 * Create different invoice email/PDF templates based on Subsidiary and send
 * 
 * Version	Date            	Author                Remarks
 * 1.00         2/3/2018		Brad Harris			Initial creation
 * 1.01			03/21/2018		Muhammad Zain		Linked email with the customer record
 *
 */

var INVOICE_EMAIL_DATA = {
    6: { 'templateId' : 12, 'authorId' : 18649 } , 	// 6:Simba Retail Pty Ltd / 12:AU / 18649:Simba Accounts (AU)
    7: { 'templateId' : 12, 'authorId' : 18649 } , 	// 18:Simba Textile Mills Pty Ltd / 12:AU / 18649:Simba Accounts (AU)
    10: { 'templateId' : 14, 'authorId' : 18651 } , 	// 10:Simba New Zealand Limited / 14:NZ / 18651:Simba Accounts (NZ) 
    18: { 'templateId' : 16, 'authorId' : 18653 } 	// 18:Esquire Marketing Services Pte Ltd / 16:SG / 18653:Esquire Marketing Accounts (SG)
};



/**
* Create different invoice email/PDF templates based on Subsidiary and send
* 
* @param {string} type  						operation type
* @param {integer} invoiceId			ID of invoice		
* @param {integer} subsidiaryId		ID of subsidiary		
* @param {integer} invoiceEmail		email to send invoice to		
*/
function issueInvoice( type, invoiceId, subsidiaryId, invoiceEmail, entityId ) {
    try { 
    	
    	// BH 6/4/2018 - reinstate following block
    	/*
        if ( type != 'create' || !INVOICE_EMAIL_DATA[subsidiaryId] || invoiceEmail == '') return;

        pdfFile = nlapiPrintRecord( 'TRANSACTION', invoiceId, 'PDF' );		

        var emailMerger = nlapiCreateEmailMerger( INVOICE_EMAIL_DATA[subsidiaryId].templateId );
        emailMerger.setTransaction( invoiceId ); 
        var mergeResult = emailMerger.merge(); 
        
        var records = new Object();
        records['transaction'] = invoiceId;
        records['entity'] = entityId;
        
        nlapiSendEmail( INVOICE_EMAIL_DATA[subsidiaryId].authorId, invoiceEmail, mergeResult.getSubject(), mergeResult.getBody(), null, null, records, pdfFile );  
        
        nlapiLogExecution( 'debug', 'item_fulfillment_ues:issueInvoice', 'Email Invoice - subsidiary: ' + subsidiaryId + ' - author: ' + INVOICE_EMAIL_DATA[subsidiaryId].authorId + ' - recipient: ' + invoiceEmail );*/
    } catch (exp) {
        nlapiLogExecution( 'ERROR', 'item_fulfillment_ues:issueInvoice', exp );
    }
}