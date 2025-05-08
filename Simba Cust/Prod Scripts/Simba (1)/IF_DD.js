function process( type ) {
	nlapiLogExecution( 'debug',  'process', 'START');
	
	var filters		= [];
	var columns		= [];
	var context 	= nlapiGetContext();
	var myGovernanceThreshold = 50;	
	 
	//filters.push(new nlobjSearchFilter('isinactive', null, 'is', false));
	//filters.push(new nlobjSearchFilter('internalidnumber', null, 'greaterthan', "490"));
	filters.push(new nlobjSearchFilter('mainline', 'custrecord_inv_if', 'is', 'T'));
	filters.push(new nlobjSearchFilter('custbody_inv_be_actual_delivery_date', 'custrecord_inv_if', 'isempty', ''));	

	columns.push(new nlobjSearchColumn('internalid'));
	columns.push(new nlobjSearchColumn('custrecord_inv_if'));
	columns.push(new nlobjSearchColumn('custrecord_inv_if_track'));
	columns.push(new nlobjSearchColumn('custrecord_inv_if_dd'));

	var srchResults = nlapiSearchRecord('customrecord_inv_if_dd', null, filters, columns);
	nlapiLogExecution('debug', 'srchResults length', srchResults.length);
					
	if((srchResults) && srchResults.length > 0)
	{
		for(var i=0; i<srchResults.length; i++)
		{						
			var id 			= srchResults[i].getValue('internalid');
			var ifid 		= srchResults[i].getValue('custrecord_inv_if');
			var connote 	= srchResults[i].getValue('custrecord_inv_if_track');
			var dd 			= srchResults[i].getValue('custrecord_inv_if_dd');
			
			nlapiLogExecution('debug', 'cr id '+id, 'ifid '+ifid);
			
			nlapiSubmitField('itemfulfillment', ifid, 'custbody_inv_be_actual_delivery_date', dd);
			
			
			if (context.getRemainingUsage() < myGovernanceThreshold) {
				nlapiLogExecution('debug', 'context.getRemainingUsage() before Yield Script', context.getRemainingUsage());
                nlapiYieldScript();
            } 
		}
	}

	nlapiLogExecution('debug', 'i ', i);
	nlapiLogExecution( 'debug',  'process', 'ENDS');
}