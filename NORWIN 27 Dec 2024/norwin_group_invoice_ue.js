/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record','N/format', 'N/ui/serverWidget'],
    /**
 * @param{record} record
 */
    (record, format, serverWidget) => {
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

            log.debug('Before Load');
            log.debug('scriptContext.type: ',scriptContext.type);
            if(scriptContext.type=='create'){
                var form = scriptContext.form;
                form.clientScriptModulePath = './norwin_group_invoice_cs.js';
                form.addButton({
                    id: 'custpage_mark_all',
                    label: 'Mark All',
                    functionName: "markAll('"+true+"')"
                })

                form.addButton({
                    id: 'custpage_unmark_all',
                    label: 'Unmark All',
                    functionName: "markAll('"+false+"')"
                })      
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
            var result = [];
            var totalAmount = 0;
            var savedRec = scriptContext.newRecord;
            // if(scriptContext.type=='create'){
            if(scriptContext.type=='create' || scriptContext.type=='edit'){
                var invoiceLines = savedRec.getLineCount({ sublistId: 'recmachcustrecord_norwin_group_invoice_id' });
                var headPoNum= savedRec.getValue({
                                    fieldId: 'custrecord_norwin_grp_invoice_po_num'
                                })
                var linePoNum;

                for(var i = 0; i < invoiceLines; i++){
                    var isGrpInvoice = savedRec.getSublistValue({ sublistId: 'recmachcustrecord_norwin_group_invoice_id', fieldId: 'custrecord_norwin_grp_invoice_checkbox', line: i});

                    if(isGrpInvoice){
                        var invoiceId = savedRec.getSublistValue({ sublistId: 'recmachcustrecord_norwin_group_invoice_id', fieldId: 'custrecord_norwin_grp_invoice_child_id', line: i});
                        var projectTitle = savedRec.getSublistValue({ sublistId: 'recmachcustrecord_norwin_group_invoice_id', fieldId: 'custrecord_norwin_grp_invoice_prjtitle', line: i});
                        log.debug('projectTitle', projectTitle);

                        var projectName = savedRec.getSublistValue({ sublistId: 'recmachcustrecord_norwin_group_invoice_id', fieldId: 'custrecord_norwin_grp_invoice_ch_prjname', line: i});
                        var item = savedRec.getSublistValue({ sublistId: 'recmachcustrecord_norwin_group_invoice_id', fieldId: 'custrecord_norwin_grp_invoice_item', line: i});
                        var qty = savedRec.getSublistValue({ sublistId: 'recmachcustrecord_norwin_group_invoice_id', fieldId: 'custrecord_norwin_grp_invoice_ch_qty', line: i});
                        var rate = savedRec.getSublistValue({ sublistId: 'recmachcustrecord_norwin_group_invoice_id', fieldId: 'custrecord_norwin_grp_invoice_ch_rate', line: i});
                        var amount = savedRec.getSublistValue({ sublistId: 'recmachcustrecord_norwin_group_invoice_id', fieldId: 'custrecord_norwin_grp_invoice_ch_amount', line: i});
                        var sdate = savedRec.getSublistValue({ sublistId: 'recmachcustrecord_norwin_group_invoice_id', fieldId: 'custrecord_norwin_grp_invoice_ch_sdate', line: i});
                        var edate = savedRec.getSublistValue({ sublistId: 'recmachcustrecord_norwin_group_invoice_id', fieldId: 'custrecord_norwin_grp_invoice_ch_edate', line: i});
                        var description = savedRec.getSublistValue({ sublistId: 'recmachcustrecord_norwin_group_invoice_id', fieldId: 'custrecord_norwin_grp_invoice_ch_descrip', line: i});
                        if(i==0){
                            linePoNum = savedRec.getSublistValue({ sublistId: 'recmachcustrecord_norwin_group_invoice_id', fieldId: 'custrecord_norwin_grp_invoice_ch_po_num', line: i});
                        }
                        rate = parseFloat(rate).toFixed(2);
                        amount = parseFloat(amount).toFixed(2);
                        result.push({invoiceId:invoiceId, projectName:projectName, projectTitle:projectTitle, item:item, qty:qty, rate:rate, amount:amount, sdate:sdate, edate:edate, description:description })
                       log.debug('totalAmount calculation', amount);
                       totalAmount += Number(amount);
                    }
                } 
                if(!headPoNum){
                    savedRec.setValue({
                        fieldId: 'custrecord_norwin_grp_invoice_po_num',
                        value: linePoNum
                    })
                }
                var table = createGrpInvoiceTable(result);
                savedRec.setValue({
                    fieldId: 'custrecord_norwin_grp_invoice_prnt_table',
                    value: table
                })
                savedRec.setValue({
                    fieldId: 'custrecord_norwin_cust_grp_invoice_total',
                    value: totalAmount
                })
            }

        }

        function createGrpInvoiceTable(result){          
            if(result.length) {
                var htmlTable = '<table style="width:100%; border-collapse:collapse; border: 1px solid black;">' +
                                '<tr>' +
                                '<th style="width:60%; border:0.5px solid black; align: center; padding: 5px;">Description</th>' +
                                '<th style="width:10%; border:0.5px solid black; align: center; padding: 5px;">Quantity</th>' +
                                '<th style="width:10%; border:0.5px solid black; align: center; padding: 5px;">Rate</th>' +
                                '<th style="width:20%; border:0.5px solid black; align: center; padding: 5px;">Amount</th>' +                                                              
                                '</tr>';
            
                result.forEach(function(line) {
                    var sdate = new Date(line.sdate);
                    var edate = new Date(line.edate);  
                    var formattedsdate = formatDate(sdate);
                    var formattedsdateedate = formatDate(edate);                                
                    var description = line.projectTitle + " -- " + formattedsdate + " To " + formattedsdateedate;

                    if(line.description) {
                        description += " -- " + line.description;                    }
            
                    htmlTable += '<tr>' +
                                '<td style="width:60%; border:0.5px solid black; align: left; padding: 5px;">' + description + '</td>' +
                                '<td style="width:10%; border:0.5px solid black; align: right; padding: 5px;">' + line.qty + '</td>' +
                                '<td style="width:10%; border:0.5px solid black; align: right; padding: 5px;">' +'$'+ line.rate + '</td>' +
                                '<td style="width:20%; border:0.5px solid black; align: right; padding: 5px;">' +'$'+ line.amount + '</td>' +                           
                                '</tr>';
                });
            
                htmlTable += '</table>';
                return htmlTable;
            }   
        
        }

        function formatDate(dateValue) {
            var date = new Date(dateValue);        
            var month = date.toLocaleString('default', { month: 'short' });
            var day = date.getDate();
            var year = date.getFullYear();
            day = day < 10 ? '0' + day : day;

            return month + '-' + day + '-' + year;
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
            try {
                var savedRec = scriptContext.newRecord;
                if(scriptContext.type=='create'){
                    var invoiceLines = savedRec.getLineCount({ sublistId: 'recmachcustrecord_norwin_group_invoice_id' });
    
                    for(var i = 0; i < invoiceLines; i++){
                        var isGrpInvoice = savedRec.getSublistValue({ sublistId: 'recmachcustrecord_norwin_group_invoice_id', fieldId: 'custrecord_norwin_grp_invoice_checkbox', line: i});
  
                        if(isGrpInvoice){
                            var invoiceref = savedRec.getSublistValue({ sublistId: 'recmachcustrecord_norwin_group_invoice_id', fieldId: 'custrecord_norwin_grp_invoice_child_id', line: i});
                            record.submitFields({
                                type: record.Type.INVOICE,
                                id: invoiceref,
                                values: {
                                    'custbody_norwin_grp_invoice_ref': savedRec.id
                                }
                            });
                        }
                    } 
                }

            } catch (error) {
                log.error('error: ',error);
                
            }
        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
