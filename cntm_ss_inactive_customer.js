/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 * @filename     cntm_mr_inventory_total.js    
 * @scriptname   cntm_mr_inventory_total
 * @ScriptId     cntm_mr_inventory_total
 * @author       Abhay Ambale
 * @email        
 * @date         04 Janaury 2023  
 * @description  Delete the related records of inactive customer.
 * 
 * Sr. No   	 Date           	  Author                  	Remarks
 *   1		  04/01/2023	        Abhay Ambale    	      Created multiple saved search of records related to inactive customer.
 *
 */
define(['N/currentRecord', 'N/record', 'N/search', 'N/ui/serverWidget'],
    /**
 * @param{currentRecord} currentRecord
 * @param{record} record
 * @param{search} search
 * @param{serverWidget} serverWidget
 */
    (currentRecord, record, search, serverWidget) => {

        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */
        const execute = (scriptContext) => {
            try {
                var customerpaymentSearchObj = search.create({
                    type: "customerpayment",
                    filters:
                    [   ["mainline","is","T"],
                        "AND",
                       ["customer.isinactive","is","T"], 
                       "AND", 
                       ["type","anyof","CustPymt"]
                    ],
                    columns:
                    [
                       search.createColumn({name: "type", label: "Type"})
                    ]
                 });
                 var searchResultCount = customerpaymentSearchObj.runPaged().count;
                 log.debug("Payment count",searchResultCount);
                 customerpaymentSearchObj.run().each(function(result){
                    record.delete({
                        type: result.recordType,
                        id: result.id,
                    });
                    // .run().each has a limit of 4,000 results
                    return true;
                 });
            } catch (error) {
                log.debug('Error in Payment Search', error)                
            }
            
            try {
                var invoiceSearchObj = search.create({
                    type: "invoice",
                    filters:
                    [
                        ["customer.isinactive","is","T"], 
                        "AND", 
                        ["type","anyof","CustInvc"],
                        "AND", 
                        ["mainline","is","T"]
                    ],
                    columns:
                    [
                        search.createColumn({name: "type", label: "Type"})
                    ]
                    });
                    var searchResultCount = invoiceSearchObj.runPaged().count;
                    log.debug("INVOICE result count",searchResultCount);
                    invoiceSearchObj.run().each(function(result){
                        record.delete({
                            type: record.Type.INVOICE,
                            id: result.id,
                        });
                    // .run().each has a limit of 4,000 results
                    return true;
                 });
                
            } catch (error) {
                log.debug('Error in 1:', error)                
            }  
            
            try {
                var itemfulfillmentSearchObj3 = search.create({
                    type: "transaction",
                    filters:
                    [
                       ["customer.isinactive","is","T"], 
                       "AND", 
                       ["type","anyof","SalesOrd"], 
                        "AND", 
                        ["mainline","is","T"]
                    ],
                    columns:
                    [
                       search.createColumn({name: "type", label: "Type"})
                    ]
                });
                 var searchResultCount3 = itemfulfillmentSearchObj3.runPaged().count;
                 log.debug("Sales Order count",searchResultCount3);
                 itemfulfillmentSearchObj3.run().each(function(result){
                    // .run().each has a limit of 4,000 results
                    record.delete({
                        type: record.Type.SALES_ORDER,
                        id: result.id,
                    });
                    return true;
                });
    
            } catch (error) {
                log.debug('Error in 4:', error)
            }    
        }            
        return {execute}
    });
