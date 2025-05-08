/**
 * This script is governed by the license agreement located in the script directory.
 * By installing and using this script the end user acknowledges that they have accepted and
 * agree with all terms and conditions contained in the license agreement. All code remains the
 * exclusive property of Klugo Group Ltd and the end user agrees that they will not attempt to
 * copy, distribute, or reverse engineer this script, in whole or in part.
 * 
 * Module Description
 * 
 * Version    Date            		Author            			Remarks
 * 1.00       	28 Nov 2017     Muhammad Zain     	Initial commit for invoice creation
 * 1.01       	29 Nov 2017     Muhammad Zain     	Create invoices on edit mode as well, when status is changed to Shipped.
 * 1.02			2/3/2018		Brad Harris			Change to use script to send different invoice email/PDF templates based on Subsidiary, instead of workflow								
 * 1.03			03/21/2018		Muhammad Zain		Linked email with the customer record
 * 1.04			01/06/2023		Chetan Sable		Invoke setShipMethodFunction() to set shippingMethodValue based on Tracking number.
 * 1.05         13/07/2023      Chetan Sable        Calculate Unit Price with Tax Rate and Set in custom field Unit Price Including GST.
 * 1.06         31/07/2023      Chetan Sable        set SHIPMENT ID with Sales Order tranid, if Customer is Coles.
 * 1.07         29/08/2023      Chetan Sable        set INTEGRATION STATUS, if both "Auto E-Invoice" and "EDI Customer" Checkbox Checked.
 */


var SHIP_STATUS = {
    Picked: 'A',
    Packed: 'B',
    Shipped: 'C'
};

var isSandbox = nlapiGetContext().getEnvironment() === 'SANDBOX';
var INVOICE_PDF_TEMPLATE = isSandbox ? "143" : "143";


// BH 6/4/2018 - comment out following line
AUTO_INVOICE_WF = (isSandbox) ? '25' : '25';


/////////////////////////////////////////////////////////
//Utility Functions
/////////////////////////////////////////////////////////


/**
 * Add custom buttons to the form
 * 
 * @param {string} type  Edit operation
 */
function createInvoice(type) {
    try {
        var allowedTypes = ['create', 'edit', 'ship'];
        if (allowedTypes.indexOf(type.toString()) == -1) return;

        var oldRecord = nlapiGetOldRecord();
        var record = nlapiGetNewRecord();

        var oldShipstatus = oldRecord && oldRecord.getFieldValue('shipstatus');
        var shipstatus = record.getFieldValue('shipstatus');
        var subsidiaryId = record.getFieldValue('subsidiary');
        var subsidiary = nlapiLookupField('subsidiary', subsidiaryId, ['custrecord_kl_auto_invoice_check']);

        // BH 6/4/2018 - reinstate following line
        //var entityId = record.getFieldValue('entity');

        nlapiLogExecution('DEBUG', 'item_fulfillment_ues:createInvoice', 'oldShipstatus: ' + oldShipstatus + ', shipstatus: ' + shipstatus);

        // if it is disabled on subsidiary, then do not create invoice.
        if (subsidiary.custrecord_kl_auto_invoice_check == 'F') return;

        // if ship status is not changed, then return
        // only execute further if ship status is changed
        if (!!oldShipstatus && oldShipstatus == shipstatus) return;

        // if new ship status is not SHIPPED, then return
        // only execute if it is Shipped.
        if (shipstatus != SHIP_STATUS.Shipped) return;

        var salesorderId = record.getFieldValue('createdfrom');

        // BH 6/4/2018 - put 'custbody_kl_auto_invoice_email' on end of following line
        var salesorder = nlapiLookupField('salesorder', salesorderId, ['entity', 'custbody_kl_auto_invoice_email_check']);
        // var salesorder = nlapiLookupField('salesorder', salesorderId, ['entity','custbody_kl_auto_invoice_email_check', 'custbody_kl_auto_invoice_email']);

        nlapiLogExecution('DEBUG', 'item_fulfillment_ues:createInvoice', 'salesorderId: ' + salesorderId);
        nlapiLogExecution('DEBUG', 'item_fulfillment_ues:createInvoice', 'shipstatus: ' + shipstatus);
        nlapiLogExecution('DEBUG', 'item_fulfillment_ues:createInvoice', 'salesorder: ' + JSON.stringify(salesorder));

        if (salesorder.custbody_kl_auto_invoice_email_check == 'T') {

            var items = {};

            for (var line = 1; line <= record.getLineItemCount('item'); line++) {
                var orderline = record.getLineItemValue('item', 'orderline', line);
                var quantity = record.getLineItemValue('item', 'quantity', line);

                items[orderline] = quantity;
            }
            nlapiLogExecution('DEBUG', 'item_fulfillment_ues:createInvoice', 'items: ' + JSON.stringify(items));

            var invoice = nlapiTransformRecord('salesorder', salesorderId, 'invoice');
            var lines = invoice.getLineItemCount('item');

            //--start--Added by Chetan Sable on 31 July 2023 to set SHIPMENT ID with Sales Order tranid, if Customer is Coles.
            //Updated by Chetan on 29 Aug 2023, get Two more field from customer record ->> auto_e_invoice and edicustomer to set INTEGRATION STATUS-"Ready", if both fields Checked.

            var customerId = nlapiGetFieldValue('entity');
            var integrationStatusValue = invoice.getFieldValue('custbodyintegrationstatus');
            nlapiLogExecution('DEBUG', 'integrationStatusValue', integrationStatusValue);

            if (!integrationStatusValue) {
                var fieldLookUp = nlapiLookupField('customer', customerId, ['parent', 'custentity_inv_auto_e_invoice', 'custentity_inv_edicustomer']);

                //Set INTEGRATION STATUS if both autoInvoice and EDI Customer is True.
                var autoInvoice = fieldLookUp.custentity_inv_auto_e_invoice;
                var ediCustomer = fieldLookUp.custentity_inv_edicustomer;
                nlapiLogExecution('DEBUG', 'autoInvoice || ediCustomer', autoInvoice + "||" + ediCustomer);

                if (autoInvoice == 'T' && ediCustomer == 'T') {
                    nlapiLogExecution('DEBUG', 'setIntegrationStatus', 'setIntegrationStatus');
                    invoice.setFieldValue('custbodyintegrationstatus', 1); //"Ready" : 1
                }
            }

            if (fieldLookUp.parent == 340712) {
                var salesOrderId = nlapiGetFieldValue('createdfrom');
                var fieldLookUpSO = nlapiLookupField('salesorder', salesOrderId, ['tranid']);
                var tranid = fieldLookUpSO.tranid;
                nlapiLogExecution('ERROR', 'tranid', tranid);
                invoice.setFieldValue('custbody_sps_shipmentid', tranid);
            }
            //--end--Added by Chetan Sable on 31 July 2023 to set SHIPMENT ID with Sales Order tranid, if Customer is Coles.



            //---start--- Added by Chetan Sable on 13 July 2023 to calculate custom field Unit Price Including GST.
            for (var i = 1; i <= lines; i++) {
                var rate = invoice.getLineItemValue('item', 'rate', i);
                var tax_rate = invoice.getLineItemValue('item', 'taxrate1', i);
                var rateCalculation = parseFloat(rate) + (parseFloat(rate) * parseFloat(tax_rate) / 100);
                invoice.setLineItemValue('item', 'custcol_inv_unit_price_including_gst', i, rateCalculation.toFixed(2));
            }
            //---End--- Added by Chetan Sable on 13 July 2023 to calculate custom field Unit Price Including GST.

            for (line = lines; line >= 1; line--) {
                var lineId = invoice.getLineItemValue('item', 'orderline', line);

                var backOrdered = invoice.getLineItemValue('item', 'quantityremaining', line); // Line added by Invitra on 12 Nov 18

                // var lineNum = record.findLineItemValue('item', 'orderline', line);
                // var lineId = record.getLineItemValue('item', 'line', line);
                nlapiLogExecution('DEBUG', 'item_fulfillment_ues:createInvoice', 'line: ' + line + ', lineId: ' + lineId);

                // Below code commented by Invitra on 12 Nov 18 : To show the Back Orderd Items on Invoice
                // if (!!items[lineId]) {

                if (!!items[lineId]) {
                    invoice.selectLineItem('item', line);
                    invoice.setCurrentLineItemValue('item', 'quantity', items[lineId]);
                    invoice.commitLineItem('item');
                }
                else if (backOrdered == 0) {
                    invoice.removeLineItem("item", line);
                }
            }

            invoice.setFieldValue('tobeemailed', 'F')


            //---start--- Function setShipMethodFunction() Added by Chetan Sable on 01 June 2023 to set shipping Method based on 'Tracking Number'
            var shipMethod = setShipMethodFunction(invoice);

            if (shipMethod) {
                nlapiLogExecution('DEBUG', 'shipMethod', 'shipMethod ' + shipMethod);
                invoice.setFieldText('shipmethod', shipMethod);
            }
            //---End--- Function setShipMethodFunction() Added by Chetan Sable on 01 June 2023 to set shipping Method based on 'Tracking Number'
            var invoiceId = nlapiSubmitRecord(invoice, true, true);

            // Create different invoice email/PDF templates based on Subsidiary and send
            // BH 6/4/2018 - reinstate following line
            //issueInvoice( 'create', invoiceId, subsidiaryId, salesorder.custbody_kl_auto_invoice_email, entityId );

            // BH 6/4/2018 - recomment following block      
            if (invoiceId) {
                nlapiLogExecution('DEBUG', 'item_fulfillment_ues:createInvoice', 'fire workflow');
                var workFlowId = AUTO_INVOICE_WF;
                nlapiInitiateWorkflow('invoice', invoiceId, workFlowId);
            }
            nlapiLogExecution('DEBUG', 'item_fulfillment_ues:createInvoice', 'invoiceId: ' + invoiceId);
        }
    } catch (exp) {
        nlapiLogExecution('ERROR', 'item_fulfillment_ues:createInvoice', exp.toString());
    }
}



/////////////////////////////////////////////////////////
// Entry Point Functions
/////////////////////////////////////////////////////////

/**
 * Entry point function for after submit event
 *
 * @param type {string} Edit operation
 *
 */
function afterSubmit(type) {
    try {
        nlapiLogExecution('DEBUG', 'item_fulfillment_ues:afterSubmit', 'type: ' + type);

        createInvoice(type);

    } catch (exp) {
        nlapiLogExecution('ERROR', 'item_fulfillment_ues:afterSubmit', exp.toString());
    }
}


//---start--- Function setShipMethodFunction() Definition Added by Chetan Sable on 01 June 2023 to set shipping Method based on 'Tracking Number'
function setShipMethodFunction(recObj) {

    // function BillPaymnet_BS(type) {

    var shippingMethodValue = "";
    var subsidiary = recObj.getFieldValue("subsidiary");
    var trackNo = recObj.getFieldValue("linkedtrackingnumbers");
    nlapiLogExecution("DEBUG", "loadTrackingNum->", "loadTrackingNum " + trackNo);

    if (subsidiary == 7 || subsidiary == 6) {
        nlapiLogExecution("DEBUG", "trackNo->", "trackNo " + trackNo);

        if (trackNo) {
            trackNo = trackNo.toUpperCase();
            var fourChar = trackNo.substring(0, 4);
            var threeChar = trackNo.substring(0, 3);

            if (fourChar == 'SIMW' || fourChar == 'SMBN' || fourChar == 'SMBQ' || fourChar == 'SMBW' || (trackNo == Number(trackNo) && trackNo.length == '8')) {

                if (subsidiary == 7) { // 7 = Simba Textile Mills Pty Ltd(Commercial)
                    shippingMethodValue = 'BEX - Commercial';
                } else if (subsidiary == 6) { // 6 = Simba Retail Pty Ltd
                    shippingMethodValue = 'BEX - Retail';
                }

            } else if (threeChar == 'XFM') {

                if (subsidiary == 7) {
                    shippingMethodValue = 'Xpress - Commercial';
                } else if (subsidiary == 6) {
                    shippingMethodValue = 'Xpress - Retail';
                }

            } else if (fourChar == 'H1FZ') {

                if (subsidiary == 7) {
                    shippingMethodValue = 'Startrack Air- Commercial';
                } else if (subsidiary == 6) {
                    shippingMethodValue = 'Startrack Air- Retail';
                }

            } else if (fourChar == 'DYXZ') {

                if (subsidiary == 7) {
                    shippingMethodValue = 'Startrack Road- Commercial'
                } else if (subsidiary == 6) {
                    shippingMethodValue = 'Startrack Road- Retail';
                }

            } else if (trackNo == Number(trackNo) && trackNo.length >= '4' && trackNo.length <= '6') {

                if (subsidiary == 7) {
                    shippingMethodValue = 'Comet Transport - Commercial';
                } else if (subsidiary == 6) {
                    shippingMethodValue = 'Comet Transport - Retail';
                }
            }
            return shippingMethodValue
        }
    }
}
//---End--- Function setShipMethodFunction() Definition Added by Chetan Sable on 01 June 2023 to set shipping Method based on 'Tracking Number'