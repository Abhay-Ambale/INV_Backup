/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/ui/dialog'],
    /**
     * @param{record} record
     */
    function(record, dialog) {
        var initialTotal = 0;
        
        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        function pageInit(scriptContext) {
            var recObj = scriptContext.currentRecord;
            initialTotal =  recObj.getValue({
                            fieldId : 'total'
                            });
            log.debug("Initial Total",initialTotal);
        }
    
        /**
         * Function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @since 2015.2
         */
        function fieldChanged(scriptContext) {
            
        }
    
        /**
         * Function to be executed when field is slaved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         *
         * @since 2015.2
         */
        function postSourcing(scriptContext) {
    
        }
    
        /**
         * Function to be executed after sublist is inserted, removed, or edited.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @since 2015.2
         */
        function sublistChanged(scriptContext) {
    
        }
    
        /**
         * Function to be executed after line is selected.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @since 2015.2
         */
        function lineInit(scriptContext) {
    
        }
    
        /**
         * Validation function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @returns {boolean} Return true if field is valid
         *
         * @since 2015.2
         */
        function validateField(scriptContext) {
    
        }
    
        /**
         * Validation function to be executed when sublist line is committed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateLine(scriptContext) {
            try{
                var currRec = scriptContext.currentRecord;
                if(scriptContext.sublistId=='item'){
                    var amountValue = currRec.getCurrentSublistValue({
                        sublistId:'item',
                        fieldId:'amount'
                    });
                    var rateValue = currRec.getCurrentSublistValue({
                        sublistId:'item',
                        fieldId:'rate'
                    });
                    var qtyValue = currRec.getCurrentSublistValue({
                        sublistId:'item',
                        fieldId:'quantity'
                    });
    
                    var requiredAmt = rateValue * qtyValue;
    
                    log.debug('amountValue',amountValue);
                    log.debug('requiredAmt',requiredAmt)
                    // if(amountValue && amountValue>0){
                    //     return true;
                    // }
                    if (requiredAmt == amountValue){
                        return true;
                    }
                    else{
                        alert('Amount can not be change.');
                        return false;
                    }
                }
            }
            catch(error){
                log.error('error',error)
            }
        }
    
        
    
        /**
         * Validation function to be executed when sublist line is inserted.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateInsert(scriptContext) {
    
        }
    
        /**
         * Validation function to be executed when record is deleted.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         *
         * @returns {boolean} Return true if sublist line is valid
         *
         * @since 2015.2
         */
        function validateDelete(scriptContext) {
    
        }
    
        /**
         * Validation function to be executed when record is saved.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @returns {boolean} Return true if record is valid
         *
         * @since 2015.2
         */        

        function saveRecord(scriptContext) {
            debugger
            if (!scriptContext.currentRecord.isNew) {
                var recObj = scriptContext.currentRecord;
                var finalTotal =  recObj.getValue({
                                fieldId : 'total'
                                });
                log.debug("saveRecord Initial Total",initialTotal);
                log.debug("saveRecord final Total",finalTotal);
                if(initialTotal != finalTotal){
                        
                    return window.confirm("You are changing the total amount of this PO. Please Confirm !");
                    // alert("You can't change the total amount of this PO.") 
                    // return false;               
                }
                else {
                    return true;
                }
            }
            else{
                return true;
            }
        }
    
        return {
            pageInit: pageInit,
            // fieldChanged: fieldChanged,
            // postSourcing: postSourcing,
            // sublistChanged: sublistChanged,
            // lineInit: lineInit,
            // validateField: validateField,
            validateLine: validateLine,
            // validateInsert: validateInsert,
            // validateDelete: validateDelete,
             saveRecord: saveRecord
        };
        
    });