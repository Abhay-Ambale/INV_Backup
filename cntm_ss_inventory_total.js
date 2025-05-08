/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 * @filename     cntm_mr_inventory_total.js    
 * @scriptname   cntm_mr_inventory_total
 * @ScriptId     cntm_mr_inventory_total
 * @author       Abhay Ambale
 * @email        abhay.ambale@centium.net
 * @date         04 Janaury 2023  
 * @description  Update all open Invoices with  total inventory item Amount in a custom field. 
 * 
 * Sr. No   	 Date           	  Author                  	Remarks
 *   1		  04/01/2023	        Abhay Ambale    	      
 *
 */
define(['N/currentRecord', 'N/record', 'N/search', 'N/ui/serverWidget'],
    
    (currentRecord, record, search, serverWidget) => {

        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */
        const execute = (scriptContext) => {
            var openInvoiceSearch = search.create({
                type: "transaction",
                filters:
                [
                    ["mainline","is","F"], 
                    "AND", 
                    ["status","anyof","CustInvc:A"], 
                    "AND", 
                    ["itemtype","startswith","i"]
                 ],
                columns:
                [
                   search.createColumn({name: "entity", label: "Name"}),
                   search.createColumn({name: "internalid", label: "Internal ID"}),
                   search.createColumn({name: "custbody_stc_total_after_discount", label: "Total after discount"}),
                ]
             });
             var searchResultCount2 = openInvoiceSearch.runPaged().count;
             log.debug("Open Invoive result count",searchResultCount2);
             openInvoiceSearch.run().each(function(result){
                var recObj = record.load({
                    type: record.Type.INVOICE,
                    id: result.id,
                    isDynamic: false
             });
                var subcount = recObj.getLineCount({ sublistId: "item" });
               
                var sum=0;

                var i=0;
                while(i<subcount){

                    var itemId = recObj.getSublistValue({
                        sublistId:'item',
                        fieldId:'itemtype',
                        line:i
                    })
                    
                if (itemId === 'InvtPart') {
                    
                    var price = recObj.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'amount',
                        line: i
                    });
                    sum = sum + price;
                   
                    var otherId = record.submitFields({
                        type: record.Type.INVOICE,
                        id: result.id,
                        values: {
                        'custbody_cntm_totalofinventory': sum
                        }
                        })
                       
                    log.debug('sum:',sum)                   
                }
                    i++;					
				}                
                return true;
            });
        }

        return {execute}

    });
