/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 ********************************************************************************************
 * Company:		Invitra Technologies Pvt.Ltd
 * Author:	    Prathmesh Bonte
 * FileName:    norwin_create_check_payment_sl.js
 * Deployed:    
 * 
 * Module Description :
 * This is a backend suitelet used to create check payments.
 * Triggeres on sumbit of 'Norwin Pay Contractor Bills - SL' script
 * 
 * Version    Date            Author           	  Remarks
 * 1.00     31-07-2024     Prathmesh Bonte	   Initial Version
 *
 ********************************************************************************************/
define(['N/record','N/email','N/runtime','./norwin_common_library.js'],(record, email, runtime) => {
    var authorId;
    var recepientId;
    const onRequest = (scriptContext) => {
        authorId = runtime.getCurrentScript().getParameter('custscript_norwin_authorid');
        recepientId = runtime.getCurrentScript().getParameter('custscript_norwin_recepient_id');
        log.debug("authorId ",authorId);
        log.debug("recepientId ",recepientId);
        if (scriptContext.request.method == "GET") {
            try {
                log.debug("request ", scriptContext.request.parameters.parameterString);
                var jsonData = JSON.parse(scriptContext.request.parameters.parameterString);
                try {
                    var trnxResponse = createCheckPayment(jsonData);
                    log.debug("trnxResponse  ",trnxResponse);
                    var responseObj = {};
                    if (trnxResponse.result == 'trnxSuccess') {
                        responseObj = {'result':'trnxSuccess', data:trnxResponse.data};
                    } else if (trnxResponse.result == 'trnxFailed') {
                        responseObj = {'result':'trnxFailed', data:trnxResponse.data};
                    } else if (trnxResponse.result == 'trnxIncomplete') {
                        responseObj = {'result':'trnxIncomplete', data:trnxResponse.data};
                    }
                    scriptContext.response.write({output: JSON.stringify(responseObj),contentType: 'APPLICATION_JSON'});
                } catch (error) {
                    responseObj = {'result':'Failed', data:''};
                    scriptContext.response.write({output: JSON.stringify(responseObj),contentType: 'APPLICATION_JSON'});
                }
            } catch (error) {
                log.debug("error ",error);
            }
        }
    };


    function createCheckPayment(billRecordArr) {
        try {
            var newCheckRecId = [];
            var errorBillRecArr = [];

            for(var billIndex = 0; billIndex < billRecordArr.length; billIndex++) {
                try {
                    var newTrnx = {};
                    var billId = billRecordArr[billIndex].billId;
                    var billPayment = billRecordArr[billIndex].payment;
                    var billEntity = billRecordArr[billIndex].entity;
                    var billCurrency = billRecordArr[billIndex].currency;
                    var customFormId = CUSTOM_FORM_ID_CHECK;
                    var accountId = ACCOUNT_CONTRACTOR_PAYABLES;
                    // create check record
                    var checkRecObj = record.create({type:'check'});
                    checkRecObj.setValue({fieldId:'customform', value:customFormId});
                    checkRecObj.setValue({fieldId:'custbody_norwin_contractor_bill', value: Number(billId)});
                    checkRecObj.setValue({fieldId:'entity', value: Number(billEntity)});
                    checkRecObj.setValue({fieldId:'currency', value: Number(billCurrency)});
                    checkRecObj.setSublistValue({sublistId: 'expense', fieldId: 'account', value: accountId, line: 0});
                    checkRecObj.setSublistValue({sublistId: 'expense', fieldId: 'amount', value: billPayment, line: 0}); 
                    var newCheckId = checkRecObj.save();
                    newTrnx = {'billId':billId,'newCheckId':newCheckId}; 
                    newCheckRecId.push(newTrnx);   
                } catch (error) {
                    var errorObj = {'billId':billId, 'error': error.message};
                    errorBillRecArr.push(errorObj);
                    log.error("error while creating check record ", error);
                }
            }

            log.debug("newCheckRecId ",newCheckRecId);
            log.debug("errorBillRecArr ",errorBillRecArr);
            log.debug("newCheckRecIdLen ",newCheckRecId.length);
            log.debug("errorBillRecArrLen ",errorBillRecArr.length);

            if (errorBillRecArr.length > 0 && newCheckRecId.length > 0) {
                log.debug("transaction partially processed");
                logerror(errorBillRecArr);
                return {'result':'trnxIncomplete', 'data':errorBillRecArr};
            } else if(errorBillRecArr.length > 0 && newCheckRecId.length <= 0) {
                log.debug("transaction failed");
                logerror(errorBillRecArr);
                return {'result':'trnxFailed', 'data':errorBillRecArr};
            } else if (errorBillRecArr.length <= 0 && newCheckRecId.length > 0) {
                log.debug("transaction success");
                return {'result':'trnxSuccess', 'data':newCheckRecId};
            }
        } catch (error) {
            log.error("error in createCheckPayments ",error);
        }
    }


    function logerror(error) {
        try {
            var subject = "Contractor Bills Transaction Error";
            var body = "<b>The following list of errors occurred while processing bill trasaction : </b><br><br>";
            body += "<table border='1' cellpadding='5' cellspacing='0' style='border-collapse: collapse; width: 100%;'>";
            body += "<thead><tr><th>Contractor Bill Id</th><th>Error Message</th></tr></thead>";
            body += "<tbody>";
            for (var i = 0; i < error.length; i++) {
                body += "<tr>";
                body += "<td>"+ error[i].billId +"</td>";
                body += "<td>" + error[i].error + "</td>";
                body += "</tr>";
            }
            body += "</tbody>";
            log.debug('body', body);
    
            email.send({
                author: authorId,
                recipients: recepientId,
                subject: subject,
                body: body
            });
            log.debug("email sent successfully");
        } catch (error) {
            log.debug("Email error ",error);
        }
    }

    return {onRequest};
});
