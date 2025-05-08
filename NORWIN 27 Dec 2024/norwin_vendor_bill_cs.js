/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/record','N/search'],
/**
 * @param{record} record
 */
function(record,search) {
    
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
        
        var currentRec = scriptContext.currentRecord;
        var sublistId = scriptContext.sublistId;
        var fieldId = scriptContext.fieldId;

        if (sublistId === 'expense') {
            if(fieldId =='custcol_norwin_vendorbill_productname'){
                var productName = currentRec.getCurrentproductName({
                    sublistId: 'expense',
                    fieldId: 'custcol_norwin_vendorbill_productname'
                });    

                if(productName) {
                    var fieldLookUp = search.lookupFields({
                        type: 'customrecord_norwin_empwise_bill_product', //The intended record type
                        id: productName, //Record ID
                        columns: ['custrecord_norwin_vendbill_prdct_account'] //Desired joined field referenced_record.desired_field
                    });
                    
                    if(fieldLookUp) {                    
                        var account = fieldLookUp['custrecord_norwin_vendbill_prdct_account']; 
                        log.debug('Value account: ' , account);

                        currentRec.setCurrentproductName({
                            sublistId: 'expense',
                            fieldId: 'account',
                            value: account[0].value,
                            ignoreFieldChange: true
                        });
                    }
                }   
            }          
            
        }

    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        
    };
    
});
