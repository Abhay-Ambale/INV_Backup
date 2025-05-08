var EXTERNAL_BASEPATH		= 'https://forms.eu2.netsuite.com';

// Transactions Custom Approval Status
var PENDING_APPROVAL	= 1;
var APPROVED			= 2;
var REJECTED			= 3;

// Item Approval Status
var PENDING_APPROVAL_AM	= 1;
var PENDING_APPROVAL_FM	= 2;
var APPROVED_ITEM		= 3;
var REJECTED_AM			= 4;
var REJECTED_FM			= 5;

// Order Category
var ORDER_CAT_ONLINE		= 1;
var ORDER_CAT_PROMOTIONAL	= 2;
var ORDER_CAT_TRADING		= 3;

// Roles
var ROLE_CUSTOMER_SERVICE_MANAGER = 1099;


// Forms
var FRM_PO_SG_DEFAULT	= 130;
var FRM_PO_IC_MAGNUM 	= 192;

// Subsidiary
var SUBSID_MAGNUM		= 4;

// location
var LOC_MAGNUM			= 118;

// Taxcode
var TAXCODE_SINGAPORE	= '13775';
//************ Start : Get Logged In User Role Id***********************//
function _getLoggedInUserRoleId()
{
	var context		= '';

	context			= nlapiGetContext();

	return context.getRole();
}//function _getLoggedInUserRoleIdId()

function _enableDisableFields(fldIdArr, val)
{
	var i = 0;
	if(_validateData(fldIdArr) && fldIdArr.length > 0)
	{
		for(i = 0; i < fldIdArr.length; i++)
		{
			nlapiDisableField(fldIdArr[i], val);
		}
	}//if(_validateData(fldIdArr) && fldIdArr.length > 0)
}//function _enableDisableFields(fldIdArr, val)


function _enableDisableLineLevelFields(type, fldIdArr, val)
{
	var i = 0;
	if(_validateData(type) && _validateData(fldIdArr) && fldIdArr.length > 0)
	{
		for(i = 0; i < fldIdArr.length; i++)
		{
			nlapiDisableLineItemField(type, fldIdArr[i], val);
		}
	}//if(_validateData(type) && _validateData(fldIdArr) && fldIdArr.length > 0)
}//function _enableDisableLineLevelFields(type, fldIdArr, val)
//************ End : Enable / Disable the fields***********************//


//************ Start : Set field value to blank used in client script***********************//
function _setFieldValueBlank(fldIdArr)
{
	var i = 0;
	if(_validateData(fldIdArr) && fldIdArr.length > 0)
	{
		for(i = 0; i < fldIdArr.length; i++)
		{
			if(_validateData(fldIdArr[i]))
			{
				nlapiSetFieldValue(fldIdArr[i], '');
			}
		}//for
	}//if(_validateData(fldIdArr) && fldIdArr.length > 0)
}//function _setFieldValueBlank(fldIdArr)

function _setLineLevelFieldValueBlank(type, fldIdArr)
{
	var i = 0;
	if(_validateData(type) && _validateData(fldIdArr) && fldIdArr.length > 0)
	{
		for(i = 0; i < fldIdArr.length; i++)
		{
			if(_validateData(fldIdArr[i]))
			{
				nlapiSetCurrentLineItemValue(type, fldIdArr[i], '');
			}
		}//for
	}//if(_validateData(type) && _validateData(fldIdArr) && fldIdArr.length > 0)
}//function _setLineLevelFieldValueBlank(type, fldIdArr))
//************ End : Set field value to blank used in client script***********************//


//************ Start : Get & Set default location configured in accounting preferences***********************//
function _getDefaultLocation()
{
	var url					= '';
	var responseObj			= '';
	var slScriptId			= 'customscript_vst_get_value_permission_sl';
	var slScriptDeployId	= 'customdeploy_vst_get_value_permission_sl';
	var	configFieldValue	= '';

	url = nlapiResolveURL('SUITELET', slScriptId, slScriptDeployId);
	url += '&type=accountingpreferences';
	url += '&name=DEFAULTPURCHORDERLOCATION';
	responseObj = nlapiRequestURL(url, null, null, null);

	if(responseObj != null && responseObj != '')
	{
		configFieldValue = responseObj.getBody();
	}

	if(!_validateData(configFieldValue))
	{
		configFieldValue	= VST_SIALKOT_LOCATION_ID;
	}//if(!_validateData(configItem))

	return configFieldValue;
}//function _getDefaultLocation()


function _setBodyLevelDefaultLocation()
{
	var defaultLocation	= '';

	if(_validateData(nlapiGetField('location')))
	{
		defaultLocation	= _getDefaultLocation();
		if(_validateData(defaultLocation))
		{
			nlapiSetFieldValue('location', defaultLocation);
		}
	}//if(_validateData(nlapiGetField('location')))
}//function _setBodyLevelDefaultLocation()


function _setLineLevelDefaultLocation(type, linenum)
{
	var defaultLocation	= '';

	if(_validateData(nlapiGetLineItemField(type, 'location', linenum)))
	{
		if(_validateData(nlapiGetField('location')))
		{
			defaultLocation	= nlapiGetFieldValue('location');
			if(!_validateData(defaultLocation))
			{
				defaultLocation	= _getDefaultLocation();
			}
		}
		else
		{
			defaultLocation	= _getDefaultLocation();
		}

		if(_validateData(defaultLocation))
		{
			nlapiSetCurrentLineItemValue(type, 'location', defaultLocation);
			if(_validateData(nlapiGetField('location')) && !_validateData(nlapiGetFieldValue('location')))
			{
				nlapiSetFieldValue('location', defaultLocation);
			}
		}//if(_validateData(defaultLocation))
	}//if(_validateData(nlapiGetLineItemField(type, 'location', linenum)))
}//function _setLineLevelDefaultLocation()
//************ End : Get & Set default location configured in accounting preferences***********************//


//************ Start : Get Select Options from list field***********************//
function _getListOptions(recordType, recordId, fieldId)
{
	var recordObj	= '';
	var fldObj		= '';
	var options		= new Array();

	recordObj		= nlapiLoadRecord(recordType,recordId);
	fldObj			= recordObj.getField(fieldId);

	if(_validateData(fldObj))
	{
		options		= fldObj.getSelectOptions();
		return options;
	}
	return null;
}//function _getListOptions(recordType, recordId, fieldId)
//************ End : Get Select Options from list field***********************//


// Function is used to get date in proper format
function getDateFormat(dateformat,currdate){
	var getDate 	= '';
	var day 		= '';
 	var month 		= '';
 	var Finalyr 	= '';
	var FinalDate	= '';
	var FinalDate1	= '';
	var FinalDay	= '';
	var Finalmonth  = '';
	var Finalyr		= '';
	var date1		= '';
	var splitarr	= new Array();

	if(dateformat == 'DDMMYY')
		{
			// getDate 	= nlapiStringToDate(currdate,'datetime');
			 getDate 	= currdate;
			// nlapiLogExecution('debug','getDate',getDate);
			 date1 		= getDate.replace(/\//g, "-");
			// date1 = date1.substring(0, str.length - 2);
			 splitarr = date1.split("-");
			 if(splitarr!= null && splitarr.length > 0)
				 {
				 	var day 			= splitarr[0];
				 	var month 			= splitarr[1];
					
					if(_validateData(splitarr[2]))
					{
						Finalyr = splitarr[2].substr(2);
					}
				

				 	if(day != null)
				 	{
				 		if(day.length == 1)
				 			{
				 				 FinalDay = '0'+day;
				 			}
				 		else
				 			{
				 				 FinalDay = day;
				 			}

				 	}

				 	if(month != null)
				 	{
				 		if(month.length == 1)
				 			{
				 				 Finalmonth = '0'+month;
				 			}
				 		else
				 			{
				 				 Finalmonth = month;
				 			}

				 	}


				 	 FinalDate 		= FinalDay+Finalmonth+Finalyr;
				 	 FinalDate1 	= FinalDate.replace(/-/g, "");

				 }



		}

	return FinalDate1;

}//function getDateFormat(dateformat,currdate){


/**
* To get Config Parameters from the system
*/
function getRecordFieldValue(recType,recId, fieldNm)
{
   var recObj = "";
   recObj = nlapiLoadRecord(recType, recId);
   return recFieldValue = recObj.getFieldValue(fieldNm);
}


/**
* Common function which will be used to get child level category cnt
* and Child level categories of the category selected in Item record.
* e.g. Cat Type = (DM, IMMfg and  IM-NonMfg)
*/
function getCategoryLevels(recTypeVal, catId, catLevel)
{
   if(catId != '' && catId != null)
   {
      //var parentId = nlapiLookupField('customrecord_vst_direct_matl_category', catId, 'parent');
	  var parentId = nlapiLookupField(recTypeVal, catId, 'parent');
      //alert("parent of parent :: "+parentId);
      catLevel++;
	  if(parentId != '' && parentId != null)
      {
	     return getCategoryLevels(recTypeVal, parentId, catLevel);
	  }
	  else
      {
        //newCatLevel = catLevel;
        //alert(" Cat level in else : "+catLevel+ " And New cat level :: " +newCatLevel);
        return catLevel;

      }

   } // catId != ''

}  // getCategoryLevels


//*************START : OTHER FUNCTIONS**************//

// Function is used to validate data
function _validateData(data)
{
	if (data != null && data != 'undefined' && data != '' && data != NaN) {
		return true;
	}
	return false;
}//function _validateData(data)

// Function is used to find empty string



function isEmpty( inputStr )
{
	if ( null == inputStr || "" == inputStr )
	{
		return true;
	}
	return false;
}//function isEmpty( inputStr )

// Function is used to find unquie array

function array_unique (origArr) {
    var newArr = [],
    origLen = origArr.length,
    found,
    x, y;
	//nlapiLogExecution('debug','origArr.length==>>',origArr.length);

	for ( x = 0; x < origLen; x++ ) {
		//nlapiLogExecution('debug','origArr[x]==>>',origArr[x]);
		found = undefined;
		for ( y = 0; y < newArr.length; y++ ) {
			if ( origArr[x] === newArr[y] ) {
			  found = true;
			  break;
			}
		}
		if ( !found) newArr.push( origArr[x] );

	}

return newArr;
};

// Function is used to find unique values from two array
function arraysAreIdentical(arr, arr2){
	var unique = [];
	for(var i = 0; i < arr.length; i++){
	    var found = false;
	    for(var j = 0; j < arr2.length; j++){
	     if(arr[i] == arr2[j]){
	      found = true;
	      break;
	    }
	   }
	    if(found == false){
	 	   unique.push(arr[i]);
	 	  }
	}

	return unique;
	}

// Function is used in paging
function numRows(obj)
{
	var ctr = 0;
	for (var k in obj)
	{
		if (obj.hasOwnProperty(k))
		{
			ctr++;
		}
	}
	return ctr;
}//function numRows(obj)


// Function used in paging
function getRange(page, displayPerPage, RecordCount)
{
 	var arrTable = [];
	var min = 0;
	var max = parseInt(displayPerPage);
	var pages = Math.ceil(RecordCount / max);

	for (var i = 0; i < pages; i++)
	{
		arrTable[i] = [];
		arrTable[i][0] = min;
		arrTable[i][1] = max;

		min = min + parseInt(displayPerPage);
		max = max + parseInt(displayPerPage);
	}
	return arrTable[page - 1];
}
// Function is used to find parameter value from URL

function gup( name )
{
	name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	var regexS = "[\\?&]"+name+"=([^&#]*)";
	var regex = new RegExp( regexS );
	var results = regex.exec( window.location.href );
	if( results == null )
		return "";
	else
		return results[1];
}

function gqp( name, queryString )
{
	name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	var regexS = "[\\?&]"+name+"=([^&#]*)";
	var regex = new RegExp( regexS );
	var results = regex.exec( queryString );
	if( results == null )
		return "";
	else
		return results[1];
}

function _getItemType(currlineItemId)
{
	var itemType = '';

	if(_validateData(currlineItemId))
	{
		itemType = nlapiLookupField('item', currlineItemId, 'type');
	}//if(_validateData(currlineItemId))

	//alert('itemType===>>'+itemType);
	return itemType;
}//function _getItemType(currlineItemId)



function toItemRecordInternalId(stRecordType)
{
    if (isEmpty(stRecordType))
    {
        throw nlapiCreateError('10003', 'Item record type should not be empty.');
    }

    var stRecordTypeInLowerCase = stRecordType.toLowerCase().trim();

    var itemStr    =  stRecordTypeInLowerCase.replace(/\s+/g, '');

    switch (itemStr)
    {
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
        case 'DwnLdItem':
            return 'downloaditem';
        case 'GiftCert':
            return 'giftcertificateitem';
        case 'Kit':
            return 'kititem';
        default:
            return itemStr;
    }//switch (itemStr)
}//function toItemRecordInternalId(stRecordType)
//*************END : OTHER FUNCTIONS**************//


//*************START : AMOUNT IN WORDS CONVERSION FUNCTIONS**************//
function getAmtInWords(total, currencyId, ISOCode)
{
	var data = '';
	var str = "";
	var str1 = "";
	var word = "";

	if(_validateData(total))
	{
		data = total.toString().split(".");
	
		if(currencyId == 1 && ISOCode == 'PKR')		//If currency is Pakistan Rupee & ISOCode is PKR
		{
			//str = "	Pakistani Rupees " + convert_number(data[0]);
			//Above Line Commented on 10th May 2017 as Decision took by Kiran Sir while Execution PDF is Going on After Visions Feedback on PDF.
			str = "	Pakistan Rupees " + convert_number(data[0]);
			if(Number(data[1]) > 0)
			{
				str1 = " and Paise " + convert_number(data[1]);
			}
		}
		else if(currencyId == 2 && ISOCode == 'USD')	//If currency is US Dollar & ISOCode is USD
		{
			str = "US Dollars " + convert_number(data[0]);
			if(Number(data[1]) > 0)
			{
				str1 = " and Cents " + convert_number(data[1]);
			}
		}
		else if(currencyId == 3 && ISOCode == 'CAD')	// If currency is Canadian Dollar & ISOCode is CAD
		{
			str = "Canadian Dollars " + convert_number(data[0]);
			if(Number(data[1]) > 0)
			{
				str1 = " and Cents " + convert_number(data[1]);
			}
		}
		else if(currencyId == 4 && ISOCode == 'EUR')	//If currency is Euro & ISOCode is EUR
		{
			str = "Euros " + convert_number(data[0]);
			if(Number(data[1]) > 0)
			{
				str1 = " and Cents " + convert_number(data[1]);
			}
		}
		else if(currencyId == 5 && ISOCode == 'GBP')	//If currency is British pound & ISOCode is GBP
		{
			str = "British Pounds " + convert_number(data[0]);
			if(Number(data[1]) > 0)
			{
				str1 = " and Pence " + convert_number(data[1]);
			}
		}
		else if(currencyId == 6 && ISOCode == 'SGD')	//If currency is Singapore Dollar & ISOCode is SGD
		{
			str = "Singapore Dollars " + convert_number(data[0]);
			if(Number(data[1]) > 0)
			{
				str1 = " and Cents " + convert_number(data[1]);
			}
		}
		/*else if(currencyId == 6 && ISOCode == 'JPY')	//If currency is JPY
		{
			str = "Japanese Yen " + convert_number(data[0]);
			if(Number(data[1]) > 0)
			{
				str1 = " and Sen " + convert_number(data[1]);
			}
		}
		else if(currencyId == 7 && ISOCode == 'CNY')	//If currency is CNY
		{
			str = "Chinese Yuan " + convert_number(data[0]);
			if(Number(data[1]) > 0)
			{
				str1 = " and Fen " + convert_number(data[1]);	//jiao
			}
		}
		else if(currencyId == 8 && ISOCode == 'HKD')	//If currency is HKD
		{
			str = "Hong Kong Dollars " + convert_number(data[0]);
			if(Number(data[1]) > 0)
			{
				str1 = " and Cents " + convert_number(data[1]);
			}
		}*/

		word = str + str1;

		nlapiLogExecution('Debug', 'word==>>', word);
	
	}
	return word;
	//nlapiLogExecution('DEBUG','results','data ='+data[0]);

	
}//function getAmtInWords(total, currencyId, ISOCode)

function convert_number(number)
{
    if ((number < 0) || (number > 999999999))
	{
          return "Number is out of range";
    }//if ((number < 0) || (number > 999999999))

    var Gn = Math.floor(number / 10000000);  /* Crore */
    number -= Gn * 10000000;
    var kn = Math.floor(number / 100000);     /* lakhs */
    number -= kn * 100000;
    var Hn = Math.floor(number / 1000);      /* thousand */
    number -= Hn * 1000;
    var Dn = Math.floor(number / 100);       /* Tens (deca) */
    number = number % 100;               /* Ones */
    var tn= Math.floor(number / 10);
    var one=Math.floor(number % 10);
    var res = "";

    if(Gn>0)
	{
        res += (convert_number(Gn) + " Crore");
    }
    if(kn>0)
	{
        res += (((res=="") ? "" : " ") +
        convert_number(kn) + " Lakhs");
    }
    if(Hn>0)
	{
        res += (((res=="") ? "" : " ") +
        convert_number(Hn) + " Thousand");
    }
    if(Dn)
	{
        res += (((res=="") ? "" : " ") +
        convert_number(Dn) + " Hundred");
    }

    var ones = Array("", "One", "Two", "Three", "Four", "Five", "Six","Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen","Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen","Nineteen");
    var tens = Array("", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty","Seventy", "Eighty", "Ninety");

    if (tn>0 || one>0)
	{
        if (!(res==""))
		{
            //res += " and ";
			res += " ";
        }
        if (tn < 2)
		{
            res += ones[tn * 10 + one];
        }
        else
		{
            res += tens[tn];
            if (one>0)
			{
                res += ("-" + ones[one]);
            }
        }
    }//if (tn>0 || one>0)

    if (res=="")
    {
        res = "zero";
    }
    return res;
}//function convert_number(number)
//*************END : AMOUNT IN WORDS CONVERSION FUNCTIONS**************//


function _calBackwardDate(LeadTime, currDt)
{
	var backwardDate = '';

	if(_validateData(LeadTime) && _validateData(currDt))
	{
		backwardDate	= nlapiDateToString(nlapiAddDays(nlapiStringToDate(currDt), -Math.abs(LeadTime)), 'dd/mm/yyyy');
	}
	return backwardDate;
}

function _calForwardDate(LeadTime, currDt)
{
	var forwardDate = '';

	if(_validateData(LeadTime) && _validateData(currDt))
	{
		forwardDate	= nlapiDateToString(nlapiAddDays(nlapiStringToDate(currDt), Math.abs(LeadTime)), 'dd/mm/yyyy');
	}
	return forwardDate;
}


//************ Start : Display distributor list on Finish Goods Assembly Item Record.***********************//

function _getAddressIdList(customerId,returntype)
{
	//alert('_getAddressIdList(customerId)==>>');
	//alert('customerId'+customerId);
	if(_validateData(customerId))
	{

		var addressList = [];
		var addrIdStr 	= '';

		var recObj = nlapiLoadRecord('customer', customerId);

		var lineCount = recObj.getLineItemCount('addressbook');
		//nlapiLogExecution('debug','lineCount===>>',lineCount);

		//alert('lineCount==>>'+lineCount);

		for(var i=1; i<=lineCount; i++)
		{
			recObj.selectLineItem('addressbook', i);
			var addrlabel		=	recObj.getCurrentLineItemValue('addressbook', 'label');  //This field is not a subrecord field.
			var addrId			=	recObj.getCurrentLineItemValue('addressbook', 'internalid');  //This field is not a subrecord field.

			var subrecord		=	recObj.viewCurrentLineItemSubrecord('addressbook', 'addressbookaddress');
			//nlapiLogExecution('debug','subrecord===>>', subrecord);

			if(subrecord != null && subrecord != 'undefined')
			{
				var isDistributor	=	subrecord.getFieldValue('custrecord_vst_addr_is_distributor_addr');

				//alert('lineCount==>>'+lineCount);

				if(isDistributor == 'T')
				{

					if(returntype == 1)// Return type is string
						{
							if(addrIdStr == '')
							{
								addrIdStr = addrId;
							}
							else
							{
								addrIdStr = addrIdStr + ',' + addrId;
							}
						}//if(returntype == 1)
					else if(returntype == 2)// Return type is array
					{
						addressList.push({
							id: addrId,
							label: addrlabel

						});
					}//if(returntype == 1)

				}//if(isDistributor == 'T')

			}//if(subrecord != null && subrecord != 'undefined')

		}//for(var i=1; i<=lineCount; i++)

		//nlapiLogExecution('debug','addressList===>>',addressList);

		//alert('addressList==>>'+addressList);

	}//if(customerId != null)
	if(_validateData(addrIdStr))
	{
		return addrIdStr;
	}
	else if(_validateData(addressList))
	{
		return addressList;
	}
	else
	{
		  return '';
	}


}//function getAddressList(customerId, flag)


function _getAddressList(customerId, addressIdList)
{
	//nlapiLogExecution('DEBUG', 'getAddresslist', 'true');

	//alert('customerId==>>'+customerId);
	var results, i, j, addressList = [];

	var filters = new Array();
	filters.push(new nlobjSearchFilter( 'internalid', null, 'anyof', customerId));

	// Define search columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('addressinternalid'));
	columns.push(new nlobjSearchColumn('addresslabel'));

	results = nlapiSearchRecord('customer', null, filters, columns);
	//alert(results.length);

		for (i = 0; results && i < results.length; i++)
		{
			for (j = 0; addressIdList && j < addressIdList.length; j++)
			{
				if(addressIdList[j] == results[i].getValue('addressinternalid'))
				{
					addressList.push({
						id: results[i].getValue('addressinternalid'),
						label: results[i].getValue('addresslabel'),
					});
					break;

				}//if(addressIdList[j] == results[i].getValue('addressinternalid'))

			}//for (j = 0; addressIdList && j < addressIdList.length; j++)

		}//for (i = 0; results && i < results.length; i += 1)

	//alert('addressList.lenth==>>'+addressList.length);
	return addressList;

}//function getAd//dressList(customerId, addressIdList)

//************ End : Display distributor list on Finish Goods Assembly Item Record. **************************//


function _getTodaysDate()
{
	var record = nlapiLoadRecord('customrecord_vst_grv_auto_gen_num', 1);
	var todaysDate  = record.getFieldValue('custrecord_vst_current_date_now');

	return todaysDate;
}

// Function to sort Numeric Array 
function numericArraysort(numArr) {
    numArr.sort(function(a, b){return a - b});
    
	return numArr;
}
//************ End : Display Finish Goods Item details on Finish Goods Assembly Item Record.***********************//

/*
// Get the difference between 2 arrays
*/
function arrDiff(arr1, arr2)
{
	//var Array1 = new Array("a","b","c","d","e","f");
	//var Array2 = new Array("j","o","c","e","p","v");
	// result : a,b,d,f
	
	for (var i = 0; i<arr2.length; i++) {
		var arrlen = arr1.length;
		for (var j = 0; j<arrlen; j++) {
			if (arr2[i] == arr1[j]) {
				arr1 = arr1.slice(0, j).concat(arr1.slice(j+1, arrlen));
			}//if close
		}//for close
	}//for close
	return arr1;
	//nlapiLogExecution('debug','arr1 :: ',arr1);
}

//splitting multiselect field for '|'
function _splitArr(varArr) {
 
 var splittedValues = '';
 var strChar5     	= '';
 var recordIdArr	= '';
 strChar5 = String.fromCharCode(5);
 
 if(_validateData(varArr)) {
	if(varArr.indexOf(strChar5) > -1) {
	  recordIdArr = varArr.split(strChar5);
	 }
	 else {
	  recordIdArr = varArr.split(",");
	 }
	 
	 return recordIdArr;
 }
 
}

function _getCreatedByUserFromTransaction(recordId) {
	
	var createdBySrch		='';
	var createdBySrchFilter =[];
	var createdBySrchColumn =[];
	var userName			='';
	
	createdBySrchFilter.push(new nlobjSearchFilter('internalid',null,'anyof',recordId));
	createdBySrchFilter.push(new nlobjSearchFilter('type','systemnotes','is','Create'));
	
	createdBySrchColumn.push(new nlobjSearchColumn('name','systemnotes'));
	
	createdBySrch	=	nlapiSearchRecord('transaction',null,createdBySrchFilter,createdBySrchColumn);
	
	if(_validateData(createdBySrch)) {
		userName = createdBySrch[0].getText('name','systemnotes');
	}
	
	return userName;
	
}


// Main Search Function which recursively calls after 1000 records         	
function getAllSearchData(recType,searchName,filters,columns)
{
 	if (isEmpty(searchName))
	{
		var results = nlapiSearchRecord(recType,null,filters,columns); //perform search
	}
	else
	{
		var results = nlapiSearchRecord(null,searchName,filters,columns); //perform search
	}
	
	var completeResultSet = results; //container of the complete result set	
	if (results != null)
	{
		  while(results.length == 1000)
		  {  
			  var lastId 	= results[999].getId();
			 
			  //re-run the search if limit has been reached
			  filters.push(new nlobjSearchFilter('internalidnumber', null,'greaterthan',lastId)); //create new filter to restrict the next search based on the last record returned
		       
		       results = nlapiSearchRecord(recType,searchName,filters,columns);
		       if (results != null) {
		          completeResultSet = completeResultSet.concat(results); //add the result to the complete result set 
		       } else {
		        break;
		       }		      
		  } 
	}
	//nlapiLogExecution('DEBUG', 'completeResultSet', 'completeResultSet : ' +completeResultSet.length);
	return completeResultSet;
} // end getAllSearchData()


// Function is used to get after decimal (.) digit length
function retr_dec(numStr) {
    var pieces = numStr.toString().split(".");
	var roundval = 0;
	if(_validateData(pieces[1]))
	{
		roundval = pieces[1].length;
	}
	
	if(roundval > toFixedDecimalNumber)
	{
		roundval = toFixedDecimalNumber;
	}
	return roundval;
}


// Function is used to validate the quantity after decimal (.) digit length
function _isValidQuantity(quantity)
{
	var pieces = quantity.toString().split(".");
	var roundval = 0;
	if(_validateData(pieces[1]))
	{
		roundval = pieces[1].length;
	}
	
	if(roundval > toFixedDecimalNumber)
	{
		alert('Quantity can not have more than 5 decimal places.');
		roundval = toFixedDecimalNumber;
	}
	return roundval;
}//function _isValidQuantity(quantity)


/**
* Common function which will be used to get Parent record
*/
function getCategoryParent(recTypeVal,catId)
{
	var parentId = '';
   if(catId != '' && catId != null)
   {
     
	  var parentId = nlapiLookupField(recTypeVal, catId, 'parent');
      //alert("parent of parent :: "+parentId);
    
      if(parentId != '' && parentId != null)
      {

	      parentId = getCategoryParent(recTypeVal,parentId);
	      return parentId;
       }
       else
       {
        return catId;

       }

   } //  if(catId != '' && catId != null)
}



function getAllIndexesNotInArr(arr, val) {
	var indexes = [];
	if(arr != '' && arr != null)
	{
		for(var i = 0; i < arr.length; i++)
		{
			if(val.indexOf(Number(arr[i])) == -1)
			{
				indexes.push(i);
			}//if(val.indexOf(arr[i]) == -1)
		}//for(i = 0; i < arr.length; i++)
	}//if(arr != '' && arr != null)
	return indexes;
}//function getAllIndexesNotInArr(arr, val) {



function getAllIndexesFoundInArr(arr, val) {
	var indexes = [];

	if(arr != '' && arr != null)
	{
		for(var i = 0; i < arr.length; i++)
		{
			if(val.indexOf(Number(arr[i])) != -1)
			{
				indexes.push(i);
			}//if(val.indexOf(arr[i]) == -1)
		}//for(i = 0; i < arr.length; i++)
	}//if(arr != '' && arr != null)
	return indexes;
}//function getAllIndexesFoundInArr(arr, val)

function _getTypeOfCreatedFrom(createdFrom){
	var type = '';
	try{
		var tranSearch = nlapiSearchRecord("transaction",null,
							[
							   ["internalidnumber","equalto",createdFrom], 
							   "AND", 
							   ["mainline","is","T"]
							], 
							[
							   new nlobjSearchColumn("type")
							]
							);
							
		if(_validateData(tranSearch)){
			type = tranSearch[0].getValue("type");
		}
		
		return type;
	}catch(e){
		nlapiLogExecution('ERROR','Error in function _getTypeOfCreatedFrom :','Details: ' + e);
	}
}
