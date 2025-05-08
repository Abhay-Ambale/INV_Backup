/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version  Date            Author          Remarks
 * 1.00     17 Aug 2021		Supriya G		
 *											
 * 
 */
 
function ShipmntHeader_BS(type){
	var currContext		= nlapiGetContext();	
	var plusDays = 0;
	
	if(type == 'create' || type == 'edit'){	
		var wearhouseETA	= nlapiGetFieldValue('custrecord_kl_ship_warehouse_eta');		
		nlapiLogExecution('debug', 'wearhouseETA == ', wearhouseETA);
		
		if(wearhouseETA) {
			var dt 		= nlapiStringToDate(wearhouseETA, 'date');
			var day		= dt.getDay();
			nlapiLogExecution('debug', 'day == ', day);
			
			// day = 0 = Sunday, 1= Monday..... 6= Saturday
			if(day == 0) {
				plusDays = 1;
			}
			if (day == 6){
				plusDays = 2;
			}
			nlapiLogExecution('debug', 'plusDays == ', plusDays);
			
			if(plusDays > 0) {
				var wearhouseETAnew		= nlapiDateToString(nlapiAddDays(nlapiStringToDate(wearhouseETA), plusDays), 'dd/mm/yyyy');
				nlapiLogExecution('debug', 'wearhouseETAnew == ', wearhouseETAnew);
				nlapiSetFieldValue('custrecord_kl_ship_warehouse_eta', wearhouseETAnew);
			}			
		}
	}
}
