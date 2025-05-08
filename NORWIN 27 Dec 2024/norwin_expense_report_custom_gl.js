/**
 * Module Description
 *
 * Version    Date              Author               Remarks
 * 1.00       19 Dec 2024       Abhay		
 *
 */
function customizeGlImpact(transactionRecord, standardLines, customLines, book) {
    var context = nlapiGetContext();
    var exeCtx = context.getExecutionContext();
	
    try {
        if(exeCtx == 'customgllines') {		            
            var recId = transactionRecord.getId();    
            var jdExpId = transactionRecord.getFieldValue('custbody_jd_expense_id');            
            nlapiLogExecution('debug','recId ===>>',recId);
            nlapiLogExecution('debug','jdExpId ===>>',jdExpId);

            if(recId && jdExpId) {                
                var expensereportSearch = nlapiSearchRecord("expensereport",null,
                    [
                       ["type","anyof","ExpRept"], 
                       "AND", 
                       ["internalid","anyof", recId]
                    ], 
                    [
                       new nlobjSearchColumn("account"), 
                       new nlobjSearchColumn("debitamount"), 
                       new nlobjSearchColumn("creditamount"), 
                       new nlobjSearchColumn("posting"), 
                       new nlobjSearchColumn("memo"), 
                       new nlobjSearchColumn("entity"), 
                       new nlobjSearchColumn("subsidiary"), 
                       new nlobjSearchColumn("department"), 
                       new nlobjSearchColumn("location"), 
                       new nlobjSearchColumn("customscript"), 
                       new nlobjSearchColumn("cseg_inv_gr_bz_sg")
                    ]
                    ); 

                if (expensereportSearch ) {
                    for (var i = 0; i < expensereportSearch .length; i++) {
                        var result = expensereportSearch [i];
                        
                        var account = result.getValue("account");
                        var debitAmount = result.getValue("debitamount");
                        var creditAmount = result.getValue("creditamount");
                        var posting = result.getValue("posting");
                        var memo = result.getValue("memo");
                        var entity = result.getValue("entity");
                        var subsidiary = result.getValue("subsidiary");
                        var department = result.getValue("department");
                        var location = result.getValue("location");
                        var customScript = result.getValue("customscript");
                        var customField = result.getValue("cseg_inv_gr_bz_sg");

                        var newGlLine = customLines.addNewLine();
                        newGlLine.setAccountId(Number(account));

                        if(creditAmount && Number(creditAmount)!=0) {
                            newGlLine.setDebitAmount(Number(creditAmount));
                        }
                        if (debitAmount && Number(debitAmount) !=0) {
                            newGlLine.setCreditAmount(Number(debitAmount));
                        } 
                        newGlLine.setMemo(memo);

                        // ERROR: Custom GL Lines Plugin error due to a failed validation of script output: Setting entity on GL line with account of type AcctPay is not allowed for book-specific transactions.
                        // if(entity && entity!=0 && account != 111) {
                        //     newGlLine.setEntityId(Number(entity)); 
                        // }

                        if(department && department!=0){
                            newGlLine.setDepartmentId(Number(department));
                        }

                        if(location && location!=0){
                            newGlLine.setLocationId(Number(location));
                        }      
                                         
                        // nlapiLogExecution('DEBUG', 'Invoice Search Result ' + (i + 1), 
                        //     'Account: ' + account + 
                        //     ', Debit Amount: ' + debitAmount + 
                        //     ', Credit Amount: ' + creditAmount + 
                        //     ', Posting: ' + posting + 
                        //     ', Memo: ' + memo + 
                        //     ', Entity: ' + entity + 
                        //     ', Subsidiary: ' + subsidiary + 
                        //     ', Department: ' + department + 
                        //     ', Location: ' + location + 
                        //     ', Custom Script: ' + customScript + 
                        //     ', Custom Field (cseg_inv_gr_bz_sg): ' + customField);
                    }
                }      
            
            }
        }
    } catch (error) {
        nlapiLogExecution('error','recId===>> '+recId, error);
    }
}
