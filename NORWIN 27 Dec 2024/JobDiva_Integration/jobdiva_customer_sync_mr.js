/* ******************************************************************************************
 * Company:		Invitra Technologies Pvt.Ltd
 * Author:	    Supriya Gunjal
 * FileName:    jobdiva_project_sync_mr.js
 * 
 *
 * Version    Date            Author           	  Remarks
 * 1.00       20 Nov 2023    Supriya Gunjal	     Initial Version
 *
 ********************************************************************************************/
/**
 * @NScriptType MapReduceScript
 * @NApiVersion 2.x
 */

define(['N/search', 'N/runtime', 'N/email', './jobdiva_integration_utils.js', './jobdiva_integration_lib.js', '../norwin_common_library.js'], function (search, runtime, email, utils, lib) {

    function getInputData(context) {
        log.debug("getInputData");

        var currScript = runtime.getCurrentScript();
        var fromDate = currScript.getParameter({ name: 'custscript_jd_customersync_fromdate' });
        var toDate = currScript.getParameter({ name: 'custscript_jd_customersync_todate' });

        if (!fromDate) { var fromDate = getTodaysDate(); } else { fromDate = getDateString(fromDate); }
        if (!toDate) { var toDate = getTodaysDate(); } else { toDate = getDateString(toDate); }

        log.debug("getInputData fromDate", fromDate);
        log.debug("getInputData toDate", toDate);

        //var jdResponse = utils.getJdNewApprovedBillingRecords(fromDate, toDate);
        var jdResponse = utils.getJdNewUpdatedCompanyRecords(fromDate, toDate);
        log.debug("getInputData jdResponse length " + jdResponse.data.length, jdResponse);

        return jdResponse.data;
        //return [jdResponse.data[0]];
    }


    function reduce(context) {
        try {
            var customerId = '';
            //---------------Added by abhay 09/27/2024--------------------
            var currScript = runtime.getCurrentScript();
            var sender = currScript.getParameter({ name: 'custscript_jd_email_sender' });
            var recipients = currScript.getParameter({ name: 'custscript_jd_email_recipients' });
            var emailDetails = {};
            emailDetails.sender = sender;
            emailDetails.recipients = recipients;
            log.debug("emailDetails", emailDetails);
            //-----------------------------------------------------------
            var result = JSON.parse(context.values[0]);
            log.debug("reduce result >>>", result);

            var jdCompanyId = result.COMPANYID;
            log.debug("reduce jdCompanyId", jdCompanyId);   
        
            var jdCompanyRec = utils.getJdCompanyDetail(jdCompanyId);
            var jdCompanyData = jdCompanyRec.data[0];
            log.debug("reduce jdCompanyData", jdCompanyData);   

            customerId = lib.getCustomerIdByJdCompanyId(jdCompanyId);
            jdCompanyData.nsCustomerId = customerId;

            if (!customerId) {
                var custResponseRecId = lib.createJobdivaResponseRecord(result, jdCompanyId, recordType.CUSTOMER, "jdCompanyData");
                log.debug("reduce custResponseRecId", custResponseRecId);

                try {
                    record.submitFields({
                        type: "customrecord_jd_api_response_details",
                        id: custResponseRecId,
                        values: {
                            "custrecord_jd_entity": customerId,
                            "custrecord_jd_status": processStatus.PROCESSED,
                            "custrecord_jd_error_details": ""
                        }
                    });
                } catch (e) {
                    log.error("error while updating response record", e);
                }
            }

            customerId = lib.createOrUpdateCustomer(jdCompanyData, emailDetails);
            log.debug("reduce customerId", customerId);
           
        } catch (e) {
            var errorDetails = '';
            if (e.hasOwnProperty('message')) {
                errorDetails = e.name + ': ' + e.message + '<br>' + e.stack;
                log.error('reduce - EXPECTED_ERROR', errorDetails);
                log.error('reduce - stack', e.stack);
            } else {
                errorDetails = e.toString() + '<br>' + e.stack;
                log.error('reduce - UNEXPECTED_ERROR', errorDetails);
                log.error('reduce - stack', e.stack);
            }
            context.write("error", errorDetails);
        }
    }

    function summarize(summary) {
        try {
            log.debug("Summarize Function ::", summary);
            var body = "";
            var errorObjArray = [];
            var currScript = runtime.getCurrentScript();

            // iterating key and values
            summary.output.iterator().each(function (key, value) {
                log.audit("summary", "Key: " + key + " value: " + value);
                if (key.indexOf("error") > -1) {
                    errorObjArray.push({
                        "error": key,
                        "name": value
                    });
                }
                return true;
            });

            log.debug("errorObjArray", JSON.stringify(errorObjArray));

            if (errorObjArray.length > 0) {
                body += "<b>The following list of errors occurred while JobDiva Customer Sync :</b>";
                body += "<ul>";
                for (var i = 0; i < errorObjArray.length; i++) {
                    body += "<li>" + errorObjArray[i].name + "</li>";
                }
                body += "</ul>";
                log.debug("body", body);

                email.send({
                    author: currScript.getParameter({name: 'custscript_jd_email_sender'}),
                    recipients: currScript.getParameter({name: 'custscript_jd_email_recipients'}),
                    subject: "Norwin : JobDiva Integration - Customer Sync ERROR",
                    body: body
                });                
            }
        } catch (e) {
            var msg = '';
            if (e.hasOwnProperty('message')) {
                msg = e.name + ': ' + e.message;
                log.error('summarize - EXPECTED_ERROR', msg);
                log.error('summarize - stack', e.stack);
            } else {
                msg = e.toString();
                log.error('summarize - UNEXPECTED_ERROR', msg);
                log.error('summarize - stack', e.stack);
            }
        }
    }


    return {
        getInputData: getInputData,
        reduce: reduce,
        summarize: summarize
    }
});