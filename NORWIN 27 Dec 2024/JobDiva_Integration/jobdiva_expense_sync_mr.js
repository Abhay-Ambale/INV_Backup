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
		function getInputData() {
			try {
				var todayDate = new Date();
				var currScript = runtime.getCurrentScript();
				var fromDate = currScript.getParameter({name: 'custscript_jd_expensesync_fromdate'});
				var toDate = currScript.getParameter({name: 'custscript_jd_expensesync_todate'});        

				if (!fromDate) {
					fromDate = getDateString(todayDate);
				} else {
					fromDate = getDateString(fromDate);
				}

				if (!toDate) { 
					toDate = getDateString(todayDate); 
				} else {
					toDate = getDateString(toDate);
				}

				log.debug("getInputData fromDate", fromDate);
				log.debug("getInputData toDate", toDate);

				var jdUpdatedExpense = utils.getJdNewUpdatedExpenseRecords(fromDate, toDate);
				log.debug("getInputData jdUpdatedExpense", jdUpdatedExpense);

				var returnObj = jdUpdatedExpense.data;
				log.debug("getInputData returnObj", returnObj);
				return returnObj;
			} catch (e) {
				throw e;
			}
		}


		function map(context) {
			try {
				var result = JSON.parse(context.value);
				log.debug("map result >>>", result);

				if (result) {
                    var jdExpenseId = result.EXPENSEID;
                    log.debug('map jdExpenseId', jdExpenseId);

					if (jdExpenseId) {
						context.write(jdExpenseId, result);
					}
                }
			} catch (e) {
				log.error("map error", e);
				throw e;
			}
		}


		function reduce(context) {
			try {
				var result = context.values;
				log.debug("reduce result >>>", result);
				var jdExpenseId = context.key;
				log.debug("reduce jdExpenseId >>>", jdExpenseId);

				var jdExpenseDetails = utils.getJdExpensesDetailExpanded(jdExpenseId);
				log.debug("reduce jdExpenseDetails", jdExpenseDetails);
				var jdExpenseArr = jdExpenseDetails.data;

				// Create a response record to capture the JD response history.
				var responseRecId = lib.createJobdivaResponseRecord(jdExpenseArr, jdExpenseId, recordType.EXPENSE_REPORT, "ExpensesDetailExpanded");
				log.debug("reduce responseRecId", responseRecId);

				if (jdExpenseArr && jdExpenseArr.length) {
					for (var i = 0; i < jdExpenseArr.length; i++) {
						var dateObj = "";
						var date = formatDate(jdExpenseArr[i].SUBMITTALDATE);
						log.debug("date", date);

						if (date) {
							dateObj = format.parse({value: date, type: format.Type.DATE});
						}

						var jdEmployeeId = jdExpenseArr[i].EMPLOYEEID;
						var nsEmployeeId = lib.getEmployeeId(jdEmployeeId);
						log.debug("nsEmployeeId", nsEmployeeId);

						if (nsEmployeeId) {
							var custProjId = "";
							var startId = jdExpenseArr[i].STARTID;
							var billRecId = jdExpenseArr[i].BILLING_RECID;
							var nsProjectObj = lib.getProjectId(nsEmployeeId, jdEmployeeId, billRecId, startId);
							log.debug("reduce nsProjectObj", nsProjectObj);

							if (nsProjectObj && nsProjectObj.length) {
								custProjId = nsProjectObj[0].projectId;
							}

							var existingExpenses = lib.getExistingExpenseReport(nsEmployeeId, jdExpenseId);
							log.debug("reduce existingExpenses >>>", existingExpenses);

							var expenseReportObj = record.create({
								type: record.Type.EXPENSE_REPORT, 
								isDynamic: true,
								defaultValues: {
									customform: FORMID_EXPENSE
								}
							});

							expenseReportObj.setValue("entity",nsEmployeeId);
							expenseReportObj.setValue("custbody_norwin_employee",nsEmployeeId);
							expenseReportObj.setValue("trandate",dateObj);
							expenseReportObj.setValue("complete",true);
							expenseReportObj.setValue("supervisorapproval",true);
							expenseReportObj.setValue("accountingapproval",true);
							expenseReportObj.setValue("usemulticurrency",false);
							expenseReportObj.setValue("custbody_jd_start_id",startId);
							expenseReportObj.setValue("custbody_jd_expense_id",jdExpenseId);
							expenseReportObj.setValue("custbody_jd_candidate_id",jdEmployeeId);
							expenseReportObj.setValue("custbody_jd_project_name",custProjId);

							var expenseItemArr = jdExpenseArr[i].EXPENSES;
							log.debug("reduce expenseItemArr >>>", expenseItemArr);

							if (expenseItemArr && expenseItemArr.length) {
								for (var j = 0; j < expenseItemArr.length; j++) {
                                    try {
										var resultObj = JSON.parse(result[j]);
									} catch (e) {
										break;
									}

									if (j == 0) {
										var weekEndDate = formatDate(resultObj.WEEKENDING);
										var weekEndDateObj = format.parse({value: weekEndDate, type: format.Type.DATE});
										expenseReportObj.setValue("custbody_jd_week_ending_date",weekEndDateObj);
									}

									var links = "";
									var expDateObj = "";
									var expenseDate = formatDate(expenseItemArr[j].APPROVEDDATE);
									log.debug("reduce expenseDate", expenseDate);

									if (expenseDate) {
										expDateObj = format.parse({value: expenseDate, type: format.Type.DATE});
									}

									var item = DEFAULT_EXPENSE_CATEGORY;
									var itemDescription = expenseItemArr[j].ITEM;
									var amount = expenseItemArr[j].EXPENSE;
									var comments = expenseItemArr[j].DAILY_COMMENTS;

									/*if (item) {
										var expensecategorySearchObj = search.create({
											type: "expensecategory",
											filters:
											[
												["name","is",item], 
												"AND", 
												["subsidiary","anyof",SUBSIDIARYID_NORWIN]
											],
											columns:
											[
												"description"
											]
										});

										var itemObj = expensecategorySearchObj.run().getRange(0, 1);

										if (itemObj && itemObj.length) {
											item = itemObj[0].id;
										} else {
											throw {
												name: "MISSING_EXPENSE_CATEGORY",
												message: "Please create expense category: '"+item+"' in Netsuite"
											}
										}
									}*/

									expenseReportObj.selectNewLine({sublistId: "expense"});
									expenseReportObj.setCurrentSublistValue({sublistId: "expense", fieldId: "expensedate", value: expDateObj});
									expenseReportObj.setCurrentSublistValue({sublistId: "expense", fieldId: "expenseaccount", value: item});
									expenseReportObj.setCurrentSublistValue({sublistId: "expense", fieldId: "amount", value: amount});
									expenseReportObj.setCurrentSublistValue({sublistId: "expense", fieldId: "custcol_jd_expense_item", value: itemDescription});
									expenseReportObj.setCurrentSublistValue({sublistId: "expense", fieldId: "memo", value: comments});
									expenseReportObj.setCurrentSublistValue({sublistId: "expense", fieldId: "customer", value: custProjId});

									if (resultObj.SUB_EXPENSEID == expenseItemArr[j].SUB_EXPENSEID) {
										var billable = resultObj.BILLABLE;
										var taxable = resultObj.TAXABLE;

										if (billable == "1") {
											expenseReportObj.setCurrentSublistValue({sublistId: "expense", fieldId: "isbillable", value: true});
										} else {
											expenseReportObj.setCurrentSublistValue({sublistId: "expense", fieldId: "isbillable", value: false});
										}
									}

									var attachments = expenseItemArr[j].ATTACHMENTS;
									log.debug("reduce attachments", attachments);

									if (attachments && attachments.length) {
										for (var k = 0; k < attachments.length; k++) {
											var fileName = attachments[k].FILE_NAME;
											var fileLink = attachments[k].FILE_LINK;
											
											if (links) {
												links += "\n" + fileLink;
											} else {
												links += fileLink;
											}
										}
									}

									expenseReportObj.commitLine({sublistId: "expense"});
								}

								var allAttachment = jdExpenseArr[i].ALLATTACHMENTS;
								log.debug("reduce allAttachment", allAttachment);

								if (allAttachment && Object.keys(allAttachment).length > 0) {
									try {
										var fileName = jdExpenseId;
										var fileLink = allAttachment.FILE_LINK;
										var fileLinkBase64 = allAttachment.FILE_LINK_BASE64;

										if (fileLink) {
											expenseReportObj.setValue("custbody_jd_attachment_zip_link", fileLink);
										}

										var headers = utils.getAuthHeader();
										var jdResponse = https.get({url: fileLinkBase64, headers: headers});
										log.debug("reduce jdResponse", jdResponse);

										if (jdResponse.code == 200) {
											var responseBody = jdResponse.body;
											log.debug("reduce responseBody", responseBody);

											if (responseBody) {
												var fileObj = file.create({
													name: fileName + ".zip",
													fileType: file.Type.ZIP,
													contents: responseBody,
													encoding: file.Encoding.UTF8,
													folder: EXPENSE_ATTACHMENT_FOLDER
												});

												var fileId = fileObj.save();
												log.debug("reduce fileId", fileId);
												
												if (fileId) {
													expenseReportObj.setValue("custbody_jd_zip_document", fileId);
												}
											}
										}
									} catch (e) {
										log.error("attachment error", e);
									}
								}
							}

							if (existingExpenses.length == 0) {
								var expenseId = expenseReportObj.save();
								log.debug("expenseId", expenseId);
							}

							try {
								record.submitFields({
									type: "customrecord_jd_api_response_details",
									id: responseRecId,
									values: {
										"custrecord_jd_transaction": expenseId,
										"custrecord_jd_status": processStatus.PROCESSED,
										"custrecord_jd_error_details": ""
									}
								});
							} catch (e) {
								log.error("error while updating response record", e);
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

				try {
					record.submitFields({
						type: "customrecord_jd_api_response_details",
						id: responseRecId,
						values: {
							"custrecord_jd_transaction": "",
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
					body += "<b>The following list of errors occurred while JobDiva Expense Sync :</b>";
					body += "<ul>";
					for (var i = 0; i < errorObjArray.length; i++) {
						body += "<li>" + errorObjArray[i].name + "</li>";
					}
					body += "</ul>";                
					log.debug("Summarize body", body);                
					
					email.send({
					    author: currScript.getParameter({name: 'custscript_jd_email_sender'}),
					    recipients: currScript.getParameter({name: 'custscript_jd_email_recipients'}),
					    subject: "Norwin : JobDiva Integration - Expense Sync ERROR",
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
			map: map,
			reduce  : reduce,
			summarize: summarize
		}
	}
);