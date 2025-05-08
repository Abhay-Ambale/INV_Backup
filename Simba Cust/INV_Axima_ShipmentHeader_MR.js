/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
var SFTP, RUNTIME, TASK, FILE, ERROR, EMAIL, FORMAT, CONFIG, URL, SEARCH;
var fileErrorObj = [];
var lineId=[];
var scheduleScriptTaskObj = '';
var fileId;
var colStatus;
var shipFileName;
define(['./Simba/Integration/INV_Integrations_LIB','N/config', 'N/email', 'N/error', 'N/file', 'N/format', 'N/record', 'N/runtime', 'N/search', 'N/sftp', 'N/task', 'N/url'],
    /**
 * @param{config} config
 * @param{email} email
 * @param{error} error
 * @param{file} file
 * @param{format} format
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 * @param{sftp} sftp
 * @param{task} task
 * @param{url} url
 */
    (INV_Integrations_LIB, config, email, error, file, format, record, runtime, search, sftp, task, url) => {
        /**
         * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
         * @param {Object} inputContext
         * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Object} inputContext.ObjectRef - Object that references the input data
         * @typedef {Object} ObjectRef
         * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
         * @property {string} ObjectRef.type - Type of the record instance that contains the input data
         * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
         * @since 2015.2
         */
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

        const getInputData = (inputContext) => {
            try {     
				var scriptObj 		= RUNTIME.getCurrentScript();
				var deploymentId 	= scriptObj.deploymentId;
				var lineIdparam 	= scriptObj.getParameter({name: 'custscript_inv_shipment_header_line_id_2'});				
				if(!_validateData(lineIdparam)) lineIdparam = 0;
				lineId = lineIdparam;           
                var fileLinesArr = [];	
                
                log.debug({title: 'lineId', details:lineId});
                
                if(deploymentId == 'customdeploy_inv_axima_shipheader_error'){
                    // Process Error files from NetSuite File Cabinet
                    var fileIdArr 	= _getFileList(ERROR_SHIPMENT_FOLDER);
                    log.debug({title:'fileIdArr', details:fileIdArr[0]});
                					
					var processedFileLines = _processShipmentFile(fileIdArr[0], lineIdparam);
					// Add fileIdArr[0] to the beginning of fileLinesArr
					fileLinesArr.unshift(fileIdArr[0]);				
					// Append the processed file lines to fileLinesArr
					fileLinesArr = fileLinesArr.concat(processedFileLines);
					log.debug('fileLinesArr New: '+fileLinesArr[0], fileLinesArr);

				} else {
					log.debug({title: "Start Process New files from SFTP server", details: ''});
					// Process New files from SFTP server
					try{
						// establish connection to remote FTP server //DIRECTORY
						var sftpConnection 	= getSFTPConnection(SFTP_USERNAME, SFTP_PASSWORDGUID, SFTP_URL, SFTP_HOSTKEY, SFTP_HOSTKEYTYPE, SFTP_PORT, SFTP_DIRECTORY , 20);
						
						log.debug({title: "Connected to FTP server", details: ''});
					
					}catch (e) {
						log.error({title: 'Error In executeShipmentHeader: '+e.name, details: e.message});
						SUBJECTTEXT 	= 'SFTP Connection Error : Shipment Header File';
						BODYMESSAGE 	= 'Hi,<br/><br/>Below error encountered while connecting to SFTP server for Shipment Header file. Please do the needful.<br/>'+e.message+'<br/><br/>Thanks';
								
						_sendErrorEmail(AUTHORID, ALLRECIPIENTSID, SUBJECTTEXT, BODYMESSAGE);
					}
					
					var fileId		= '';
					try {
						var dirList 	= sftpConnection.list({path: SFTP_SHIPMENT_DIR+SFTP_NEW_DIRECTORY});
						log.debug({title: "dirList", details: dirList});
						
						for (var d in dirList){			
							if(dirList[d].directory == false){
								var shipmentFileName	= _setshipmentFileName(dirList[d].name);

								log.debug({title: "shipmentFileName", details: shipmentFileName});
								
								// Download the file from SFTP and Save to NetSuite
								var downloadedFileObj = sftpConnection.download({
															directory: SFTP_SHIPMENT_DIR+SFTP_NEW_DIRECTORY,
															filename:  shipmentFileName
														});
								
								downloadedFileObj.folder = NS_CSVFOLDER_ID;
								downloadedFileObj.name 	= shipmentFileName;
								fileId = downloadedFileObj.save();
								fileLinesArr.unshift(fileId);						
							}
						}
					}catch (e) {
						log.error({title: 'Error in dirList : '+e.name, details: e.message});	
					}
					
					try {
						log.debug({title: "processing fileId", details: fileId});
						if(_validateData(fileId)){				
							// Process file from NS Temp folder and then delete it
							fileLinesArr = fileLinesArr.concat(_processShipmentFile(fileId, lineIdparam));							
							
						}
					}catch (e) {
						log.error({title: 'Error in processing fileId : '+e.name, details: e.message});	
					}
				}

            }catch (error) {
                log.error("Error in GetInputData()", error);
            }
            return fileLinesArr;
        }

        /**
         * Defines the function that is executed when the map entry point is triggered. This entry point is triggered automatically
         * when the associated getInputData stage is complete. This function is applied to each key-value pair in the provided
         * context.
         * @param {Object} mapContext - Data collection containing the key-value pairs to process in the map stage. This parameter
         *     is provided automatically based on the results of the getInputData stage.
         * @param {Iterator} mapContext.errors - Serialized errors that were thrown during previous attempts to execute the map
         *     function on the current key-value pair
         * @param {number} mapContext.executionNo - Number of times the map function has been executed on the current key-value
         *     pair
         * @param {boolean} mapContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} mapContext.key - Key to be processed during the map stage
         * @param {string} mapContext.value - Value to be processed during the map stage
         * @since 2015.2
         */

        const map = (mapContext) => {
         
        }

        /**
         * Defines the function that is executed when the reduce entry point is triggered. This entry point is triggered
         * automatically when the associated map stage is complete. This function is applied to each group in the provided context.
         * @param {Object} reduceContext - Data collection containing the groups to process in the reduce stage. This parameter is
         *     provided automatically based on the results of the map stage.
         * @param {Iterator} reduceContext.errors - Serialized errors that were thrown during previous attempts to execute the
         *     reduce function on the current group
         * @param {number} reduceContext.executionNo - Number of times the reduce function has been executed on the current group
         * @param {boolean} reduceContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} reduceContext.key - Key to be processed during the reduce stage
         * @param {List<String>} reduceContext.values - All values associated with a unique key that was passed to the reduce stage
         *     for processing
         * @since 2015.2
         */
        const reduce = (reduceContext) => {
			var updateSHarr		= [];
			var newSHarr		= [];			
			var tempShId = '';

			log.debug('reduceContext', reduceContext);
			log.debug('Global file Id', fileId);

			var scriptObj 		= RUNTIME.getCurrentScript();
			var lineIdparam 	= scriptObj.getParameter({name: 'custscript_inv_shipment_header_line_id_2'});

			if(!_validateData(lineIdparam)) lineIdparam = 0;
			lineId= lineIdparam;  
			
			log.debug('reduceContext.key', reduceContext.key);
            log.debug('reduceContext.value: '+typeof(reduceContext.values),reduceContext.values);
			var lineNo =reduceContext.key;
			var cntxtValues = JSON.parse(reduceContext.values);
			if (lineNo==0){
				fileId = cntxtValues;
				log.debug('fileId = reduceContext.values', cntxtValues);
				reduceContext.write({
					key: 'fileId',
					value: fileId	
				})
				return;
			}
			if(lineNo==1){
				log.debug('JSON.parse:', cntxtValues);
				// Extract headers (first row) and data (remaining rows)
				colStatus = _validateFileHeader(cntxtValues, shipmentHeaderMapArr, fileId, 'Shipment Header');
				return;
			}
			if(colStatus=="OK"){
				log.debug('Columns verified', colStatus);
					var remainingUsage 	= scriptObj.getRemainingUsage(); 
					log.debug({title: '------ Remaining Usage at For loop start ', details:remainingUsage});

					var line = cntxtValues;				
					log.debug('Iteration Test:', line);
					var shipmentHeaderId = '';
						var etaWhDate		 = '';
						var shipmentHeaderArr = [];
						var lineValues 		 = cntxtValues.value.split(COL_DELIMETER);				
						var poId 			 = lineValues[14];
						var poLineId 		 = lineValues[15];
						var qtyShipped 		 = lineValues[18];
						
						log.debug ('lineValues for line '+(lineNo-1), 'Container '+lineValues[1]+', PO NO '+lineValues[13]+', Line Id '+lineValues[15]+', Qty Shipped'+lineValues[18]);
						
			
                       	if(_validateData(lineValues[0]) && _validateData(lineValues[1]) && _validateData(lineValues[2]) && _validateData(lineValues[13]) && _validateData(lineValues[14]))
						{
							try {
								var poObj = RECORD.load({ type: RECORD.Type.PURCHASE_ORDER, id: poId, isDynamic: true});
							}
							catch (e) {
								log.error ('Purchase Order does not exist.', 'PO No '+lineValues[13]);
								fileErrorObj.push({'line': (lineNo-1), 'error': 'Purchase Order does not exist',  'value': lineValues});
								return;
							}

							var lineNumber = poObj.findSublistLineWithValue({sublistId: 'item', fieldId: 'line', value: poLineId});
							
							// If Line Id does not exist on PO
							if(lineNumber < 0){
								log.debug('lineNumber', lineNumber);
								log.debug ('Line does not exist. Do not process line', poLineId);
								fileErrorObj.push({'line': x, 'error': 'Line id does not exist on the PO',  'value': lineValues});
								return;
							}						
							
							var isShipHeaderId	= poObj.getSublistValue({sublistId:'item', fieldId:'custcol_kl_shipment_header', line: lineNumber});
							var isClosed		= poObj.getSublistValue({sublistId:'item', fieldId:'isclosed', line: lineNumber});
							
							// if qtyShipped is 0 do not set Shipment Header to PO line only Planned ETD date will be updated to +1 day in _updatePOWithShipment function
							if(Number(qtyShipped) == 0) {
								log.debug ('qtyShipped is 0', (lineNo-1));
								shipmentHeaderId = '1'; 
							}
							else{
								
								// For AIRFREIGHT continer single Shipment Header created based on Shipment Reference and Bill Of Lading
								// for other containers Check Shipment header exist, if not create new Shipment Header record and push to newSH array
								if(lineValues[8].toUpperCase() == 'SYDNEY') {
									shipmentHeaderArr 	= _checkSydneyShipmentHeaderExist(lineValues[0], lineValues[1], lineValues[12], lineValues[11]);
								}								
								else if(lineValues[8].toUpperCase() == 'BRISBANE') {
									shipmentHeaderArr 	= _checkBrisbaneShipmentHeaderExist(lineValues[0], lineValues[1], lineValues[12], lineValues[11]);
								}
								else {
									shipmentHeaderArr 	= _checkShipmentHeaderExist(lineValues[0], lineValues[1], lineValues[12], lineValues[11], lineValues[8]);
								}
						
								shipmentHeaderId 	= shipmentHeaderArr[0];
								etaWhDate 			= shipmentHeaderArr[1];
																
								if(!_validateData(shipmentHeaderId)){
									shipmentHeaderArr 	= _createShipmentHeader(x, lineValues);
									shipmentHeaderId	= shipmentHeaderArr[0];									
									etaWhDate 			= shipmentHeaderArr[1];									
									newSHarr.push(Number(shipmentHeaderId));
								}
								else {
									log.debug ('shipmentHeaderId '+(lineNo-1), shipmentHeaderId);
									log.debug ('tempShId '+(lineNo-1), tempShId);
									log.debug ('lineValues '+(lineNo-1), lineValues);
									
									//if(lineValues[19].toUpperCase() == 'TRANSHIP' && (tempShId == '' || Number(tempShId) != Number(shipmentHeaderId))) 
									if(tempShId == '' || Number(tempShId) != Number(shipmentHeaderId)) 
									{
										log.debug ('Updating Shipment Header for TRANSHIP dates', (lineNo-1));
										_updateShipmentHeader(shipmentHeaderId, lineValues);
									}
									else {
										log.debug ('In else 4444', (lineNo-1));
									}
								}
								
								tempShId = shipmentHeaderId;
							}
							
							// if po line is closed skip the iteration do not process the line
							if(isClosed){
								log.debug ('Line is closed. Do not process line', (lineNo-1));
								return;
							}
							
							//  if Shipment header is already set, skip the iteration do not process the line
							if(_validateData(isShipHeaderId)){
								log.debug ('Already Shipment Header exist. Do not process line', (lineNo-1));
								return;
							}
							
							// Now update PO to set Shipment Header Id at line and split the PO lines if Shipped Qty is less than order qty
							if(_validateData(shipmentHeaderId)){								
								var updatedId 	= _updatePOWithShipment((lineNo-1), shipmentHeaderId, etaWhDate, lineValues, poObj);
								
								// If PO line is updated with SHid and SHid is not exist in both SH array then push it to updated SH array
								if(_validateData(updatedId) && (newSHarr.indexOf(Number(shipmentHeaderId)) == -1) && (updateSHarr.indexOf(Number(shipmentHeaderId)) == -1)){
									updateSHarr.push(Number(shipmentHeaderId));
								}
							}
							log.debug({title: '------ Remaining Usage at for loop end ', details:scriptObj.getRemainingUsage()});

						}
						else{
							fileErrorObj.push({'line': (lineNo-1), 'error': 'Required data not found for the fields : Shipment Reference, Container, Unique Identifier, PO Internal Id,	Line Id',  'value': lineValues});
						}

				if(newSHarr.length>0 || updateSHarr.length > 0){
					log.debug ('newSHarr', newSHarr);
					log.debug ('updateSHarr', updateSHarr);
					_sendSHNotification(newSHarr, updateSHarr);
				}
				
				//log.debug ('fileErrorObj '+fileErrorObj.length, fileErrorObj);
				if(fileErrorObj.length>0){
					var errorFileId = _createErrorCSVfile(fileErrorObj, fileName, shipmentHeaderMapArr, 0);
					SUBJECTTEXT 	= 'Axima Shipment Header File : Process Error';
					BODYMESSAGE 	= 'Hi,<br/><br/>Please find attached error file and the original file from Axima. Please do the needful.';
					
					log.debug ('Send Error email with 2 attachments ', SUBJECTTEXT);
					_sendEmailWithTwoAttachments(AUTHORID, PO_RECIPIENTSID, SUBJECTTEXT, BODYMESSAGE, fileId, errorFileId);			
					//FILE.delete({id: errorFileId});
				}			
			}
			else{
				log.error('Error in columns of file:', "Please validate file columns");				
			}	
			
				
        }


        /**
         * Defines the function that is executed when the summarize entry point is triggered. This entry point is triggered
         * automatically when the associated reduce stage is complete. This function is applied to the entire result set.
         * @param {Object} summaryContext - Statistics about the execution of a map/reduce script
         * @param {number} summaryContext.concurrency - Maximum concurrency number when executing parallel tasks for the map/reduce
         *     script
         * @param {Date} summaryContext.dateCreated - The date and time when the map/reduce script began running
         * @param {boolean} summaryContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Iterator} summaryContext.output - Serialized keys and values that were saved as output during the reduce stage
         * @param {number} summaryContext.seconds - Total seconds elapsed when running the map/reduce script
         * @param {number} summaryContext.usage - Total number of governance usage units consumed when running the map/reduce
         *     script
         * @param {number} summaryContext.yields - Total number of yields when running the map/reduce script
         * @param {Object} summaryContext.inputSummary - Statistics about the input stage
         * @param {Object} summaryContext.mapSummary - Statistics about the map stage
         * @param {Object} summaryContext.reduceSummary - Statistics about the reduce stage
         * @since 2015.2
         */
        const summarize = (summaryContext) => {
			summaryContext.output.iterator().each(function (key, fileId){
				log.audit({
					title: ' summary.output.iterator',
					details: 'key: ' + key + ' / value: ' + fileId
				});
				log.debug({title: "NS temp file delete", details: fileId});
				FILE.delete({id: fileId});
			});
			var scriptObj 		= RUNTIME.getCurrentScript();
			var deploymentId 	= scriptObj.deploymentId;
			
			if(deploymentId != 'customdeploy_inv_axima_shipment_header'){

			var sftpConnection 	= getSFTPConnection(SFTP_USERNAME, SFTP_PASSWORDGUID, SFTP_URL, SFTP_HOSTKEY, SFTP_HOSTKEYTYPE, SFTP_PORT, SFTP_DIRECTORY , 20);
			var dirList 	= sftpConnection.list({path: SFTP_SHIPMENT_DIR+SFTP_NEW_DIRECTORY});
			log.debug({title: "dirList", details: dirList});
					
			for (var d in dirList){			
				if(dirList[d].directory == false){
					var shipmentFileName	= _setshipmentFileName(dirList[d].name);

					log.debug({title: "shipmentFileName", details: shipmentFileName});
				}
			}
			sftpConnection.move({
				from: SFTP_SHIPMENT_DIR+SFTP_NEW_DIRECTORY+shipmentFileName,
				to: SFTP_SHIPMENT_DIR+SFTP_PROCESSED_DIRECTORY+shipmentFileName
			});
		}			
    	}

        return {getInputData, 
				// map,
				reduce,
				summarize}

    });

function _setshipmentFileName (fileName){
	shipFileName = fileName;
	return fileName;
}

	function _processShipmentFile(fileId, lineId)
{
	try{
		fileErrorObj		= [];
		var iteratorLineArr = [];
		
		var csvFileObj 		= FILE.load({ id: fileId });
		var fileName		= csvFileObj.name;
		var iterator 		= csvFileObj.lines.iterator();		
		//var currentDate		= _getCurrentDate();
		
		iterator.each(function (line) {iteratorLineArr.push(line); return true;});
        
        return iteratorLineArr;				
	}
	catch (e) {
		log.error({title: 'Error In _processShipmentFile: '+e.name, details: e.message});		
	}	
}

function _sendSHNotification(newSHarr, updateSHarr)
{
	SUBJECTTEXT 	= 'Notification: Shipment Header Created/Amended today';
	BODYMESSAGE 	= 'Hi,<br/><br/>Please find below list of Shipment Headers created/amended today.<br/>';
	
	if(newSHarr.length > 0){
		BODYMESSAGE 	+= '<br/><b>Created</b><br/>';
		BODYMESSAGE 	+= _getSHdetail(newSHarr);
	}
	
	if(updateSHarr.length > 0){
		BODYMESSAGE 	+= '<br/><b>Amended</b><br/>';
		BODYMESSAGE 	+= _getSHdetail(updateSHarr);
		
		BODYMESSAGE 	+= '<br><a href="https://4515584.app.netsuite.com/app/common/search/searchresults.nl?searchid=4365" target="_blank">Click Here</a> to view the amendments of Shipment Headers.<br/>';
	}
	
	
	BODYMESSAGE 		+= '<br/>Regards,<br/>Simba Global';
	
	log.debug ('_sendSHNotification func', BODYMESSAGE);
	_sendErrorEmail(AUTHORID, PO_RECIPIENTSID, SUBJECTTEXT, BODYMESSAGE);
}

function _getSHdetail(SHarr)
{
	var shStr	= '<table border="1" cellpadding="5" cellspacing="0"><tr><td>Shipment Header #</td><td>Shipment Reference</td><td>Container #</td></tr>';
	try{		
		var searchObj 		= SEARCH.create({type: "customrecord_os_shiphead",
								   filters:
								   [									
									  ["internalid", "anyof", SHarr]										 
								   ],
								   columns:
								   [
									  SEARCH.createColumn({name: "internalid", label: "Internal ID", sort: SEARCH.Sort.ASC}),
									  SEARCH.createColumn({name: "name", label: "Name"}),
									  SEARCH.createColumn({name: "custrecord_os_ship_reference", label: "Shipment Reference"}),
									  SEARCH.createColumn({name: "custrecord_os_sh_containernum", label: "Container #"})
								   ]
								});		
		
		searchObj.run().each(function(result){
			var shNo 		= result.getValue({name: "name"});	
			var shRef 		= result.getValue({name: "custrecord_os_ship_reference"});	
			var container 	= result.getValue({name: "custrecord_os_sh_containernum"});	
			
			shStr			+= '<tr><td>'+shNo+'</td><td>'+shRef+'</td><td>'+container+'</td></tr>';
			return true;		  
		});
		shStr +'</table><br/>';

	} catch (e) {
		log.error ({title: e.name,	details: 'Error In Function _getSHdetail :'+e.message});
	}
	
	return shStr;
}

function _updatePOWithShipment(lineIndex, shipmentHeaderId, etaWhDate, lineValues, poObj)
{
	var newPlannedETD 		= '';
	if(_validateData(shipmentHeaderId) && lineValues.length > 0){
		var poId 			= lineValues[14];
		var poLineId 		= lineValues[15];
		var qty 			= lineValues[17];
		var qtyShipped 		= lineValues[18];
		
		try{
			//if(!_validateData(poObj)){
				log.debug ('again load PO if Object not found', poId);
				var poObj 		= RECORD.load({ type: RECORD.Type.PURCHASE_ORDER, id: poId, isDynamic: true});
			//}
			
			var lineNumber 		= poObj.findSublistLineWithValue({sublistId: 'item', fieldId: 'line', value: poLineId});
			log.debug ('lineNumber from PO internal id '+poId, lineNumber);
			if(lineNumber == -1){
				fileErrorObj.push({'line': lineIndex, 'error': 'Invalid Line Id',  'value': lineValues});
				return '';
			}		
			
			var quantity 		= poObj.getSublistValue({sublistId:'item', fieldId:'quantity', line: lineNumber});
			var plannedETD		= poObj.getSublistValue({sublistId:'item', fieldId:'custcol_os_planned_etd', line: lineNumber});
			var isShipHeaderId	= poObj.getSublistValue({sublistId:'item', fieldId:'custcol_kl_shipment_header', line: lineNumber});
			var isClosed		= poObj.getSublistValue({sublistId:'item', fieldId:'isclosed', line: lineNumber});
			
			if(isClosed){
				log.debug ('_updatePOWithShipment Line is closed. ', lineIndex);
				return '';
			}
			
			if(_validateData(isShipHeaderId)){
				log.debug ('_updatePOWithShipment Already Shipment Header exist for line '+lineIndex, isShipHeaderId);
				return '';
			}
			
			if(_validateData(plannedETD)){
				var newDate		= plannedETD.setDate(plannedETD.getDate() + 1);
				newPlannedETD 	= new Date(newDate);				
			}
			
			// If Shipped Qty is zero thenchange the Planned ETD date to +1 day
			if(Number(qtyShipped) == 0){				
				if(_validateData(newPlannedETD)){
					log.debug ('new Planned ETD set for csv line '+lineIndex, newPlannedETD);
					
					poObj.selectLine({sublistId: 'item',line: lineNumber});
					poObj.setCurrentSublistValue({sublistId: 'item', fieldId:'custcol_os_planned_etd', value:newPlannedETD});
					poObj.commitLine({sublistId: 'item'});
					
					poObj.save({enableSourcing: true,ignoreMandatoryFields: false});			
					return '';
				}
			}
			else
			{
				var remainingQty	= Number(quantity) - Number(qtyShipped);
				var lineData 		= {};
				var fieldsToCopy	= [
										'rate',
										'expectedreceiptdate', 
										'custcol_os_delivery_request_date', 
										'custcol_os_delivery_shipped_date',
										'department',
										'class',
										'landedcostcategory',
										'customer',
										'isbillable',
										'custcol_os_status',
										'matchbilltoreceipt',									
										'custcol_kl_shipment_mode',
										'custcol_kl_shipment_payer',
										'custcol_kl_edt',
										'taxcode'
									];

				// If Shipped QTY < PO Line QTY then
				// update the current line with Shipment header and quantity shipped
				poObj.selectLine({sublistId: 'item',line: lineNumber});
				poObj.setCurrentSublistValue({sublistId: 'item', fieldId:'quantity', value:Number(qtyShipped)});
				poObj.setCurrentSublistValue({sublistId: 'item', fieldId:'custcol_kl_quantity_shipped', value:Number(qtyShipped)});
				poObj.setCurrentSublistValue({sublistId: 'item', fieldId:'custcol_kl_shipment_header', value:shipmentHeaderId});			
				
				var itemId = poObj.getCurrentSublistValue({sublistId: 'item', fieldId: 'item'});
				fieldsToCopy.forEach(function(field) {
					lineData[field] = poObj.getCurrentSublistValue({sublistId: 'item', fieldId: field});
				});
				
				if(_validateData(etaWhDate)) {
					log.debug('etaWhDate >>>', etaWhDate);
					poObj.setCurrentSublistValue({sublistId: 'item', fieldId:'custcol_os_delivery_request_date', value: etaWhDate});			
				}
				poObj.commitLine({sublistId: 'item'});
					
				if (remainingQty > 0) {
					// Split the PO Line into the original line with shiped quantity and new line with QTY updated to Remaining
					// Insert new line for the same Item where the QTY  = remainingQty
					poObj.selectNewLine({sublistId: 'item'});
					poObj.setCurrentSublistValue({sublistId: 'item', fieldId:'item', value:itemId});
					poObj.setCurrentSublistValue({sublistId: 'item', fieldId:'quantity', value:Number(remainingQty)});			
					if(_validateData(newPlannedETD)) {
						poObj.setCurrentSublistValue({sublistId: 'item', fieldId:'custcol_os_planned_etd', value:newPlannedETD});
						log.debug ('new Planned ETD set for splitted new line '+lineIndex, newPlannedETD);
					}
				
					Object.keys(lineData).forEach(function(key){
						if (!!lineData[key]) {
							poObj.setCurrentSublistValue({sublistId:'item', fieldId:key, value:lineData[key]});
						}
					});

					poObj.commitLine({sublistId: 'item'});
				}
				var Id 	= poObj.save({enableSourcing: true,ignoreMandatoryFields: false});			
				return Id;
			}			
		}
		catch (e) {
			log.error({title: 'Error In _updatePOWithShipment: '+e.name, details: e.message});
			fileErrorObj.push({'line': lineIndex, 'error': 'Error while updating Purchase Order : '+e.name+' : '+e.message,  'value': lineValues});
		}
	}	
}

function _getCurrentDate(){
	var customRecObj 	= RECORD.load({type: 'customrecord_current_date', id: 1, isDynamic: true});	
	var todaysDate 		= customRecObj.getValue({fieldId: 'custrecord_current_date'});	
	todaysDate 			= FORMAT.format({value: todaysDate, type: FORMAT.Type.DATE});
	
	log.debug({title: '_getCurrentDate 1 todaysDate', details: todaysDate});
	
	if(!_validateData(todaysDate)){
		var today 	= new Date();
		var dd 		= String(today.getDate());
		var mm 		= String(today.getMonth() + 1);
		var yyyy 	= today.getFullYear();

		todaysDate 	= dd + '/' + mm + '/' + yyyy;
	}
	
	log.debug({title: '_getCurrentDate 2 todaysDate', details: todaysDate});
	return todaysDate;
}

function _checkSydneyShipmentHeaderExist(shipmentRef, container, locationId, billOfLading)
{
	var shipmentHeaderId;
	var warehouse;
	var etaWhDate;
	var loc3PlNsw = 152;
	
	try{
		var filters	 = [];
		filters.push(["isinactive","is","F"]);
		filters.push('AND');
		filters.push(["custrecord_os_ship_reference","is", shipmentRef]);
		filters.push('AND');
		filters.push(["custrecord_os_sh_containernum","is", container]);
		
		if(container == 'AIRFREIGHT' && _validateData(billOfLading)){			
			log.debug ('billOfLading ', billOfLading);
			
			filters.push('AND');	
			filters.push(["custrecord_kl_bill_of_lading", "is", billOfLading]);		
		}
	
		// Condition removed from search => ["custrecord_inv_axima_ref_id","is", aximaId]
		var searchObj 		= SEARCH.create({type: "customrecord_os_shiphead",
								   filters:
								   [
										filters										
								   ],
								   columns:
								   [
									  SEARCH.createColumn({name: "internalid", label: "Internal ID", sort: SEARCH.Sort.DESC}),
									  SEARCH.createColumn({name: "custrecord_os_shipment_finaldest", label: "Warehouse"}),
									  SEARCH.createColumn({name: "custrecord_kl_ship_warehouse_eta", label: "Warehouse ETA"})
								   ]
								});		
				
		
		var searchResult 	= searchObj.run().getRange({start: 0, end: 1});
		if(_validateData(searchResult)){
			shipmentHeaderId 	= searchResult[0].getValue({name: "internalid"});		
			warehouse 	= searchResult[0].getValue({name: "custrecord_os_shipment_finaldest"});		
			etaWhDate 	= searchResult[0].getValue({name: "custrecord_kl_ship_warehouse_eta"});
			
			var etaWhDateArr = etaWhDate.split("/");
			etaWhDate  = etaWhDateArr[2]+'/'+etaWhDateArr[1]+'/'+etaWhDateArr[0];
			etaWhDate = new Date(etaWhDate);
			
			log.debug ('locationId >>>> ', locationId);
			log.debug ('warehouse >>>> ', warehouse);
			
			if(locationId == loc3PlNsw && warehouse != loc3PlNsw) {
				log.debug ('updte warehouse >>>> ', loc3PlNsw);
				var shipHeadObj 	= RECORD.load({type: 'customrecord_os_shiphead', id: shipmentHeaderId, isDynamic: true});	
				shipHeadObj.setValue({fieldId: 'custrecord_os_shipment_finaldest', value: loc3PlNsw}); // 152
				shipHeadObj.save({enableSourcing: true, ignoreMandatoryFields: false});		
			}
		}
		log.debug ('_checkSydneyShipmentHeaderExist shipmentHeaderId ', shipmentHeaderId);

	} catch (e) {
		log.error ({title: e.name,	details: 'Error In Function _checkSydneyShipmentHeaderExist :'+e.message});
	}
	
	return [shipmentHeaderId, etaWhDate];
}

function _checkBrisbaneShipmentHeaderExist(shipmentRef, container, locationId, billOfLading)
{
	var shipmentHeaderId;
	var warehouse;
	var etaWhDate;
	var loc3PlQld = 153;
	
	try{
		var filters	 = [];
		filters.push(["isinactive","is","F"]);
		filters.push('AND');
		filters.push(["custrecord_os_ship_reference","is", shipmentRef]);
		filters.push('AND');
		filters.push(["custrecord_os_sh_containernum","is", container]);
		
		if(container == 'AIRFREIGHT' && _validateData(billOfLading)){			
			log.debug ('billOfLading ', billOfLading);
			
			filters.push('AND');	
			filters.push(["custrecord_kl_bill_of_lading", "is", billOfLading]);		
		}
	
		// Condition removed from search => ["custrecord_inv_axima_ref_id","is", aximaId]
		var searchObj 		= SEARCH.create({type: "customrecord_os_shiphead",
								   filters:
								   [
										filters										
								   ],
								   columns:
								   [
									  SEARCH.createColumn({name: "internalid", label: "Internal ID", sort: SEARCH.Sort.DESC}),
									  SEARCH.createColumn({name: "custrecord_os_shipment_finaldest", label: "Warehouse"}),
									  SEARCH.createColumn({name: "custrecord_kl_ship_warehouse_eta", label: "Warehouse ETA"})
								   ]
								});		
				
		
		var searchResult 	= searchObj.run().getRange({start: 0, end: 1});
		if(_validateData(searchResult)){
			shipmentHeaderId 	= searchResult[0].getValue({name: "internalid"});		
			warehouse 	= searchResult[0].getValue({name: "custrecord_os_shipment_finaldest"});		
			etaWhDate 	= searchResult[0].getValue({name: "custrecord_kl_ship_warehouse_eta"});
			
			var etaWhDateArr = etaWhDate.split("/");
			etaWhDate  = etaWhDateArr[2]+'/'+etaWhDateArr[1]+'/'+etaWhDateArr[0];
			etaWhDate = new Date(etaWhDate);
			
			log.debug ('locationId >>>> ', locationId);
			log.debug ('warehouse >>>> ', warehouse);
			
			if(locationId == loc3PlQld && warehouse != loc3PlQld) {
				log.debug ('updte warehouse >>>> ', loc3PlQld);
				var shipHeadObj 	= RECORD.load({type: 'customrecord_os_shiphead', id: shipmentHeaderId, isDynamic: true});	
				shipHeadObj.setValue({fieldId: 'custrecord_os_shipment_finaldest', value: loc3PlQld}); // 153
				shipHeadObj.save({enableSourcing: true, ignoreMandatoryFields: false});		
			}
		}
		log.debug ('_checkBrisbaneShipmentHeaderExist shipmentHeaderId ', shipmentHeaderId);

	} catch (e) {
		log.error ({title: e.name,	details: 'Error In Function _checkBrisbaneShipmentHeaderExist :'+e.message});
	}
	
	return [shipmentHeaderId, etaWhDate];
}

function _checkShipmentHeaderExist(shipmentRef, container, locationId, billOfLading, arrivalPort)
{
	var shipmentHeaderId;
	var etaWhDate;
	
	try{
		
		if(arrivalPort.toUpperCase() == 'MELBOURNE' && (locationId != 12 || locationId != 15)) {
			if(shipmentRef == 'COMMERCIAL') 
				locationId = 12 
			else 
				locationId = 15;
		}
			
		var filters	 = [];
		filters.push(["isinactive","is","F"]);
		filters.push('AND');
		filters.push(["custrecord_os_ship_reference","is", shipmentRef]);
		filters.push('AND');
		filters.push(["custrecord_os_sh_containernum","is", container]);
		filters.push('AND');
		filters.push(["custrecord_os_shipment_finaldest","anyof", locationId]);
		
		if(container == 'AIRFREIGHT' && _validateData(billOfLading)){		
			log.debug ('billOfLading ', billOfLading);
			
			filters.push('AND');	
			filters.push(["custrecord_kl_bill_of_lading", "is", billOfLading]);		
		}
	
		// Condition removed from search => ["custrecord_inv_axima_ref_id","is", aximaId]
		var searchObj 		= SEARCH.create({type: "customrecord_os_shiphead",
								   filters:
								   [
										filters										
								   ],
								   columns:
								   [
									  SEARCH.createColumn({name: "internalid", label: "Internal ID", sort: SEARCH.Sort.DESC}),
									  SEARCH.createColumn({name: "custrecord_kl_ship_warehouse_eta", label: "Warehouse ETA"})
								   ]
								});		
				
		
		var searchResult 	= searchObj.run().getRange({start: 0, end: 1});
		if(_validateData(searchResult)){
			shipmentHeaderId 	= searchResult[0].getValue({name: "internalid"});		
			etaWhDate 	= searchResult[0].getValue({name: "custrecord_kl_ship_warehouse_eta"});
			
			var etaWhDateArr = etaWhDate.split("/");
			etaWhDate  = etaWhDateArr[2]+'/'+etaWhDateArr[1]+'/'+etaWhDateArr[0];
			etaWhDate = new Date(etaWhDate);
		}
		log.debug ('_checkShipmentHeaderExist shipmentHeaderId ', shipmentHeaderId);

	} catch (e) {
		log.error ({title: e.name,	details: 'Error In Function _checkShipmentHeaderExist :'+e.message});
	}
	
	return [shipmentHeaderId, etaWhDate];
}

function _createShipmentHeader(lineIndex, fileFieldValueArr)
{
	var shipmentHeaderId;
	var etaWhDate;
	try{
		var customRecObj 	= RECORD.create({type: 'customrecord_os_shiphead', isDynamic: true});	
		customRecObj.setValue({fieldId: 'custrecord_os_ship_supplier', value: SUPPLIER_AXIMA_LOGISTICS}); // SHIPPER 
		customRecObj.setValue({fieldId: 'custrecord_kl_ship_clearing_agent', value: SUPPLIER_AXIMA_LOGISTICS});
		customRecObj.setValue({fieldId: 'custrecord_os_ship_status', value: 1}); // Status = 1 = Shipped
		
		customRecObj.setValue({fieldId: 'custrecord_os_ship_reference', value: fileFieldValueArr[0]}); // SHIPMENT REFERENCE
		
		if(_validateData(fileFieldValueArr[1]))
			customRecObj.setValue({fieldId: 'custrecord_os_sh_containernum', value: fileFieldValueArr[1]}); // CONTAINER #
		
		if(_validateData(fileFieldValueArr[2]))
			customRecObj.setValue({fieldId: 'custrecord_inv_axima_ref_id', value: fileFieldValueArr[2]}); //  Axima Ref Id
		
		if(_validateData(fileFieldValueArr[3]))
			customRecObj.setValue({fieldId: 'custrecord_inv_vessel_name', value: fileFieldValueArr[3]}); // VESSEL NAME
		
		if(_validateData(fileFieldValueArr[4]))
			customRecObj.setText({fieldId: 'custrecord_kl_shipment_mode', text: fileFieldValueArr[4]}); // SHIPMENT MODE
		
		if(_validateData(fileFieldValueArr[5]))
			customRecObj.setText({fieldId: 'custrecord_kl_shipment_type', text: fileFieldValueArr[5]}); // SHIPMENT TYPE
		
		if(_validateData(fileFieldValueArr[6]))
			customRecObj.setText({fieldId: 'custrecord_os_shipment_portdischarge', text: fileFieldValueArr[6]}); // DEPARTURE PORT
		
		if(_validateData(fileFieldValueArr[7])){
			customRecObj.setValue({fieldId: 'custrecord_os_ship_date', value: _parseDate(fileFieldValueArr[7])});  // DEPARTURE PORT ETD
		}
		
		if(_validateData(fileFieldValueArr[6]))
			customRecObj.setText({fieldId: 'custrecord_kl_ship_arrival_port', text: fileFieldValueArr[8]}); // ARRIVAL PORT
		
		if(_validateData(fileFieldValueArr[9])){
			var etaWhDateArr = fileFieldValueArr[9].split("/");
			etaWhDate  = etaWhDateArr[2]+'/'+etaWhDateArr[1]+'/'+etaWhDateArr[0];
			etaWhDate = new Date(etaWhDate);
			etaWhDate.setDate(etaWhDate.getDate() + 5); //updated from 4 to 7 days as per Amand's email on 5th May 2022
					
			customRecObj.setValue({fieldId: 'custrecord_os_due_date', value: _parseDate(fileFieldValueArr[9])}); // ARRIVAL PORT ETA
			customRecObj.setValue({fieldId: 'custrecord_kl_ship_warehouse_eta', value: etaWhDate}); //Warehouse ETA	= ARRIVAL PORT ETA + 4days		
		}
		
		/* if(_validateData(fileFieldValueArr[10])){			
			customRecObj.setValue({fieldId: 'custrecord_kl_ship_warehouse_eta', value: _parseDate(fileFieldValueArr[10])}); //Warehouse ETA
		} */
		
		if(_validateData(fileFieldValueArr[11]))
			customRecObj.setValue({fieldId: 'custrecord_kl_bill_of_lading', value: fileFieldValueArr[11]}); // 	Bill of Lading
		
		if(_validateData(fileFieldValueArr[12])) {
			var locationId = fileFieldValueArr[12];
			
			if(fileFieldValueArr[8].toUpperCase() == 'MELBOURNE') {
				if(fileFieldValueArr[0] == 'COMMERCIAL') 
					locationId = 12 
				else 
					locationId = 15;
			}
		
			customRecObj.setValue({fieldId: 'custrecord_os_shipment_finaldest', value: locationId});// Warehouse
		}
		
		// DIRECT/TRANSHIP
		if(_validateData(fileFieldValueArr[19])){
			var dirTrans = 1;
			if((fileFieldValueArr[19]).toUpperCase() == 'TRANSHIP') dirTrans = 2;
			customRecObj.setValue({fieldId: 'custrecord_inv_direct_tranship', value: dirTrans});
		}
		
		// ETA INTO TRANSHIP PORT
		if(_validateData(fileFieldValueArr[20])){
			customRecObj.setValue({fieldId: 'custrecord_inv_eta_into_tranship_port', value: _parseDate(fileFieldValueArr[20])});
		}
		
		// ETD OUT OF TRANSHIP PORT
		if(_validateData(fileFieldValueArr[21])){
			customRecObj.setValue({fieldId: 'custrecord_inv_eta_out_of_tranship_port', value: _parseDate(fileFieldValueArr[21])});
		}
		
		// ATD OUT OF TRANSHIP PORT
		if(_validateData(fileFieldValueArr[22])){
			customRecObj.setValue({fieldId: 'custrecord_inv_atd_out_of_tranship_port', value: _parseDate(fileFieldValueArr[22])});  
		}
		
		shipmentHeaderId	= customRecObj.save({enableSourcing: true,ignoreMandatoryFields: false});		
		
	}
	catch (e) {
		log.error({title: 'Error In _createShipmentHeader: '+e.name, details: e.message});		
		fileErrorObj.push({'line': lineIndex, 'error': 'Error for creating Shipment Header record : '+e.name+' : '+e.message,  'value': fileFieldValueArr});
	}
	
	return [shipmentHeaderId, etaWhDate];
}


function _updateShipmentHeader(shId, fileFieldValueArr) {
	var Id 	= '';
	var etaWhDate;
	
	if(_validateData(shId)){
		var shObj 		= RECORD.load({ type: 'customrecord_os_shiphead', id: shId, isDynamic: true});
		
		if(_validateData(fileFieldValueArr[19])){
			var dirTrans = 1;
			if((fileFieldValueArr[19]).toUpperCase() == 'TRANSHIP') dirTrans = 2;
			shObj.setValue({fieldId: 'custrecord_inv_direct_tranship', value: dirTrans});
		}
		
		if(_validateData(fileFieldValueArr[20])){
			shObj.setValue({fieldId: 'custrecord_inv_eta_into_tranship_port', value: _parseDate(fileFieldValueArr[20])});
		}
		
		if(_validateData(fileFieldValueArr[21])){
			shObj.setValue({fieldId: 'custrecord_inv_eta_out_of_tranship_port', value: _parseDate(fileFieldValueArr[21])});
		}
		
		if(_validateData(fileFieldValueArr[22])){
			shObj.setValue({fieldId: 'custrecord_inv_atd_out_of_tranship_port', value: _parseDate(fileFieldValueArr[22])});
		}
		
		// Vessle Name
		if(_validateData(fileFieldValueArr[3])){
			shObj.setValue({fieldId: 'custrecord_inv_vessel_name', value: fileFieldValueArr[3]});
		}
		
		// Added on 5 Dec 2022
		if(_validateData(fileFieldValueArr[9])){
			var etaWhDateArr = fileFieldValueArr[9].split("/");
			etaWhDate  = etaWhDateArr[2]+'/'+etaWhDateArr[1]+'/'+etaWhDateArr[0];
			etaWhDate = new Date(etaWhDate);
			etaWhDate.setDate(etaWhDate.getDate() + 5);
					
			shObj.setValue({fieldId: 'custrecord_os_due_date', value: _parseDate(fileFieldValueArr[9])}); // ARRIVAL PORT ETA
			shObj.setValue({fieldId: 'custrecord_kl_ship_warehouse_eta', value: etaWhDate}); //Warehouse ETA	= ARRIVAL PORT ETA + 4days		
		}
		
		Id 	= shObj.save({enableSourcing: true,ignoreMandatoryFields: false});
	}

	return Id;

}
