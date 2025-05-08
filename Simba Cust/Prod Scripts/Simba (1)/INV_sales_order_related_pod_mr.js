/**
 * Company - Invitra Technologies Pvt.Ltd
 * Author - Bhushan khadke
 * Script - INV Sales Order POD MR
 * Applies to - 
 * 
 * 
 * This script includes below functionality
 * 1) To get IF and Invoice from sales order using saved searches . And create POD custom record from this information . 
 * 
 * 
 * 
 * Version    Date            Author           	  Remarks
 * 2.00      07/03/23   Bhushan Khadke	  
 *
 ***********************************************************************/
/** 
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
*/
define(['N/record', 'N/search', 'N/runtime', 'N/email', 'N/format'], function (record, search, runtime, email, format) {
    function getInputData(context) {

        try {
            var salesorderSearchObj = search.create({
                type: "salesorder",
                filters:
                    [
                        ["type", "anyof", "SalesOrd"],
                        "AND",
                        ["mainline", "is", "T"],
                        "AND",
                        ["trandate", "within", "1/7/2022","23/3/2023"],
                        "AND", 
                        ["status","noneof","SalesOrd:A","SalesOrd:C"]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "tranid",
                            sort: search.Sort.ASC,
                            label: "Document Number"
                        }),
                        search.createColumn({ name: "internalid", label: "Internal ID" })
                    ]
            });
            var soSearchResult = getCompleteSearchResult(salesorderSearchObj);
            return soSearchResult;
        }
        catch (e) {
            log.error({ title: "getInputData error", details: e });
        }
    }

    function map(context) {
        try {
            var searchResult = JSON.parse(context.value);
            //log.debug("map searchResult ::", searchResult);

            context.write({
                key: searchResult.id,
                value: searchResult.values
            });
        }
        catch (e) {
            log.error({ title: "Map error", details: e });
        }
    }

    function reduce(context) {
        try {
            dataset = context.values.map(JSON.parse);
            //log.debug("In reduce Dataset :", dataset);

            var soID = dataset[0].internalid[0].value;
            log.debug("In reduce Sales order Id ", soID);

            var ifwithpodDetailArr = itemfulfillmentSearch(soID);
            var invoiceArr = invoiceSearchResult(soID);

            if (invoiceArr.length > 0 && ifwithpodDetailArr.length > 0) {
                for (var k = 0; k < invoiceArr.length; k++) {
                    for (var m = 0; m < ifwithpodDetailArr.length; m++) {
                        var customRecord = record.create({
                            type: 'customrecord_inv_pod',
                        });

                        customRecord.setValue({ fieldId: "custrecord_inv_pod_invoice", value: invoiceArr[k].invoice_id });
                        customRecord.setValue({ fieldId: "custrecord_inv_pod_if", value: ifwithpodDetailArr[m].item_fullfillment_id });
                        customRecord.setValue({ fieldId: "custrecord_inv_pod", value: ifwithpodDetailArr[m].pod });

                        var customRecId = customRecord.save();
                        log.debug(" Created POD custom record ID ", customRecId);
                    }
                }
            }
        }
        catch (e) {
            log.error({ title: "reduce error", details: e });
            context.write("error", "Sales order ID " + soID + " : " + e.message);
        }
    }
    function summarize(summary) {
        var error = [];
        log.debug('summary', summary);
        summary.output.iterator().each(function (key, value) {
            if (key == "error") {
                error.push(value + '<br/>');
            }
            return true;
        });
        log.debug('summary error', error);


        if (error && error.length) {
            var subject = "Error in Sales order POD ";
            var body = '<table><tr><td>' + error.toString() + '</td></tr></table>';

            email.send({
                author: 28377,
                recipients: "supriya@invitratech.com",
                subject: subject,
                body: body
            });
        }
    }


    function getCompleteSearchResult(savedSearch) {

        try {
            var resultSet = savedSearch.run();
            //log.debug(" resultSet " + JSON.stringify(resultSet));

            var resultSubSet = null;
            var index = 0;
            var maxSearchReturn = 1000; // One Batch Size, Max 1000
            var allSearchResults = [];
            var maxResults = 10000; // Maximum no. of records , if mentioned 10 it will return only 10 records
            do {
                var start = index;
                var end = index + maxSearchReturn;
                if (maxResults && maxResults <= end) {
                    end = maxResults;
                }
                resultSubSet = resultSet.getRange(start, end);
                //log.debug("resultSubSet Length >>", resultSubSet.length);
                if (resultSubSet == null || resultSubSet.length <= 0) {
                    break;
                }

                allSearchResults = allSearchResults.concat(resultSubSet);
                index = index + resultSubSet.length;

                if (maxResults && maxResults == index) {
                    break;
                }
            }
            while (resultSubSet.length >= maxSearchReturn);
        } catch (e) {
            log.error({ title: "Error getCompleteSearchResult ", details: e });
        }

        return allSearchResults;
    }

    function itemfulfillmentSearch(soID) {
        var ifSearchResultArr = [];
        try {
            var itemfulfillmentSearchObj = search.create({
                type: "itemfulfillment",
                filters:
                    [
                        ["type", "anyof", "ItemShip"],
                        "AND",
                        ["mainline", "is", "T"],
                        "AND",
                        ["formulatext: {custbody_inv_be_pod_fileid}", "isnotempty", ""],
                        "AND",
                        ["createdfrom", "anyof", soID]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", label: "Internal ID" }),
                        search.createColumn({
                            name: "tranid",
                            sort: search.Sort.ASC,
                            label: "Document Number"
                        }),
                        search.createColumn({ name: "custbody_inv_be_pod_fileid", label: "POD By Border Express" })
                    ]
            });
            var ifSearchResult = getCompleteSearchResult(itemfulfillmentSearchObj);
            if (ifSearchResult) {
                for (var i = 0; i < ifSearchResult.length; i++) {
                    var ifID = ifSearchResult[i].getValue({ name: "internalid", label: "Internal ID" });
                    var pod = ifSearchResult[i].getValue({ name: "custbody_inv_be_pod_fileid", label: "POD By Border Express" });
                    ifSearchResultArr.push({ "item_fullfillment_id": ifID, "pod": pod });
                }
            }
            return ifSearchResultArr;

        } catch (e) {
            log.error({ title: "Error itemfulfillmentSearch ", details: e });
        }
    }

    function invoiceSearchResult(soID) {
        var invSearchResultArr = [];
        try {
            var invoiceSearchObj = search.create({
                type: "invoice",
                filters:
                    [
                        ["type", "anyof", "CustInvc"],
                        "AND",
                        ["mainline", "is", "T"],
                        "AND",
                        ["createdfrom", "anyof", soID]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", label: "Internal ID" }),
                        search.createColumn({
                            name: "tranid",
                            sort: search.Sort.ASC,
                            label: "Document Number"
                        })
                    ]
            });
            var invoiceSearchResult = getCompleteSearchResult(invoiceSearchObj);
            if (invoiceSearchResult) {
                for (var i = 0; i < invoiceSearchResult.length; i++) {
                    var invID = invoiceSearchResult[i].getValue({ name: "internalid", label: "Internal ID" });
                    invSearchResultArr.push({ "invoice_id": invID });
                }
            }
            return invSearchResultArr;
        } catch (e) {
            log.error({ title: "Error invoiceSearchResult ", details: e });
        }
    }


    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
}); 