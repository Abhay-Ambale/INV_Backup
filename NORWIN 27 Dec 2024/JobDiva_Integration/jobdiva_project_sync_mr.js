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

define(['N/util','N/search', 'N/runtime', 'N/email', 'N/record','./jobdiva_integration_utils.js', './jobdiva_integration_lib.js', '../norwin_common_library.js'], function (util, search, runtime, email, record, utils, lib) {
    function getInputData(context) {
        log.debug("getInputData");

        var currScript = runtime.getCurrentScript();
        var fromDate = currScript.getParameter({ name: 'custscript_jd_projectsync_fromdate' });
        var toDate = currScript.getParameter({ name: 'custscript_jd_projectsync_todate' });

        if (!fromDate) { var fromDate = getTodaysDate(); } else { fromDate = getDateString(fromDate); }
        if (!toDate) { var toDate = getTodaysDate(); } else { toDate = getDateString(toDate); }

        log.debug("getInputData fromDate", fromDate);
        log.debug("getInputData toDate", toDate);

        //var jdResponse = utils.getJdNewApprovedBillingRecords(fromDate, toDate);
        var jdResponse = utils.getJdNewUpdatedBillingRecords(fromDate, toDate);
        log.debug("getInputData jdResponse length " + jdResponse.data.length, jdResponse);

        return jdResponse.data;
        //return [jdResponse.data[2]];
    }


    function reduce(context) {
        try {
            var employeeId = '';
            var employeeObj = '';
            var employeeName = '';
            var nsSalesRepId = '';
            var nsRecruiterId = '';


            var result = JSON.parse(context.values[0]);
            log.debug("reduce result >>>", result);

            var jdCandidateId = result.EMPLOYEEID;
            var jdBillingRecId = result.RECID;
            var jdStartId = result.ACTIVITYID;
            var approved = result.APPROVED;
            
            //---------------Added by abhay 09/27/2024--------------------
            var currScript = runtime.getCurrentScript();
            var sender = currScript.getParameter({ name: 'custscript_jd_email_sender' }); //custscript_jd_email_recipients
            var recipients = currScript.getParameter({ name: 'custscript_jd_email_recipients' });
            var emailDetails = {};            
            emailDetails.sender = sender;
            emailDetails.recipients = recipients;
            log.debug("emailDetails", emailDetails);
            //-----------------------------------------------------------
            log.debug("reduce jdCandidateId", jdCandidateId);
            log.debug("reduce jdBillingRecId", jdBillingRecId);
            log.debug("reduce jdStartId", jdStartId);
            log.debug("reduce approved", approved);

            // If Assignment is Approved process to create Project
            if (approved == 1) {
                // Employee
                employeeId = lib.getEmployeeId(jdCandidateId);

                employeeObj = record.load({ type: 'employee', id: employeeId, isDynamic: true });
                employeeName = employeeObj.getValue({ fieldId: 'entityid' });

                log.debug("reduce employeeId", employeeId);
                log.debug("reduce employeeName", employeeName);

                var jdBillingRecs = utils.getJdEmployeeBillingRecordsDetail(jdCandidateId);
                var jdBillingData = jdBillingRecs.data;
                log.debug("reduce jdBillingData", jdBillingData);
                log.debug("reduce jdBillingData length", jdBillingData.length);

                // Create a response record to capture the JD response history.
                var responseRecId = lib.createJobdivaResponseRecord(jdBillingRecs, jdCandidateId + '#' + jdStartId, recordType.PROJECT, "EmployeeBillingRecordsDetail");
                log.debug("reduce responseRecId", responseRecId);

                try {
                    for (var i = 0; i < jdBillingData.length; i++) {
                        var customerId = '';
                        var projectId = '';
                        var salesOrderId = '';
                        var action = 'create';

                        log.debug("reduce jdBillingData[i].RECID", jdBillingData[i].RECID);
                        log.debug("reduce COMPANY_ID", jdBillingData[i].COMPANY_ID);
                        log.debug("reduce COMPANY", jdBillingData[i].COMPANY[0]);

                        // Billing Data contains all recid of the employee, creates a project only against approved rec id witin given period.
                        if (jdBillingData[i].STARTID == jdStartId && jdBillingData[i].COMPANY_ID) {
                            // Check customer exist if not create new customer
                            customerId = lib.getCustomerIdByJdCompanyId(jdBillingData[i].COMPANY_ID);

                            if (!customerId) {
                                var custResponseRecId = lib.createJobdivaResponseRecord(jdBillingRecs, jdCandidateId, recordType.CUSTOMER, "EmployeeBillingRecordsDetail");
                                log.debug("reduce custResponseRecId", custResponseRecId);

                                customerId = lib.createNewCustomer(jdBillingData[i].COMPANY[0],emailDetails);
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
                            //----------Added by Abhay on 09/25/2024-------------
                            //update customer if exist
                            else{
                                customerId = lib.updateCustomerProjSync(jdBillingData[i].COMPANY[0],customerId,emailDetails);
                            }
                            //---------------------------------------------------
                            log.debug("reduce customerId", customerId);

                            // Check Project Exist
                            var nsProjectDetails = lib.getProjectId(employeeId, jdCandidateId, jdBillingData[i].RECID, jdStartId);
                            log.debug("reduce nsProjectDetails", nsProjectDetails);

                            if (nsProjectDetails && nsProjectDetails.length) {
                                projectId = nsProjectDetails[0].projectId;
                                action = 'update';
                                log.debug("reduce projectId 111", projectId);
                            }

                            // Append Billing Data with NS ids
                            jdBillingData[i].employeeName = employeeName;
                            jdBillingData[i].nsEmployeeId = employeeId;
                            jdBillingData[i].nsCustomerId = customerId;
                            jdBillingData[i].nsProjectId = projectId;

                            if(jdBillingData[i].PRIMARY_SALESPERSON) {
                                nsSalesRepId = lib.getUserId(jdBillingData[i].PRIMARY_SALESPERSON, 'salesrep');
                            }

                            if(jdBillingData[i].PRIMARY_RECRUITER) {
                                nsRecruiterId = lib.getUserId(jdBillingData[i].PRIMARY_RECRUITER, 'recruiter');
                            }

                            jdBillingData[i].nsSalesRepId = nsSalesRepId;
                            jdBillingData[i].nsRecruiterId = nsRecruiterId;
                            
                            var nsProjectType = FIXED_BID_INTERVAL; // Fixed Bid
                            //----------------------- Added by Abhay 06/12/2024 ------------------------------------
                            //++++++++++++Requirement: if jdBillingData[i].FREQUENCY then ProjectType should be Fixed Bid+++++++++++++++++
                            //id: value || 7: Milestone || 5: Whole Project || 10 : Custom
                            // if (jdBillingData[i].BILL_RATE_PER == 'H' && (jdBillingData[i].FREQUENCY != 7 && jdBillingData[i].FREQUENCY != 5)) {
                            if (jdBillingData[i].BILL_RATE_PER == 'H' && (jdBillingData[i].FREQUENCY != 7 && jdBillingData[i].FREQUENCY != 5 && jdBillingData[i].FREQUENCY != 10)) {
                                nsProjectType = TIME_AND_MATERIAL; // Time & Material
                            }
                            jdBillingData[i].nsProjectType = nsProjectType;

                            // Create or update Project
                            //For Fix bid, Interval Project Duration is mandatory and is is used as quantity in SO.
                            //Hence, a condition is added to validate the duartion before creating or updating a Fix bid, Interval Project.
                            var isValidDuration = false;
                            if(jdBillingData[i].Duration && !isNaN(jdBillingData[i].Duration) && jdBillingData[i].Duration >= 0 && jdBillingData[i].Duration !== '') {
                                isValidDuration = true;
                            }

                            var isValidVMSid = false;
                            if(jdBillingData[i].VMSID && !isNaN(jdBillingData[i].VMSID) && jdBillingData[i].VMSID >= 0 && jdBillingData[i].VMSID !== '') {
                                isValidVMSid = true;
                            }

                            var allowProjectCreate = true;
                            //-----------------Added by Abhay 25/11/2024---------------------
                            if(jdBillingData[i].nsProjectType == FIXED_BID_INTERVAL && !isValidDuration) {
                                log.debug("reduce project "+action +" aborted due to invalid duration", "projectId: "+projectId);
                                if (action=='create') {
                                    sendProjectNotCreatedMail(jdBillingData[i]);
                                }
                                allowProjectCreate = false;
                            }
                            //----------------------- Added by Abhay 06/12/2024 ------------------------------------
                            if((jdBillingData[i].FREQUENCY_LABEL).toLowerCase() == 'custom' && !isValidVMSid) {
                                log.debug("reduce project "+action +" aborted due to invalid duration", "projectId: "+projectId);
                                if (action=='create') {
                                    sendInvalidVmsIdMail(jdBillingData[i]); // if vms id is invalid send email
                                }
                                allowProjectCreate = false;
                            }
                            log.debug("reduce isValidDuration >>>>>", isValidDuration);
                            log.debug("reduce isValidVMSid >>>>>", isValidVMSid);
                            log.debug("reduce allowProjectCreate >>>>>", allowProjectCreate);

                            if(allowProjectCreate) {
                                projectId = createOrUpdateProject(jdBillingData[i], action);
                                log.debug("reduce projectId >>>>>", projectId);
                                if(projectId) {
                                    jdBillingData[i].nsProjectId = projectId;
                                }                                
                            
                                //----------------------------------------------------------------
                                // Create Sales Order only for Fixed Bid Projects
                                if(nsProjectType == FIXED_BID_INTERVAL) {
                                    action = 'create';
                                    var nsSalesOrderId = lib.getSalesOrderIdByProject(projectId);
                                    if (nsSalesOrderId) {
                                        action = 'update';
                                        jdBillingData[i].nsSalesOrderId = nsSalesOrderId;
                                    }

                                    // Create or update Sales Order
                                    salesOrderId = createOrUpdateSalesOrder(jdBillingData[i], action);
                                    log.debug("reduce salesOrderId >>>>>", salesOrderId);
                                }
                            }
                            //-------------------update employee type (Change by Abhay 16-10-2024)-------------
                            log.debug("reduce setting Emp Type after Project Creation to emp: "+employeeId, jdBillingData[i].Employment_Type);
                            var empObj = record.load({
                                            type: record.Type.EMPLOYEE,
                                            id: employeeId
                                        })
                            empObj.setText({ fieldId: 'custentity_jd_employment_type', text: jdBillingData[i].Employment_Type });
                            empObj.save();
                            //---------------------------------------------------------------------------------
                            try {
                                record.submitFields({
                                    type: "customrecord_jd_api_response_details",
                                    id: responseRecId,
                                    values: {
                                        "custrecord_jd_entity": projectId,
                                        "custrecord_jd_transaction": salesOrderId,
                                        "custrecord_jd_status": processStatus.PROCESSED,
                                        "custrecord_jd_error_details": ""
                                    }
                                });
                            } catch (e) {
                                log.error("error while updating response record", e);
                            }
                        }
                    }
                } catch (e) {
                    var errorDetails = '';
                    if (e.hasOwnProperty('message')) {
                        errorDetails = "jdStartId " + jdStartId + " " + e.name + ': ' + e.message + '<br>' + e.stack;
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
            }

        } catch (e) {
            var errorDetails = '';
            if (e.hasOwnProperty('message')) {
                errorDetails = jdStartId + ": " + e.name + ': ' + e.message + '<br>' + e.stack;
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
                body += "<b>The following list of errors occurred while JobDiva Project Sync :</b>";
                body += "<ul>";
                for (var i = 0; i < errorObjArray.length; i++) {
                    body += "<li>" + errorObjArray[i].name + "</li>";
                }
                body += "</ul>";
                log.debug("body", body);

                email.send({
                    author: currScript.getParameter({name: 'custscript_jd_email_sender'}),
                    recipients: currScript.getParameter({name: 'custscript_jd_email_recipients'}),
                    subject: "Norwin : JobDiva Integration - Project Sync ERROR",
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


    function createOrUpdateProject(jdProjectData, action) {
        var id = '';
        var projectObj = '';

        log.debug('createOrUpdateProject action ' + action, jdProjectData);
		log.debug('createOrUpdateProject action ' + action, jdProjectData);

        if (action == 'create') {
            projectObj = record.create({ type: 'job', isDynamic: true });

            projectObj.setValue({ fieldId: 'customform', value: FORMID_PROJECT });
            projectObj.setValue({ fieldId: 'parent', value: jdProjectData.nsCustomerId });
            projectObj.setValue({ fieldId: 'subsidiary', value: SUBSIDIARYID_NORWIN });
            projectObj.setValue({ fieldId: 'entitystatus', value: PROJECT_STATUS_INPROGRESS });
        }
        else {
            projectObj = record.load({ type: 'job', id: jdProjectData.nsProjectId, isDynamic: true });
        }

        // Project Name
        var projectName = jdProjectData.employeeName + ' # ' + jdProjectData.JOBDIVA_REFNO + ' # ' + jdProjectData.RECID;
        projectObj.setValue({ fieldId: 'companyname', value: projectName });

        // Project Type        
        projectObj.setValue({ fieldId: 'jobtype', value: jdProjectData.nsProjectType });

        // Bill Rate Type
        var billRateCodeId = lib.getBillRateTypeByCode(jdProjectData.BILL_RATE_PER);
        if (billRateCodeId) projectObj.setValue({ fieldId: 'custentity_jd_bill_rate_type', value: billRateCodeId });


        if (jdProjectData.START_DATE) projectObj.setValue({ fieldId: 'startdate', value: formatDateParse(jdProjectData.START_DATE) });
        if (jdProjectData.END_DATE) projectObj.setValue({ fieldId: 'enddate', value: formatDateParse(jdProjectData.END_DATE) });
        if (jdProjectData.PO.PO_NUMBER) projectObj.setValue({ fieldId: 'custentity_jd_purchase_order', value: jdProjectData.PO.PO_NUMBER });
        if (jdProjectData.COMPANY_ID) projectObj.setValue({ fieldId: 'custentity_jd_company_id', value: jdProjectData.COMPANY_ID });
        if (jdProjectData.JOBDIVA_REFNO) projectObj.setValue({ fieldId: 'custentity_jd_job_no', value: jdProjectData.JOBDIVA_REFNO });
        // projectObj.setValue({fieldId: 'custentity_jd_job_title', value: jdProjectData.ID});
        if (jdProjectData.CLIENT_CONTACT) projectObj.setValue({ fieldId: 'custentity_jd_client_contact', value: jdProjectData.CLIENT_CONTACT });
        if (jdProjectData.BILL_RATE) projectObj.setValue({ fieldId: 'custentity_jd_bill_rate', value: jdProjectData.BILL_RATE });
		if (jdProjectData.BILLING_CONTACT) projectObj.setValue({ fieldId: 'custentity_jd_billing_contact', value: jdProjectData.BILLING_CONTACT });

        if (jdProjectData.OVERTIME_RATE1) projectObj.setValue({ fieldId: 'custentity_jd_overtime_rate', value: jdProjectData.OVERTIME_RATE1 });
        if (jdProjectData.OVERTIME_RATE2) projectObj.setValue({ fieldId: 'custentity_jd_double_time', value: jdProjectData.OVERTIME_RATE2 });
        if (jdProjectData.DISCOUNT_PERCENT) projectObj.setValue({ fieldId: 'custentity_jd_discount_percent', value: jdProjectData.DISCOUNT_PERCENT });
        if (jdProjectData.NET_BILL) projectObj.setValue({ fieldId: 'custentity_jd_net_bill', value: jdProjectData.NET_BILL });
        //added by abhay (24/10/2024)
        if (jdProjectData.NET_OVERTIME) projectObj.setValue({ fieldId: 'custentity_jd_net_over_time', value: jdProjectData.NET_OVERTIME });
        if (jdProjectData.NET_DOUBLE_TIME) projectObj.setValue({ fieldId: 'custentity_jd_net_double_time', value: jdProjectData.NET_DOUBLE_TIME });

		if(jdProjectData.NET_BILL) {
			var netBillNo = jdProjectData.NET_BILL.replace("$", "");  
			var timeRate = parseFloat(netBillNo);
			if (timeRate) projectObj.setValue({ fieldId: 'custentity_jd_net_bill_rate', value: timeRate });
		}

        if (jdProjectData.BILLING_UNIT != "0") projectObj.setValue({ fieldId: 'custentity_jd_billing_unit', value: jdProjectData.BILLING_UNIT });
        if (jdProjectData.HOURS_PER_DAY) projectObj.setValue({ fieldId: 'custentity_jd_hours_per_day', value: jdProjectData.HOURS_PER_DAY });
        if (jdProjectData.HOURS_PER_HALF_DAY) projectObj.setValue({ fieldId: 'custentity_jd_hours_per_half_day', value: jdProjectData.HOURS_PER_HALF_DAY });
        if (jdProjectData.PAYMENTTERMS) projectObj.setValue({ fieldId: 'custentity_jd_payment_terms_days', value: jdProjectData.PAYMENTTERMS });
        if (jdProjectData.WEEK_ENDING != "0") projectObj.setValue({ fieldId: 'custentity_jd_week_ending', value: jdProjectData.WEEK_ENDING });

        //update by Mahesh k on 27 Dec
        if (jdProjectData.APPLY_SALES_TAX.length > 0) projectObj.setValue({ fieldId: 'custentity_jd_apply_sales_tax', value: true });
        if (jdProjectData.APPLY_SALES_TAX.length > 0) projectObj.setValue({ fieldId: 'custentity_jd_sales_tax_name', value: jdProjectData.APPLY_SALES_TAX[0].NAME });
        if (jdProjectData.APPLY_SALES_TAX.length > 0) projectObj.setValue({ fieldId: 'custentity_jd_sales_tax_rate', value: jdProjectData.APPLY_SALES_TAX[0]['RATE%'] });
       
        if (jdProjectData.EMPLOYEEID) projectObj.setValue({ fieldId: 'custentity_jd_candidate_id', value: jdProjectData.EMPLOYEEID });
        if (jdProjectData.RECID) projectObj.setValue({ fieldId: 'custentity_jd_billrec_id', value: jdProjectData.RECID });
        if (jdProjectData.STARTID) projectObj.setValue({ fieldId: 'custentity_jd_start_id', value: jdProjectData.STARTID });
        if (jdProjectData.COMPANY_ID) projectObj.setValue({ fieldId: 'custentity_norwin_employee', value: jdProjectData.nsEmployeeId });

        if (jdProjectData.WORKING_CITY) projectObj.setValue({ fieldId: 'custentity_jd_work_city', value: jdProjectData.WORKING_CITY });
        if (jdProjectData.WORKING_STATE) projectObj.setValue({ fieldId: 'custentity_jd_work_state', value: jdProjectData.WORKING_STATE });
        if (jdProjectData.nsSalesRepId) projectObj.setValue({ fieldId: 'custentity_jd_sales_person', value: jdProjectData.nsSalesRepId });
        if (jdProjectData.nsRecruiterId) projectObj.setValue({ fieldId: 'custentity_jd_recruiter', value: jdProjectData.nsRecruiterId });
        
        // List fields
        if (jdProjectData.OVERTIME_RATE1) projectObj.setText({ fieldId: 'custentity_jd_overtime', text: jdProjectData.OVERTIME });
        if (jdProjectData.OVERTIME_RATE1_PER) projectObj.setText({ fieldId: 'custentity_jd_overtime_rate_type', text: jdProjectData.OVERTIME_RATE1_PER });
        if (jdProjectData.OVERTIME_RATE2_PER) projectObj.setText({ fieldId: 'custentity_jd_double_time_type', text: jdProjectData.OVERTIME_RATE2_PER });
        //if (jdProjectData.FREQUENCY) projectObj.setText({ fieldId: 'custentity_jd_frequency', text: jdProjectData.FREQUENCY_LABEL });
        if (jdProjectData.FREQUENCY) projectObj.setValue({ fieldId: 'custentity_jd_frequency', value: jdProjectData.FREQUENCY });

        // User Fields of Jobdiva        
        if (jdProjectData.Employment_Type) projectObj.setText({ fieldId: 'custentity_jd_employment_type', text: jdProjectData.Employment_Type });
        if (jdProjectData.Loaded_cost) projectObj.setValue({ fieldId: 'custentity_jd_loaded_cost', value: jdProjectData.Loaded_cost });
        if (jdProjectData.Loaded_cost_Unit) projectObj.setText({ fieldId: 'custentity_jd_loaded_cost_unit', text: jdProjectData.Loaded_cost_Unit });
        if (jdProjectData.Duration) projectObj.setValue({ fieldId: 'custentity_jd_duration', value: parseFloat(jdProjectData.Duration) });
        if (jdProjectData.Duration_Unit) projectObj.setText({ fieldId: 'custentity_jd_duration_unit', text: jdProjectData.Duration_Unit });
        if (jdProjectData.Project_Title) projectObj.setValue({ fieldId: 'custentity_jd_project_title', value: jdProjectData.Project_Title });
        if (jdProjectData.End_Client) projectObj.setValue({ fieldId: 'custentity_jd_end_client', value: jdProjectData.End_Client });
        if (jdProjectData.Description) projectObj.setValue({ fieldId: 'custentity_jd_assignment_description', value: jdProjectData.Description });
        //if (jdProjectData.WWT_Region) projectObj.setText({ fieldId: 'custentity_jd_dell_wwt_region', text: jdProjectData.Dell / WWT_Region });

        var nsBillableItemId = getBillableItem(jdProjectData);
        if (nsBillableItemId) projectObj.setValue({ fieldId: 'custentity_norwin_billable_item', value: nsBillableItemId });

        // Address 
        var addressLineCount = projectObj.getLineCount({ sublistId: 'addressbook' });
        for (var a = Number(addressLineCount) - 1; a >= 0; a--) {
            projectObj.removeLine({ sublistId: 'addressbook', line: a, ignoreRecalc: true });
        }


        if (jdProjectData.BILLING_COUNTRY) {
            // Create a line in the Address sublist.
            projectObj.selectNewLine({ sublistId: 'addressbook' });

            // Set an optional field on the sublist line.
            projectObj.setCurrentSublistValue({ sublistId: 'addressbook', fieldId: 'label', value: 'Billing Address' });
            projectObj.setCurrentSublistValue({ sublistId: 'addressbook', fieldId: 'defaultbilling', value: true });
            var addressee = projectObj.getText('parent');
            log.debug("addressee ",addressee);
            // Create an address subrecord for the line.
            var addressSubRec = projectObj.getCurrentSublistSubrecord({ sublistId: 'addressbook', fieldId: 'addressbookaddress' });
            addressSubRec.setValue({ fieldId: 'country', value: jdProjectData.BILLING_COUNTRY });
            if (jdProjectData.BILLING_CITY) addressSubRec.setValue({ fieldId: 'city', value: jdProjectData.BILLING_CITY });
            if (jdProjectData.BILLING_STATE) addressSubRec.setValue({ fieldId: 'state', value: jdProjectData.BILLING_STATE });
            if (jdProjectData.BILLING_ZIP) addressSubRec.setValue({ fieldId: 'zip', value: jdProjectData.BILLING_ZIP });
            if (jdProjectData.BILLING_ADDRESS1) addressSubRec.setValue({ fieldId: 'addr1', value: jdProjectData.BILLING_ADDRESS1 });
            if (jdProjectData.BILLING_ADDRESS2) addressSubRec.setValue({ fieldId: 'addr2', value: jdProjectData.BILLING_ADDRESS2 });
            addressSubRec.setValue({ fieldId: 'addressee', value: addressee });
            // Save the address sublist line.
            projectObj.commitLine({ sublistId: 'addressbook' });
        }

        if (jdProjectData.WORKING_COUNTRY) {
            // Create a line in the Address sublist.
            projectObj.selectNewLine({ sublistId: 'addressbook' });

            // Set an optional field on the sublist line.
            projectObj.setCurrentSublistValue({ sublistId: 'addressbook', fieldId: 'defaultshipping', value: true });
            if (jdProjectData.WORKING_LOCATION) projectObj.setCurrentSublistValue({ sublistId: 'addressbook', fieldId: 'label', value: jdProjectData.WORKING_LOCATION });

            // Create an address subrecord for the line.
            var addressSubRec = projectObj.getCurrentSublistSubrecord({ sublistId: 'addressbook', fieldId: 'addressbookaddress' });
            addressSubRec.setValue({ fieldId: 'country', value: jdProjectData.WORKING_COUNTRY });
            if (jdProjectData.WORKING_CITY) addressSubRec.setValue({ fieldId: 'city', value: jdProjectData.WORKING_CITY });
            if (jdProjectData.WORKING_STATE) addressSubRec.setValue({ fieldId: 'state', value: jdProjectData.WORKING_STATE });
            if (jdProjectData.WORKING_ZIPCODE) addressSubRec.setValue({ fieldId: 'zip', value: jdProjectData.WORKING_ZIPCODE });
            if (jdProjectData.WORKING_ADDRESS1) addressSubRec.setValue({ fieldId: 'addr1', value: jdProjectData.WORKING_ADDRESS1 });
            if (jdProjectData.WORKING_ADDRESS2) addressSubRec.setValue({ fieldId: 'addr2', value: jdProjectData.WORKING_ADDRESS2 });

            // Save the address sublist line.
            projectObj.commitLine({ sublistId: 'addressbook' });
        }


        // SubList fields        
        var jdBillableRatesArr = jdProjectData.BILLABLE_RATES;
        log.debug('BILLABLE_RATES length ' + jdBillableRatesArr.length, jdBillableRates);

        for (var i = 0; i < jdBillableRatesArr.length; i++) {
            var jdBillableRates = jdBillableRatesArr[i];
            log.debug('jdBillableRates ' + i, jdBillableRates);
            log.debug('jdBillableRates STARTID ' + i, jdBillableRates.STARTID);

            if (jdBillableRates.STARTID) {
                var lineNumber = projectObj.findSublistLineWithValue({
                    sublistId: 'recmachcustrecord_jd_project_ref',
                    fieldId: 'custrecord_jd_start_id',
                    value: jdBillableRates.STARTID
                });

                log.debug('BILLABLE_RATES lineNumber ', lineNumber);

                if (lineNumber >= 0) {
                    projectObj.selectLine({ sublistId: 'recmachcustrecord_jd_project_ref', line: lineNumber });
                }
                else {
                    projectObj.selectNewLine({ sublistId: 'recmachcustrecord_jd_project_ref' });
                }

                if (jdBillableRates.NAME) projectObj.setCurrentSublistValue({ sublistId: 'recmachcustrecord_jd_project_ref', fieldId: 'name', value: jdBillableRates.NAME, ignoreFieldChange: true });
                if (jdBillableRates.STARTID) projectObj.setCurrentSublistValue({ sublistId: 'recmachcustrecord_jd_project_ref', fieldId: 'custrecord_jd_start_id', value: jdBillableRates.STARTID, ignoreFieldChange: true });
                if (jdBillableRates.START_DATE) projectObj.setCurrentSublistValue({ sublistId: 'recmachcustrecord_jd_project_ref', fieldId: 'custrecord_jd_start_date', value: formatDateParse(jdBillableRates.START_DATE), ignoreFieldChange: true });
                if (jdBillableRates.END_DATE) projectObj.setCurrentSublistValue({ sublistId: 'recmachcustrecord_jd_project_ref', fieldId: 'custrecord_jd_end_date', value: formatDateParse(jdBillableRates.END_DATE), ignoreFieldChange: true });
                if (jdBillableRates.BILL_RATE) projectObj.setCurrentSublistValue({ sublistId: 'recmachcustrecord_jd_project_ref', fieldId: 'custrecord_jd_bill_rate', value: jdBillableRates.BILL_RATE, ignoreFieldChange: true });
                if (jdBillableRates.BILL_RATE_PER) projectObj.setCurrentSublistValue({ sublistId: 'recmachcustrecord_jd_project_ref', fieldId: 'custrecord_jd_bill_rate_per', value: jdBillableRates.BILL_RATE_PER, ignoreFieldChange: true });
                if (jdBillableRates.BILL_RATE_OT) projectObj.setCurrentSublistValue({ sublistId: 'recmachcustrecord_jd_project_ref', fieldId: 'custrecord_jd_bill_rate_ot', value: jdBillableRates.BILL_RATE_OT, ignoreFieldChange: true });
                if (jdBillableRates.BILL_RATE_OT_PER) projectObj.setCurrentSublistValue({ sublistId: 'recmachcustrecord_jd_project_ref', fieldId: 'custrecord_jd_bill_rate_ot_per', value: jdBillableRates.BILL_RATE_OT_PER, ignoreFieldChange: true });
                if (jdBillableRates.BILL_RATE_DT) projectObj.setCurrentSublistValue({ sublistId: 'recmachcustrecord_jd_project_ref', fieldId: 'custrecord_jd_bill_rate_dt', value: jdBillableRates.BILL_RATE_DT, ignoreFieldChange: true });
                if (jdBillableRates.BILL_RATE_DT_PER) projectObj.setCurrentSublistValue({ sublistId: 'recmachcustrecord_jd_project_ref', fieldId: 'custrecord_jd_bill_rate_dt_per', value: jdBillableRates.BILL_RATE_DT_PER, ignoreFieldChange: true });
                projectObj.commitLine({ sublistId: 'recmachcustrecord_jd_project_ref' });
            }
        }

        id = projectObj.save();
        log.debug('createNewProject id', id);
        //-----------------Added by Abhay (22/11/2024)-------------------
        var duration = Number(jdProjectData.Duration);
        // Commented on 20 Dec 24 by Supriya as it not required now
        // if(jdProjectData.nsProjectType == FIXED_BID_INTERVAL && (duration <= 1 || duration > 72)){
        //     sendVerifyProjectDurationMail(jdProjectData, projectName);
        // }
        //---------------------------------------------------------------
		if (jdProjectData.BILLING_CONTACT) {
			var contactsArr = [];
			var empBillingContact = utils.getJdEmployeeBillingContactDetail(jdProjectData.EMPLOYEEID);

			if (empBillingContact && empBillingContact.data.length) {
				contactsArr = empBillingContact.data.filter(function (each) { return each.STARTID == jdProjectData.STARTID; }).map(function(obj) { return obj.ID; });
				log.debug("contactsArr", contactsArr);
			}

			log.debug("contact array", contactsArr);

			if (contactsArr && contactsArr.length) {
				var jdResponse = utils.getJdContactDetail(contactsArr);
				log.debug("Reduce jdResponse contact length " + jdResponse.data.length, jdResponse);

				try {
					createContactsOnProject(jdResponse, id);
				} catch (e) {
					log.error("error in creating billing contact", e);
				}
			}
		}

        return id;
    }

    // Sales Order create / update
    function createOrUpdateSalesOrder(jdProjectData, action) {
        var id = '';
        var salesOrderObj = '';
        var orderstatus = '';
        var invoiceCount = 0;

        log.debug('createOrUpdateSalesOrder action ' + action, jdProjectData);

        if (action == 'create') {
            salesOrderObj = record.create({ type: record.Type.SALES_ORDER, isDynamic: true });
            salesOrderObj.setValue({ fieldId: 'customform', value: FORMID_SALESORDER });
            salesOrderObj.setValue({ fieldId: 'entity', value: jdProjectData.nsProjectId, ignoreFieldChange: false });
            salesOrderObj.setValue({ fieldId: 'trandate', value: formatDateParse(jdProjectData.DATECREATED) });
            //salesOrderObj.setValue({fieldId: 'subsidiary', value: SUBSIDIARYID_NORWIN});            
        }
        else {
            salesOrderObj = record.load({ type: 'salesorder', id: jdProjectData.nsSalesOrderId, isDynamic: true });
            orderstatus = salesOrderObj.getValue({ fieldId: 'orderstatus'});
            invoiceCount = getInvoiceCount(jdProjectData.nsSalesOrderId);
        }

        // Project Id / Project Type 
        salesOrderObj.setValue({ fieldId: 'custbody_jd_project_id', value: jdProjectData.nsProjectId });             
        salesOrderObj.setValue({ fieldId: 'custbody_jd_project_type', value: jdProjectData.nsProjectType });

        // Bill Rate Type
        var billRateCodeId = lib.getBillRateTypeByCode(jdProjectData.BILL_RATE_PER);
        if (billRateCodeId) salesOrderObj.setValue({ fieldId: 'custbody_jd_bill_rate_type', value: billRateCodeId });

        if (jdProjectData.START_DATE) salesOrderObj.setValue({ fieldId: 'startdate', value: formatDateParse(jdProjectData.START_DATE) });
        if (jdProjectData.END_DATE) salesOrderObj.setValue({ fieldId: 'enddate', value: formatDateParse(jdProjectData.END_DATE) });

        // JD Fields
        if (jdProjectData.PO.PO_NUMBER) salesOrderObj.setValue({ fieldId: 'custbody_jd_purchase_order', value: jdProjectData.PO.PO_NUMBER });
        if (jdProjectData.COMPANY_ID) salesOrderObj.setValue({ fieldId: 'custbody_jd_company_id', value: jdProjectData.COMPANY_ID });
        if (jdProjectData.JOBID) salesOrderObj.setValue({ fieldId: 'custbody_jd_job_no', value: jdProjectData.JOBDIVA_REFNO });
        // salesOrderObj.setValue({fieldId: 'custentity_jd_job_title', value: jdProjectData.ID});
        if (jdProjectData.CLIENT_CONTACT) salesOrderObj.setValue({ fieldId: 'custbody_jd_client_contact', value: jdProjectData.CLIENT_CONTACT });
        if (jdProjectData.BILLING_CONTACT) salesOrderObj.setValue({ fieldId: 'custbody_jd_billing_contact', value: jdProjectData.BILLING_CONTACT });
        if (jdProjectData.BILL_RATE) salesOrderObj.setValue({ fieldId: 'custbody_jd_bill_rate', value: jdProjectData.BILL_RATE });

        if (jdProjectData.OVERTIME_RATE1) salesOrderObj.setValue({ fieldId: 'custbody_jd_overtime_rate', value: jdProjectData.OVERTIME_RATE1 });
        if (jdProjectData.OVERTIME_RATE2) salesOrderObj.setValue({ fieldId: 'custbody_jd_double_time', value: jdProjectData.OVERTIME_RATE2 });
        if (jdProjectData.DISCOUNT_PERCENT) salesOrderObj.setValue({ fieldId: 'custbody_jd_discount_percent', value: jdProjectData.DISCOUNT_PERCENT });
        if (jdProjectData.NET_BILL) salesOrderObj.setValue({ fieldId: 'custbody_jd_net_bill', value: jdProjectData.NET_BILL });
        if (jdProjectData.BILLING_UNIT != "0") salesOrderObj.setValue({ fieldId: 'custbody_jd_billing_unit', value: jdProjectData.BILLING_UNIT });

        if (jdProjectData.HOURS_PER_DAY) salesOrderObj.setValue({ fieldId: 'custbody_jd_hours_per_day', value: jdProjectData.HOURS_PER_DAY });
        if (jdProjectData.HOURS_PER_HALF_DAY) salesOrderObj.setValue({ fieldId: 'custbody_jd_hours_per_half_day', value: jdProjectData.HOURS_PER_HALF_DAY });
        if (jdProjectData.PAYMENTTERMS) salesOrderObj.setValue({ fieldId: 'custbody_jd_payment_terms_days', value: jdProjectData.PAYMENTTERMS });
        if (jdProjectData.WEEK_ENDING) salesOrderObj.setValue({ fieldId: 'custbody_jd_week_ending', value: jdProjectData.WEEK_ENDING });

        //update by Mahesh k on 27 Dec
        if (jdProjectData.APPLY_SALES_TAX.length > 0) salesOrderObj.setValue({ fieldId: 'custbody_jd_apply_sales_tax', value: true });
        if (jdProjectData.APPLY_SALES_TAX.length > 0) salesOrderObj.setValue({ fieldId: 'custbody_jd_sales_tax_name', value: jdProjectData.APPLY_SALES_TAX[0].NAME });
        if (jdProjectData.APPLY_SALES_TAX.length > 0) salesOrderObj.setValue({ fieldId: 'custbody_jd_sales_tax_rate', value: jdProjectData.APPLY_SALES_TAX[0]['RATE%'] });
        
        if (jdProjectData.WORKING_CITY) salesOrderObj.setValue({ fieldId: 'custbody_jd_work_city', value: jdProjectData.WORKING_CITY });
        if (jdProjectData.WORKING_STATE) salesOrderObj.setValue({ fieldId: 'custbody_jd_work_state', value: jdProjectData.WORKING_STATE });
        if (jdProjectData.nsSalesRepId) salesOrderObj.setValue({ fieldId: 'salesrep', value: jdProjectData.nsSalesRepId });
        if (jdProjectData.nsRecruiterId) salesOrderObj.setValue({ fieldId: 'custbody_jd_recruiter', value: jdProjectData.nsRecruiterId });

        // User Fields in JD
        if (jdProjectData.Employment_Type) salesOrderObj.setText({ fieldId: 'custbody_jd_employment_type', text: jdProjectData.Employment_Type });
        if (jdProjectData.Loaded_cost) salesOrderObj.setValue({ fieldId: 'custbody_jd_loaded_cost', value: jdProjectData.Loaded_cost });
        if (jdProjectData.Loaded_cost_Unit) salesOrderObj.setText({ fieldId: 'custbody_jd_loaded_cost_unit', text: jdProjectData.Loaded_cost_Unit });
        if (jdProjectData.Project_Title) salesOrderObj.setValue({ fieldId: 'custbody_jd_project_title', value: jdProjectData.Project_Title });
        if (jdProjectData.End_Client) salesOrderObj.setValue({ fieldId: 'custbody_jd_end_client', value: jdProjectData.End_Client });
        if (jdProjectData.Description) salesOrderObj.setValue({ fieldId: 'custbody_jd_assignment_description', value: jdProjectData.Description });
        //if (jdProjectData.WWT_Region) salesOrderObj.setText({ fieldId: 'custbody_jd_dell_wwt_region', text: jdProjectData.Dell / WWT_Region });

        if (jdProjectData.EMPLOYEEID) salesOrderObj.setValue({ fieldId: 'custbody_jd_candidate_id', value: jdProjectData.EMPLOYEEID });
        if (jdProjectData.COMPANY_ID) salesOrderObj.setValue({ fieldId: 'custbody_norwin_employee', value: jdProjectData.nsEmployeeId });
        //if(jdProjectData.RECID) salesOrderObj.setValue({fieldId: 'custentity_jd_billrec_id', value: jdProjectData.RECID});

        // List fields
        if (jdProjectData.OVERTIME_RATE1) salesOrderObj.setText({ fieldId: 'custbody_jd_overtime', text: jdProjectData.OVERTIME });
        if (jdProjectData.OVERTIME_RATE1_PER) salesOrderObj.setText({ fieldId: 'custbody_jd_overtime_rate_type', text: jdProjectData.OVERTIME_RATE1_PER });
        if (jdProjectData.OVERTIME_RATE2_PER) salesOrderObj.setText({ fieldId: 'custbody_jd_double_time_type', text: jdProjectData.OVERTIME_RATE2_PER });
        if (jdProjectData.FREQUENCY) salesOrderObj.setValue({ fieldId: 'custbody_jd_frequency', value: jdProjectData.FREQUENCY });
        //if (jdProjectData.FREQUENCY) salesOrderObj.setText({ fieldId: 'custbody_jd_frequency', text: jdProjectData.FREQUENCY_LABEL });        
        //if (jdProjectData.COMPANY_ID) salesOrderObj.setValue({ fieldId: 'custbody_norwin_employee', value: jdProjectData.nsEmployeeId });

        // Billing Address
        if (jdProjectData.BILLING_COUNTRY) {
            salesOrderObj.setValue({ fieldId: 'billaddresslist', value: null }); // Needed to override default address
            var billaddrSubrecord = salesOrderObj.getSubrecord({ fieldId: 'billingaddress' });
            // var addressee = salesOrderObj.getText('parent');
            // log.debug("addressee ",addressee)
            billaddrSubrecord.setValue({ fieldId: 'country', value: jdProjectData.BILLING_COUNTRY });
            if (jdProjectData.BILLING_CITY) billaddrSubrecord.setValue({ fieldId: 'city', value: jdProjectData.BILLING_CITY });
            if (jdProjectData.BILLING_STATE) billaddrSubrecord.setValue({ fieldId: 'state', value: jdProjectData.BILLING_STATE });
            if (jdProjectData.BILLING_ZIP) billaddrSubrecord.setValue({ fieldId: 'zip', value: jdProjectData.BILLING_ZIP });
            if (jdProjectData.BILLING_ADDRESS1) billaddrSubrecord.setValue({ fieldId: 'addr1', value: jdProjectData.BILLING_ADDRESS1 });
            if (jdProjectData.BILLING_ADDRESS2) billaddrSubrecord.setValue({ fieldId: 'addr2', value: jdProjectData.BILLING_ADDRESS2 });
            // billaddrSubrecord.setValue({ fieldId: 'addressee', value: addressee });    
        }

        // Shipping address
        if (jdProjectData.WORKING_COUNTRY) {
            salesOrderObj.setValue({ fieldId: 'shipaddresslist', value: null }); // Needed to override default address
            var shippingSubrecord = salesOrderObj.getSubrecord({ fieldId: 'shippingaddress' });

            shippingSubrecord.setValue({ fieldId: 'country', value: jdProjectData.WORKING_COUNTRY });
            if (jdProjectData.WORKING_CITY) shippingSubrecord.setValue({ fieldId: 'city', value: jdProjectData.WORKING_CITY });
            if (jdProjectData.WORKING_STATE) shippingSubrecord.setValue({ fieldId: 'state', value: jdProjectData.WORKING_STATE });
            if (jdProjectData.WORKING_ZIPCODE) shippingSubrecord.setValue({ fieldId: 'zip', value: jdProjectData.WORKING_ZIPCODE });
            if (jdProjectData.WORKING_ADDRESS1) shippingSubrecord.setValue({ fieldId: 'addr1', value: jdProjectData.WORKING_ADDRESS1 });
            if (jdProjectData.WORKING_ADDRESS2) shippingSubrecord.setValue({ fieldId: 'addr2', value: jdProjectData.WORKING_ADDRESS2 });
        }

        // if(orderstatus == "" || orderstatus == 'B' || orderstatus == 'F') {
        if(Number(invoiceCount) == 0) {    
            var itemLineCount = salesOrderObj.getLineCount({ sublistId: 'item' });
            for (var i = Number(itemLineCount) - 1; i >= 0; i--) {
                salesOrderObj.removeLine({ sublistId: 'item', line: i, ignoreRecalc: true });
            }

            // Line Items
            //var maxPeriod = lib.getBillMaxPeriod(jdProjectData.BILL_RATE_PER);
            var duration = (jdProjectData.Duration) ? jdProjectData.Duration : 1;
            // FREQUENCY = 5 = Whole Project
            if(jdProjectData.FREQUENCY == 5) {
                duration = 1;
            }

            var billRate = salesOrderObj.getValue({ fieldId: 'custbody_jd_bill_rate' });
            var netBill = salesOrderObj.getValue({ fieldId: 'custbody_jd_net_bill' });
            var timeRate = Number(billRate);
            if(netBill) {
                var netBillNo = netBill.replace("$", "");  
                timeRate = parseFloat(netBillNo);
            }
            log.debug('netBill', netBill);
            log.debug('timeRate', timeRate);
            //----------------- 12/06/2024 Abhay (If frequency == custom, overwrite rate and qty)----------------
            var lineItemRate = parseFloat(timeRate);
            var lineItemQty = Number(duration);

            if(jdProjectData.FREQUENCY==10){
                lineItemRate=Number(billRate);
                lineItemQty = Number(jdProjectData.VMSID)/lineItemRate;
            }            
            //---------------------------------------------------------------------------------------------------
            var nsBillableItemId = getBillableItem(jdProjectData);
            salesOrderObj.selectNewLine({ sublistId: 'item' });
            salesOrderObj.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: nsBillableItemId, ignoreFieldChange: false, forceSyncSourcing: true });
            salesOrderObj.setCurrentSublistValue({ sublistId: 'item', fieldId: 'price', value: -1, ignoreFieldChange: false, forceSyncSourcing: true });
            salesOrderObj.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: Number(lineItemQty), ignoreFieldChange: false, forceSyncSourcing: true });
            salesOrderObj.setCurrentSublistValue({ sublistId: 'item', fieldId: 'rate', value: Number(lineItemRate), ignoreFieldChange: false, forceSyncSourcing: true });
            salesOrderObj.setCurrentSublistValue({ sublistId: 'item', fieldId: 'taxcode', value: TAX_CODE_NORWIN, ignoreFieldChange: false, forceSyncSourcing: true });
            // Added by Mahesh K on 27 Dec
            if (jdProjectData.APPLY_SALES_TAX.length > 0) {
                salesOrderObj.setCurrentSublistValue({ sublistId: 'item', fieldId: 'taxrate1', value: jdProjectData.APPLY_SALES_TAX[0]['RATE%'], ignoreFieldChange: false, forceSyncSourcing: true });
            }
            salesOrderObj.commitLine({ sublistId: 'item' });
        }

        id = salesOrderObj.save();
        log.debug('createOrUpdateSalesOrder id', id);

        return id;
    }

    function getInvoiceCount(nsSalesOrderId){
        var invoiceCount = 0;
       if (nsSalesOrderId) {
         var invoiceSearchObj = search.create({
             type: "invoice",
             settings:[{"name":"consolidationtype","value":"ACCTTYPE"}],
             filters:
             [
                ["type","anyof","CustInvc"], 
                "AND", 
                ["createdfrom","anyof",nsSalesOrderId],
                "AND", 
                ["mainline","is","T"]
             ],
             columns:
             [
                search.createColumn({
                   name: "internalid",
                   summary: "COUNT",
                   label: "Internal ID"
                })
             ]
          });
          invoiceSearchObj.run().each(function(result){
             invoiceCount = result.getValue({name: "internalid",summary: "COUNT"})
             return true;
          });
          log.audit("invoiceCount",invoiceCount);
       }
         return invoiceCount;
    }


    function getBillableItem(jdProjectData) {
        var billableItemId = '' ;

        if(jdProjectData.nsProjectType == TIME_AND_MATERIAL) {
            billableItemId = NORWIN_ITEMS.consultingIncomeTime;
        }

        if(jdProjectData.nsProjectType == FIXED_BID_INTERVAL) {
            billableItemId = NORWIN_ITEMS.projectBasedFlat;
        }

        if(jdProjectData.Employment_Type == EMPLOYMENT_TYPE_DIRECT_HIRE) {
            billableItemId = NORWIN_ITEMS.permanantPlacementOnline;
        }

        return billableItemId;
    }


	function createContactsOnProject(jdResponse, id) {
		var contactObj = "";
		var nsContactObj = "";
		var nsContactId = "";
		var contactData = jdResponse.data;
		var existingContacts = searchContacts(contactData);
        var entityId;

		for (var i = 0 ; i < contactData.length; i++) {
            entityId = contactData[i].FIRSTNAME+" "+contactData[i].LASTNAME+" "+contactData[i].ID
			nsContactObj = existingContacts.filter(function (each) {return each.contactId == contactData[i].ID});

			if (nsContactObj && nsContactObj.length) {
				nsContactId = nsContactObj[0].nsContactId;
			}

			if (!nsContactId) {
				contactObj = record.create({type: 'contact',isDynamic: true});
			} else {
				contactObj = record.load({type: 'contact',id: nsContactId,isDynamic: true});
			}

			contactObj.setValue({fieldId: 'customform', value: FORMID_CONTACT});
			contactObj.setValue({fieldId: 'entityid', value: contactData[i].FIRSTNAME + " " + contactData[i].LASTNAME});
			contactObj.setValue({fieldId: 'custentity_jd_contact_id', value: contactData[i].ID});
			contactObj.setValue({fieldId: 'firstname', value: contactData[i].FIRSTNAME});
			contactObj.setValue({fieldId: 'lastname', value: contactData[i].LASTNAME});
			contactObj.setValue({fieldId: 'subsidiary', value: SUBSIDIARYID_NORWIN});

			if (contactData[i].hasOwnProperty("TITLE")) {
				contactObj.setValue({fieldId: 'title', value: contactData[i].TITLE});
			}

			if (contactData[i].hasOwnProperty("EMAIL")) {
				contactObj.setValue({fieldId: 'email', value: contactData[i].EMAIL});
			}
            try {
                var contactid = contactObj.save();
            } catch (error) {
                if (error.hasOwnProperty('message')) {
                    msg = error.name;
                    if (msg == 'CONTACT_ALREADY_EXISTS') {
                        contactObj.setValue({fieldId: 'autoname', value: false});
                        contactObj.setValue({fieldId: 'entityid', value: entityId});
                        var contactid = contactObj.save();
                    }
                }
                
            }
			log.debug('lib createNewContact contactid', contactid);

			if (contactid) {
				record.attach({
					record: {
						type: 'contact', 
						id: contactid
					},
					to: {
						type: 'job', 
						id: id
					}
				});
			}
		}
	}


	function searchContacts(contactData) {
		var searchResults = [];
		var defaultFilters = [];
		var returnedArray = [];
		var contactsIdArr = contactData.map(function (each) {return each.ID});
		log.debug("contactsIdArr", contactsIdArr);

		if (contactsIdArr && contactsIdArr.length) {
			defaultFilters.push(["isinactive","is","F"]);
			defaultFilters.push("AND");

			for (var i = 0 ; i < contactsIdArr.length; i++) {
				defaultFilters.push(["custentity_jd_contact_id","equalto", contactsIdArr[i]]);

				if (i != contactsIdArr.length - 1) {
					defaultFilters.push("OR");
				}
			}
			
			log.debug("defaultFilters", defaultFilters);

			var searchObj = search.create({
				type: 'contact',
				filters: defaultFilters,
				columns:
				[
					"custentity_jd_contact_id",
					"internalid"
				]
			});

			searchResults = searchObj.run().getRange(0, 999);
			log.debug('lib searchContact searchResults', searchResults);
		}

		for (var i = 0; i < searchResults.length; i++) {
			returnedArray.push({
				"contactId": searchResults[i].getValue("custentity_jd_contact_id"),
				"nsContactId": searchResults[i].getValue("internalid")
			});
		}

		log.debug('lib searchNetsuiteItems returnedArray', returnedArray);
        return returnedArray;
	}

    function sendProjectNotCreatedMail(jdProjectData){
        var currScript = runtime.getCurrentScript();
        var body = "<br>The project cannot be created because the Project Type is 'Fixed Bid, Interval,' but the Project Duration is either missing, negative, or not a valid number.</br><br>Please ensure that the duration is correctly specified in Job Diva in order to proceed with the project creation.</br><br></br><br><b>Project Details: </b></br>"
            // body += "<br><strong>Duration : </strong>"+jdProjectData.Duration +"</br><br><strong>Employee Name : </strong>"+ jdProjectData.employeeName+"</br><br><strong>Company Name : </strong> "+jdProjectData.COMPANY_NAME+"</br><br><strong>Start Date : </strong>"+jdProjectData.START_DATE+"</br>"+"<br><strong>End Date : </strong>"+ jdProjectData.END_DATE+"</br>"+"<br><strong>Start ID : </strong>"+ jdProjectData.STARTID+"</br>"
            body += '<table border="1">';
            body +='<tr><td><strong>Duration:</strong></td><td>' +jdProjectData.Duration+'</td></tr>';
            body +='<tr><td><strong>Employee Name:</strong></td><td>'+jdProjectData.employeeName+'</td></tr>';
            body +='<tr><td><strong>Company Name:</strong></td><td>'+jdProjectData.COMPANY_NAME+'</td></tr>';
            body +='<tr><td><strong>Start ID:</strong></td><td>'+jdProjectData.STARTID+'</td></tr></table>' ;
            
            body += "<br></br><br>Hope this Clarifies the Sync error.</br><br> Thank You!!</br>";
            log.debug('Project Not Created Error', body);
            email.send({
                author: currScript.getParameter({name: 'custscript_jd_email_sender'}),
                recipients: currScript.getParameter({name: 'custscript_jd_email_recipients'}),
                subject: "Norwin : JobDiva Integration - Project Sync: Project Not Created ERROR",
                body: body
            });  
    }

    function sendVerifyProjectDurationMail(jdProjectData, projectName){
        var currScript = runtime.getCurrentScript();
        var body = "<br>This project has duration value less than or greater than the expected value. This does not affect the project creation but needs to be verified. Please ensure the correct duration value.</br><br></br><br><b>Project Details: </b></br>"
        // body += "<br><strong>Project Name : </strong>"+projectName+"</br><br><strong>Employee Name : </strong>"+ jdProjectData.employeeName+"</br><br><strong>Company Name : </strong> "+jdProjectData.COMPANY_NAME+"</br><br><strong>Start Date : </strong>"+jdProjectData.START_DATE+"</br><br>"+"<strong>End Date : </strong>"+ jdProjectData.END_DATE+"</br>"+"<br><strong>Start ID : </strong>"+ jdProjectData.STARTID
        body += '<table border="1">';
        body += '<tr><td><strong>Project Name:</strong></td><td>' + projectName + '</td></tr>';
        body +='<tr><td><strong>Duration:</strong></td><td>' +jdProjectData.Duration+'</td></tr>';
        body += '<tr><td><strong>Employee Name:</strong></td><td>' + jdProjectData.employeeName + '</td></tr>';
        body += '<tr><td><strong>Company Name:</strong></td><td>' + jdProjectData.COMPANY_NAME + '</td></tr>';
        body += '<tr><td><strong>Start ID:</strong></td><td>' + jdProjectData.STARTID + '</td></tr></table>';
        body += "<br></br><br>Hope this Clarifies the Sync notification. </br><br>Thank You!!</br>";

        log.debug('Duration Value 1 - 72 Notification', body);
        email.send({
            author: currScript.getParameter({name: 'custscript_jd_email_sender'}),
            recipients: currScript.getParameter({name: 'custscript_jd_email_recipients'}),
            subject: "Norwin : JobDiva Integration - Project Sync NOTIFICATION",
            body: body
        });
    }

    function sendInvalidVmsIdMail(jdProjectData){
        var currScript = runtime.getCurrentScript();
        var body = "<br>The project cannot be created because the Project Frequency is 'Custom' but the 'VMS Id' is either missing, negative, or not a valid number.</br><br>Please ensure that the 'VMS id' is correctly specified in Job Diva in order to proceed with the project creation.</br><br></br><br><b>Project Details: </b></br>"
            // body += "<br><strong>Duration : </strong>"+jdProjectData.Duration +"</br><br><strong>Employee Name : </strong>"+ jdProjectData.employeeName+"</br><br><strong>Company Name : </strong> "+jdProjectData.COMPANY_NAME+"</br><br><strong>Start Date : </strong>"+jdProjectData.START_DATE+"</br>"+"<br><strong>End Date : </strong>"+ jdProjectData.END_DATE+"</br>"+"<br><strong>Start ID : </strong>"+ jdProjectData.STARTID+"</br>"
            body += '<table border="1">';
            body +='<tr><td><strong>VMS ID:</strong></td><td>' +jdProjectData.VMSID+'</td></tr>';
            body +='<tr><td><strong>Employee Name:</strong></td><td>'+jdProjectData.employeeName+'</td></tr>';
            body +='<tr><td><strong>Company Name:</strong></td><td>'+jdProjectData.COMPANY_NAME+'</td></tr>';
            body +='<tr><td><strong>Start ID:</strong></td><td>'+jdProjectData.STARTID+'</td></tr></table>' ;
            
            body += "<br></br><br>Hope this Clarifies the Sync error.</br><br> Thank You!!</br>";
            log.debug('Project Not Created Error', body);
            email.send({
                author: currScript.getParameter({name: 'custscript_jd_email_sender'}),
                recipients: currScript.getParameter({name: 'custscript_jd_email_recipients'}),
                subject: "Norwin : JobDiva Integration - Project Sync: Project Not Created ERROR",
                body: body
            });  
    }

    return {
        getInputData: getInputData,
        reduce: reduce,
        summarize: summarize
    }
});