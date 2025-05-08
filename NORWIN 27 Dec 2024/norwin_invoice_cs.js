/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 *//*************************************************************************
* Company:    Invitra Technologies Private Limited
* Author:     Invitra Developer
* Script:
* Applies To: Invoice
*
*
* This script includes below functionality
*  1) In this invoice record, When the page get initialized it disabled the tax code field under the billable time.
*
*
* Version    Date            Author        Remarks
* 2.0       13 Dec 2023     Supriya     Initial commit
*
***********************************************************************/
define(['N/record', 'N/currentRecord', 'N/error', 'N/ui/dialog', './norwin_common_library.js'], function (record, currRecord, error, dialog) {
   // var currentRecord = "";

    function pageInit(context) {
        var termId = '';
        var currentRecord = context.currentRecord;       
        
        var projectType = currentRecord.getValue({ fieldId: "custbody_jd_project_type" });
        var startDateFld = currentRecord.getField({ fieldId: "custbody_norwin_inv_duration_startdate" });
        var endDateFld = currentRecord.getField({ fieldId: "custbody_norwin_inv_duration_enddate" });
        var paymentTerms = currentRecord.getValue({ fieldId: "custbody_jd_payment_terms_days" });
        log.debug("paymentTerms", paymentTerms);
        log.debug("context.mode", context.mode);

        if((context.mode == 'create' || context.mode == 'copy') && paymentTerms) {
            var termSearchObj = search.create({
                type: "term",
                filters:
                [
                   ["name","is", "Net "+paymentTerms]
                ],
                columns:
                [
                    search.createColumn({name: "internalid", label: "Internal ID"})   
                ]
            });
            var searchResult = termSearchObj.run().getRange(0, 1);
            log.debug("searchResult", searchResult);

            if (searchResult && searchResult.length) {
                termId = searchResult[0].getValue({name: "internalid"});
                log.debug('termId', termId);

                currentRecord.setValue({ fieldId: "terms", value: termId });
            }        
        }

        // projectType = 2 = Time & Material
        if (projectType == TIME_AND_MATERIAL) {
            startDateFld.isDisabled = true;
            endDateFld.isDisabled = true;
        }

        // Disable Rate & Tax code for Billable Time & set Total Billable Time
        var totBillableTime = 0;
        var timeLinesCount = currentRecord.getLineCount({ sublistId: 'time' });
        for (var i = 0; i < timeLinesCount; i++) {
            var taxcodeField = currentRecord.getSublistField({ sublistId: 'time', fieldId: "taxcode", line: i });
            var rateField = currentRecord.getSublistField({ sublistId: 'time', fieldId: "rate", line: i });
            var qtyHrs = currentRecord.getSublistValue({sublistId: 'time', fieldId: 'qty', line: i});
            var apply = currentRecord.getSublistValue({sublistId: 'time', fieldId: 'apply', line: i}); 
            
            if(apply) {
                totBillableTime = Number(totBillableTime) + Number(qtyHrs);
            }

            if (taxcodeField && rateField) {
                // Disabled the tax coed field
                taxcodeField.isDisabled = true;
                rateField.isDisabled = true; 
            }
        }
        currentRecord.setValue({ fieldId: 'custbody_norwin_total_billable_time', value: Number(totBillableTime) });

        // Set default Taxcode - works only in client
        var expenseLinesCount = currentRecord.getLineCount({ sublistId: 'expcost' });
        for (var e = 0; e < expenseLinesCount; e++) {
            currentRecord.selectLine({ sublistId: 'expcost', line: e });
            currentRecord.setCurrentSublistValue({ sublistId: 'expcost', fieldId: "taxcode", value: TAX_CODE_NORWIN });
            currentRecord.commitLine({ sublistId: 'expcost' });
        }
    }


    //--------------------
    function fieldChanged(context) {
        try {
            var currentRecord = context.currentRecord;
            var recordType = currentRecord.type;
            var jdSalesTaxRate = currentRecord.getValue('custbody_jd_sales_tax_rate');

            var sublistName = context.sublistId;
            var sublistFieldName = context.fieldId;
            var dtRate= currentRecord.getValue({ fieldId: 'custbody_jd_double_time' });
            var otRate = currentRecord.getValue({ fieldId: 'custbody_jd_overtime_rate' });
            var regRate = currentRecord.getValue({ fieldId: 'custbody_jd_bill_rate' });
            var netBill = currentRecord.getValue({ fieldId: 'custbody_jd_net_bill_rate' });
            var netOt = currentRecord.getValue({ fieldId: 'custbody_jd_net_over_time' });
            var netDt = currentRecord.getValue({ fieldId: 'custbody_jd_net_double_time' });

            if (sublistName === 'time' && sublistFieldName === 'apply') {
                var currIndex = currentRecord.getCurrentSublistIndex({sublistId: sublistName});               
                var timeBillId = currentRecord.getSublistValue({sublistId: sublistName, fieldId: 'doc', line: currIndex});
                var rate = currentRecord.getSublistValue({sublistId: sublistName, fieldId: 'rate', line: currIndex});
                var apply = currentRecord.getCurrentSublistValue({sublistId: sublistName, fieldId: 'apply'});

                if(apply && timeBillId) {
                    var timeRec = search.lookupFields({
                        type: search.Type.TIME_BILL,
                        id: timeBillId,
                        columns: ['custcol_jd_hours_type']
                    });
                    var hrsType = timeRec.custcol_jd_hours_type;
                    if(netBill  && netBill !='0'){
                        regRate = netBill;
                    }
                
                    if(netOt && netOt !='0'){
                        otRate = netOt;
                    }
                    if(netDt && netDt !='0'){
                        dtRate = netDt;
                    }

                    var billRate = regRate;
                    if(hrsType[0].text =='OT_HOURS'){
                        billRate = otRate;
                    }
                    else if(hrsType[0].text =='DT_HOURS'){
                        billRate = dtRate;
                    }
                    currentRecord.setCurrentSublistValue({sublistId: sublistName, fieldId: 'rate', value: Number(billRate)});
                    currentRecord.setCurrentSublistValue({sublistId: sublistName, fieldId: 'taxcode', value: TAX_CODE_NORWIN, ignoreFieldChange: true, forceSyncSourcing: true});
                    currentRecord.setCurrentSublistValue({sublistId: sublistName, fieldId: 'taxrate1', value: jdSalesTaxRate});
                }

                var totBillableTime = 0;
                var lineCount = currentRecord.getLineCount({sublistId: sublistName});
                for (var i = 0; i < lineCount; i++) {
                    var apply = currentRecord.getSublistValue({sublistId: sublistName, fieldId: 'apply', line: i}); 
                    var qtyHrs = currentRecord.getSublistValue({sublistId: sublistName, fieldId: 'qty', line: i});
                    if(apply) {
                        totBillableTime = Number(totBillableTime) + Number(qtyHrs);
                    }
                }
                currentRecord.setValue({ fieldId: 'custbody_norwin_total_billable_time', value: Number(totBillableTime) });
            }
        } catch (error) {
            log.debug('error', error);
        }
    }
    //--------------------

    function saveRecord(context) {
        var selTimeLines = false;
        var selExpLines = false;

        var currentRecord = context.currentRecord;
        var projectType = currentRecord.getValue({ fieldId: "custbody_jd_project_type" });
        var startDateFld = currentRecord.getValue({ fieldId: "custbody_norwin_inv_duration_startdate" });
        var endDateFld = currentRecord.getValue({ fieldId: "custbody_norwin_inv_duration_enddate" });

        if (projectType != TIME_AND_MATERIAL && (!startDateFld || !endDateFld)) {
            alert("Please enter dates for both 'INVOICE DURATION START DATE' & 'INVOICE DURATION END DATE'.");
            return false;
        }

        if (projectType != TIME_AND_MATERIAL) {
            if(!confirm("Please confirm quantity before you save.")) {
                return false;
            }
        }

        var timeLinesCount = currentRecord.getLineCount({ sublistId: 'time' });
        var expLinesCount = currentRecord.getLineCount({ sublistId: 'expcost' });

        // if(timeLinesCount && expLinesCount) {
        //     alert('You can select either Expense lines or time lines at a time.');
        // }

        if (expLinesCount > 0) {
            for (var e = 0; e < expLinesCount; e++) {
                var apply = currentRecord.getSublistValue({ sublistId: 'expcost', fieldId: "apply", line: e });
                if (apply) {
                    selExpLines = true;
                    break;
                }
            }
        }

        if (timeLinesCount > 0) {
            for (var t = 0; t < timeLinesCount; t++) {
                var apply = currentRecord.getSublistValue({ sublistId: 'time', fieldId: "apply", line: t });
                if (apply) {
                    selTimeLines = true;
                    break;
                }
            }
        }

        if (selExpLines && selTimeLines) {
            alert('You cannot select both Billable Expenses and Billable Time at same time for an invoice. Kindly Invoice them seperately.');
            return false;
        }

        if (selTimeLines && expLinesCount > 0) {
            alert('Billable Expense lines are available. Kindly invoice them seperately.');
        }

        return true;
    }

    function onClickPrintPdf(pdfUrl) {
        window.open(pdfUrl, '_blank');
    }

    function onClickSendEmail(recipients, emailslUrl) {
        var cuRecord = currRecord.get();
        
        if(!recipients) {           
            dialog.alert({
                title: 'Error',
                message: 'Missing \'Email Recipients\'.'
            });
            return false;
        }

        var options = {
            title: "Confirmation",
            message: "Are you sure you want send an email?"
        };
        
        function success(result) { 
            console.log("Success with value " + result); 
            if(result) {
                window.open(emailslUrl, '_self');
            }
        }
     
        dialog.confirm(options).then(success);//.catch(failure);      
    }

    return {
        pageInit: pageInit,
        saveRecord: saveRecord,
        fieldChanged: fieldChanged,
        onClickPrintPdf: onClickPrintPdf,
        onClickSendEmail: onClickSendEmail
    }

});