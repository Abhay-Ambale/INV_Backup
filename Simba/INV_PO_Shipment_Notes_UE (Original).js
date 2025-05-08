/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 */

/* ************************************************************************
 * Company:     Invitratech, www.invitratech.com
 * Author:      Mahesh
 * Script:      INV PO Shipment Notes UE
 * Applies To:  Purchase Order
 *
 * This User event script includes below functionality
 *  1) Create nad update custom record 'PO Shipment Notes' based on PO sublist planned ETD value.
 *
 *
 * Version    Date            Author              Remarks
 * 1.00       15 May 2024     Mahesh k            Initial commit
 ***********************************************************************/
define(['N/record', 'N/search', 'N/format', 'N/log'], function (record, search, format, log) {
    function _afterSubmit(context) {
        var curRec = context.newRecord;
        var recId = curRec.id;
        var recordMode = context.type.toUpperCase();
        log.debug("context", context);

        try {
            if (recordMode == 'CREATE' || recordMode == 'EDIT') {

                if (recId) {
                    var uniqueDate = getPOSearchData(recId);
                    var existingDates = getCMExistingDates(recId);
                }

                // get Key value from existingDates object
                var existingDateObj = Object.keys(existingDates);

                // Combine the two arrays
                var allDates = uniqueDate.concat(existingDateObj.filter(function (date) {
                    return uniqueDate.indexOf(date) === -1;
                }));

                // Get new dates to create custom records
                var newDates = allDates.filter(function (date) {
                    return existingDateObj.indexOf(date) === -1;
                });

                // Find dates that have been changed
                var changedDates = existingDateObj.filter(function (date) {
                    return uniqueDate.indexOf(date) === -1;
                });

                // Inactivate existing records for changed dates
                if (changedDates.length > 0) {
                    inactivateChangedRecords(changedDates, existingDates);
                }

                // Create custom record new dates
                if (newDates.length > 0) {
                    createCustomRecords(recId, newDates);
                }
            }
        } catch (error) {
            log.error("Error in afterSubmit", error);
        }
    }


    function getPOSearchData(recId) {
        var dateArr = [];
        var purchaseorderSearchObj = search.create({
            type: "purchaseorder",
            settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
            filters: [
                ["type", "anyof", "PurchOrd"],
                "AND",
                ["internalid", "anyof", recId],
                "AND",
                ["custcol_os_planned_etd", "isnotempty", ""],
              "AND", 
      ["mainline","is","F"], 
      "AND", 
      ["closed","is","F"], 
      "AND", 
      ["custcol_kl_shipment_header","anyof","@NONE@"]
            ],
            columns: [
                search.createColumn({ name: "custcol_os_planned_etd", summary: "GROUP", label: "Planned ETD" })
            ]
        });
        purchaseorderSearchObj.run().each(function (result) {
            var uniqueDate = result.getValue({ name: "custcol_os_planned_etd", summary: "GROUP" });
            dateArr.push(uniqueDate);
            return true;
        });
        log.debug("getPOSearchData results", dateArr);
        return dateArr;
    }


    function getCMExistingDates(recId) {
        var dateObj = {};
        var customrecord_po_shipment_notesSearchObj = search.create({
            type: "customrecord_po_shipment_notes",
            filters: [
                ["custrecord_inv_po_ref", "anyof", recId],
                "AND",
                ["isinactive", "is", "F"]
            ],
            columns: [
                search.createColumn({ name: "custrecord_inv_planned_etd", summary: "GROUP", label: "Planned ETD" }),
                search.createColumn({ name: "internalid", summary: "GROUP", label: "Internal ID" })
            ]
        });
        customrecord_po_shipment_notesSearchObj.run().each(function (result) {
            var existingDate = result.getValue({ name: "custrecord_inv_planned_etd", summary: "GROUP" });
            var internalId = result.getValue({ name: "internalid", summary: "GROUP" });
            dateObj[existingDate] = internalId;
            return true;
        });
        log.debug("getCMExistingDates results", dateObj);
        return dateObj;
    }


    function createCustomRecords(recId, dates) {
        dates.forEach(function (date) {
            var formattedDate = format.parse({ value: date, type: format.Type.DATE });
            var customRecord = record.create({ type: 'customrecord_po_shipment_notes' });
            customRecord.setValue({ fieldId: 'custrecord_inv_planned_etd', value: formattedDate });
            customRecord.setValue({ fieldId: 'custrecord_inv_po_ref', value: recId });
            customRecord.save();
            log.debug("Custom Record created for date", date);
        });
    }


    function inactivateChangedRecords(changedDates, existingRecords) {
        changedDates.forEach(function (date) {
            var recordId = existingRecords[date];
            var cmRecID = record.submitFields({
                type: 'customrecord_po_shipment_notes',
                id: recordId,
                values: { 'isinactive': true }
            });
            log.debug("Custom Record inactivated for date", date);
        });
    }


    return {
        afterSubmit: _afterSubmit
    };
});
