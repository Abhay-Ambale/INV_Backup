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
 * 1.beforeLoad - check the custom email check box based on condition.
 * 2.afterSubmit - whenever custom email check box is true then get attachment file from the search and send those files and PDF as an attchment via email.
 * Version    Date            Author        Remarks
 * 1.01       07 Oct 2024     Developer     Initial commit
 *
 ***********************************************************************/
define(['N/runtime', 'N/render', 'N/search', 'N/record', 'N/file', 'N/email'], function (runtime, render, search, record, file, email) {
    function beforeSubmit(context) {
        var currentRecord = "";
        var toBeeMailed = "";

        currentRecord = context.newRecord;
        log.debug("currentRecord", currentRecord);
        log.debug("Runtime", runtime.executionContext);

        try {
            toBeeMailed = currentRecord.getValue({ fieldId: 'tobeemailed' })
            log.debug("toBeeMailed", toBeeMailed);

            if (toBeeMailed) {
                currentRecord.setValue({ fieldId: 'custbody_norwin_email_checked', value: true });
                currentRecord.setValue({ fieldId: 'tobeemailed', value: false });
            }
        } catch (error) {
            log.dbeug("Before Submit catch Error:", error);
        }
    }

    function afterSubmit(context) {
        var filesArr = [];
        var fileObjectsArr = [];
        var receipientEmail = "";
        var currentRecord = "";
        var recordId = "";
        var recordMode = "";
        var currentUserObj = "";
        var currentUserId = "";
        var emailChk = "";
        var filesId = "";
        var invPdfFile = "";
        var entityid = "";

        currentRecord = context.newRecord;
        recordId = currentRecord.id;
        recordMode = context.type.toUpperCase();
        currentUserObj = runtime.getCurrentUser();
        currentUserId = currentUserObj.id;
        var currScript = runtime.getCurrentScript();
        var emailTemplateId = currScript.getParameter({ name: 'custscript_norwin_cust_email_template' });
        

        try {
            emailChk = currentRecord.getValue({ fieldId: 'custbody_norwin_email_checked' });
            if (emailChk == true && recordId) {
                var invoiceSearchObj = search.create({
                    type: "invoice",
                    filters:
                        [
                            ["type", "anyof", "CustInvc"],
                            "AND",
                            ["internalid", "anyof", recordId],
                            "AND",
                            ["mainline", "is", "T"]
                        ],
                    columns:
                        [search.createColumn({ name: "internalid", join: "file", label: "Internal ID" })]
                });
                invoiceSearchObj.run().each(function (result) {
                    filesId = result.getValue({ name: "internalid", join: "file" });
                    if (filesId) {
                        filesArr.push(filesId)
                    }
                    return true;
                });

                // Load all files
                for (var i = 0; i < filesArr.length; i++) {
                    var loadedFile = file.load({ id: filesArr[i] });
                    fileObjectsArr.push(loadedFile);
                }

                // Generate PDF for the current invoice and push it into fileObjectsArr
                invPdfFile = render.transaction({ entityId: recordId, printMode: render.PrintMode.PDF });
                if (invPdfFile) {
                    fileObjectsArr.push(invPdfFile);
                    log.debug("fileObjectsArr", fileObjectsArr);
                }

                entityid = currentRecord.getValue({ fieldId: 'entity' });


                // calling search to get record type.
                if (entityid) {
                    var entitySearchObj = search.create({
                        type: "entity",
                        filters:
                            [["internalid", "anyof", entityid]],
                        columns:
                            [search.createColumn({ name: "formulatext", formula: "{type}", label: "Formula (Text)" })]
                    });
                    entitySearchObj.run().each(function (result) {
                        entityRecordType = result.getValue({ name: "formulatext", formula: "{type}" });
                        log.debug("entityRecordType is :", entityRecordType);
                        return true;
                    });
                }

                if (entityRecordType === 'customer') {
                    var customerSearch = search.create({
                        type: search.Type.CUSTOMER,
                        filters: [
                            ["isinactive", "is", "F"], "AND", ['internalid', 'is', entityid]
                        ],
                        columns: [search.createColumn({ name: 'email' })]
                    });

                    customerSearch.run().each(function (result) {
                        receipientEmail = result.getValue({ name: 'email' });
                        log.debug("Customer Email", receipientEmail);
                        return false;
                    });

                } else if (entityRecordType === 'Project') {
                    var projectSearch = search.create({
                        type: search.Type.JOB,
                        filters: [
                            ["isinactive", "is", "F"], "AND", ["internalid", "anyof", entityid]
                        ],
                        columns: [
                            search.createColumn({ name: "email", join: "customer", label: "Email" })
                        ]
                    });

                    projectSearch.run().each(function (result) {
                        receipientEmail = result.getValue({ name: "email", join: "customer" });
                        log.debug("Project Email", receipientEmail);
                        return false;
                    });
                }

                var loadedInvoiceRecord = record.load({type: record.Type.INVOICE, id: recordId });
                var transationId = loadedInvoiceRecord.getValue({ fieldId: 'tranid' });
                log.debug("transationId",transationId);
                //-------------------- Changes by Abhay (18 Dec 2024)----------------------------
                if (emailTemplateId) {
                    log.debug("emailTemplateId",emailTemplateId);

                    var emailTemplate = record.load({
                        type: record.Type.EMAIL_TEMPLATE,
                        id: emailTemplateId
                    });
                    var emailSubject = emailTemplate.getValue('subject');
                    var emailBody = emailTemplate.getValue('content');

                    emailSubject = emailSubject.replace('${transaction.tranId}', transationId);
                    emailBody = emailBody.replace('${transaction.tranId}', transationId);
                    log.debug("emailSubject",emailSubject);
                    log.debug("emailBody",emailBody);
                    log.debug("receipientEmail",receipientEmail);
                    
                    if (receipientEmail.length > 0) {
                        email.send({
                            author: currentUserId, 
                            recipients: receipientEmail,
                            subject: emailSubject,
                            body: emailBody,
                            attachments: fileObjectsArr,
                            relatedRecords: {
                                transactionId: recordId
                            }
                        });
                        log.debug("Email Sent Succesfully")
                    }
                }
                else{
                    log.debug("Email Template Missing","Please select email template from script parameters.");
                }
                //---------------------------------------------------------------------------------
                
            }
        } catch (error) {
            log.debug("BeforeSubmit Catch Error:", error);
        }
    }
    return {
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});