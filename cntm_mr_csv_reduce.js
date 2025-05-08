/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 * @filename     cntm_mr_csv_reduce.js    
 * @scriptname   cntm_mr_csv_reduce.js
 * @ScriptId     customscript_cntm_mr_csv_reduce
 * @author       Abhay Ambale
 * @email        abhay.ambale@centium.net
 * @date         04 Janaury 2023  
 * @description  Read data from CSV and Create Custom Record using below Criteria 
                CSV format  -> PO Doc No | Internal ID | Location | Memo
                Update Location ,Memo field with CSV data
                Create the Custom Record that has Similar combination of PO and Location
 
 * 
 * Sr. No   	 Date           	  Author                  	Remarks
 *   1		  05/01/2023	        Abhay Ambale    	        
 *
 */
define(['N/file', 'N/record', 'N/runtime', 'N/search', 'N/ui/serverWidget'],
    /**
 * @param{file} file
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 * @param{serverWidget} serverWidget
 */
    (file, record, runtime, search, serverWidget) => {
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

            try {            
                var File = file.load({
                    id: 17355
                });
                var fileData = File.getContents();
                var rows = fileData.split('\r');    
                var rowData =[];             
                var iterator = File.lines.iterator();           
               
                iterator.each(function () {return false;});       
                iterator.each(function (line) {
                    var lineValues = line.value.split(',');
                    rowData.push({InternalId: lineValues[0], DocumentNumber: lineValues[1], Memo:lineValues[2]})
            
                    //creating custom recod for each line of csv data
                    var recSub = record.create({
                        type: 'customrecord_cntm_csvdatastore',
                        
                    })
                    recSub.setValue({
                        fieldId: 'custrecord204', 
                        value: lineValues[0]
                    })
                    recSub.setValue({
                        fieldId: 'custrecord_cntm_institution_list', 
                        value: lineValues[1]
                    })
                    recSub.setValue({
                        fieldId: 'custrecord_cntm_memocust', 
                        value: lineValues[2]
                    })
                    var a = recSub.save();
                    log.debug('Initial Record', 'Initial Record craeted');
                        return true;                
                    
                });
                log.debug('RowData', rowData);           
            
                //Finding Duplicate Id's and merging the memo
                var l = rowData.length -1;
                for(var i=0; i<l;i++){
                    for(var j=i+1; j<l;j++){
                        if(rowData[i]['InternalId']==rowData[j]['InternalId']){
                            rowData[i]['Memo'] = rowData[i]['Memo']+" ,"+rowData[j]['Memo'] ;
                            log.debug('Concatinate', rowData[i])
                        }
                    }
                }
                return rowData;              
            } catch (error) {
                log.error('get input data error',error);               
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
            try {
                var file = JSON.parse(mapContext.value);
                var ID = file.InternalId;
                var docNo= file.DocumentNumber;
                var _memo = file.Memo;               
                //Creating single record for duplicates
                var rec = record.create({
                    type: 'customrecord1393',
                })
                rec.setValue({
                    fieldId: 'custrecord205',
                    value: ID
                })
                rec.setValue({
                    fieldId: 'custrecord206',
                    value: docNo
                })
                rec.setValue({
                    fieldId: 'custrecord207',
                    value: _memo
                })
                rec.save();
                log.debug('Final Record', 'Final Record craeted');          
            } catch (error) {
                log.debug('Error in map',error);     
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

        }

        return {getInputData, map, reduce, summarize}

    });
