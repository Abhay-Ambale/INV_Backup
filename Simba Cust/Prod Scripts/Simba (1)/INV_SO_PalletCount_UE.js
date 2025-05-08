/**
 * Company - Invitra Technologies Pvt.Ltd
 * Applies to - Sales Order
 * Script Description -  script to calculate the number of carton, carton volume, total volume on line level. 
 * calculate and set total volumne on body field.
 * 
 * 
 * Version    Date            Author           	  Remarks
 * 1.00      18 May 2023     Chetan Sable	  Initial Development //commented
 * 1.1       17 Aug 2023     Chetan Sable     new function for pallet qty.
 ***********************************************************************/
/** 
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
*/
define([], function () {

    function beforeSubmitTotalNoOfPallet(context) {
        try {
            if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
                var totalNoOfPallet = 0;
                var newRec = context.newRecord;
                var soId = newRec.id;
                var linCount = newRec.getLineCount('item');
                log.debug('Start soId', soId);

                for (var i = 0; i < linCount; i++) {
                    var qty = newRec.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });
                    var palletQty = newRec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_inv_pallet_qty', line: i });

                    if (_dataValidation(palletQty)) {
                        var totalPallet = (qty / palletQty).toFixed(4);
                        log.debug('totalPallet', totalPallet);

                        newRec.setSublistValue({ sublistId: 'item', fieldId: 'custcol_inv_total_pallet', line: i, value: Number(totalPallet) });
                        totalNoOfPallet = Number(totalNoOfPallet) + Number(totalPallet);
                    }

                }
                log.debug('totalNoOfPallet', totalNoOfPallet);
                log.debug('totalNoOfPalletType', typeof totalNoOfPallet);


                if (totalNoOfPallet) {
                    newRec.setValue('custbody_inv_estimated_no_of_pallets', Math.ceil(totalNoOfPallet));
                }
            }
        }
        catch (e) {
            log.error('Error', e.message);
        }
    }

    /*    function beforeSubmitCartoonVolume(context) {
            if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
                var totalVolume = 0;
                var palletVolume = 2.16;
                var newRec = context.newRecord;
                var linCount = newRec.getLineCount('item');
    
                for (var i = 0; i < linCount; i++) {
    
                    var qty = newRec.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });
                    var outerQty = newRec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_inv_outer_qty', line: i });
                    var cartonLength = newRec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_inv_carton_length', line: i });
                    var cartonHeight = newRec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_inv_carton_height', line: i });
                    var cartonWidth = newRec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_inv_carton_width', line: i });
    
                    //calculate carton volume.
                    var cartonVolume = (cartonLength * cartonHeight * cartonWidth) / 1000000;              
    
                    if (_dataValidation(outerQty)) {
                        //calculate and set number of Carton and round up the value
                        newRec.setSublistValue({ sublistId: 'item', fieldId: 'custcol_inv_no_of_cartons', line: i, value: Math.ceil(qty / outerQty) });
    
                        if (_dataValidation(cartonVolume)) {
    
                            //calculate and set total volume
                            newRec.setSublistValue({ sublistId: 'item', fieldId: 'custcol_inv_total_volume', line: i, value: (cartonVolume * Math.ceil(qty / outerQty)).toFixed(5) });
    
                            //set the carton volume
                            newRec.setSublistValue({ sublistId: 'item', fieldId: 'custcol_inv_carton_volume', line: i, value: cartonVolume.toFixed(5) });
                        }
                    }
    
                    totalVolume += newRec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_inv_total_volume', line: i });
                }
                //set total order volume.
                newRec.setValue('custbody_inv_total_volume_of_order', totalVolume.toFixed(5));
    
                newRec.setValue('custbody_inv_estimated_no_of_pallets', Math.ceil(totalVolume / palletVolume));
            }
        }
    */

    function _dataValidation(value) {
        if (value != 'null' && value != null && value != '' && value != undefined && value != 'undefined' && value != 'NaN' && value != NaN && value != 0 && value != '0') {
            return true;
        }
        return false;
    }
    return {
        // beforeSubmit: beforeSubmitCartoonVolume
        beforeSubmit: beforeSubmitTotalNoOfPallet
    }
});