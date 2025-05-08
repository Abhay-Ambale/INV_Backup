/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 * @filename     cntm_ss_assignment.js    
 * @scriptname   cntm_ss_assignment.js
 * @ScriptId     customscript_cntm_ss_assignment
 * @author       Abhay Ambale
 * @email        abhay.ambale@centium.net
 * @date         04 Janaury 2023  
 * @description  create monthly and on demand basis custom record for details of Customer -Customer Name, Total number of sales order and Total invoices.
 
 * 
 * Sr. No   	 Date           	  Author                  	Remarks
 *   1		  03/01/2023	        Abhay Ambale    	     Record created with name of customer, total no. of sales orders and invoices 
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

            var transactionSearchObj = search.create({
                type: "transaction",
                filters:
                [
                    ["mainline","is","T"], 
                    
                ],
                columns:
                [
                    search.createColumn({
                        name: "entity",
                        summary: "GROUP",
                        sort: search.Sort.ASC,
                        label: "Name"
                    }),
                    search.createColumn({
                        name: "salesorder",
                        summary: "COUNT",
                        label: "Sales Order"
                    }),
                    search.createColumn({
                        name: "invoicenum",
                        summary: "COUNT",
                        label: "Invoice Number"
                    })
                ]
             });
             
             var searchResultCount = transactionSearchObj.runPaged().count;
             log.debug("transactionSearchObj result count",searchResultCount);
             transactionSearchObj.run().each(function(result){
                // .run().each has a limit of 4,000 results
                var name = result.getText({
                    name: "entity",
                    summary: "GROUP",
                    sort: search.Sort.ASC,
                    label: "Name"
                });
                var salnum = result.getText({
                    name: "salesorder",
                    summary: "COUNT",
                    label: "Sales Order"
                });
                var invnum = result.getText({
                    name: "invoicenum",
                    summary: "COUNT",
                    label: "Invoice Number"
                })
                var rec = record.create({
                    type: 'customrecord_cntm_schedulescriptabhay',
                })
               
                rec.setValue({
                    fieldId: 'custrecord_cntm_custentity',
                    value: name                
                })
                rec.setValue({
                    fieldId: 'custrecord_cntm_totalso',
                    value: salnum                
                })
                rec.setValue({
                    fieldId: 'custrecord_cntm_totalinvoice',
                    value: invnum                
                })
                rec.save();

                return true;
             });

             
             
             
             
             

        }

        return {execute}

    });
