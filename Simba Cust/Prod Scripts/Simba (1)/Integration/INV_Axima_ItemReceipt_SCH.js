 /* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
 ||   This is a Scheduled Script for Axima Integration with NetSuite    ||
 ||   in Suitescript 2.0 for Auto Item Receipt creation                 ||
 ||                                                              		||
 ||                                                               		||
 ||  Version Date         Author        	Remarks                   	||
 ||  1.0     Oct 05 2020  Supriya Gunjal  	Initial commit            	|| 
  \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
 
/**
 * @NApiVersion 2.0
 * @NScriptType ScheduledScript
 */
 
var SFTP, RUNTIME, TASK, FILE, ERROR, EMAIL, FORMAT, CONFIG, URL, SEARCH;
var fileErrorObj = [];
var sch​edu​leS​cri​ptT​ask​Obj​ = '';
define(['./INV_Integrations_LIB', 'N/config','N/sftp','N/runtime', 'N/task', 'N/file', 'N/error', 'N/email', 'N/record', 'N/format', 'N/url', 'N/search'], runAximaIRScheduled);

function runAximaIRScheduled(INV_Integrations_LIB, config, sftp, runtime, task, file, error, email, record, format, url, search) {
	COMMONFUNC	= INV_Integrations_LIB;
	CONFIG		= config;
	SFTP		= sftp;
	RUNTIME 	= runtime;
	TASK 		= task;
	FILE 		= file;
	ERROR 		= error;
	EMAIL		= email;
	RECORD		= record;
	FORMAT		= format;
	URL			= url;
	SEARCH		= search;
	return {
		execute: executeItemReceipt
	}
}

function executeItemReceipt(context) {
		
	try {		
		var scriptObj 		= RUNTIME.getCurrentScript();
		var deploymentId 	= scriptObj.deploymentId;
		var lineId 			= scriptObj.getParameter({name: 'custscript_inv_item_receipt_line_id'});	
		if(!_validateData(lineId)) lineId = 0;		
		
		log.debug({title: '>>>> Start ', details:scriptObj.getRemainingUsage()});
		log.debug({title: 'lineId', details:lineId});
		
		if(deploymentId == 'customdeploy_inv_axima_itemreceipt_error'){
			// Process Error files from NetSuite File Cabinet
			var fileIdArr 	= _getFileList(ERROR_IR_FOLDER);
			log.debug({title:'fileIdArr', details:fileIdArr});
			
			fileIdArr.forEach(function(fileId) {
				_processIRFile(fileId, lineId);
				if(_validateData(sch​edu​leS​cri​ptT​ask​Obj​)){
					log.debug({title: "return false;", details: ''});
					return false;
				}else{
					log.debug({title: "file delete", details: fileId});
					FILE.delete({id: fileId});
				}
			});
		}
		else
		{
			log.debug({title: "Start Process New files from SFTP server", details: ''});
			// Process New files from SFTP server
			try{
				// establish connection to remote FTP server //DIRECTORY
				var sftpConnection 	= getSFTPConnection(SFTP_USERNAME, SFTP_PASSWORDGUID, SFTP_URL, SFTP_HOSTKEY, SFTP_HOSTKEYTYPE, SFTP_PORT, SFTP_DIRECTORY , SFTP_TIMEOUT);
			
			}catch (e) {
				log.error({title: 'Error In executeItemReceipt: '+e.name, details: e.message});
				SUBJECTTEXT 	= 'SFTP Connection Error : Item Received File';
				BODYMESSAGE 	= 'Hi,<br/><br/>Below error encountered while connecting to SFTP server for Item Received file. Please do the needful.<br/>'+e.message+'<br/><br/>Thanks';
						
				_sendErrorEmail(AUTHORID, ALLRECIPIENTSID, SUBJECTTEXT, BODYMESSAGE);
			}
			
			var dirList 	= sftpConnection.list({path: SFTP_ITEM_RECEIPT_DIR+SFTP_NEW_DIRECTORY});
			for (var d in dirList){			
				if(dirList[d].directory == false){
					var csvFileName	= dirList[d].name;
					log.debug({title: "csvFileName", details: csvFileName});
					
					// Download the file from SFTP and Save to NetSuite
					var downloadedFileObj 	= sftpConnection.download({
													directory: SFTP_ITEM_RECEIPT_DIR+SFTP_NEW_DIRECTORY,
													filename:  csvFileName
												});
					
					downloadedFileObj.folder = NS_CSVFOLDER_ID;
					downloadedFileObj.name 	= csvFileName;
					var fileId				= downloadedFileObj.save();
					//log.debug({title: "downloadedFileObj", details: JSON.stringify(downloadedFileObj)});
					
					if(_validateData(fileId)){						
						sftpConnection.move({
											from: SFTP_ITEM_RECEIPT_DIR+SFTP_NEW_DIRECTORY+csvFileName,
											to: SFTP_ITEM_RECEIPT_DIR+SFTP_PROCESSED_DIRECTORY+csvFileName
										});
						
						_processIRFile(fileId, lineId);
						
						if(_validateData(sch​edu​leS​cri​ptT​ask​Obj​)){
							log.debug({title: "return false;", details: ''});
							return false;							
						}else{
							log.debug({title: "file delete", details: fileId});
							FILE.delete({id: fileId});
						}
					}					
				}
			}
		}
		
		if(_validateData(sch​edu​leS​cri​ptT​ask​Obj​)){
			log.debug({title: "sch​edu​leS​cri​ptT​ask​Obj​", details: sch​edu​leS​cri​ptT​ask​Obj​});			
			sch​edu​leS​cri​ptT​ask​Obj​.submit();
		}
	}
	catch (e) {
		log.error({title: 'Error In executeItemReceipt: '+e.name, details: e.message});
		SUBJECTTEXT = 'Axima Item Received File : Import Error';
		BODYMESSAGE = 'Hi,<br/><br/>Below error encountered while processing the Item Received file name '+csvFileName+'. Please do the needful.<br/>'+e.message+'<br/><br/>Thanks';
				
		_sendErrorEmail(AUTHORID, PO_RECIPIENTSID, SUBJECTTEXT, BODYMESSAGE);
	}	
}

function _processIRFile(fileId, lineId)
{
	try{
		fileErrorObj		= [];
		var iteratorLineArr = [];
		var poLineArr		= [];
		var lineValuesArr	= [];
		var tempId			= '';
		var csvFileObj 		= FILE.load({ id: fileId });
		var fileName		= csvFileObj.name;
		var iterator 		= csvFileObj.lines.iterator();		
		var scriptObj 		= RUNTIME.getCurrentScript();
		
		iterator.each(function (line) {iteratorLineArr.push(line); return true;});

		if(_validateData(iteratorLineArr) && iteratorLineArr.length > 0){
			for(var x = lineId; _validateData(iteratorLineArr) && x < iteratorLineArr.length; x++) {
				var line = iteratorLineArr[x];
				
				if(x == 0) {
					//Validate the first line (CSV header)
					var colStatus = _validateFileHeader(line, aximaIRMapArr, fileId, 'Item Receipt');
					if(colStatus == 'INVALID') break;
				}
				else {					
					var lineValues 	= line.value.split(COL_DELIMETER);
					var poNo 		= parseInt(lineValues[2]);
					var lineId 		= lineValues[3];
					var qtyReceived	= lineValues[6];		
					
					log.debug ('tempId for x '+x, 'tempId='+tempId+' poNo='+poNo+' lineId='+lineId);					
					
					if(_validateData(tempId) && _validateData(poNo) && tempId != poNo){
						log.debug ('poLineArr', poLineArr);
						_createItemReceipt(tempId, poLineArr, lineValuesArr);
						
						poLineArr 		= [];
						lineValuesArr 	= [];
						
						var remainingUsage 	= scriptObj.getRemainingUsage();
						log.debug({title: '------ Remaining Usage at Line Id = '+x, details:remainingUsage});
						if(remainingUsage < 200) {
							log.debug({title: '------ Reschedule Remaining Usage at Line Id = '+x, details:remainingUsage});						
							sch​edu​leS​cri​ptT​ask​Obj​ = TASK.create({taskType: TASK.TaskType.SCHEDULED_SCRIPT});
							sch​edu​leS​cri​ptT​ask​Obj​.scriptId		= scriptObj.id;
							sch​edu​leS​cri​ptT​ask​Obj​.deploymentId 	= scriptObj.deploymentId;
							sch​edu​leS​cri​ptT​ask​Obj​.params 		= {custscript_inv_item_receipt_line_id:x};							
							break;
						}
					}
					tempId 				= poNo;
					poLineArr[lineId] 	= qtyReceived;
					lineValuesArr.push(lineValues);
				}
			} // end of for	
			
			log.debug ('End of File, Outside loop >> poNo', poNo);
			log.debug ('End of File, Outside loop >> poLineArr', poLineArr);
						
			_createItemReceipt(poNo, poLineArr, lineValuesArr);
		}
		
		log.debug ('fileErrorObj '+fileErrorObj.length, fileErrorObj);		
		if(fileErrorObj.length>0){
			var errorFileId = _createErrorCSVfile(fileErrorObj, fileName, aximaIRMapArr, 1);
			SUBJECTTEXT 	= 'Axima Item Receipt File : Process Error';
			BODYMESSAGE 	= 'Hi,<br/><br/>Please find attached error file and the original file from Axima. Please do the needful.';
			
			log.debug ('Send Error email with 2 attachments', SUBJECTTEXT);
			_sendEmailWithTwoAttachments(AUTHORID, PO_RECIPIENTSID, SUBJECTTEXT, BODYMESSAGE, fileId, errorFileId);
			
			//FILE.delete({id: errorFileId});
		}		
	}
	catch (e) {
		log.error({title: 'Error In _processIRFile: '+e.name, details: e.message});		
	}	
}

function _createItemReceipt(poNo, poLineArr, lineValuesArr)
{
	try{
		var poObj 	= _getPoIdByNumber(poNo);
		var poId			= poObj.poId;
		var exchangerate	= poObj.exchangerate;
		log.debug ('_createItemReceipt poId', poId);
		
		if(!_validateData(poId)){
			fileErrorObj.push({'error': 'Invalid PO #'+poNo,  'value': lineValuesArr});
			return true;
		}
		
		var irObj 	= RECORD.transform({
							fromType: RECORD.Type.PURCHASE_ORDER,
							fromId: poId,
							toType: RECORD.Type.ITEM_RECEIPT,
							isDynamic: false,
						});
		
		irObj.setValue({fieldId: 'exchangerate', value: exchangerate});
		irObj.setValue({fieldId: 'landedcostperline', value: true});
		
		var lineCount 	= irObj.getLineCount({sublistId: 'item'});
		log.debug ('irObj lineCount', lineCount);
		
		var shipHedaer 	= irObj.getSublistValue({sublistId: 'item',fieldId: 'custcol_kl_shipment_header',line: 0});
		irObj.setValue({fieldId: 'custbody_kl_shipment_header', value: shipHedaer});
		
		var qtyVarianceArr = [];
		for(var r=0; r<lineCount; r++){
			var currLine 		= irObj.getSublistValue({sublistId: 'item',fieldId: 'line',line: r});
			var currLineItem 	= irObj.getSublistValue({sublistId: 'item',fieldId: 'item',line: r});			
			var currLineQty 	= irObj.getSublistValue({sublistId: 'item',fieldId: 'quantity',line: r});
			
			if(_validateData(poLineArr[currLine])){
				log.debug ('set quantity for line '+currLine, poLineArr[currLine]);
				irObj.setSublistValue({sublistId: 'item',fieldId: 'quantity',value: poLineArr[currLine], line: r});
				
				if(poLineArr[currLine] > Number(currLineQty) || poLineArr[currLine] < Number(currLineQty)){
					var fieldLookUp 	= SEARCH.lookupFields({type: SEARCH.Type.ITEM, id: currLineItem, columns: ['itemid']});
					var currLineItemNm	= fieldLookUp.itemid;
					qtyVarianceArr.push('Item '+currLineItemNm+' has received quantity '+poLineArr[currLine]+' against PO quantity '+currLineQty);
				}				
			}
			else{
				log.debug ('un select line', currLine);
				irObj.setSublistValue({sublistId: 'item',fieldId: 'itemreceive',value: false, line: r});
			}
		}
		try{						
			var irId = irObj.save({enableSourcing : true, ignoreMandatoryFields : false});
			log.debug ('Item Receipt created irId', irId);
			
			if(qtyVarianceArr.length > 0){				
				var fieldLookUp = SEARCH.lookupFields({type: SEARCH.Type.ITEM_RECEIPT, id: irId, columns: ['tranid']});
				var irNo		= fieldLookUp.tranid;
				SUBJECTTEXT 	= 'Axima - Quantity Variance for IR #'+irNo;
				BODYMESSAGE 	= 'Hi,<br/><br/>Please check below items which has quantity variance during Item Receipt. Please do the needful.<br>';			
				for(var q=0; q<qtyVarianceArr.length; q++){
					BODYMESSAGE 	+= qtyVarianceArr[q];
					BODYMESSAGE 	+= '<br>';
				}
				
				BODYMESSAGE 	+= '<br>Regards,';
				_sendErrorEmail(AUTHORID, PO_RECIPIENTSID, SUBJECTTEXT, BODYMESSAGE);
			}
		}//try
		catch(e) {
			log.debug('error', "_createItemReceipt 1", e.message);			
			fileErrorObj.push({'error': 'Error creating Item Receipt for PO #'+poNo+' >> '+e.message,  'value': lineValuesArr});
		}
	}
	catch (e) {
		log.error({title: 'Error In _createItemReceipt 2 : '+e.name, details: e.message});
		fileErrorObj.push({'error': 'Error creating Item Receipt for PO #'+poNo+' >> '+e.message,  'value': lineValuesArr});
	}
}

function _getPoIdByNumber(poNo)
{
	var poId 	= '';
	var poObj 	= {};
	try{
		var poSearchObj = SEARCH.create({
							   type: "purchaseorder",
							   filters:
							   [
								  ["number", "equalto", poNo], 
								  "AND", 
								  ["mainline","is","T"], 
								  "AND", 
								  ["type","anyof","PurchOrd"],
								  "AND", 
								  ["status","anyof","PurchOrd:D","PurchOrd:F","PurchOrd:E","PurchOrd:B"]
							   ],
							   columns:
							   [
								  SEARCH.createColumn({name: "internalid", label: "Internal ID"}),
								  SEARCH.createColumn({name: "exchangerate", label: "Exchange Rate"})
							   ]
							});
		poSearchObj.run().each(function(result){
		   var poId 		= result.getValue({name: "internalid"});
		   var exchangerate = result.getValue({name: "exchangerate"});
		   
		   poObj 	= {'poId':poId, 'exchangerate':exchangerate};
		   return false;
		});
	}
	catch (e) {
		log.error({title: 'Error In _getPoIdByNumber: '+e.name, details: e.message});		
	}
	return poObj;
}