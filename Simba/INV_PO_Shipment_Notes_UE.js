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
                log.debug("allDates", allDates);
                // Get new dates to create custom records
                var newDates = allDates.filter(function (date) {
                    return existingDateObj.indexOf(date) === -1;
                });
                log.debug("newDates", newDates);
                // Find dates that have been changed
                var changedDates = existingDateObj.filter(function (date) {
                    return uniqueDate.indexOf(date) === -1;
                });
                log.debug("changedDates", changedDates);
                // Inactivate existing records for changed dates
                if (changedDates.length > 0) {
                    inactivateChangedRecords(changedDates, existingDates);
                }

                // Create custom record new dates
                if (newDates.length > 0) {
                    createCustomRecords(recId, newDates);
                }
            }

        //Setting Shipment Notes Refernce in the item Sublist of PO
        var existingDate = getCMExistingDates(recId);

        curRec = record.load({
            type: record.Type.PURCHASE_ORDER,
            id: recId,
        })
        var numLines = curRec.getLineCount({ sublistId: 'item' });

        Object.keys(existingDate).forEach(function(date) {
            // Iterate through each line of the sublist
            for (var i = 0; i < numLines; i++) {
                // Get the value of the field for the current line
                var fieldValue = curRec.getSublistText({
                    sublistId: 'item',
                    fieldId: 'custcol_os_planned_etd',
                    line: i
                });                
                // Check if the value matches the date we're looking for
                if (fieldValue == date) {
                    // Set the Shipment Note field with related record Id
                    curRec.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_shipment_note_ref',
                        value: existingDate[date],
                        line: i,               
                    })                    
                }
            } 
        });
        curRec.save();
        } catch (error) {
            log.error("Error in afterSubmit", error);
        }

        try{
            var newRecord = context.newRecord;
            var oldRecord = context.oldRecord;        
            var lineCount = newRecord.getLineCount({ sublistId: 'item' });

            for (var i = 0; i < lineCount; i++) {
                var newETD = newRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_os_planned_etd', line: i });
                var oldETD = oldRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_os_planned_etd', line: i });
                var newETDforSavedSEarch = newRecord.getSublistText({ sublistId: 'item', fieldId: 'custcol_os_planned_etd', line: i });
                newETD = newETD ? new Date(newETD) : null;
                oldETD = oldETD ? new Date(oldETD) : null;
                // Compare the dates           
                if(oldETD && newETD && oldETD.getTime() !== newETD.getTime()){
                    //get id for new shipMent ref                
                    var newShipmentRef = getShipmentNoteID(recId, newETDforSavedSEarch);
                    var oldShipmentRef = oldRecord.getSublistValue({ sublistId: 'item', fieldId: 'custcol_shipment_note_ref', line: i });
                    var oldShipmentRec = record.load({
                                            type: "customrecord_po_shipment_notes",
                                            id: oldShipmentRef,
                                        })
                    var AustraliaNotes = oldShipmentRec.getValue({fieldId: 'custrecord_inv_australia_notes'});
                    var OverseasTemNotes = oldShipmentRec.getValue({fieldId: 'custrecord_inv_overseas_team_notes'});                    
                    var ConfirmedETD = oldShipmentRec.getText({fieldId: 'custrecord_inv_confirmed_etd'});                    
                    var ContainerBooked = oldShipmentRec.getValue({fieldId: 'custrecord_inv_container_booked'});                   
                    var ContainerBooking = oldShipmentRec.getValue({fieldId: 'custrecord_inv_container_booking'});                    
                    var PlannedQADate = oldShipmentRec.getText({fieldId: 'custrecord_inv_planned_qa_date'});                    
                    var QAConfirmed = oldShipmentRec.getValue({fieldId: 'custrecord_qa_confirmed'});                    
                    var QAComplete = oldShipmentRec.getValue({fieldId: 'custrecord_inv_qa_complete'});                   
                    var QACompletionDate = oldShipmentRec.getText({fieldId: 'custrecord_qa_completion_date'});                    
                    log.debug("NEW SHIPMENT NOTE ID: ",newShipmentRef);
                    
                    //Setting all data retrived from old shipment notes to new shipment note record
                    record.submitFields({
                        type: 'customrecord_po_shipment_notes',
                        id: newShipmentRef,
                        values: {
                                    'custrecord_inv_australia_notes': AustraliaNotes,
                                    'custrecord_inv_overseas_team_notes': OverseasTemNotes,
                                    'custrecord_inv_confirmed_etd': ConfirmedETD,
                                    'custrecord_inv_container_booked': ContainerBooked,
                                    'custrecord_inv_container_booking': ContainerBooking,
                                    'custrecord_inv_planned_qa_date': PlannedQADate,
                                    'custrecord_qa_confirmed': QAConfirmed,
                                    'custrecord_inv_qa_complete': QAComplete,
                                    'custrecord_qa_completion_date': QACompletionDate,
                                }
                    });
                    log.debug("New shipment Record values updated ...", "DONE");
                }
            }
        }catch(e){
            log.error("Error while setting new rec values.",e);
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
                values: {'custrecord_inv_old_notes': true}
            });
            log.debug("Custom Record marked as Old for date", date);
        });
    }

    function getShipmentNoteID(poID, etdDate){
        var InternalID;
        var customrecord_po_shipment_notesSearchObj = search.create({
            type: "customrecord_po_shipment_notes",
            filters:
            [
               ["custrecord_inv_po_ref","anyof",poID], 
               "AND", 
               ["custrecord_inv_planned_etd","on",etdDate]
            ],
            columns:
            [
               search.createColumn({name: "internalid", label: "Internal ID"})
            ]
         });
         var searchResultCount = customrecord_po_shipment_notesSearchObj.runPaged().count;
         log.debug("customrecord_po_shipment_notesSearchObj result count",searchResultCount);
         customrecord_po_shipment_notesSearchObj.run().each(function(result){
            // .run().each has a limit of 4,000 results
            InternalID = result.getValue({ name: "internalid"});
            return true;
         });
         return InternalID ;
    }
    return {
        afterSubmit: _afterSubmit
              
    };
});
