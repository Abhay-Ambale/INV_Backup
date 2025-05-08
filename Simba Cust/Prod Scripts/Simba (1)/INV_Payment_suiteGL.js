/**
 * Module Description
 *
 * Version    Date            Author           Remarks
 * 1.00       19 Nov 2020     Prajval		This Plug-in is used to add the two custom GL lines in Payment Record if 4060 Discounts account amount is on debit
 *
 */
 function customizeGlImpact(transactionRecord, standardLines, customLines, book)
 {
	var context 		= nlapiGetContext();
	var exeCtx 			= context.getExecutionContext();
	nlapiLogExecution('debug','exeCtx ===>>','exeCtx==>'+exeCtx);
	if(exeCtx == 'customgllines')
	{
		try{
			var id		 = transactionRecord.getId();
			var customer = transactionRecord.getFieldValue('customer');								
			var lineCnt = standardLines.getCount();
			nlapiLogExecution('debug','lineCnt ===>>','lineCnt ===>>'+lineCnt);
			
			if(_validateData(lineCnt))
			{
				for(var i=0;i<lineCnt;i++)
				{
					var acc = standardLines.getLine(i).getAccountId();
					nlapiLogExecution('debug','acc ===>>','acc ===>>'+acc);
					
					var debit = standardLines.getLine(i).getDebitAmount();
					nlapiLogExecution('debug','debit ===>>','debit ===>>'+debit);
					
					var credit = standardLines.getLine(i).getCreditAmount();
					nlapiLogExecution('debug','credit ===>>','credit ===>>'+credit);
					
					if(_validateData(acc) && acc == ACC_4060_DISCOUNTS)
					{
						if(_validateData(debit))
						{
							var amt = 	(debit*10/110).toFixed(2);
							nlapiLogExecution('debug','amt ===>>','amt ===>>'+amt);
							
							// New Lines : Debit
							var newLine 	= customLines.addNewLine();
							newLine.setAccountId(Number(ACC_2320_GST_COLLECTED));
							newLine.setDebitAmount(Number(amt));
							if(_validateData(customer))newLine.setEntityId(Number(customer));
							
							// New Lines : Credit
							newLine 	= customLines.addNewLine();
							newLine.setAccountId(Number(ACC_2630_ACCRUED_REBATES));
							newLine.setCreditAmount(Number(amt));
							if(_validateData(customer))newLine.setEntityId(Number(customer));
						}
					}
				}
				
			}	
		}
		catch(e){
			nlapiLogExecution('ERROR','Error in function customizeGlImpact :','Details: ' + e);
		}		
	}		
 }