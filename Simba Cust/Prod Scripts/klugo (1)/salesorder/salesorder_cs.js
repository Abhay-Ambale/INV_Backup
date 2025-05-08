/**
 * This script is governed by the license agreement located in the script directory.
 * By installing and using this script the end user acknowledges that they have accepted and
 * agree with all terms and conditions contained in the license agreement. All code remains the
 * exclusive property of Klugo Group Ltd and the end user agrees that they will not attempt to
 * copy, distribute, or reverse engineer this script, in whole or in part.
 * 
 * MODULE DESCRIPTION
 * 
 * Enabled Location Column field on Sales Order forms:
 * - .1 SG Sales Order
 * - .1 SG Sales Order (No Bins) - New Age
 * 
 * Version  Date            Author          Remarks
 * 1.00     04 Dec 2017		Muhammad Zain	Initial creation
 * 
 */


/////////////////////////////////////////////////////////
//Utility Functions
/////////////////////////////////////////////////////////
/**
 * 
 * 
 * @param {any} type 
 * @param {any} field 
 * @param {any} lineno 
 */
function updateAllLineItems(type, field, lineno) {
    try {
        // execute on body fields only
        if (!!type) return;
        
        // execute on location only
        if (field != 'location') return ;

        var location = nlapiGetFieldValue('location');
        var lines = nlapiGetLineItemCount('item');
        
        for (var pos = 1; pos <= lines; pos++) {
            nlapiSelectLineItem('item', pos);
            nlapiSetCurrentLineItemValue('item', 'location', location, false, false);
            nlapiCommitLineItem('item');
        }
    } catch (exp) {
        nlapiLogExecution('error', 'salesorder_cs:updateAllLineItems', exp);
    }
}

/**
 * remove location field value from body
 * 
 */
function removeBodyLocation() {
    try {
        // HACK: to bypass standard mandatory field.
        nlapiGetContext().internal = true;
        nlapiSetFieldValue('location', '', false, true);
        nlapiSetFieldMandatory('location', false);
    } catch (exp) {
        nlapiLogExecution('error', 'salesorder_cs:removeBodyLocation', exp);
    }
}



/**
 * Set Location field on current line
 * 
 * @param {any} type 
 */
function setLocationOnLine(type) {
    try {
        var location = nlapiGetFieldValue('location');
        console.log('salesorder_cs:setLocationOnLine', 'location: ' + location);
        nlapiSetCurrentLineItemValue('item', 'location', location, false, false);
        console.log('salesorder_cs:setLocationOnLine', 'end');
    } catch (exp) {
        nlapiLogExecution('error', 'salesorder_cs:setLocationOnLine', exp);
    }
}

/////////////////////////////////////////////////////////
//Client Event Functions
/////////////////////////////////////////////////////////


/**
 * Entry point for saveRecord
 * 
 * @param type {string} Edit operation
 * 
 */
function saveRecord() {
    var result = true;

    try {
        //removeBodyLocation();
    } catch (exp) {
        nlapiLogExecution('error', 'salesorder_cs:saveRecord', exp);
    }

    return result;
}


/**
 * Entry point for on 
 * 
 * @param type {string} Edit operation
 * 
 */
function validateLine(type) {

    try {
        //setLocationOnLine(type);
    } catch (exp) {
        nlapiLogExecution('error', 'salesorder_cs:validateLine', exp);
    }

    return true;
}


/**
 * Entry point for field change
 * 
 * @param {any} type 
 * @param {any} field 
 * @param {any} lineno 
 * @returns 
 */
function fieldChange(type, field, lineno) {
    try {
        //console.log('salesorder_cs:fieldChange', 'field: ' + field);
        //updateAllLineItems(type, field, lineno);

    } catch (exp) {
        console.error('salesorder_cs:fieldChange', exp);
    }
}
