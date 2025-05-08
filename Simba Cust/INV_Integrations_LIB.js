// GLOBAL VARIABLES

var NS_ENV_MODE			= 'Sandbox';
// var NS_ENV_MODE			= 'Production';

// EFM Connection Parameters
/* ********************************* Sandbox ********************************/
if(NS_ENV_MODE == 'Sandbox'){
	var NS_CSVFOLDER_ID			= 2195697;  // CSV By Axima > Auto_Temp
	var ERROR_SHIPMENT_FOLDER 	= 2195696;  // CSV By Axima > Error Handling - Shipment Header
	var ERROR_IR_FOLDER 		= 2250852;  // CSV By Axima > Error Handling - Item Receipt	
	var ERROR_DESPATCH_FOLDER 	= 2250854;  // CSV By Axima > Error Handling - Despatch File63
	var SFTP_PASSWORDGUID		= '91cd13795f404baeb3774bf12f88061f';
	var SFTP_HOSTKEY			= 'AAAAB3NzaC1yc2EAAAABIwAAAIEA4txBNXGYewal0gGUmIs0JVfrwm8REINejOUSPm9fnRqdT8iMIiXjlOplZAiDSGN30tZjDq/4lgRCxpCuxq5FGFfcsW4N+YEYL5clSwNAb89EEltQuimXiiTFmS7Zn0kAVxNcxgES/zgBmjSoRCQopmG6tcOSD1nRkZIa4R4s66M=';
}

/* ********************************* Production ********************************/
if(NS_ENV_MODE == 'Production'){

	var NS_CSVFOLDER_ID			= 2206648;  // CSV By Axima > Auto_Temp
	var ERROR_SHIPMENT_FOLDER 	= 2206647;  // CSV By Axima > Error Handling - Shipment Header
	var ERROR_IR_FOLDER 		= 2253281;  // CSV By Axima > Error Handling - Item Receipt	
	var ERROR_DESPATCH_FOLDER 	= 2253282;  // CSV By Axima > Error Handling - Despatch File
	//var SFTP_PASSWORDGUID		= '7bd5bace324240cca514feff512d9ea4';
	//var SFTP_HOSTKEY			= 'AAAAB3NzaC1yc2EAAAABIwAAAIEA4txBNXGYewal0gGUmIs0JVfrwm8REINejOUSPm9fnRqdT8iMIiXjlOplZAiDSGN30tZjDq/4lgRCxpCuxq5FGFfcsW4N+YEYL5clSwNAb89EEltQuimXiiTFmS7Zn0kAVxNcxgES/zgBmjSoRCQopmG6tcOSD1nRkZIa4R4s66M=';
	
	//var SFTP_PASSWORDGUID		= 'c6afcaaadf4748c08bb6c48c451568ad';
	/*var SFTP_HOSTKEY			= 'AAAAB3NzaC1yc2EAAAADAQABAAABAQDmuW2VZAhR6IoIOr32WnLlsr/rt3y4bPFpFcNhXaLifCenkflj9BufX3lk5aEXadcemfKlUJJdwBTvTt1j4+X3P2ecCZX1/GSsRKSTuiivuOgkPxk3UlfggkgN9flE9EdUxHi/jN/OQ9CjGtHxxk72NJSMNAjvIe0Ixs7TfqqyEytYAcirYcSGcc0r70juiiWozflXlt+bS7mXvkxpqMjjIivX+wTAizzzJRaC6WcRbjQAkL2GP6UCFfBI1o9NBfXbz+qvs1KTmNA0ugRQ7g6MdiNOePHrvoF1JgTlCxEjy+/IqPiC8nNQUVCW6/gcATQoDQn0n9Lwm1ekycS35xEh';*/
	
	var SFTP_PASSWORDGUID		= '568ec513ba674f448339575a3ba47b4e';
	var SFTP_HOSTKEY			= 'AAAAB3NzaC1yc2EAAAADAQABAAABAQCfeIyKblF1xo44RVh/bFm1DYxI9l26h+tT5P7qBqZztZ2yT3tLUkru6dKbkT8epNhTP4e0NDZl/WlIsleCmzCRfHnFYit+riYnskJBP4wcBDkDmQLBQiKcPhMwwCXsijWisHsc0PrdfSwOAhGllsJTy7FsKfYyCRaeLEq8AszNSwfgjMlLxytTEyKNMRZhTq6udY+8u2OJZaOveiKCyw/PRD64kR6DONcHMc+y157UaDIfx6nZtQ4O8T0akM+s5J3xnhUOQH2J48+QBN8l4y/cX65quyW7zqN8pxR2N8CK498p6eWan94visO/evOhnlLPAMR1V+cd0soVxyKt5Qlp';
}
/* ********************************************************************* */

/*var SFTP_URL				= '115.70.195.154';
var SFTP_USERNAME 			= 'axima.user';
var SFTP_HOSTKEYTYPE		= 'rsa'; 
var SFTP_PORT				= '2222';
var SFTP_TIMEOUT			= '';
var SFTP_DIRECTORY			= '/axima/';
*/

var SFTP_URL				= 'simbasftp.blob.core.windows.net';
var SFTP_USERNAME 			= 'simbasftp.axima';
var SFTP_HOSTKEYTYPE		= 'rsa'; 
var SFTP_PORT				= '22';
var SFTP_TIMEOUT			= '';
var SFTP_DIRECTORY			= '/';

var SFTP_SHIPMENT_DIR		= 'shipment_header/';
var SFTP_ITEM_RECEIPT_DIR	= 'goods_received/';
var SFTP_DESPATCH_DIR		= 'despatch/';
var SFTP_NEW_DIRECTORY		= 'new/';
var SFTP_PROCESSED_DIRECTORY = 'processed/';

// Other Parameters
var COL_DELIMETER 		= ',';
var AUTHORID 			= 20430; // Employee : Simba AU
var RECIPIENTSID 		= 'simba@invitratech.com, domahony@simba.global, ddarroch@simba.global';
var DESPATCH_RECIPIENTSID 	= 'simba@invitratech.com, ddarroch@simba.global';
var PO_RECIPIENTSID 	= 'simba@invitratech.com, shipheaders@simba.global, kgorry@simba.global, lmulquiny@simba.global';
var BEX_RECIPIENTSID 	= 'simba@invitratech.com, domahony@simba.global, dnguyen@simba.global, ddarroch@simba.global';
var ALLRECIPIENTSID 	= 'simba@invitratech.com, domahony@simba.global';
var SUBJECTTEXT 		= '';
var BODYMESSAGE 		= '';

var SUPPLIER_AXIMA_LOGISTICS	= 107758; // Supplier - S006302 AXIMA LOGISTICS
var shipmentHeaderMapArr 	= [];
shipmentHeaderMapArr[0] 	= 'Shipment Reference';
shipmentHeaderMapArr[1] 	= 'Container';
shipmentHeaderMapArr[2] 	= 'Unique Identifier';
shipmentHeaderMapArr[3] 	= 'VESSEL NAME';
shipmentHeaderMapArr[4] 	= 'Shipment Mode';
shipmentHeaderMapArr[5] 	= 'Shipment Type';
shipmentHeaderMapArr[6] 	= 'Departure Port';
shipmentHeaderMapArr[7] 	= 'Departure Port ETD';
shipmentHeaderMapArr[8] 	= 'Arrival Port';
shipmentHeaderMapArr[9] 	= 'Arrival Port ETA';
shipmentHeaderMapArr[10] 	= 'Warehouse ETA';
shipmentHeaderMapArr[11] 	= 'Bill of Lading';
shipmentHeaderMapArr[12] 	= 'Warehouse';
shipmentHeaderMapArr[13] 	= 'Purchase Order Number';
shipmentHeaderMapArr[14] 	= 'PO Internal Id';
shipmentHeaderMapArr[15] 	= 'Line Id';
shipmentHeaderMapArr[16] 	= 'Item';
shipmentHeaderMapArr[17] 	= 'Quantity';
shipmentHeaderMapArr[18] 	= 'Quantity Shipped';
shipmentHeaderMapArr[19] 	= 'DIRECT/TRANSHIP';
shipmentHeaderMapArr[20] 	= 'ETA INTO TRANSHIP PORT';
shipmentHeaderMapArr[21] 	= 'ETD OUT OF TRANSHIP PORT';
shipmentHeaderMapArr[22] 	= 'ATD OUT OF TRANSHIP PORT';

var aximaIRMapArr 	= [];
aximaIRMapArr[0] 	= 'Axima_Ref';
aximaIRMapArr[1] 	= 'CONTAINER/BOL/TYPE';
aximaIRMapArr[2] 	= 'ASN';
aximaIRMapArr[3] 	= 'SEQ_NO';
aximaIRMapArr[4] 	= 'SKU';
aximaIRMapArr[5] 	= 'Qty_Expected';
aximaIRMapArr[6] 	= 'Qty_Received';
aximaIRMapArr[7] 	= 'Qty_Quarantined';
aximaIRMapArr[8] 	= 'Status';
aximaIRMapArr[9] 	= 'Date_Received';
aximaIRMapArr[10] 	= 'Lot_Number';
aximaIRMapArr[11] 	= 'Expiry/Best_Before';
aximaIRMapArr[12] 	= 'Unit_type';

/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */

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

function _parseDate(date) {
	var convertedDate = FORMAT.parse({
							value: date, 
							type: FORMAT.Type.DATE
						});
	
	return convertedDate;
}
/* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */

function _validateFileHeader(line, fileColumnMappingArr, fileId, FileType) {	
	var colStatus 	= 'OK';
	// var lineValues 	= line.value.split(COL_DELIMETER);
	var lineValues 	= line;

		
	
	for(var i = 0; _validateData(lineValues) && i < lineValues.length; i++) {		
		var lineVal 	= _convertToString(lineValues[i]);		
		if(fileColumnMappingArr[i].toLowerCase().trim() !== lineVal.toLowerCase().trim()) {
			try {
				var errorObj = ERROR.create({
					name: 'INVALID_COLUMN_SEQUENCE',
					message: 'Please verify that the sequence of columns are correct or column names are correct for the column - '+lineValues[i],
					notifyOff: false
				});
				log.error("Error Code: " + errorObj.name, "Error Details: "+ errorObj.message);
				colStatus = 'INVALID';
				
				////THROW & SEND INVALID COLUMN SEQUENCE ERROR & STOP SCHEDULED SCRIPT EXECUTION
				SUBJECTTEXT 	= FileType+' : Invalid File Sequence';
				BODYMESSAGE 	= 'Hi,<br/>Below error encountered while processing the csv data. Please do the needful.<br/>'+errorObj.message+'<br/><br/>Thanks<br/>';
								
				_sendEmailWithAttachment(AUTHORID, RECIPIENTSID, SUBJECTTEXT, BODYMESSAGE, fileId);
				break;
			}
			catch(e) {
				log.error("Error In _validateFileHeader: "+FileType+ " - " + e.name, e.message);
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

function _sendEmailWithTwoAttachments(authorId, recipientsId, subjectText, bodyMsg, fileId_1, fileId_2){
	var fileObj_1 	= '';
	var fileObj_2	= '';
	
	if(_validateData(fileId_1)){
		fileObj_1 = FILE.load({id: fileId_1});
	}
	if(_validateData(fileId_2)){
		fileObj_2 = FILE.load({id: fileId_2});
	}
	
	EMAIL.send({
		author: authorId,
		recipients: recipientsId,
		subject: subjectText,
		body: bodyMsg,
		attachments: [fileObj_1, fileObj_2]
	});
}

function _parseDate(date) {
	var convertedDate = FORMAT.parse({
        value: date, 
        type: FORMAT.Type.DATE
    });
	
	return convertedDate;
}
function _formatDate(givenDate) {
	var convertedDate;
	
	if(_validateData(givenDate)){
		// Assume Date format is DD/MM/YYYY
		var convertedDate = FORMAT.format({
			value: givenDate,
			type: FORMAT.Type.DATETIME
		});
	}
	return convertedDate;
}

// dateValue = '2020-10-13' returns 13/10/2020
function _convertDateFormat(dateValue) {
	if(_validateData(dateValue)) {		
		var mm 		= dateValue.split('-')[1];
		var dd 		= dateValue.split('-')[2];
		var yyyy 	= dateValue.split('-')[0];
						
		dateValue 	= dd;
		if(_validateData(dd)) dateValue = dateValue+'/'+mm;
		if(_validateData(yyyy)) dateValue = dateValue+'/'+yyyy;		
	}
	
	return dateValue;
}

// givenDate = '2020-10-13T13:38:08+11:00' or '2020-10-13T00:00:00'
// returns 13/10/2020
function _convertBorderExpressDate(givenDate)
{
	var convertedDt;
	
	if(_validateData(givenDate)) {
		var beDateArr	= givenDate.split('T');
		convertedDt		= _convertDateFormat(beDateArr[0]);		
		convertedDt 	= _parseDate(convertedDt);
	}
	return convertedDt;
}

function _getCustomListValKey(customListId)
{
	var customListArr	= [];	
	try {
		var customListObj	= RECORD.load({
								type: 'customlist',
								   id: customListId,
								   isDynamic: true
							   });
						   
		var customValCnt	= customListObj.getLineCount({sublistId: 'customvalue'});		
		//log.debug('_getCustomListValKey customValCnt', customValCnt);
		
		if(customValCnt > 0){		
			for (var i = 0; i < customValCnt; i++) {
				var listValue  	= customListObj.getSublistValue({sublistId: 'customvalue', fieldId: 'value', line:i});
				var listValueId = customListObj.getSublistValue({sublistId: 'customvalue', fieldId: 'valueid', line:i});
				
				//log.debug('listValue', listValue);				
				customListArr[listValue] = listValueId;
			}
		}
	}catch (e) {
		log.error({title: 'Error In _getCustomListValKey: '+e.name, details: e.message});
		
	}
	
	return customListArr;	
}

/* **************************************************************************************** */


function _createCurrentYearMonthFolderId(parentFolder)
{
	var daObj 	= new Date();
	var mon 	= daObj.getMonth();
	var arr 	= ['Jan','Feb','Mar','Apr','May','Jun','July','Aug','Sept','Oct','Nov','Dec'];
	var month 	= arr[mon];
	var year 	= 'Year_'+daObj.getFullYear();
		
	try {	
		// Check & Create Year folder
		var yearFolderId = _getFolderId(year, parentFolder);	
		if(!_validateData(yearFolderId)){
			var yrFolderObj = RECORD.create({ type: RECORD.Type.FOLDER});
			yrFolderObj.setValue({fieldId: 'name', value: year});
			yrFolderObj.setValue({fieldId: 'parent',value: parentFolder}); 
			yearFolderId 	= yrFolderObj.save();
		}
		
		// Check & Create Month Folder
		var monthFolderId = _getFolderId(month, yearFolderId);	
		if(!_validateData(monthFolderId) && (_validateData(yearFolderId)))
		{
			var mnFolderObj = RECORD.create({ type: RECORD.Type.FOLDER});
			mnFolderObj.setValue({fieldId: 'name',value: month});
			mnFolderObj.setValue({fieldId: 'parent', value: yearFolderId});		
			monthFolderId = mnFolderObj.save();
		}
		
		log.debug('yearFolderId','yearFolderId->>'+yearFolderId);
		log.debug('monthFolderId','monthFolderId->>'+monthFolderId);
		
	}catch (e) {
		log.error({title: 'Error In _getFolderId: '+e.name, details: e.message});
		
	}
	return monthFolderId;
}

function _getFolderId(currFolder, parentFolder)
{
	var folderId = '';
	try {		
		var folderSearchObj = SEARCH.create({
								   type: "folder",
								   filters:
								   [
									  ["name","is",currFolder],
									  "AND", 
									  ["predecessor","anyof", parentFolder]
								   ],
								   columns:
								   [
									  SEARCH.createColumn({name: "name", sort: SEARCH.Sort.ASC, label: "Name"}),
									  SEARCH.createColumn({name: "internalid", label: "Internal ID"})
								   ]
								});

		folderSearchObj.run().each(function(result){
			folderId = result.getValue({name: "internalid"});
			return false;
		});
		
		//log.debug({title: '_getFolderId folderId', details:folderId});
		
	}catch (e) {
		log.error({title: 'Error In _getFolderId: '+e.name, details: e.message});
		
	}
	return folderId;
}


function _getFileList(folderId)
{
	var fileIdArr 	= [];
	try {		
		var fileSearchObj = SEARCH.create({
			type: "file",
			filters:
			[
				["folder","anyof",folderId]									 
			],
			columns:
			[
				SEARCH.createColumn({name: "name", sort: SEARCH.Sort.ASC, label: "Name"}),
				SEARCH.createColumn({name: "internalid", label: "Internal ID"})
			]
		});

		fileSearchObj.run().each(function(result){
			var fileId 	= result.getValue({name: "internalid"});
			fileIdArr.push(fileId);
			return true;
		});
		
	}catch (e) {
		log.error({title: 'Error In _getFileList: '+e.name, details: e.message});
		
	}
	return fileIdArr;
}


function _createErrorCSVfile(fileErrorObj, fileName, csvColumnHeadingArr, flag)
{
	var csvDetails			= '';
	var errorFileId			= '';
	var csvColumnHeading 	= '';
	if(fileErrorObj.length>0){
		log.debug({title: '_createErrorCSVfile fileErrorObj', details:fileErrorObj});
		
		fileErrorObj.forEach(function(errObj) {
			if(flag == 0){
				csvDetails += errObj.error+','+errObj.value+'\r\n';
			}
			else{
				var cnt 		= 0;
				var errMsg 		= errObj.error;
				var errValue 	= errObj.value;				
				errValue.forEach(function(key, val){					
					if(cnt > 0) errMsg = '';
					csvDetails += errMsg+','+key+'\r\n';
					cnt++;
				});
			}		
		});		
		
		if(_validateData(csvColumnHeadingArr)){
			csvColumnHeading = 'Error,'+ csvColumnHeadingArr.toString();
		}
		var csvFullData =  csvColumnHeading+'\r\n'+ csvDetails;
		filename		= 'Error_'+fileName;
		var fileObj 	= FILE.create({
							name: filename,
							fileType: FILE.Type.CSV,
							folder : NS_CSVFOLDER_ID,
							contents: csvFullData		
						});
	
		errorFileId 	= fileObj.save();
	}
	log.debug({title: '_createErrorCSVfile errorFileId', details:errorFileId});
	
	return errorFileId;
}
/* **************************************************************************************** */

