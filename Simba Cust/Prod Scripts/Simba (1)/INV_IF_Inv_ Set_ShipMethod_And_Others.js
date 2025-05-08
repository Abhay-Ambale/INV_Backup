/**
 * Company - Invitra Technologies Pvt.Ltd
 * Script - 
 * Applies to - Invoice, Item Fulfillment
 * 
 * 
 * This script includes the below functionality
 * 1) This script updates the Shipping Method based on the tracking number's characters and tracking number length.
 * 
 * 
 * Version    Date            Author           	  Remarks
 * 1.00      1 June 2023     Chetan Sable	    Initial Development
 * 1.01     17 July 2023     Chetan Sable       calulate the Rate with Tax Rate % and Set in Custom Field Unit Price Including GST.
 * 1.02     31 July 2023     Chetan Sable       set SHIPMENT ID with Sales Order tranid, if Customer is Coles.
 * 1.03     29 Aug 2023      Chetan Sable       set INTEGRATION STATUS ->> Ready, if "Auto E-Invoice" and "EDI CUSTOMER" Checkbox Checked on Customer.
 * 
 ***********************************************************************/
/** 
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search'], function (record, search) {

    //Use AfterSubmit For Invoice. Did not get the trackingNo on BeforeSubmit.
    function afterSubmit(context) {
        var shippingMethod = '';

        if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
            var recId = context.newRecord.id;
            var recordType = context.newRecord.type;

            if (recordType == 'invoice') {
                var invObj = record.load({ type: record.Type.INVOICE, id: recId });
                var subsidiary = invObj.getValue({ fieldId: 'subsidiary' });
                var locationId = invObj.getValue({ fieldId: 'location' });
                var shipzip = invObj.getValue({ fieldId: 'shipzip' });
                var trackingNo = invObj.getValue('linkedtrackingnumbers');

                // find shipmethod based on tracking number / postcode
                if (subsidiary == 7 || subsidiary == 6) {
                    // find shipmethod based on tracking number
                    shippingMethod = trackingNumberFunction(trackingNo, subsidiary);

                    if (shippingMethod) {
                        log.debug("shippingMethod for Invoice "+recId, shippingMethod);
                        //invObj.setText({ fieldId: 'shipmethod', text: shippingMethod });
                        invObj.setValue({ fieldId: 'shipmethod', value: shippingMethod });
                    }
                    invObj.save();
                }
            }
        }
    }

    function beforeSubmit(context) {
        var shippingMethod = '';

        if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT || context.type == context.UserEventType.SHIP) {

            var newRec = context.newRecord;
            var recordType = context.newRecord.type;
            try {
                if (recordType == 'invoice') {
                    //--start-- calulate the Rate with Tax Rate % and Set in Custom Field Unit Price Including GST.
                    var lineCount = newRec.getLineCount("item");
                    for (var i = 0; i < lineCount; i++) {
                        var rate = newRec.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i });
                        var tax_rate = newRec.getSublistValue({ sublistId: 'item', fieldId: 'taxrate1', line: i });
                        var rateCalculation = rate + ((rate * tax_rate) / 100);
                        log.debug("rateCalculation", rateCalculation);
                        newRec.setSublistValue({ sublistId: 'item', fieldId: 'custcol_inv_unit_price_including_gst', line: i, value: rateCalculation.toFixed(2) });
                    }
                    //--end-- calulate the Rate with Tax Rate % and Set in Custom Field Unit Price Including GST.

                    //--start--Added by Chetan Sable on 31 July 2023 to set SHIPMENT ID with Sales Order tranid, if Customer is Coles.
                    //Updated by Chetan on 29 Aug 2023, get Two more field from customer record ->> auto_e_invoice and edicustomer to set INTEGRATION STATUS-"Ready", if both fields Checked.
                    var integrationStatusValue = newRec.getValue("custbodyintegrationstatus");
                    log.debug("integrationStatusValue",integrationStatusValue);
                  
                    if(!integrationStatusValue) {
                        var fieldLookUp = search.lookupFields({
                            type: search.Type.CUSTOMER,
                            id: newRec.getValue("entity"),
                            columns: ['parent', 'custentity_inv_auto_e_invoice', 'custentity_inv_edicustomer']
                        });

                        //Set INTEGRATION STATUS if both autoInvoice and EDI Customer is True.
                        var autoInvoice = fieldLookUp.custentity_inv_auto_e_invoice;
                        var ediCustomer = fieldLookUp.custentity_inv_edicustomer;
                        log.debug("autoInvoice || ediCustomer", autoInvoice + "||" + ediCustomer);

                        if (autoInvoice && ediCustomer) {
                            newRec.setValue("custbodyintegrationstatus", 1); //"Ready" ->> 1
                        }
                    }
                    //--end--Added by Chetan Sable on 31 July 2023 to set SHIPMENT ID with Sales Order tranid, if Customer is Coles.

                    if (fieldLookUp.parent[0].value == 340712) { //340712 Coles Customer id.
                        var fieldLookUpSO = search.lookupFields({
                            type: search.Type.SALES_ORDER,
                            id: newRec.getValue("createdfrom"),
                            columns: ['tranid']
                        });
                        var shipmentId = fieldLookUpSO.tranid;
                        log.debug("shipmentIdTest", shipmentId);

                        //log.debug("shipmentId", shipmentId);
                        newRec.setValue("custbody_sps_shipmentid", shipmentId);
                        //--end--Added by Chetan Sable on 31 July 2023 to set SHIPMENT ID with Sales Order tranid, if Customer is Coles.
                    }
                }
            } catch (error) {
                log.debug('error calulate rate', error);
            }


            //Before Submit For Item Fulfillment.
            if (recordType == 'itemfulfillment') {
                var itemFulObj = context.newRecord;
                var subsidiary = itemFulObj.getValue({ fieldId: 'subsidiary' });
                var trackingNo = itemFulObj.getSublistValue({ sublistId: 'package', fieldId: 'packagetrackingnumber', line: 0 });
                log.debug('IF trackingNo', trackingNo);
                var shipstatus = itemFulObj.getText('shipstatus');

                if (shipstatus == 'Shipped' && trackingNo) {
                    shippingMethod = trackingNumberFunction(trackingNo, subsidiary);

                    if (shippingMethod) {
                        log.debug("Set shippingMethod for IF", shippingMethod);
                        //itemFulObj.setText({ fieldId: 'shipmethod', text: shippingMethod });
                        itemFulObj.setValue({ fieldId: 'shipmethod', value: shippingMethod });
                    }
                }
            }
        }
    }

    /*
    function trackingNumberFunction(trackNo, subsidiary) {
        var shipMethod = '';

        if (trackNo) {
            trackNo = trackNo.toUpperCase();
            var fourChar = trackNo.substring(0, 4);
            var threeChar = trackNo.substring(0, 3);

            if (fourChar == 'SIMW' || fourChar == 'SMBN' || fourChar == 'SMBQ' || fourChar == 'SMBW' || (trackNo == Number(trackNo) && trackNo.length == '8')) {
                if (subsidiary == 7) {
                    shipMethod = 'BEX - Commercial';
                } else if (subsidiary == 6) {
                    shipMethod = 'BEX - Retail';
                }
            } else if (threeChar == 'XFM' && subsidiary == 7) {
                shipMethod = 'Xpress - Commercial';
            } else if (threeChar == 'XFM' && subsidiary == 6) {
                shipMethod = 'Xpress - Retail';
            } else if (fourChar == 'H1FZ' && subsidiary == 7) {
                shipMethod = 'Startrack Air- Commercial';
            } else if (fourChar == 'H1FZ' && subsidiary == 6) {
                shipMethod = 'Startrack Air- Retail';
            } else if (fourChar == 'DYXZ' && subsidiary == 7) {
                shipMethod = 'Startrack Road- Commercial';
            } else if (fourChar == 'DYXZ' && subsidiary == 6) {
                shipMethod = 'Startrack Road- Retail';
            } else if (trackNo == Number(trackNo) && trackNo.length >= '4' && trackNo.length <= '6') {
                if (subsidiary == 7) {
                    shipMethod = 'Comet Transport - Commercial';
                } else if (subsidiary == 6) {
                    shipMethod = 'Comet Transport - Retail';
                }
            }
        }

        return shipMethod;
    }
    */

    function trackingNumberFunction(trackNo, subsidiary) {
        var shipMethod = '';

        if (trackNo) {
            trackNo = trackNo.toUpperCase();
            var fourChar = trackNo.substring(0, 4);
            var threeChar = trackNo.substring(0, 3);

            if (fourChar == 'SIMW' || fourChar == 'SMBN' || fourChar == 'SMBQ' || fourChar == 'SMBW' || (trackNo == Number(trackNo) && trackNo.length == '8')) {
                if (subsidiary == 7) {
                    shipMethod = 22866; //'BEX - Commercial';
                } else if (subsidiary == 6) {
                    shipMethod = 22867; //'BEX - Retail';
                }
            } else if (threeChar == 'XFM' && subsidiary == 7) {
                shipMethod = 32216; //'Xpress - Commercial';
            } else if (threeChar == 'XFM' && subsidiary == 6) {
                shipMethod = 32215; //'Xpress - Retail';
            } else if (fourChar == 'H1FZ' && subsidiary == 7) {
                shipMethod = 48835; //'Startrack Air- Commercial';
            } else if (fourChar == 'H1FZ' && subsidiary == 6) {
                shipMethod = 48836; //'Startrack Air- Retail';
            } else if (fourChar == 'DYXZ' && subsidiary == 7) {
                shipMethod = 48838; //'Startrack Road- Commercial';
            } else if (fourChar == 'DYXZ' && subsidiary == 6) {
                shipMethod = 48837; //'Startrack Road- Retail';
            } else if (trackNo == Number(trackNo) && trackNo.length >= '4' && trackNo.length <= '6') {
                if (subsidiary == 7) {
                    shipMethod = 42312; //'Comet Transport - Commercial';
                } else if (subsidiary == 6) {
                    shipMethod = 42313; //'Comet Transport - Retail';
                }
            }
        }

        return shipMethod;
    }

    return {
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit,
        trackingNumberFunction: trackingNumberFunction
    };
});
