/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/file', 'N/record','N/format','N/runtime'],
    /**
 * @param{file} file
 * @param{record} record
 */
    (file, record, format, runtime) => {
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
            //Get the CSV file ID containing the data through script parameters
            var param = runtime.getCurrentScript().getParameter({name: 'custscript_mfg_date_update_csv_file'}) 
            log.debug('Internal ID of CSV file: ',param);
            try{ 
                var fileObj = file.load({
                    id: param
                });
                var fileData = fileObj.getContents();
                var rows = fileData.split('\r');    
                var rowData =[];             
                var iterator = fileObj.lines.iterator();           
                var isRowTrue =false;
                var colLineValues = rows[0].split(',');
                var col1= colLineValues[0];                   
                var col7= colLineValues[6];
                var col8= colLineValues[7];
                
                log.debug('Columns found: ',col1 +' '+col7+' '+col8);
                if(col1=='Internal ID'&& col7=='Manufacturing Date' && col8=='Expiration Date'){
                    isRowTrue = true;
                }

                iterator.each(function () {                    
                    return false;
                });

                if(isRowTrue){       
                    iterator.each(function (line) {
                        var lineValues = line.value.split(',');
                        rowData.push({InternalId: lineValues[0], ManufacturingDate: lineValues[6], ExpirationDate: lineValues[7]})
                        return true;    
                    })
                    log.debug('File Data: ', fileData);
                    return rowData;
                }else{
                    log.error('Invalid CSV File Columns: ', 'Please Arrange the columns : Column 1-Internal ID, Column 7-Manufacturing Date, Column 8- Expiration Date');
                    return false;
                }
            } catch(e){
                log.error('Error in Get ', e);
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
            var file = JSON.parse(mapContext.value);
            var ID = file.InternalId;
            var ManufacturingDate= file.ManufacturingDate;
            var ExpirationDate= file.ExpirationDate;

            ManufacturingDate = new Date(ManufacturingDate);
            ExpirationDate = new Date(ExpirationDate);
            ManufacturingDate= format.format({value:ManufacturingDate, type: format.Type.DATE})
            ExpirationDate= format.format({value:ExpirationDate, type: format.Type.DATE})
            log.debug('Date Submitting: ', ID +' '+ManufacturingDate+' '+ ExpirationDate);
            
            record.submitFields({ 
                type: record.Type.INVENTORY_NUMBER, 
                id: ID, 
                values: {'custitemnumber_ca_manufacturingdate': ManufacturingDate,'expirationdate':ExpirationDate } 
            });                
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
