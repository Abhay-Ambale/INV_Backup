// GLOBAL VARIABLES

//var NS_ENV_MODE			= 'Sandbox';
var NS_ENV_MODE			= 'Production';

// EFM Connection Parameters
/* ********************************* Sandbox ********************************/
if(NS_ENV_MODE == 'Sandbox'){
	var NS_FOLDER_ID		= 178273; // SuiteScripts > Simba > EFM_Integration > EFM_CSV_Temp
	var EFM_PASSWORDGUID	= '6553f7008f6a47efbe52327736c510e5';
	var EFM_HOSTKEY			= 'AAAAB3NzaC1yc2EAAAADAQABAAABAQCuHN8z0DqsMidxuYMgPrt5HjL9IfdZ6hUdb8D7bRMLfRRO0LtJU5SJCrrpXOB4VA7CsGsaCZ0fZRJX/3O1tGb1K6iOK11SLYYZjR3ZvH641Lrzhtm2ZRYkDVQ9rEfOtQ9gZY0dsdCdWOZdhKGDRJ3tEjNb6wrE9oDIdISuYJjLrRY/fpBzXVoZG34vdB7cj1dG07GDJRfb55MVj/yi0mtnGF3RAWa3hhojLcJ/AnFA6qP4pEdpOpSiY0UMRPyUJOoj0Ztn5eetANgzHSouDrQ4xOpYz/oFm3gCwTf/w7Z4kbI1K0xeifUdfkoYH/O5vWnHPCLpK7RyVCpYgtW6c5Fp';
}

/* ********************************* Production ********************************/
if(NS_ENV_MODE == 'Production'){

	var NS_FOLDER_ID		= 500018; // SuiteScripts > Simba > EFM_Integration > EFM_CSV_Temp
	var EFM_PASSWORDGUID	= '5a3d92e624d34ec58f8d3b221952e140';
	var EFM_HOSTKEY			= 'AAAAB3NzaC1yc2EAAAADAQABAAABAQCuHN8z0DqsMidxuYMgPrt5HjL9IfdZ6hUdb8D7bRMLfRRO0LtJU5SJCrrpXOB4VA7CsGsaCZ0fZRJX/3O1tGb1K6iOK11SLYYZjR3ZvH641Lrzhtm2ZRYkDVQ9rEfOtQ9gZY0dsdCdWOZdhKGDRJ3tEjNb6wrE9oDIdISuYJjLrRY/fpBzXVoZG34vdB7cj1dG07GDJRfb55MVj/yi0mtnGF3RAWa3hhojLcJ/AnFA6qP4pEdpOpSiY0UMRPyUJOoj0Ztn5eetANgzHSouDrQ4xOpYz/oFm3gCwTf/w7Z4kbI1K0xeifUdfkoYH/O5vWnHPCLpK7RyVCpYgtW6c5Fp';
}
/* ********************************************************************* */

var EFM_URL				= 'cloud01.studytech.com';
var EFM_USERNAME 		= 'efm';
var EFM_HOSTKEYTYPE		= 'rsa'; 
var EFM_PORT			= '22';
var EFM_TIMEOUT			= '';
var EFM_DIRECTORY		= '/home/efm/';
var EFM_NEW_DIRECTORY		= 'New';
var EFM_PROCESSED_DIRECTORY = 'Processed';
var EFM_FC_FILE_NAME		= 'SIMBA_Consignments_Latest';  // SIMBA_Consignments_Latest_Test
var EFM_FC_CSV_IMPORT_ID	= 'custimport_efm_fc_integration_mapping';

var EFM_IMG_FILE_NAME		= 'SIMBA_PODs_Latest'; //  SIMBA_PODs_Daily_Test
var EFM_IMG_CSV_IMPORT_ID	= 'custimport_efm_img_integration_mapping';

// Other Parameters
var COL_DELIMETER 		= ',';
var AUTHORID 			= 20430; //28376
var RECIPIENTSID 		= 'supriya@invitratech.com, chetan.dani@invitratech.com, domahony@simba.global';
var ALLRECIPIENTSID 	= 'supriya@invitratech.com, chetan.dani@invitratech.com, domahony@simba.global, helpdesk@studytech.com';
var SUBJECTTEXT 		= '';
var BODYMESSAGE 		= '';

var EFMheadMapArr 		= [];
EFMheadMapArr[0] 		= 'Connote';
EFMheadMapArr[17] 		= 'Items';
EFMheadMapArr[18] 		= 'Weight';
EFMheadMapArr[19] 		= 'Volume';
EFMheadMapArr[26] 		= 'Net';

var EFMImgHeadMapArr 	= [];
EFMImgHeadMapArr[0] 	= 'ConsignmentNumber';
EFMImgHeadMapArr[2] 	= 'PODURL';
/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */

function _createEfmParentRecord(filename, serviceText) {
	var customRecId = '';
	
	try{
		var customRecObj 	= RECORD.create({type: 'customrecord_inv_efm_fc_parent', isDynamic: true});	
		customRecObj.setValue({fieldId: 'custrecord_inv_efm_fc_file_name', value: filename});
		customRecObj.setValue({fieldId: 'custrecord_inv_efm_fc_file_type', value: serviceText});		
		customRecId 		= customRecObj.save({enableSourcing: true,ignoreMandatoryFields: false});
		
		// Set company preference
		var configRecObj 	= CONFIG.load({type: CONFIG.Type.COMPANY_PREFERENCES});			
		configRecObj.setValue({fieldId: 'custscript_inv_efm_fc_parent_ref_id', value : customRecId});
		configRecObj.save();
	}
	catch (e) {
		log.error({title: 'Error In _createEfmParentRecord: '+e.name, details: e.message});		
	}
	
	return customRecId;
}

function _validateFileHeader(line, serviceType) {	
	var colStatus 	= 'OK';
	var lineValues 	= line.value.split(COL_DELIMETER);
		
	//log.debug('line', line);
	if(serviceType == 'fc'){
		for(var i = 0; _validateData(lineValues) && i < lineValues.length; i++) {
			if(i ==0 || i==17 || i == 18 || i == 19 || i == 26){
				var lineVal 	= _convertToString(lineValues[i]);		
				if(EFMheadMapArr[i].toLowerCase().trim() !== lineVal.toLowerCase().trim()) {
					try {
						var errorObj = ERROR.create({
							name: 'INVALID_COLUMN_SEQUENCE',
							message: 'Please verify that the sequence of columns are correct or column names are correct for the column - '+lineValues[i],
							notifyOff: false
						});
						log.error("Error Code: " + errorObj.name, "Error Details: "+ errorObj.message);
						colStatus = 'INVALID';
						
						////THROW & SEND INVALID COLUMN SEQUENCE ERROR & STOP SCHEDULED SCRIPT EXECUTION
						SUBJECTTEXT 	= 'EFM Fright Cost Integration Error';
						BODYMESSAGE 	= 'Hi,<br/>Below error encountered while processing the csv data. Please do the needful.<br/>'+errorObj.message+'<br/><br/>Thanks<br/>';
										
						_sendErrorEmail(AUTHORID, RECIPIENTSID, SUBJECTTEXT, BODYMESSAGE);
						break;
					}
					catch(e) {
						log.error("Error In _validateFileHeader: " + e.name, e.message);
					}
				}
			}
		}
	}
	else if(serviceType == 'img'){
		for(var i = 0; _validateData(lineValues) && i < lineValues.length; i++) {
			if(i==0 || i == 2){
				var lineVal 	= _convertToString(lineValues[i]);		
				if(EFMImgHeadMapArr[i].toLowerCase().trim() !== lineVal.toLowerCase().trim()) {
					try {
						var errorObj = ERROR.create({
							name: 'INVALID_COLUMN_SEQUENCE',
							message: 'Please verify that the sequence of columns are correct or column names are correct for the column - '+lineValues[i],
							notifyOff: false
						});
						log.error("Error Code: " + errorObj.name, "Error Details: "+ errorObj.message);
						colStatus = 'INVALID';
						
						////THROW & SEND INVALID COLUMN SEQUENCE ERROR & STOP SCHEDULED SCRIPT EXECUTION
						SUBJECTTEXT 	= 'EFM Integration Error for Image file';
						BODYMESSAGE 	= 'Hi,<br/>Below error encountered while processing the csv data. Please do the needful.<br/>'+errorObj.message+'<br/><br/>Thanks<br/>';
										
						_sendErrorEmail(AUTHORID, RECIPIENTSID, SUBJECTTEXT, BODYMESSAGE);
						break;
					}
					catch(e) {
						log.error("Error In _validateFileHeader: " + e.name, e.message);
					}
				}
			}
		}
	}
	
	return colStatus;
}

function _sendErrorEmail(authorId, recipientsId, subjectText, bodyMsg) {
	EMAIL.send({
		author: authorId,
		recipients: recipientsId,
		subject: subjectText,
		body: bodyMsg
	});
}

function _sendEmailWithAttachment(authorId, recipientsId, subjectText, bodyMsg, fileId){
	var fileObj = '';
	
	if(_validateData(fileId)){
		fileObj = FILE.load({id: fileId});
	}
	EMAIL.send({
		author: authorId,
		recipients: recipientsId,
		subject: subjectText,
		body: bodyMsg,
		attachments: [fileObj]
	});
}

function getSFTPConnection(USERNAME, PASSWORDGUID, URL, HOSTKEY, HOSTKEYTYPE, PORT, DIRECTORY, TIMEOUT){
    var preConnectionObj = {};
    preConnectionObj.passwordGuid = PASSWORDGUID;
    preConnectionObj.url = URL;
    preConnectionObj.hostKey = HOSTKEY;
    if(USERNAME){ preConnectionObj.username = USERNAME; }
    if(HOSTKEYTYPE){ preConnectionObj.hostKeyType = HOSTKEYTYPE; }
    if(PORT){ preConnectionObj.port = Number(PORT); }
    if(DIRECTORY){ preConnectionObj.directory = DIRECTORY; }
    if(TIMEOUT){ preConnectionObj.timeout = Number(TIMEOUT); }
    
    var connectionObj = SFTP.createConnection(preConnectionObj);
    return connectionObj;
}

// Function is used to validate data
function _validateData(data)
{
	if (data != null && data != 'undefined' && data != '' && data != NaN) {
		return true;
	}
	return false;
}

function _convertToString(currVal){
	var newVal;
	
	if(_validateData(currVal)){
		newVal 	= currVal.replace(/"/g, '');		
	}
	
	return newVal;
}

function _getTodaysDate(){
	var dateFormat = '', customRecObj = '', todaysDate = '', todaysDateTime = '', convertedDate = '';
	
	customRecObj 	= RECORD.create({type: 'customrecord_inv_efm_fc_parent', isDynamic: true});
	todaysDateTime 	= customRecObj.getValue({fieldId: 'custrecord_inv_efm_fc_date_of_upload'});
		
	//log.debug({title: 'todaysDateTime 1', details: todaysDateTime});
	
	if(_validateData(todaysDateTime)) {
		convertedDate = _convertToDateTimeFormat(todaysDateTime);
		//log.debug({title: 'convertedDate 2', details: convertedDate});
	}
	
	if(_validateData(convertedDate)) {
		todaysDateTime = convertedDate.toString();
	}
		
    if(_validateData(todaysDateTime)) {		
		var todaysDate = todaysDateTime.split(' ')[0];
		var todaysTime = todaysDateTime.split(' ')[1];
		
		var hr 	= todaysTime.split(':')[0];
		var min = todaysTime.split(':')[1];
		
		var mm = todaysDate.split('/')[0];
		var dd = todaysDate.split('/')[1];
		var yyyy = todaysDate.split('/')[2];
					
		if(_validateData(dd) && dd.toString().length == 1) dd = '0'+dd;
		if(_validateData(mm) && mm.toString().length == 1) mm = '0'+mm;
		
		if(_validateData(hr) && hr.toString().length == 1) hr = '0'+hr;
		if(_validateData(min) && min.toString().length == 1) min = '0'+min;
		//dateFormat = mm+''+dd+''+yyyy+'_'+hr+min; // change the format depending on the date format preferences set on your account
		
		dateFormat = yyyy+'-'+mm+'-'+dd+'-'+hr+'-'+min;	
	}
	
	//log.debug('dateFormat', dateFormat);
	return dateFormat;
}

function _convertToDateTimeFormat(givenDate) {
	var convertedDate;
	
	if(_validateData(givenDate)){
		// Assume Date format is MM/DD/YYYY
		var convertedDate = FORMAT.format({
			value: givenDate,
			type: FORMAT.Type.DATETIME
		});
	}
	return convertedDate;
}

function _updateFCParentRec(parentId, serviceType, serviceText, fileId) {
	try{
		var failedCnt	= _getFailedCount(parentId, serviceType);
		var successCnt	= _getSuccessCount(parentId, serviceType);
		var totalCnt	= Number(successCnt) + Number(failedCnt);
		
		RECORD.submitFields({
			type: 'customrecord_inv_efm_fc_parent',
			id: parentId,
			values: {					
				'custrecord_inv_efm_fc_file_total_lines': Number(totalCnt),
				'custrecord_inv_efm_fc_success_lines': Number(successCnt),
				'custrecord_inv_efm_fc_failed_lines': Number(failedCnt)				
			}
		});
		
		var scheme 	= 'https://';
        var host 	= URL.resolveDomain({hostType: URL.HostType.APPLICATION});
			
		var parentUrl 	= URL.resolveRecord({recordType: 'customrecord_inv_efm_fc_parent', recordId: parentId, isEditMode: false});
		parentUrl		= scheme+host+parentUrl;
		
		if(serviceType =='fc'){
			// EFM FC Import Failed
			var errorUrl	= scheme+host+'/app/common/search/searchresults.nl?rectype=customrecord_inv_efm_fc_child&searchtype=Custom&CUSTRECORD_EFM_FC_PARENT_LINK='+parentId+'&searchid=customsearch_inv_efm_fc_import_failed';
		}
		else{
			// EFM Image Import Failed
			var errorUrl	= scheme+host+'/app/common/search/searchresults.nl?rectype=customrecord_inv_efm_image_child&searchtype=Custom&CUSTRECORD_EFM_IMG_PARENT_LINK='+parentId+'&searchid=customsearch_inv_efm_img_import_failed';
		}
		var mailMsg		= Number(successCnt)+' out of '+Number(totalCnt)+' Tracking numbers are imported sucessfully.';
		SUBJECTTEXT 	= 'EFM '+serviceText+' Import Completed';
		BODYMESSAGE 	= mailMsg+'<br /><a href="'+parentUrl+'">Click here</a> to view the import details.';
		
		if(Number(failedCnt) >0){
			BODYMESSAGE 	+= '<br><br>To view the error log <a href="'+errorUrl+'">click here</a>. Please do the needful.';
		}
		BODYMESSAGE 	+= '<br/><br/>Thanks';
		
		log.debug ('--- _updateFCParentRec BODYMESSAGE ', BODYMESSAGE);
		//_sendErrorEmail(AUTHORID, RECIPIENTSID, SUBJECTTEXT, BODYMESSAGE);
		_sendEmailWithAttachment(AUTHORID, RECIPIENTSID, SUBJECTTEXT, BODYMESSAGE, fileId);

	} catch (e) {
		log.error ({title: e.name,	details: 'Error In Function _updateFCParentRec :'+e.message});
	}
}

function _getFailedCount(parentId, serviceType)
{
	var searchResultCount	= 0;
	try{
		if(serviceType =='fc'){
			var searchObj 	= SEARCH.create({type: "customrecord_inv_efm_fc_child",
								   filters:
								   [
										["isinactive","is","F"],										
										"AND",
										["custrecord_inv_efm_fc_status","anyof",2],
										"AND",
										["custrecord_efm_fc_parent_link","anyof", parentId]
								   ],
								   columns:
								   [
									  SEARCH.createColumn({name: "custrecord_inv_efm_fc_tracking_number", summary: "GROUP", sort: SEARCH.Sort.ASC})
								   ]
								});		
		}
		else{
			var searchObj 	= SEARCH.create({type: "customrecord_inv_efm_image_child",
								   filters:
								   [
										["isinactive","is","F"],										
										"AND",
										["custrecord_inv_efm_img_status","anyof",2],
										"AND",
										["custrecord_efm_img_parent_link","anyof", parentId]
								   ],
								   columns:
								   [
									  SEARCH.createColumn({name: "custrecord_inv_efm_img_tracking_number", summary: "GROUP", sort: SEARCH.Sort.ASC})
								   ]
								});
		}
		
		searchResultCount 	= searchObj.runPaged().count;
		
		log.debug ('--- _getFailedCount searchResultCount ', searchResultCount);

	} catch (e) {
		log.error ({title: e.name,	details: 'Error In Function _getFailedCount :'+e.message});
	}
	
	return searchResultCount;
}

function _getSuccessCount(parentId, serviceType)
{
	var searchResultCount	= 0;
	try{
		if(serviceType == 'fc'){
			var searchObj 	= SEARCH.create({type: "customrecord_inv_efm_fc_child",
								   filters:
								   [
										["isinactive","is","F"],										
										"AND",
										["custrecord_inv_efm_fc_status","anyof",1],
										"AND",
										["custrecord_efm_fc_parent_link","anyof", parentId]
								   ],
								   columns:
								   [
									  SEARCH.createColumn({name: "custrecord_inv_efm_fc_tracking_number", summary: "GROUP", sort: SEARCH.Sort.ASC})
								   ]
								});
		}
		else{
			var searchObj 	= SEARCH.create({type: "customrecord_inv_efm_image_child",
								   filters:
								   [
										["isinactive","is","F"],										
										"AND",
										["custrecord_inv_efm_img_status","anyof",1],
										"AND",
										["custrecord_efm_img_parent_link","anyof", parentId]
								   ],
								   columns:
								   [
									  SEARCH.createColumn({name: "custrecord_inv_efm_img_tracking_number", summary: "GROUP", sort: SEARCH.Sort.ASC})
								   ]
								});
		}
		searchResultCount 	= searchObj.runPaged().count;
		log.debug ('--- _getSuccessCount searchResultCount ', searchResultCount);

	} catch (e) {
		log.error ({title: e.name,	details: 'Error In Function _getSuccessCount :'+e.message});
	}
	
	return searchResultCount;
}