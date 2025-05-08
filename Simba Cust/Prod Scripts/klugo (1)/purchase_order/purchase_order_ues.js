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
 * 1.00       06 Jul 2017     Muhammad Zain
 *
 */


/////////////////////////////////////////////////////////
// Entry Point Functions
/////////////////////////////////////////////////////////


/**
 * Entry point function for before load event
 * 
 * @param {string} type Edit operation
 * 
 */
function beforeLoad(type, form, request) {
	try {

        setShipHeadPermissionField(type, form, request);

	} catch (exp) {
		nlapiLogExecution('ERROR', 'purchase_order_ues:beforeLoad', exp.toString());
	}

}


/**
 * Entry point function for before submit event
 * 
 * @param {string} type Edit operation
 * 
 */
function beforeSubmit(type, form, request) {
	try {
        nlapiLogExecution('DEBUG', 'purchase_order_ues:beforeSubmit', 'type: ' + type);
        setLineItemFxRate(type);
	} catch (exp) {
		nlapiLogExecution('ERROR', 'purchase_order_ues:beforeSubmit', exp.toString());
	}

}

/**
 * Entry point function for after submit event
 * 
 * @param {string} type Edit operation
 * 
 */
function afterSubmit(type, form, request) {
	try {
        nlapiLogExecution('DEBUG', 'purchase_order_ues:afterSubmit', 'type: ' + type);
        setLineItemFxRateForAfterSubmit(type); 
	} catch (exp) {
		nlapiLogExecution('ERROR', 'purchase_order_ues:afterSubmit', exp.toString());
	}

}


/////////////////////////////////////////////////////////
//Utility Functions
/////////////////////////////////////////////////////////


function setShipHeadPermissionField(type, form, request) {
    try {
        if (type == 'edit') { 
            var field = form.addField('custpage_can_upd_po_line_permission', 'checkbox', '');

            var canUpdateShipHeadLine = false;
            var roleId = nlapiGetRole();
            var roleInfo = getRole(roleId);

            if (!!roleInfo) {
                canUpdateShipHeadLine = roleInfo.getValue('custrecord_kl_can_update_po_ship_head') == 'T';
            }

            field.setDisplayType('hidden').setDefaultValue(canUpdateShipHeadLine == true ? 'T' : 'F');
        }
    } catch (exp) {
		nlapiLogExecution('ERROR', 'purchase_order_ues:setShipHeadPermissionField', exp);
	}
}



/**
 * Set Foreign Currency rate in a custom field to later fetch in search results.
 * 
 */
function setLineItemFxRateForAfterSubmit(type) {
    try {
        if (type == 'delete') {
            return;
        }

        var recordId = nlapiGetRecordId();
        var record = nlapiLoadRecord('purchaseorder', recordId);
        var sublist = 'item';
        var count = record.getLineItemCount(sublist);
        nlapiLogExecution('DEBUG', 'purchase_order_ues:setLineItemFxRateForAfterSubmit', 'count: ' + count);

        for (var line = 1; line <= count; line++) {

            var rate = record.getLineItemValue(sublist, 'rate', line);
            var fxrate = record.getLineItemValue(sublist, 'custcol_kl_item_rate_fx', line);

            var debug = 'recordId: ' + recordId;
            debug += ' line: ' + line;
            debug += ' rate: ' + rate;
            debug += ' fxrate: ' + fxrate;
            nlapiLogExecution('DEBUG', 'purchase_order_ues:setLineItemFxRateForAfterSubmit', debug);

            if (rate !== fxrate) {
                record.selectLineItem(sublist, line);
                record.setCurrentLineItemValue(sublist, 'custcol_kl_item_rate_fx', rate);
                record.commitLineItem(sublist);
            }
        }

        nlapiSubmitRecord(record, true, true);
    } catch (exp) {
		nlapiLogExecution('ERROR', 'purchase_order_ues:setLineItemFxRateForAfterSubmit', exp.toString());
	}
}

/**
 * Set Foreign Currency rate in a custom field to later fetch in search results.
 * 
 */
function setLineItemFxRate(type) {
    try {
        
        if (type == 'delete') {
            return;
        }

        var recordId = nlapiGetRecordId();
        var sublist = 'item';
        var count = nlapiGetLineItemCount(sublist);
        nlapiLogExecution('DEBUG', 'purchase_order_ues:setItemRate', 'count: ' + count);
        for (var line = 1; line <= count; line++) {

            var rate = nlapiGetLineItemValue(sublist, 'rate', line);
            var fxrate = nlapiGetLineItemValue(sublist, 'custcol_kl_item_rate_fx', line);

            var debug = 'recordId: ' + recordId;
            debug += ' line: ' + line;
            debug += ' rate: ' + rate;
            debug += ' fxrate: ' + fxrate;
            nlapiLogExecution('DEBUG', 'purchase_order_ues:setItemRate', debug);

            if (rate !== fxrate) {
                nlapiSelectLineItem(sublist, line);
                nlapiSetCurrentLineItemValue(sublist, 'custcol_kl_item_rate_fx', rate, false, false);
                nlapiCommitLineItem(sublist);
            }
        }
    } catch (exp) {
		nlapiLogExecution('ERROR', 'purchase_order_ues:setLineItemFxRate', exp.toString());
	}
}
