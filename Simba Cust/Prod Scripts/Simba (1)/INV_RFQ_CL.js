/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version  Date            Author          Remarks
 * 1.00     25 May 2018		Supriya G		This script is used to calculate duty, fright, clearance & landedCost 
 * 
 */

var RFQ_ACCID	= 566;

function RFQ_FC(type,name,linenum){
	if(type == 'line' && name == 'custcol_inv_rfq_item'){
		nlapiSetCurrentLineItemValue('line','account', RFQ_ACCID);	
		nlapiSetCurrentLineItemValue('line','amount',0.00);
	}
	
	if(name == 'custbody_inv_rfq_customer_currency' || name == 'custbody_inv_rfq_purchase_currency'){		
		var custCurr		= nlapiGetFieldValue('custbody_inv_rfq_customer_currency');
		var purCurr			= nlapiGetFieldValue('custbody_inv_rfq_purchase_currency');
		
		if(_validateData(custCurr) && _validateData(purCurr)){
			var exchangerate	= nlapiExchangeRate(purCurr, custCurr);
			if(_validateData(exchangerate))
				nlapiSetFieldValue('custbody_inv_exchange_rate', exchangerate);
		}
	}
	
	if(type == 'line' && name == 'custcol_inv_rfq_buy_price'){
		var duty			= ''; 
		var fright			= '';
		var clearance		= '';
		var exchangerate	= nlapiGetFieldValue('custbody_inv_exchange_rate');
		var rfq_duty		= nlapiGetFieldValue('custbody_inv_rfq_duty');
		var rfq_fright		= nlapiGetFieldValue('custbody_inv_rfq_freight');
		var rfq_clearance	= nlapiGetFieldValue('custbody_inv_rfq_clearance');				
		var buyPrice		= nlapiGetCurrentLineItemValue(type,'custcol_inv_rfq_buy_price');		
			
		rfq_duty 			= parseInt(rfq_duty);
		rfq_fright 			= parseInt(rfq_fright);
		rfq_clearance 		= parseInt(rfq_clearance);

		if(_validateData(buyPrice)){
			if(_validateData(rfq_duty) && rfq_duty > 0)
				duty		= (Number(buyPrice) * Number(rfq_duty))/100;
			else
				duty		= 0;
			
			if(_validateData(rfq_fright) && rfq_fright > 0)
				fright		= (Number(buyPrice) * Number(rfq_fright))/100;
			else
				fright		= 0;
			
			if(_validateData(rfq_clearance) && rfq_clearance > 0)
				clearance		= (Number(buyPrice) * Number(rfq_clearance))/100;
			else
				clearance	= 0;

			var landedCost	= Number(buyPrice) + Number(duty) + Number(fright) + Number(clearance) ;
			if(_validateData(exchangerate))
				landedCost	= Number(landedCost) * Number(exchangerate);
				//landedCost	= Number(landedCost) / Number(exchangerate);
			
			nlapiSetCurrentLineItemValue('line','custcol_inv_rfq_duty',duty,false,false);
			nlapiSetCurrentLineItemValue('line','custcol_inv_rfq_freight',fright,false,false);
			nlapiSetCurrentLineItemValue('line','custcol_inv_rfq_clearance',clearance,false,false);
			nlapiSetCurrentLineItemValue('line','custcol_inv_rfq_landed_cost',landedCost,false,false);
		}
	} 
}

