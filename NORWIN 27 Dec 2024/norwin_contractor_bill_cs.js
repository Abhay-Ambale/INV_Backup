/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 *
 *******************************************************************************************
 * Company:		Invitra Technologies Pvt.Ltd
 * Author:	    Prathmesh Bonte
 * FileName:    norwin_contractor_bill_cs.js
 * Deployed:    Norwin Contractor Bill
 * 
 * Module Description : 
 * 1.pageInit : Disable ns standard line level ACCOUNT field
 * 2.fieldChanged : set the ACCOUNT field value on fieldchange of NORWIN ACCOUNT field
 *
 * Version    Date            Author           	  Remarks
 * 1.00     12-07-2024    Prathmesh Bonte	   Initial Version
 *
 ********************************************************************************************/
define([],function() {
    function pageInit(scriptContext) {
        try {
            var currentRecord = scriptContext.currentRecord;
            var lineFieldAccount = currentRecord.getSublistField({sublistId: 'line',fieldId: 'account',line: 0});
            lineFieldAccount.isDisabled = true;
        } catch (error) {
            console.log("Error in pageInit ",error);
        }
    }


    function fieldChanged(scriptContext) {
        try {
            var currentRecord = scriptContext.currentRecord;
    
            if (scriptContext.fieldId == 'custcol_norwin_cb_account') {
                var NorwinAccount = currentRecord.getCurrentSublistValue({sublistId:'line', fieldId: "custcol_norwin_cb_account"});
                currentRecord.setCurrentSublistValue({sublistId: 'line', fieldId: "account", value: NorwinAccount});
            }
        } catch (error) {
            console.log("Error while setting accountField ",error);
        }
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
    };
});

