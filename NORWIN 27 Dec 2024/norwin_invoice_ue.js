/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
*//*************************************************************************
 * Company:    Invitra Technologies Private Limited
* Author:     Invitra Developer
* Script:
* Applies To: Invoice
*
*
* This script includes below functionality
*  1) Before Load
        - Redirects to Billable time if project type is Time & Material
*       - Sets Body fields from Sales Order
*       - Sets Time Rate, Tax code & Tax Rate for Billable time from time record.
*  2) Before Submit
*       - Sets formatted Invoice Duration from Billable time if aaplicable
*       - If Invoice Duration splits in 2 months set Annexure flag
*
*
* Version    Date            Author        Remarks
* 2.0       12 sept 2023     Mahesh     Initial commit
*
***********************************************************************/
define(['N/record', 'N/search', 'N/format', 'N/redirect', 'N/url', 'N/error', './norwin_common_library.js'], function (record, search, format, redirect, url, error) {
    function beforeLoad(context) {
        var tbIdArr = [];
        var emailAddress = [];
        var newRec = context.newRecord;
        var recordId = newRec.id;
        var recordMode = context.type.toUpperCase();
        var billStart = '';
        var billEnd = '';
        var entityId = '';
        var jobBillingType = '';
        var scheme = '';
        var host = '';
        var scriptParaEmail = '';
        var projectObj = '';
        var paymentTerms = '';
        var terms = '';
        var custId = '';
        var custLookUpField = '';
        var custEmail = '';
        var combinedEmails = '';
        var projectId = '';
        var contactSearchObj = '';
        var contactEmail = '';
        log.debug('context', context);

        try {
            if (recordMode == 'CREATE' || recordMode == 'EDIT') {
                scheme = 'https://';
                host = url.resolveDomain({ hostType: url.HostType.APPLICATION });
                scriptParaEmail = runtime.getCurrentScript().getParameter({ name: 'custscript_norwin_email_recipient' })
                log.debug('scriptParaEmail', scriptParaEmail);

                if (context.request) {
                    billStart = context.request.parameters.billstart;
                    billEnd = context.request.parameters.billend;
                }

                entityId = newRec.getValue({ fieldId: 'entity' });
                jobBillingType = newRec.getValue({ fieldId: 'custbody_jd_project_type' });
                log.debug("entityId >> " + entityId, "jobBillingType >> ", jobBillingType);
                projectId = newRec.getValue({ fieldId: 'custbody_jd_project_id' });

                if (entityId) {
                    projectObj = record.load({ type: "job", id: entityId, isDynamic: true });
                    log.debug("projectObj", projectObj);

                    if (projectObj) {
                        newRec.setValue({ fieldId: 'startdate', value: projectObj.getValue({ fieldId: 'startdate' }) });
                        newRec.setValue({ fieldId: 'enddate', value: projectObj.getValue({ fieldId: 'enddate' }) });
                        newRec.setValue({ fieldId: 'custbody_norwin_employee', value: projectObj.getValue({ fieldId: 'custentity_norwin_employee' }) });

                        // Set JD primary fields
                        newRec.setValue({ fieldId: 'custbody_jd_company_id', value: projectObj.getValue({ fieldId: 'custentity_jd_company_id' }) });
                        newRec.setValue({ fieldId: 'custbody_jd_project_id', value: entityId });
                        newRec.setValue({ fieldId: 'custbody_jd_project_type', value: projectObj.getValue({ fieldId: 'jobtype' }) });
                        newRec.setValue({ fieldId: 'custbody_jd_candidate_id', value: projectObj.getValue({ fieldId: 'custentity_jd_candidate_id' }) });
                        newRec.setValue({ fieldId: 'custbody_jd_norwin_customer', value: projectObj.getValue({ fieldId: 'parent' }) });
                        // Set JD other fields
                        newRec.setValue({ fieldId: 'custbody_jd_purchase_order', value: projectObj.getValue({ fieldId: 'custentity_jd_purchase_order' }) });
                        newRec.setValue({ fieldId: 'custbody_jd_job_no', value: projectObj.getValue({ fieldId: 'custentity_jd_job_no' }) });
                        //newRec.setValue({ fieldId: 'custbody_jdjob_title', value: projectObj.getValue({ fieldId: 'custbody_jdjob_title' }) });
                        newRec.setValue({ fieldId: 'custbody_jd_client_contact', value: projectObj.getValue({ fieldId: 'custentity_jd_client_contact' }) });
                        //newRec.setValue({ fieldId: 'custbody_jd_billing_contact', value: projectObj.getValue({ fieldId: 'custentity_jd_billing_contact' }) });
                        newRec.setValue({ fieldId: 'custbody_jd_bill_rate', value: projectObj.getValue({ fieldId: 'custentity_jd_bill_rate' }) });
                        newRec.setValue({ fieldId: 'custbody_jd_bill_rate_type', value: projectObj.getValue({ fieldId: 'custentity_jd_bill_rate_type' }) });
                        newRec.setValue({ fieldId: 'custbody_jd_overtime', value: projectObj.getValue({ fieldId: 'custentity_jd_overtime' }) });
                        newRec.setValue({ fieldId: 'custbody_jd_overtime_rate', value: projectObj.getValue({ fieldId: 'custentity_jd_overtime_rate' }) });
                        newRec.setValue({ fieldId: 'custbody_jd_overtime_rate_type', value: projectObj.getValue({ fieldId: 'custentity_jd_overtime_rate_type' }) });
                        newRec.setValue({ fieldId: 'custbody_jd_double_time_type', value: projectObj.getValue({ fieldId: 'custentity_jd_double_time_type' }) });
                        newRec.setValue({ fieldId: 'custbody_jd_double_time', value: projectObj.getValue({ fieldId: 'custentity_jd_double_time' }) });
                        newRec.setValue({ fieldId: 'custbody_jd_discount_percent', value: projectObj.getValue({ fieldId: 'custentity_jd_discount_percent' }) });
                        newRec.setValue({ fieldId: 'custbody_jd_net_bill', value: projectObj.getValue({ fieldId: 'custentity_jd_net_bill' }) });
                        //added by abhay (24/10/2024)
                        newRec.setValue({ fieldId: 'custbody_jd_net_over_time', value: projectObj.getValue({ fieldId: 'custentity_jd_net_over_time' }) });
                        newRec.setValue({ fieldId: 'custbody_jd_net_double_time', value: projectObj.getValue({ fieldId: 'custentity_jd_net_double_time' }) });

                        newRec.setValue({ fieldId: 'custbody_jd_net_bill_rate', value: projectObj.getValue({ fieldId: 'custentity_jd_net_bill_rate' }) });
                        newRec.setValue({ fieldId: 'custbody_jd_frequency', value: projectObj.getValue({ fieldId: 'custentity_jd_frequency' }) });
                        newRec.setValue({ fieldId: 'custbody_jd_billing_unit', value: projectObj.getValue({ fieldId: 'custentity_jd_billing_unit' }) });
                        newRec.setValue({ fieldId: 'custbody_jd_week_ending', value: projectObj.getValue({ fieldId: 'custentity_jd_week_ending' }) });
                        newRec.setValue({ fieldId: 'custbody_jd_hours_per_day', value: projectObj.getValue({ fieldId: 'custentity_jd_hours_per_day' }) });
                        newRec.setValue({ fieldId: 'custbody_jd_hours_per_half_day', value: projectObj.getValue({ fieldId: 'custentity_jd_hours_per_half_day' }) });
                        newRec.setValue({ fieldId: 'custbody_jd_payment_terms_days', value: projectObj.getValue({ fieldId: 'custentity_jd_payment_terms_days' }) });
                        // Set JD User Define Fields
                        newRec.setValue({ fieldId: 'custbody_jd_employment_type', value: projectObj.getValue({ fieldId: 'custentity_jd_employment_type' }) });
                        newRec.setValue({ fieldId: 'custbody_jd_loaded_cost', value: projectObj.getValue({ fieldId: 'custentity_jd_loaded_cost' }) });
                        newRec.setValue({ fieldId: 'custbody_jd_loaded_cost_unit', value: projectObj.getValue({ fieldId: 'custentity_jd_loaded_cost_unit' }) });
                        newRec.setValue({ fieldId: 'custbody_jd_project_title', value: projectObj.getValue({ fieldId: 'custentity_jd_project_title' }) });
                        newRec.setValue({ fieldId: 'custbody_jd_end_client', value: projectObj.getValue({ fieldId: 'custentity_jd_end_client' }) });
                        //newRec.setValue({ fieldId: 'custbody_jd_dell_wwt_region', value: projectObj.getValue({ fieldId: 'custentity_jd_dell_wwt_region' }) });
                        newRec.setValue({ fieldId: 'custbody_jd_assignment_description', value: projectObj.getValue({ fieldId: 'custentity_jd_assignment_description' }) });

                        // Added by Mahesh k on 27 Dec to set Tax on invoice record.
                        newRec.setValue({ fieldId: 'custbody_jd_apply_sales_tax', value: projectObj.getValue({ fieldId: 'custentity_jd_apply_sales_tax' }) });
                        newRec.setValue({ fieldId: 'custbody_jd_sales_tax_name', value: projectObj.getValue({ fieldId: 'custentity_jd_sales_tax_name' }) });
                        newRec.setValue({ fieldId: 'custbody_jd_sales_tax_rate', value: projectObj.getValue({ fieldId: 'custentity_jd_sales_tax_rate' }) });

                        newRec.setValue({ fieldId: 'salesrep', value: projectObj.getValue({ fieldId: 'custentity_jd_sales_person' }) });
                        newRec.setValue({ fieldId: 'custbody_jd_recruiter', value: projectObj.getValue({ fieldId: 'custentity_jd_recruiter' }) });
                        newRec.setValue({ fieldId: 'custbody_jd_work_city', value: projectObj.getValue({ fieldId: 'custentity_jd_work_city' }) });
                        newRec.setValue({ fieldId: 'custbody_jd_work_state', value: projectObj.getValue({ fieldId: 'custentity_jd_work_state' }) });
                        //business segment
                        newRec.setValue({ fieldId: 'cseg_inv_gr_bz_sg', value: projectObj.getValue({ fieldId: 'cseg_inv_gr_bz_sg' }) });

                        paymentTerms = projectObj.getValue({ fieldId: 'custentity_jd_payment_terms_days' });
                        terms = getTerms(paymentTerms);
                        log.debug("paymentTerms " + paymentTerms, "terms " + terms);
                        if (terms) newRec.setValue({ fieldId: 'terms', value: terms });
                        // added by mahesh k on 11/04/2024 to get customer email from project
                        custId = projectObj.getValue({ fieldId: 'parent' });
                        if (custId) {
                            custLookUpField = search.lookupFields({ type: search.Type.CUSTOMER, id: custId, columns: ['email'] });
                            custEmail = custLookUpField.email;
                        }

                        if (projectId) {
                            contactSearchObj = search.create({
                                type: "contact",
                                filters:
                                    [
                                        ["job.internalid", "anyof", projectId],
                                        "AND",
                                        ["isinactive", "is", "F"]
                                    ],
                                columns:
                                    [
                                        search.createColumn({ name: "internalid", join: "job", label: "Internal ID" }),
                                        search.createColumn({ name: "entityid", join: "job", label: "Name" }),
                                        search.createColumn({ name: "email", label: "Email" })
                                    ]
                            });
                            contactSearchObj.run().each(function (result) {
                                contactEmail = result.getValue({ name: 'email', label: "Email" });
                                emailAddress.push(contactEmail);
                                return true;
                            });
                        }
                        if (scriptParaEmail) {
                            emailAddress.push(scriptParaEmail);
                        }
                        if (custEmail) {
                            emailAddress.push(custEmail);
                        }

                        //combinedEmails = custEmail + ';' + scriptParaEmail + ';' + NewEmail;
                        combinedEmails = emailAddress.toString();
                        combinedEmails = combinedEmails.replace(/,/g, ';');
                        log.debug("combinedEmails", combinedEmails);
                        log.debug("combinedEmails", typeof combinedEmails);

                        if (combinedEmails) {
                            newRec.setValue({ fieldId: 'email', value: combinedEmails })
                        }
                    }

                    /* Start script to create dynamic field */
                    jobBillingType = newRec.getValue({ fieldId: 'custbody_jd_project_type' });

                    if (jobBillingType == TIME_AND_MATERIAL) {
                        if (!billStart) billStart = '';
                        if (!billEnd) billEnd = '';

                        var searchUrl_1 = scheme + host + '/app/common/search/searchresults.nl?searchtype=Time&searchid=customsearch_norwin_unbilled_time_summar&Time_CUSTOMER=' + entityId + '&Time_DATEmodi=WITHIN&Time_DATE=CUSTOM&Time_DATEfrom=' + billStart + '&Time_DATEto=' + billEnd;
                        var searchUrl_2 = scheme + host + '/app/common/search/searchresults.nl?searchtype=Time&searchid=customsearch_norwin_project_time_summary&Time_CUSTOMER=' + entityId;

                        var msgField = context.form.addField({ id: 'custpage_project_time', type: 'INLINEHTML', label: ' ' });
                        context.form.insertField({ field: msgField, nextfield: 'custbody_norwin_employee' });
                        msgField.defaultValue = '<b><a style="color:red;font-size: 13px;" target="_blank" href="' + searchUrl_1 + '">View Project\'s Unbilled Time Summary</a></b><br /><b><a style="color:green;font-size: 13px;" target="_blank" href="' + searchUrl_2 + '">View Project Time Summary</a></b>';
                    }
                    /* End script to create dynamic field */
                }

                if (jobBillingType == 1) {
                    //var entityId = newRec.getValue({ fieldId: 'entity' });
                    var searchUrl_1 = scheme + host + '/app/common/search/searchresults.nl?searchtype=Time&searchid=customsearch_norwin_project_non_billable&Time_CUSTOMER=' + entityId;
                    var msgField = context.form.addField({ id: 'custpage_project_time', type: 'INLINEHTML', label: ' ' });
                    context.form.insertField({ field: msgField, nextfield: 'memo' });
                    msgField.defaultValue = '<br /><b><a style="color:red;font-size: 13px;" target="_blank" href="' + searchUrl_1 + '">View Project\'s Non Billable Time Summary</a></b>';
                }
            }

            if (recordMode == 'CREATE' || recordMode == 'EDIT') {
                var invoiceTaxRate = newRec.getValue({ fieldId: 'custbody_jd_sales_tax_rate' });
                var billingType = newRec.getValue({ fieldId: 'custbody_jd_project_type' });
                var billRate = newRec.getValue({ fieldId: 'custbody_jd_bill_rate' });
                var netBill = newRec.getValue({ fieldId: 'custbody_jd_net_bill_rate' });
                var timeRate = Number(billRate);
                //-------------changes by abhay (17/10/2024)----------------------
                var dtRate= newRec.getValue({ fieldId: 'custbody_jd_double_time' });
                var otRate = newRec.getValue({ fieldId: 'custbody_jd_overtime_rate' });
                var netDtRate= newRec.getValue({ fieldId: 'custbody_jd_net_double_time' });
                var netOtRate = newRec.getValue({ fieldId: 'custbody_jd_net_over_time' });
                netDtRate = netDtRate.replace('$','');
                netDtRate = netDtRate.replace('/H','');

                netOtRate = netOtRate.replace('$','');
                netOtRate = netOtRate.replace('/H','');

                if(netDtRate && netDtRate !='0'){
                    dtRate = netDtRate;
                }
                if(netOtRate && netOtRate!='0'){
                    otRate = netOtRate;
                }
                var billableTimeLinesCount = newRec.getLineCount({ sublistId: 'time' });
                if (billableTimeLinesCount > 0) {
                    for (var j = 0; j < billableTimeLinesCount; j++) {                        
                        tbIdArr.push(newRec.getSublistValue({ sublistId: 'time',fieldId: 'doc',line: j}))
                    }
                }
                log.debug("tbArr", tbIdArr);
                var tbHrsTypeArr ={};
                if(tbIdArr.length >0){
                    tbHrsTypeArr = getTimeBillRate(tbIdArr);
                }
                var regularRate = Number(billRate);
                log.debug('Bill Rate Type',newRec.getValue({ fieldId: 'custbody_jd_bill_rate_type' }));
                    log.debug("Inside Net Bill loop");
                    if (netBill && netBill != '0') {
                        timeRate = parseFloat(netBill);
                    }
                    if (netBill && netBill != '0') {
                        regularRate = parseFloat(netBill);
                    }
                

                // Billable Time Bill Rate & Taxcode
                var billableTimeLinesCount = newRec.getLineCount({ sublistId: 'time' });
                log.debug("billableTimeLinesCount", billableTimeLinesCount);
                if (billableTimeLinesCount > 0) {
                    for (var j = 0; j < billableTimeLinesCount; j++) {
                        timeRate = regularRate;
                        var tbId = newRec.getSublistValue({ sublistId: 'time',fieldId: 'doc',line: j});

                        if(tbHrsTypeArr.length >0 && tbId in tbHrsTypeArr){                           
                            if(tbHrsTypeArr[tbId] =='OT_HOURS'){
                                timeRate = parseFloat(otRate);
                            }
                            else if(tbHrsTypeArr[tbId] =='DT_HOURS'){
                                timeRate = parseFloat(dtRate);
                            }
                        }
                        newRec.setSublistValue({ sublistId: 'time', fieldId: 'rate', line: j, value: timeRate});

                        newRec.setSublistValue({ sublistId: 'time', fieldId: 'taxcode', line: j, value: TAX_CODE_NORWIN});
                        if (invoiceTaxRate) {
                            newRec.setSublistValue({ sublistId: 'time', fieldId: 'taxrate1', line: j, value: invoiceTaxRate});
                        }
                    }
                }
            
                // Item Taxcode
                // Added By Mahesh K on 24 Jan 2024 to set Qty 1 if billing type is fix bid, interval(1)
                var itemLinesCount = newRec.getLineCount({ sublistId: 'item' });
                if (itemLinesCount > 0) {
                    for (var i = 0; i < itemLinesCount; i++) {
                        var rate = newRec.getSublistValue({ sublistId: 'item', fieldId: "rate", line: i });

                        newRec.setSublistValue({ sublistId: 'item', fieldId: "taxcode", line: i, value: TAX_CODE_NORWIN });
                        if (invoiceTaxRate) {
                            newRec.setSublistValue({ sublistId: 'item', fieldId: 'taxrate1', line: i, value: invoiceTaxRate });
                        }

                        if (recordMode == 'CREATE' && billingType == 1) {
                            newRec.setSublistValue({ sublistId: 'item', fieldId: "quantity", line: i, value: '1' });
                            newRec.setSublistValue({ sublistId: 'item', fieldId: "amount", line: i, value: rate });
                        }
                    }
                }
                //Billable Expenses Taxcode
                var expenseLinesCount = newRec.getLineCount({ sublistId: 'expcost' });
                if (expenseLinesCount > 0) {
                    for (var e = 0; e < expenseLinesCount; e++) {
                        newRec.setSublistValue({ sublistId: 'expcost', fieldId: "taxcode", line: e, value: TAX_CODE_NORWIN });
                        if (invoiceTaxRate) {
                            newRec.setSublistValue({ sublistId: 'expcost', fieldId: 'taxrate1', line: e, value: invoiceTaxRate });
                        }
                    }
                }
            }
			
			if (recordMode == "CREATE") {
				var searchResult = [];
				var subsidiary = newRec.getValue("subsidiary");
				log.debug("subsidiary", subsidiary);

				if (subsidiary) {
					var bank_detailsSearchObj = search.create({
						type: "customrecord_accscient_bank_details",
						filters:
						[
							["custrecord_accscient_subsidiary","anyof",subsidiary],
							"AND",
							["isinactive","is","F"]
						],
						columns:
						[
							"name",
							"custrecord_accscient_bank_details",
							"custrecord_accscient_remit_payments_to",
							"custrecord_accscient_subsidiary"
						]
					});

					var searchResultCount = bank_detailsSearchObj.runPaged().count;
					log.debug("bank_detailsSearchObj result count",searchResultCount);

					bank_detailsSearchObj.run().each(function(result){
						searchResult.push(result);
						return true;
					});

					if (searchResultCount == 1) {
						newRec.setValue({ fieldId: 'custbody_accscient_bank_name', value: searchResult[0].id });
					}
				}
			}

            // View : Print Button
            // if (recordMode == 'VIEW') {
            //     var formObj = context.form;
            //     var currentRecord = context.newRecord;
            //     var recordType = currentRecord.type;
            //     var recordId = currentRecord.id;
            //     var emailRecipients = currentRecord.getValue({ fieldId: 'custbody_norwin_email_recipients' });

            //     var slUrl = url.resolveScript({ scriptId: 'customscript_norwin_invoice_pdf_sl', deploymentId: 'customdeploy_norwin_invoice_pdf_sl', params: { "rec_type": recordType, "rec_id": recordId, "templateid": PDF_TEMPLATEID_INVOICE }, returnExternalUrl: false });
            //     var emailslUrl = url.resolveScript({ scriptId: 'customscript_norwin_invoice_pdf_sl', deploymentId: 'customdeploy_norwin_invoice_pdf_sl', params: { "rec_type": recordType, "rec_id": recordId, "templateid": PDF_TEMPLATEID_INVOICE, "sendEmail": true }, returnExternalUrl: false });

            //     formObj.clientScriptModulePath = './norwin_invoice_cs.js';
            //     formObj.addButton({ id: 'custpage_print_pdf', label: "Print PDF", functionName: 'onClickPrintPdf(\'' + slUrl + '\')' });
            //     formObj.addButton({ id: 'custpage_email_pdf', label: "Email PDF", functionName: 'onClickSendEmail(\'' + emailRecipients + '\',\'' + emailslUrl + '\')' });
            // }
        } catch (error) {
            log.error('Error ocurred', error);
        }
    }


    function beforeSubmit(context) {
        var newRec = context.newRecord;
        var recordId = newRec.id;
        var recordMode = context.type.toUpperCase();

        log.debug('beforeSubmit context: ', context);

        try {
            if (recordMode == 'CREATE' || recordMode == 'EDIT') {
              
                var jdProjectType = newRec.getValue({ fieldId: 'custbody_jd_project_type' });

                // Fixed Bid Invoice
                if (jdProjectType == 1) {
                    newRec.setValue({ fieldId: 'custbody_norwin_invoice_type', value: 3 }); // Item = 3
                    // TODO : Validation for Invoice duration exist

                    log.debug(">>> custbody_norwin_inv_duration_startdate", newRec.getValue({ fieldId: 'custbody_norwin_inv_duration_startdate' }));
                    log.debug("custbody_norwin_inv_duration_enddate", newRec.getValue({ fieldId: 'custbody_norwin_inv_duration_enddate' }));
                }

                // Billable Time
                var billableTimeLinesCount = newRec.getLineCount({ sublistId: 'time' });
                if (billableTimeLinesCount > 0) {
                    var annexureDetail = "";
                    var newDateArr = [];

                    for (var i = 0; i < billableTimeLinesCount; i++) {
                        var apply = newRec.getSublistValue({ sublistId: 'time', fieldId: "apply", line: i });
                        var rate = newRec.getSublistValue({ sublistId: 'time', fieldId: "rate", line: i });
                        var quantity = newRec.getSublistValue({ sublistId: 'time', fieldId: "qty", line: i });
                        var amount = newRec.getSublistValue({ sublistId: 'time', fieldId: "amount", line: i });
                        var tbDate = newRec.getSublistValue({ sublistId: 'time', fieldId: "billeddate", line: i });
                        var newtbDate = format.format({ value: tbDate, type: format.Type.DATE });

                        if (apply == true) {
                            newDateArr.push(newtbDate);
                            annexureDetail += "<tr><td>" + newtbDate + "</td> <td align='right'>" + quantity + "</td> <td align='right'>$" + Number(rate) + "</td> <td align='right'>$" + Number(amount) + "</td></tr>"
                        }
                    }

                    newDateArr.sort(function (a, b) {
                        var dateA = new Date(a);
                        var dateB = new Date(b);
                        return dateA - dateB;
                    });
                    //log.debug("Time - newDateArr after sort is", newDateArr);

                    if (newDateArr.length > 0) {
                        var startDate = newDateArr[0];
                        var endDate = newDateArr[newDateArr.length - 1];
                        //log.debug(" annexureDetail is", annexureDetail);

                        var anxReqValue = newRec.getValue({ fieldId: 'custbody_norwin_annexure_required' });
                        log.debug(" anxReqValue is", anxReqValue);
                        if (!anxReqValue) {
                            var annexureRequire = check2MonthsExist(startDate, endDate);
                            log.debug(" anxReqValue is 2", anxReqValue);
                            newRec.setValue({ fieldId: 'custbody_norwin_annexure_required', value: annexureRequire, ignoreFieldChange: true });
                        }

                        newRec.setValue({ fieldId: 'custbody_norwin_invoice_type', value: 1 }); // Time = 1                       
                        newRec.setValue({ fieldId: 'custbody_norwin_inv_duration_startdate', value: format.parse({ value: startDate, type: format.Type.DATE }), ignoreFieldChange: true });
                        newRec.setValue({ fieldId: 'custbody_norwin_inv_duration_enddate', value: format.parse({ value: endDate, type: format.Type.DATE }), ignoreFieldChange: true });

                        if (annexureDetail) {
                            var annexure = "";
                            annexure += "<table border='1' style='width: 55%; margin-top: 5px;'>";
                            annexure += "<tr><th align='left'>Date</th>";
                            annexure += "<th align='center'>Hours</th>";
                            annexure += "<th align='center'>Rate</th>";
                            annexure += "<th align='center'>Amount</th></tr>";
                            annexure += annexureDetail;
                            annexure += "</table>";

                            newRec.setValue({ fieldId: 'custbody_norwin_annexure', value: annexure });
                        }
                    }
                }

                // Billable Expense
                var expLinesCount = newRec.getLineCount({ sublistId: 'expcost' });
                if (expLinesCount > 0) {
                    var annexureDetail = "";
                    var newDateArr = [];

                    for (var e = 0; e < expLinesCount; e++) {
                        var apply = newRec.getSublistValue({ sublistId: 'expcost', fieldId: "apply", line: e });
                        var memo = newRec.getSublistValue({ sublistId: 'expcost', fieldId: "memo", line: e });
                        var amount = newRec.getSublistValue({ sublistId: 'expcost', fieldId: "amount", line: e });

                        var billedDate = newRec.getSublistValue({ sublistId: 'expcost', fieldId: "billeddate", line: e });
                        var billedDateFormatted = format.format({ value: billedDate, type: format.Type.DATE });

                        if (apply == true) {
                            newDateArr.push(billedDateFormatted);
                            annexureDetail += "<tr><td>" + billedDateFormatted + "</td> <td align='left'>" + memo + "</td> <td align='right'>$" + Number(amount) + "</td></tr>"
                        }
                    }

                    newDateArr.sort(function (a, b) {
                        var dateA = new Date(a);
                        var dateB = new Date(b);
                        return dateA - dateB;
                    });
                    //log.debug("annexureDetail", annexureDetail);
                    //log.debug("Expense date - newDateArr after sort is", newDateArr);

                    if (newDateArr.length > 0) {
                        var startDate = newDateArr[0];
                        var endDate = newDateArr[newDateArr.length - 1];

                        newRec.setValue({ fieldId: 'custbody_norwin_invoice_type', value: 2 }); // Expense = 2
                        newRec.setValue({ fieldId: 'custbody_norwin_inv_duration_startdate', value: format.parse({ value: startDate, type: format.Type.DATE }), ignoreFieldChange: true });
                        newRec.setValue({ fieldId: 'custbody_norwin_inv_duration_enddate', value: format.parse({ value: endDate, type: format.Type.DATE }), ignoreFieldChange: true });
                        newRec.setValue({ fieldId: 'custbody_norwin_annexure_required', value: true, ignoreFieldChange: true });


                        if (annexureDetail) {
                            var annexure = "";
                            annexure += "<table border='1' style='width: 55%; margin-top: 5px;'>";
                            annexure += "<tr><th align='left'>Date</th>";
                            annexure += "<th align='center'>Category</th>";
                            annexure += "<th align='right'>Amount</th></tr>";
                            annexure += annexureDetail;
                            annexure += "</table>";

                            newRec.setValue({ fieldId: 'custbody_norwin_annexure', value: annexure });
                        }
                    }
                }
            }
            // -------------- added by prathmesh 02/08/2024 ---------
            if (recordMode == 'CREATE' || recordMode == 'EDIT') {
                // set norwin customer address as a billing address on invoice
                var norwinCustomerId = newRec.getValue('custbody_jd_norwin_customer');
                log.debug("customerId ",norwinCustomerId);
                var norwinCustAddr='';

                //saved search for billingaddress
                var entitySearchObj = search.create({
                    type: "entity",
                    filters:
                    [
                       ["internalid","anyof",norwinCustomerId], 
                       "AND", 
                       ["isdefaultbilling","is","T"]
                    ],
                    columns:
                    [
                       search.createColumn({name: "internalid", label: "Internal ID"}),
                       search.createColumn({name: "address", label: "Address"})
                    ]
                 });
                 entitySearchObj.run().each(function(result){
                    norwinCustAddr= result.getValue('address');
                    return true;
                 });
                 
                // var customerRecObj = record.load({type:record.Type.CUSTOMER, id: norwinCustomerId})
                // var norwinCustAddr = customerRecObj.getValue('defaultaddress');
                newRec.setValue({fieldId:'billaddress', value: norwinCustAddr});
                log.debug("newAdrr ",newRec.getValue('billaddress'));

                // get po number from project & set it in the PO#(otherrefnum) field of invoice
                var projectId = newRec.getValue('custbody_jd_project_id');
                if(projectId){
                    var projectRecOjb = record.load({type:'job',id:projectId});
                    var projectStartDate = format.format({value:projectRecOjb.getValue('startdate'), type: format.Type.DATE});
                    var prjEndDate = projectRecOjb.getValue('enddate');
                    var projectEndDate;
                    if(prjEndDate){
                        projectEndDate=format.format({value:prjEndDate, type: format.Type.DATE});
                    }                    
                    var poNumber = getPoNumber(projectId, projectStartDate, projectEndDate);
                    if (poNumber == '') {
                        poNumber = projectRecOjb.getValue('custentity_jd_purchase_order');
                    }
                    
                    log.debug("poNumber ",poNumber);
                    if(poNumber) {
                        newRec.setValue({fieldId:'otherrefnum', value:poNumber});
                    } else {
                        newRec.setValue({fieldId:'otherrefnum', value:''});
                    }
                }
            }
            //------------------------------------------------------- 
        } catch (error) {
            log.error('Error ocurred', error);
        }

        // Added By Mahesh K on 11/04/2024
        // Check Invoice already exist for the given duration
        if (recordMode == 'CREATE') {
            var invEntity = newRec.getValue({ fieldId: 'entity' });
            var invEmp = newRec.getValue({ fieldId: 'custbody_norwin_employee' });
            var invoiceType = newRec.getValue({ fieldId: 'custbody_norwin_invoice_type' });
            var invEndDate = newRec.getValue({ fieldId: 'custbody_norwin_inv_duration_enddate' });
            var invStartDate = newRec.getValue({ fieldId: 'custbody_norwin_inv_duration_startdate' });

            if (invoiceType == 3) {
                if (!invStartDate || !invEndDate) {
                    var invoiceError = error.create({
                        name: 'MISSING_DATA',
                        message: 'Please enter both \'Invoice Duration Start Date\' & \'Invoice Duration End Date\'',
                        notifyOff: false
                    });
                    throw ('Please enter both \'Invoice Duration Start Date\' & \'Invoice Duration End Date\'');
                }

                if (invStartDate && invEntity && invEmp) {
                    var newInvStartDate = format.format({ value: invStartDate, type: format.Type.DATE });
                    var invoiceCount = checkInvoiceExist(newInvStartDate, invEntity, invEmp);
                    log.debug("checkInvoiceExist invoiceCount", invoiceCount);

                    if (Number(invoiceCount) > 0) {
                        var invoiceError = error.create({
                            name: 'DUPLICATE_INVOICE',
                            message: 'You cannot create an invoice for the same period.',
                            notifyOff: false
                        });
                        throw ('Duplicate Invoice creation. Invoice was already created for the date ' + newInvStartDate);
                    }
                }
            }
        }
    }


    //---------------Start--Added by Chetan Sable 05Jan2024 for Attach and Detach the File on Invoice.
    function afterSubmit(context) {
        var newRec = context.newRecord;
        var recordId = newRec.id;
        var recordMode = context.type.toUpperCase();
        var tbIdArr = [];
        var expcostIdArr = [];
        var currScript = runtime.getCurrentScript();
        var timeFolderId = currScript.getParameter({ name: 'custscript_norwin_time_attach_folderid' });
        var expenseFolderId = currScript.getParameter({ name: 'custscript_norwin_expens_attach_folderid' });

        try {
            // On Invoice save set latest invoice duration on Sales Order           
            if (recordMode == 'CREATE') {
                var invEndDate = newRec.getValue({ fieldId: 'custbody_norwin_inv_duration_enddate' });
                var salesOrderId = newRec.getValue({ fieldId: 'createdfrom' });

                if (salesOrderId) {
                    record.submitFields({
                        type: 'salesorder',
                        id: salesOrderId,
                        values: {
                            'custbody_norwin_inv_duration_enddate': invEndDate
                        }
                    });
                }
            }

            if (recordMode == 'CREATE' || recordMode == 'EDIT') {
                //Setting invoicing qty on SO fields
                log.debug("Getting additional fields in SO");
                var invDurStartDate = newRec.getValue({ fieldId: 'custbody_norwin_inv_duration_startdate' });
                var invDurEndDate = newRec.getValue({ fieldId: 'custbody_norwin_inv_duration_enddate' });
                var lastInvDate = newRec.getValue({ fieldId: 'trandate' });
                var soID = newRec.getValue({ fieldId: 'createdfrom' });

                if(soID) {
                    var soObj = record.load ({type: 'salesorder', id: soID })                
                    var soLines = soObj.getLineCount({ sublistId: 'item' });
                    if(Number(soLines) == 1) {
                        var soQty = soObj.getSublistValue({ sublistId: 'item', fieldId: "quantity", line: 0 });
                        var invQty = soObj.getSublistValue({ sublistId: 'item', fieldId: "quantitybilled", line: 0 });
                        var balanceQty = soQty - invQty;
                        log.debug("Setting additional fields in SO");
                        soObj.setValue({fieldId:'custbody_norwin_inv_duration_startdate', value: invDurStartDate});
                        soObj.setValue({fieldId:'custbody_norwin_inv_duration_enddate', value: invDurEndDate});
                        soObj.setValue({fieldId:'custbody_last_invoice_date', value: lastInvDate});
                        soObj.setValue({fieldId:'custbody_jd_so_qty', value: soQty});
                        soObj.setValue({fieldId:'custbody_jd_invoice_qty', value: invQty});
                        soObj.setValue({fieldId:'custbody_jd_balance_qty', value: balanceQty});
                        soObj.save();
                    }
                }              
                
                //-------------------------Start-File Detach Time/Expense---------------------------------
                var invoiceSearchObj = search.create({
                    type: "invoice",
                    filters:
                        [
                            ["type", "anyof", "CustInvc"],
                            "AND",
                            ["internalidnumber", "equalto", recordId],
                            "AND",
                            ["file.folder", "anyof", timeFolderId, expenseFolderId],
                            "AND",
                            ["mainline", "is", "T"]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "name",
                                join: "file"
                            }),
                            search.createColumn({
                                name: "folder",
                                join: "file"
                            }),
                            search.createColumn({
                                name: "internalid",
                                join: "file"
                            })
                        ]
                });
                var searchResultCount = invoiceSearchObj.runPaged().count;
                log.debug("afterSubmit >>> invoiceSearchObj result count", searchResultCount);

                invoiceSearchObj.run().each(function (result) {
                    var resultName = result.getValue({ "name": "name", "join": "file" });
                    var resultFolder = result.getValue({ "name": "folder", "join": "file" });
                    var resultInternalId = result.getValue({ "name": "internalid", "join": "file" });
                    //log.debug('resultName', resultName);
                    //log.debug('resultFolder', resultFolder);
                    log.debug('resultInternalId', resultInternalId);

                    if (resultInternalId) {
                        record.detach({
                            record: {
                                type: 'file',
                                id: resultInternalId
                            },
                            from: {
                                type: 'invoice',
                                id: recordId
                            }
                        });
                    }

                    return true;
                });
                //----------------------------End-File Detach Time/Expense--------------------------------

                //---Start--- Auto set File on Invoice based on Time
                var billableTimeLinesCount = newRec.getLineCount({ sublistId: 'time' });
                log.debug('billableTimeLinesCount', billableTimeLinesCount);

                if (billableTimeLinesCount > 0) {
                    //log.debug('Time Line Loop');
                    for (var i = 0; i < billableTimeLinesCount; i++) {
                        var applyId = newRec.getSublistValue({ sublistId: 'time', fieldId: "apply", line: i });
                        if (applyId) {
                            var tbId = newRec.getSublistValue({ sublistId: 'time', fieldId: "doc", line: i });
                            tbIdArr.push(tbId);
                        };
                    }
                    log.debug(" tbIdArr apply=true", tbIdArr);

                    if (tbIdArr.length > 0) {
                        var customrecord_jd_timesheet_attachSearchObj = search.create({
                            type: "customrecord_jd_timesheet_attach",
                            filters:
                                [
                                    ["isinactive", "is", "F"],
                                    "AND",
                                    ["custrecord_jd_time_entry", "anyof", tbIdArr]
                                ],
                            columns:
                                [
                                    search.createColumn({
                                        name: "name",
                                        sort: search.Sort.ASC
                                    }),
                                    "custrecord_jd_ts_attachment"
                                ]
                        });
                        var searchResultCount = customrecord_jd_timesheet_attachSearchObj.runPaged().count;
                        log.debug("customrecord_jd_timesheet_attachSearchObj result count", searchResultCount);

                        customrecord_jd_timesheet_attachSearchObj.run().each(function (result) {
                            log.debug('result 11', result);
                            var recid = result.getValue('custrecord_jd_ts_attachment');
                            //log.debug('recid', recid);

                            if (recid) {
                                var fileId = record.attach({
                                    record: {
                                        type: 'file',
                                        id: recid
                                    },
                                    to: {
                                        type: 'invoice',
                                        id: recordId
                                    }
                                });
                                log.debug('attached fileId', fileId);
                            }

                            return true;
                        });
                    }
                }
                //---End--- Auto set File on Invoice based on Time

                //---Start--- Auto set File on Invoice based on Expense
                var expLinesCount = newRec.getLineCount({ sublistId: 'expcost' });
                log.debug('expLinesCount', expLinesCount);

                if (expLinesCount > 0) {
                    //log.debug('Expense Line Loop');
                    for (var e = 0; e < expLinesCount; e++) {
                        var applyId = newRec.getSublistValue({ sublistId: 'expcost', fieldId: "apply", line: e });
                        //log.debug('applyId expense', applyId);

                        if (applyId) {
                            var expcostId = newRec.getSublistValue({ sublistId: 'expcost', fieldId: "doc", line: e });
                            expcostIdArr.push(expcostId);
                        }
                    }
                    log.debug(" expcostIdArr apply=true", expcostIdArr);

                    if (expcostIdArr.length > 0) {
                        var expensereportSearchObj = search.create({
                            type: "expensereport",
                            filters:
                                [
                                    ["type", "anyof", "ExpRept"],
                                    "AND",
                                    ["mainline", "is", "T"],
                                    "AND",
                                    ["internalid", "anyof", expcostIdArr]
                                ],
                            columns:
                                [
                                    "custbody_jd_zip_document"
                                ]
                        });
                        var searchResultCount = expensereportSearchObj.runPaged().count;
                        log.debug("expensereportSearchObj result count", searchResultCount);

                        expensereportSearchObj.run().each(function (result) {
                            log.debug('expcost result', result);
                            var expcostResultId = result.getValue('custbody_jd_zip_document');
                            //log.debug('expcostResultId', expcostResultId);
                            if (expcostResultId) {
                                record.attach({
                                    record: {
                                        type: 'file',
                                        id: expcostResultId
                                    },
                                    to: {
                                        type: 'invoice',
                                        id: recordId
                                    }
                                });
                            }

                            return true;
                        });
                    }
                }
                //---End--- Auto set File on Invoice based on Expense
            }
        } catch (error) {
            log.error('Error ocurred aftersubmit', error);
        }

    }
    //---------------End--Added by Chetan Sable 05 Jan 2024 for Attach and Detach the File on Invoice.


    function getTerms(paymentTermDays) {
        var termId = '';
        var termSearchObj = search.create({
            type: "term",
            filters:
                [
                    ["name", "is", "Net " + paymentTermDays]
                ],
            columns:
                [
                    search.createColumn({ name: "internalid", label: "Internal ID" })
                ]
        });

        var searchResults = getCompleteSearchResult(termSearchObj);
        if (searchResults && searchResults.length > 0) {
            termId = searchResults[0].getValue({ name: "internalid" });
        }

        log.debug('getTerms termId', termId);
        return termId;
    }


    function getTimeBillRate(tbIdArr) {
        var timeBillArr = {};

        try {
            var timebillSearchObj = search.create({
                type: "timebill",
                filters:
                    [
                        ["internalid", "anyof", tbIdArr], 
                        "AND", 
                        ["custcol_jd_hours_type","anyof","3","2"]
                    ],
                columns:
                    [
                        search.createColumn({name: "custcol_jd_hours_type", label: "HOURS TYPE"}),
                        search.createColumn({ name: "internalid", label: "Internal ID" })
                    ]
            });
            var timebillSearchResult = getCompleteSearchResult(timebillSearchObj);
            if (timebillSearchResult && timebillSearchResult.length) {
                for (var i = 0; i < timebillSearchResult.length; i++) {
                    var timeBillHrsType = timebillSearchResult[i].getText({ name: "custcol_jd_hours_type" });
                    var timeBillId = timebillSearchResult[i].getValue({ name: "internalid" });
                    timeBillArr[timeBillId] = timeBillHrsType;
                }
            }
            log.debug(" timeBillArr is", timeBillArr);
            return timeBillArr;
        } catch (error) {
            log.error("Exception error", error);
        }
    }


    // Function to format a date string as "MMM-DD-YYYY"
    function formatDateString(dateString) {
        var date = new Date(dateString);
        var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        var month = monthNames[date.getMonth()];
        var day = date.getDate();
        var year = date.getFullYear();
        return month + "-" + (day < 10 ? "0" : "") + day + "-" + year;
    }


    function check2MonthsExist(startDate, endDate) {
        var flag = false;
        var startDt = new Date(startDate);
        var startMonth = startDt.getMonth() + 1;

        var endDt = new Date(endDate);
        var endMonth = endDt.getMonth() + 1;

        log.debug(" startMonth of " + startDate, startMonth);
        log.debug(" endMonth of " + endDate, endMonth);

        if (Number(startMonth) != Number(endMonth)) {
            flag = true;
        }

        return flag;
    }


    function checkInvoiceExist(newInvStartDate, invEntity, invEmp) {
        var invoiceSearchObj = search.create({
            type: "invoice",
            settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
            filters:
                [
                    ["type", "anyof", "CustInvc"],
                    "AND",
                    ["customer.internalid", "anyof", invEntity],
                    "AND",
                    ["custbody_norwin_inv_duration_startdate", "on", newInvStartDate],
                    "AND",
                    ["custbody_norwin_employee.internalid", "anyof", invEmp],
                    "AND",
                    ["mainline", "is", "T"]
                ],
            columns:
                [
                    search.createColumn({ name: "internalid", label: "Internal ID" }),
                    search.createColumn({ name: "custbody_mcs_invoice_no", label: "Invoice #" })
                ]
        });
        var searchResultCount = invoiceSearchObj.runPaged().count;
        log.debug("invoiceSearchObj result count", searchResultCount);

        return searchResultCount;
    }


    function getPoNumber(projectId, projectStartDate, projectEndDate) {
        var poNumber = '';
        var filter = [
            ["custrecord_jd_project_ref","anyof",projectId], 
            "AND", 
            ["custrecord_jd_start_date","onorafter",projectStartDate]
        ]
        if(projectEndDate){
            filter.push("AND",["custrecord_jd_end_date","onorbefore",projectEndDate])
        }
        var customrecord_jd_billable_ratesSearchObj = search.create({
            type: "customrecord_jd_billable_rates",
            filters:filter,
            columns:
            [
               search.createColumn({name: "name", label: "Name"})
            ]
         });
         var searchResultCount = customrecord_jd_billable_ratesSearchObj.runPaged().count;

         if (searchResultCount > 0) {
            customrecord_jd_billable_ratesSearchObj.run().each(function(result){
                poNumber = result.getValue({name: "name", label: "Name"});
                return false;
             });
         }
         return poNumber;
         
    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});