/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 ********************************************************************************************
 * Company:		Invitra Technologies Pvt.Ltd
 * Author:	    Prathmesh Bonte
 * FileName:    norwin_check_cs.js
 * Deployed:    Check
 * 
 * Module Description : 
 * 1 pageInit : In record create mode set the value of contractor bill & line level expenses, received from contractor bill record in url parameters
 * 2 saveRecord : In record create & edit mode check if amount is exceeding bill amount due, if check amount exceeding bill amount due show alert & restrict to save the record
 * 
 * Version    Date            Author           	  Remarks
 * 1.00     18-07-2024    Prathmesh Bonte	   Initial Version
 *
 ********************************************************************************************/
define(['N/currentRecord','N/record','./norwin_common_library.js'],function(currentRecord, record) {
    var currentCheckOldAmount = 0;
    var eventType = '';

    function pageInit(scriptContext) {
        try {
            eventType = scriptContext.mode.toUpperCase();
            var currentRecordObj = currentRecord.get();
            currentCheckOldAmount = currentRecordObj.getValue('usertotal');

            if (eventType == 'CREATE') {
                var amountDue = 0;
                var currentRecordUrl = new URL(window.location.href);

                var contractorBillId = currentRecordUrl.searchParams.get("cbid");
                var accountId = currentRecordUrl.searchParams.get("acid");

                var paidChecksAmount = getBillChecksAmount(contractorBillId);

                var billRecObj = record.load({type: 'customtransaction_norwin_contractor_bill' ,id: contractorBillId});
                var amount = billRecObj.getValue({fieldId: 'total'});

                if (paidChecksAmount > 0) {
                    amountDue = Number(amount) - Number(paidChecksAmount);
                } else {
                    amountDue = amount;
                }

                currentRecordObj.setValue({fieldId: 'custbody_norwin_contractor_bill', value: contractorBillId});
                currentRecordObj.selectNewLine({sublistId: 'expense'});
                currentRecordObj.setCurrentSublistValue({sublistId: 'expense',fieldId: 'account',value: accountId });
                currentRecordObj.setCurrentSublistValue({sublistId: 'expense',fieldId: 'amount',value: amountDue });
                currentRecordObj.commitLine({sublistId: 'expense'});
                currentRecordObj.setValue({fieldId: 'usertotal', value: amountDue});
            } 
        } catch (error) {
            console.log("Error: ",error);
        }
    }


    function saveRecord(scriptContext) {
        if (eventType == 'CREATE' || eventType == 'EDIT') {
            var newAmountDue = 0;
            var currentRecord = scriptContext.currentRecord;
            var currentCheckAmount = currentRecord.getValue('usertotal');
            var contractBillId = currentRecord.getValue('custbody_norwin_contractor_bill');
            var contractBill = currentRecord.getText('custbody_norwin_contractor_bill');
            contractBill = contractBill.split('Bill')[1];
            
            if (contractBillId) {
                var billRecObj = record.load({type: 'customtransaction_norwin_contractor_bill' ,id: contractBillId});
                var billTotalAmount = billRecObj.getValue({fieldId: 'total'});
        
                var paidChecksAmount = getBillChecksAmount(contractBillId);
                var amountDue = Number(billTotalAmount) - Number(paidChecksAmount);

                if (eventType == 'EDIT') {
                    // newAmountDue = (contractor bill amount) - ((Total check amount paid against bill) - (amount of check in edit mode) + (updated/changed amount of check in edit mode))
                    newAmountDue = Number(billTotalAmount) - ((Number(paidChecksAmount) - Number(currentCheckOldAmount)) + Number(currentCheckAmount));
                } else {
                    // newAmountDue = (contractor bill amount) - ((Total check amount paid against bill) + (amount of check in edit mode))
                    newAmountDue = Number(billTotalAmount) - (Number(paidChecksAmount) + Number(currentCheckAmount)); 
                }
                console.log("newAmountDue ",newAmountDue);

                if (newAmountDue < 0) {
                    if (amountDue > 0) {
                        alert('Check amount exceeding the bill amount due '+amountDue);
                    } else {
                        alert("No amount due for Contractor Bill " +contractBill);
                    }
                    return false;
                }
            }
            return true;
        }
    }

    function lineInit(scriptContext) {
        if (eventType == 'CREATE' || eventType == 'EDIT') {           
            var currentRecord = scriptContext.currentRecord;
            var contractBillId = currentRecord.getValue('custbody_norwin_contractor_bill');
           
            if(contractBillId) {
                var expAccFld = currentRecord.getCurrentSublistField({sublistId: 'expense',fieldId: 'account'});
                expAccFld.isDisabled = true;
            }
        }
    }
    return {
        pageInit: pageInit,
        saveRecord: saveRecord,
        lineInit: lineInit
    };
});