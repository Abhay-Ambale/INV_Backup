/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version  Date            Author          Remarks
 * 1.00     12 Aug 2020		Prajval			When sales order is created by EDi user defined in script parameter and 'ENABLE ITEM LINE SHIPPING' checkbox is checked then copy the contents of the 'Ship To' field into "Ship To EDI” field and then untick the “Enable Item Line Shipping” field.
 *											
 * 
 */

// This script is developed for EDI users basd on the requirements provided by Andrew
function SalesOrder_BS(type){
	if(type == 'create' || type == 'edit')
	{
		var userId			= nlapiGetUser();		
		var enabItemShip 	= nlapiGetFieldValue('ismultishipto');
		var ediUserIds		= nlapiGetContext().getSetting('SCRIPT', 'custscript_inv_employees_edi');
		ediUserIdArr		= ediUserIds.split(",");
		
		//nlapiLogExecution('DEBUG','userId','userId->>'+userId);
		//nlapiLogExecution('DEBUG','enabItemShip','enabItemShip->>'+enabItemShip);
		//nlapiLogExecution('DEBUG','ediUserIds', ediUserIds);
				
		for(var e=0; e<ediUserIdArr.length; e++)
		{
			if(userId == ediUserIdArr[e] && enabItemShip == 'T')
			{
				//nlapiLogExecution('DEBUG','inside', 'in if');	
				var lineCnt 	= nlapiGetLineItemCount('item');			
				for(var i=1;i<=lineCnt;i++)
				{
					var shipToAdd = nlapiGetLineItemText('item','shipaddress',i);				
					nlapiSetLineItemValue('item','custcol_ship_to_edi',i,shipToAdd);
				}
				nlapiSetFieldValue('ismultishipto','F');
			}
		}
	}
}
