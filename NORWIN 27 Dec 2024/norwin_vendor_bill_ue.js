/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/currentRecord', 'N/record', 'N/runtime'],
    /**
 * @param{currentRecord} currentRecord
 */
    (currentRecord, record, runtime) => {       

        const beforeSubmit = (scriptContext) => {
            try{
                var recObj = scriptContext.newRecord;
                //customform= 206
                var currScript = runtime.getCurrentScript();
                var formParam = currScript.getParameter({ name: 'custscript_norwin_vendor_bill_form' });
                log.debug('formParam', formParam);
                var form = recObj.getValue({fieldId:'customform'});
                if (form == formParam){
                    log.debug('formParam matched');
                    var jdBillableOtHrs = recObj.getValue({fieldId:'custbody_jd_billable_ot_hours'});
                    var jdOtRate = recObj.getValue({fieldId:'custbody_jd_pay_rate_ot'});
                    //custbody_jd_project_id
                    var projectID = recObj.getValue({fieldId:'custbody_jd_project_id'});
                    log.debug('jdBillableOtHrs',jdBillableOtHrs);
                    log.debug('jdOtRate',jdOtRate);
                    // recObj.setSublistValue({ sublistId: 'item', fieldId: 'rate', line: 1, value: timeRate });
                    if(jdBillableOtHrs && jdOtRate && jdBillableOtHrs !=0 &&  jdOtRate !=0){
                        log.debug('If condition satisfied');
                        var customer = recObj.getSublistValue({ sublistId: 'item', fieldId: "customer", line: 0 });
                        var item = recObj.getSublistValue({ sublistId: 'item', fieldId: "item", line: 0 });
                        var description = recObj.getSublistValue({ sublistId: 'item', fieldId: "description", line: 0 });//custcol_ava_expenseaccount
                        description = 'Over time '+description
                        var expenseAcc = recObj.getSublistValue({ sublistId: 'item', fieldId: "custcol_ava_expenseaccount", line: 0 });//custcol_ava_expenseaccount
                        var cust = recObj.getSublistValue({ sublistId: 'item', fieldId: "custcol_customer", line: 0 });//custcol_ava_expenseaccount
                        var itemLineCount = recObj.getLineCount({ sublistId: 'item' });
                        
                        if(itemLineCount>1){
                            log.debug('Removing 2nd Line');
                            recObj.removeLine({
                                sublistId: 'item',
                                line: 1,
                            });
                        }    

                        recObj.setSublistValue({ sublistId: 'item', fieldId: 'customer', line: 1, value: customer });
                        recObj.setSublistValue({ sublistId: 'item', fieldId: 'item', line: 1, value: item });
                        recObj.setSublistValue({ sublistId: 'item', fieldId: 'quantity', line: 1, value: jdBillableOtHrs });
                        recObj.setSublistValue({ sublistId: 'item', fieldId: 'rate', line: 1, value: jdOtRate });
                        recObj.setSublistValue({ sublistId: 'item', fieldId: 'description', line: 1, value: description });
                        recObj.setSublistValue({ sublistId: 'item', fieldId: 'custcol_ava_expenseaccount', line: 1, value: expenseAcc });
                        recObj.setSublistValue({ sublistId: 'item', fieldId: 'custcol_customer', line: 1, value: cust });
    
                    }
                    recObj.setValue({ fieldId: 'custbody_jd_billable_ot_hours', value:''});
                    recObj.setValue({ fieldId: 'custbody_jd_pay_rate_ot', value:''});
                    var projectRecObj = record.load({
                                            type: record.Type.JOB,
                                            id: projectID
                                        })
                    var jdState = projectRecObj.getValue({fieldId:'custentity_jd_work_state'});
                    var jdCity =  projectRecObj.getValue({fieldId:'custentity_jd_work_city'}); 
                    log.debug('jdState',jdState);
                    log.debug('jdCity',jdCity);
                    recObj.setValue({ fieldId: 'custbody_jd_work_city', value: jdCity});
                    recObj.setValue({ fieldId: 'custbody_jd_work_state', value: jdState});

                }                       
    
            }
            catch(e){
                log.error('ERROR in overtime item UE', e);
            }
        }     

        return {beforeSubmit}

    });
