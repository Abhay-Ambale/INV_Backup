/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 * @filename     cntm_MR_assignment_abhay.js    
 * @scriptname   cntm_MR_assignment_abhay
 * @ScriptId     customscript_cntm_MR_assignment_abhay
 * @author       Abhay Ambale
 * @email        abhay.ambale@centium.net
 * @date         04 Janaury 2023  
 * @description  Create a custom field(line-level) on SO which store the Item Amount with a 2% discount.
 
 * 
 * Sr. No   	 Date           	  Author                  	Remarks
 *   1		  04/01/2023	        Abhay Ambale    	      
 *
 */
define(['N/record', 'N/search', 'N/ui/serverWidget','N/runtime'],
    /**
 * @param{record} record
 * @param{search} search
 * @param{serverWidget} serverWidget
 */
    (record, search, serverWidget,runtime) => {
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

        const getInputData = (inputContext) => {

            try{                
                //  Creating Saved Search 
                return search.create({
                    type: "salesorder",
                    filters:
                    [
                       ["mainline","is","F"], 
                       "AND", 
                       ["type","anyof","SalesOrd"],
                       "AND", 
                       ["amount","notequalto","0.00"]
                    ],
                    columns:
                    [
                       search.createColumn({name: "entity", label: "Name"}),
                       search.createColumn({name: "amount", label: "Amount"}),
                       search.createColumn({name: "line", label: "Line ID"})
                    ]
                });
            
            } catch(error){
                log.error('Error in GetInputData', error)
            }
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

            try{                
                var param = runtime.getCurrentScript().getParameter({name: 'custscript_cntm_discountvalue'}) 
                var Result = JSON.parse(mapContext.value);
                var searchResult = mapContext.key;
                var value = Result.values.amount;
                var line = Result.values.line;               
                var rec = record.load({
                    type: record.Type.SALES_ORDER,
                    id:searchResult
                })
                //Creating a variable with discounted value
                var dis = value - (value* (param/100));                    
                var num= rec.findSublistLineWithValue({
                    sublistId: 'item',
                    fieldId: 'line',
                    value: line
                });

                rec.setSublistValue({
                    sublistId:'item',
                    fieldId: 'custcol_cntm_discountamount',
                    value: dis,
                    line: num
                })
                log.debug('Line no.:',num)

                rec.save({
                    ignoreMandatoryFields: true,
                    enableSourcing: true
                });                    
            }
            catch(error){
                log.error('Error in Map', error)
            }
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
            log.debug('summarise');
        }

        return {
            getInputData, 
            map, 
            //reduce, 
            summarize}

    });
