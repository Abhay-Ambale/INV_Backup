/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * 
 * *******************************************************************************************
 * Company:		Invitra Technologies Pvt.Ltd
 * Author:	    Prathmesh Bonte
 * FileName:    norwin_pay_contractor_bill_cs.js
 * Deployed:    Norwin Pay Contractor Bill suitelet
 * 
 * Module Description : 
 * 1. This client script is use to apply validation on bulk contractor bill transaction 
 * 2. Also this script use to call backend suitelet to process bulk contractor bills
 * 
 * Version    Date            Author           	  Remarks
 * 1.00     26-07-2024    Prathmesh Bonte	   Initial Version
 *
 ********************************************************************************************/
define(['N/format','N/currentRecord', 'N/url', 'N/https'],
    function(format, currentRecord, url, https) {
        function pageInit(scriptContext) {
            var attr = document.createAttribute('style');
            attr.nodeValue = 'background-color: blue !important;  color: white !important;';
            document.getElementById('custpage_submit').setAttributeNode(attr);

            var secondaryattr = document.createAttribute('style');
            secondaryattr.nodeValue = 'background-color: blue !important;  color: white !important;';
            document.getElementById('secondarycustpage_submit').setAttributeNode(secondaryattr);
            
            var sweetAlert = document.createElement('script');
            sweetAlert.src = "//cdn.jsdelivr.net/npm/sweetalert2@11";
            document.getElementsByTagName('body')[0].appendChild(sweetAlert);
        }

        var trueCheckBoxCount = 0;
        function fieldChanged(scriptContext) {
            var currentRecordObj = scriptContext.currentRecord;
            // set the page index parameter
            if (scriptContext.fieldId === "custpage_results_page_index_fld") {
                var pageIndex = currentRecordObj.getValue({
                    fieldId: "custpage_results_page_index_fld"
                });

                var urlObj = new URL(window.location.href);

                urlObj.searchParams.set("pageIndex", pageIndex);

                window.onbeforeunload = null;
                window.location.replace(urlObj);
            }
            
            // if any of the filter value changed then populate the search result accordingly
            if (scriptContext.fieldId === "custpage_select_contractor" || scriptContext.fieldId === "custpage_select_from_date" || scriptContext.fieldId === "custpage_select_to_date") {
                var urlObj = new URL(window.location.href);
                var contractor = currentRecordObj.getValue('custpage_select_contractor');
                var fromDate = currentRecordObj.getValue('custpage_select_from_date');
                var toDate = currentRecordObj.getValue('custpage_select_to_date');

                if (contractor !== "") { 
                    urlObj.searchParams.set("contractor", contractor); 
                } else { 
                    urlObj.searchParams.set("contractor", ''); 
                }

                if (fromDate !== "") { 
                    fromDate = format.format({ value: fromDate, type: format.Type.DATE });
                    urlObj.searchParams.set("fromDate", fromDate); 
                } else { 
                    urlObj.searchParams.set("fromDate", ''); 
                }

                if (toDate !== "") { 
                    toDate = format.format({ value: toDate, type: format.Type.DATE });
                    urlObj.searchParams.set("toDate", toDate); 
                } else { 
                    urlObj.searchParams.set("toDate", ''); 
                }

                window.onbeforeunload = null;
                window.location.replace(urlObj);
            }

            // set the Payment value from the amount due when check box is true else set it to blank
            if (scriptContext.fieldId == 'custpage_col_checkbox') {
                var lineIndex = currentRecordObj.getCurrentSublistIndex('custpage_bill_sublist');
                var checkBox = currentRecordObj.getSublistValue({sublistId:'custpage_bill_sublist', fieldId: "custpage_col_checkbox", line: lineIndex});

                if (checkBox) {
                    trueCheckBoxCount++;
                    console.log("trueCheckBoxCount ",trueCheckBoxCount);
                    if (trueCheckBoxCount >20) {
                        alert('You cannot select more than 20 bills for payment transaction');
                        currentRecordObj.setCurrentSublistValue({sublistId: 'custpage_bill_sublist', fieldId: "custpage_col_checkbox", value: false});
                    }
                    var amountDue = currentRecordObj.getSublistValue({sublistId:'custpage_bill_sublist', fieldId: "custpage_col_amount_due", line: lineIndex});
                    currentRecordObj.setCurrentSublistValue({sublistId: 'custpage_bill_sublist', fieldId: "custpage_col_payment", value: amountDue});
                } 
                if (!checkBox){
                    trueCheckBoxCount--;
                    currentRecordObj.setCurrentSublistValue({sublistId: 'custpage_bill_sublist', fieldId: "custpage_col_payment", value: ''});
                }
            }

            if (scriptContext.fieldId == 'custpage_col_payment') {
                var lineIndex = currentRecordObj.getCurrentSublistIndex('custpage_bill_sublist');
                var amountDue = currentRecordObj.getSublistValue({sublistId:'custpage_bill_sublist', fieldId: "custpage_col_amount_due", line: lineIndex});
                var payment = currentRecordObj.getSublistValue({sublistId:'custpage_bill_sublist', fieldId: "custpage_col_payment", line: lineIndex});
                var checkBox = currentRecordObj.getSublistValue({sublistId:'custpage_bill_sublist', fieldId: "custpage_col_checkbox", line: lineIndex});

                if ((Number(payment) > Number(amountDue)) || Number(payment) < 0) {
                    currentRecordObj.setCurrentSublistValue({sublistId: 'custpage_bill_sublist', fieldId: "custpage_col_payment", value: amountDue});
                }

                if(Number(payment) == '' && checkBox) {
                    currentRecordObj.setCurrentSublistValue({sublistId: 'custpage_bill_sublist', fieldId: "custpage_col_checkbox", value: false});
                }
            }
        }


        function resetFilter() {
            var recObj = currentRecord.get();

            recObj.setValue({fieldId: 'custpage_select_contractor', value: ''});
            recObj.setValue({fieldId: 'custpage_select_from_date', value: ''});
            recObj.setValue({fieldId: 'custpage_select_to_date', value: ''});
        }


        function submitPayment() {  
            var recordObj = currentRecord.get();
            var billRecordArr = [];

            var linecount = recordObj.getLineCount({sublistId: 'custpage_bill_sublist'});

            for(var lineIndex = 0; lineIndex < linecount; lineIndex++) {
                var checkbox = recordObj.getSublistValue({sublistId: 'custpage_bill_sublist', fieldId: 'custpage_col_checkbox', line: lineIndex});

                if (checkbox) {
                    var billRecordData = {};
                    var billRecordId = recordObj.getSublistValue({sublistId: 'custpage_bill_sublist', fieldId: 'custpage_col_bill', line: lineIndex});
                    var match = billRecordId.match(/id=(\d+)/);
                    billRecordId = match[1];
                    var entity = recordObj.getSublistValue({sublistId: 'custpage_bill_sublist', fieldId: 'custpage_col_contractor', line: lineIndex});
                    var currency = recordObj.getSublistValue({sublistId: 'custpage_bill_sublist', fieldId: 'custpage_col_currency', line: lineIndex});
                    var paymentAmount = recordObj.getSublistValue({sublistId: 'custpage_bill_sublist', fieldId: 'custpage_col_payment', line: lineIndex});
                    
                    billRecordData = {'billId': billRecordId, 'entity': entity,'currency':currency,'payment':paymentAmount};
                    billRecordArr.push(billRecordData);
                }
            }

            if (billRecordArr.length > 0) {
                var bakendSlUrl = url.resolveScript({
                    scriptId: 'customscript_norwin_create_chk_pymt_sl',
                    deploymentId: 'customdeploy_norwin_create_chk_pymt_sl',
                    params: { 'parameterString': JSON.stringify(billRecordArr) },
                    returnExternalUrl: false
                });
                
                showLoader();
                
                setTimeout(function() {
                    https.get.promise({url: bakendSlUrl})
                        .then(function(response){
                            console.log("response ",response); 
                            hideLoader(response.body, billRecordArr.length);
                        }).catch(function onRejected(reason) {
                            log.debug({title: 'Invalid HTTP Get Request: ',details: reason});
                        });
                },500);
            }
        }


        function showLoader() {
            var css = 'body.modal-open { overflow: hidden !important; } .custom-overlay { position: fixed; top: 0; right: 0; bottom: 0; left: 0; z-index: 1000; display: none; opacity: 0; background: rgba(0, 0, 0, 0.1); transition: opacity 500ms; } .custom-overlay.show { display: block; opacity: 1; } .modal {width: 300px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); padding: 20px; border-radius: 1px; background: white; text-align: center;}.spinner {width: 60px;height: 60px;border-radius: 50%;display: inline-block;border-top: 4px solid #053f5c;border-right: 4px solid transparent; box-sizing: border-box;animation: rotation 1s linear infinite;margin: 0 auto;}.spinner::after {content:""; box-sizing: border-box;position: absolute;left: 0;top: 0;width: 60px;height: 60px;border-radius: 50%;border-left: 4px solid #FF3D00;border-bottom: 4px solid transparent;animation: rotation 0.5s linear infinite reverse;}.step { width: 100%; margin-top: 30px; margin-bottom: 15px; text-transform: capitalize; text-align: center; font-size: 18px; color: rgba(0, 0, 0, 0.8);}@keyframes rotation {0% {transform: rotate(0deg);}100% {transform: rotate(360deg);}}';

            var style = document.createElement('style'); style.type = 'text/css';
            style.appendChild(document.createTextNode(css));

            var head = document.getElementsByTagName('head')[0];
            head.appendChild(style);

            var overlay = document.createElement('div');
            overlay.className = 'custom-overlay';

            var modal = document.createElement('div');
            modal.className = 'modal';
            modal.innerHTML = '<div class="spinner"></div>';

            var step = document.createElement('p');
            step.className = 'step';
            step.innerHTML = '<b>please do not close or refresh the page</b>';

            modal.appendChild(step);
            overlay.appendChild(modal);

            var body = document.getElementsByTagName('body')[0];
            body.appendChild(overlay);

            body.classList.add('modal-open');
            overlay.classList.add('show');
        }


        function hideLoader(response, billSelectedCount) {
            try {
                var urlObj = new URL(window.location.href);
                var loader = document.querySelector("body > div.custom-overlay.show > div");
                loader.style.display = 'none';
                var slResponse = JSON.parse(response);
                console.log("slresponse ",slResponse.data);

                if (slResponse.result == 'trnxSuccess') {
                    Swal.fire(
                        'Success!',
                        'Check Payment has been created successfully for '+ billSelectedCount + " selected Bill(s)",
                        'success'
                    ).then(success);

                    function success() {
                        window.onbeforeunload = null;
                        window.location.replace(urlObj);
                    }
                } else if (slResponse.result == 'trnxIncomplete'){
                    var failedBillsDetails = '';
                    var failedBillIds = '';

                    for (var i = 0; i < slResponse.data.length; i++) {
                        var index = i;
                        if(index == 0) {
                            failedBillIds = slResponse.data[i].billId;
                        } else {
                            failedBillIds += ", "+slResponse.data[i].billId;
                        }
                        failedBillsDetails += (index+1)+") Bill : "+ slResponse.data[i].billId + " Error : "+slResponse.data[i].error;
                    }
                    console.log("failedBillsDetails ",failedBillsDetails);
                    console.log("failedBillIds ",failedBillIds);

                    Swal.fire({
                        title: "Transaction Process Incomplete",
                        text: slResponse.data.length +" Bill(s) failed to Process Transactions Out of "+billSelectedCount+ " selected bills",
                        icon: "error",
                        confirmButtonColor: "#3085d6",
                        confirmButtonText: "Check Details"
                    }).then((result) => {
                        if (result.isConfirmed) {
                            Swal.fire({
                                title: 'Failed Bill(s)',
                                html: failedBillIds + "<br>(please check email for more details)</br>",
                                icon: "info"
                            }).then(success);
                            function success() {
                                window.onbeforeunload = null;
                                window.location.replace(urlObj);
                            }
                        }
                    });
                } else if (slResponse.result == 'trnxFailed' || slResponse.result == 'Failed') {
                    Swal.fire({
                        title: 'Error',
                        html: 'Failed to process any of the selected payment transaction '+'<br>(Please check mail for more detail)</br>',
                        icon: 'error'
                    }).then(success);
                    function success() {
                        window.onbeforeunload = null;
                        window.location.replace(urlObj);
                    }
                }
            } catch (error) {
                console.log("hide loader error ", error);
            }
        }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            resetFilter: resetFilter,
            submitPayment: submitPayment
        };
    });