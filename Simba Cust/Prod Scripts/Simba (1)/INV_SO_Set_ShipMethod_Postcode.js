/**
 * Company - Invitra Technologies Pvt.Ltd
 * Author - Supriya G
 * Script - 
 * Applies to - Sales Order
 * 
 * 
 * This script includes below functionality
 * 1)  This script updated the Shipping Method based on Location & Postcode defined in custom record 'Shipping Method Postcode'
 * 
 * 
 * 
 * Version    Date            Author           	  Remarks
 * 2.00      31 May 2023     Supriya	        Initial Development
 *
 ***********************************************************************/
/** 
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
*/
define(['N/record', 'N/search'], function (record, search) {


	function beforeSubmit(context) {
		var shippingMethod = '';

		if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
			var recObj = context.newRecord;
			var recId = recObj.id;
			var subsidiary = recObj.getValue({ fieldId: 'subsidiary' });
			var locationId = recObj.getValue({ fieldId: 'location' });
			var shipzip = recObj.getValue({ fieldId: 'shipzip' });

			// subsidiary = 7 = Simba Textile Mills Pty Ltd
			if (subsidiary == 7 && shipzip && locationId) {

				var postCodeSearchObj = search.create({
					type: "customrecord_inv_shipping_method_pc",
					filters:
						[
							["custrecord_inv_shipping_location", "anyof", locationId],
							"AND",
							[["custrecord_inv_shipping_postcode", "is", shipzip], "OR", ["custrecord_inv_shipping_postcode", "isempty", ""]],
							"AND",
							["isinactive","is","F"]
						],
					columns:
						["custrecord_inv_shipping_method", "internalid"]
				});

				log.debug("postCode Search Obj",postCodeSearchObj);

				var searchResultCount = postCodeSearchObj.runPaged().count;
				log.debug("postCodeSearchObj result count", searchResultCount);

				postCodeSearchObj.run().each(function (result) {
					log.debug("result", result);
					shippingMethod = result.getValue('custrecord_inv_shipping_method');
					log.debug("shippingMethod",shippingMethod);
					return false;
				});

				if (shippingMethod) {
					 recObj.setValue({ fieldId: 'shipmethod', value: shippingMethod });
				}
			}
		}
	}
	return {
		beforeSubmit: beforeSubmit
	}
});