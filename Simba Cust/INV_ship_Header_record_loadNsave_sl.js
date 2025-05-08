/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record'],
    /**
 * @param{record} record
 */
    (record) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            log.debug("Suitelet Triggered");
            var recObj = record.load({ type: 'customrecord_os_shiphead', id: '6351', isDynamic: true});
            var value = recObj.getValue({fieldId: 'custrecord_kl_originals_received'});
            log.debug("Initial Value", value);	
            recObj.setValue({fieldId: 'custrecord_kl_originals_received', value:true});
            recObj.save();
            log.debug("Suitelet End");
        }

        return {onRequest}

    });
