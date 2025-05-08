/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 *  
 *******************************************************************************************
 * Company:		Invitra Technologies Pvt.Ltd
 * Author:	    Prathmesh Bonte
 * FileName:    norwin_contractor_bill_ue.js
 * Deployed:    Norwin Contractor Bill
 * 
 * Module Description :
 * 1. beforeLoad : In VIEW mode show Make payment button if there is any amount due on contractor bill record
 * 2. afterSubmit : If the amount due for contractor bill is zero then change the bill status to Paid In Full & vice versa
 *
 * Version    Date            Author           	  Remarks
 * 1.00     12-07-2024    Prathmesh Bonte	   Initial Version
 *
 ********************************************************************************************/
define(['N/url','N/record','./norwin_common_library.js'], (url, record,) => {
    const beforeLoad = (scriptContext) => {
        try {
            var eventType = scriptContext.type.toUpperCase();
            var billForm = scriptContext.form;
            var currentRecord = scriptContext.newRecord;
            var billStatus = currentRecord.getValue({fieldId: 'transtatus'});
         
            // Show make payment button if record status is open 
            if (eventType == 'VIEW' && billStatus == 'A') {
                var checkUrl = url.resolveRecord({
                    recordType: 'check',
                    isEditMode: true
                });

                var customForm = CUSTOM_FORM_ID_CHECK;
                var accountId = ACCOUNT_CONTRACTOR_PAYABLES;
                var contractorBillId = currentRecord.getValue({fieldId: 'id'}); 
                var entity = currentRecord.getValue({fieldId: 'custbody_norwin_cb_contractor'});

                checkUrl = checkUrl + '&cbid='+ contractorBillId +'&selectedtab=items&cf='+ customForm +'&entity='+entity+'&acid='+ accountId;
                
                billForm.addButton({
                    id: 'custpage_make_payment',
                    label: 'Make Payment',
                    functionName: 'window.open("' + checkUrl + '", "_self")'
                });
            }
        } catch (error) {
            log.debug("error in beforeLoad ",error);
        }
    };


    const afterSubmit = (scriptContext) => {
        try {
            var eventType = scriptContext.type.toUpperCase();
            var currentRecord = scriptContext.newRecord;
            var contractorBillId = currentRecord.getValue({fieldId: 'id'});
            var billRecOjb = record.load({type:'customtransaction_norwin_contractor_bill',id: contractorBillId});
            var amount = billRecOjb.getValue({fieldId: 'total'});
            var amountDue = 0;
            log.debug("eventType ",eventType);
            if (eventType == 'CREATE') {
                amountDue = Number(amount);
                billRecOjb.setValue({fieldId: 'custbody_norwin_amount_due', value: amountDue});
                billRecOjb.save();
            } else if (eventType == 'EDIT') {
                var paidChecksAmount =  getBillChecksAmount(contractorBillId);

                if (paidChecksAmount > 0) {
                    amountDue = Number(amount) - Number(paidChecksAmount);
                } else {
                    amountDue = Number(amount);
                }

                billRecOjb.setValue({fieldId: 'custbody_norwin_amount_due', value: amountDue});

                if (amountDue == 0) {
                    billRecOjb.setValue({fieldId:'transtatus', value: 'B'}); // B - Paid In Full
                } else if (amountDue > 0){
                    billRecOjb.setValue({fieldId:'transtatus', value: 'A'}); // A - Open 
                }

                billRecOjb.save();
            }
        } catch (error) {
            log.debug("Error in afterSubmit ",error);
        }
    };

    return {
        beforeLoad, 
        afterSubmit
    };
});
