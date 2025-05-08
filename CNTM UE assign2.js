/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/ui/serverWidget', 'N/currentRecord'],
    /**
 * @param{record} record
 * @param{serverWidget} serverWidget
 */
    (record, serverWidget,currentRecord) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {

            try{
                var Objform = scriptContext.newRecord;
                var cust_form = scriptContext.form;
                cust_form.clientScriptModulePath = './AssignmentAbhayClientScript.js';
                //Objform.clientScriptFileId= 16948;
                Objform.setValue({
                    fieldId: 'entity',
                    value: 1202                   
                })
                
                
                cust_form.addButton
                ({
                id:'custpage_popup',
                label: 'Change Vendor',
                functionName: 'popup()'
            })
                
            var dateField = cust_form.getField({
                id: 'trandate'
            })
    
                dateField.updateDisplayType({
                    displayType : serverWidget.FieldDisplayType.INLINE
                   }); 
                   
                   
                }
                catch(error){
                    log.error("Error: ", error);
                }
    
            }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {

            var rec = scriptContext.newRecord;
            var location= rec.getValue({
                fieldId: 'location'
            })
           log.error('Location: ', location)
            rec.setSublistValue({
                sublistId:'item',
                fieldId:'location',
                Value :location,
                line: 0,                
                
            })
            
        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {

            var recr = scriptContext.newRecord;
            
            var val = recr.getValue({
                fieldId: 'memo',
            })
           
            record.submitFields({
                type: record.Type.PURCHASE_ORDER,
                id: recr.id,
                values: {
                custbody_cntm_vendornotes: val
                },
                
               });


        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
