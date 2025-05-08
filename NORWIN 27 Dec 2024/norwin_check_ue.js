/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * 
 *******************************************************************************************
 * Company:		Invitra Technologies Pvt.Ltd
 * Author:	    Prathmesh Bonte
 * FileName:    norwin_check_ue.js
 * Deployed:    Check
 * 
 * Module Description : 
 * 1 beforeSubmit : In record create & edit mode check if amount is exceeding bill amount due, if check amount exceeding bill amount due throw error
 * 2 afterSubmit : Re - Calculate the amount due for contractor bill on Create, Edit, Delete event of Check
 * 
 * Version    Date            Author           	  Remarks
 * 1.00     15-07-2024    Prathmesh Bonte	   Initial Version
 *
 ********************************************************************************************/
define(['N/record','N/error','N/runtime','./norwin_common_library.js'],(record, error, runtime) => {
    const beforeSubmit = (scriptContext) => {
        try {
            var exeContext = runtime.executionContext;
            var eventType = scriptContext.type.toUpperCase(); 
            var currentRecord = scriptContext.newRecord;

            log.debug("BS exeContext ",exeContext);
            log.debug("BS eventType ",eventType);
            log.debug("BS currentRecord ",currentRecord);

            if (exeContext == 'CSVIMPORT') {
                if (eventType == 'CREATE' || eventType == 'EDIT') {
                    var newAmountDue = 0;
                    var contractBillId = currentRecord.getValue({fieldId: 'custbody_norwin_contractor_bill'});
                    log.debug("BS contractBillId",contractBillId);
                    var currentCheckAmount = currentRecord.getValue('usertotal');
                    var billRecObj = record.load({type: 'customtransaction_norwin_contractor_bill' ,id: contractBillId});
                    log.debug("BS billRecObj ",billRecObj);
                    var billTotalAmount = billRecObj.getValue({fieldId: 'total'});
    
                    var paidChecksAmount = getBillChecksAmount(contractBillId);
                    var amountDue = Number(billTotalAmount) - Number(paidChecksAmount);

                    if (eventType == 'EDIT') {
                        var oldRecordObj = scriptContext.oldRecord;
                        var currentCheckOldAmount = oldRecordObj.getValue('usertotal');
                        newAmountDue = Number(billTotalAmount) - ((Number(paidChecksAmount) - Number(currentCheckOldAmount)) + Number(currentCheckAmount));
                    } else {
                        newAmountDue = Number(billTotalAmount) - (Number(paidChecksAmount) + Number(currentCheckAmount)); 
                    }

                    log.debug("BS newAmountDue", newAmountDue);
                    if (newAmountDue < 0) {
                        throw error.create({name: 'BILL_AMOUNT_EXCEED',message: 'Check amount exceeding the Bill amount due ('+amountDue+')'});
                    }
                }
            }
        } catch (error) {
            if(error.name == 'BILL_AMOUNT_EXCEED') {
                throw error.message;
            } else {
                log.debug('Error in beforeSubmit ',error);
            }
        }
    };


    const afterSubmit = (scriptContext) => {
        try {
            var newAmountDue = 0;
            var exeContext = runtime.executionContext;
            var eventType = scriptContext.type.toUpperCase(); 
            var currentRecord = "";
            log.debug("AS exeContext ",exeContext);
            if (exeContext === 'USERINTERFACE' || eventType === 'CREATE') {
                currentRecord = scriptContext.newRecord;
            } else{
                currentRecord = scriptContext.oldRecord;
            }
           
            log.debug("AS currentRecord ",currentRecord);
            var contractorBillId = currentRecord.getValue({fieldId: 'custbody_norwin_contractor_bill'});
            log.debug("AS ContractorBillId",contractorBillId);
            var billRecObj = record.load({type:'customtransaction_norwin_contractor_bill',id: contractorBillId});
            var amount = billRecObj.getValue({fieldId: 'total'});

            var paidChecksAmount = getBillChecksAmount(contractorBillId);

            log.debug("eventType ",eventType);
            if (eventType === 'DELETE') {
                newAmountDue = amount - paidChecksAmount;
                log.debug("AS newAountDue ",newAmountDue);
                if (newAmountDue > 0) {
                    billRecObj.setValue({fieldId:'transtatus', value: 'A'}); // A - Open
                }
            } else if (eventType === 'CREATE' || eventType === 'EDIT'){
                newAmountDue = amount - paidChecksAmount;
                log.debug("AS newAountDue ",newAmountDue);
                //If the amount due for contractor bill is zero then change the bill status to Paid In Full & vice - versa
                if (newAmountDue === 0 || newAmountDue < 0) {
                    billRecObj.setValue({fieldId:'transtatus', value: 'B'}); // B - Paid In Full
                } else if (newAmountDue > 0){
                    billRecObj.setValue({fieldId:'transtatus', value: 'A'}); // A- Open
                }
            }

            billRecObj.setValue({fieldId:'custbody_norwin_amount_due', value: newAmountDue});
            billRecObj.save();
        } catch (error) {
            log.debug("Error In afterSubmit ",error);
        }
    };

    return {
        beforeSubmit, 
        afterSubmit
    };
});
