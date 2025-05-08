/* ******************************************************************************************
 * Company:		Invitra Technologies Pvt.Ltd
 * Author:	    Supriya Gunjal
 * 
 *
 * Version    Date            Author           	  Remarks
 * 1.00       30 Oct 2023    Supriya Gunjal	     Initial Version
 *
 ********************************************************************************************/
/**
 * @NScriptType Suitelet
 * @NApiVersion 2.x
 */
define(['N/https', 'N/error', 'N/record', 'N/file', 'N/runtime'], function (https, error, record, file, runtime) {

    function onRequest(context) {
        try {
			//var tokenKey = utils.getAuthorizationKey();
            //log.debug('tokenKey', tokenKey);

            var fromDate = '09/01/2023';
            var toDate = '09/15/2023';

            // var jdResponse = utils.getNewApprovedBillingRecords(fromDate, toDate);
            // log.debug('jdResponse', jdResponse);

            // log.debug('jdResponse data', jdResponse.data);

           // var fileLink = 'https://www1.jobdiva.com/attdownload.jsp?a=01cFgVYAB5fXlYAAA9XDVIVXF1LAVxSWg5SU1hAGQ==';
           // var fileLink = 'https://8188550-sb2.app.netsuite.com/core/media/media.nl?id=456222&c=8188550_SB2&h=vhumdW7r2ZTf5X31SSlI-gX_KQrNuUBPWPUu1gDhr_I6fKhI&_xt=.zip';
            var fileLink = 'https://www1.jobdiva.com/multi_attdownload.jsp?a=024FghYAh5fWlYJAwFXHlIVXFxLAVxVXQdeVVJLEAheW1BbBwQJ';

            var fileContent = https.get({url: fileLink});
            log.debug("fileContent", fileContent);

            var fileObj = file.create({
                name: "TestjobDiva_zip.zip",
                fileType: file.Type.ZIP,
                contents: fileContent.body,
                folder: 322042
            });

            var fileId = fileObj.save();
            log.debug("fileId", fileId);

        } catch (error) {
            log.debug({ title: 'API Error > ', details: error });
        }
    }


    return {
        onRequest: onRequest
    }
});
