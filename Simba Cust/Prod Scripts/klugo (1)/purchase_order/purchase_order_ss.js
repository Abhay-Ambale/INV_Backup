/**
 * This script is governed by the license agreement located in the script directory.
 * By installing and using this script the end user acknowledges that they have accepted and
 * agree with all terms and conditions contained in the license agreement. All code remains the
 * exclusive property of Klugo Group Ltd and the end user agrees that they will not attempt to
 * copy, distribute, or reverse engineer this script, in whole or in part.
 **/
/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       06 Jul 2017     Muhammad Zain
 *
 */


/**
 * Updates purchase orders
 * 
 */
function upatePurchaseOrders() {
	
    var recType = 'purchaseorder';
    var searchResults = null;
    var context = nlapiGetContext();
    var myGovernanceThreshold = 50;

    try {
        var filters = [
            ['mainline', 'is', 'T']
        ],
        columns = [
            new nlobjSearchColumn('memo')
        ];
		             
        searchResults = nlapiSearchRecord(recType, null, filters, columns);
		
        for (var pos = 0; searchResults && pos < searchResults.length; pos++) {
            var result = searchResults[pos];
            var id = result.getId();
            var memo = result.getValue('memo');

            var record = nlapiLoadRecord(recType, id);
            nlapiSubmitRecord(record, false, true);

            // nlapiSubmitField(recType, id, 'memo', memo);
            if (context.getRemainingUsage() < myGovernanceThreshold) {
                nlapiYieldScript();
            }    

            var debug = 'updated po: ' + id + ', count: ' + pos;            
            nlapiLogExecution( 'debug', 'purchase_order_ss:upatePurchaseOrders', debug);
        }
		
    } catch (exp) {
        nlapiLogExecution('error', 'purchase_order_ss:upatePurchaseOrders', exp);
    }
}


/**
 * Entry point
 * 
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function process( type ) {
	try{
		
		nlapiLogExecution( 'debug', 'purchase_order_ss:process', 'START');
        upatePurchaseOrders();
		nlapiLogExecution( 'debug', 'purchase_order_ss:process', 'END');
		
	}catch( exp ){
		nlapiLogExecution( 'error', 'purchase_order_ss:process', exp );
	}
}


