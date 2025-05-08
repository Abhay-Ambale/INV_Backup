/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version    Date            Author          Remarks
 * 2.00     21 Oct 2020		  Prajval		    
 * 
 */
 /**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
*/
var COMM,SEARCH,REC;
define(['./Library_Files/INV_common_functions_LIB.js','N/search','N/record'],INV_CustomerDeposit_CL);

function INV_CustomerDeposit_CL(comm,search,record)
{
	COMM    = comm,
	SEARCH  = search,
	REC     = record;
	return{
		saveRecord:saveRecord,
		postSourcing: postSourcing
	}
}
function saveRecord(context)
{
	var currentRec = context.currentRecord;
	var subsidry   = currentRec.getValue({fieldId:'subsidiary'});
	var acc        = currentRec.getValue({fieldId:'account'});
	if(_validateData(subsidry) && _validateData(acc))
	{
		var recObj = REC.load({type:'account',id:acc});
		var accSubsidry = recObj.getValue({fieldId:'subsidiary'});
		log.debug('accSubsidry','accSubsidry->>'+accSubsidry);
		if(accSubsidry != subsidry)
		{
			alert('Account does not match with transaction subsidiary');
			return false;
		}
	}
	return true;
}

function postSourcing(context) {
	
	var currentRec = context.currentRecord;
	var fieldId = context.fieldId;
	if(fieldId == 'customer' || fieldId == 'paymentmethod')
	{
		var payMthod = currentRec.getValue({fieldId:'paymentmethod'});
		log.debug('payMthod','payMthod->>'+payMthod);
		var customer = currentRec.getValue({fieldId:'customer'});
		var acc = currentRec.getField({fieldId:'account'});
		
		if(_validateData(customer) && payMthod != PAYMENT_METHOD_CASH)
		{
			var sbsidry = currentRec.getValue({fieldId:'subsidiary'});
			log.debug('sbsidry','sbsidry->>'+sbsidry);
			if(_validateData(sbsidry) && sbsidry == SIMBA_RETAIL)
			{
				acc.isDisabled = false;
				currentRec.setValue({fieldId:'account',value: ACC_1045_HSBC_Bank_Trust_203});  
			}
			if(_validateData(sbsidry) && sbsidry == SIMBA_TEXTILE)
			{
				acc.isDisabled = false;
				currentRec.setValue({fieldId:'account',value: ACC_1020_HSBC_Bank_Trust_202});
			}

		}
	}
}