 /* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
 ||   This is a Suitelet Script for Border Express Integration Debug   	||
 ||   with NetSuite in Suitescript 2.0                                  ||
 ||                                                              		||
 ||                                                               		||
 ||  Version Date         Author        	Remarks                   	||
 ||  1.0     Sep 28 2020  Supriya Gunjal  	Initial commit            	|| 
  \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
 
/**
 * @NApiVersion 2.0
 * @NScriptType Suitelet
 */
 
var HTTPS, RUNTIME, CONFIG, ERROR, FILE, TASK, EMAIL, RECORD, FORMAT, SEARCH;
var BORDEREXPRESS_API_URL, TOKEN_URL, CLIENT_ID, CLIENT_SECRET;
var conStatusArr = [], errorArr	= [];

define(['./INV_Integrations_LIB', 'N/https','N/runtime', 'N/config', 'N/error', 'N/file', 'N/task', 'N/email', 'N/record', 'N/format', 'N/search'], runBXSL);

function runBXSL(INV_Integrations_LIB, https, runtime, config, error, file, task, email, record, format, search) {
	COMMONFUNC	= INV_Integrations_LIB;	
	HTTPS		= https;
	RUNTIME 	= runtime;
	CONFIG 		= config;	
	ERROR 		= error;
	EMAIL		= email;
	RECORD		= record;
	FORMAT		= format;	
	SEARCH		= search;
	FILE 		= file;
	TASK		= task;
	
	return {
		onRequest: exeBorderExpressIntegration
	}
}

function exeBorderExpressIntegration(context) {
	
	BORDEREXPRESS_API_URL	= 'https://api.borderexpress.com.au/';
	TOKEN_URL				= 'https://api.borderexpress.com.au/token';
	CLIENT_ID 				= 'c854912f.0c15.42b8.a703.ccd7a9de3c56';	
	CLIENT_SECRET 			= 'dkkT+E1ZbAKo9JSZYHu5PJtrPd3XPnE3';	
	
	try {		
		var ifArr			= [];
		var nextIfId 		= 4870592; //4922340; //3120339;
		var scriptObj 		= RUNTIME.getCurrentScript();
		var statusListId 	= 776;
		var podsFolderId	= 2206645;
		var folderId 		= 2206645;
				
		// Update global array with Custom List - 'BorderExp Consignment Status' custom list
		conStatusArr 		= _getCustomListValKey(statusListId);
		
		// Generate Access Token from Border Express
		var access_token 	= _generateAccessToken();
		if(!_validateData(access_token)) return;
			
		
		// Get All Item Fulfillment which does not delivered / SIMW0008307;
		var ifSearchObj 	= _getIFSearch(nextIfId);		
		var resultCount 	= ifSearchObj.runPaged().count;
		log.debug("ifSearchObj result count",resultCount);			
		
		var cnt	= 0;
		ifSearchObj.run().each(function(result){
			var tranid 		= result.getValue({name: 'tranid'});
			var ifId 		= result.getValue({name: 'internalid'});
			var connoteNo 	= result.getValue({name: 'trackingnumbers'});
			cnt++;
			
			//log.debug({title: 'Remaining Usage before IF internalid = '+ifId, details:scriptObj.getRemainingUsage()});
			log.debug("IF internalid, connoteNo for cnt="+cnt, 'IF internalid = '+ifId+' connoteNo = '+connoteNo);			
			
			var connoteObj	= _getConnoteDetails(access_token, connoteNo, tranid);			
			var podDetailObj = _getConnotePODdetails(access_token, connoteNo, tranid);			
			var statusObj	= _getConnoteStatusHistory(access_token, connoteNo, tranid);					
			var podFileId 	= '';
			
			if(_validateData(ifId) && _validateData(connoteObj) && _validateData(statusObj)){				
				if(connoteObj.Status == 'Delivered'){
					podFileId 	= _getConnotePOD(access_token, connoteNo, folderId, tranid);
					
					log.debug("podFileId ", podFileId);
				}
				
				//_updateConsignmentToIF(ifId, connoteObj, statusObj, podFileId);			
			}			
		});
		
		
	}catch (e) {
		log.error({title: 'Error In exeBorderExpressIntegration: '+e.name, details: e.message});
		
	}	
}


function _getIFSearch(nextIfId)
{
	var filters	 = [];
	
	var configRecObj 	= CONFIG.load({type: CONFIG.Type.COMPANY_PREFERENCES});
	var shipMethodIds 	= configRecObj.getValue({fieldId : 'custscript_inv_be_pref_shipping_method'});
	var shipMethodIdArr = shipMethodIds.split(",");
	//log.debug("shipMethodIds",shipMethodIds);		
	
	filters.push(["type","anyof","ItemShip"]);
	filters.push('AND');
	filters.push(["mainline","is","T"]);
	filters.push('AND');
	filters.push(["trackingnumber","isnotempty",""]);
	//filters.push('AND');
	//filters.push(["custbody_inv_be_consignment_status","noneof","5"]);  // consignment status = 5 = Delivered
	filters.push('AND');
	filters.push(["status","anyof","ItemShip:C"]);
	filters.push('AND');
	//filters.push(["formulatext: {trackingnumbers}","doesnotcontain","CN"]);
	filters.push(["formulatext: {trackingnumbers}","startswith","S"]);
	filters.push('AND');
	filters.push(["trandate","onorafter","19/10/2020"]);
	
	if(_validateData(shipMethodIdArr)){
		filters.push('AND');
		filters.push(["shipmethod", "anyof", shipMethodIdArr]);
	}
	
	if(_validateData(nextIfId)){
		filters.push('AND');
		filters.push(["internalid","anyof", nextIfId]);		
	}
	var searchObj 	= SEARCH.create({
						   type: "itemfulfillment",
						   filters:
						   [
							  filters
						   ],
						   columns:
						   [
							  SEARCH.createColumn({name: "internalid", sort: SEARCH.Sort.ASC,label: "Internal ID"}),
							  SEARCH.createColumn({name: "tranid", label: "Document Number"}),
							  SEARCH.createColumn({name: "trackingnumbers", label: "Tracking Numbers"})
						   ]
						});
	
	return searchObj;
}

function _updateConsignmentToIF(ifId, connoteObj, statusObj, podFileId)
{	
	try{				
		var newline		= 0;
		var beSublistId	= 'recmachcustrecord_be_if_ref';
		var etaDate		= _convertBorderExpressDate(connoteObj.ETADate);	
		
		var ifObj 		= RECORD.load({ type: RECORD.Type.ITEM_FULFILLMENT, id: ifId, isDynamic: false});
		var lineCnt		= ifObj.getLineCount({ sublistId: beSublistId });
		
		log.debug("_updateConsignmentToIF ifObj lineCnt of ifId = "+ifId, lineCnt);		
		log.debug("consignment_status ", conStatusArr[connoteObj.Status]);
		
		ifObj.setValue({fieldId: 'custbody_inv_be_consignment_status' , value: conStatusArr[connoteObj.Status]});
		if(_validateData(etaDate)){
			ifObj.setValue({fieldId: 'custbody_inv_be_eta_date' , value: etaDate});
		}
		
		if(_validateData(podFileId) && podFileId > 0){
			ifObj.setValue({fieldId: 'custbody_inv_be_pod_fileid' , value: podFileId});
		}
		
		// Remove existing lines of Status History
		for (var i = lineCnt-1; i >= 0; i--) {
			ifObj.removeLine({sublistId: beSublistId, line:i});
		}		
		
		var suburb = '';
		// Add new lines of Status History
		for (var k in statusObj) {
			//log.debug({title:'statusObj key'+k, details: statusObj[k].Status}); // Unsaved/Despatched/In Transit/On Board/Delivered
			//log.debug({title:'statusObj key'+k, details: statusObj[k].DateOccurred}); // 2020-10-12T13:38:08+11:00
			if(k == 0) { suburb = statusObj[k].Suburb}
			ifObj.setSublistValue({sublistId: beSublistId, fieldId: 'custrecord_be_consignment_status', value: conStatusArr[statusObj[k].Status], line: newline});
			ifObj.setSublistValue({sublistId: beSublistId, fieldId: 'custrecord_be_date_occurred', value: _convertBorderExpressDate(statusObj[k].DateOccurred), line: newline});
			ifObj.setSublistValue({sublistId: beSublistId, fieldId: 'custrecord_be_eta_date', value: etaDate, line: newline});
			ifObj.setSublistValue({sublistId: beSublistId, fieldId: 'custrecord_be_suburb', value:statusObj[k].Suburb, line: newline});
			ifObj.setSublistValue({sublistId: beSublistId, fieldId: 'custrecord_be_state', value:statusObj[k].State, line: newline});
			ifObj.setSublistValue({sublistId: beSublistId, fieldId: 'custrecord_be_postcode', value:statusObj[k].Postcode, line: newline});
			
			newline++;
		}	
		ifObj.setValue({fieldId: 'custbody_inv_be_suburb' , value: suburb});
		//ifObj.save({enableSourcing: true,ignoreMandatoryFields: false});
		
	}catch (e) {
		log.error({title: 'Error In _updateConsignmentToIF, IF Internal Id '+ifId+' : '+e.name, details: e.message});		
	}
}

function _getConnoteDetails(access_token, connoteNo, ifNO)
{
	var connoteObj = '';
	try {			
		var headerObj 		= {"Content-Type" : "application/json", 'Authorization': "bearer "+access_token};	
		var response 		= HTTPS.request({
									method: HTTPS.Method.GET,
									url: BORDEREXPRESS_API_URL+'/api/connotes/'+connoteNo,							
									headers: headerObj
								});		
		
		var responsObj 		= JSON.parse(response.body);
		//log.debug({title: "_getConnoteDetails response", details: response});
		
		if(response.code == 200){
			connoteObj 		= responsObj;
		}
		else{			
			errorArr.push(connoteNo+' ('+ifNO+') : Error for Consignment Detail API request : '+responsObj.title+'\n');
		}
		log.debug({title: "_getConnoteDetails connoteObj", details: responsObj});
		
	}catch (e) {
		log.error({title: 'Error In _getConnoteDetails: '+e.name, details: e.message});		
	}
	
	return connoteObj;
}

function _getConnotePODdetails(access_token, connoteNo, ifNO)
{
	var podDetailObj = '';
	try {			
		var headerObj 		= {"Content-Type" : "application/json", 'Authorization': "bearer "+access_token};	
		var response 		= HTTPS.request({
									method: HTTPS.Method.GET,
									url: BORDEREXPRESS_API_URL+'/api/connotes/'+connoteNo+'/pods/Metadata',
									headers: headerObj
								});		
		
		var responsObj 		= JSON.parse(response.body);
		log.debug({title: "_getConnotePODdetails response", details: response});
		
		if(response.code == 200){
			podDetailObj 		= responsObj;
		}
		else{			
			errorArr.push(connoteNo+' ('+ifNO+') : Error for Consignment Detail API request : '+responsObj.title+'\n');
		}
		log.debug({title: "_getConnotePODdetails podDetailObj", details: responsObj});
		
	}catch (e) {
		log.error({title: 'Error In _getConnotePODdetails: '+e.name, details: e.message});		
	}
	
	return podDetailObj;
}

function _getConnotePOD(access_token, connoteNo, folderId, ifNO)
{
	var fileId = '';
	try {
		var headerObj 		= {"Content-Type" : "application/json", 'Authorization': "bearer "+access_token};	
		var response 		= HTTPS.request({
									method: HTTPS.Method.GET,
									url: BORDEREXPRESS_API_URL+'/api/connotes/'+connoteNo+'/pods/jpg?base64=true',
									headers: headerObj
								});		
		
		var responsObj 		= JSON.parse(response.body);
		//log.debug({title: "_getConnotePOD response", details: response});
		
		if(response.code == 200){
			var dataBody  	= responsObj;
			var fileObj 	= FILE.create({
									name: connoteNo+'.jpg',
									fileType: FILE.Type.JPGIMAGE,
									contents: dataBody.Base64,									
									folder: folderId
								});
			fileId 		= fileObj.save();			
			log.debug({title: "_getConnotePOD fileId", details: fileId});
		}
		else{			
			errorArr.push(connoteNo+' ('+ifNO+') : Error for POD API request : '+responsObj.title+'\n');
		}		
	}catch (e) {
		log.error({title: 'Error In _getConnotePOD: '+e.name, details: e.message});		
	}
	
	return fileId;
}

function _getConnoteStatusHistory(access_token, connoteNo, ifNO)
{
	var statusObj = '';
	try {			
		var headerObj 		= {"Content-Type" : "application/json", 'Authorization': "bearer "+access_token};	
		var response 		= HTTPS.request({
									method: HTTPS.Method.GET,
									url: BORDEREXPRESS_API_URL+'/api/connotes/'+connoteNo+'/Statuses',							
									headers: headerObj
								});
		
		//log.debug({title: "_getConnoteStatusHistory response", details: response});
		var responsObj 		= JSON.parse(response.body);
		
		if(response.code == 200){			
			statusObj		= responsObj.Statuses;
			log.debug({title: "connotes statusObj", details: statusObj});
		}
		else{			
			errorArr.push(connoteNo+' ('+ifNO+') : Error for Consignment Status History API request : '+responsObj.title+'\n');
		}
	}catch (e) {
		log.error({title: 'Error In _getConnoteStatusHistory: '+e.name, details: e.message});
		
	}
	
	return statusObj;
}

// Function to Generate Access Token
function _generateAccessToken()
{
	var access_token	= '';
	var headerObj 		= {name: 'Content-Type', value: 'application/x-www-form-urlencoded'};
	try {
		var response 		= HTTPS.request({
									method: HTTPS.Method.POST,
									url: TOKEN_URL,
									body: {
											"grant_type": "client_credentials",
											"client_id": CLIENT_ID,
											"client_secret": CLIENT_SECRET
										  },
									headers: headerObj
								});	
		var response_code 	= response.code; 	// see HTTPS.ClientResponse.code
		var response_body 	= response.body; 	// see HTTPS.ClientResponse.body	
		var responsObj 		= JSON.parse(response_body);
		
		log.debug({title:'_generateAccessToken response_code', details:response_code});
		//log.debug({title: "response_body", details: responsObj});
		
		if(response_code == 200){			
			access_token		= responsObj.access_token;			
			//log.debug({title:'access_token', details:access_token});			
		}
		else {
			SUBJECTTEXT 	= 'Border Express : Access Token Error';
			BODYMESSAGE 	= 'Hi,<br/><br/>Below error encountered while generating Access Token for Border Express. Please do the needful.<br/>'+responsObj.error+'<br/><br/>Thanks, Simba Team';
			
			log.debug({title:'send Access Token Error email', details:BODYMESSAGE});
			_sendErrorEmail(AUTHORID, BEX_RECIPIENTSID, SUBJECTTEXT, BODYMESSAGE);
		}
		
	}catch (e) {
		log.error({title: 'Error In _generateAccessToken: '+e.name, details: e.message});
		
	}
	
	return access_token;
}