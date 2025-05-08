/**
 *@NApiVersion 2.0
 *@NScriptType UserEventScript
 */

/*************************************************************************
 * Company:    Invitra Technologies Private Limited
 * Author:     Invitra Developer
 * Script:     
 * Applies To: invoice
 *
 *
 * This script includes below functionality
 *
 * Version    Date            Author        Remarks
 * 1.01       07 Oct 2024     Developer     Initial commit
 *
 ***********************************************************************/
define(['N/search'], function (search) {
    function beforeLoad(context) {
        //if (context.type === context.UserEventType.VIEW || context.type === context.UserEventType.EDIT) {
        var currentRecord = context.newRecord;
        var tranId = currentRecord.getValue({ fieldId: 'transaction' });
        log.debug("tranId", tranId);

        try {
            var purchaseOrderSearch = search.create({
                type: "invoice",
                filters: [
                    ["type", "anyof", "CustInvc"],
                    "AND",
                    ["internalid", "anyof", tranId],
                    "AND",
                    ["mainline", "is", "T"]
                ],
                columns: [
                    search.createColumn({ name: "internalid", join: "file" })
                ]
            });

            var fileArray = [];
            var searchResult = purchaseOrderSearch.run().getRange({ start: 0, end: 1000 });

            for (var i = 0; i < searchResult.length; i++) {
                var fileId = searchResult[i].getValue({ name: "internalid", join: "file" });
                if (fileId) {
                    fileArray.push(fileId);
                }
            }
            log.debug("fileArray", fileArray);

            // Add the files to the mediaitem sublist
            for (var i = 0; i < fileArray.length; i++) {
                currentRecord.selectLine({ sublistId: 'mediaitem',line: i });
                currentRecord.setCurrentSublistValue({
                    sublistId: 'mediaitem',
                    fieldId: 'mediaitem',
                    value: fileArray[i]
                });
                currentRecord.commitLine({ sublistId: 'mediaitem' });
            }
        } catch (e) {
            log.debug("BeforeLoad Catch Error", e);
        }
        //  }
    }
    return {
        beforeLoad: beforeLoad
    }
});