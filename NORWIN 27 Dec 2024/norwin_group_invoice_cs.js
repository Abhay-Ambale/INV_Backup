/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/search', 'N/runtime'],
    /**
     * @param{currentRecord} currentRecord
     * @param{search} search
     */
    function(currentRecord, search,runtime) {
        
        /**
         * Function to be executed after page is initialized.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
         *
         * @since 2015.2
         */
        function pageInit(scriptContext) {

            var currentRec = scriptContext.currentRecord;   
            if(scriptContext.mode =='create'){
                var searchButton = '<button type="button" id="search_invoice_button" class="btn btn-primary">Search</button>';
                currentRec.setValue({
                    fieldId: 'custrecord_norwin_group_invoice_search',
                    value: searchButton
                });
    
                setTimeout(function() {
                    var search_invoice_button = document.getElementById('search_invoice_button');
                    console.log("search_invoice_button", search_invoice_button);
    
                    search_invoice_button.addEventListener('click', function() {
                        showLoader();
                        setTimeout(function(){
                            showRelatedInvoices(scriptContext);
                            hideLoader()  
                            currentRec.setValue({
                                fieldId: 'custrecord_norwin_group_invoice_search',
                                value: ''
                            });
                        },250)                                          
                    });
                   
                }, 250);               
                
            }
            
        }       

        function showRelatedInvoices(scriptContext) {
            var currentRec = scriptContext.currentRecord;
            var customer = currentRec.getValue('custrecord_norwin_grp_invoice_customer');
            var employee = currentRec.getValue('custrecord_norwin_grp_invoice_employee');
            var date = currentRec.getText('custrecord_norwin_grp_invoice_date');
            var projectType = currentRec.getValue('custrecord_norwin_grp_invoice_prjtype');


            if (customer) {
                console.log("Values: "+customer+" "+ employee+" "+date+" "+projectType)                

                try {
                    var filters = [["type","anyof","CustInvc"], 
                    "AND", 
                    ["custbody_norwin_grp_invoice_ref","anyof","@NONE@"], 
                    "AND", 
                    ["custbody_jd_norwin_customer","anyof",customer],"AND", 
                    ["shipping","is","F"], 
                    "AND", 
                    ["taxline","is","F"], 
                    "AND", 
                    ["item","noneof","@NONE@"]];

                    if (date) {
                        filters.push("AND");
                        filters.push(["trandate", "on", date]);
                    }
                    if (employee) {
                        filters.push("AND");
                        filters.push(["custbody_norwin_employee","anyof",employee]);
                    }

                    if (projectType) {
                        filters.push("AND");
                        filters.push(["custbody_jd_project_type","anyof",projectType]);
                    }              

                    console.log('filters   '+filters);
                    var invoiceSearchObj = search.create({
                        type: "invoice",
                        settings:[{"name":"consolidationtype","value":"ACCTTYPE"}],
                        filters: filters,
                        columns: [
                            search.createColumn({name: "internalid", label: "Internal ID"}),
                            search.createColumn({name: "tranid", label: "Document Number"}),
                            search.createColumn({name: "custbody_jd_project_id", label: "Project Id"}),
                            search.createColumn({
                                name: "entityid",
                                join: "customer",
                                label: "Name"
                            }),
                            search.createColumn({name: "internalid", label: "Internal ID"}),
                            search.createColumn({name: "custbody_jd_project_title", label: "JD PROJECT TITLE"}),
                            search.createColumn({name: "item", label: "Item"}),
                            search.createColumn({name: "quantity", label: "Quantity"}),
                            search.createColumn({name: "amount", label: "Amount"}),
                            search.createColumn({name: "custbody_norwin_inv_duration_startdate", label: "Invoice Duration Start Date"}),
                            search.createColumn({name: "custbody_norwin_inv_duration_enddate", label: "Invoice Duration End Date"}),
                            search.createColumn({name: "rate", label: "Item Rate"}),
                            search.createColumn({
                                name: "formulatext",
                                formula: "CASE WHEN {custbody_jd_purchase_order} = '' THEN {otherrefnum} ELSE {custbody_jd_purchase_order} END",
                                label: "Formula (Text)"
                            })
                        ]
                    });
        
                    var searchResultCount = invoiceSearchObj.runPaged().count;
                    console.log("invoiceSearchObj result count", searchResultCount);
                    var result = invoiceSearchObj.run().getRange(0, 999);
                    for(var i=0; i<result.length; i++){
                        var invoiceIntID = result[i].getValue('internalid');
                        // var invoiceID = result[i].getValue('tranid');
                        // var projectName = result[i].getValue({name: "entityid",join: "customer"});
                        var projectTitle = result[i].getValue('custbody_jd_project_title');
                        var projectId =result[i].getValue('custbody_jd_project_id');
                        var item =result[i].getValue('item');
                        var quantity =result[i].getValue('quantity');
                        var rate = result[i].getValue('rate');
                        var amount = result[i].getValue('amount');
                        var startDate = result[i].getValue('custbody_norwin_inv_duration_startdate');
                        var endDate = result[i].getValue('custbody_norwin_inv_duration_enddate');
                        var poNumber = result[i].getValue('formulatext');
                        
                        currentRec.selectNewLine({sublistId: "recmachcustrecord_norwin_group_invoice_id"});
                        // currentRec.setCurrentSublistValue({ sublistId: 'recmachcustrecord_norwin_group_invoice_id', fieldId: 'custrecord_norwin_grp_invoice_int_id',value: invoiceIntID });
                        currentRec.setCurrentSublistValue({ sublistId: 'recmachcustrecord_norwin_group_invoice_id', fieldId: 'custrecord_norwin_grp_invoice_child_id',value: invoiceIntID });
                        currentRec.setCurrentSublistValue({ sublistId: 'recmachcustrecord_norwin_group_invoice_id', fieldId: 'custrecord_norwin_grp_invoice_ch_prjname',value: projectId });
                        currentRec.setCurrentSublistValue({ sublistId: 'recmachcustrecord_norwin_group_invoice_id', fieldId: 'custrecord_norwin_grp_invoice_prjtitle',value: projectTitle });
                        currentRec.setCurrentSublistValue({ sublistId: 'recmachcustrecord_norwin_group_invoice_id', fieldId: 'custrecord_norwin_grp_invoice_item',value: item });
                        currentRec.setCurrentSublistValue({ sublistId: 'recmachcustrecord_norwin_group_invoice_id', fieldId: 'custrecord_norwin_grp_invoice_ch_qty',value: quantity });
                        currentRec.setCurrentSublistValue({ sublistId: 'recmachcustrecord_norwin_group_invoice_id', fieldId: 'custrecord_norwin_grp_invoice_ch_rate',value: rate });
                        currentRec.setCurrentSublistValue({ sublistId: 'recmachcustrecord_norwin_group_invoice_id', fieldId: 'custrecord_norwin_grp_invoice_ch_amount',value: amount });
                        currentRec.setCurrentSublistText({ sublistId: 'recmachcustrecord_norwin_group_invoice_id', fieldId: 'custrecord_norwin_grp_invoice_ch_sdate',text: startDate });
                        currentRec.setCurrentSublistText({ sublistId: 'recmachcustrecord_norwin_group_invoice_id', fieldId: 'custrecord_norwin_grp_invoice_ch_edate',text: endDate });
                        currentRec.setCurrentSublistText({ sublistId: 'recmachcustrecord_norwin_group_invoice_id', fieldId: 'custrecord_norwin_grp_invoice_ch_po_num',text: poNumber });
                        currentRec.commitLine({sublistId: "recmachcustrecord_norwin_group_invoice_id"});
                

                    };
                } catch (error) {
                    console.log(error);
                }
            } else {
                alert("Please Enter value for Customer");
            }
        }

        var isProcessing = false;

        function fieldChanged(scriptContext) {
            try {
                var currentRec = scriptContext.currentRecord;

                if (scriptContext.fieldId == 'custrecord_norwin_grp_invoice_customer') {
                    var customer = currentRec.getValue({
                        fieldId: 'custrecord_norwin_grp_invoice_customer',
                    });                
                    showRelatedEmployees(scriptContext,customer);
                    
                }

                if (scriptContext.fieldId == 'custrecord_norwin_grp_invoice_checkbox' && !isProcessing) {
                    isProcessing = true;

                    var line = currentRec.getCurrentSublistIndex({
                        sublistId: 'recmachcustrecord_norwin_group_invoice_id'
                    });

                    var checkBoxValue = currentRec.getCurrentSublistValue({
                        sublistId: 'recmachcustrecord_norwin_group_invoice_id',
                        fieldId: 'custrecord_norwin_grp_invoice_checkbox',
                    });

                    var invoiceLines = currentRec.getLineCount({ sublistId: 'recmachcustrecord_norwin_group_invoice_id' });
                    var currentInvoiceId = currentRec.getCurrentSublistValue({
                        sublistId: 'recmachcustrecord_norwin_group_invoice_id',
                        fieldId: 'custrecord_norwin_grp_invoice_child_id',
                    });
                    console.log('invoiceLines: ' + invoiceLines + ' line: ' + line);
                    for (var i = 0; i < invoiceLines; i++) {
                        currentRec.selectLine({
                            sublistId: 'recmachcustrecord_norwin_group_invoice_id',
                            line: i
                        });
                        if (i != line) {                            
                            var otherLineInvId = currentRec.getSublistValue({
                                sublistId: 'recmachcustrecord_norwin_group_invoice_id',
                                fieldId: 'custrecord_norwin_grp_invoice_child_id',
                                line: i
                            });
                            if (otherLineInvId == currentInvoiceId) {
                                currentRec.setCurrentSublistValue({
                                    sublistId: 'recmachcustrecord_norwin_group_invoice_id',
                                    fieldId: 'custrecord_norwin_grp_invoice_checkbox',
                                    value: checkBoxValue,
                                });
                                currentRec.commitLine({sublistId: "recmachcustrecord_norwin_group_invoice_id"});
                            }
                        } else{
                            currentRec.setCurrentSublistValue({
                                sublistId: 'recmachcustrecord_norwin_group_invoice_id',
                                fieldId: 'custrecord_norwin_grp_invoice_checkbox',
                                value: checkBoxValue,
                            });
                            currentRec.commitLine({sublistId: "recmachcustrecord_norwin_group_invoice_id"});
                        }
                    }
                    isProcessing = false;
                }
            } catch (error) {
                alert(error);
                isProcessing = false; // Reset the flag if an error occurs
            }
        }

        function showRelatedEmployees(scriptContext, customer){
            var currScript = runtime.getCurrentScript();
            var currentRec = scriptContext.currentRecord;
            if (customer) {
                var searchId =currScript.getParameter({ name: 'custscript_norwin_grp_inv_cs_svdsearchid' });
                var accountId = (runtime.accountId).replace('_','-');            
                var url = 'https://'+accountId+'.app.netsuite.com/app/common/search/searchresults.nl?searchtype=Transaction&CUSTBODY_JD_NORWIN_CUSTOMER='+customer+'&style=NORMAL&report=&grid=&searchid='+searchId+'&sortcol=cfBODY_1809_raw&sortdir=ASC&csv=HTML&OfficeXML=F&pdf=&size=50&_csrf=749k_rK6gG-bmWlvYhpFaNvBuOIQewr4TH3SJN02UxVHzsbXGf9bT-Pw-SjgjV68Eh3NsIgbFw3rmBzTfA6hY-8eOT8zyTs5g60Zc1xoPYr-fjYk8Mpa0SgSqf6hAMPbg8Se2ZS_bQiRfz7RfGOaKTjmxhSulb_-qa0prBJGTkA%3D&twbx=F'
                var htmlField = '<a href="' + url + '" target="_blank">Check Available Employees</a>';
                currentRec.setValue({
                    fieldId: 'custrecord_norwin_grp_invoice_svdsearch',
                    value: htmlField
                });
            } else {
                currentRec.setValue({
                    fieldId: 'custrecord_norwin_grp_invoice_svdsearch',
                    value: ''
                });
            }
             //https://8188550_SB2.app.netsuite.com/app/common/search/searchresults.nl?searchtype=Transaction&CUSTBODY_JD_NORWIN_CUSTOMER=108239&style=NORMAL&report=&grid=&searchid=1304&sortcol=cfBODY_1809_raw&sortdir=ASC&csv=HTML&OfficeXML=F&pdf=&size=50&_csrf=749k_rK6gG-bmWlvYhpFaNvBuOIQewr4TH3SJN02UxVHzsbXGf9bT-Pw-SjgjV68Eh3NsIgbFw3rmBzTfA6hY-8eOT8zyTs5g60Zc1xoPYr-fjYk8Mpa0SgSqf6hAMPbg8Se2ZS_bQiRfz7RfGOaKTjmxhSulb_-qa0prBJGTkA%3D&twbx=F        }
        }

        function saveRecord(scriptContext) {
            var currRec = scriptContext.currentRecord;
            var invoiceLines = currRec.getLineCount({ sublistId: 'recmachcustrecord_norwin_group_invoice_id' });        
            var selectedLinesSet = new Set();
        
            for (var i = invoiceLines - 1; i >= 0; i--) {
                var isGrpInvoice = currRec.getSublistValue({
                    sublistId: 'recmachcustrecord_norwin_group_invoice_id',
                    fieldId: 'custrecord_norwin_grp_invoice_checkbox',
                    line: i
                });
                if (isGrpInvoice) {
                    selectedLinesSet.add(i);
                }
            }    

            if (selectedLinesSet.size === 0) {
                alert('Please add at least one invoice line');
                return false;
            }

            for (var i = invoiceLines - 1; i >= 0; i--) {
                if (!selectedLinesSet.has(i)) {
                    currRec.removeLine({ sublistId: 'recmachcustrecord_norwin_group_invoice_id', line: i, ignoreRecalc: true });
                }
            }        
            return true;
        }        

        function showLoader() {
            var css = 'body.modal-open { overflow: hidden !important; } .custom-overlay { position: fixed; top: 0; right: 0; bottom: 0; left: 0; z-index: 1000; display: none; opacity: 0; background: rgba(0, 0, 0, 0.1); transition: opacity 500ms; } .custom-overlay.show { display: block; opacity: 1; } .modal {width: 300px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); padding: 20px; border-radius: 1px; background: white; text-align: center;}.spinner {width: 60px;height: 60px;border-radius: 50%;display: inline-block;border-top: 4px solid #053f5c;border-right: 4px solid transparent; box-sizing: border-box;animation: rotation 1s linear infinite;margin: 0 auto;}.spinner::after {content:""; box-sizing: border-box;position: absolute;left: 0;top: 0;width: 60px;height: 60px;border-radius: 50%;border-left: 4px solid #FF3D00;border-bottom: 4px solid transparent;animation: rotation 0.5s linear infinite reverse;}.step { width: 100%; margin-top: 30px; margin-bottom: 15px; text-transform: capitalize; text-align: center; font-size: 18px; color: rgba(0, 0, 0, 0.8);}@keyframes rotation {0% {transform: rotate(0deg);}100% {transform: rotate(360deg);}}';
            // var css = '.custom-overlay.show { display: block; opacity: 1; } .spinner { width: 70px; height: 70px; border-radius: 50%; display: inline-block; border-top: 6px solid #3498db; border-right: 6px solid transparent; animation: rotation 1s linear infinite; margin: 0 auto; } .spinner::after { content: ""; position: absolute; width: 70px; height: 70px; border-radius: 50%; border-left: 6px solid #e74c3c; border-bottom: 6px solid transparent; animation: rotation 0.75s linear infinite reverse; } @keyframes rotation { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
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
            step.innerHTML = '<b>Searching For Result</b>';

            modal.appendChild(step);
            overlay.appendChild(modal);

            var body = document.getElementsByTagName('body')[0];
            body.appendChild(overlay);

            body.classList.add('modal-open');
            overlay.classList.add('show');
        }

        function hideLoader() {
            document.querySelector("body > div.custom-overlay.show").remove();
        }

        function markAll(flag){
            console.log('markAll: ');
            var currRec = currentRecord.get();
            var invoiceLines = currRec.getLineCount({ sublistId: 'recmachcustrecord_norwin_group_invoice_id' }); 
            console.log('markAll invoice line: '+invoiceLines);
            var checkBoxValue = true;
            if(flag=='false'){
                checkBoxValue = false;
            }
            for (var i = 0; i < invoiceLines; i++) {
                currRec.selectLine({
                    sublistId: 'recmachcustrecord_norwin_group_invoice_id',
                    line: i
                });
                var currentInvoiceId = currRec.getCurrentSublistValue({
                    sublistId: 'recmachcustrecord_norwin_group_invoice_id',
                    fieldId: 'custrecord_norwin_grp_invoice_child_id',
                });
                if(currentInvoiceId){
                    currRec.setCurrentSublistValue({
                        sublistId: 'recmachcustrecord_norwin_group_invoice_id',
                        fieldId: 'custrecord_norwin_grp_invoice_checkbox',
                        value: checkBoxValue,
                    });
                }                
            }
        }        

        return {
            pageInit: pageInit,
            fieldChanged:fieldChanged,
            saveRecord: saveRecord,
            markAll: markAll,
        };
    });
