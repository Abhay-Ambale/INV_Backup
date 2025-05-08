 /* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
 ||   This is a Scheduled Script for EFM Integration with NetSuite    	||
 ||   in Suitescript 2.0                                          		||
 ||                                                              		||
 ||                                                               		||
 ||  Version Date         Author        	Remarks                   	||
 ||  1.0     Feb 01 2016  Supriya Gunjal  	Initial commit            	|| 
  \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
 
/**
 * @NApiVersion 2.0
 * @NScriptType ScheduledScript
 */
 
var SFTP, RUNTIME, TASK, FILE, ERROR, EMAIL, FORMAT, CONFIG, URL, SEARCH;
var serviceType;

define(['/SuiteScripts/Simba/EFM_Integration/INV_Integrations_LIB', 'N/config','N/sftp','N/runtime', 'N/task', 'N/file', 'N/error', 'N/email', 'N/record', 'N/format', 'N/url', 'N/search'], runCMScheduled);

function runCMScheduled(INV_Integrations_LIB, config, sftp, runtime, task, file, error, email, record, format, url, search) {
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
		execute: executeEFMIntegration
	}
}

function executeEFMIntegration(context) {
	var headerStatus;
	var flag 			= 0;
	var serviceText		= '';
	var efmFileName 	= '';
	var efmImportId		= '';
	var fileId			= '';
	
	try {
		var deploymentId 		= RUNTIME.getCurrentScript().deploymentId;		
		if(deploymentId == 'customdeploy_inv_efm_integration_sch'){
			serviceType			= 'fc';
			serviceText			= 'Fright Cost';
			efmFileName			= EFM_FC_FILE_NAME;
			efmImportId			= EFM_FC_CSV_IMPORT_ID;
		}
		if(deploymentId == 'customdeploy_inv_efm_img_integration_sch'){
			serviceType			= 'img';
			serviceText			= 'Image';
			efmFileName			= EFM_IMG_FILE_NAME;
			efmImportId			= EFM_IMG_CSV_IMPORT_ID;
		}
		
		var todaysDt 			= _getTodaysDate();
		var newFileName 		= efmFileName+'_'+todaysDt+'.csv';
		
		try{
			// establish connection to remote FTP server //DIRECTORY
			var sftpConnection 	= getSFTPConnection(EFM_USERNAME, EFM_PASSWORDGUID, EFM_URL, EFM_HOSTKEY, EFM_HOSTKEYTYPE, EFM_PORT, EFM_DIRECTORY , EFM_TIMEOUT);
		}catch (e) {
			log.error({title: 'Error In executeEFMIntegration: '+e.name, details: e.message});
			SUBJECTTEXT 	= 'EFM SFTP Connection Error :'+serviceText+' file';
			BODYMESSAGE 	= 'Hi,<br/><br/>Below error encountered while connecting to SFTP server for '+serviceText+' file. Please do the needful.<br/>'+e.message+'<br/><br/>Thanks';
					
			_sendErrorEmail(AUTHORID, ALLRECIPIENTSID, SUBJECTTEXT, BODYMESSAGE);
		}
		
		// Download the file from SFTP and Save to NetSuite
		var downloadedFileObj 	= sftpConnection.download({
										directory: EFM_NEW_DIRECTORY,
										filename:  efmFileName+'.csv'
									});
		
		downloadedFileObj.folder = NS_FOLDER_ID;
		downloadedFileObj.name 	= newFileName;
		fileId					= downloadedFileObj.save();		
		var csvFileObj 			= FILE.load({ id: fileId });
		
		sftpConnection.upload({
								directory: EFM_PROCESSED_DIRECTORY,
								filename: newFileName,
								file: csvFileObj,
								replaceExisting: true
							});

		if(_validateData(csvFileObj)){
			var iterator = csvFileObj.lines.iterator();		
			
			// Validate File Header
			iterator.each(function (line) {				
				headerStatus = _validateFileHeader(line, serviceType, serviceText);			
				return false;
			});			
		}		
	}
	catch (e) {
		log.error({title: 'Error In executeEFMIntegration: '+e.name, details: e.message});
		SUBJECTTEXT = 'EFM Import Error : '+serviceText+' file';
		BODYMESSAGE = 'Hi,<br/><br/>Below error encountered while processing the file of type '+serviceText+'. Please do the needful.<br/>'+e.message+'<br/><br/>Thanks';
				
		_sendErrorEmail(AUTHORID, RECIPIENTSID, SUBJECTTEXT, BODYMESSAGE);
	}
	
	//log.debug({title: "headerStatus", details: headerStatus});
	if(headerStatus == 'OK'){
		try {
			// Create Parent EFM record and Set to Company preferences
			var parentRefId 	= _createEfmParentRecord(csvFileObj.name, serviceText);
						
			// Create Task to import CSV
			var csvTask 		= TASK.create({taskType: TASK.TaskType.CSV_IMPORT});
			csvTask.importFile 	= csvFileObj;			
			csvTask.mappingId  	= efmImportId;
			var csvImportTaskId = csvTask.submit();
			
			do{
				flag 	= 0;
				var csvTaskStatus	= TASK.checkStatus({taskId: csvImportTaskId});			
				//log.debug('Inside Do - status ', csvTaskStatus.status);
				
				if(csvTaskStatus.status === TASK.TaskStatus.COMPLETE){
					flag = 1;
					log.audit({title: 'csvTaskStatus.status final', details: csvTaskStatus.status});
					
					_updateFCParentRec(parentRefId, serviceType, serviceText, fileId);
				}
				
				if(csvTaskStatus.status === TASK.TaskStatus.FAILED){
					flag = 1;
					log.audit({title: 'csvTaskStatus.status FAILED final', details: csvTaskStatus.status});
					
					SUBJECTTEXT 	= 'EFM Import Error: '+serviceText+' file';
					BODYMESSAGE 	= 'Hi,<br/><br/>Error encountered while importing the EFM file. Please do the needful.<br/><br/>Thanks';					
					_sendErrorEmail(AUTHORID, RECIPIENTSID, SUBJECTTEXT, BODYMESSAGE);
				}				
			}
			while(flag == 0);
		}
		catch (e) {
			log.error({title: 'Error In executeEFMIntegration: '+e.name, details: e.message});
			SUBJECTTEXT 	= 'EFM Integration Error: '+serviceText+' file';
			BODYMESSAGE 	= 'Hi,<br/><br/>Below error encountered while importing the '+serviceType+' file. Please do the needful.<br/>'+e.message+'<br/><br/>Thanks';
			
			//_updateErrorToLogInfoRecord(logId, e.name+' '+e.message);
			_sendErrorEmail(AUTHORID, RECIPIENTSID, SUBJECTTEXT, BODYMESSAGE);
		}
	}
	
	if(_validateData(fileId)){
		FILE.delete({id: fileId});
	}
}