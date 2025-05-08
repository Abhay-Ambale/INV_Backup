/**
 * Company - Invitra Technologies Pvt.Ltd
 * Script description - get data from Bullhorn api.
 *
 *
 * Version    Date            Author           	  Remarks
 * 1.00      09 Oct 2023   Chetan Sable      Initial Development
 *
 ***********************************************************************/
/**
 * @NScriptType Suitelet
 * @NApiVersion 2.x
 */
define(['N/https', 'N/error', 'N/record', 'N/search', 'N/runtime'], function (https, error, record, search, runtime) {

    var BULLHORN_AUTH_URL = 'https://auth-west.bullhornstaffing.com/oauth';
    var BULLHORN_REST_URL = 'https://rest-west.bullhornstaffing.com/rest-services';

    var BULLHORN_USERNAME = 'pdsincllc2.api';
    var BULLHORN_PASSWORD = '7HC8GkHBHxQfwn#d';
    var BULLHORN_CLIENT_ID = '2882e97b-8287-4171-8244-cb6bf542d5fe';
    var BULLHORN_CLIENT_SECRET = 'xSMdtOp3xxiIxCyP2vMnjevP';
    var BULLHORN_AUTH_CODE = '5999_7804057_32%3Af48b6581-41db-4cd6-9abc-d67124ab3488';

    function authConnection() {
        var authUri = "client_id="+BULLHORN_CLIENT_ID+"&response_type=code&action=Login&username="+BULLHORN_USERNAME+"&password="+BULLHORN_PASSWORD+"&state=123456789";
        var encodeAuthUri = encodeURI(authUri);
        var authResponse = https.get({
            url: BULLHORN_AUTH_URL + '/authorize?' + authUri,
            headers: {
                'Accept': 'application/json',
            }
        });

        log.debug('url', BULLHORN_AUTH_URL + '/authorize?' + authUri);
        log.debug('authResponse', authResponse);

        // sample response
        // https://ea.emergys.net/bh?code=5999_7804057_32%3A46830e32-5a42-412a-84ce-065929027406&client_id=2882e97b-8287-4171-8244-cb6bf542d5fe#d&state=123456789
        if (authResponse.code == 200) {
            // var authResponseBody = JSON.parse(authResponse.body);
            var authResponseBody = authResponse.body;
            log.debug('authResponseBody', authResponseBody);
            return authResponseBody;
        } else {
            throw error.create({ name: 'AUTHCONNECTION_API_ERROR', message: authResponse.message });
        }
    }


    function getAccessToken() {
        var params = "grant_type=authorization_code&code="+BULLHORN_AUTH_CODE+"&client_id="+BULLHORN_CLIENT_ID+"&client_secret="+BULLHORN_CLIENT_SECRET;
        var response = https.post({
            url: BULLHORN_AUTH_URL + '/token?' + params,
            headers: {
                'Accept': 'application/json',
            }
        });
       
        log.debug('response', response);
        /** Sample Response
         * {
                "access_token": "5999_7804057_32:dceac195-e6ff-495a-9a5f-f71d829906f4",
                "token_type": "Bearer",
                "expires_in": 600,
                "refresh_token": "5999_7804057_32:38c61759-d8d1-4d90-ac18-ceb5f99bbc71"
            }
         * 
         */
        if (response.code == 200) {
            // var authResponseBody = JSON.parse(authResponse.body);
            var responseBody = response.body;
            log.debug('responseBody', responseBody);
           
        } else {
            throw error.create({ name: 'getAccessToken', message: response });
        }
    }
    
    function onRequest(context) {

        //var tokenKey = authConnection();

        var tokenKey = getAccessToken();
        //https://auth-west.bullhornstaffing.com/oauth/token?grant_type=authorization_code&code=5999_7804057_32%3A46830e32-5a42-412a-84ce-065929027406&client_id=2882e97b-8287-4171-8244-cb6bf542d5fe&client_secret=xSMdtOp3xxiIxCyP2vMnjevP
        
        //https://auth-{value_from_loginInfo}.bullhornstaffing.com/oauth/token?grant_type=authorization_code&code={auth_code}&client_id={client_id}&client_secret={client_secret}&redirect_uri={optional redirect_uri}
        log.debug("tokenKey", tokenKey);
    }


    return {
        onRequest: onRequest
    }


});