/**
 * This script is governed by the license agreement located in the script directory.
 * By installing and using this script the end user acknowledges that they have accepted and
 * agree with all terms and conditions contained in the license agreement. All code remains the
 * exclusive property of Klugo Group Ltd and the end user agrees that they will not attempt to
 * copy, distribute, or reverse engineer this script, in whole or in part.
 * 
 * Module Description
 * 
 * Version	Date            	Author            	Remarks
 * 1.00         2/3/2018		Brad Harris			Initial creation
 * 1.01			03/21/2018		Muhammad Zain		Linked email with the customer record
 *
 */


/////////////////////////////////////////////////////////
// Entry Point Functions
/////////////////////////////////////////////////////////

/**
 * Entry point function for after submit event
 *
 * @param type {string} Edit operation
 *
 */
function afterSubmit(type) {
    try {
    	
    	// BH 6/4/2018 - reinstate following block
    	/*
        nlapiLogExecution('DEBUG', 'invoice_ue:afterSubmit', 'type: ' + type);

        if ( type != 'create' ) return;

        // Create different invoice email/PDF templates based on Subsidiary and send
        var salesorderId = nlapiGetFieldValue('createdfrom');
        var salesorder = nlapiLookupField('salesorder', salesorderId, ['custbody_kl_auto_invoice_email_check', 'custbody_kl_auto_invoice_email']);
        
        if (salesorder.custbody_kl_auto_invoice_email_check == 'T') {
        	issueInvoice( 'create', nlapiGetRecordId(), nlapiGetFieldValue('subsidiary'), salesorder.custbody_kl_auto_invoice_email, nlapiGetFieldValue('entity'));
        }*/
        
    } catch (exp) {
        nlapiLogExecution('ERROR', 'invoice_ue:afterSubmit', exp.toString());
    }
}

