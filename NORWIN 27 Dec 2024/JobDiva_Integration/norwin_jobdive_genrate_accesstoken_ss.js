/**
@NApiVersion 2.0
@NScriptType Scheduledscript
*/
define(['N/log','N/config','./jobdiva_integration_utils.js'], function (log,config,jobdivaIntegrationUtils) {
    function execute(context) {
        var tokenKey = "";
        var companyPreferenceObj = "";
        
            tokenKey = jobdivaIntegrationUtils.getAuthorizationKey();
            log.debug("tokenKey", tokenKey);

            companyPreferenceObj = config.load({type: 'companypreferences'});
            companyPreferenceObj.setValue({fieldId: 'custscript_jd_access_token',value: tokenKey,ignoreFieldChange: true});
            companyPreferenceObj.save();
        
    }
    return {
        execute: execute
    };
});