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
 * 1.00       25 May 2017     Muhammad Zain
 * 1.01       31 Oct 2017     Muhammad Zain     Changes for ticket # http://support.outserve.com.au/helpdesk/tickets/10996
 * 1.03       21 Nov 2017     Muhammad Zain     Ticket # 10996: added exchange rate column
 */

//
//This use to manage labels for custom buttons added via script
//
LABEL_TOKENS = {
	"addpo": "Add PO",
	"cancel": "Cancel",
	"land": "Land",
	"consolidate": "Consolidate PO",
	"update": "Update"
};

var SHIPMENT_STATUS = {
    "Shipped": 1,
    "Landed": 2,
    "Planned": 6,
    "Complete": 7,
    "Canceled": 8
};



/////////////////////////////////////////////////////////
// Generic Functions :: START
/////////////////////////////////////////////////////////

/**
 * Loads the shipment header record and returns
 * 
 * @param {any} shipmentId 
 * @returns 
 */
function getShipmentHeader(shipmentId) {
    var result = null;

    try {
        result = nlapiLoadRecord('customrecord_os_shiphead', shipmentId);
    } catch (exp) {
        nlapiLogExecution('ERROR', 'shipment_header_lib:getShipmentHeader', exp);
    }

    return result;
}


/**
 * Returns PO lines linked with the specified `shipmentHeaderId`
 * 
 * @param {any} shipmentHeaderId 
 * @returns {any[]} array of po lines
 */
function getShipmentLines(shipmentHeaderId) {
    var poLines = [];

    try {
            
        // load purchase order lines
        var poLineFilters = [
            new nlobjSearchFilter('closed', null, 'is', 'F'),
            new nlobjSearchFilter('custcol_kl_shipment_header', null, 'anyof', shipmentHeaderId)
        ];
        var poLineColumns = [
            new nlobjSearchColumn('internalid'),
            new nlobjSearchColumn('item'),
            new nlobjSearchColumn('displayname', 'item'),
            new nlobjSearchColumn('custcol_os_tran_itemlegacycode'),
            new nlobjSearchColumn('description', 'item'),
            new nlobjSearchColumn('custitem_os_legacy_name', 'item'),
            new nlobjSearchColumn('custitem_legacy_item_code', 'item'),
            new nlobjSearchColumn('tranid'),
            new nlobjSearchColumn('trandate'),
            new nlobjSearchColumn('closed'),
            new nlobjSearchColumn('status'),
            new nlobjSearchColumn('mainname'),
            new nlobjSearchColumn('custcol_kl_shipment_mode'),
            new nlobjSearchColumn('custcol_kl_shipment_payer'),
            new nlobjSearchColumn('custentity_os_legacyalpha', 'vendor'),
            new nlobjSearchColumn('subsidiary'),
            new nlobjSearchColumn('location'),
            new nlobjSearchColumn('line'),
            new nlobjSearchColumn('expectedreceiptdate'),
            new nlobjSearchColumn('custcol_os_delivery_request_date'),
            new nlobjSearchColumn('custcol_os_delivery_shipped_date'),
            new nlobjSearchColumn('rate'),
            new nlobjSearchColumn('custcol_kl_item_rate_fx'),
            new nlobjSearchColumn('quantity'),
            new nlobjSearchColumn('quantityshiprecv'),
            new nlobjSearchColumn('custcol_kl_quantity_shipped'),
            new nlobjSearchColumn('terms'),
            new nlobjSearchColumn('incoterm'),
            new nlobjSearchColumn('exchangerate'),
            new nlobjSearchColumn('custcol_kl_originals_received')
        ];
        
        poLines = nlapiSearchRecord('purchaseorder', null, poLineFilters, poLineColumns) || [];
    } catch (exp) {
        nlapiLogExecution('ERROR', 'shipment_header_lib:getShipmentLines', exp);
    }

	return poLines;
}


/**
 * Returns PO lines linked with the specified `shipmentHeaderId`
 * 
 * @param {any} shipmentHeaderId 
 * @returns {any[]} array of po lines
 */
function getTransferOrders(shipmentHeaderId) {
    var transferOrders = [];

    try {

        // load purchase order lines
        var filters = [
            new nlobjSearchFilter('mainline', null, 'is', 'T'),
            new nlobjSearchFilter('custbody_kl_shipment_header', null, 'anyof', shipmentHeaderId)
        ];
        var columns = [
            new nlobjSearchColumn('internalid'),
            new nlobjSearchColumn('item'),
            new nlobjSearchColumn('tranid'),
            new nlobjSearchColumn('trandate'),
            new nlobjSearchColumn('closed'),
            new nlobjSearchColumn('status'),
            new nlobjSearchColumn('subsidiary'),
            new nlobjSearchColumn('location'),
            new nlobjSearchColumn('transferlocation')
        ];
        
        transferOrders = nlapiSearchRecord('transferorder', null, filters, columns) || [];

    } catch (exp) {
        nlapiLogExecution('ERROR', 'shipment_header_lib:getTransferOrders', exp);
    }

	return transferOrders;
}


/**
 * Returns PO Lines linked with the speicifed `supplierId`
 * 
 * @param {any} supplierId 
 * @returns {any[]} array of po lines
 */
function getPOLinesBySupplier(supplierId, poTransactionId) {
    nlapiLogExecution('DEBUG', 'shipment_header_lib:getPOLinesBySupplier', 'supplierId: ' + supplierId);
    var poLines = [];

    try {
            
        var poLineFilters = [
            new nlobjSearchFilter('mainline', null, 'is', 'F'),
            new nlobjSearchFilter('taxline', null, 'is', 'F'),
            new nlobjSearchFilter('closed', null, 'is', 'F'),
            new nlobjSearchFilter('status', null, 'noneof', ['PurchOrd:A']),
            new nlobjSearchFilter('entity', null, 'anyof', supplierId),
            new nlobjSearchFilter('location', null, 'noneof', '@NONE@'),
            new nlobjSearchFilter('custcol_kl_shipment_header', null, 'anyof', '@NONE@'),
            new nlobjSearchFilter('formulanumeric', null, 'greaterthan', 0).setFormula('{quantity} - {quantityshiprecv}')
        ];
        var poLineColumns = [
            new nlobjSearchColumn('internalid'),
            new nlobjSearchColumn('item'),
            new nlobjSearchColumn('custitem_legacy_item_code', 'item'),
            new nlobjSearchColumn('custitem_os_legacy_name', 'item'),
            new nlobjSearchColumn('description', 'item'),
            new nlobjSearchColumn('displayname', 'item'),
            new nlobjSearchColumn('tranid'),
            new nlobjSearchColumn('mainname'),
            new nlobjSearchColumn('rate'),
            new nlobjSearchColumn('taxcode'),
            new nlobjSearchColumn('custcol_kl_item_rate_fx'),
            new nlobjSearchColumn('trandate'),
            new nlobjSearchColumn('line'),
            new nlobjSearchColumn('quantity'),
			new nlobjSearchColumn('custcol_os_delivery_request_date'),
            new nlobjSearchColumn('exchangerate')
        ];

        if (!!poTransactionId) {
            poLineFilters.push(new nlobjSearchFilter('internalid', null, 'anyof', poTransactionId));
        }
        
        poLines = nlapiSearchRecord('purchaseorder', null, poLineFilters, poLineColumns) || [];
	} catch (exp) {
        nlapiLogExecution('ERROR', 'shipment_header_lib:getPOLinesBySupplier', exp);
    }

	return poLines;
}


/**
 * Returns PO Lines linked with the speicifed `supplierId`
 * 
 * @param {any} supplierId 
 * @returns {any[]} array of po lines
 */
function getPurchaseOrdersBySupplier(supplierId) {
    nlapiLogExecution('DEBUG', 'shipment_header_lib:getPurchaseOrdersBySupplier', 'supplierId: ' + supplierId);
    var poLines = [];

    try {
            
        var poLineFilters = [
            new nlobjSearchFilter('mainline', null, 'is', 'T'),
            // new nlobjSearchFilter('taxline', null, 'is', 'F'),
            new nlobjSearchFilter('closed', null, 'is', 'F'),
            new nlobjSearchFilter('status', null, 'anyof', ['PurchOrd:B', 'PurchOrd:D', 'PurchOrd:E']),
            new nlobjSearchFilter('entity', null, 'anyof', supplierId),
            new nlobjSearchFilter('location', null, 'noneof', '@NONE@'),
            new nlobjSearchFilter('custcol_kl_shipment_header', null, 'anyof', '@NONE@')
        ];
        var poLineColumns = [
            new nlobjSearchColumn('internalid'),
            // new nlobjSearchColumn('item'),
            // new nlobjSearchColumn('custitem_legacy_item_code', 'item'),
            // new nlobjSearchColumn('custitem_os_legacy_name', 'item'),
            // new nlobjSearchColumn('description', 'item'),
            // new nlobjSearchColumn('displayname', 'item'),
            new nlobjSearchColumn('tranid'),
            new nlobjSearchColumn('mainname'),
            // new nlobjSearchColumn('rate'),
            // new nlobjSearchColumn('taxcode'),
            // new nlobjSearchColumn('custcol_kl_item_rate_fx'),
            new nlobjSearchColumn('trandate'),
            // new nlobjSearchColumn('line'),
            // new nlobjSearchColumn('quantity'),
            new nlobjSearchColumn('exchangerate')
        ];
        
        poLines = nlapiSearchRecord('purchaseorder', null, poLineFilters, poLineColumns) || [];
	} catch (exp) {
        nlapiLogExecution('ERROR', 'shipment_header_lib:getPurchaseOrdersBySupplier', exp);
    }

	return poLines;
}


/**
 * groups all the lines with respect to PO.
 * 
 * @param {any} poLines 
 * @returns {any} hash of PO number and its lines 
 */
function groupLinesByPO(poLines) {
	var groups = {};
	for (var i = 0; i < poLines.length; i++) {
		var poLine = poLines[i];
		var internalId = poLine.getValue('internalid');
		
		// initialize group
		if (!groups[internalId]) {
			groups[internalId] = [];
		}

		groups[internalId].push(poLine);
	}

	return groups;
}


/**
 * groups all the lines with respect to PO.
 * 
 * @param {any} poLines 
 * @returns {any} hash of PO number and its lines 
 */
function groupLinesBySupplier(poLines) {
    var groups = {};

    try {
        for (var i = 0; i < poLines.length; i++) {
            var poLine = poLines[i];
            var internalId = poLine.getValue('mainname');
            
            // initialize group
            if (!groups[internalId]) {
                groups[internalId] = [];
            }

            groups[internalId].push(poLine);
        }
    } catch (exp) {
        nlapiLogExecution('ERROR', 'shipment_header_lib:groupLinesBySupplier', exp);
    }

	return groups;
}


/**
 * Get all the lines submitted by user from request
 * 
 * @param {any} request 
 * @returns 
 */
function getPOLinesFromRequest(request) {
    var poLines = [];
    var sublist = 'custpage_po_lines';
    
    try {
        var rows = request.getLineItemCount(sublist);
        // var final;

        for (line = 1; line <= rows; line++) {

            var poLine = {
                internalid: request.getLineItemValue(sublist, 'internalid', line),
                line: request.getLineItemValue(sublist, 'line', line),
                rate: request.getLineItemValue(sublist, 'custcol_kl_item_rate_fx', line),
                taxcode: request.getLineItemValue(sublist, 'taxcode', line),
                shipped: parseFloat(request.getLineItemValue(sublist, 'shipped', line) || 0),
                quantity: parseFloat(request.getLineItemValue(sublist, 'quantity', line) || 0),
                // final: request.getLineItemValue(sublist, 'final', line),
                item: request.getLineItemValue(sublist, 'item', line)
            };

            poLines.push(poLine);
        }
    } catch (exp) {
        nlapiLogExecution('ERROR', 'shipment_header_lib:getPOLinesFromRequest', exp);
    }
	
	return poLines;
}


/**
 * Update Shipment Header Status
 * 
 * @param {any} shipmentId 
 * @param {any} statusId 
 * @param {any} shipment 
 */
function changeShipmentHeaderStatus(shipmentId, statusId, shipment) {
    try {
        // set shipment header to cancel
        var shipmentHeader = shipment || nlapiLoadRecord('customrecord_os_shiphead', shipmentId);
        shipmentHeader.setFieldValue('custrecord_os_ship_status', statusId);
        nlapiSubmitRecord(shipmentHeader, true, true);
    } catch (exp) {
        nlapiLogExecution('ERROR', 'shipment_header_lib:changeShipmentHeaderStatus', exp);
    }
}


/**
 * Get first day of month from date
 * 
 * @param {any} warehouseETA 
 * @returns 
 */
function getFirstDayOfMonth(warehouseETA) {
	var parts = warehouseETA.split('/');
	var date = new Date(parts[2], parts[1]-1, parts[0]); 
	var y = date.getFullYear(), m = date.getMonth();
	var firstDay = new Date(y, m, 1);
	return {
		firstDay: firstDay,
		date: date
	};
}

/////////////////////////////////////////////////////////
// Generic Functions :: END
/////////////////////////////////////////////////////////


/////////////////////////////////////////////////////////
// Add PO related functions :: START
/////////////////////////////////////////////////////////

/**
 * Update PO Line with respect to shipment header info.
 * 
 * @param {any} poLine 
 * @param {any} shipmentId 
 */
function updatePOLine(poLine, shipmentId) {
    try {
        nlapiLogExecution('DEBUG', 'shipment_header_lib:updatePOLine', 'processing record: ' + JSON.stringify(poLine));

        var purchaseOrder = nlapiLoadRecord('purchaseorder', poLine.internalid);
        var remaining = poLine.quantity - poLine.shipped;
        var lineData = {};
		var plannedETD = '';
        var fieldsToCopy = [
            'expectedreceiptdate', 
            'custcol_os_delivery_request_date', 
            'custcol_os_delivery_shipped_date',
            'department',
            'class',
            'landedcostcategory',
            'customer',
            'isbillable',
            'custcol_os_status',
            'matchbilltoreceipt',
            'custcol_os_planned_etd',
            'custcol_kl_shipment_mode',
            'custcol_kl_shipment_payer',
            'custcol_kl_edt'
        ];

        // If Shipped QTY < PO Line QTY then
        if (remaining > 0) {
            // Split the PO Line into the original line with QTY updated to Remaining
            var line = purchaseOrder.findLineItemValue('item', 'line', poLine.line);
            nlapiLogExecution('DEBUG', 'shipment_header_lib:updatePOLine', 'line: ' + line);
            if (line > 0) {
                purchaseOrder.selectLineItem('item', line);
                //purchaseOrder.setCurrentLineItemValue('item', 'quantity', remaining);
                purchaseOrder.setCurrentLineItemValue('item', 'quantity', poLine.shipped);
				purchaseOrder.setCurrentLineItemValue('item', 'custcol_kl_quantity_shipped', poLine.shipped);
				// Shipped to Shipment ID
				purchaseOrder.setCurrentLineItemValue('item', 'custcol_kl_shipment_header', shipmentId);
				
				
				plannedETD 	= purchaseOrder.getCurrentLineItemValue('item', 'custcol_os_planned_etd');
				
                fieldsToCopy.forEach(function(field) {
                    lineData[field] = purchaseOrder.getCurrentLineItemValue('item', field);
                });
                purchaseOrder.commitLineItem('item');
            }

            // Insert new line for the same Item where 
            // the QTY  = entered Shipped QTY.
            purchaseOrder.selectNewLineItem('item');
            purchaseOrder.setCurrentLineItemValue('item', 'item', poLine.item);
			purchaseOrder.setCurrentLineItemValue('item', 'rate', poLine.rate);
			
            // Shipped to Shipment ID
            //purchaseOrder.setCurrentLineItemValue('item', 'custcol_kl_shipment_header', shipmentId);
            // QTY Shipped to entered Shipped value            
            //purchaseOrder.setCurrentLineItemValue('item', 'quantity', poLine.shipped);
			//purchaseOrder.setCurrentLineItemValue('item', 'custcol_kl_quantity_shipped', poLine.shipped);
            purchaseOrder.setCurrentLineItemValue('item', 'quantity', remaining);            
            if (!!poLine.taxcode) {
                purchaseOrder.setCurrentLineItemValue('item', 'taxcode', poLine.taxcode);
            }
            
            Object.keys(lineData).forEach(function(key){
                if (!!lineData[key]) {
                    purchaseOrder.setCurrentLineItemValue('item', key, lineData[key]);
                }
            });
			
			if(plannedETD != ''){
				var plannedETDarr 	= plannedETD.split('/');
				var plannedETDupd 	= plannedETDarr[1]+'/'+plannedETDarr[0]+'/'+plannedETDarr[2];
				var newPlannedETD 	= nlapiAddDays(new Date(plannedETDupd), 1);
				purchaseOrder.setCurrentLineItemValue('item', 'custcol_os_planned_etd', newPlannedETD);
			}

            purchaseOrder.commitLineItem('item');
        }
        else {
            var line = purchaseOrder.findLineItemValue('item', 'line', poLine.line);
            nlapiLogExecution('DEBUG', 'shipment_header_lib:updatePOLine', 'line: ' + line);
            if (line > 0) {
                purchaseOrder.selectLineItem('item', line);
                // Shipped to Shipment ID
                purchaseOrder.setCurrentLineItemValue('item', 'custcol_kl_shipment_header', shipmentId);
                // QTY Shipped to entered Shipped value
                purchaseOrder.setCurrentLineItemValue('item', 'custcol_kl_quantity_shipped', poLine.shipped);
                purchaseOrder.setCurrentLineItemValue('item', 'quantity', poLine.shipped);
                purchaseOrder.commitLineItem('item');
            }
        }

        nlapiSubmitRecord(purchaseOrder, true, true);
        
        nlapiLogExecution('DEBUG', 'shipment_header_lib:updatePOLine', 'record submitted: ' + JSON.stringify(poLine));
    } catch (exp) {
        nlapiLogExecution('ERROR', 'shipment_header_lib:updatePOLine', exp);
    }
}

/////////////////////////////////////////////////////////
// Add PO related functions :: END
/////////////////////////////////////////////////////////


/////////////////////////////////////////////////////////
// Clear shipment related functions :: START
/////////////////////////////////////////////////////////

/**
 * Unlink all the PO lines from shipment headers
 * 
 * @param {any} purchaseOrderId 
 * @param {any} poLines 
 */
function clearPOLines(purchaseOrderId, poLines) {
    try {
        var purchaseOrder = nlapiLoadRecord('purchaseorder', purchaseOrderId);

        for (var i = 0; i < poLines.length; i++) {
            var poLine = poLines[i];

            var line = purchaseOrder.findLineItemValue('item', 'line', poLine.getValue('line'));
            nlapiLogExecution('DEBUG', 'shipment_header_lib:clearPOLines', 'line: ' + line);

            if (line > 0) {
                purchaseOrder.selectLineItem('item', line);
                // Shipped to Shipment ID
                purchaseOrder.setCurrentLineItemValue('item', 'custcol_kl_shipment_header', null);
                // QTY Shipped to entered Shipped value
                purchaseOrder.setCurrentLineItemValue('item', 'custcol_kl_quantity_shipped', "0");
                purchaseOrder.commitLineItem('item');
            }
        }

        nlapiSubmitRecord(purchaseOrder, true, true);
    } catch (ex) {
        nlapiLogExecution('ERROR', 'shipment_header_lib:clearPOLines', ex);
    }
}

/////////////////////////////////////////////////////////
// Clear shipment related functions :: END
/////////////////////////////////////////////////////////


/////////////////////////////////////////////////////////
// Land Shipment related functions :: START
/////////////////////////////////////////////////////////

/**
 * Generate Item Receipt for all the specified purchase orders 
 * 
 * @param {any} purchaseOrders 
 * @param {any} shipmentId 
 * @param {any} location 
 * @param {any} shipment 
 * @returns 
 */
function generatePOReceipts(purchaseOrders, shipmentId, location, shipment) {
	var linesInfo = [];

	// loop on all purchase orders
	// and generate receipt for each of them
	// and store their lines information
	// and return lines info
	for (var poId in purchaseOrders) {
		var poLines = purchaseOrders[poId];
		
		nlapiLogExecution('DEBUG', 'shipment_header_slet:processLand', 'purchaseorder: ' + poId);

		try {
			var poReceiptLines = generatePOReceipt(poId, poLines, shipmentId, location, shipment);
			
			if (poReceiptLines && poReceiptLines.length > 0) {
				linesInfo = linesInfo.concat(poReceiptLines);
			}

		} catch (ex) {
			var message = 'Error in generating Item receipt: ' + ex.toString() + ', PO Info: ' + JSON.stringify(purchaseOrders);
			nlapiLogExecution('ERROR', 'shipment_header_slet:processLand', message);
		}

	}

	return linesInfo;
}


/**
 * Generate Receipt of Purchase order for only those lines which are added in current shipment
 * 
 * @param {any} purchaseOrderId 
 * @param {any} poLines 
 * @param {any} shipmentId 
 * @param {any} poLocation 
 * @param {any} shipment 
 * @returns 
 */
function generatePOReceipt(purchaseOrderId, poLines, shipmentId, poLocation, shipment) {
	
    var linesInfo = [];
    
    try {
        // var purchaseOrder = nlapiLoadRecord('purchaseorder', purchaseOrderId);
        // var subsidiary = purchaseOrder.getFieldValue('subsidiary');
        var location = poLocation; //purchaseOrder.getFieldValue('location');

        var itemReceipt = nlapiTransformRecord('purchaseorder', purchaseOrderId, 'itemreceipt');
        var itemProperties = {};

        var exchangeRate = shipment.getFieldValue('custrecord_kl_ship_landed_rec_exch_rate');
        if (!!exchangeRate) itemReceipt.setFieldValue('exchangerate', exchangeRate);

        var count = itemReceipt.getLineItemCount('item');
        for (var line = 1; line <= count; line++) {
            var lineShipId = itemReceipt.getLineItemValue('item', 'custcol_kl_shipment_header', line);
            var itemId = itemReceipt.getLineItemValue('item', 'item', line);
            var quantity = itemReceipt.getLineItemValue('item', 'custcol_kl_quantity_shipped', line); // itemReceipt.getLineItemValue('item', 'quantity', line);
            var rate = itemReceipt.getLineItemValue('item', 'rate', line); // itemReceipt.getLineItemValue('item', 'quantity', line);
            
            // exclude all those lines which are not linked with current shipment id.
            if (lineShipId != shipmentId) {
                itemReceipt.setLineItemValue('item', 'itemreceive', line, 'F');
            }
            else {
                
                // set item location to landed location
                itemReceipt.setLineItemValue('item', 'location', line, location);
                
                if (!itemProperties[itemId]) {
                    itemProperties[itemId] = nlapiLookupField('item', itemId, ['custitem_kl_landed_duty_applies']);
                }
                
                linesInfo.push({
                    itemId: itemId,
                    quantity: quantity,
                    rate: rate,
                    custitem_kl_landed_duty_applies: itemProperties[itemId].custitem_kl_landed_duty_applies
                });
            }
        }
        
        nlapiSubmitRecord(itemReceipt, true, true);
    } catch (ex) {
        nlapiLogExecution('ERROR', 'shipment_header_lib:generatePOReceipt', ex);
    }

	return linesInfo;

}


/**
 * groups all the lines with respect to PO.
 * 
 * @param {any} poLines 
 * @returns {any} hash of PO number and its lines 
 */
function groupLinesBySubsidiaryAndLocation(poLines) {
	var groups = {};
	for (var i = 0; i < poLines.length; i++) {
		var poLine = poLines[i];
		var internalId = poLine.getValue('internalid');
		var subsidiary = poLine.getValue('subsidiary');
		var location = poLine.getValue('location');
		var key = subsidiary + '_' + location;
		
		// initialize group
		if (!groups[key]) {
			groups[key] = {};
		}

		if (!groups[key][internalId]) {
			groups[key][internalId] = [];
		}

		groups[key][internalId].push(poLine);
	}

	return groups;
}


/**
 * Get mappings of location with respect to subsidiary
 * 
 */
function getSubsidiaryLocationMapping() {
	var filters = [
	];
	var columns = [
		new nlobjSearchColumn('custrecord_kl_shl_subsidiary'),
		new nlobjSearchColumn('custrecord_kl_shl_landed_location')
	];
	var results = nlapiSearchRecord('customrecord_kl_shipment_header_landed', null, filters, columns) || [];

	var mappings = {};
	for (var index = 0; index < results.length; index++) {
		var result = results[index];
		var subsidiary = result.getValue(columns[0]);
		var location = result.getValue(columns[1]);
		mappings[subsidiary] = location;
	}
	
	return mappings;
}

/**
 * Create Transfer order record 
 * 
 * This method is invoked after receiving items of purchase order
 * 
 * @param {any} params 
 * @param {any} linesInfo 
 */
function generateTransferOrder(params, linesInfo) {
    
    try { 
        if (linesInfo && linesInfo.length > 0) {
            
            var transferOrder = nlapiCreateRecord('transferorder');
            transferOrder.setFieldValue('subsidiary', params.subsidiary);
            transferOrder.setFieldValue('location', params.location);
            transferOrder.setFieldValue('transferlocation', params.toLocation);
            transferOrder.setFieldValue('custbody_kl_shipment_header', params.shipmentId);

            // add items into transfer order            
            for (var i = 0; i < linesInfo.length; i++) {
                var lineInfo = linesInfo[i];
                transferOrder.selectNewLineItem('item');
                transferOrder.setCurrentLineItemValue('item', 'item', lineInfo.itemId);
                transferOrder.setCurrentLineItemValue('item', 'quantity', lineInfo.quantity);
                transferOrder.setCurrentLineItemValue('item', 'rate', lineInfo.rate);
                transferOrder.commitLineItem('item');
            }

            nlapiSubmitRecord(transferOrder, true, true);
        }
    } catch (ex) {
        nlapiLogExecution('ERROR', 'shipment_header_lib:generateTransferOrder', ex);
    }
}

/////////////////////////////////////////////////////////
// Land Shipment related functions :: END
/////////////////////////////////////////////////////////


/////////////////////////////////////////////////////////
// Consolidate PO related functions :: START
/////////////////////////////////////////////////////////

/**
 * Create Consolidated Purchase Order for specified supplier
 * 
 * @param {any} shipmentId 
 * @param {any} supplierId 
 * @param {any} lines 
 * @returns 
 */
function createPOForSupplierLines(shipmentId, supplierId, lines) {
    var logTitle = 'shipment_header_lib:createPOForSupplierLines';
    
    try {
        var heritageTypeChild = "2";
        var parentPoLines = {};
        var purchaseOrder = nlapiCreateRecord('purchaseorder');
        var shipment = getShipmentHeader(shipmentId);
        
        if (shipment == null) throw new Error('Shipment Header with id ' + shipmentId + ' does not exist. Please check that the id is correct.');
        
        var warehouseETA = shipment.getFieldValue('custrecord_kl_ship_warehouse_eta'); 
        var locationId = shipment.getFieldValue('custrecord_os_shipment_finaldest'); 
        if (!locationId) throw new Error('Warehouse field is not set on Shipment Header record. Please assign a warehouse and then try again.');
        
        var location = nlapiLoadRecord('location', locationId);
        var subsidiaryId = location.getFieldValue('subsidiary'); 
        var parsedDate = warehouseETA && getFirstDayOfMonth(warehouseETA);

        nlapiLogExecution('DEBUG', logTitle, '-------------- subsidiaryId: ' + subsidiaryId);	
		 
		 nlapiLogExecution('DEBUG', logTitle, 'supplierId: ' + supplierId);
        nlapiLogExecution('DEBUG', logTitle, 'lines: ' + JSON.stringify(lines));
        nlapiLogExecution('DEBUG', logTitle, 'heritageTypeChild: ' + heritageTypeChild);
        
        purchaseOrder.setFieldValue('entity', supplierId);

        // set to Approved by default
        purchaseOrder.setFieldValue('approvalstatus', "2");
		purchaseOrder.setFieldValue('custbody_inv_po_approval_status', "3");
		purchaseOrder.setFieldValue('custbody_inv_po_category', "1"); // PO Category = 1 = Trading
		//Below code is Added by Prajval(invitra) on 18 Feb 2020 ================
		purchaseOrder.setFieldValue('custbody_inv_consolidated_po', "T");
        var firstLine = lines[0];
        if (!!firstLine) {
            // purchaseOrder.setFieldValue('subsidiary', firstLine.getValue('subsidiary'));
            // purchaseOrder.setFieldValue('location', firstLine.getValue('location'));
			//nlapiLogExecution('DEBUG', logTitle, '--------------------- firstLine : subsidiary ' + firstLine.getValue('subsidiary'));
			
			
            purchaseOrder.setFieldValue('subsidiary', subsidiaryId || firstLine.getValue('subsidiary'));
            purchaseOrder.setFieldValue('location', locationId || firstLine.getValue('location'));
            purchaseOrder.setFieldValue('exchangerate', firstLine.getValue('exchangerate'));
        }

        for (var index = 0; index < lines.length; index++) {
            var line = lines[index];
            var quantity = line.getValue('quantity');
            var itemId = line.getValue('item');
            var lineId = line.getValue('line');
            var rate = line.getValue('custcol_kl_item_rate_fx');
            var poId = line.getId();

            purchaseOrder.selectNewLineItem('item');
            purchaseOrder.setCurrentLineItemValue('item', 'item', itemId);
            purchaseOrder.setCurrentLineItemValue('item', 'quantity', quantity);
            purchaseOrder.setCurrentLineItemValue('item', 'rate', rate);
            purchaseOrder.setCurrentLineItemValue('item', 'custcol_kl_quantity_shipped', quantity);
            purchaseOrder.setCurrentLineItemValue('item', 'custcol_kl_shipment_header', shipmentId);
            purchaseOrder.setCurrentLineItemValue('item', 'custcol_kl_linked_po', poId);
            purchaseOrder.setCurrentLineItemValue('item', 'custcol_kl_shipment_mode', line.getValue('custcol_kl_shipment_mode'));
            purchaseOrder.setCurrentLineItemValue('item', 'custcol_kl_shipment_payer', line.getValue('custcol_kl_shipment_payer'));
            
            if (!!parsedDate) {
                purchaseOrder.setCurrentLineItemValue('item', 'custcol_os_delivery_request_date', parsedDate.date);
                purchaseOrder.setCurrentLineItemValue('item', 'expectedreceiptdate', parsedDate.firstDay);
            }

            purchaseOrder.commitLineItem('item');

            // we need to store parent PO Id and line number 
            // so that we can unlink those lines from shipment header
            // and then close it.
            if (!parentPoLines[poId]) {
                parentPoLines[poId] = []
            }
            parentPoLines[poId].push(lineId);
        }

        purchaseOrder.setFieldValue('custbody_kl_po_heritage_type', "2");
        nlapiLogExecution('DEBUG', logTitle, 'heritageTypeChild in PO: ' + purchaseOrder.getFieldValue('custbody_kl_po_heritage_type'));
        
        var childPOId = nlapiSubmitRecord(purchaseOrder, true, true);

        //nlapiSubmitField('purchaseorder', childPOId, 'custbody_kl_po_heritage_type', "2");
		
		// Below code updated by Invitra on 6 July 2020 to set to Consolidated PO on Shipment Header
		nlapiSubmitField('customrecord_os_shiphead', shipmentId, 'custrecord_inv_consolidated_po', 'T');
		
		// Below code updated by Invitra on 27 July 2018 to set to Approved by default
		nlapiSubmitField('purchaseorder', childPOId, ['custbody_kl_po_heritage_type', 'custbody_inv_po_approval_status', 'approvalstatus', 'custbody_inv_po_category'], ['2', '3', '2', '1']);

        var result = {
            childPOId: childPOId,
            purchaseOrders: parentPoLines
        };
        nlapiLogExecution('DEBUG', logTitle, 'result: ' + JSON.stringify(result));
        return result;
    } catch (ex) {
        nlapiLogExecution('ERROR', logTitle, ex);
        return null;
    }
}


/**
 * Update Parent Purchase Orders and remove shipment header links from their lines
 * 
 * @param {any} shipmentId 
 * @param {any} supplierId 
 * @param {any} parentPOInfo 
 */
function updateParentPOs(shipmentId, supplierId, parentPOInfo) {
    try {
        nlapiLogExecution('DEBUG', 'shipment_header_lib:updateParentPOs', 'parentPOInfo: ' + JSON.stringify(parentPOInfo));

        for (var poId in parentPOInfo.purchaseOrders) {
            
            var poLines = parentPOInfo.purchaseOrders[poId];
            var purchaseOrder = nlapiLoadRecord('purchaseorder', poId);

            var itemsCount = purchaseOrder.getLineItemCount('item');
            nlapiLogExecution('DEBUG', 'shipment_header_lib:updateParentPOs', 'itemsCount: ' + itemsCount);
            
            for (var index in poLines) {
                var line = purchaseOrder.findLineItemValue('item', 'line', poLines[index]);
                nlapiLogExecution('DEBUG', 'shipment_header_lib:updateParentPOs', 'line: ' + line);
                if (line > 0) {
                    purchaseOrder.selectLineItem('item', line);
                    // purchaseOrder.setCurrentLineItemValue('item', 'quantity', remaining);
                    purchaseOrder.setCurrentLineItemValue('item', 'isclosed', 'T');
                    purchaseOrder.setCurrentLineItemValue('item', 'custcol_kl_shipment_header', null);
                    purchaseOrder.setCurrentLineItemValue('item', 'custcol_kl_quantity_shipped', "0");
                    purchaseOrder.setCurrentLineItemValue('item', 'custcol_kl_linked_po', parentPOInfo.childPOId);
                    purchaseOrder.commitLineItem('item');
                }
            }

            nlapiSubmitRecord(purchaseOrder, true, true);
        }
    } catch (ex) {
        nlapiLogExecution('ERROR', 'shipment_header_lib:updateParentPOs', ex);
    }
}

/////////////////////////////////////////////////////////
// Consolidate PO related functions :: END
/////////////////////////////////////////////////////////