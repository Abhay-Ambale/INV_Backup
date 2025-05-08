/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/currentRecord', 'N/format', 'N/record', 'N/recordContext', 'N/redirect', 'N/runtime', 'N/ui/serverWidget'],
    /**
 * @param{currentRecord} currentRecord
 * @param{format} format
 * @param{record} record
 * @param{recordContext} recordContext
 * @param{redirect} redirect
 * @param{runtime} runtime
 * @param{serverWidget} serverWidget
 */
    (currentRecord, format, record, recordContext, redirect, runtime, serverWidget) => {
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
                    fieldId: 'custrecord_cntm_customerlist',
                    value: 2167                   
                })
                
                var date = new Date();
                var TOKYO = format.format({
                    value: date, 
                    type: format.Type.DATETIME, 
                    timezone: format.Timezone.ASIA_TOKYO 
                });             
            
                cust_form.addButton({
                    id:'custpage_popup',
                    label: 'Pop - up',
                    functionName: 'popup()'
                })
                var dateField=cust_form.addField({
                    id:'custpage_date',
                    type:serverWidget.FieldType.DATE,
                    label:'Date'
                })
            
                Objform.setValue({
                    fieldId: 'custpage_date',
                    value: TOKYO
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

        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
