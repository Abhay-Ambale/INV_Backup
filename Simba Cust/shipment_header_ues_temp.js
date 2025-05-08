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
 * 1.00       22 May 2017     Muhammad Zain
 * 1.01       31 Oct 2017     Muhammad Zain     Changes for ticket # http://support.outserve.com.au/helpdesk/tickets/10996
 *
 */


// ///////////////////////////////////////////////////////
// Entry Point Functions
// ///////////////////////////////////////////////////////

/**
 * Entry point function for before load event
 * 
 * @param {string} type Edit operation
 * 
 */
function beforeLoad(type, form, request) {
	try {

        addFormButtons(type, form);
        
        addCustomCss(form);

		showPOLines(type, form);

		showTransferOrders(type, form);

	} catch (exp) {
		nlapiLogExecution('ERROR', 'shipment_header_ues:beforeLoad', exp);
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
        
        updateOriginalsReceivedOnBodyField(type, form, request);

	} catch (exp) {
		nlapiLogExecution('ERROR', 'shipment_header_ues:beforeSubmit', exp);
	}

}

/**
 * Entry point function for after submit event
 * 
 * @param {string} type Edit operation
 * 
 */
function afterSubmit(type) {
	try {
		
		updateLinkedPurchaseOrders(type);

	} catch (exp) {
		nlapiLogExecution('ERROR', 'shipment_header_ues:afterSubmit', exp);
	}

}


/////////////////////////////////////////////////////////
//Utility Functions
/////////////////////////////////////////////////////////

/**
 * Update Originals Received Checkbox on Body field
 * 
 * @param {any} type 
 * @param {any} form 
 * @param {any} request 
 */
function updateOriginalsReceivedOnBodyField(type, form, request) {
    try {
        
        var data = getLinesData();
        nlapiSetFieldValue('custrecord_kl_originals_received', data.allChecked ? 'T' : 'F');

    } catch (exp) {
        nlapiLogExecution('ERROR', 'shipment_header_ues:updateOriginalsReceivedOnBodyField', exp);
	}
}


/**
 * Get Data from Lines Sublist
 * 
 * @returns 
 */
function getLinesData() {
    var linesData = {};
    var allChecked = true;

    try {
        // var sublist = form.getSubList('custpage_po_lines');
        var count = nlapiGetLineItemCount('custpage_po_lines');

        allChecked = count > 0;

        for (var line = 1; line <= count; line++) {
            var internalid= nlapiGetLineItemValue('custpage_po_lines', 'internalid', line);
            var lineId = nlapiGetLineItemValue('custpage_po_lines', 'line', line);
            var originalsReceived = nlapiGetLineItemValue('custpage_po_lines', 'custcol_kl_originals_received_checkbox', line);
            linesData[internalid] = linesData[internalid] || {};
            linesData[internalid][lineId] = {
                originalsReceived: originalsReceived
            };

            allChecked = allChecked && originalsReceived == 'T';
        }
    } catch (exp) {
        nlapiLogExecution('ERROR', 'shipment_header_ues:getLinesData', exp);
    }
    
    return {
        data: linesData,
        allChecked: allChecked
    };
}



/**
 * Sync warehouse ETA field and Originals Received field to Purchase Order , 
 * 
 */
function updateLinkedPurchaseOrders(type) {
    try {
        
        var linesData = getLinesData().data;
        nlapiLogExecution('DEBUG', 'shipment_header_ues:updateLinkedPurchaseOrders', 'data: ' + linesData);

        var record = nlapiGetNewRecord();
        var warehouseETA = record.getFieldValue('custrecord_kl_ship_warehouse_eta');
        nlapiLogExecution('DEBUG', 'shipment_header_ues:updateLinkedPurchaseOrders', 'warehouseETA: ' + warehouseETA);
        
        var currentRecordId = nlapiGetRecordId();
        var poLines = getShipmentLines(currentRecordId);
        var parsedDate = null;
        
        if (!!warehouseETA) parsedDate = getFirstDayOfMonth(warehouseETA);

        var groups = groupLinesByPO(poLines);
        for (var key in groups) {
            var group = groups[key];

            nlapiLogExecution('DEBUG', 'shipment_header_ues:updateLinkedPurchaseOrders', 'purchaseorder: ' + key);

            try {
                updatePOLinesDueDate(key, group, parsedDate, linesData);
            } catch (ex) {
                var message = 'Error in updating PO: ' + ex.toString() + ', PO Info: ' + JSON.stringify(group);
                nlapiLogExecution('ERROR', 'shipment_header_ues:updateLinkedPurchaseOrders', message);
            }

            nlapiLogExecution('DEBUG', 'shipment_header_ues:updateLinkedPurchaseOrders', 'processed: ' + key);
        }
	} catch (exp) {
        nlapiLogExecution('ERROR', 'shipment_header_ues:updateLinkedPurchaseOrders', exp);
	}
}


/**
 * Update due date of all PO lines for a purchase order
 * 
 * @param {any} purchaseOrderId 
 * @param {any} poLines 
 * @param {any} date 
 * @param {any} firstDay 
 */
function updatePOLinesDueDate(purchaseOrderId, poLines, warehouseETA, linesData) {
    try {
        var purchaseOrder = nlapiLoadRecord('purchaseorder', purchaseOrderId);

        nlapiLogExecution('DEBUG', 'shipment_header_ues:updatePOLinesDueDate', 'poLines: ' + JSON.stringify(poLines));
        nlapiLogExecution('DEBUG', 'shipment_header_ues:updatePOLinesDueDate', 'poLines.length: ' + poLines.length);

        for (var i = 0; i < poLines.length; i++) {
            var poLine = poLines[i];
            var lineId = poLine.getValue('line');
            var lineNum = purchaseOrder.findLineItemValue('item', 'line', lineId);
            if (lineNum > 0) {

                var lineData = linesData[purchaseOrderId] && linesData[purchaseOrderId][lineId];
                
                purchaseOrder.selectLineItem('item', lineNum);
                
                if (!!warehouseETA) {
                    purchaseOrder.setCurrentLineItemValue('item', 'custcol_os_delivery_request_date', warehouseETA.date);
                    purchaseOrder.setCurrentLineItemValue('item', 'expectedreceiptdate', warehouseETA.firstDay);
                }
                
                if (!!lineData) purchaseOrder.setCurrentLineItemValue('item', 'custcol_kl_originals_received', lineData.originalsReceived);
                
                purchaseOrder.commitLineItem('item');
            }
        }

        nlapiSubmitRecord(purchaseOrder, true, true);
    } catch (exp) {
        nlapiLogExecution('ERROR', 'shipment_header_ues:updatePOLinesDueDate', exp);
	}
}


/**
 * Add Custom CSS to darken the alternate row color in sublist
 * 
 * @param {any} form 
 */
function addCustomCss(form) {
    try {
        var css = '<style>';
        css = css + '.uir-machine-row-even > td, .uir-list-row-even > td, .uir-list-additional-label-row > td {background-color: #CCC !important}';
        css = css + '</style>';
        
        form.addField('custpage_css', 'inlinehtml', null, null)
            .setDefaultValue(css);
    } catch (exp) {
        nlapiLogExecution('ERROR', 'shipment_header_ues:addCustomCss', exp);
    }
}


/**
 * Add custom buttons to the form
 * 
 * @param {string} type View / Edit operation
 * @param {nlobjForm} form Reference to form obj
 * 
 */
function addFormButtons(type, form) {
	try {
		if (type == 'view') {
			// form.setScript('customscript_os_saleorder_cs');

			var currentRecordId = nlapiGetRecordId();
			var status = nlapiGetFieldValue('custrecord_os_ship_status');
			var cancelStatus = 8;
			if (status == cancelStatus) return;


			var scriptId = "customscript_kl_shipment_header_slet";
			var deploymentId = "customdeploy_kl_shipment_header_slet";
			var url = nlapiResolveURL("SUITELET", scriptId, deploymentId);
			url += "&custpage_shipment_id=" + currentRecordId;

			// var func = "popWindow(" + url + "&" + postData.join('&') + ", 'Add PO', false, 800, 250 );";
			var property = "menubar=0,location=0,resizable=0,scrollbars=0,status=0,titlebar=0,toolbar=0";
			var func = "window.open( '" + url + "', 'Add PO', '" + property + "' )"
			form.addButton('custpage_add_po', LABEL_TOKENS.addpo, func);
			
			// below condition added by Invitra on 6th July 2020
			var isConsolePO 	= nlapiGetFieldValue('custrecord_inv_consolidated_po');
			if(isConsolePO != 'T'){
				var consolidateUrl = url + "&custpage_submit_action=consolidate_po";
				var consolidateWarning = 'Warning this step can not be reversed! Confirm Consolidate PO?';
				func = "if (confirm('"+ consolidateWarning +"')) { window.open( '" + consolidateUrl + "', 'Consolidate PO', '" + property + "' ) }";
				form.addButton('custpage_consolidate', LABEL_TOKENS.consolidate, func);
			}
            var roleId 		= nlapiGetRole();
            var roleInfo 	= getRole(roleId);            
            if (roleInfo && roleInfo.getValue('custrecord_kl_shipment_header_land') == 'T') {
                var landUrl = url + '&custpage_submit_action=land_shipment';
                var landWarning = "";
                func = "if (confirm('Warning. You may need to consolidate PO\\'s before doing this. Do you wish to continue?')) { window.open( '" + landUrl + "', 'Land Shipment', '" + property + "' ) }";
                // func = "window.open( '" + landUrl + "', 'Land Shipment', '" + property + "' )"
                form.addButton('custpage_land', LABEL_TOKENS.land, func);
			}
			
			
			var updateUrl = url + "&custpage_submit_action=update_shipment";
			func = "document.location.href='" + updateUrl + "';";
			form.addButton('custpage_update', LABEL_TOKENS.update, func);
            

			var cancelUrl = url + "&custpage_submit_action=cancel_shipment";
			func = "if (confirm('Confirm Shipment Cancellation?')) { window.open( '" + cancelUrl + "', 'Cancel Shipment', '" + property + "' ) }";
			form.addButton('custpage_cancel', LABEL_TOKENS.cancel, func);
            
		}
	} catch (exp) {
        nlapiLogExecution('ERROR', 'shipment_header_ues:addFormButtons', exp);
	}
}




/**
 * Create links for sales order, transfer order, item etc used in sublist
 * 
 * @param {any} type 
 * @param {any} record 
 * @param {any} idField 
 * @param {any} labelField 
 * @returns 
 */
function createLink(type, record, idField, labelField, join) {
    var linkHtml = '';

    try {
        join = join || '';
        var id = record.getValue(idField, join);
        var label = record.getText(labelField || idField, join) || record.getValue(labelField || idField, join);
        var url = nlapiResolveURL('record', type, id, 'View');

        linkHtml = '<a href="{0}" target="_blank">{1}</a>';
        linkHtml = linkHtml.replace(/{0}/gi, url);
        linkHtml = linkHtml.replace(/{1}/gi, label);
    } catch (ex) {
        nlapiLogExecution('ERROR', 'transferorder_consolidator_slet:createLink', ex);
    }

    return linkHtml;
}



/**
 * Display PO Lines as sublist
 * 
 * @param {string} type View / Edit operation
 * @param {nlobjForm} form Reference to form obj
 * 
 */
function showPOLines(type, form) {
	try {
		if (type == 'view' || type == 'edit') {
            var isSandbox = nlapiGetContext().getEnvironment() === 'SANDBOX';
			var currentRecordId = nlapiGetRecordId();
			var poLines = getShipmentLines(currentRecordId);

            // This code is written for the case when purchase orders are updated but shipment headers are not
            // so shipment headers will have old data on body level field.
            var originalsReceivedExistingValue = nlapiGetFieldValue('custrecord_kl_originals_received');
            var linesReceived = poLines.length > 0 && poLines.every(function(line) {
                var orgReceived =  line.getValue('custcol_kl_originals_received');
                nlapiLogExecution('DEBUG', 'orgReceived', orgReceived);
                if(orgReceived =='T'){
                    return orgReceived;
                }
                // return line.getValue('custcol_kl_originals_received') == 'T'; 
            });
            var linesReceivedCheckbox = linesReceived == true ? 'T' : 'F';
            nlapiLogExecution('DEBUG', 'linesReceivedCheckbox', linesReceivedCheckbox);

            if (originalsReceivedExistingValue != linesReceivedCheckbox) {
                nlapiLogExecution('DEBUG', 'originalsReceivedExistingValue != linesReceivedCheckbox', 'Start >>>>>');                                
                nlapiSubmitField('customrecord_os_shiphead', currentRecordId, 'custrecord_kl_originals_received', linesReceivedCheckbox);
                nlapiSetFieldValue('custrecord_kl_originals_received', linesReceivedCheckbox);
                nlapiLogExecution('DEBUG', 'originalsReceivedExistingValue != linesReceivedCheckbox', 'End >>>>>');
            }
            
			nlapiLogExecution('DEBUG', 'shipment_header_lib:showPOLines', 'originalsReceivedExistingValue: ' + originalsReceivedExistingValue + ', linesReceivedCheckbox: ' + linesReceivedCheckbox);
			nlapiLogExecution('DEBUG', 'shipment_header_lib:showPOLines', 'poLines.length: ' + poLines.length);
			nlapiLogExecution('DEBUG', 'shipment_header_lib:showPOLines', 'poLines: ' + JSON.stringify(poLines));

			//var poLinesSubTab = form.addTab('custpage_po_lines_tab', 'Shipment Items');
			var poLinesSublist = form.addSubList('custpage_po_lines', 'list', 'Shipment Items', 'custom123');
			poLinesSublist.addField('mainname', 'text', 'Supplier ID');
			// poLinesSublist.addField('custentity_os_legacyalpha', 'text', 'Supplier Legacy');
			poLinesSublist.addField('tranid', 'text', 'PO Number');
			poLinesSublist.addField('trandate', 'date', 'PO Date');
			poLinesSublist.addField('status', 'text', 'PO Status');
            poLinesSublist.addField('incoterm', 'text', 'Incoterms');
            poLinesSublist.addField('terms', 'text', 'Terms');
			poLinesSublist.addField('item', 'text', 'Item');
			poLinesSublist.addField('internalid', 'text', 'PO ID').setDisplayType('hidden');
			poLinesSublist.addField('line', 'text', 'Line').setDisplayType('hidden');
			poLinesSublist.addField('custitem_legacy_item_code', 'text', 'Legacy Item');
			poLinesSublist.addField('displayname', 'text', 'Display Name/Code');
			poLinesSublist.addField('description', 'text', 'Item Description');
			poLinesSublist.addField('quantity', 'float', 'Quantity');
			poLinesSublist.addField('custcol_kl_item_rate_fx', 'float', 'Unit Price');
			poLinesSublist.addField('quantityshiprecv', 'float', 'Received');
			poLinesSublist.addField('custcol_kl_quantity_shipped', 'float', 'Shipped');
			poLinesSublist.addField('expectedreceiptdate', 'date', 'Demand Planned Receipt Date');
			poLinesSublist.addField('custcol_os_delivery_request_date', 'date', 'Expected Receipt Date');
			poLinesSublist.addField('custcol_os_delivery_shipped_date', 'date', 'Delivery Shipped');
            poLinesSublist.addField('exchangerate', 'float', 'Exchange Rate');
            
            if (type == 'view') poLinesSublist.addField('custcol_kl_originals_received', 'text', 'Originals Received');
            if (type == 'edit') poLinesSublist.addField('custcol_kl_originals_received_checkbox', 'checkbox', 'Originals Received');

            // set values in sublist    
			poLinesSublist.setLineItemValues(poLines);

			var line;
			var quantity;
			var poLine;
			var legacyItem;
			var index = 0;
			for (; index < poLines.length; index++) {
				poLine = poLines[index];
				line = index + 1;
				legacyItem = poLine.getValue('custitem_legacy_item_code', 'item') + ' ' + poLine.getValue('custitem_os_legacy_name', 'item');
                
                var originalsReceived = poLine.getValue('custcol_kl_originals_received');
                var itemName = poLine.getText('item');
				if (itemName.indexOf(':') != -1) itemName = itemName.split(':')[1];

                poLinesSublist.setLineItemValue('terms', line, poLine.getText('terms'));
				poLinesSublist.setLineItemValue('incoterm', line, poLine.getText('incoterm'));
				poLinesSublist.setLineItemValue('mainname', line, poLine.getText('mainname'));
				poLinesSublist.setLineItemValue('item', line, itemName);
				poLinesSublist.setLineItemValue('status', line, poLine.getText('status'));
				poLinesSublist.setLineItemValue('displayname', line, poLine.getValue('displayname', 'item'));
				poLinesSublist.setLineItemValue('description', line, poLine.getValue('description', 'item'));
				poLinesSublist.setLineItemValue('custitem_legacy_item_code', line, legacyItem);
				poLinesSublist.setLineItemValue('custcol_kl_originals_received', line, originalsReceived == 'T' ? 'Yes' : 'No');
				poLinesSublist.setLineItemValue('custcol_kl_originals_received_checkbox', line, originalsReceived);
			}

		}
	} catch (exp) {
		nlapiLogExecution('ERROR', 'shipment_header_ues:showPOLines', exp);
	}
}




/**
 * Display PO Lines as sublist
 * 
 * @param {string} type View / Edit operation
 * @param {nlobjForm} form Reference to form obj
 * 
 */
function showTransferOrders(type, form) {
    try {
        if (type == 'view' || type == 'edit') {
            nlapiLogExecution('DEBUG', 'shipment_header_ues:showTransferOrders', 'START');
            var isSandbox = nlapiGetContext().getEnvironment() === 'SANDBOX';
			var currentRecordId = nlapiGetRecordId();
			var transferOrders = getTransferOrders(currentRecordId);

			nlapiLogExecution('DEBUG', 'shipment_header_ues:showTransferOrders', 'transferOrders.length: ' + transferOrders.length);
			nlapiLogExecution('DEBUG', 'shipment_header_ues:showTransferOrders', 'transferOrders: ' + JSON.stringify(transferOrders));
            
			var transferOrdersSublist = form.addSubList('custpage_po_transfer_orders', 'list', 'Transfer Orders', 'custom124');
			transferOrdersSublist.addField('tranid', 'text', 'Order #');
			transferOrdersSublist.addField('trandate', 'date', 'Date');
			transferOrdersSublist.addField('status', 'text', 'Status');
			transferOrdersSublist.addField('subsidiary', 'text', 'Subsidiary');
			transferOrdersSublist.addField('location', 'text', 'From Location');
			transferOrdersSublist.addField('transferlocation', 'text', 'To Location');
            
			// set values in sublist    
			transferOrdersSublist.setLineItemValues(transferOrders);

			var line;
			var quantity;
			var transferOrder;
			var index = 0;
			for (; index < transferOrders.length; index++) {
                transferOrder = transferOrders[index];
				line = index + 1;
                
				transferOrdersSublist.setLineItemValue('status', line, transferOrder.getText('status'));
				transferOrdersSublist.setLineItemValue('subsidiary', line, transferOrder.getText('subsidiary'));
				transferOrdersSublist.setLineItemValue('location', line, transferOrder.getText('location'));
				transferOrdersSublist.setLineItemValue('transferlocation', line, transferOrder.getText('transferlocation'));
			}
            
            nlapiLogExecution('DEBUG', 'shipment_header_ues:showTransferOrders', 'END');
		}
	} catch (exp) {
		nlapiLogExecution('ERROR', 'shipment_header_ues:showTransferOrders', exp.toString());
	}
}