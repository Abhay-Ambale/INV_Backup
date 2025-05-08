/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version  Date            	Author          Remarks
 * 1.00     23 Aug 2018		Supriya G		This script is used to unset the email field
 * 
 */



function Case_PS(type, name){
	if(name == 'company')
	{
		var company 	= nlapiGetFieldValue('company');
		if(_validateData(company)){		
			nlapiSetFieldValue('email', '');			
		}
	}
}

function Case_FC(type, name){
	if(name == 'custevent_inv_fault_simba' || name == 'custevent_inv_fault_customer' || name == 'custevent_inv_fault_supplier')
	{
		var simba 		= nlapiGetFieldValue('custevent_inv_fault_simba');
		var customer 	= nlapiGetFieldValue('custevent_inv_fault_customer');
		var supplier 	= nlapiGetFieldValue('custevent_inv_fault_supplier');
		
		simba 			= simba.replace('%', '');
		customer 		= customer.replace('%', '');
		supplier 		= supplier.replace('%', '');
		
		var total 	= Number(simba) + Number(customer) + Number(supplier);
		if(_validateData(total)){		
			nlapiSetFieldValue('custevent_inv_fault_total', Number(total));			
		}
	}
}