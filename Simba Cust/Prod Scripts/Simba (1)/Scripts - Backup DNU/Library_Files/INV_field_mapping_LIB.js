/**
 * Module Description
 *
 * Version    Date              Author         Remarks
 * 1.00       4 April 2018     Supriya	   		This field is used to save common field mapping between two records.
 *
 *
 */
//*************START : FIELD MAPPING**************//

//*************Start Field Mapping for Vendor Bill Credit creation from Cheque **************//
	var CheckToBillCreditBFObj = {};  // Object for body fields
		CheckToBillCreditBFObj.entity			= "entity";
		CheckToBillCreditBFObj.subsidiary		= "subsidiary";
		CheckToBillCreditBFObj.currency			= "currency";
		CheckToBillCreditBFObj.exchangerate		= "exchangerate";
				
	var CheckToBillCreditLFObj = {};  // Object for line level fields		
		CheckToBillCreditLFObj.account			= "account";		
		CheckToBillCreditLFObj.amount			= "amount";
		CheckToBillCreditLFObj.memo				= "memo";
		CheckToBillCreditLFObj.taxcode			= "taxcode";
		CheckToBillCreditLFObj.tax1amt			= "tax1amt";		
		CheckToBillCreditLFObj.department		= "department";
		CheckToBillCreditLFObj.class			= "class";
		CheckToBillCreditLFObj.location			= "location";		

//************* End Field Mapping for Vendor Bill Credit creation from Cheque **************//


//*************Start Field Mapping for Transfer Order creation from Work Order **************//						
	var WoToTransferOrderLFObj = {};  // Object for line level fields		
		WoToTransferOrderLFObj.item				= "item";		
		WoToTransferOrderLFObj.quantity			= "quantity";
//************* End Field Mapping for Vendor Bill Credit creation from Cheque **************//

//*************Start Field Mapping for Corresponding Purchase Order creation from I/C Magnum Purchase Order **************//		
	var MagnumPoToCorresPoLFObj = {};  // Object for line level fields		
		MagnumPoToCorresPoLFObj.item				= "item";
		MagnumPoToCorresPoLFObj.quantity			= "quantity";
		MagnumPoToCorresPoLFObj.expectedreceiptdate	= "expectedreceiptdate";
		MagnumPoToCorresPoLFObj.custcol_os_delivery_request_date 	= "custcol_os_delivery_request_date";
		MagnumPoToCorresPoLFObj.custcol_inv_actual_supplier_rate	= "rate";
		//MagnumPoToCorresPoLFObj.taxcode				= "taxcode";		
//************* End Field Mapping for Vendor Bill Credit creation from Cheque **************//

//*************END : FIELD MAPPING**************//