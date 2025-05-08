/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version  Date            Author          Remarks
 * 1.00     4 Apr 2018		Supriya G		For Intercompny SO, Disable Auto Email, Enable Auto I/C IR
 * 
 */

// For Intercompny SO, Disable Auto Email, Enable Auto I/C IR
function SalesOrder_PI(type){
	
	var intercotrans	= nlapiGetFieldValue('intercotransaction');
	//Added By Prajval on 23 Jul 2019
	var subSid = nlapiGetFieldValue('subsidiary');	
	if((_validateData(subSid)) && (subSid == 20))
	{
		nlapiSetFieldValue('location',165,false,false);
	}//use to set Location based on subsidiary
	if(_validateData(intercotrans) && type == 'edit'){
		nlapiSetFieldValue('custbody_kl_auto_invoice_email_check', 'F');
		//nlapiSetFieldValue('custbody_inv_auto_ic_ir', 'T');
		//nlapiDisableField('custbody_inv_auto_ic_ir', false);
		nlapiDisableField('custbody_kl_auto_invoice_email_check', true);
	}
	else{
		// disable auto_ic_ir checkbox
		//nlapiDisableField('custbody_inv_auto_ic_ir', true);
		nlapiDisableField('custbody_kl_auto_invoice_email_check', false);
	}
	if(type == 'create' || type == 'copy'){
		nlapiSetFieldValue('custbody_inv_finance_hold', 'T');
	}
	
	// Below fuction called by Supriya on 21 Mar 2019
	if(type == 'create'){
		_calShipDaysDeliveryDays();
	}
}

function SalesOrder_PS(type, name){
	if(name == 'entity')
	{
		var unbilledAmt 	= nlapiGetFieldValue('custbody_inv_unbilled_orders_amt');
		var outstandingAmt 	= nlapiGetFieldValue('custbody_inv_outstanding_balance');
		
		var total = Number(unbilledAmt) + Number(outstandingAmt);
		nlapiSetFieldValue('custbody_inv_total_unbilled_outstand', total);
		
		//Added By Prajval on 23 Jul 2019
		var subsidiary = nlapiGetFieldValue('subsidiary');
		if(subsidiary == 20)
		{
			nlapiSetFieldValue('location',165,false,false);
		}//use to set Location based on subsidiary
	}
		
	/* if(type == 'item' && name == 'item'){
		//console.log('type ='+type+', name='+name);
		var locBody 	= nlapiGetFieldValue('location');
		if(_validateData(locBody)){
			var loc = nlapiGetCurrentLineItemValue('item', 'location');			
			if(!_validateData(loc)){
				 nlapiSetCurrentLineItemValue('item', 'location', locBody, false, false);
			}
		}
	} */
	
	if(type == 'item' && name == 'item'){
		var deliveryDt 	= nlapiGetFieldValue('custbody_os_delivereybydate');
		if(_validateData(deliveryDt)){
			nlapiSetCurrentLineItemValue('item', 'custcol_os_delivery_date_to', deliveryDt, false, false);
		}
	}
}

function SalesOrder_FC(type, name){
	if(name == 'shipaddresslist' || name == 'shippingtaxcode')
	{
		var entity 				= nlapiGetFieldValue('entity');
		var shipaddressId 		= nlapiGetFieldValue('shipaddresslist');		
		if(_validateData(shipaddressId) && _validateData(entity)){			
			var addressSearch 	= nlapiSearchRecord("customer",null,
									[
									   ["internalidnumber","equalto",entity]
									], 
									[
									   new nlobjSearchColumn("addressinternalid","Address",null), 
									   new nlobjSearchColumn("custrecord_kl_packing_instructions","Address",null), 
									   new nlobjSearchColumn("custrecord_kl_shipping_instructions","Address",null)
									]
									);
			if(_validateData(addressSearch) && addressSearch.length > 0){
				for(var i=0; i<addressSearch.length; i++){
					var addressId 		= addressSearch[i].getValue("addressinternalid", "Address");
					if(shipaddressId == addressId){
						var packingInst = addressSearch[i].getValue("custrecord_kl_packing_instructions", "Address");
						var shipInst 	= addressSearch[i].getValue("custrecord_kl_shipping_instructions", "Address");
						
						nlapiSetFieldValue('custbody_kl_packing_instructions', packingInst);
						nlapiSetFieldValue('custbody_kl_shipping_instructions', shipInst);
					}
				}			
			}
		}
		else{
			nlapiSetFieldValue('custbody_kl_packing_instructions', '');
			nlapiSetFieldValue('custbody_kl_shipping_instructions', '');	
		}
	}
	
	// Added on 21 Nov 18
	if(type == 'item' && name == 'quantity'){
		var isMultiples	= nlapiGetFieldValue('custbody_inv_order_in_mul_of_pack_qty');
		var itemId		= nlapiGetCurrentLineItemValue('item', 'item');
		var qty			= nlapiGetCurrentLineItemValue('item', 'quantity');
		
		if(isMultiples == 'T' && _validateData(itemId)){
			var itemRec		= nlapiLookupField('item', itemId, ['custitem_os_identification']);
			var packQty 	= itemRec.custitem_os_identification;
				
			if(Number(packQty) > 0){
				var recQty 	= Math.floor(Number(qty)/Number(packQty))*Number(packQty);
				if(recQty != qty)
					alert('Recommended quantity is '+recQty);
			}
		}
	}
	
	// Added by Gunjan on 20 Feb 19
	if((name == 'entity') || (name == 'trandate'))
	{
		var orderId 			= nlapiGetFieldValue('tranid');
		if((orderId == '') || (orderId == 'To Be Generated'))
		{
			_calShipDaysDeliveryDays();
		}
	}// used to set Ship date on customer record
	
	if(name == 'custbody_os_delivereybydate') 
	{
		var deliveryDt 	= nlapiGetFieldValue('custbody_os_delivereybydate');
		if(_validateData(deliveryDt)){
			var lines		= nlapiGetLineItemCount('item');			
			for (var i = 1; i <= lines; i++) {
				nlapiSelectLineItem('item',i);
				nlapiSetCurrentLineItemValue('item', 'custcol_os_delivery_date_to', deliveryDt, true, true);
				nlapiCommitLineItem('item');
			}
		}
	}
}

// Below code added in function by Supriya on 21 Mar 2019
function _calShipDaysDeliveryDays(){
	var transDate		= "";
	var noOfDaysToAdd	= "";
	var varId			= "";
	var rsltDate		= "";
	var transfinalDate  = "";
	var rsltShipDate	= "";
	var rsltDeliveryDate = "";
	var ship			= "";
	var delivery		= "";
	var autocaldate		= "";
	var custFields      = ['custentity_inv_shipdate_add_days','custentity_inv_delivery_bydate_add_days','custentity_inv_auto_cal_delivery_date'];
	
	transDate		    = nlapiGetFieldValue('trandate');
	varId			    = nlapiGetFieldValue('entity');	

	if (_validateData(varId) &&  _validateData(transDate))
	{
		noOfDayToAdd	   =  nlapiLookupField('customer',varId,custFields);
		ship			   =  noOfDayToAdd.custentity_inv_shipdate_add_days;
		delivery		   =  noOfDayToAdd.custentity_inv_delivery_bydate_add_days;	
		//Added by Prajval on 31 Feb 19
		autocaldate        =  noOfDayToAdd.custentity_inv_auto_cal_delivery_date;
		//use to get AUTO CALCULATE DELIVERY DATE field value
		//Added by Prajval on 31 Feb 19
		if(autocaldate == 'T')
		{
			if(_validateData(ship) && ship > 0){
				transfinalDate      =  nlapiStringToDate(transDate);			
				rsltShipDate	    =  CalcDate(transfinalDate,ship);
				nlapiSetFieldValue('shipdate',rsltShipDate);
			}
			else{
				nlapiSetFieldValue('shipdate',transDate);
			}

			if(_validateData(delivery) && delivery > 0){
				if(!_validateData(rsltShipDate)) rsltShipDate = transDate;
				transfinalDate      =  nlapiStringToDate(rsltShipDate);			
				rsltDeliveryDate    =  CalcDate(transfinalDate,delivery);
				nlapiSetFieldValue('custbody_os_delivereybydate',rsltDeliveryDate);
				nlapiSetFieldValue('custbody_os_deliveredby',rsltDeliveryDate);
			}
			else{
				nlapiSetFieldValue('custbody_os_delivereybydate',transDate);
				nlapiSetFieldValue('custbody_os_deliveredby',transDate);
			}
		}//set value of shipDate & deliverydate if only if  AUTO CALCULATE DELIVERY DATE field are check on customer record

		/*if(_validateData(ship) && ship > 0){
			transfinalDate      =  nlapiStringToDate(transDate);			
			rsltShipDate	    =  CalcDate(transfinalDate,ship);
			nlapiSetFieldValue('shipdate',rsltShipDate);
		}

		if(_validateData(delivery) && delivery > 0){
			transfinalDate      =  nlapiStringToDate(transDate);			
			rsltDeliveryDate    =  CalcDate(transfinalDate,delivery);
			nlapiSetFieldValue('custbody_os_delivereybydate',rsltDeliveryDate);
		}*/		
	}
}

function SalesOrder_VL(type)
{
	var itemId		= nlapiGetCurrentLineItemValue('item', 'item');
	var itemtype	= nlapiGetCurrentLineItemValue('item', 'itemtype');
	var woCat		= nlapiGetCurrentLineItemValue('item', 'custcol_inv_wo_cat');
	if(itemtype == 'Assembly' && !_validateData(woCat)){
		alert('Please select Work Order Category');
		return false;
	}
	
	return true;
}

var flag = 'manual'; //added by User
function SalesOrder_Recalc(type)
{
	if (type!='item') return;
    if (flag!='script')
    {
		flag			= 'script'; //added by script
		var line 		= nlapiGetCurrentLineItemIndex('item');
		var itemId		= nlapiGetCurrentLineItemValue('item', 'item');
		var qty			= nlapiGetCurrentLineItemValue('item', 'quantity');
		var rfidItem	= nlapiGetCurrentLineItemValue('item', 'custcol_inv_rfid_item');
		
		//alert('line '+line);
		var preItemId		= '';
		if(line > 1){
			var preItemId	= nlapiGetLineItemValue('item', 'item', Number(line)-1);
		}
		//alert('preItemId '+preItemId);
		
		if(_validateData(rfidItem) && preItemId != rfidItem){		
			nlapiInsertLineItem('item', line);
			nlapiSetCurrentLineItemValue('item','item', rfidItem, false, true);
			nlapiSetCurrentLineItemValue('item','quantity', qty, false, true);
			nlapiSetCurrentLineItemValue('item','rate', 0, false, true);
			nlapiSetCurrentLineItemValue('item','amount', 0, false, true);
			nlapiCommitLineItem('item');
		}
		flag		= 'manual'; //added by User
    }
}

function SalesOrder_SR(){
	var intercostatus 	= nlapiGetFieldValue(intercostatus);
	var orderCat 		= nlapiGetFieldValue('custbody_inv_order_category');
	
	if(_validateData(intercostatus) && !_validateData(orderCat)){
		alert('Order Category is not set on this Customer record.');
		return false;
	}
	
	return true;
}