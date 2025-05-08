/* ******************************************************************************************
 * Company:		Invitra Technologies Pvt.Ltd
 * Author:	    Supriya Gunjal
 * 
 *
 * Version    Date            Author           	  Remarks
 * 1.00       30 Oct 2023    Supriya Gunjal	     Initial Version
 *
 ********************************************************************************************/

/**
 * @NScriptType MapReduceScript
 * @NApiVersion 2.x
 */

define(['N/record','N/search','N/runtime','N/https','N/format','N/encode','N/file','N/email','./jobdiva_integration_utils.js','./jobdiva_integration_lib.js','../norwin_common_library.js',], 
	function (record, search, runtime, https, format, encode, file, email, utils, lib) {
		var dataObj = [];

		function getInputData() {
			try {
				var todayDate = new Date();
				var days = 1;
				var currScript = runtime.getCurrentScript();
				var fromDate = currScript.getParameter({name: 'custscript_jd_timesync_fromdate'});
				var toDate = currScript.getParameter({name: 'custscript_jd_timesync_todate'});        

				if (!fromDate) { 
					fromDate = getBackdatedDate(todayDate, days);
					fromDate = getDateString(fromDate);
				} else {
					fromDate = getDateString(fromDate);
				}

				if (!toDate) { 
					var toDate = getDateString(todayDate); 
				} else {
					toDate = getDateString(toDate);
				}

				log.debug("getInputData fromDate", fromDate);
				log.debug("getInputData toDate", toDate);

				var jdUpdatedTimesheet = utils.getJdNewUpdatedApprovedTimesheetRecords(fromDate, toDate);
				log.debug("getInputData jdUpdatedTimesheet", jdUpdatedTimesheet);

				var returnObj = jdUpdatedTimesheet.data;
				log.debug("getInputData returnObj", returnObj.length);
				return returnObj;
			} catch (e) {
				throw e;
			}
		}


		function reduce(context) {
			try {
				var errorObjArray = [];
				var result = JSON.parse(context.values[0]);
				log.debug("reduce result >>>", result);

				var jdEmployeeId = result.EMPLOYEEID;
				var jdTimesheetId = result.TIMESHEETID;
				var startId = result.STARTID;
				var billRecId = result.BILLING_RECID;
				var billParentRecId = result.BILL_PARENT_RECID;
				var salaryParentRecId = result.SALARY_PARENT_RECID;
				var weekEndDate = result.WEEKENDINGDATE;
				log.debug("reduce jdTimesheetId", jdTimesheetId);
				log.debug("reduce jdEmployeeId", jdEmployeeId);
				log.debug("reduce billParentRecId", billParentRecId);
				log.debug("reduce salaryParentRecId", salaryParentRecId);
				log.debug("reduce weekEndDate", weekEndDate);

				if (!billParentRecId && !salaryParentRecId) {
					dataObj.push(result);
				}

				var nsEmployeeId = lib.getEmployeeId(jdEmployeeId);
				log.debug("nsEmployeeId", nsEmployeeId);

				if (nsEmployeeId) {
					var nsProjectId = lib.getProjectIdByBillableRate(startId);
					log.debug("reduce nsProjectId", nsProjectId);

					if (!nsProjectId) {
						var nsProjectObj = lib.getProjectId(nsEmployeeId, jdEmployeeId, billRecId, startId);
						
						if (nsProjectObj && nsProjectObj.length) {
							nsProjectId = nsProjectObj[0].projectId;
						}
						
					}

					if (nsProjectId) {
						var jobType = "";
						var serviceItemId = "";
						var jobRec = search.lookupFields({type: "job", id: nsProjectId, columns: ["jobtype", "custentity_norwin_billable_item"]});

						if (jobRec && jobRec.jobtype[0]) {
							jobType = jobRec.jobtype[0].value;
						}

						if (jobRec && jobRec.custentity_norwin_billable_item[0]) {
							serviceItemId = jobRec.custentity_norwin_billable_item[0].value;
						}

						var existingTimeEntries = lib.getExistingTimeEntries(jdTimesheetId, startId, nsEmployeeId);
						log.debug("reduce existingTimeEntries", existingTimeEntries);

						var timesheetDetailsRes = utils.getJdTimesheetDetailAllHours(jdTimesheetId);
						log.debug("reduce timesheetDetailsRes", timesheetDetailsRes);

						var timeEntryArr = timesheetDetailsRes.data;
						log.debug("reduce timeEntryArr", timeEntryArr);

						// Create a response record to capture the JD response history.
						var responseRecId = lib.createJobdivaResponseRecord(timeEntryArr, jdTimesheetId, recordType.TIMESHEET, "TimesheetDetailAllHours");
						log.debug("reduce responseRecId", responseRecId);

						if (timeEntryArr && timeEntryArr.length) {
							for (var z = 0; z < timeEntryArr.length; z++) {
								var otherTimeArray = [];
								var nsTimeArr = [];
								var timeBillId = "";
								var hourDescription = timeEntryArr[z].BILLRATE_NAME;
								var billable = timeEntryArr[z].Billable;

								if (billable && billable.length) {
									for (var i = 0; i < billable.length; i++) {
										try {
											var dateObj = "";
											var dateString = "";
											var rateType = "REG_HOURS";
											var pushed = false;
											var tDate = billable[i].TDATE;
											dateString = formatDate(tDate);

											if (dateString) {
												dateObj = format.parse({value: dateString, type: format.Type.DATE});
											}

											var timeStatus = billable[i].STATUS;
											var regHours = billable[i].REG_HOURS;
											var otHours = billable[i].OT_HOURS;
											var dtHours = billable[i].DT_HOURS;
											var dailyHours = billable[i].DAILY_COVERED_HOURS || "0";
											var billRate = billable[i].BILL_RATE;
											var billRatePer = billable[i].BILL_RATE_PER;
											var otRate = billable[i].OVERTIME_RATE1;
											var otRatePer = billable[i].OVERTIME_RATE1_PER;
											var dtRate = billable[i].OVERTIME_RATE2;
											var dtRatePer = billable[i].OVERTIME_RATE2_PER;
											var payRate = billable[i].PAY_RATE;
											var payRatePer = billable[i].PAY_RATE_PER;
											var otPayRate = billable[i].OVERTIME_PAY_RATE1;
											var otPayRatePer = billable[i].OVERTIME_PAY_RATE1_PER;
											var dtPayRate = billable[i].OVERTIME_PAY_RATE2;
											var dtPayRatePer = billable[i].OVERTIME_PAY_RATE2_PER;

											if (regHours == "0" && dailyHours != "0") {
												regHours = billable[i].DAILY_COVERED_HOURS;
												rateType = "DAILY_COVERED_HOURS";
											}

											if (billable[i].hasOwnProperty("pushed")) {
												pushed = billable[i].pushed;
											} else {
												pushed = false;
											}

											if (billable[i].hasOwnProperty("rateType")) {
												rateType = billable[i].rateType;
											}

											if (otHours != "0" && !pushed) {
												billable[i]["rateType"] = "OT_HOURS";
												billable[i]["pushed"] = true;
												billable[i]["REG_HOURS"] = otHours;
												billable[i]["BILL_RATE"] = otRate;
												billable[i]["PAY_RATE"] = otPayRate;
												billable[i]["BILL_RATE_PER"] = otRatePer;
												billable[i]["PAY_RATE_PER"] = otPayRatePer;
												billable.push(billable[i]);
											}

											if (dtHours != "0" && !pushed) {
												billable[i]["rateType"] = "DT_HOURS";
												billable[i]["pushed"] = true;
												billable[i]["REG_HOURS"] = dtHours;
												billable[i]["BILL_RATE"] = dtRate;
												billable[i]["PAY_RATE"] = dtPayRate;
												billable[i]["BILL_RATE_PER"] = dtRatePer;
												billable[i]["PAY_RATE_PER"] = dtPayRatePer;
												billable.push(billable[i]);
											}

											if (timeStatus == "APPROVED" && regHours != "0") {
												var timeTracking = "";

												// Update to the existing time entries.
												if (existingTimeEntries && existingTimeEntries.length) {
													var existingTime = existingTimeEntries.filter(function(each) {
														var date = each.getValue({"name": "date"});
														var hoursType = each.getText({"name": "custcol_jd_hours_type"});

														if (date == dateString && hoursType == rateType) {
															return each.id;
														}
													});
													// log.debug("existingTime", existingTime);

													// Time entry with the same date available load or else create new.
													if (existingTime && existingTime.length) {
														timeTracking = record.load({type: record.Type.TIME_BILL, id: existingTime[0].id});
													} else {
														timeTracking = record.create({
															type: record.Type.TIME_BILL,
															defaultValues: {
																customform: FORMID_TIME
															}
														});
													}
												} else {
													timeTracking = record.create({
														type: record.Type.TIME_BILL,
														defaultValues: {
															customform: FORMID_TIME
														}
													});
												}

												timeTracking.setValue("employee", nsEmployeeId);
												timeTracking.setValue("trandate", dateObj);
												timeTracking.setValue("hours", regHours);
												timeTracking.setValue("customer", nsProjectId);
												timeTracking.setValue("item", serviceItem[rateType]);

												// timeTracking.setValue("item", Number(serviceItemId));

												if (jobType == TIME_AND_MATERIAL) {
													timeTracking.setValue('isbillable', true);
												}

												timeTracking.setValue("approvalstatus", TIME_APPROVE_STATUS);
												timeTracking.setValue("custcol_jd_project_start_id", startId);
												timeTracking.setValue("custcol_jd_timesheet_id", jdTimesheetId);
												timeTracking.setValue("custcol_jd_timesheet_billrate", billRate);
												timeTracking.setValue("custcol_jd_timesheet_payrate", payRate);

												var billRateCodeId = lib.getBillRateTypeByCode(billRatePer);
												// log.debug("billRateCodeId", billRateCodeId);

												if (billRateCodeId) {
													timeTracking.setValue("custcol_jd_timesheet_billrateper", billRateCodeId);
												}
												
												var payRateCodeId = lib.getBillRateTypeByCode(payRatePer);
												// log.debug("payRateCodeId", payRateCodeId);

												if (payRateCodeId) {
													timeTracking.setValue("custcol_jd_timesheet_payrateper", payRateCodeId);
												}

												timeTracking.setText("custcol_jd_hours_type", rateType);
												timeTracking.setValue("custcol_jd_hours_description", hourDescription);

												timeBillId = timeTracking.save();
												log.debug("timeBillId", timeBillId);
												nsTimeArr.push(timeBillId);
											} else if (timeStatus == "APPROVED" && regHours == "0") {
												if (existingTimeEntries && existingTimeEntries.length) {
													var existingTime = existingTimeEntries.filter(function(each) {
														var date = each.getValue({"name": "date"});
														var hoursType = each.getText({"name": "custcol_jd_hours_type"});

														if (date == dateString && hoursType == rateType) {
															return each.id;
														}
													});
													// log.debug("existingTime", existingTime);

													// Time entry with the same date available load or else create new.
													if (existingTime && existingTime.length) {
														timeTracking = record.load({type: record.Type.TIME_BILL, id: existingTime[0].id});
														timeTracking.setValue("hours", regHours);
														timeTracking.setValue("custcol_jd_timesheet_billrate", billRate);
														timeTracking.setValue("custcol_jd_timesheet_payrate", payRate);
														timeBillId = timeTracking.save();
													}
												}
											}
										} catch (e) {
											var errorDetails = '';

											if (e.hasOwnProperty('message')) {
												errorDetails = e.name + ': ' + e.message;
												log.error('reduce - EXPECTED_ERROR', errorDetails);
												log.error('reduce - stack', e.stack);
											} else {
												errorDetails = e.toString();
												log.error('reduce - UNEXPECTED_ERROR', errorDetails);
												log.error('reduce - stack', e.stack);
											}

											errorDetails += " for date: "+ dateString;
											errorObjArray.push(errorDetails);
											context.write("error", errorDetails);
										}
									}

									// log.debug("reduce Item 1.5 >> serviceItemId >>>", serviceItemId);

									var nonBillable = timeEntryArr[z]["Non Billable"];
									// log.debug("reduce nonBillable", nonBillable);
									// log.debug("jdTimesheetId in [p]", jdTimesheetId);

									for (var p = 0; p < nonBillable.length; p++) {
										try {
											var dateObj = "";
											var dateString = "";
											var timeTracking = "";
											var tDate = nonBillable[p].TDATE;
											dateString = formatDate(tDate);

											if (dateString) {
												dateObj = format.parse({value: dateString, type: format.Type.DATE});
											}

											var hoursWorked = Number(nonBillable[p].HOURSWORKED);
											var rateType = "NON_BILLABLE";
											var hoursDesc = nonBillable[p].HOURS_DESCRIPTION;
											// log.debug("hoursWorked", hoursWorked);
											// log.debug("hoursDesc", hoursDesc);

											if (hoursWorked > 0) {
												if (existingTimeEntries && existingTimeEntries.length) {
													var existingTime = existingTimeEntries.filter(function(each) {
														var date = each.getValue({"name": "date"});
														var hourDes = each.getValue({"name": "custcol_jd_hours_description"});

														if (date == dateString && hourDes == hoursDesc) {
															// log.debug("existingTime Non billable", "YES");
															return each.id;
														}
													});
													// log.debug("existingTime", existingTime);
												}

												// Time entry with the same date available load or else create new.
												if (existingTime && existingTime.length) {
													timeTracking = record.load({type: record.Type.TIME_BILL, id: existingTime[0].id});
												} else {
													timeTracking = record.create({
														type: record.Type.TIME_BILL,
														defaultValues: {
															customform: FORMID_TIME
														}
													});
												}

												timeTracking.setValue("employee", nsEmployeeId);
												timeTracking.setValue("trandate", dateObj);
												timeTracking.setValue("hours", hoursWorked);
												timeTracking.setValue("customer", nsProjectId);
												//timeTracking.setValue("item", serviceItem[hoursDesc]);

												timeTracking.setValue("item", Number(serviceItemId));
												timeTracking.setValue("approvalstatus", TIME_APPROVE_STATUS);
												timeTracking.setValue("custcol_jd_project_start_id", startId);
												timeTracking.setValue("custcol_jd_timesheet_id", jdTimesheetId);
												timeTracking.setText("custcol_jd_hours_type", rateType);
												timeTracking.setValue("custcol_jd_hours_description", hoursDesc);
												timeTracking.setValue('isbillable', false);

												var timeBillId = timeTracking.save();
												log.debug("timeBillId", timeBillId);
												nsTimeArr.push(timeBillId);
											} else if (hoursWorked == 0) {
												if (existingTimeEntries && existingTimeEntries.length) {
													var existingTime = existingTimeEntries.filter(function(each) {
														var date = each.getValue({"name": "date"});
														var hourDes = each.getValue({"name": "custcol_jd_hours_description"});

														if (date == dateString && hourDes == hoursDesc) {
															return each.id;
														}
													});
													// log.debug("existingTime", existingTime);

													// Time entry with the same date available load or else create new.
													if (existingTime && existingTime.length) {
														timeTracking = record.load({type: record.Type.TIME_BILL, id: existingTime[0].id});
														timeTracking.setValue("hours", hoursWorked);
														timeBillId = timeTracking.save();
														log.debug("timeBillId", timeBillId);
													}
												}
											}
										} catch (e) {
											var errorDetails = '';

											if (e.hasOwnProperty('message')) {
												errorDetails = e.name + ': ' + e.message;
												log.error('reduce - EXPECTED_ERROR', errorDetails);
												log.error('reduce - stack', e.stack);
											} else {
												errorDetails = e.toString();
												log.error('reduce - UNEXPECTED_ERROR', errorDetails);
												log.error('reduce - stack', e.stack);
											}

											errorDetails += " for date: "+ dateString;
											errorObjArray.push(errorDetails);
											context.write("error", errorDetails);
										}
									}

									if (errorObjArray && errorObjArray.length) {
										try {
											record.submitFields({
												type: "customrecord_jd_api_response_details",
												id: responseRecId,
												values: {
													"custrecord_jd_timeentry": nsTimeArr,
													"custrecord_jd_status": processStatus.FAILED,
													"custrecord_jd_error_details": errorObjArray.toString()
												}
											});
										} catch (e) {
											log.error("error while updating response record", e);
										}
									} else {
										try {
											record.submitFields({
												type: "customrecord_jd_api_response_details",
												id: responseRecId,
												values: {
													"custrecord_jd_timeentry": nsTimeArr,
													"custrecord_jd_status": processStatus.PROCESSED,
													"custrecord_jd_error_details": ""
												}
											});
										} catch (e) {
											log.error("error while updating response record", e);
										}
									}

									if (timeBillId) {
										try {
											var originalIdObj = [];
											var origTimesheetId = "";
											var errorArr = [];
											var jdAttachmentObj;

											if (billParentRecId && salaryParentRecId && weekEndDate) {
												originalIdObj = dataObj.filter(function (each) {
													if (billParentRecId == each.BILLING_RECID && salaryParentRecId == each.SALARY_RECID && weekEndDate == each.WEEKENDINGDATE && jdEmployeeId == each.EMPLOYEEID) {
														return each;
													}
												});
												// log.debug("originalIdObj", originalIdObj);
											}

											if (originalIdObj && originalIdObj.length) {
												origTimesheetId = originalIdObj[0].TIMESHEETID;
											}

											jdAttachmentObj = utils.getEmployeeTimesheetImagebyTimecardIDDetail(jdEmployeeId, jdTimesheetId);
											log.debug("reduce jdAttachmentObj", jdAttachmentObj);

											if (origTimesheetId) {
												jdAttachmentObj = utils.getEmployeeTimesheetImagebyTimecardIDDetail(jdEmployeeId, origTimesheetId);
												log.debug("reduce jdAttachmentObj", jdAttachmentObj);
											}

											var jdAttachmentArr = jdAttachmentObj.data;
											log.debug("reduce jdAttachmentArr", jdAttachmentArr);

											// Create a response record to capture the JD response history.
											responseRecId = lib.createJobdivaResponseRecord(jdAttachmentArr, jdTimesheetId, recordType.TIME_ATTACHMENT, "EmployeeTimesheetImagebyTimecardIDDetail");
											// log.debug("reduce responseRecId", responseRecId);

											if (jdAttachmentArr && jdAttachmentArr.length) {
												for (var j = 0 ; j < jdAttachmentArr.length; j++) {
													try {
														var fileName = jdAttachmentArr[j].FILENAME;
														var fileContent = jdAttachmentArr[j].FILECONTENT;
														var fileType = fileName.split(".");
														fileType = fileType[fileType.length - 1];
														fileType = lib.getFileType(fileType);

														var fileContentDecoded = encode.convert({
															string: fileContent,
															inputEncoding: encode.Encoding.BASE_64,
															outputEncoding: encode.Encoding.UTF_8
														});

														var fileObj = file.create({
															name: jdTimesheetId + "_" + fileName,
															fileType: fileType,
															contents: fileContent,
															encoding: file.Encoding.UTF8,
															folder: TIME_ATTACHMENT_FOLDER
														});

														var fileId = fileObj.save();
														log.debug("reduce fileId", fileId);

														// custom record
														if (fileId) {
															var fileObj = record.create({type: "customrecord_jd_timesheet_attach"});
															fileObj.setValue("name", jdTimesheetId);
															fileObj.setValue("custrecord_jd_ts_attachment", fileId);
															fileObj.setValue("custrecord_jd_time_entry", nsTimeArr);
															fileObj.save();
														}
													} catch (e) {
														var errorDetails = '';

														if (e.hasOwnProperty('message')) {
															errorDetails = e.name + ': ' + e.message;
															log.error('reduce - EXPECTED_ERROR', errorDetails);
															log.error('reduce - stack', e.stack);
														} else {
															errorDetails = e.toString();
															log.error('reduce - UNEXPECTED_ERROR', errorDetails);
															log.error('reduce - stack', e.stack);
														}

														errorDetails += " for file name: "+ fileName;
														errorArr.push(errorDetails);
														context.write("error", errorDetails);
													}
												}
											}

											if (errorArr && errorArr.length) {
												try {
													record.submitFields({
														type: "customrecord_jd_api_response_details",
														id: responseRecId,
														values: {
															"custrecord_jd_timeentry": nsTimeArr,
															"custrecord_jd_status": processStatus.FAILED,
															"custrecord_jd_error_details": errorArr.toString()
														}
													});
												} catch (e) {
													log.error("error while updating response record", e);
												}
											} else {
												try {
													record.submitFields({
														type: "customrecord_jd_api_response_details",
														id: responseRecId,
														values: {
															"custrecord_jd_timeentry": nsTimeArr,
															"custrecord_jd_status": processStatus.PROCESSED,
															"custrecord_jd_error_details": ""
														}
													});
												} catch (e) {
													log.error("error while updating response record", e);
												}
											}
										} catch (e) {
											var errorDetails = '';

											if (e.hasOwnProperty('message')) {
												errorDetails = e.name + ': ' + e.message;
												log.error('reduce - EXPECTED_ERROR', errorDetails);
												log.error('reduce - stack', e.stack);
											} else {
												errorDetails = e.toString();
												log.error('reduce - UNEXPECTED_ERROR', errorDetails);
												log.error('reduce - stack', e.stack);
											}

											context.write("error", errorDetails);
										}
									}
								}
							}
						}
					}
				}
			} catch (e) {
				var errorDetails = '';

				if (e.hasOwnProperty('message')) {
					errorDetails = e.name + ': ' + e.message;
					log.error('reduce - EXPECTED_ERROR', errorDetails);
					log.error('reduce - stack', e.stack);
				} else {
					errorDetails = e.toString();
					log.error('reduce - UNEXPECTED_ERROR', errorDetails);
					log.error('reduce - stack', e.stack);
				}

				context.write("error", errorDetails);
			}
		}


		function summarize(summary) {
			try {
				var body = "";
				var errorObjArray = [];            
				var currScript = runtime.getCurrentScript();

				// iterating key and values
				summary.output.iterator().each(function(key, value) {
					log.audit("summary", "Key: " + key + " value: " + value);
					if (key.indexOf("error") > -1) {
						errorObjArray.push({
							"error": key,
							"name": value
						});
					}            
					return true;
				});

				log.debug("Summarize errorObjArray", JSON.stringify(errorObjArray));
				
				if (errorObjArray.length > 0) {
					body += "<b>The following list of errors occurred while JobDiva Timesheet Sync :</b>";
					body += "<ul>";
					for (var i = 0; i < errorObjArray.length; i++) {
						body += "<li>" + errorObjArray[i].name + "</li>";
					}
					body += "</ul>";                
					log.debug("Summarize body", body);                
					
					email.send({
					    author: currScript.getParameter({name: 'custscript_jd_email_sender'}),
					    recipients: currScript.getParameter({name: 'custscript_jd_email_recipients'}),
					    subject: "Norwin : JobDiva Integration - Timesheet Sync ERROR",
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
			getInputData : getInputData,      
			reduce  : reduce,
			summarize: summarize
		}
	}
);