function test(){
var soRec = nlapiCreateRecord('salesorder');
soRec.setFieldValue('entity', 42532);
soRec.setFieldValue('otherrefnum', '123');
soRec.setFieldValue('location', 118);

soRec.setFieldValue('intercostatus', 2);
soRec.setFieldValue('intercotransaction', 295845);


soRec.selectNewLineItem('item');
soRec.setCurrentLineItemValue('item', 'item', 15757);
soRec.setCurrentLineItemValue('item', 'quantity', 10);
soRec.setCurrentLineItemValue('item', 'rate', 11);
soRec.setCurrentLineItemValue('item', 'taxcode', 13775);
soRec.commitLineItem('item');

var soId = nlapiSubmitRecord(soRec);


var poRec = nlapiLoadRecord('purchaseorder', 295845);
poRec.setFieldValue('intercotransaction', soId);
poRec.setFieldValue('intercostatus', 2);
nlapiSubmitRecord(poRec, true, true);

	nlapiSubmitField('salesorder', soId, 'intercostatus', 2);

var a = '';
}