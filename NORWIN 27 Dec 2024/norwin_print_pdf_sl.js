/**
 *@NApiVersion 2.0
 *@NScriptType Suitelet
 */

/*************************************************************************
 * Company:    Invitra Technologies Private Limited
 * Author:     Invitra Developer
 * Script:     KNAV Print PDF SL
 * Applies To:
 *
 *
 * This script includes below functionality
 * 1) Print PDFs of 'Invoice'
 *
 * Version    Date            Author        Remarks
 * 1.01       03 Feb 2023     Developer     Initial Comment
 ***********************************************************************/

define(['N/search', 'N/runtime', 'N/record', 'N/render', 'N/file', 'N/email', 'N/redirect', './norwin_common_library.js'], function (search, runtime, record, render, file, email, redirect) {
    function onRequestPrintPDFSL(context) {
        var request = "";
        var recordType = "";
        var recordId = 0;
        var pdfTemplateId = 0;
        var pdfFileId = 0; 
       
        request = context.request;
        recordType = request.parameters.rec_type;
        recordId = request.parameters.rec_id;
        pdfTemplateId = request.parameters.templateid;
        sendEmail = request.parameters.sendEmail;
        //pdfFileId = request.parameters.fileid;

        if (recordType == 'invoice' && recordId != 0) {
            _printInvoicePdf(context, recordType, recordId, pdfTemplateId, pdfFileId, sendEmail);
        }
    }

    function _sendInvoiceEmail(recordId, recipients, pdfObj) {       
        var recipientId = 5;
        
        var scriptObj = runtime.getCurrentScript();
        var emailSenderId = scriptObj.getParameter({name: 'custscript_norwin_email_sender'});
        var emailTemplateId = scriptObj.getParameter({name: 'custscript_norwin_invoice_template'});       

        var mergeResult = render.mergeEmail({
            templateId: emailTemplateId,            
            transactionId: Number(recordId)
        });
    
        email.send({
            author: emailSenderId,
            recipients: [recipients],
            subject: mergeResult.subject,
            body: mergeResult.body,
            attachments: [pdfObj],
            relatedRecords: {
                transactionId: recordId
            }
        });

        redirect.toRecord({
            type: 'invoice',
            id: recordId,
            isEditMode: false
        });
    }

    function _printInvoicePdf(context, recordType, recordId, pdfTemplateId, pdfFileId, sendEmail) {
        var invoiceRecObj = "";
        var renderer = "";
        var xmlTemplateFile = "";
        var subsidiaryId = "";
        var subsidiaryRecObj = "";
        var pdfDetailSearchResult = "";
        var invoiceItemListResult = "";
        var locationId = "";
        var stdStateId = "";
        var subCountry = "";
        var stateId = "";
        var locationRecObj = "";
        var stateDetailsSearchResult = "";
        var gstLutBondDetailsSrchResult = "";
        var intercompanyPOSearchObj = "";
        var isIndiaSubsidiaryTrnx = false;
        var isICInvoiceFORM = false;

        invoiceRecObj = record.load({ type: recordType, id: recordId });
        log.debug("invoiceRecObj", invoiceRecObj);
        subsidiaryId = invoiceRecObj.getValue({ fieldId: 'subsidiary' });
        locationId = invoiceRecObj.getValue({ fieldId: 'location' });

        if ((subsidiaryId)) {
            subsidiaryRecObj = record.load({ type: "subsidiary", id: subsidiaryId });
            stdStateId = subsidiaryRecObj.getValue({ fieldId: 'state' });
            subCountry = subsidiaryRecObj.getValue({ fieldId: 'country' });
            log.debug({ title: "subCountry", details: subCountry });
        }

        if (subCountry == "IN") {
            isIndiaSubsidiaryTrnx = true;
        } else {
            isIndiaSubsidiaryTrnx = false;
        }

        if ((locationId)) {
            locationRecObj = record.load({ type: "location", id: locationId });
        }

        //pdfDetailSearchResult = getPdfTempleteDetail(recordType, subsidiaryId);
        invoiceItemListResult = getInvoiceItemList(recordId);
        //log.debug({title: "pdfDetailSearchResult = ", details: pdfDetailSearchResult});
        log.debug({ title: "recordType = ", details: recordType });
        log.debug({ title: "subsidiaryId = ", details: subsidiaryId });
        log.debug({ title: "invoiceItemListResult = ", details: invoiceItemListResult });

        renderer = render.create();
        renderer.addRecord({ templateName: 'record', record: invoiceRecObj });
        if ((subsidiaryRecObj)) {
        log.debug("subsidiaryRecObj",subsidiaryRecObj);
            renderer.addRecord({ templateName: 'subsidiaryrecobj', record: subsidiaryRecObj });
        }
        // if ((pdfDetailSearchResult)) {
        //     renderer.addSearchResults({templateName: 'pdfdetailsearchobj', searchResult: pdfDetailSearchResult});
        // }
        if ((invoiceItemListResult)) {
            renderer.addSearchResults({ templateName: 'invoiceitemlistsearchobj', searchResult: invoiceItemListResult });
        }

        if ((locationRecObj)) {
            renderer.addRecord({ templateName: 'locationRecObj', record: locationRecObj });
        }
        if ((gstLutBondDetailsSrchResult) && gstLutBondDetailsSrchResult.length == 1) {
            renderer.addSearchResults({ templateName: 'gstlutbonddetailsobj', searchResult: gstLutBondDetailsSrchResult });
        }
        if ((stateDetailsSearchResult)) {
            renderer.addSearchResults({ templateName: 'subStatesearchobj', searchResult: stateDetailsSearchResult });
        }
        if ((intercompanyPOSearchObj)) {
            renderer.addSearchResults({ templateName: 'intercompanyposearchobj', searchResult: intercompanyPOSearchObj });
        }

        if (Number(pdfTemplateId) != 0) {
            renderer.setTemplateById(pdfTemplateId);
            renderer.renderAsString();
        }
        // if (Number(pdfFileId) != 0) {
        //     xmlTemplateFile = file.load(pdfFileId);
        //     renderer.templateContent = xmlTemplateFile.getContents();
        // }

        var tranid = invoiceRecObj.getValue({fieldId: "tranid"});
        var pdfObj = renderer.renderAsPdf();
        pdfObj.name = tranid+".pdf";
        if(sendEmail) {
            var recipients = invoiceRecObj.getValue({fieldId: "custbody_norwin_email_recipients"});
           // pdfObj.name = tranid+".pdf";
            _sendInvoiceEmail(recordId, recipients, pdfObj);
        }
        else {
            context.response.writeFile(pdfObj, true);
        }       
    }

    function getInvoiceItemList(recordId) {
        var invoiceItemListResult = "";
        var getInvoideitemListSearchObj = "";

        if ((recordId)) {
            getInvoideitemListSearchObj = search.create({
                type: "transaction",
                filters:
                    [
                        ["internalid", "anyof", recordId],
                        "AND",
                        ["mainline", "is", "F"],
                        "AND",
                        ["taxline", "is", "F"],
                        "AND",
                        ["item", "noneof", "@NONE@"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "item", label: "Item" }),
                        search.createColumn({ name: "fxrate", label: "Item Rate" }),
                        search.createColumn({ name: "quantity", label: "Quantity" }),
                        search.createColumn({ name: "fxamount", label: "Amount (Foreign Currency)" }),
                        search.createColumn({ name: "taxamount", label: "Amount (Tax)" }),
                        search.createColumn({ name: "grossamount", label: "Amount (Gross)" }),
                        search.createColumn({ name: "memo", label: "Memo" }),
                        search.createColumn({
                            name: "formulacurrency",
                            formula: "{fxamount} + {taxamount}",
                            label: "Formula (Currency)"
                        }),
                        search.createColumn({ name: "taxcode", label: "Tax Item" }),
                        search.createColumn({
                            name: "rate",
                            join: "taxItem",
                            label: "Rate"
                        }),
                        search.createColumn({
                            name: "displayname",
                            join: "item",
                            label: "Display Name"
                        }),
                        search.createColumn({
                            name: "salesdescription",
                            join: "item",
                            label: "Description"
                        }),
                    ],
                settings: [
                    search.createSetting({
                        name: "consolidationtype",
                        value: "NONE"
                    })
                ]
            });
            invoiceItemListResult = getCompleteSearchResult(getInvoideitemListSearchObj);
        }

        return invoiceItemListResult;
    }

    function getStdStateDetailObj(stateName) {
        var stateSearchObj = "";
        var stateSearchResult = "";
        var stateFullName = "";
        var stateShortName = "";
        var stateId = "";
        var stateFilters = [];
        var stateFilters1 = [];
        var stateColumns = [];
        var returnValue = [];
        var stateSearchResultLen = 0;

        stateFilters.push(["country", "anyof", "IN"]);
        if ((stateName)) {
            stateFilters1.push(["fullname", "is", stateName]);
            stateFilters1.push("OR");
            stateFilters1.push(["shortname", "is", stateName]);

            stateFilters.push("AND");
            stateFilters.push(stateFilters1);
        }

        stateColumns.push(search.createColumn({ name: "fullname", label: "Full Name" }));
        stateColumns.push(search.createColumn({ name: "shortname", label: "Short Name" }));
        stateColumns.push(search.createColumn({ name: "id", label: "Id" }));

        stateSearchObj = search.create({ type: "state", filters: stateFilters, columns: stateColumns });

        if ((stateSearchObj)) {
            stateSearchResult = getCompleteSearchResult(stateSearchObj);
            if ((stateSearchResult)) {
                stateSearchResultLen = stateSearchResult.length;

                for (var k = 0; k < stateSearchResultLen; k++) {
                    stateFullName = stateSearchResult[k].getValue({ name: 'fullname' });
                    stateShortName = stateSearchResult[k].getValue({ name: 'shortname' });
                    stateId = stateSearchResult[k].getValue({ name: 'id' });

                    returnValue.push({ "statefullname": stateFullName, "stateshortname": stateShortName, "stateid": stateId });
                }
            }
        }

        return returnValue;
    }


    return {
        onRequest: onRequestPrintPDFSL
    };
});