/* ******************************************************************************************
 * Company:		Invitra Technologies Pvt.Ltd
 * Author:	    Supriya Gunjal
 * FileName:    jobdiva_integration_lib.js
 * 
 *
 * Version    Date            Author           	  Remarks
 * 1.00       20 Nov 2023    Supriya Gunjal	     Initial Version
 *
 ********************************************************************************************/
/**
 * @NApiVersion 2.0
 */


define(['N/record', 'N/search', 'N/runtime', 'N/format', 'N/https', 'N/error', 'N/file','N/email', './jobdiva_integration_utils.js'], function(record, search, runtime, format, https, error, file, email, utils) {  
    function getEmpIdByJdCandidateId(jdCandidateId) {
        var employeeId = '';

        var searchObj = search.create({
            type: "employee",
            filters:
            [
                ["isinactive","is","F"], 
                "AND",
                ["custentity_jd_candidate_id","is", jdCandidateId]
            ],
            columns:
            [
                search.createColumn({name: "internalid", label: "Internal ID"})				
            ]
        });			
                
        var searchResults = getCompleteSearchResult(searchObj);
        log.debug('lib getEmpIdByJdCandidateId searchResults', searchResults);

        if(searchResults && searchResults.length > 0){
			employeeId = searchResults[0].getValue({name: "internalid"});
		}
        
        log.debug('lib getEmpIdByJdCandidateId employeeId', employeeId);
        return employeeId;
    }


    function getCustomerIdByJdCompanyId(jdCompanyId) {
        var customerId = '';

        var searchObj = search.create({
            type: "customer",
            filters:
            [
                ["isinactive","is","F"], 
                "AND",
                ["custentity_jd_company_id","is", jdCompanyId],
                "AND", 
                ["status","anyof","13"]
            ],
            columns:
            [
                search.createColumn({name: "internalid", label: "Internal ID"})				
            ]
        });			
                
        var searchResults = getCompleteSearchResult(searchObj);
        log.debug('lib getCustomerIdByJdCompanyId searchResults', searchResults);

        if(searchResults && searchResults.length > 0){
			customerId = searchResults[0].getValue({name: "internalid"});
		}
       
        log.debug('lib getCustomerIdByJdCompanyId customerId', customerId);
        return customerId;
    }


    function createNewEmployee(jdEmpData, userType) {
        var id = '';
        var employeeObj = '';
        var entityId = jdEmpData.FIRSTNAME+" "+jdEmpData.LASTNAME+" "+jdEmpData.ID;

        if(jdEmpData.ID || jdEmpData.USERID) {
            employeeObj = record.create({
                type: 'employee',
                isDynamic: true				
            });

            log.debug('lib createNewEmployee jdEmpData', jdEmpData);
            
            employeeObj.setValue({fieldId: 'customform', value: FORMID_EMPLOYEE});
            employeeObj.setValue({fieldId: 'subsidiary', value: SUBSIDIARYID_NORWIN});        
            employeeObj.setValue({fieldId: 'custentity_jd_candidate_id', value: jdEmpData.ID});
            employeeObj.setValue({fieldId: 'firstname', value: jdEmpData.FIRSTNAME});
            employeeObj.setValue({fieldId: 'lastname', value: jdEmpData.LASTNAME});
            employeeObj.setValue({fieldId: 'email', value: jdEmpData.EMAIL}); 
            employeeObj.setValue({fieldId: 'employeetype', value: 5}); // Employee type = Contractor = 5
          
            if(userType == 'salesrep' || userType == 'recruiter') {
                employeeObj.setValue({fieldId: 'employeetype', value: 3}); // Employee type = Regular Employee = 3
                employeeObj.setValue({fieldId: 'custentity_jd_candidate_id', value: jdEmpData.USERID});
                employeeObj.setValue({fieldId: 'issalesrep', value: true});
                employeeObj.setValue({fieldId: 'custentity_jd_employment_type', value: 11}); //custentity_jd_employment_type = staff             
            }
            
            //--------------------------10/15/2024 changes by abhay ---------------------------------
            var empAddLineCount = employeeObj.getLineCount({ sublistId: 'addressbook' });
            log.debug('empAddLineCount', empAddLineCount);
            for (var i = 0; i < empAddLineCount; i++) {						
                employeeObj.removeLine({ sublistId: 'addressbook', line: i });
            }
            // Set an optional field on the sublist line.
            employeeObj.setCurrentSublistValue({sublistId: 'addressbook', fieldId: 'label', value: 'Primary Address'});

            // Create an address subrecord for the line.
            var addressSubRec = employeeObj.getCurrentSublistSubrecord({sublistId: 'addressbook', fieldId: 'addressbookaddress'});
            if(jdEmpData.COUNTRY) addressSubRec.setValue({fieldId: 'country', value: jdEmpData.COUNTRY});
            if(jdEmpData.CITY) addressSubRec.setValue({fieldId: 'city', value: jdEmpData.CITY});
            if(jdEmpData.STATE) addressSubRec.setValue({fieldId: 'state', value: jdEmpData.STATE});
            if(jdEmpData.ZIPCODE) addressSubRec.setValue({fieldId: 'zip', value: jdEmpData.ZIPCODE});
            if(jdEmpData.ADDRESS1) addressSubRec.setValue({fieldId: 'addr1', value: jdEmpData.ADDRESS1});
            if(jdEmpData.ADDRESS2) addressSubRec.setValue({fieldId: 'addr2', value: jdEmpData.ADDRESS2});

            // Save the address sublist line.
            employeeObj.commitLine({sublistId: 'addressbook'});
            //---------------------------------------------------------------------------------------

            try {
                id = employeeObj.save();
            } catch (error) {
                if (error.hasOwnProperty('message')) {
                    msg = error.name;
                    if (msg == 'DUP_EMPL_ENTITY_NAME') {
                        employeeObj.setValue({fieldId: 'autoname', value: false});
                        employeeObj.setValue({fieldId: 'entityid', value: entityId});
                        id = employeeObj.save();
                    }
                }
            }
        }
        
        log.debug('lib createNewEmployee id', id);
        return id;
    }

    function updateEmployee(jdEmpData, userType, empId) {
        var id = '';
        var employeeObj = '';
        var entityId = jdEmpData.FIRSTNAME+" "+jdEmpData.LASTNAME+" "+jdEmpData.ID;

        if(jdEmpData.ID || jdEmpData.USERID) {
            employeeObj = record.load({type: 'employee', id:empId, isDynamic: true});

            log.debug('lib updateEmployee jdEmpData', jdEmpData);
            
            employeeObj.setValue({fieldId: 'customform', value: FORMID_EMPLOYEE});
            // employeeObj.setValue({fieldId: 'subsidiary', value: SUBSIDIARYID_NORWIN});        
            employeeObj.setValue({fieldId: 'custentity_jd_candidate_id', value: jdEmpData.ID});
            // employeeObj.setValue({fieldId: 'firstname', value: jdEmpData.FIRSTNAME});
            // employeeObj.setValue({fieldId: 'lastname', value: jdEmpData.LASTNAME});
            employeeObj.setValue({fieldId: 'email', value: jdEmpData.EMAIL}); 
            employeeObj.setValue({fieldId: 'employeetype', value: 5}); // Employee type = Contractor = 5
          
            if(userType == 'salesrep' || userType == 'recruiter') {
                employeeObj.setValue({fieldId: 'employeetype', value: 3}); // Employee type = Regular Employee = 3
                employeeObj.setValue({fieldId: 'custentity_jd_candidate_id', value: jdEmpData.USERID});
                employeeObj.setValue({fieldId: 'issalesrep', value: true});
                employeeObj.setValue({fieldId: 'custentity_jd_employment_type', value: 11}); //custentity_jd_employment_type = staff             
            }
            
            //--------------------------10/15/2024 changes by abhay ---------------------------------
            var empAddLineCount = employeeObj.getLineCount({ sublistId: 'addressbook' });
            log.debug('empAddLineCount', empAddLineCount);
            for (var i = 0; i < empAddLineCount; i++) {						
                employeeObj.removeLine({ sublistId: 'addressbook', line: i });
            }
            // Set an optional field on the sublist line.
            employeeObj.setCurrentSublistValue({sublistId: 'addressbook', fieldId: 'label', value: 'Primary Address'});

            // Create an address subrecord for the line.
            var addressSubRec = employeeObj.getCurrentSublistSubrecord({sublistId: 'addressbook', fieldId: 'addressbookaddress'});
            if(jdEmpData.COUNTRY) addressSubRec.setValue({fieldId: 'country', value: jdEmpData.COUNTRY});
            if(jdEmpData.CITY) addressSubRec.setValue({fieldId: 'city', value: jdEmpData.CITY});
            if(jdEmpData.STATE) addressSubRec.setValue({fieldId: 'state', value: jdEmpData.STATE});
            if(jdEmpData.ZIPCODE) addressSubRec.setValue({fieldId: 'zip', value: jdEmpData.ZIPCODE});
            if(jdEmpData.ADDRESS1) addressSubRec.setValue({fieldId: 'addr1', value: jdEmpData.ADDRESS1});
            if(jdEmpData.ADDRESS2) addressSubRec.setValue({fieldId: 'addr2', value: jdEmpData.ADDRESS2});

            // Save the address sublist line.
            employeeObj.commitLine({sublistId: 'addressbook'});
            //---------------------------------------------------------------------------------------

            try {
                id = employeeObj.save();
            } catch (error) {
                log.error('lib updateEmployee Save error', error);                
            }
        }
        
        log.debug('lib updateEmployee id', id);
        return id;
    }


    function createNewCustomer(jdCustomerData,emailDetails) {
        var id = '';
        var customerObj = '';
        var entityId = jdCustomerData.COMPANYNAME + " " + jdCustomerData.ID;
        var terms = getTermsFromComapanyDetails(jdCustomerData.PAYMENTTERMS);

        customerObj = record.create({
            type: 'customer',
            isDynamic: true				
        });

        log.debug('lib createNewCustomer jdCustomerData', jdCustomerData);
        log.debug('lib createNewCustomer jdCustomerData.COMPANYNAME', jdCustomerData.COMPANYNAME);

        customerObj.setValue({fieldId: 'customform', value: FORMID_CUSTOMER});
        customerObj.setValue({fieldId: 'subsidiary', value: SUBSIDIARYID_NORWIN});        
        customerObj.setValue({fieldId: 'custentity_jd_company_id', value: jdCustomerData.ID});
        customerObj.setValue({fieldId: 'companyname', value: jdCustomerData.COMPANYNAME});
        if(jdCustomerData.EMAIL) customerObj.setValue({fieldId: 'email', value: jdCustomerData.EMAIL});
        if(jdCustomerData.PHONE) customerObj.setValue({fieldId: 'phone', value: jdCustomerData.PHONE});
        if(terms && terms !='NOT_FOUND') customerObj.setValue({fieldId: 'terms', value: terms});

        if(jdCustomerData.COUNTRY) {
            // Create a line in the Address sublist.
            customerObj.selectNewLine({sublistId: 'addressbook'});

            // Set an optional field on the sublist line.
            customerObj.setCurrentSublistValue({sublistId: 'addressbook', fieldId: 'label', value: 'Primary Address'});

            // Create an address subrecord for the line.
            var addressSubRec = customerObj.getCurrentSublistSubrecord({sublistId: 'addressbook', fieldId: 'addressbookaddress'});
            addressSubRec.setValue({fieldId: 'country', value: jdCustomerData.COUNTRY});
            if(jdCustomerData.CITY) addressSubRec.setValue({fieldId: 'city', value: jdCustomerData.CITY});
            if(jdCustomerData.STATE) addressSubRec.setValue({fieldId: 'state', value: jdCustomerData.STATE});
            if(jdCustomerData.ZIPCODE) addressSubRec.setValue({fieldId: 'zip', value: jdCustomerData.ZIPCODE});
            if(jdCustomerData.ADDRESS1) addressSubRec.setValue({fieldId: 'addr1', value: jdCustomerData.ADDRESS1});
            if(jdCustomerData.ADDRESS2) addressSubRec.setValue({fieldId: 'addr2', value: jdCustomerData.ADDRESS2});

            // Save the address sublist line.
            customerObj.commitLine({sublistId: 'addressbook'});
        }
        try {
            id = customerObj.save();  
        } catch (error) {
            if (error.hasOwnProperty('message')) {
                msg = error.name;
                if (msg == 'UNIQUE_CUST_ID_REQD') {
                    customerObj.setValue({fieldId: 'autoname', value: false});
                    customerObj.setValue({fieldId: 'entityid', value: entityId});
                    id = customerObj.save();
                }
            }
        }
        if(terms=='NOT_FOUND'){
            log.debug('Term not found', terms);
            sendTermNotFounfNotification(emailDetails,jdCustomerData.PAYMENTTERMS,id);            
        }
        log.debug('lib createNewCustomer id', id);

        return id;
    }

    function sendTermNotFounfNotification(emailDetails, terms,id){

        log.debug('sendTermNotFounfNotification: '+terms, emailDetails);
        var body =''
        body += 'The Payment Term Net <b>'+'"'+terms.toUpperCase()+'"'+'</b> received from JobDiva data does not exist in NetSuite Terms record. Please create the new term in NetSuite.';
        body += "<br><a href='https://8188550-sb2.app.netsuite.com/app/common/otherlists/accountingotherlists.nl?whence=' style='text-decoration: none; color: black;'><b>Click here to create new term.</b></a></br>";
        body += "<br> After creation of term, update the customer record with required term in NetSuite.</br>"
        body += "<br><a href='https://8188550-sb2.app.netsuite.com/app/common/entity/custjob.nl?id="+id+"' style='text-decoration: none; color: black;'><b>Click here to update customer record.</b></a></br>";
        body += "<br><b>(Note: This is just error about the term not found and it does not affect on the customer creation. You can later create the term using the above link and update on the created customer.)</b></br>";
        log.debug('sendTermNotFounfNotification body: ', body);

        email.send({
            author: emailDetails.sender,
            recipients: emailDetails.recipients,
            subject: "Norwin : JobDiva Integration - Term Not Found ERROR",
            body: body
        });
        log.debug('sendTermNotFounfNotification sent: ', '');

    }

    // Function to check JD Employee exist, if not create new Employee
    function getEmployeeId(jdCandidateId) {
        var employeeId;
        
        employeeId = getEmpIdByJdCandidateId(jdCandidateId);
        log.debug("lib getEmployeeId", employeeId);
        var jdEmployeeRes = utils.getJdCandidateDetail(jdCandidateId);         
        log.debug("lib jdEmployeeRes.data", jdEmployeeRes.data);

        if(!employeeId) {
            // Create new Employee 
            // Create a response record to capture the JD response history.
            var responseRecId = createJobdivaResponseRecord(jdEmployeeRes, jdCandidateId, recordType.EMPLOYEE, "CandidateDetail");
            log.debug("reduce responseRecId", responseRecId);

            if(jdEmployeeRes.data.length > 0) {
                employeeId = createNewEmployee(jdEmployeeRes.data[0], 'contractor');
                log.debug("lib new employeeId", employeeId);

                try {
                    record.submitFields({
                        type: "customrecord_jd_api_response_details",
                        id: responseRecId,
                        values: {
                            "custrecord_jd_entity": employeeId,
                            "custrecord_jd_status": processStatus.PROCESSED,
                            "custrecord_jd_error_details": ""
                        }
                    });
                } catch (e) {
                    log.error("error while updating response record", e);
                }
            }          
        }
        else{
            employeeId = updateEmployee(jdEmployeeRes.data[0], 'contractor', employeeId)
        }

        return employeeId;
    }


    // Function to check JD User exist, if not create new Employee as user
    function getUserId(jdUserId, userType) {
        var employeeId;
        
        employeeId = getEmpIdByJdCandidateId(jdUserId);
        log.debug("lib getUserId", employeeId);

        var jdEmployeeRes = utils.getJdUserDetail(jdUserId);         
        log.debug("lib jdEmployeeRes.data", jdEmployeeRes.data);
        
        if(!employeeId) {
            // Create new Employee 

            // Create a response record to capture the JD response history.
            var responseRecId = createJobdivaResponseRecord(jdEmployeeRes, jdUserId, recordType.EMPLOYEE, "UserDetail");
            log.debug("reduce responseRecId", responseRecId);

            if(jdEmployeeRes.data.length > 0) {
                employeeId = createNewEmployee(jdEmployeeRes.data[0], userType);
                log.debug("lib getUserId new userId", employeeId);

                try {
                    record.submitFields({
                        type: "customrecord_jd_api_response_details",
                        id: responseRecId,
                        values: {
                            "custrecord_jd_entity": employeeId,
                            "custrecord_jd_status": processStatus.PROCESSED,
                            "custrecord_jd_error_details": ""
                        }
                    });
                } catch (e) {
                    log.error("error while updating response record", e);
                }
            }          
        }
        else{
            employeeId = updateEmployee(jdEmployeeRes.data[0], userType, employeeId)
        }
        return employeeId;
    }

    // Function to check JD Company/Customer exist, if not create new Company
    function getCustomerId(jdCompanyId, jdCompanyRec) {
        var customerId;
        
        customerId = getCustomerIdByJdCompanyId(jdCompanyId);
        log.debug("lib getCustomerId", customerId);

        if(!customerId) {   
            customerId = createNewCustomer(jdCompanyRec);
            log.debug("lib new customerId", customerId);
        }
              
        return customerId;
    }


	function getProjectId(nsEmpId, jdEmpId, billRecId, startId) {
        var jobSearchArray = [];

        var jobSearchObj = search.create({
            type: "job",
            filters:
			[
				["custentity_norwin_employee", "anyof", nsEmpId],
				"AND",
				["custentity_jd_candidate_id", "is", jdEmpId],
				"AND",
				["custentity_jd_billrec_id", "is", billRecId],
                "AND",
				["custentity_jd_start_id", "is", startId]
			],
            columns: [
				"internalid", 
				"customer"
			]
        });

        jobSearchObj.run().each(function (result) {
            projectId = result.getValue("internalid");
            log.debug("projectId1", projectId);

            var customerId = result.getValue("customer");
            log.debug("customerId", customerId);
            
            var resultObj = {
                projectId: projectId,
                customerId: customerId
            };

            jobSearchArray.push(resultObj);
            return true;
        });

        return jobSearchArray;
    }
	
	function getExistingTimeEntries(jdTimesheetId, jdProjectId, nsEmployeeId) {
		var timebillSearchObj = search.create({
			type: "timebill",
			filters:
			[
				["custcol_jd_timesheet_id","is",jdTimesheetId], 
				"AND",
				["subsidiary","anyof",SUBSIDIARYID_NORWIN],
				"AND",
				["custcol_jd_project_start_id","is",jdProjectId],
				"AND",
				["employee","anyof",nsEmployeeId]
			],
			columns:
			[
				search.createColumn({
					name: "date",
					sort: search.Sort.ASC
				}),
				"custcol_jd_timesheet_id",
				"custcol_jd_project_start_id",
                "custcol_jd_hours_type",
                "custcol_jd_hours_description"
			]
		});
		
		var searchResults = getCompleteSearchResult(timebillSearchObj);
		return searchResults;
	}


	function createJobdivaResponseRecord(dataIn, uniqueId, transactiontypeId, apiName) {
            var recordId = "";
            var objJDRequestRecord = record.create({type: "customrecord_jd_api_response_details"});

            try {
                objJDRequestRecord.setValue({fieldId: "custrecord_jd_json_response", value: JSON.stringify(dataIn)}); 
				objJDRequestRecord.setValue({fieldId: "custrecord_jd_transaction_type", value: transactiontypeId});
				objJDRequestRecord.setValue({fieldId: "name", value: uniqueId});
				objJDRequestRecord.setValue({fieldId: "custrecord_jd_api_name", value: apiName});
				recordId = objJDRequestRecord.save();
            } catch (e) {
                // log.error("error in response record", e);
                objJDRequestRecord.setValue({fieldId: "custrecord_jd_json_response", value: ""}); 
				objJDRequestRecord.setValue({fieldId: "custrecord_jd_transaction_type", value: transactiontypeId});
				objJDRequestRecord.setValue({fieldId: "name", value: uniqueId});
				objJDRequestRecord.setValue({fieldId: "custrecord_jd_api_name", value: apiName});
				recordId = objJDRequestRecord.save();
            }

		    log.debug("recordId ==> ", recordId);

		return recordId;
	}
	
	
	function getFileType(fileType) {
		if (fileType.toLowerCase() == "jpg" || fileType.toLowerCase() == "jpeg" || fileType.toLowerCase() == "jfif" || fileType.toLowerCase() == "pjpeg" || fileType.toLowerCase() == "pjp") {
			return file.Type.JPGIMAGE;
		}

		if (fileType.toLowerCase() == "pdf") {
			return file.Type.PDF;
		}

		if (fileType.toLowerCase() == "pjpg") {
			return file.Type.PJPGIMAGE;
		}

		if (fileType.toLowerCase() == "text") {
			return file.Type.PLAINTEXT;
		}

		if (fileType.toLowerCase() == "zip") {
			return file.Type.ZIP;
		}

        if (fileType.toLowerCase() == "png") {
			return file.Type.PNGIMAGE;
		}
	}


    function getSalesOrderIdByProject(projectId) {
        var salesOrderId = '';

        var searchObj = search.create({
            type: "salesorder",
            filters:
            [
                ["type","anyof","SalesOrd"], 
                "AND", 
                ["name","anyof", projectId], 
                "AND", 
                ["mainline","is","T"]
            ],
            columns:
            [
                search.createColumn({name: "internalid", label: "Internal ID"})				
            ]
        });			
                
        var searchResults = getCompleteSearchResult(searchObj);
        log.debug('lib getEmpIdByJdCandidateId searchResults', searchResults);

        if(searchResults && searchResults.length > 0){
			salesOrderId = searchResults[0].getValue({name: "internalid"});
		}

        log.debug('lib getSalesOrderIdByProject salesOrderId', salesOrderId);
        return salesOrderId;
    }


	function getExistingExpenseReport(nsEmployeeId, jdExpenseId) {
		var expenseReportObj = search.create({
			type: "expensereport",
			filters:
			[
				["custbody_jd_expense_id","is",jdExpenseId], 
				"AND",
				["subsidiary","anyof",SUBSIDIARYID_NORWIN],
				"AND",
				["employee","anyof",nsEmployeeId]
			],
			columns:
			[
				"trandate"
			]
		});

		var searchResults = getCompleteSearchResult(expenseReportObj);
		return searchResults;
	}

    function getBillMaxPeriod(jdBillRateType) {
        var maxPeriod = 1;

        var searchObj = search.create({
            type: "customrecord_jd_billrate_max_period",
            filters:
            [
                ["isinactive","is","F"], 
                "AND",                
                ["custrecord_jd_billrate_type.name","is", jdBillRateType]          
            ],
            columns:
            [
                search.createColumn({name: "custrecord_jd_billrate_max_period", label: "MAX PERIODS"})				
            ]
        });			
                
        var searchResults = getCompleteSearchResult(searchObj);
        log.debug('lib getEmpIdByJdCandidateId searchResults', searchResults);

        if(searchResults && searchResults.length > 0){
			maxPeriod = searchResults[0].getValue({name: "custrecord_jd_billrate_max_period"});
		}

        log.debug('lib getBillMaxPeriod maxPeriod', maxPeriod);
        return maxPeriod;
    }

    function getProjectIdByBillableRate(startId) {
		var ratesSearchObj = search.create({
			type: "customrecord_jd_billable_rates",
			filters:
			[
				["isinactive","is","F"], 
				"AND", 
				["custrecord_jd_start_id","is",startId]
			],
			columns:
			[
				"custrecord_jd_project_ref"
			]
		});

		var searchResults = ratesSearchObj.run().getRange(0, 1);

		if (searchResults && searchResults.length) {
			return (searchResults[0].getValue({"name": "custrecord_jd_project_ref"}));
		}
	}

    function getBillRateTypeByCode(billRateCode) {
        var billRateId = '';

        var searchObj = search.create({
            type: "customrecord_jd_bill_rate_type",
            filters:
            [
               ["custrecord_jd_bill_ratetype_code","is", billRateCode]
            ],
            columns:
            [
               search.createColumn({name: "internalid", label: "Internal ID"})               
            ]
        });

        var searchResults = getCompleteSearchResult(searchObj);
        if(searchResults && searchResults.length > 0){
			billRateId = searchResults[0].getValue({name: "internalid"});
		}
       
        log.debug('lib getBillRateTypeByCode billRateId', billRateId);
        return billRateId;        
    }

    function createOrUpdateCustomer(jdCustomerData, emailDetails) {
        var id = '';
        var customerObj = '';
        var entityId = jdCustomerData.COMPANYNAME + " " + jdCustomerData.ID;
        var terms ='';
        log.debug('lib createOrUpdateCustomer', jdCustomerData);
        //get terms value from data and modify as per netsuite requirements
        try{
            terms = getTermsFromComapanyDetails(jdCustomerData.PAYMENTTERMS);            
        }catch(e){
            log.error('Error in getting terms','')
        }

        if(jdCustomerData.nsCustomerId) {
            customerObj = record.load({type: 'customer', id:jdCustomerData.nsCustomerId, isDynamic: true});
            customerObj.setValue({fieldId: 'customform', value: FORMID_CUSTOMER});
            customerObj.setValue({fieldId: 'subsidiary', value: SUBSIDIARYID_NORWIN});
        }
        else {
            customerObj = record.create({type: 'customer', isDynamic: true});
        }
        customerObj.setValue({fieldId: 'custentity_jd_company_id', value: jdCustomerData.ID});
        customerObj.setValue({fieldId: 'companyname', value: jdCustomerData.COMPANYNAME});

        if(jdCustomerData.EMAIL) customerObj.setValue({fieldId: 'email', value: jdCustomerData.EMAIL});
        if(jdCustomerData.PHONE) customerObj.setValue({fieldId: 'phone', value: jdCustomerData.PHONE});
        if(terms && terms !='NOT_FOUND') customerObj.setValue({fieldId: 'terms', value: terms});

        // Remove Address
        var addressLineCount = customerObj.getLineCount({ sublistId: 'addressbook' });
        for (var a = Number(addressLineCount) - 1; a >= 0; a--) {
            customerObj.removeLine({ sublistId: 'addressbook', line: a, ignoreRecalc: true });
        }

        // Add Address
        if(jdCustomerData.COUNTRY) {
            // Create a line in the Address sublist.
            customerObj.selectNewLine({sublistId: 'addressbook'});

            // Set an optional field on the sublist line.
            customerObj.setCurrentSublistValue({sublistId: 'addressbook', fieldId: 'label', value: 'Primary Address'});

            // Create an address subrecord for the line.
            var addressSubRec = customerObj.getCurrentSublistSubrecord({sublistId: 'addressbook', fieldId: 'addressbookaddress'});
            addressSubRec.setValue({fieldId: 'country', value: jdCustomerData.COUNTRY});
            if(jdCustomerData.CITY) addressSubRec.setValue({fieldId: 'city', value: jdCustomerData.CITY});
            if(jdCustomerData.STATE) addressSubRec.setValue({fieldId: 'state', value: jdCustomerData.STATE});
            if(jdCustomerData.ZIPCODE) addressSubRec.setValue({fieldId: 'zip', value: jdCustomerData.ZIPCODE});
            if(jdCustomerData.ADDRESS1) addressSubRec.setValue({fieldId: 'addr1', value: jdCustomerData.ADDRESS1});
            if(jdCustomerData.ADDRESS2) addressSubRec.setValue({fieldId: 'addr2', value: jdCustomerData.ADDRESS2});

            // Save the address sublist line.
            customerObj.commitLine({sublistId: 'addressbook'});
        }

        try {
            id = customerObj.save();    
        } catch (error) {
            if (error.hasOwnProperty('message')) {
                msg = error.name;
                if (msg == 'UNIQUE_CUST_ID_REQD') {
                    customerObj.setValue({fieldId: 'autoname', value: false});
                    customerObj.setValue({fieldId: 'entityid', value: entityId});
                    id = customerObj.save();
                }
            }
        }
        log.debug('lib createNewCustomer id', id);
        if(terms=='NOT_FOUND'){
            log.debug('Term not found', terms);
            sendTermNotFounfNotification(emailDetails, jdCustomerData.PAYMENTTERMS, id);            
        }  
        return id;
    }
    
    //----------Added by Abhay on 09/25/2024--------------
    function getTermsFromComapanyDetails(termValue){

        log.debug('Searching for term', termValue);
        var termID='';
        if(termValue!=' ' && termValue!='None' && termValue!='Not yet established' && termValue !='Pay Upon receipt' && termValue !='Prepay'){
            termValue = 'Net '+termValue;
        } 
        
        if(termValue){
            var termSearchObj = search.create({
                type: "term",
                filters:
                    [
                        ["name", "is", termValue]
                    ],
                columns:
                    [
                        search.createColumn({ name: "internalid", label: "Internal ID" })
                    ]
            });

            var searchResults = getCompleteSearchResult(termSearchObj);
            if (searchResults && searchResults.length > 0) {
                termID = searchResults[0].getValue({ name: "internalid" });
            }
            else{
                termID = 'NOT_FOUND';
            }
            log.debug('getTerms termId', termID);
        }
        return termID;
    }

    function getVendorIdByJdContractorId(jdContractorId) {
        var vendorId = '';

        var searchObj = search.create({
            type: "vendor",
            filters:
            [
                ["isinactive","is","F"], 
                "AND",
                ["custentity_jd_company_id","is", jdContractorId]
            ],
            columns:
            [
                search.createColumn({name: "internalid", label: "Internal ID"})				
            ]
        });			
                
        var searchResults = getCompleteSearchResult(searchObj);
        log.debug('lib getVendorIdByJdContractorId searchResults', searchResults);

        if(searchResults && searchResults.length > 0){
			vendorId = searchResults[0].getValue({name: "internalid"});
		}
       
        log.debug('lib getVendorIdByJdContractorId vendorId', vendorId);
        return vendorId;
    }

    // Function to check JD Company/Vendor exist, if not create new Vendor
    function getContractorId(jdContractorId,vendCategory) {
        var vendorId;
        var vendorObj = '';

        vendorId = getVendorIdByJdContractorId(jdContractorId);
        log.debug("lib getContractorId", vendorId);

        var jdVendorRes = utils.getJdCompaniesDetail(jdContractorId);         
        log.debug("lib jdVendorRes.data", jdVendorRes.data);
        
        if(!vendorId) {   
            // Create a response record to capture the JD response history.
            var responseRecId = createJobdivaResponseRecord(jdVendorRes, jdContractorId, recordType.VENDOR, "CompaniesDetail");
            log.debug("reduce responseRecId", responseRecId);

            if(jdVendorRes.data.length > 0) {
                log.debug("Creating new vendor record", '');

                vendorObj = record.create({
                    type: 'vendor',
                    isDynamic: true				
                });
                vendorId = createOrUpdateNewVendor(jdVendorRes.data[0],vendorObj,vendCategory,"CREATE");
                log.debug("lib new vendorId", vendorId);

                try {
                    record.submitFields({
                        type: "customrecord_jd_api_response_details",
                        id: responseRecId,
                        values: {
                            "custrecord_jd_entity": vendorId,
                            "custrecord_jd_status": processStatus.PROCESSED,
                            "custrecord_jd_error_details": ""
                        }
                    });
                } catch (e) {
                    log.error("error while updating response record", e);
                }
            }
        }
        else{
            log.debug("Updating Existing vendor record", '');
            vendorObj = record.load({type: record.Type.VENDOR, id:vendorId, isDynamic: true});
            vendorId = createOrUpdateNewVendor(jdVendorRes.data[0],vendorObj,vendCategory,"EDIT");
            log.debug("lib updated vendorId", vendorId);
        }
              
        return vendorId;
    }

    //----------Modified by Abhay on 09/24/2024--------------
    function createOrUpdateNewVendor(jdVendorData,vendorObj,vendCategory,action) {
        var id = '';
        var entityId = jdVendorData.COMPANYNAME + " " + jdVendorData.ID;
        try {
       
        log.debug('lib createOrUpdateNewVendor jdVendorData', jdVendorData);
        log.debug('lib createOrUpdateNewVendor jdVendorData.COMPANYNAME', jdVendorData.COMPANYNAME);

        vendorObj.setValue({fieldId: 'customform', value: FORMID_VENDOR});
        vendorObj.setValue({fieldId: 'subsidiary', value: SUBSIDIARYID_NORWIN});        
        vendorObj.setValue({fieldId: 'custentity_jd_company_id', value: jdVendorData.ID});
        vendorObj.setValue({fieldId: 'companyname', value: jdVendorData.COMPANYNAME});
        if(jdVendorData.EMAIL) vendorObj.setValue({fieldId: 'email', value: jdVendorData.EMAIL});
        if(jdVendorData.PHONE) vendorObj.setValue({fieldId: 'phone', value: jdVendorData.PHONE});
        //----------Modified by Abhay on 10/15/2024--------------
        if(vendCategory) vendorObj.setValue({fieldId: 'category', value: vendCategory});
    
        
        //if(jdVendorData.COUNTRY) {
            //Delete existing address to update with new address (Can be same)
            var vendorAddLineCount = vendorObj.getLineCount({ sublistId: 'addressbook' });
            log.debug('vendorAddLineCount', vendorAddLineCount);
            for (var i = 0; i < vendorAddLineCount; i++) {						
                vendorObj.removeLine({ sublistId: 'addressbook', line: i });
            }
            // Set an optional field on the sublist line.
            vendorObj.setCurrentSublistValue({sublistId: 'addressbook', fieldId: 'label', value: 'Primary Address'});

            // Create an address subrecord for the line.
            var addressSubRec = vendorObj.getCurrentSublistSubrecord({sublistId: 'addressbook', fieldId: 'addressbookaddress'});
            addressSubRec.setValue({fieldId: 'country', value: 'US'});
            if(jdVendorData.CITY) addressSubRec.setValue({fieldId: 'city', value: jdVendorData.CITY});
            if(jdVendorData.STATE) addressSubRec.setValue({fieldId: 'state', value: jdVendorData.STATE});
            if(jdVendorData.ZIPCODE) addressSubRec.setValue({fieldId: 'zip', value: jdVendorData.ZIPCODE});
            if(jdVendorData.ADDRESS1) addressSubRec.setValue({fieldId: 'addr1', value: jdVendorData.ADDRESS1});
            if(jdVendorData.ADDRESS2) addressSubRec.setValue({fieldId: 'addr2', value: jdVendorData.ADDRESS2});

            // Save the address sublist line.
            vendorObj.commitLine({sublistId: 'addressbook'});
        //}         
            try {
                id = vendorObj.save();                
            } catch (error) {
                log.error('lib createNewVendor save error', error);
                if(action=="CREATE"){
                    if (error.hasOwnProperty('message')) {
                        msg = error.name;
                        if (msg == 'UNIQUE_CUST_ID_REQD') {
                            vendorObj.setValue({fieldId: 'autoname', value: false});
                            vendorObj.setValue({fieldId: 'entityid', value: entityId});
                            id = vendorObj.save();
                        }
                    } 
                }
            }                    
        } catch (error) {
            log.error('lib createNewVendor error', error);
        }
        log.debug('lib createNewVendor id', id);

        return id;
    }
    
    //----------Added by Abhay on 09/25/2024--------------
    function updateCustomerProjSync(jdCustomerData, customerId,emailDetails){

        var terms = getTermsFromComapanyDetails(jdCustomerData.PAYMENTTERMS);

        customerObj = record.load({type: 'customer', id:customerId, isDynamic: true});
        customerObj.setValue({fieldId: 'customform', value: FORMID_CUSTOMER});
        customerObj.setValue({fieldId: 'subsidiary', value: SUBSIDIARYID_NORWIN});
        customerObj.setValue({fieldId: 'custentity_jd_company_id', value: jdCustomerData.ID});
        customerObj.setValue({fieldId: 'companyname', value: jdCustomerData.COMPANYNAME});

        if(jdCustomerData.EMAIL) customerObj.setValue({fieldId: 'email', value: jdCustomerData.EMAIL});
        if(jdCustomerData.PHONE) customerObj.setValue({fieldId: 'phone', value: jdCustomerData.PHONE});
        if(terms && terms !='NOT_FOUND') customerObj.setValue({fieldId: 'terms', value: terms});

        // Remove Address
        var addressLineCount = customerObj.getLineCount({ sublistId: 'addressbook' });
        for (var a = Number(addressLineCount) - 1; a >= 0; a--) {
            customerObj.removeLine({ sublistId: 'addressbook', line: a, ignoreRecalc: true });
        }

        // Add Address
        if(jdCustomerData.COUNTRY) {
            // Create a line in the Address sublist.
            customerObj.selectNewLine({sublistId: 'addressbook'});

            // Set an optional field on the sublist line.
            customerObj.setCurrentSublistValue({sublistId: 'addressbook', fieldId: 'label', value: 'Primary Address'});

            // Create an address subrecord for the line.
            var addressSubRec = customerObj.getCurrentSublistSubrecord({sublistId: 'addressbook', fieldId: 'addressbookaddress'});
            addressSubRec.setValue({fieldId: 'country', value: jdCustomerData.COUNTRY});
            if(jdCustomerData.CITY) addressSubRec.setValue({fieldId: 'city', value: jdCustomerData.CITY});
            if(jdCustomerData.STATE) addressSubRec.setValue({fieldId: 'state', value: jdCustomerData.STATE});
            if(jdCustomerData.ZIPCODE) addressSubRec.setValue({fieldId: 'zip', value: jdCustomerData.ZIPCODE});
            if(jdCustomerData.ADDRESS1) addressSubRec.setValue({fieldId: 'addr1', value: jdCustomerData.ADDRESS1});
            if(jdCustomerData.ADDRESS2) addressSubRec.setValue({fieldId: 'addr2', value: jdCustomerData.ADDRESS2});

            // Save the address sublist line.
            customerObj.commitLine({sublistId: 'addressbook'});
        }

        try {
            id = customerObj.save();    
        } catch (error) {
            log.error('lib createNewVendor error', error);            
        } 
        if(terms=='NOT_FOUND'){
            log.debug('Term not found', terms);
            sendTermNotFounfNotification(emailDetails, jdCustomerData.PAYMENTTERMS, id);            
        }       
        log.debug('lib updateCustomer id', id);
        return id;
    }

    return ({
        getEmpIdByJdCandidateId: getEmpIdByJdCandidateId,        
        getCustomerIdByJdCompanyId: getCustomerIdByJdCompanyId,
        getCustomerId: getCustomerId,
        getEmployeeId: getEmployeeId,
        getUserId: getUserId,
        createNewEmployee: createNewEmployee,
        updateEmployee: updateEmployee ,
        createNewCustomer: createNewCustomer,
		getProjectId: getProjectId,
		getExistingTimeEntries: getExistingTimeEntries,
		createJobdivaResponseRecord: createJobdivaResponseRecord,
		getFileType: getFileType,
        getSalesOrderIdByProject: getSalesOrderIdByProject,
		getExistingExpenseReport: getExistingExpenseReport,
        getBillMaxPeriod: getBillMaxPeriod,
        getProjectIdByBillableRate: getProjectIdByBillableRate,
        getBillRateTypeByCode: getBillRateTypeByCode,
        createOrUpdateCustomer: createOrUpdateCustomer,
        createOrUpdateNewVendor: createOrUpdateNewVendor,
        getVendorIdByJdContractorId: getVendorIdByJdContractorId,
        getContractorId: getContractorId,
        updateCustomerProjSync: updateCustomerProjSync
    });
});