/**
 * This script is governed by the license agreement located in the script directory.
 * By installing and using this script the end user acknowledges that they have accepted and
 * agree with all terms and conditions contained in the license agreement. All code remains the
 * exclusive property of Klugo Group Ltd and the end user agrees that they will not attempt to
 * copy, distribute, or reverse engineer this script, in whole or in part.
 **/
/**
 * Module Description
 * 
 * Version    Date            Author            Remarks
 * 1.00       05 Nov 2017     Muhammad Zain     added new client script for preventing edit of line item on purchase order. 
 *
 */


/////////////////////////////////////////////////////////
// Utility Functions
/////////////////////////////////////////////////////////

/**
 * Disable fields of line item
 * 
 * @param {any} disable 
 */
function disableLineItemFields(type, disable) {
    try {
        nlapiDisableLineItemField(type, 'item', disable);
        nlapiDisableLineItemField(type, 'description',disable);
        nlapiDisableLineItemField(type, 'quantity', disable);
        nlapiDisableLineItemField(type, 'rate', disable);
        nlapiDisableLineItemField(type, 'amount', disable);
        nlapiDisableLineItemField(type, 'price', disable);

        nlapiDisableLineItemField(type, 'custcol_kl_shipment_header', disable);
    } catch( exp ) {
		nlapiLogExecution("ERROR", "purchase_order_cs:disableLineItemFields", exp);
    }
}



/**
 * If current line is linked with any shipment header record, 
 * then disable some fields so user cannot edit them
 * 
 * @param {any} type 
 * @returns 
 */
function disableShipHeadLine(type) {
    var result = true;

    try {

        var canUpdateShipHeadLine = nlapiGetFieldValue('custpage_can_upd_po_line_permission');
        var isShipHeadLine = !!nlapiGetCurrentLineItemValue(type, 'custcol_kl_shipment_header');
        if (type == 'item' && canUpdateShipHeadLine == 'F' && isShipHeadLine == true) {
            disableLineItemFields(type, true);
        } else {
            disableLineItemFields(type, false);
        }

    } catch(ex) {
        nlapiLogExecution("ERROR", "purchase_order_cs:disableShipHeadLine", ex);
    }

    return result;
}




/////////////////////////////////////////////////////////
// Entry Point Functions
/////////////////////////////////////////////////////////



/**
 * Entry point for on 
 * 
 * @param type {string} Edit operation
 * 
 */
function lineInit( type ){
	var result = true;
	
	try {

        result = disableShipHeadLine(type);

	} catch( exp ) {
		nlapiLogExecution("ERROR", "purchase_order_cs:lineInit", exp);
    }
    
	return result;
}
