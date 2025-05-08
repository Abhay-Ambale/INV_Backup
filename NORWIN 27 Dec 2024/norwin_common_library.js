/* ************************************************************************
 * Company:		Invitra Technologies Pvt.Ltd
 * Author:	    Supriya Gunjal
 * Common Libreary File
 *
 * Version    Date            Author           	  Remarks
 * 1.00       30 Jun 2022    Supriya Gunjal	     Initial Dev
 *
 ***********************************************************************/

/**
 * @NModuleScope Public
 * @NApiVersion 2.x
 */

var runtime;
var record;
var search;
var url;
var format;
var error;

var SUBSIDIARYID_NORWIN = 8;
var FORMID_EMPLOYEE = 68;
var FORMID_CUSTOMER = 69;
var FORMID_PROJECT = 67;
var FORMID_SALESORDER = 193;
var FORMID_TIME = 70;
var FORMID_EXPENSE = 194;
var FORMID_CONTACT = 104;
// var FORMID_VENDOR = 69;
var FORMID_VENDOR = 105;

var TIME_ATTACHMENT_FOLDER = '322043';
var TIME_APPROVE_STATUS = 3;
var FIXED_BID_INTERVAL = 1; // Project type
var TIME_AND_MATERIAL = 2;  // Project type
var EMPLOYMENT_TYPE_DIRECT_HIRE = 3;

var PROJECT_STATUS_PENDIND = 4; // Pending
var PROJECT_STATUS_INPROGRESS = 2; // In-Progress

var EXPENSE_ATTACHMENT_FOLDER = 322045;
var DEFAULT_EXPENSE_CATEGORY = 869;

var PDF_TEMPLATEID_INVOICE = 169;

var TAX_CODE_NORWIN = 14148;

var CUSTOM_FORM_ID_CHECK = 215;
var ACCOUNT_CONTRACTOR_PAYABLES = 894;

var serviceItem = {
	"REG_HOURS": "16175",
	"OT_HOURS": "14149",
	"DT_HOURS": "14150",
	// "Non-Billable": "14151",
	// "Vacation": "14152",
	// "Sick": "14153",
	// "Client Holiday": "14154",
	// "DAILY_COVERED_HOURS": "14356",
    // "Fixed_Amt": "15762"
}

var NORWIN_ITEMS = {          
    'consultingIncomeTime': 16175,
    'projectBasedFlat': 16176,
    'permanantPlacementOnline': 16177
};

var recordType = {
	"TIMESHEET": 1,
	"TIME_ATTACHMENT": 2,
	"PROJECT": 3,
	"EMPLOYEE": 4,
	"CUSTOMER": 5,
	"EXPENSE_REPORT": 6
}

var processStatus = {
	"PROCESSED": 1,
	"FAILED": 2
}

var vendorCategory = {
    "CONSULTANT": "2",
    "INDEPENDANT_CONTRACTOR": "1"
}

define(['N/runtime', 'N/record', 'N/search', 'N/url', 'N/error', 'N/format'], function (runtime1, record1, search1, url1, error1, format1) {
    search = search1;
    record = record1;
    url = url1;
    error = error1;
    runtime = runtime1;
    format = format1;
	
    return {};
});
 
/******************************************* Common Function Starts ****************************************/


/*
* Function definition:  To validate the data & tell a string is NOT empty or not
*/
function validateData (val) {
    if (val != null && val != 'undefined' && val != undefined && val != 'NaN' && val != '' && val != [] && val != {} && val != "0") {
        return true;
    }
    return false;
}
    
/*
* Function definition: To tell a string is empty or not
*/
function isEmpty (str) {
    return (str === null || str === '' || str == undefined || str == 'null' || str == 'undefined');
};

/*
* Function definition: To tell a string is NOT empty or not
*/
function  isNotEmpty (str) {
    return (str != null && str != '' && str != undefined && str != 'null' && str != 'undefined');
};

/*
* Rounds the passed in number (float) to N decimal places, returns float.
*/
function roundToFloat (flNumber, intDecimalPlaces) {
    //Default Decimal Places to 2
    if(isEmpty(intDecimalPlaces)) {
        intDecimalPlaces = 2;
    }
    intDecimalPlaces = parseInt(intDecimalPlaces);
    //Round Number
    flNumber = parseFloat(flNumber);
    if(flNumber == 0) {
        return 0;
    }
    else {
        return Math.round(flNumber * Math.pow(10, intDecimalPlaces)) / Math.pow(10, intDecimalPlaces);
    }
};
    
/*
*  Formats date object as date string
*/
function getDateString (objDate) {			
    if(objDate && typeof objDate === 'object') {
        return format.format({type: format.Type.DATE, value: objDate});
    }
    return objDate;
};

/*
*  Formats date string as date object
*/
function getDateObject (stDate) {			
    if(stDate && typeof stDate === 'string'){
        return format.parse({type: format.Type.DATE, value: stDate});
    }
    return stDate;
};
    
/*
*  Calculates years between two dates
*/
function getYearsBetweenTwoDates (objStartDate, objEndDate) {
    return (objEndDate.getFullYear() - objStartDate.getFullYear());
};

/*
*  Calculates months between two dates
*/
function getMonthsBetweenTwoDays (objStartDate, objEndDate) {
    return (objEndDate.getFullYear() - objStartDate.getFullYear()) * 12 + (objEndDate.getMonth() - objStartDate.getMonth());
};

/*
*	Returns integer number of days between two days
*/
function getDaysBetweenTwoDays (objStartDate, objEndDate) {
    var flOneDayInMilliseconds = 1000 * 60 * 60 * 24;
    var flStartTime = Date.UTC(objEndDate.getFullYear(), objEndDate.getMonth(), objEndDate.getDate());
    var flEndTime = Date.UTC(objStartDate.getFullYear(), objStartDate.getMonth(), objStartDate.getDate());
    return (flStartTime - flEndTime) / flOneDayInMilliseconds;
};

function getTodaysDate() {
    var today = new Date();
    var todayDate = (today.getMonth()+1)+'/'+today.getDate()+'/'+today.getFullYear();

    return todayDate;
}

/*
*	Returns integer number of days in a given month
*/
function getDaysInMonth (objDate) {
    return new Date(objDate.getFullYear(), objDate.getMonth(), 0).getDate();
};
    
/*
*  Creates a global unique identifier
*/
function createGuid () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c)
    {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

/*
*   Replaces all instances of target substring in string with desired value
*/
function replaceAll (str, find, replace) {
    return str.split(find).join(replace);
};

/*
*   Cleans data for CSV
*/
function cleanData (str) {
    if(str) {
        str = replaceAll(str, '\n', '');
        str = replaceAll(str, '\r', '');
        str = replaceAll(str, ',', '');
        str = str.trim();
    }
    return str;
};


function toItemInternalId (stRecordType) {
    var stRecordTypeInLowerCase = stRecordType.toLowerCase().trim();
    switch(stRecordTypeInLowerCase) {
        case 'invtpart':
            return 'inventoryitem';
        case 'description':
            return 'descriptionitem';
        case 'assembly':
            return 'assemblyitem';
        case 'discount':
            return 'discountitem';
        case 'group':
            return 'itemgroup';
        case 'markup':
            return 'markupitem';
        case 'noninvtpart':
            return 'noninventoryitem';
        case 'othcharge':
            return 'otherchargeitem';
        case 'payment':
            return 'paymentitem';
        case 'service':
            return 'serviceitem';
        case 'subtotal':
            return 'subtotalitem';
        case 'giftcert':
            return 'giftcertificateitem';
        case 'dwnlditem':
            return 'downloaditem';
        case 'kit':
            return 'kititem';
        default:
            return stRecordTypeInLowerCase;
    }
};

/*
*  To get all the search results.
*/
function getCompleteSearchResult (savedSearch) {
    try {
        var resultSet = savedSearch.run();
        //log.debug(" resultSet " + JSON.stringify(resultSet));
        
        var resultSubSet = null;
        var index = 0;
        var maxSearchReturn = 1000; // One Batch Size, Max 1000
        var allSearchResults = [];
        var maxResults = 10000; // Maximum no. of records , if mentioned 10 it will return only 10 records
        do {
            var start = index;
            var end = index + maxSearchReturn;
            if (maxResults && maxResults <= end) {
                end = maxResults;
            }
            resultSubSet = resultSet.getRange(start, end);
            //log.debug("resultSubSet Length >>", resultSubSet.length);
            if (resultSubSet == null || resultSubSet.length <= 0) {
                break;
            }

            allSearchResults = allSearchResults.concat(resultSubSet);
            index = index + resultSubSet.length;

            if (maxResults && maxResults == index) {
                break;
            }
        }
        while (resultSubSet.length >= maxSearchReturn);
    } catch (e) {
        log.error({title: "Error getCompleteSearchResult ", details:e}); 
    }

    return allSearchResults;
}

/*
*	Gets Currency Symbols
*/
function getCurrencyInfo (blHideSymbol) {
    var objCurrencyInfo = {
        "": {
            "symbol": "",
            "name": "",
            "symbol_native": "",
            "decimal_digits": 2,
            "rounding": 0,
            "code": "",
            "name_plural": ""
        }
    };
    var arrFilters = [];
    var arrColumns = [];
    arrColumns.push(search.createColumn({name: 'internalid'}));
    arrColumns.push(search.createColumn({name: 'symbol'}));

    var arrCurrencySearchResults = search('currency', null, arrFilters, arrColumns);
    if(arrCurrencySearchResults.length == 0) {
        throw 'Currency has not yet been configured. Contact your administrator.';
    }
    else {
        for(var i = 0; i < arrCurrencySearchResults.length; i++) {
            var stCurrencyId = arrCurrencySearchResults[i].getValue({name: 'internalid'});
            var stCurrencyCode = arrCurrencySearchResults[i].getValue({name: 'symbol'});
            
            if(objCurrencyData[stCurrencyCode]) {
                objCurrencyInfo[stCurrencyId] = objCurrencyData[stCurrencyCode];
                if(blHideSymbol) {
                    objCurrencyInfo[stCurrencyId].symbol = '';
                }
            }
        }
    }
    return objCurrencyInfo;
};

/*
* Round off floating number and appends it with currency symbol
*/
function formatCurrency (flValue, stCurrencySymbol, intDecimalPrecision) {
    //Do not format empty string
    if(isEmpty(flValue)){
        return '';
    }
    else {
        var flAmount = flValue;
        
        if(typeof (flValue) != 'number') {
            flAmount = parseFloat(flValue) || 0;
        }
        var arrDigits = flAmount.toFixed(intDecimalPrecision).split('.');
        arrDigits[0] = arrDigits[0].split('').reverse().join('').replace(/(\d{3})(?=\d)/g, '$1,').split('').reverse().join('');

        return stCurrencySymbol + arrDigits.join('.');
    }
};

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function formatDate(date) {
	var dateString = "";
	var dte = date.split("T")[0];
	var dateArr = dte.split("-");

	if (dateArr.length == 3) {
		var yyyy = dateArr[0];
		var mm = dateArr[1];
		var dd = dateArr[2];
		dateString = mm + "/" + dd + "/" + yyyy;
	}
	
	return dateString;
}

function formatDateParse(date) {
  var dateString = formatDate(date);
  var dateObj = format.parse({value: dateString, type: format.Type.DATE});

  return dateObj;
}

function getBackdatedDate(todayDate, days) {
	return (new Date(todayDate.setDate(todayDate.getDate() - days)));
}

function getBillChecksAmount(contractorBillId) {
    var paidCheckAmount = 0;
    var checkSearchObj = search.create({
        type: "check",
        filters:
        [
            ["type","anyof","Check"], 
            "AND", 
            ["custbody_norwin_contractor_bill","anyof",contractorBillId], 
            "AND", 
            ["status","noneof","Check:V"]
        ],
        columns:
        [
            search.createColumn({name: "debitamount", summary: "SUM",label: "Amount (Debit)"})
        ]
    });

    checkSearchObj.run().each(function(result){
        paidCheckAmount = result.getValue({name: "debitamount", summary: "SUM",label: "Amount (Debit)"});
        return true;
    });

    return paidCheckAmount;
}