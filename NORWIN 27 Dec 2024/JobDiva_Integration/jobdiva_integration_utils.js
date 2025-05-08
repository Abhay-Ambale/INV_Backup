/* ******************************************************************************************
 * Company:		Invitra Technologies Pvt.Ltd
 * Author:	    Supriya Gunjal
 * FileName:    jobdiva_integration_utils.js
 * 
 *
 * Version    Date            Author           	  Remarks
 * 1.00       20 Nov 2023    Supriya Gunjal	     Initial Version
 *
 ********************************************************************************************/
/**
 * @NApiVersion 2.0
 */


define(['N/record', 'N/search', 'N/runtime', 'N/format', 'N/https', 'N/error'], function(record, search, runtime, format, https, error) {
    
    var JOBDIVA_URL = 'https://api.jobdiva.com';
    var JOBDIVA_CLIENTID = 2548;
    var JOBDIVA_USERNAME = 'supriya@invitratech.com';
    var JOBDIVA_PASSWORD = 'J*p2leO4>F';

    function getAuthHeader() {
        //var tokenKey = getAuthorizationKey();        
        var currScript = runtime.getCurrentScript();
        var tokenKey = currScript.getParameter({name: 'custscript_jd_access_token'});
        log.debug("utils getAuthHeader tokenKey", tokenKey);

        return {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + tokenKey,
            "Accept": "application/json",
            "access-control-allow-headers": "*",
        };
    }


    // Get the Autherization Key to call the JobDiva API's
    function getAuthorizationKey() {
        // encode parameters        
        var authParams = 'clientid='+JOBDIVA_CLIENTID+'&username='+JOBDIVA_USERNAME+'&password='+JOBDIVA_PASSWORD;
        var encodeAuthParams = encodeURI(authParams);
        
        var authResponse = https.get({
            url: JOBDIVA_URL + '/apiv2/authenticate?' + encodeAuthParams,
            headers: {
                'Accept': 'application/json',
            }
        });

        log.debug('utils authResponse', authResponse);
        if (authResponse.code == 200) {
            var authResponseBody = authResponse.body;
            return authResponseBody;
        } else {
            throw error.create({ name: 'AUTHCONNECTION_API_ERROR', message: authResponse.message });
        }
    }


    // Get new Approved Assignments from JobDiva
    function getJdNewApprovedBillingRecords(fromDate, toDate) {
        var params = 'fromDate='+fromDate+'&toDate='+toDate;
        var encodeParams = encodeURI(params);

        //log.debug("utils befor call common funct", params);
        var fromDate = getTodaysDate();
        //log.debug("utils call common funct", fromDate);

        var headers = getAuthHeader();
        var jdResponse = https.get({
            url: JOBDIVA_URL + '/apiv2/bi/NewApprovedBillingRecords?' + encodeParams,
            headers: headers
        });

        log.debug('utils jdResponse', jdResponse);
        if (jdResponse.code == 200) {           
            return JSON.parse(jdResponse.body);
        } else {
            throw error.create({ name: 'AUTHCONNECTION_API_ERROR', message: jdResponse.message });
        }
    }

    // Get new updated Assignments from JobDiva
    function getJdNewUpdatedBillingRecords(fromDate, toDate) {
        var params = 'fromDate='+fromDate+'&toDate='+toDate;
        var encodeParams = encodeURI(params);

        //log.debug("utils befor call common funct", params);
        var fromDate = getTodaysDate();
        //log.debug("utils call common funct", fromDate);

        var headers = getAuthHeader();
        var jdResponse = https.get({
            url: JOBDIVA_URL + '/apiv2/bi/NewUpdatedBillingRecords?' + encodeParams,
            headers: headers
        });

        log.debug('utils jdResponse', jdResponse);
        if (jdResponse.code == 200) {           
            return JSON.parse(jdResponse.body);
        } else {
            throw error.create({ name: 'AUTHCONNECTION_API_ERROR', message: jdResponse.message });
        }
    }

    // Get Billing / Assignment record of an employee from JobDiva
    function getJdEmployeeBillingRecordsDetail(jdEmployeeId) {
        var params = 'employeeId='+jdEmployeeId;
        var encodeParams = encodeURI(params);

        var headers = getAuthHeader();
        var jdResponse = https.get({
            url: JOBDIVA_URL + '/apiv2/bi/EmployeeBillingRecordsDetail?' + encodeParams,
            headers: headers
        });

        log.debug('utils getJdEmployeeBillingRecordsDetail jdResponse', jdResponse);        
        if (jdResponse.code == 200) {           
            return JSON.parse(jdResponse.body);
        } else {
            throw error.create({ name: 'EmployeeBillingRecordsDetail_API_ERROR', message: jdResponse.message });
        }
    }


    // Get JobDiva Employee/Candidate details
    function getJdCandidateDetail(jdCandidateId) {
        var params = 'candidateId='+jdCandidateId;
        var encodeParams = encodeURI(params);
        
        var headers = getAuthHeader();
        var jdResponse = https.get({
            url: JOBDIVA_URL + '/apiv2/bi/CandidateDetail?' + encodeParams,
            headers: headers
        });

        log.debug('utils getJdCandidateDetail jdResponse', jdResponse);
        if (jdResponse.code == 200) {           
            return JSON.parse(jdResponse.body);
        } else {
            throw error.create({ name: 'CandidateDetail_API_ERROR', message: jdResponse.message });
        }
    }
    
    // Get JobDiva Employee/User details
    function getJdUserDetail(jdUserId) {
        var params = 'userId='+jdUserId;
        var encodeParams = encodeURI(params);
        
        var headers = getAuthHeader();
        var jdResponse = https.get({
            url: JOBDIVA_URL + '/apiv2/bi/UserDetail?' + encodeParams,
            headers: headers
        });

        log.debug('utils getJdUserDetail jdResponse', jdResponse);
        if (jdResponse.code == 200) {           
            return JSON.parse(jdResponse.body);
        } else {
            throw error.create({ name: 'UserDetail_API_ERROR', message: jdResponse.message });
        }
    }

	// Get new Approved Timesheet from JobDiva
    function getJdNewUpdatedApprovedTimesheetRecords(fromDate, toDate) {
        var params = 'fromDate='+fromDate+'&toDate='+toDate;
        var encodeParams = encodeURI(params);
        var headers = getAuthHeader();

        var jdResponse = https.get({
            url: JOBDIVA_URL + '/apiv2/bi/NewUpdatedApprovedTimesheetRecords?' + encodeParams,
            headers: headers
        });
        log.debug('utils jdResponse', jdResponse);

        if (jdResponse.code == 200) {           
            return JSON.parse(jdResponse.body);
        } else {
            throw error.create({ name: 'AUTHCONNECTION_API_ERROR', message: jdResponse.message });
        }
    }


	function getJdTimesheetDetailAllHours(timesheetId) {
        var params = 'timesheetIds='+timesheetId;
        var encodeParams = encodeURI(params);
        var headers = getAuthHeader();

        var jdResponse = https.get({
            url: JOBDIVA_URL + '/apiv2/bi/TimesheetDetailAllHours?' + encodeParams,
            headers: headers
        });
        log.debug('utils jdResponse', jdResponse);

        if (jdResponse.code == 200) {
            return JSON.parse(jdResponse.body);
        } else {
            throw error.create({ name: 'AUTHCONNECTION_API_ERROR', message: jdResponse.message });
        }
    }


	function getEmployeeTimesheetImagebyTimecardIDDetail(employeeId, timesheetId) {
        var params = 'employeeId='+employeeId+'&timeCardId='+timesheetId+'&alternateFormat=true';
        var encodeParams = encodeURI(params);
        var headers = getAuthHeader();

        var jdResponse = https.get({
            url: JOBDIVA_URL + '/api/bi/EmployeeTimesheetImagebyTimecardIDDetail?' + encodeParams,
            headers: headers
        });
        log.debug('utils jdResponse', jdResponse);

        if (jdResponse.code == 200) {
            return JSON.parse(jdResponse.body);
        } else {
            throw error.create({ name: 'AUTHCONNECTION_API_ERROR', message: jdResponse.message });
        }
    }
	
	
	function getJdNewUpdatedExpenseRecords(fromDate, toDate) {
		var params = 'fromDate='+fromDate+'&toDate='+toDate+'&status=APPROVED';
        var encodeParams = encodeURI(params);
        var headers = getAuthHeader();

        var jdResponse = https.get({
            url: JOBDIVA_URL + '/apiv2/bi/NewUpdatedExpenseRecords?' + encodeParams,
            headers: headers
        });
        log.debug('utils jdResponse', jdResponse);

        if (jdResponse.code == 200) {           
            return JSON.parse(jdResponse.body);
        } else {
            throw error.create({ name: 'AUTHCONNECTION_API_ERROR', message: jdResponse.message });
        }
	}
	
	
	function getJdExpensesDetailExpanded(jdExpenseId) {
        var params = 'expenseIds='+jdExpenseId;
        var encodeParams = encodeURI(params);
        var headers = getAuthHeader();

        var jdResponse = https.get({
            url: JOBDIVA_URL + '/apiv2/bi/ExpensesDetailExpanded?' + encodeParams,
            headers: headers
        });
        log.debug('utils jdResponse', jdResponse);

        if (jdResponse.code == 200) {
            return JSON.parse(jdResponse.body);
        } else {
            throw error.create({ name: 'AUTHCONNECTION_API_ERROR', message: jdResponse.message });
        }
    }

    // Get new updated Assignments from JobDiva
    function getJdNewUpdatedCompanyRecords(fromDate, toDate) {
        var params = 'fromDate='+fromDate+'&toDate='+toDate;
        var encodeParams = encodeURI(params);

        var headers = getAuthHeader();
        var jdResponse = https.get({
            url: JOBDIVA_URL + '/apiv2/bi/NewUpdatedCompanyRecords?' + encodeParams,
            headers: headers
        });

        log.debug('utils jdResponse', jdResponse);
        if (jdResponse.code == 200) {           
            return JSON.parse(jdResponse.body);
        } else {
            throw error.create({ name: 'AUTHCONNECTION_API_ERROR', message: jdResponse.message });
        }
    }
    
    // Get Company Detail
    function getJdCompanyDetail(jdComanyId) {
        var params = 'companyId='+jdComanyId;
        var encodeParams = encodeURI(params);
        
        var headers = getAuthHeader();
        var jdResponse = https.get({
            url: JOBDIVA_URL + '/apiv2/bi/CompanyDetail?' + encodeParams,
            headers: headers
        });

        log.debug('utils getJdCompanyDetail jdResponse', jdResponse);
        if (jdResponse.code == 200) {           
            return JSON.parse(jdResponse.body);
        } else {
            throw error.create({ name: 'CompanyDetail_API_ERROR', message: jdResponse.message });
        }
    }

    // Get new updated Assignments Pay from JobDiva
    function getJdNewUpdatedSalaryRecords(fromDate, toDate) {
        var params = 'fromDate='+fromDate+'&toDate='+toDate;
        var encodeParams = encodeURI(params);

        //log.debug("utils befor call common funct", params);
        var fromDate = getTodaysDate();
        //log.debug("utils call common funct", fromDate);

        var headers = getAuthHeader();
        var jdResponse = https.get({
            url: JOBDIVA_URL + '/apiv2/bi/NewUpdatedSalaryRecords?' + encodeParams,
            headers: headers
        });

        log.debug('utils jdResponse', jdResponse);
        if (jdResponse.code == 200) {           
            return JSON.parse(jdResponse.body);
        } else {
            throw error.create({ name: 'AUTHCONNECTION_API_ERROR', message: jdResponse.message });
        }
    }
    
    // Get Billing / Assignment record of an employee from JobDiva
    function getJdEmployeeSalaryRecordsDetail(jdEmployeeId) {
        var params = 'employeeId='+jdEmployeeId;
        var encodeParams = encodeURI(params);

        var headers = getAuthHeader();
        var jdResponse = https.get({
            url: JOBDIVA_URL + '/apiv2/bi/EmployeeSalaryRecordsDetail?' + encodeParams,
            headers: headers
        });

        log.debug('utils getJdEmployeeSalaryRecordsDetail jdResponse', jdResponse);        
        if (jdResponse.code == 200) {           
            return JSON.parse(jdResponse.body);
        } else {
            throw error.create({ name: 'EmployeeSalaryRecordsDetail_API_ERROR', message: jdResponse.message });
        }
    }
	
	// Get Contact Detail
    function getJdContactDetail(jdContactIds) {
		var params = "";

		if (jdContactIds && jdContactIds.length > 1) {
			params = 'contactIds='+jdContactIds[0];

			for (var i = 1 ; i < jdContactIds.length; i++) {
				params += '&contactIds='+jdContactIds[i];
			}
		} else if (jdContactIds && jdContactIds.length == 1) {
			params = 'contactIds='+jdContactIds[0];
		}

        var encodeParams = encodeURI(params);
        var headers = getAuthHeader();
        var jdResponse = https.get({
            url: JOBDIVA_URL + '/apiv2/bi/ContactsDetail?' + encodeParams,
            headers: headers
        });

        log.debug('utils getJdCompanyDetail jdResponse', jdResponse);
        if (jdResponse.code == 200) {           
            return JSON.parse(jdResponse.body);
        } else {
            throw error.create({ name: 'CompanyDetail_API_ERROR', message: jdResponse.message });
        }
    }
	
	
	function getJdEmployeeBillingContactDetail(jdEmployeeId) {
		var params = 'candidateIds='+jdEmployeeId;
        var encodeParams = encodeURI(params);

        var headers = getAuthHeader();
        var jdResponse = https.get({
            url: JOBDIVA_URL + '/apiv2/bi/EmployeesBillingContacts?' + encodeParams,
            headers: headers
        });

        log.debug('utils getJdEmployeeSalaryRecordsDetail jdResponse', jdResponse);        
        if (jdResponse.code == 200) {           
            return JSON.parse(jdResponse.body);
        } else {
            throw error.create({ name: 'EmployeeSalaryRecordsDetail_API_ERROR', message: jdResponse.message });
        }
	}

    // Get JobDiva Vendor details
    function getJdCompaniesDetail(jdCompanyId) {
        var params = 'companyIds='+jdCompanyId;
        var encodeParams = encodeURI(params);
        
        var headers = getAuthHeader();
        var jdResponse = https.get({
            url: JOBDIVA_URL + '/apiv2/bi/CompaniesDetail?' + encodeParams,
            headers: headers
        });

        log.debug('utils getJdCompaniesDetail jdResponse', jdResponse);
        if (jdResponse.code == 200) {           
            return JSON.parse(jdResponse.body);
        } else {
            throw error.create({ name: 'CompaniesDetail_API_ERROR', message: jdResponse.message });
        }
    }

    return ({
        getAuthHeader: getAuthHeader,
        getAuthorizationKey: getAuthorizationKey,        
        getJdNewApprovedBillingRecords: getJdNewApprovedBillingRecords,
        getJdNewUpdatedBillingRecords: getJdNewUpdatedBillingRecords,
        getJdCandidateDetail: getJdCandidateDetail,
        getJdEmployeeBillingRecordsDetail: getJdEmployeeBillingRecordsDetail,
		getJdNewUpdatedApprovedTimesheetRecords: getJdNewUpdatedApprovedTimesheetRecords,
		getJdTimesheetDetailAllHours: getJdTimesheetDetailAllHours,
		getEmployeeTimesheetImagebyTimecardIDDetail: getEmployeeTimesheetImagebyTimecardIDDetail,
		getJdNewUpdatedExpenseRecords: getJdNewUpdatedExpenseRecords,
		getJdExpensesDetailExpanded: getJdExpensesDetailExpanded,
        getJdUserDetail: getJdUserDetail,
        getJdNewUpdatedCompanyRecords: getJdNewUpdatedCompanyRecords,
        getJdCompanyDetail: getJdCompanyDetail,
        getJdNewUpdatedSalaryRecords: getJdNewUpdatedSalaryRecords,
        getJdEmployeeSalaryRecordsDetail: getJdEmployeeSalaryRecordsDetail,
		getJdContactDetail: getJdContactDetail,
		getJdEmployeeBillingContactDetail: getJdEmployeeBillingContactDetail,
        getJdCompaniesDetail: getJdCompaniesDetail
    });    
});