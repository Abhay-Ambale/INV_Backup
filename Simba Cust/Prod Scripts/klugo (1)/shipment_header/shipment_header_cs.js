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
 * Version    Date            Author           Remarks
 * 1.00       24 May 2017     Muhammad Zain
 * 1.01       21 Nov 2017     Muhammad Zain     Ticket # 10996: added exchange rate column
 *
 */


////////////////////////////////////////////////////////////////////////////////
//Entry Point
////////////////////////////////////////////////////////////////////////////////


/**
 * Entry point for page init
 * 
 * @param type {string} Edit operation
 * 
 */
function pageInit(type) {
    try {
        console.log('shipment_header_cs:pageInit');

        closeSuiteletPopup(type);

        disableReadonlyFields(type);

    } catch (exp) {
        console.error('shipment_header_cs:pageInit', exp);
    }
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
        console.log('shipment_header_cs:fieldChange', 'field: ' + field);

        var result = true;

        result = onFiltersChanged(type, field, lineno);

        return result;

    } catch (exp) {
        console.error('shipment_header_cs:fieldChange', exp);
        return false;
    }
}


/**
 * Entry point for validate field
 * 
 * @param type {string} Edit operation
 * 
 */
function validateField(type, field, lineno) {
    try {
        console.log('shipment_header_cs:validateField', 'field: ' + field);

        var result = true;

        result = onShippedValidate(type, field, lineno);

        console.log('shipment_header_cs:validateField', 'result: ' + result);
        return result;

    } catch (exp) {
        console.error('shipment_header_cs:validateField', exp);
        return false;
    }
}


/**
 * Entry point for save record
 * 
 */
function saveRecord() {
    var result = true;
    try {
        console.log('shipment_header_cs:saveRecord');
        result = onSaveRecord();
    } catch (exp) {
        console.error('shipment_header_cs:saveRecord', exp);
    }
    return result;
}



////////////////////////////////////////////////////////////////////////////////
// Utility Functions
////////////////////////////////////////////////////////////////////////////////



var IS_REDIRECT_IN_PROCESS = false;


/**
 * disable the remaining text field on suitelet
 * 
 * @param {any} type 
 */
function disableReadonlyFields(type) {
    var sublist = 'custpage_po_lines';
    var rows = nlapiGetLineItemCount(sublist);
    for (var line = 1; line <= rows; line++) { 
        nlapiSetLineItemDisabled(sublist, 'remaining', true, line);
    }
}


/**
 * refresh screen when filters are changed
 * 
 * @param {string} field name of field which has been changed
 * @returns {void} 
 */
function onFiltersChanged(type, field, lineno) {

    try {
        
        // NetSuite firest fieldChange event twice on the sourced dropdown fields
        // first time this event is fired when an item from dropdown is selected
        // second time this is fired when user focuses out of the dropdown field.
        if (IS_REDIRECT_IN_PROCESS === true) return true;

        if (field === 'custpage_supplier') {
            
            nlapiSetFieldValue('custpage_submit_action', 'supplier_changed');
            NS.jQuery('[type="submit"]').click();
            IS_REDIRECT_IN_PROCESS = true;
            return;

        } else if (field === 'custpage_po_id') {
            
            nlapiSetFieldValue('custpage_submit_action', 'po_id_changed');
            NS.jQuery('[type="submit"]').click();
            IS_REDIRECT_IN_PROCESS = true;
            return;
        }

    } catch (exp) {
        console.error('shipment_header_cs:onFiltersChanged', exp);
    }

    return true;
}


/**
 * validate when shipped textfield is changed
 * 
 * @param {any} type 
 * @param {any} field 
 * @param {any} lineno 
 * @returns 
 */
function onShippedValidate(type, field, lineno) {
    try {
        if (field === 'shipped') {
            var quantity = parseFloat(nlapiGetLineItemValue(type, 'quantity', lineno) || "0");
            var shipped = parseFloat(nlapiGetCurrentLineItemValue(type, 'shipped') || "0");

            console.log('shipment_header_cs:validateLine', 'quantity: ' + quantity);
            console.log('shipment_header_cs:validateLine', 'shipped: ' + shipped);

            if (shipped < 0) {
                alert('shipped cannot be less than zero.');
                shipped = 0;
                nlapiSetLineItemValue(type, field, lineno, shipped);
            }

            var remaining = Math.max(quantity - shipped, 0);
            nlapiSetLineItemValue(type, 'remaining', lineno, remaining);
        }
    } catch (exp) {
        console.error('shipment_header_cs:onShippedValidate', exp);
    }

    return true;
}


/**
 * This is called on submit button click on suitelet. 
 * Confirm if user wants to update shipment header record
 * 
 * @returns 
 */
function onSaveRecord() {
    console.log('shipment_header_cs:onSaveRecord');
    var result = true;
    var submitAction = nlapiGetFieldValue('custpage_submit_action');
    if (submitAction === 'submit') {
        result = confirm("Confirm shipment update?");
    }
    return result;
}


/**
 * close this current popup window of suitelet if action is set to close
 * 
 * @returns 
 */
function closeSuiteletPopup() {
    var result = true;
    var submitAction = nlapiGetFieldValue('custpage_submit_action');
    if (submitAction === 'close') {
        window.opener.document.location.href = window.opener.document.location.href;
        window.close();
    }
    return result;
}
