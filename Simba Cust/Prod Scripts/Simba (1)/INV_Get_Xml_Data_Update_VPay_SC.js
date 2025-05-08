/**
 * Company - Invitra Technologies Pvt.Ltd
 * Script - Read XML File
 * 
 * Version    Date            Author           	  Remarks
 * 1.00     25 Oct 2023    Chetan Sable	   Initial Development
 *
 ***********************************************************************/

/**
* @NApiVersion 2.1
* @NScriptType ScheduledScript
*/
define(['N/xml', 'N/file', 'N/runtime', 'N/search', 'N/record', 'N/action', 'N/task', 'N/render', 'N/email', 'N/format', 'N/format/i18n'], function (xml, file, runtime, search, record, action, task, render, email, format, formatted) {


    function executeGetXMLData(context) {

        try {
            var processedFileFolder = runtime.getCurrentScript().getParameter({ name: 'custscript_inv_eft_file_rep_prcessd_fldr' }); //ACK Test Processed
            log.debug('processedFileFolder', processedFileFolder);
            var processingFileFolder = runtime.getCurrentScript().getParameter({ name: 'custscript_inv_eft_file_rep_folder' }); //ACK Test
            log.debug('processingFileFolder', processingFileFolder);
            var senderIdForMail = runtime.getCurrentScript().getParameter({ name: 'custscript_inv_eft_senderid_for_mail' });
            log.debug('senderIdForMail', senderIdForMail);
            var recipientMailId = runtime.getCurrentScript().getParameter({ name: 'custscript_inv_eft_recipient_mail_id' }).split(",");
            log.debug('recipientMailId', recipientMailId);
            var emailTemplateAccept = runtime.getCurrentScript().getParameter({ name: 'custscript_inv_et_eft_payment_accept_id' });
            log.debug('emailTemplateAccept', emailTemplateAccept);
            var emailTemplateReject = runtime.getCurrentScript().getParameter({ name: 'custscript_inv_et_eft_payment_reject_id' });
            log.debug('emailTemplateReject', emailTemplateReject);


            var folderSearchObj = search.create({
                type: "folder",
                filters:
                    [
                        ["internalid", "anyof", processingFileFolder],
                        "AND",
                        ["file.filetype", "noneof", "@NONE@"]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", join: "file" }),
                        search.createColumn({ name: "filetype", join: "file" }),
                        search.createColumn({ name: "name", join: "file" })

                    ]
            });
            var searchResultCount = folderSearchObj.runPaged().count;
            log.debug("folderSearchObj result count", searchResultCount);

            folderSearchObj.run().each(function (result) {
                log.debug("result", result);
                var formattedNewDate = '';
                var newDateArrary = [];
                var vendPayStatusArr = [];
                var stsIdArr = [];
                var instdAmtArr = [];
                var reqdExctnDtArr = [];
                var eftFileAddInfo = [];
                var fileType = result.getValue({ "name": "filetype", "join": "file" });
                log.debug('fileType', fileType);
                var fileName = result.getValue({ "name": "name", "join": "file" });
                log.debug('fileName', fileName);
                var dotTxtInclude = fileName.includes(".TXT");
                log.debug("dotTxtInclude", dotTxtInclude);


                if (fileType == "XMLDOC" && !fileName.includes(".TXT")) {
                    log.debug("fileXML", fileType);

                    var fileId = result.getValue({ "name": "internalid", "join": "file" });
                    log.debug('fileId', fileId);
                    var fileObj = file.load({ id: fileId });
                    var xmlFileContent = fileObj.getContents();
                    var xmlDocument = xml.Parser.fromString({ text: xmlFileContent });


                    //-----Get the Date Value and [AddtlInfo] String Value from AddtlInf Node-----
                    var idNodeAddtlInf = xml.XPath.select({
                        node: xmlDocument,
                        xpath: '//*[local-name()="AddtlInf"]'
                    });
                    log.debug('idNodeAddtlInf', idNodeAddtlInf);

                    for (var j = 0; j < idNodeAddtlInf.length; j++) {
                        var idNodeAddInfValue = idNodeAddtlInf[j].textContent;

                        if (idNodeAddInfValue.includes("New: ")) {
                            eftFileAddInfo.push(idNodeAddInfValue)
                            log.debug('idNodeAddInfValue', idNodeAddInfValue);
                            // Define a regular expression pattern to match the new date
                            var regex = /New: (\d{4}-\d{2}-\d{2})/;
                            // exec method to extract the matched date
                            var match = regex.exec(idNodeAddInfValue);

                            if (match && match[1]) {
                                log.debug('match', match);
                                log.debug('match[1]', match[1]);
                                var newDateValue = match[1];
                                log.debug("newDateValue", newDateValue);

                                //change the date format from yyyy-mm-dd to dd/mm/yyyy 
                                var dateArray = newDateValue.split("-");
                                var rearrangedArray = [dateArray[2], dateArray[1], dateArray[0]];
                                var formattedNewDate = rearrangedArray.join("/");
                                log.debug("formattedNewDate", formattedNewDate); // dd/mm/yyyy
                                newDateArrary.push(formattedNewDate);
                            }
                        }
                    }
                    log.debug('newDateArrary', newDateArrary);


                    //Start-----Get [Status] Node Value From XML File-----
                    var idNodeStatus = xml.XPath.select({
                        node: xmlDocument,
                        xpath: '//*[local-name()="TxSts"]'
                        // xpath: '//*[local-name()="GrpSts"]'

                    });
                    log.debug('idNodeStatus', idNodeStatus);

                    for (var k = 0; k < idNodeStatus.length; k++) {
                        var idNodeStatusValue = idNodeStatus[k].textContent;
                        vendPayStatusArr.push(idNodeStatusValue);
                    }
                    log.debug('vendPayStatusArr', vendPayStatusArr);
                    //End-----Get [Status] Node Value From XML File-----



                    //Start---Get [StsId] Node Value From XML File----
                    var idNodeStsId = xml.XPath.select({
                        node: xmlDocument,
                        xpath: '//*[local-name()="StsId"]'
                    });
                    log.debug('idNodeStsId', idNodeStsId);

                    for (var k = 0; k < idNodeStsId.length; k++) {
                        var idNodeStsIdValue = idNodeStsId[k].textContent;
                        stsIdArr.push(idNodeStsIdValue);
                    }
                    log.debug('stsIdArr', stsIdArr);
                    //End---Get [StsId] Node Value From XML File----



                    //Start---Get [InstdAmt] Node Value From XML File----
                    var idNodeInstdAmt = xml.XPath.select({
                        node: xmlDocument,
                        xpath: '//*[local-name()="InstdAmt"]'
                    });
                    log.debug('idNodeInstdAmt', idNodeInstdAmt);

                    for (var k = 0; k < idNodeInstdAmt.length; k++) {
                        var instdAmtValue = idNodeInstdAmt[k].textContent;
                        instdAmtArr.push(instdAmtValue);
                    }
                    log.debug('instdAmtArr', instdAmtArr);
                    //End---Get [InstdAmt] Node Value From XML File----



                    //Start---Get [ReqdExctnDt] Node Value From XML File----
                    var idNodeReqdExctnDt = xml.XPath.select({
                        node: xmlDocument,
                        xpath: '//*[local-name()="ReqdExctnDt"]'
                    });
                    log.debug('idNodeReqdExctnDt', idNodeReqdExctnDt);

                    for (var k = 0; k < idNodeReqdExctnDt.length; k++) {
                        var reqdExctnDtValue = idNodeReqdExctnDt[k].textContent;
                        log.debug('reqdExctnDtValue', reqdExctnDtValue);

                        var dateArray1 = reqdExctnDtValue.split("-"); //2023-11-23
                        var rearrangedArray1 = [dateArray1[2], dateArray1[1], dateArray1[0]];
                        var formattedEeqdExctnDt = rearrangedArray1.join("/");
                        log.debug("formattedEeqdExctnDt", formattedEeqdExctnDt); //23/11/2023
                        reqdExctnDtArr.push(formattedEeqdExctnDt);
                    }
                    log.debug('reqdExctnDtArr', reqdExctnDtArr);
                    //End---Get [ReqdExctnDt] Node Value From XML File----



                    //Start---Get [CreDtTm] Node Value From XML File----
                    var idNodeCreDtTm = xml.XPath.select({
                        node: xmlDocument,
                        xpath: '//*[local-name()="CreDtTm"]'
                    });
                    log.debug('idNodeCreDtTm', idNodeCreDtTm);

                    var creDtTmValue = idNodeCreDtTm[0].textContent;

                    var originalCreDtTmValue = new Date(creDtTmValue);
                    var formattedCreDtTmValue = format.format({
                        value: originalCreDtTmValue,
                        type: format.Type.DATE
                    });
                    log.debug("formattedCreDtTmValue", formattedCreDtTmValue);
                    //End---Get [CreDtTm] Node Value From XML File----



                    //-----Get [VendorPaymentId] Node Value From XML File-----
                    var idNodeVP = xml.XPath.select({
                        node: xmlDocument,
                        xpath: '//*[local-name()="OrgnlEndToEndId"]'
                    });
                    log.debug("idNodeVP", idNodeVP);

                    //After Process, File Saved In processedFileFolder
                    fileObj.folder = processedFileFolder;
                    var processedXMLFileId = fileObj.save();
                    log.debug("processedXMLFileId", processedXMLFileId);

                    for (var i = 0; i < idNodeVP.length; i++) {

                        var vendPayID = idNodeVP[i].textContent;
                        log.debug('vendPayID', vendPayID);
                        log.debug('typeofVendorPayId', typeof vendPayID);

                        var objVendorPayment = record.load({
                            type: record.Type.VENDOR_PAYMENT,
                            id: vendPayID,
                            isDynamic: true,
                        });

                        var tranIdVPay = objVendorPayment.getValue('tranid');
                        var vendorId = objVendorPayment.getValue('entity');
                        var vendorPaymentStatus = objVendorPayment.getValue('status');
                        log.debug('vendorPaymentStatus', vendorPaymentStatus);
                        var fieldLookUp = search.lookupFields({
                            type: search.Type.VENDOR,
                            id: vendorId,
                            columns: ['companyname']
                        });
                        var vendorName = fieldLookUp.companyname;
                        var subsidiaryId = objVendorPayment.getValue('subsidiary');

                        var subsidiaryObj = record.load({
                            type: record.Type.SUBSIDIARY,
                            id: subsidiaryId
                        });
                        var subsidiaryName = subsidiaryObj.getValue('name');
                        var subsidiaryABN = subsidiaryObj.getValue('federalidnumber');

                        //--------------Subsidiary Save Search Start--------------------------
                        var subsidiarySearchObj = search.create({
                            type: "subsidiary",
                            filters:
                                [
                                    ["internalid", "anyof", subsidiaryId]
                                ],
                            columns: ["address1", "address2", "address3", "city", "state", "zip", "country"]
                        });
                        var searchResultCount = subsidiarySearchObj.runPaged().count;
                        log.debug("subsidiarySearchObj result count", searchResultCount);
                        subsidiarySearchObj.run().each(function (result) {
                            var subAddLine1 = result.getValue('address1');
                            var subAddLine2 = result.getValue('address2');
                            var subAddLine3 = result.getValue('address3');
                            var subCity = result.getValue('city');
                            var subState = result.getValue('state');
                            var subZip = result.getValue('zip');
                            var subCountryText = result.getText('country');
                            log.debug('subCountryText', subCountryText);


                            if (vendPayStatusArr[i] === 'ACWC' && vendorPaymentStatus == "In-Transit") {

                                //--Get StsId Node Value From XML File----
                                var stsIdValue = stsIdArr[i];
                                log.debug("stsIdValueACWC", stsIdValue);
                                //--Get StsId Node Value From XML File----

                                //--Get instdAmt Node Value From XML File----
                                var instdAmtValue = instdAmtArr[i];
                                log.debug("instdAmtValueACWC", instdAmtValue);
                                //--Get instdAmt Node Value From XML File----

                                //--Get reqdExctnDt Node Value From XML File----
                                var reqdExctnDtValue = reqdExctnDtArr[i];
                                log.debug("reqdExctnDtValueACWC", reqdExctnDtValue);
                                //--Get reqdExctnDt Node Value From XML File----

                                var emailTable = emailTableFunction(objVendorPayment);
                                log.debug('emailTable ACWC', emailTable);

                                objVendorPayment.setValue('custbody_eft_acknwldge_file', processedXMLFileId);
                                objVendorPayment.setValue('custbody_eft_file_addtlnfo', eftFileAddInfo[i]);
                                objVendorPayment.save();


                                var actionResult1 = action.execute({
                                    recordType: 'vendorpayment',
                                    id: 'confirm',
                                    params: {
                                        recordId: Number(vendPayID),
                                        trandate: newDateArrary[i],
                                        clearpayment: 'T'
                                    }
                                });
                                log.debug('actionResultACWC', actionResult1)


                                //Merge and Send Mail Function for ACCP and ACWC Status
                                var merge_email_acwc = mergeAndSendEmailFunction(emailTemplateAccept, emailTable, subsidiaryName, subAddLine1, subAddLine2, subAddLine3, subCity, subState, subZip, subCountryText, subsidiaryABN, stsIdValue, instdAmtValue, reqdExctnDtValue, formattedCreDtTmValue, senderIdForMail, vendorId, recipientMailId, vendPayID);
                                log.debug('merge_email_acwc', merge_email_acwc);

                            } else if (vendPayStatusArr[i] == 'ACCP' && vendorPaymentStatus == "In-Transit") {

                                //--Get StsId Node Value From XML File----
                                var stsIdValue = stsIdArr[i];
                                log.debug("stsIdValueACCP", stsIdValue);
                                //--Get StsId Node Value From XML File----

                                //--Get instdAmt Node Value From XML File----
                                var instdAmtValue = instdAmtArr[i];
                                log.debug("instdAmtValueACCP", instdAmtValue);
                                //--Get instdAmt Node Value From XML File----

                                //--Get reqdExctnDt Node Value From XML File----
                                var reqdExctnDtValue = reqdExctnDtArr[i];
                                log.debug("reqdExctnDtValueACCP", reqdExctnDtValue);
                                //--Get reqdExctnDt Node Value From XML File----

                                var emailTable = emailTableFunction(objVendorPayment);
                                log.debug('emailTable ACCP', emailTable);

                                objVendorPayment.setValue('custbody_eft_acknwldge_file', processedXMLFileId);
                                // objVendorPayment.setValue('custbody_eft_file_addtlnfo', eftFileAddInfo[i]);
                                var vpObjSaved = objVendorPayment.save();
                                log.debug("vpObjSaved", vpObjSaved);

                                var actionResult1 = action.execute({
                                    recordType: 'vendorpayment',
                                    id: 'confirm',
                                    params: {
                                        recordId: Number(vendPayID),
                                        clearpayment: 'T'
                                    }
                                });

                                log.debug('actionResultACCP', actionResult1);


                                //Merge and Send Mail Function for ACCP and ACWC Status
                                var merge_email_accp = mergeAndSendEmailFunction(emailTemplateAccept, emailTable, subsidiaryName, subAddLine1, subAddLine2, subAddLine3, subCity, subState, subZip, subCountryText, subsidiaryABN, stsIdValue, instdAmtValue, reqdExctnDtValue, formattedCreDtTmValue, senderIdForMail, vendorId, recipientMailId, vendPayID);
                                log.debug('merge_email_accp', merge_email_accp);

                            } else if (vendPayStatusArr[i] === 'REJC' && vendorPaymentStatus == "In-Transit") {

                                //--Get StsId Node Value From XML File----
                                var stsIdValue = stsIdArr[i];
                                log.debug("stsIdValueREJC", stsIdValue);
                                //--Get StsId Node Value From XML File----

                                //--Get instdAmt Node Value From XML File----
                                var instdAmtValue = instdAmtArr[i];
                                log.debug("instdAmtValueREJC", instdAmtValue);
                                //--Get instdAmt Node Value From XML File----

                                //--Get reqdExctnDt Node Value From XML File----
                                var reqdExctnDtValue = reqdExctnDtArr[i];
                                log.debug("reqdExctnDtValueREJC", reqdExctnDtValue);
                                //--Get reqdExctnDt Node Value From XML File----


                                //Call emailTableFunction
                                var emailTable = emailTableFunction(objVendorPayment);
                                log.debug('emailTable REJC', emailTable);

                                objVendorPayment.setValue('custbody_eft_acknwldge_file', processedXMLFileId);
                                // objVendorPayment.setValue('custbody_eft_file_addtlnfo', eftFileAddInfo[i]);
                                objVendorPayment.save();


                                var actionResult1 = action.execute({
                                    recordType: 'vendorpayment',
                                    id: 'decline',
                                    params: {
                                        recordId: Number(vendPayID)
                                    }
                                });
                                log.debug('actionResultREJC', actionResult1);


                                //Start Email Template for REJC
                                var mergeResult = render.mergeEmail({
                                    templateId: emailTemplateReject, // EFT : Billy Payment Reject
                                });
                                var emailSubject = mergeResult.subject;
                                var emailBody = mergeResult.body;
                                emailBody = emailBody.replaceAll("[EMAILTABLE]", emailTable);
                                emailBody = emailBody.replaceAll("[VENDORPAYMENT]", tranIdVPay);
                                emailBody = emailBody.replaceAll("[VENDORNAME]", vendorName);
                                emailBody = emailBody.replaceAll("[SUBSIDIARYNAME]", subsidiaryName);
                                emailBody = emailBody.replaceAll("[SUBSIDIARYADDRESSLINE1]", subAddLine1);
                                emailBody = emailBody.replaceAll("[SUBSIDIARYADDRESSLINE2]", subAddLine2);
                                emailBody = emailBody.replaceAll("[SUBSIDIARYADDRESSLINE3]", subAddLine3);
                                emailBody = emailBody.replaceAll("[SUBSIDIARYCITY]", subCity);
                                emailBody = emailBody.replaceAll("[SUBSIDIARYSTATE]", subState);
                                emailBody = emailBody.replaceAll("[SUBSIDIARYZIP]", subZip);
                                emailBody = emailBody.replaceAll("[SUBSIDIARCOUNTRY]", subCountryText);
                                emailBody = emailBody.replaceAll("[ABN]", subsidiaryABN);

                                email.send({
                                    author: senderIdForMail,
                                    recipients: recipientMailId,
                                    subject: emailSubject,
                                    body: emailBody,
                                    relatedRecords: {
                                        transactionId: vendPayID
                                    }
                                });
                                //End Email Template for REJC

                            }

                            return true;
                        });
                        //-------------Subsidiary Save Search End---------------------------

                    }

                    return false;
                } else {
                    log.debug("fileTEXT", fileType);
                    var txtFileId = result.getValue({ "name": "internalid", "join": "file" });
                    log.debug('txtFileId', txtFileId);
                    var textFileObj = file.load({ id: txtFileId });

                    //After Process, File Saved In processedFileFolder
                    textFileObj.folder = processedFileFolder;
                    var processedXMLFileId = textFileObj.save();
                    log.debug("processedXMLFileIdTEXT", processedXMLFileId);

                    return false;


                }
            });

        } catch (error) {
            log.debug('error', error);
            log.debug("error.name", error.name);
            log.debug("error.message", error.message);

            email.send({
                author: senderIdForMail,
                recipients: recipientMailId,
                subject: "Error In Script Execution",
                body: "Error In Script Execution. \n\nScript Name :  'INV Get XMLFile Data Update VPay SC'\n\nScript Id : customscript_inv_get_xml_update_vpay_sc\n\n" + "Error Name : " + error.name + "\n\n" + "Error Message : " + error.message
            });
        }

        if (searchResultCount > 1) {
            // Creates a task object for the Schedule Scripts
            // If there is more than one XML file found, it creates a new scheduled task for the same script to continue processing additional files in subsequent executions.
            var ssTask = task.create({
                taskType: task.TaskType.SCHEDULED_SCRIPT,
                scriptId: 'customscript_inv_get_xml_update_vpay_sc'
            });
            var ssTaskId = ssTask.submit();
            log.debug("ssTaskId", ssTaskId);
        }
    }


    //Function to Create EmailTable for Email.
    function emailTableFunction(objVendorPayment) {

        var billLineCount = objVendorPayment.getLineCount({
            sublistId: 'apply'
        });
        log.debug('billLineCount', billLineCount);

        var emailTable = "<table  style='border-collapse: collapse; border: 1px solid black;'>";
        emailTable += "<tr> <td style='border: 1px solid black; width: 150px;'><strong>Bill Ref</strong></td><td style='border: 1px solid black; width: 150px;'><strong>Due Date</strong></td><td style='border: 1px solid black; width: 150px;'><strong>Currency</strong></td><td style='border: 1px solid black; width: 150px;'><strong>Bill Amount</strong></td><td style='border: 1px solid black; width: 150px;'><strong>Bill Payment</strong></td></tr>";
        for (var i = 0; i < billLineCount; i++) {

            var vendorBill_OriginalDate = new Date(objVendorPayment.getSublistValue('apply', 'duedate', i));
            var vendorBill_DueDate = `${vendorBill_OriginalDate.getDate()}/${vendorBill_OriginalDate.getMonth() + 1}/${vendorBill_OriginalDate.getFullYear()}`;
            var vendorBill_Refnum = objVendorPayment.getSublistValue('apply', 'refnum', i);
            var vendorBill_OrgAmt = objVendorPayment.getSublistValue('apply', 'total', i);
            var vendorBill_Payment = objVendorPayment.getSublistValue('apply', 'amount', i);
            var vendorBill_Currency = objVendorPayment.getSublistValue('apply', 'currency', i);

            var currencyFormatted = formatted.getCurrencyFormatter({ currency: "USD" });
            var formatted_OrgAmt = currencyFormatted.format({ number: vendorBill_OrgAmt });
            log.debug('formatted_OrgAmt', formatted_OrgAmt);
            var formatted_Payment = currencyFormatted.format({ number: vendorBill_Payment });
            log.debug('formatted_Payment', formatted_Payment);


            emailTable += "<tr><td style='border: 1px solid black; width: 150px;'>" + vendorBill_Refnum + "</td><td style='border: 1px solid black; width: 150px;'>" + vendorBill_DueDate + "</td><td style='border: 1px solid black; width: 150px;'>" + vendorBill_Currency + "</td><td style='border: 1px solid black; width: 150px;'>" + formatted_OrgAmt + "</td><td style='border: 1px solid black; width: 150px;'>" + formatted_Payment + "</td></tr>";

        }

        emailTable += "</table>";

        return emailTable;

    };


    //Merge and Send Mail Function for ACCP and ACWC Status
    function mergeAndSendEmailFunction(emailTemplateAccept, emailTable, subsidiaryName, subAddLine1, subAddLine2, subAddLine3, subCity, subState, subZip, subCountryText, subsidiaryABN, stsIdValue, instdAmtValue, reqdExctnDtValue, formattedCreDtTmValue, senderIdForMail, vendorId, recipientMailId, vendPayID) {
        var mergeResult = render.mergeEmail({
            templateId: emailTemplateAccept, // EFT : Billy Payment Accept
        });
        var emailSubject = mergeResult.subject;
        var emailBody = mergeResult.body;
        emailBody = emailBody.replaceAll("[EMAILTABLE]", emailTable);
        emailBody = emailBody.replaceAll("[SUBSIDIARYNAME]", subsidiaryName);
        emailBody = emailBody.replaceAll("[SUBSIDIARYADDRESSLINE1]", subAddLine1);
        emailBody = emailBody.replaceAll("[SUBSIDIARYADDRESSLINE2]", subAddLine2);
        emailBody = emailBody.replaceAll("[SUBSIDIARYADDRESSLINE3]", subAddLine3);
        emailBody = emailBody.replaceAll("[SUBSIDIARYCITY]", subCity);
        emailBody = emailBody.replaceAll("[SUBSIDIARYSTATE]", subState);
        emailBody = emailBody.replaceAll("[SUBSIDIARYZIP]", subZip);
        emailBody = emailBody.replaceAll("[SUBSIDIARCOUNTRY]", subCountryText);
        emailBody = emailBody.replaceAll("[ABN]", subsidiaryABN);
        emailBody = emailBody.replaceAll("[STSID]", stsIdValue);
        emailBody = emailBody.replaceAll("[INSTDAMT]", instdAmtValue);
        emailBody = emailBody.replaceAll("[REQDEXCTNDT]", reqdExctnDtValue);
        emailBody = emailBody.replaceAll("[CREDTTM]", formattedCreDtTmValue);

        email.send({
            author: senderIdForMail,
            recipients: vendorId,
            bcc: recipientMailId,
            subject: emailSubject,
            body: emailBody,
            relatedRecords: {
                transactionId: vendPayID
            }

        });
    }

    return {
        execute: executeGetXMLData
    };
});