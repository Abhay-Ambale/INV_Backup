function beforeRecordLoad(type) {
    var fileArray = [];

    var context = nlapiGetContext();
    var recordType = nlapiGetRecordType();
    nlapiLogExecution("debug", "recordType", type)

    if (type == 'create') {

        var paramValue = context.getSetting('SCRIPT', 'custscript_norwin_email_template');
        nlapiLogExecution('DEBUG', 'Script Parameter Value', paramValue);
        if (paramValue) {
            nlapiSetFieldValue('template', paramValue);
        }
        nlapiSetFieldValue('emailpreference', 'PDF');
      
        var tranid = nlapiGetFieldValue('transaction');
        if (tranid) {
            var invoiceSearch = nlapiSearchRecord("invoice", null, [
                ["type", "anyof", "CustInvc"],
                "AND", ["internalid", "anyof", tranid],
                "AND", ["mainline", "is", "T"]],
                [new nlobjSearchColumn("internalid", "file", null)]);
        }

        if (invoiceSearch) {
            for (var i = 0; i < invoiceSearch.length; i++) {
                var fileid = invoiceSearch[i].getValue("internalid", "file");
                if (fileid) {
                    fileArray.push(fileid);
                }
            }
        } 
        if (fileArray.length > 0) {
            for (var i = 0; i < fileArray.length; i++) {
                nlapiSelectNewLineItem('mediaitem');
                nlapiSetCurrentLineItemValue('mediaitem', 'mediaitem', fileArray[i], true, true);
                nlapiCommitLineItem('mediaitem');
            }
        }
    }
}