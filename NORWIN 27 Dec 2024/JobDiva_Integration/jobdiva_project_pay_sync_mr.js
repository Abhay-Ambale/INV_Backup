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

define(['N/search', 'N/record', 'N/runtime', 'N/email', './jobdiva_integration_utils.js', './jobdiva_integration_lib.js', '../norwin_common_library.js'], function (search, record, runtime, email, utils, lib) {

    function getInputData(context) {
        log.debug("getInputData");

        var currScript = runtime.getCurrentScript();
        var fromDate = currScript.getParameter({ name: 'custscript_jd_paysync_fromdate' });
        var toDate = currScript.getParameter({ name: 'custscript_jd_paysync_todate' });

        if (!fromDate) { var fromDate = getTodaysDate(); } else { fromDate = getDateString(fromDate); }
        if (!toDate) { var toDate = getTodaysDate(); } else { toDate = getDateString(toDate); }

        log.debug("getInputData fromDate", fromDate);
        log.debug("getInputData toDate", toDate);

        //var jdResponse = utils.getJdNewApprovedBillingRecords(fromDate, toDate);
        var jdResponse = utils.getJdNewUpdatedSalaryRecords(fromDate, toDate);
        log.debug("getInputData jdResponse length " + jdResponse.data.length, jdResponse);

        return jdResponse.data;
        //return [jdResponse.data[0]];
    }


    function reduce(context) {
        try {
            var jdPayData = JSON.parse(context.values[0]);
            log.debug("reduce jdPayData >>>", jdPayData);

            var jdCandidateId = jdPayData.EMPLOYEEID;
            var jdBillingRecId = jdPayData.RECID;
            var jdStartId = jdPayData.ACTIVITYID;
           
            log.debug("reduce jdCandidateId", jdCandidateId);
            log.debug("reduce jdBillingRecId", jdBillingRecId);
            log.debug("reduce jdStartId", jdStartId);
             
            // Employee
            var employeeId = lib.getEmployeeId(jdCandidateId);
            log.debug("reduce employeeId", employeeId);

            // Create a response record to capture the JD response history.
            var responseRecId = lib.createJobdivaResponseRecord(jdPayData, jdCandidateId + '#' + jdStartId, recordType.PROJECT, "EmployeeSalaryRecordsDetail");
            log.debug("reduce responseRecId", responseRecId);

            try {                                        
                var nsProjectDetails = lib.getProjectId(employeeId, jdCandidateId, jdPayData.RECID, jdStartId);
                log.debug("reduce nsProjectDetails", nsProjectDetails);

                if (nsProjectDetails && nsProjectDetails.length) {
                    var projectId = nsProjectDetails[0].projectId;
                    log.debug("reduce projectId", projectId);

                    var salaryRateTypeId = lib.getBillRateTypeByCode(jdPayData.SALARY_PER);
                    var salaryOvertimeRateTypeId = lib.getBillRateTypeByCode(jdPayData.OVERTIME_RATE1_PER);

                    var projectObj = record.load({ type: 'job', id: projectId, isDynamic: true });
                    
                    if (jdPayData.SALARY) projectObj.setValue({ fieldId: 'custentity_jd_pay_rates', value: jdPayData.SALARY });
                    if (jdPayData.OVERTIME_RATE1) projectObj.setValue({ fieldId: 'custentity_jd_pay_overtime_rate', value: jdPayData.OVERTIME_RATE1 });
                    if (jdPayData.ADP_FILE_NO) projectObj.setValue({ fieldId: 'custentity_jd_file', value: jdPayData.ADP_FILE_NO });
                    if (jdPayData.PAYMENT_FREQUENCY) projectObj.setText({ fieldId: 'custentity_jd_payment_frequency', text: jdPayData.PAYMENT_FREQUENCY });
                    if (jdPayData.EMPLOYMENT_CATEGORY) projectObj.setText({ fieldId: 'custentity_jd_employement_category', text: jdPayData.EMPLOYMENT_CATEGORY });
                    
                    if (salaryRateTypeId) projectObj.setValue({ fieldId: 'custentity_jd_pay_rate_type', value: salaryRateTypeId });
                    if (salaryOvertimeRateTypeId) projectObj.setValue({ fieldId: 'custentity_jd_pay_overtime_rate_type', value: salaryOvertimeRateTypeId });

                    // Contractor
                    if (jdPayData.SUBCONTRACT_COMPANYID && Number(jdPayData.SUBCONTRACT_COMPANYID) > 0) {
                        var vendCategory = '';
                        if(jdPayData.EMPLOYMENT_CATEGORY=="Subcontract"){
                            vendCategory = vendorCategory.CONSULTANT;
                        }

                        if(jdPayData.EMPLOYMENT_CATEGORY=="Independent Contractor"){
                            vendCategory = vendorCategory.INDEPENDANT_CONTRACTOR;
                        }

                        if(vendCategory) {                            
                            var contractorId = lib.getContractorId(jdPayData.SUBCONTRACT_COMPANYID, vendCategory);
                            if (contractorId) projectObj.setValue({ fieldId: 'custentity_jd_corporation', value: contractorId });
                        }
                    }
                    //
                    var id = projectObj.save();
                    log.debug('updated project id', id);   
                }                            
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

                try {
                    record.submitFields({
                        type: "customrecord_jd_api_response_details",
                        id: responseRecId,
                        values: {
                            "custrecord_jd_status": processStatus.FAILED,
                            "custrecord_jd_error_details": errorDetails
                        }
                    });
                } catch (e) {
                    log.error("error while updating response record", e);
                }
                context.write("error", errorDetails);
            }            
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