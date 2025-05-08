/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * 
 *******************************************************************************************
 * Company:		Invitra Technologies Pvt.Ltd
 * Author:	    Prathmesh Bonte
 * FileName:    norwin_journal_voiding_ue.js
 * Deployed:    Journal Entry
 * 
 * Module Description : If journal entry record is created to void check then update the Re-calculated amount due on contractor bill record
 *
 * Version    Date            Author           	  Remarks
 * 1.00     16-07-2024    Prathmesh Bonte	   Initial Version
 *
 ********************************************************************************************/
define(['N/record','N/search','./norwin_common_library.js'],(record, search) => {
    const afterSubmit = (scriptContext) => {
        try {
            var currentRecord = scriptContext.newRecord;
            log.debug("currentRecord ",currentRecord);
            var isVoid = currentRecord.getValue({fieldId: 'void'});
            var voidRec = currentRecord.getText({fieldId: 'createdfrom'});

            if (isVoid && (voidRec.includes('Check'))) {
                var newAmountDue = 0;
                var checkId = currentRecord.getValue({fieldId: 'createdfrom'});
                var contractBill = search.lookupFields({type: 'check',id: checkId ,columns: 'custbody_norwin_contractor_bill'});
                var contractBillId = contractBill.custbody_norwin_contractor_bill[0].value;
                var billRecObj = record.load({type: 'customtransaction_norwin_contractor_bill' ,id: contractBillId});
                var billTotalAmount = billRecObj.getValue({fieldId: 'total'});
                var paidChecksAmount = getBillChecksAmount(contractBillId);

                if (paidChecksAmount > 0) {
                    newAmountDue = billTotalAmount - paidChecksAmount;
                } else {
                    newAmountDue = billTotalAmount;
                }

                billRecObj.setValue({fieldId:'custbody_norwin_amount_due', value: newAmountDue});
                
                if (newAmountDue === 0) {
                    billRecObj.setValue({fieldId:'transtatus', value: 'B'}); // B - Paid In Full
                } else if (newAmountDue > 0){
                    billRecObj.setValue({fieldId:'transtatus', value: 'A'}); // A -Open
                }

                billRecObj.save();
            }      
        } catch (error) {
            log.debug("error in afterSubmit ",error);
        }
    };

    return {
        afterSubmit
    };
});
