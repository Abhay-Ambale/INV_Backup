 /* = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =\
 ||   This is Restlet script for Quality Wall UI    						||
 ||          																||
 ||                                                              			||
 ||                                                               			||
 ||                                                               			||
 ||  Version Date         	Author        		Remarks                   	||
 ||  1.0     24 May 2021  	Supriya Gunjal  	Initial commit            	|| 
 ||                                                               			||
 ||                                                               			||
  \= = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
/**
 *@NApiVersion 2.x
 *@NScriptType Restlet
 *@NModuleScope Public
 */

var RECORD;
var SEARCH;
var ERROR;

define(["N/record", "N/search", "N/error", './ca_common_library.js'], runRestlet);

//********************** MAIN FUNCTION **********************
function runRestlet(record, search, error) {
    RECORD = record;
	SEARCH = search;
    ERROR = error;

    var returnObj = {
		post: _post
    };
    return returnObj;
}

/*  {"data":[{"serial_number":"12345","test_result":"3"},{"serial_number":"23456","test_result":"2"},{"serial_number":"34567","test_result":"3"}]}
	{
	 "data":[
				{"serial_number":"12345","test_result":"3"},
				{"serial_number":"23456","test_result":"2"},
				{"serial_number":"34567","test_result":"3"}
			]
	}
*/
function _post( ) {	
	var restletData = context.data;	
	log.debug({title: 'In _post Stat', details: restletData});
	
	if(!_validateData(restletData)) {
		return JSON.stringify("Missing required data.");
	}
	
	try {
		for( var result in restletData) {
			var id = '';
			var objRecord = '';
			var rsData = '';
			
			rsData = restletData[result];
			if(!_validateData(rsData['serial_number']) || !_validateData(rsData['test_result'])) {
				return JSON.stringify("Missing required data.");
			}
			
			id = _checkSerialExist(rsData['serial_number']);
			
			if(_validateData(id)) {
				// Update
				objRecord = RECORD.load({
							   type : 'customrecord_ca_labview_serials_test_res',
							   id : id
							});
			}
			else {
				// Create
				objRecord = RECORD.create({
								   type : 'customrecord_ca_labview_serials_test_res',
								   isDynamic : true
								});
			}
				
			objRecord.setValue({
				 fieldId : 'custrecord_ca_labview_serial_number',
				 value : rsData['serial_number']
			});
				
			objRecord.setValue({
				 fieldId : 'custrecord_ca_labview_serials_test_res',
				 value : rsData['test_result']
			});			  
			
			var recordId = objRecord.save({
							   enableSourcing : false,
							   ignoreMandatoryFields : false
							});							
			log.debug({title: "record id "+recordId, details: "for Serial "+rsData['serial_number']});			
		}
		
		return JSON.stringify("success");
	}
	catch (e) {		
		log.debug('ERROR _post', e);
		return JSON.stringify("error");
	} 
	
	
}

function _checkSerialExist(serial) {
	var id = '';
	var searchObj = '';
	
	searchObj = SEARCH.create({
				   type: "customrecord_ca_labview_serials_test_res",
				   filters:
				   [
					  ["custrecord_ca_labview_serial_number","is", serial], 
					  "AND", 
					  ["isinactive","is","F"]
				   ],
				   columns:
				   [
					  SEARCH.createColumn({name: "internalid", label: "Internal ID"})
				   ]
				});
	searchObj.run().each(function(result){
		id = result.getValue({name: "internalid"});
		return false;
	});
	
	return id;
}