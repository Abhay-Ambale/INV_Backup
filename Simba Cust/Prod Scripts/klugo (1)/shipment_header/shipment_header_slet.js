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
 * 1.00       23 May 2017     Muhammad Zain
 * 1.01       31 Oct 2017     Muhammad Zain     Changes for ticket # http://support.outserve.com.au/helpdesk/tickets/10996
 * 1.02       05 Nov 2017     Muhammad Zain     Ticket # 11117: changed supplier field to source from vendor record
 * 1.03       21 Nov 2017     Muhammad Zain     Ticket # 10996: added exchange rate column
 *
 */


////////////////////////////////////////////////////////////////////////////////
//Entry Point
////////////////////////////////////////////////////////////////////////////////

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function process(request, response) {
    var action = request.getParameter('custpage_submit_action');
    var method = request.getMethod();

    var debugLog = 'method: ' + method + ', action: ' + action; 
    nlapiLogExecution('DEBUG', 'shipment_header_slet:process', debugLog);

    if (action === 'cancel_shipment') {
        processCancel(request, response);
        
    } else if (action === 'land_shipment') {
        processLand(request, response);

    } else if (action === 'consolidate_po') {
        processConsolidatePO(request, response);

    } else if (action === 'update_shipment') {
        updateShipment(request, response);

    } else if (action === 'supplier_changed' || action == 'po_id_changed' || method === 'GET') {
        processGet(request, response);

    } else {
        processPost(request, response);
    }
}

////////////////////////////////////////////////////////////////////////////////
// Utility Functions
////////////////////////////////////////////////////////////////////////////////

/**
 * processes GET request
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 */
function processGet(request, response) {
    var form = nlapiCreateForm('Add PO');

    buildFormLayout(request, response, form);
}


/**
 * Process request submitted by user through POST method
 * 
 * This function throws validation errors, therefore 
 * exception handling is done only in partial code inside
 * 
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 */
function processPost(request, response) {
    var form = nlapiCreateForm('Add PO', false);
    var shipmentId = request.getParameter("custpage_shipment_id") || request.getParameter("custpage_shipment");
    var supplierId = request.getParameter("custpage_supplier_id") || request.getParameter("custpage_supplier");

    nlapiLogExecution('DEBUG', 'shipment_header_slet:processPost', 'shipmentId: ' + shipmentId);
    nlapiLogExecution('DEBUG', 'shipment_header_slet:processPost', 'supplierId: ' + supplierId);

    // make sure shipment id is provided    
    if (!shipmentId || parseInt(shipmentId) == 0) {
        throw new Error('Invalid shipment header id. Please open this from Shipment Header record.');
    }

    if (!supplierId || parseInt(supplierId) == 0) {
        throw new Error('Please select Supplier.');
    }

    var poLines = getPOLinesFromRequest(request);

    nlapiLogExecution('DEBUG', 'shipment_header_slet:processPost', 'poLines: ' + JSON.stringify(poLines));

    for (var i = 0; i < poLines.length; i++) {
        var poLine = poLines[i];

        try {

            // For each PO Line where Shipped > 0 on the PO Lines set 
            if (poLine.shipped > 0) {
                updatePOLine(poLine, shipmentId);
            }

        } catch (ex) {
            var message = 'Error in updating PO: ' + ex.toString() + ', PO Info: ' + JSON.stringify(poLine);
            nlapiLogExecution('ERROR', 'shipment_header_slet:processPost', message);
        }
    }

    // add hidden field with `close` value, so 
    // that client script should close this window and refresh parent window
    form.addField('custpage_submit_action', 'text', null, null)
        .setDisplayType('hidden')
        .setDefaultValue('close');

    // add client script to handle client side validation and submission
    form.setScript('customscript_kl_shipment_header_cs');

    // send output
    response.writePage(form);
}


/**
 * process Land request
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 */
function processLand(request, response) {
    var form = nlapiCreateForm(' ', true);

    var shipmentId = request.getParameter("custpage_shipment_id") || request.getParameter("custpage_shipment");

    // make sure shipment id is provided    
    if (!shipmentId || parseInt(shipmentId) == 0) {
        throw new Error('Invalid shipment header id. Please open this from Shipment Header record.')
    }

    // load shipment record
    var shipment = getShipmentHeader(shipmentId);
    var poLines = getShipmentLines(shipmentId);
    var locations = groupLinesBySubsidiaryAndLocation(poLines);
    var subsidiaryLocationMapping = getSubsidiaryLocationMapping();

    for (var key in locations) {
        var purchaseOrders = locations[key];

        var keyParts = key.split('_');
        var subsidiary = keyParts.shift();
        var toLocation = keyParts.shift();
        var location = subsidiaryLocationMapping[subsidiary];

        var linesInfo = generatePOReceipts(purchaseOrders, shipmentId, location, shipment);

        var landedDutyLines = linesInfo.filter(function (line) {
            return line.custitem_kl_landed_duty_applies == 'T';
        });

        var nonLandedDutyLines = linesInfo.filter(function (line) {
            return line.custitem_kl_landed_duty_applies != 'T';
        });

        var params = {
            subsidiary: subsidiary,
            location: location,
            toLocation: toLocation,
            shipmentId: shipmentId
        };

        generateTransferOrder(params, landedDutyLines);
        generateTransferOrder(params, nonLandedDutyLines);
    }

    // set status to Landed now
    changeShipmentHeaderStatus(shipmentId, SHIPMENT_STATUS.Landed, shipment);
    
    // add hidden field with `close` value, so 
    // that client script should close this window and refresh parent window
    form.addField('custpage_submit_action', 'text', null, null)
        .setDisplayType('hidden')
        .setDefaultValue('close');

    // add client script to handle client side validation and submission
    form.setScript('customscript_kl_shipment_header_cs');    
    
    // send output
    response.writePage(form);
}


/**
 * process Cancel request
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 */
function processCancel(request, response) {
    var form = nlapiCreateForm(' ', true);

    var shipmentId = request.getParameter("custpage_shipment_id") || request.getParameter("custpage_shipment");

    // make sure shipment id is provided    
    if (!shipmentId || parseInt(shipmentId) == 0) {
        throw new Error('Invalid shipment header id. Please open this from Shipment Header record.')
    }

    var poLines = getShipmentLines(shipmentId);
    var groups = groupLinesByPO(poLines);
    for (var key in groups) {
        var group = groups[key];

        nlapiLogExecution('DEBUG', 'shipment_header_slet:processCancel', 'purchaseorder: ' + key);

        try {
            clearPOLines(key, group);
        } catch (ex) {
            var message = 'Error in updating PO: ' + ex.toString() + ', PO Info: ' + JSON.stringify(group);
            nlapiLogExecution('ERROR', 'shipment_header_slet:processCancel', message);
        }

        nlapiLogExecution('DEBUG', 'shipment_header_slet:processCancel', 'processed: ' + key);
    }

    changeShipmentHeaderStatus(shipmentId, SHIPMENT_STATUS.Canceled);

    // add hidden field with `close` value, so 
    // that client script should close this window and refresh parent window
    form.addField('custpage_submit_action', 'text', null, null)
        .setDisplayType('hidden')
        .setDefaultValue('close');

    // add client script to handle client side validation and submission
    form.setScript('customscript_kl_shipment_header_cs');

    // send output
    response.writePage(form);
}



/**
 * Consolidate PO based on supplier.
 * 
 * @param {any} request Request object
 * @param {any} response Response object
 */
function updateShipment(request, response) {
    
    var shipmentId = request.getParameter("custpage_shipment_id") || request.getParameter("custpage_shipment");
    
    // make sure shipment id is provided    
    if (!shipmentId || parseInt(shipmentId) == 0) {
        throw new Error('Invalid shipment header id. Please open this from Shipment Header record.');
    }

    var shipmentHeader = getShipmentHeader(shipmentId);
    if (shipmentHeader == null) throw new Error('Shipment Header with id ' + shipmentId + ' does not exist. Please check that the id is correct.');

    try {
        // if shipment header record found, then just submit the record
        // it will trigger the user events and sync required fields with PO.
        nlapiSubmitRecord(shipmentHeader, true, true);

        var form = nlapiCreateForm('Updating Shipment Header...', true);

        // take user back to project record
        // nlapiSetRedirectURL('RECORD', 'job', projectId);
        var url = nlapiResolveURL("RECORD", 'customrecord_os_shiphead', shipmentId);
        url = url + '';
        var script = "<script>document.location.href='" + url +  "';</script>";
        form.addField('custpage_script', 'inlinehtml', '')
            .setDefaultValue(script);

        response.writePage(form);
    } catch (ex) {
        nlapiLogExecution('ERROR', 'shipment_header_slet:updateShipment', ex);
    }
}


/**
 * Consolidate PO based on supplier.
 * 
 * @param {any} request Request object
 * @param {any} response Response object
 */
function processConsolidatePO(request, response) {
    nlapiLogExecution('DEBUG', 'shipment_header_slet:processConsolidatePO', 'Start');
    
    var form = nlapiCreateForm(' ', true);
    var shipmentId = request.getParameter("custpage_shipment_id") || request.getParameter("custpage_shipment");

    // make sure shipment id is provided    
    if (!shipmentId || parseInt(shipmentId) == 0) {
        throw new Error('Invalid shipment header id. Please open this from Shipment Header record.');
    }

    nlapiLogExecution('DEBUG', 'shipment_header_slet:processConsolidatePO', 'shipmentId: ' + shipmentId);
    
    // load shipment lines 
    var poLines = getShipmentLines(shipmentId);
    var supplierWiseLines = groupLinesBySupplier(poLines);
    
    for (var supplierId in supplierWiseLines) {
        var lines = supplierWiseLines[supplierId];

        // create child purchase orders
        var parentPOInfo = createPOForSupplierLines(shipmentId, supplierId, lines);

        // update parent purchase orders
        updateParentPOs(shipmentId, supplierId, parentPOInfo);
    }


    // add hidden field with `close` value, so 
    // that client script should close this window and refresh parent window
    form.addField('custpage_submit_action', 'text', null, null)
        .setDisplayType('hidden')
        .setDefaultValue('close');

    // add client script to handle client side validation and submission
    form.setScript('customscript_kl_shipment_header_cs');

    // send output
    response.writePage(form);

    nlapiLogExecution('DEBUG', 'shipment_header_slet:processConsolidatePO', 'End');
}


/**
 * Responsible for creating UI
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @param {nlobjForm} form form object to create UI controls
 */
function buildFormLayout(request, response, form) {

    var openSalesorders;
    var toSalesOrdersField;
    var unappliedDeposits;
    var unappliedDepositSalesorderIds;
    var poLinesSublist;
    var shipmentId = request.getParameter("custpage_shipment_id") || request.getParameter("custpage_shipment");
    var supplierId = request.getParameter("custpage_supplier_id") || request.getParameter("custpage_supplier");
    var poTransactionId = request.getParameterValues("custpage_po_id");

    nlapiLogExecution('DEBUG', 'shipment_header_slet:buildFormLayout', 'shipmentId: ' + shipmentId);
    nlapiLogExecution('DEBUG', 'shipment_header_slet:buildFormLayout', 'supplierId: ' + supplierId);
    nlapiLogExecution('DEBUG', 'shipment_header_slet:buildFormLayout', 'poTransactionId: ' + poTransactionId);

    // make sure shipment id is provided    
    if (!shipmentId) {
        throw new Error('Please provide custpage_shipment_id parameter.')
    }

    // add body level fields in the form
    addFormBodyFields(shipmentId, form);

    var supplierField = form.addField('custpage_supplier', 'select', 'Supplier', 'vendor');
    
    var poTransactionFilterField = form.addField('custpage_po_id', 'multiselect', 'PO Transaction Filter');
    poTransactionFilterField.addSelectOption('', '-- All --');

    if (!!poTransactionId) {
        poTransactionFilterField.setDefaultValue(poTransactionId);
    }

    var supplierLegacy = form.addField('custpage_supplier_legacyalpha', 'text', 'Supplier Legacy')
        .setDisplayType('inline');

    if (!!supplierId) {
        supplierField.setDefaultValue(supplierId);

        // bind purchase orders dropdown
        var purchaseOrders = getPurchaseOrdersBySupplier(supplierId);
        purchaseOrders.forEach(function (purchaseOrder, index) {
            var label = purchaseOrder.getValue('tranid') + ' ' + purchaseOrder.getText('mainname');
            poTransactionFilterField.addSelectOption(purchaseOrder.getId(), label);
        });

        // set default value on legacy supplier dropdown
        var selectedSupplier = nlapiLookupField('vendor', supplierId, ['custentity_os_legacyalpha']);
        supplierLegacy.setDefaultValue(selectedSupplier.custentity_os_legacyalpha);

        // add sublist of PO lines        
        addPOLinesSublist(supplierId, poTransactionId, form);
    }

    // add client script to handle client side validation and submission
    form.setScript('customscript_kl_shipment_header_cs');

    // add submit button
    form.addSubmitButton('Submit');

    
    var css = '<style>';
    css = css + '.uir-machine-row-even > td, .uir-list-row-even > td, .uir-list-additional-label-row > td {background-color: #CCC !important}';
    css = css + '</style>';
    form.addField('custpage_css', 'inlinehtml', null, null)
        .setDefaultValue(css);

    // send output
    response.writePage(form);
}

/**
 * Add basic body fields on suitelet form
 * 
 * @param {any} shipmentId 
 * @param {any} form 
 */
function addFormBodyFields(shipmentId, form) {

    // load shipment record    
    var shipment = getShipmentHeader(shipmentId);

    if (shipment != null) {
        // add readonly fields
        form.addField('custpage_shipment', 'text', 'Shipment')
            .setDisplayType('inline')
            .setDefaultValue(shipment.getFieldValue('name'));

        form.addField('custpage_shipment_shipdate', 'date', 'Departure Port ETD')
            .setDisplayType('inline')
            .setDefaultValue(shipment.getFieldValue('custrecord_os_ship_date'));

        form.addField('custpage_shipment_duedate', 'date', 'Arrival Port ETA')
            .setDisplayType('inline')
            .setDefaultValue(shipment.getFieldValue('custrecord_os_due_date'));

        form.addField('custpage_shipment_warehouse_eta', 'date', 'Warehouse ETA')
            .setDisplayType('inline')
            .setDefaultValue(shipment.getFieldValue('custrecord_kl_ship_warehouse_eta'));
    }

    form.addField('custpage_submit_action', 'text', null, null)
        .setDisplayType('hidden')
        .setDefaultValue('submit');

    // save shipment id for postback
    form.addField('custpage_shipment_id', 'text', null, null)
        .setDisplayType('hidden')
        .setDefaultValue(shipmentId);


}


/**
 * Add a sublist of PO lines to the suitelet
 * These PO lines are filtered based off supplier id
 * 
 * @param {any} supplierId 
 * @param {any} form 
 */
function addPOLinesSublist(supplierId, poTransactionId, form) {
    var poLines = getPOLinesBySupplier(supplierId, poTransactionId);

    nlapiLogExecution('DEBUG', 'shipment_header_slet:buildFormLayout', 'poLines.length: ' + poLines.length);
    nlapiLogExecution('DEBUG', 'shipment_header_slet:buildFormLayout', 'poLines: ' + JSON.stringify(poLines));

    // add a sublist to the form. Specify an internal ID for the sublist,
    // a sublist type, sublist UI label, and the tab the sublist will appear on
    var poLinesSublist = form.addSubList('custpage_po_lines', 'list', 'PO Lines');
    poLinesSublist.addField('internalid', 'text', 'PO ID').setDisplayType('hidden');
    poLinesSublist.addField('custcol_kl_item_rate_fx', 'text', 'Rate').setDisplayType('hidden');
    poLinesSublist.addField('taxcode', 'text', 'taxcode').setDisplayType('hidden');
    poLinesSublist.addField('tranid', 'text', 'PO Number');
    poLinesSublist.addField('trandate', 'date', 'PO Date');
	poLinesSublist.addField('expected_receipt_date', 'date', 'Expected Receipt Date'); //This code added by Invitra
    poLinesSublist.addField('exchangerate', 'float', 'Exchange Rate');
    poLinesSublist.addField('line', 'text', 'Line Id');
    poLinesSublist.addField('mainname', 'text', 'Import Supplier Name');
    
    poLinesSublist.addField('item', 'text', 'Item').setDisplayType('hidden');
    poLinesSublist.addField('item_name', 'text', 'Item Name');
    poLinesSublist.addField('description', 'textarea', 'Item Description');
    poLinesSublist.addField('custitem_legacy_item_code', 'text', 'Legacy Item');
    poLinesSublist.addField('displayname', 'text', 'Display Name/Code');
    poLinesSublist.addField('quantity', 'float', 'Qty');
    poLinesSublist.addField('shipped', 'float', 'Shipped').setDisplayType('entry');

    // poLinesSublist.addField('final', 'checkbox', 'Final');
    poLinesSublist.addField('remaining', 'float', 'Remaining').setDisplayType('entry');

    // set values in sublist    
    poLinesSublist.setLineItemValues(poLines);

    var line;
    var quantity;
    var poLine;
    var legacyItem;
    var index = 0;
    for (; index < poLines.length; index++) {
        line = index + 1;
        poLine = poLines[index];
        quantity = poLine.getValue('quantity');
        legacyItem = poLine.getValue('custitem_legacy_item_code', 'item') + ' ' + poLine.getValue('custitem_os_legacy_name', 'item');
        var itemName = poLine.getText('item');
        if (itemName.indexOf(':') != -1) itemName = itemName.split(':')[1];

        poLinesSublist.setLineItemValue('mainname', line, poLine.getText('mainname'));
        poLinesSublist.setLineItemValue('item_name', line, itemName);
        poLinesSublist.setLineItemValue('description', line, poLine.getValue('description', 'item'));
        poLinesSublist.setLineItemValue('displayname', line, poLine.getValue('displayname', 'item'));
        poLinesSublist.setLineItemValue('shipped', line, "0");
        poLinesSublist.setLineItemValue('remaining', line, quantity);
		poLinesSublist.setLineItemValue('expected_receipt_date', line, poLine.getValue('custcol_os_delivery_request_date')); //This code added by Invitra
        poLinesSublist.setLineItemValue('custitem_legacy_item_code', line, legacyItem);
    }
}
