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
 
var SFTP, RUNTIME, TASK, FILE, ERROR, EMAIL, FORMAT, CONFIG, SEARCH;
var fileErrorObj = [];
var sch​edu​leS​cri​ptT​ask​Obj​ = '';
define(['./INV_Integrations_LIB', 'N/config','N/sftp','N/runtime', 'N/task', 'N/file', 'N/error', 'N/email', 'N/record', 'N/format', 'N/search'], runAximaDespatchScheduled);

function runAximaDespatchScheduled(INV_Integrations_LIB, config, sftp, runtime, task, file, error, email, record, format, search) {
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
	SEARCH		= search;
	return {
		execute: executeSalesDespatch
	}
}

function executeSalesDespatch(context) {
		
	try {		
		var scriptObj 		= RUNTIME.getCurrentScript();
		var deploymentId 	= scriptObj.deploymentId;
		var lineId 			= scriptObj.getParameter({name: 'custscript_inv_salesdespatch_line_id'});	
		if(!_validateData(lineId)) lineId = 0;		
		
		log.debug({title: '>>>> Start ', details:scriptObj.getRemainingUsage()});
		log.debug({title: 'lineId', details:lineId});
		
		if(deploymentId == 'customdeploy_inv_axima_salesdespatch_err'){
			// Process Error files from NetSuite File Cabinet
			var fileIdArr 	= _getFileList(ERROR_DESPATCH_FOLDER);
			log.debug({title:'fileIdArr', details:fileIdArr});
			
			fileIdArr.forEach(function(fileId) {
				_processDespatchFile(fileId, lineId);
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
				SUBJECTTEXT 	= 'SFTP Connection Error : Despatch File';
				BODYMESSAGE 	= 'Hi,<br/><br/>Below error encountered while connecting to SFTP server for Despatch file. Please do the needful.<br/>'+e.message+'<br/><br/>Thanks';
						
				_sendErrorEmail(AUTHORID, ALLRECIPIENTSID, SUBJECTTEXT, BODYMESSAGE);
			}
			
			var dirList 	= sftpConnection.list({path: SFTP_DESPATCH_DIR+SFTP_NEW_DIRECTORY});
			for (var d in dirList){			
				if(dirList[d].directory == false){
					var csvFileName	= dirList[d].name;
					var csvFileNameArr = csvFileName.split('.');
					var d = new Date();
					var timestmp = d.getTime();
					var newFileName = csvFileNameArr[0]+'_'+timestmp+'.'+csvFileNameArr[1];
					log.debug({title: "csvFileName", details: csvFileName});
					log.debug({title: "newFileName", details: newFileName});					
					
					// Download the file from SFTP and Save to NetSuite
					var downloadedFileObj 	= sftpConnection.download({
													directory: SFTP_DESPATCH_DIR+SFTP_NEW_DIRECTORY,
													filename:  csvFileName
												});
					
					downloadedFileObj.folder = NS_CSVFOLDER_ID;
					downloadedFileObj.name 	= csvFileName;
					var fileId				= downloadedFileObj.save();
					//log.debug({title: "downloadedFileObj", details: JSON.stringify(downloadedFileObj)});
					
					if(_validateData(fileId)){						
						sftpConnection.move({
											from: SFTP_DESPATCH_DIR+SFTP_NEW_DIRECTORY+csvFileName,
											to: SFTP_DESPATCH_DIR+SFTP_PROCESSED_DIRECTORY+newFileName
										});
						
						_sendFileNotification(fileId);
						_processDespatchFile(fileId, lineId);
						
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
		SUBJECTTEXT = 'Axima Despatch File : Import Error';
		BODYMESSAGE = 'Hi,<br/><br/>Below error encountered while processing the Item Received file name '+csvFileName+'. Please do the needful.<br/>'+e.message+'<br/><br/>Thanks';
				
		_sendErrorEmail(AUTHORID, DESPATCH_RECIPIENTSID, SUBJECTTEXT, BODYMESSAGE);
	}	
}

function _sendFileNotification(fileId) 
{
	SUBJECTTEXT 	= 'Axima Despatch File Received';
	BODYMESSAGE 	= 'Hi,<br/><br/>Please find attached sales despatch file sent by Axima on SFTP server. ';
	
	log.debug ('Send Error email with 1 attachment', SUBJECTTEXT);
	_sendEmailWithAttachment(AUTHORID, DESPATCH_RECIPIENTSID, SUBJECTTEXT, BODYMESSAGE, fileId);
}

function _processDespatchFile(fileId, lineId)
{
	try{
		fileErrorObj		= [];
		var iteratorLineArr = [];
		
		var csvFileObj 		= FILE.load({ id: fileId });
		var fileName		= csvFileObj.name;
		var iterator 		= csvFileObj.lines.iterator();		
		var scriptObj 		= RUNTIME.getCurrentScript();
		
		iterator.each(function (line) {iteratorLineArr.push(line); return true;});

		if(_validateData(iteratorLineArr) && iteratorLineArr.length > 0){
			for(var x = lineId; _validateData(iteratorLineArr) && x < iteratorLineArr.length; x++) {
				var line = iteratorLineArr[x];
				
				/* if(x == 0) {
					//Validate the first line (CSV header)
					//var colStatus = _validateFileHeader(line, aximaIRMapArr, fileId, 'Item Receipt');
					//if(colStatus == 'INVALID') break;
				} 
				else {	*/				
					var lineValues 		= line.value.split(COL_DELIMETER);
					var ifNo 			= lineValues[0].replace(/['"]+/g, '').substring(1);
					var trackingNo		= lineValues[10].replace(/['"]+/g, '');
					var actualCartons 	= lineValues[12].replace(/['"]+/g, '');
					var totalWeight		= lineValues[13].replace(/['"]+/g, '');
					var totalVolume		= lineValues[14].replace(/['"]+/g, '');
					var ifId 			= '';
										
					log.debug ('ifNo x '+x, 'ifNo='+ifNo+' trackingNo='+trackingNo+' actualCartons='+actualCartons+' totalWeight='+totalWeight+' totalVolume='+totalVolume);
					
					if(_validateData(ifNo) && _validateData(trackingNo)){
						ifId 	= _getIFidByNo(ifNo);						
					}else{
						fileErrorObj.push({'error': 'Error - Invalid data',  'value': line.value});
					}
					
					if(!_validateData(ifId)){						
						fileErrorObj.push({'error': 'Error - Invalid IF #'+ifNo,  'value': line.value});
					}
					else{
						
						if(Number(totalWeight) <=0) {
							fileErrorObj.push({'error': 'Error - Invalid Weight',  'value': line.value});
						}
						
						var ifObj	= RECORD.load({
												type: RECORD.Type.ITEM_FULFILLMENT,
												id: ifId,
												isDynamic: false
											   });
						ifObj.setValue({fieldId:'custbody_inv_axima_actual_cartons', value:Number(actualCartons)});
						ifObj.setValue({fieldId:'custbody_inv_axima_total_weight', value:Number(totalWeight)});
						ifObj.setValue({fieldId:'custbody_inv_axima_total_volume', value:Number(totalVolume)});
						ifObj.setValue({fieldId:'shipstatus', value:'C'});
						
						var setTracking = 1;
						var lineCount 	= ifObj.getLineCount({sublistId: 'package'});					
						//log.debug ('lineCount', lineCount);
						
						if(lineCount > 0) {
							var trackingnumber = ifObj.getSublistValue({sublistId: 'package', fieldId: 'packagetrackingnumber', line: 0});
							log.debug ('line 0 packagetrackingnumber', trackingnumber);
							if(_validateData(trackingnumber)){
								setTracking = 0;
							}
						}
						
						if(_validateData(trackingNo) && setTracking == 1 && Number(totalWeight) > 0){
							log.debug ('set packagetrackingnumber', trackingNo);
							ifObj.setSublistValue({sublistId:'package', fieldId:'packagetrackingnumber', line:0, value: trackingNo});
							ifObj.setSublistValue({sublistId:'package', fieldId:'packageweight', line:0, value: Number(totalWeight)});
						}
						
						try{						
							var ifId = ifObj.save({enableSourcing : true, ignoreMandatoryFields : false});
							log.debug ('Item Fulfillment updated ifId', ifId);	
							
						}
						catch(e) {
							log.debug('error', e.message);			
							fileErrorObj.push({'error': 'Error updating Despatch details for IF #'+ifNo+' >> '+e.message,  'value': line.value});
						}		
						
						var remainingUsage 	= scriptObj.getRemainingUsage();
						log.debug({title: '------ Remaining Usage at Line Id = '+x, details:remainingUsage});
						
						if(remainingUsage < 200) {
							log.debug({title: '------ Reschedule Remaining Usage at Line Id = '+x, details:remainingUsage});						
							sch​edu​leS​cri​ptT​ask​Obj​ = TASK.create({taskType: TASK.TaskType.SCHEDULED_SCRIPT});
							sch​edu​leS​cri​ptT​ask​Obj​.scriptId		= scriptObj.id;
							sch​edu​leS​cri​ptT​ask​Obj​.deploymentId 	= scriptObj.deploymentId;
							sch​edu​leS​cri​ptT​ask​Obj​.params 		= {custscript_inv_salesdespatch_line_id:x};							
							break;
						}
					}					
				//}
			} // end of for		
		}
		
		log.debug ('fileErrorObj '+fileErrorObj.length, fileErrorObj);		
		if(fileErrorObj.length>0){
			var errorFileId = _createErrorCSVfile(fileErrorObj, fileName, '', 0);
			SUBJECTTEXT 	= 'Axima Despatch File : Process Error';
			BODYMESSAGE 	= 'Hi,<br/><br/>Please find attached error file and the original file from Axima. Please do the needful.';
			
			log.debug ('Send Error email with 2 attachments', SUBJECTTEXT);
			_sendEmailWithTwoAttachments(AUTHORID, DESPATCH_RECIPIENTSID, SUBJECTTEXT, BODYMESSAGE, fileId, errorFileId);
			
			//FILE.delete({id: errorFileId});
		}		
	}
	catch (e) {
		log.error({title: 'Error In _processDespatchFile: '+e.name, details: e.message});		
	}	
}

function _getIFidByNo(ifNo)
{
	var ifId 	= '';
	try{
		var poSearchObj = SEARCH.create({
							   type: "itemfulfillment",
							   filters:
							   [
								  ["numbertext", "is", ifNo], 
								  "AND", 
								  ["mainline","is","T"], 
								  "AND", 
								  ["type","anyof","ItemShip"]								  
							   ],
							   columns:
							   [
								  SEARCH.createColumn({name: "internalid", label: "Internal ID"})
							   ]
							});
		poSearchObj.run().each(function(result){
		   ifId = result.getValue({name: "internalid"});
		   log.debug ('_getIFidByNo ifId for ifNo '+ifNo, ifId);		
		   
		   return false;
		});
	}
	catch (e) {
		log.error({title: 'Error In _getIFidByNo: '+e.name, details: e.message});		
	}
	return ifId;
}
