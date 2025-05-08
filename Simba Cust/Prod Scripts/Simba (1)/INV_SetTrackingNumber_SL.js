/**
 * Company - Invitra Technologies Pvt.Ltd
 * Author - Bhushan khadke
 * Script - 
 * 
 * 
 * 
 * This script includes below functionality
 * 1) First load the CSV file  
 * 2) Get the transaction internal IDs and load the Item fulfillment 
 * 3) Set the tracking number to item fulfillment  
 * 
 * 
 * Version    Date            Author           	  Remarks
 * 2.00      28 july 2022    Bhushan Khadke	  
 * 
 *
 * @NApiVersion 2.0
 * @NModuleScope SameAccount
 * @NScriptType Suitelet
 */

define(["N/file", "N/record"], function (file, record) {
    function onRequest(context) {
		var counter = 0 ;
        var csvfile = file.load({
            id: 4296999
        });
        log.debug(" CSV file Load : ", csvfile);        
		
        csvfile.lines.iterator().each(function (line) {
            var result = line.value.split(",");
            log.debug(" records : ", result);
            if(counter>0){
                var id = result[0];                
                var trackingNum = result[1];
                
                var objRecord = record.load({
                    type: record.Type.ITEM_FULFILLMENT,
                    id: id
                });
                
                var lineCount = objRecord.getLineCount({ sublistId: 'package' });
                if (lineCount > 0) {
                    objRecord.setSublistValue({ sublistId: 'package', fieldId: 'packagetrackingnumber', line: 0, value: trackingNum });
                }
                var itemfulrecord = objRecord.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
                log.debug(" tracking number set to Item fulfillment  :"+counter, itemfulrecord);
            }
            counter++;
            return true;
        });
    }
    return {
        onRequest: onRequest
    };

});
