/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * 
 * *******************************************************************************************
 * Company:		Invitra Technologies Pvt.Ltd
 * Author:	    Prathmesh Bonte
 * FileName:    norwin_pay_contractor_bills_sl.js
 * Deployed:    
 * 
 * Module Description :
 * This suitelet provides UI to process bulk contractor bill payments  
 *
 * Version    Date            Author           	  Remarks
 * 1.00     25-07-2024    Prathmesh Bonte	   Initial Version
 *
 ********************************************************************************************/
define(['N/ui/serverWidget', 'N/search', 'N/runtime', 'N/url', 'N/record','N/redirect', './norwin_common_library.js'],(serverWidget, search, runtime, url, record, redirect) => {
    /**
     * Defines the Suitelet script trigger point.
     * @param {Object} scriptContext
     * @param {ServerRequest} scriptContext.request - Incoming request
     * @param {ServerResponse} scriptContext.response - Suitelet response
     * @since 2015.2
     */
    const onRequest = (scriptContext) => {
        if (scriptContext.request.method == "GET") {
            try {
                var form = generateForm(scriptContext);
                scriptContext.response.writePage(form);
            } catch (error) {
                log.error("error in GET ",error);
            }
        }
    };


    function generateForm(scriptContext) {
        var params = scriptContext.request.parameters;
        var contractorParam = params['contractor'] || "";
        var toDateParam = params['toDate'] || "";
        var fromDate = params['fromDate'] || "";
        var billsObj = [];

        var form = serverWidget.createForm({title : 'Pay Contractor Bills'});
        form.clientScriptModulePath = './norwin_pay_contractor_bills_cs.js';
        form.addFieldGroup({id: 'custpage_filter_group',label: 'filter',});
        form.addFieldGroup({id: 'custpage_sublist_group',label: 'Bills',});
        form.addButton({id : 'custpage_submit',label : 'Submit',functionName:'submitPayment()'});
        form.addButton({id : 'custpage_reset',label : 'Reset',functionName: 'resetFilter()'});

        // Add select Fields
        var selectContractor = form.addField({id: 'custpage_select_contractor', label: 'Norwin Contractor', type: serverWidget.FieldType.SELECT, source: 'employee', container: 'custpage_filter_group'});
        var selectFromDate = form.addField({id: 'custpage_select_from_date', label: 'From Date',type: serverWidget.FieldType.DATE, container: 'custpage_filter_group'});
        var selectToDate = form.addField({id: 'custpage_select_to_date', label: 'To Date',type: serverWidget.FieldType.DATE, container: 'custpage_filter_group'});
        var resultsPageIndexFld = form.addField({id: "custpage_results_page_index_fld", type: serverWidget.FieldType.SELECT, label: "Page Index"});

        // disable page index field
        resultsPageIndexFld.updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED});

        // Add sublist
        var sublist = form.addSublist({id : 'custpage_bill_sublist', type : serverWidget.SublistType.LIST, label : 'Bills'});
        var sublistCheck = sublist.addField({id: 'custpage_col_checkbox',type: serverWidget.FieldType.CHECKBOX, label: 'Select'});
        var sublistBill = sublist.addField({id: 'custpage_col_bill',type: serverWidget.FieldType.TEXT, label: 'Bill'});
        var sublistDate = sublist.addField({id: 'custpage_col_trandate',type: serverWidget.FieldType.DATE, label: 'Date'});
        var sublistContractor = sublist.addField({id: 'custpage_col_contractor',type: serverWidget.FieldType.SELECT, source:'employee', label: 'Norwin Contractor'});
        var sublistCurrency = sublist.addField({id: 'custpage_col_currency',type: serverWidget.FieldType.SELECT, source:'currency', label: 'Currency'});
        var sublistTotalAmount = sublist.addField({id: 'custpage_col_total_amount', type: serverWidget.FieldType.TEXT, label: 'Total Amount'});
        var sublistAmountDue = sublist.addField({id: 'custpage_col_amount_due', type: serverWidget.FieldType.TEXT, label: 'Amount Due'});
        var sublistPayment = sublist.addField({id: 'custpage_col_payment', type: serverWidget.FieldType.FLOAT, label: 'Payment'});
        
        // Disable line level fields
        sublistBill.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
        sublistDate.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
        sublistContractor.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
        sublistCurrency.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
        sublistTotalAmount.updateDisplayType({displayType: serverWidget.FieldDisplayType.DISABLED});
        sublistAmountDue.updateDisplayType({displayType: serverWidget.FieldDisplayType.NORMAL});
        // make payment column editable
        sublistPayment.updateDisplayType({displayType: serverWidget.FieldDisplayType.ENTRY});

        // set filter values received from client script
        selectContractor.defaultValue = contractorParam;
        selectToDate.defaultValue = toDateParam;
        selectFromDate.defaultValue = fromDate;

        billsObj = getOpenBills(params, resultsPageIndexFld);
        log.debug("billsObj ",billsObj);
        
        /**
         * billsObj = {
                id: "125100",
                contractor: "32803",
                currency: "2",
                amount: "1410.00",
                amountdue: "1399.00",
                date: "07/18/2024"
            }
         */
        try {
            if (billsObj) {
                var index = 0;
                billsObj.forEach(function (billObj) {
                    var billRecUrl = url.resolveRecord({recordType: 'customtransaction_norwin_contractor_bill',recordId: billObj.id,isEditMode: false})
                    var recLink = '<a href ='+ billRecUrl +'>'+ billObj.id +'</a>';
                    
                    sublist.setSublistValue({id: 'custpage_col_bill', line: index, value: recLink});
                    sublist.setSublistValue({id: 'custpage_col_contractor', line: index, value: billObj.contractor});
                    sublist.setSublistValue({id: 'custpage_col_currency', line: index, value: billObj.currency});
                    sublist.setSublistValue({id: 'custpage_col_total_amount', line: index, value: billObj.amount});
                    sublist.setSublistValue({id: 'custpage_col_amount_due', line: index, value: billObj.amountdue});
                    sublist.setSublistValue({id: 'custpage_col_trandate', line: index, value: billObj.date});
                    index++;
                }); 
            }
        } catch (error) {
            log.error("error while adding sublist ",error);
        }
        
        return form;
    }


    function getOpenBills(params, resultsPageIndexFld) {
        try {
            var norwinContractorParam = params['contractor'];
            var fromDateParam = params['fromDate'];
            var toDateParam = params['toDate'];

            var billsObj = [];
            var billSearchObj = search.create({
                type: "transaction",
                settings:[{"name":"consolidationtype","value":"ACCTTYPE"}],
                filters:
                [
                    ["type","anyof","Custom103"], 
                    "AND", 
                    ["status","anyof","Custom103:A"], 
                    "AND", 
                    ["mainline","is","T"]
                ],
                columns:
                [
                    search.createColumn({name: "custbody_norwin_cb_contractor", label: "Norwin Contractor"}),
                    search.createColumn({name: "currency", label: "Currency"}),
                    search.createColumn({name: "amount", label: "Amount"}),
                    search.createColumn({name: "custbody_norwin_amount_due", label: "Norwin Amount Due"}),
                    search.createColumn({name: "trandate", label: "Date"})
                ]
            });
        
            if (norwinContractorParam) {
                var contractorFilter = search.createFilter({
                    name: 'custbody_norwin_cb_contractor',
                    operator: search.Operator.ANYOF,
                    values: norwinContractorParam
                });
                billSearchObj.filters.push(contractorFilter);
            }
            if (fromDateParam || toDateParam) {
                var DateFilter = search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.WITHIN,
                    values: [fromDateParam, toDateParam]
                });
                billSearchObj.filters.push(DateFilter);
            }

            var page = addPagination(params, billSearchObj, resultsPageIndexFld);

            try {
                if (page) {
                    page.data.forEach(function (result) {
                        var billObj = {
                            'id': result.id,
                            'contractor': result.getValue({name: "custbody_norwin_cb_contractor"}),
                            'currency': result.getValue({name: "currency"}),
                            'amount': result.getValue({name: "amount"}),
                            'amountdue': result.getValue({name: "custbody_norwin_amount_due"}),
                            'date': result.getValue({name: "trandate"})
                        };
            
                        billsObj.push(billObj);
                    });   
                }
            } catch (error) {
                log.debug("error ",error);
            }

            return billsObj;           
        } catch (error) {
            log.error("error in getOpenBills ",error);
        }
    }


    function addPagination(params, billSearchObj, resultsPageIndexFld) {
        try {
            const PAGE_SIZE = runtime.getCurrentScript().getParameter('custscript_norwin_page_size');
            var searchResult = billSearchObj.runPaged({pageSize: PAGE_SIZE});

            // Set the pagination
            if (searchResult.count) {
                const pages = Math.ceil(searchResult.count / PAGE_SIZE);
                let pageIndex = params["pageIndex"];

                if (!pageIndex || pageIndex == "" || pageIndex < 0) {
                    pageIndex = 0;
                } else if (pageIndex >= pages) {
                    pageIndex = pages - 1;
                } else {
                    pageIndex = parseInt(pageIndex);
                }

                if (searchResult.count > PAGE_SIZE) {
                    resultsPageIndexFld.updateDisplayType({displayType: serverWidget.FieldDisplayType.NORMAL});

                    for (let i = 0; i < pages; i++) {
                        if (i == pageIndex) {
                            resultsPageIndexFld.addSelectOption({
                                value: String(i),
                                text: ((i * PAGE_SIZE) + 1) + " - " + ((i + 1) * PAGE_SIZE),
                                isSelected: true
                            });
                        } else {
                            resultsPageIndexFld.addSelectOption({
                                value: String(i),
                                text: ((i * PAGE_SIZE) + 1) + " - " + ((i + 1) * PAGE_SIZE)
                            });
                        }
                    }
                }
                const page = searchResult.fetch({ index: pageIndex });
                return page;
            }         
        } catch (error) {   
            log.error("error in addPagination ",error);
        }
    }


    return {onRequest};
});