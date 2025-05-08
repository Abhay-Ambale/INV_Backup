/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/currentRecord', 'N/record', 'N/redirect', 'N/ui/dialog', 'N/ui/serverWidget','N/search'],
    /**
 * @param{currentRecord} currentRecord
 * @param{record} record
 * @param{redirect} redirect
 * @param{dialog} dialog
 * @param{serverWidget} serverWidget
 */
    (currentRecord, record, redirect, dialog, serverWidget,search) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
          try{
                var form = serverWidget.createForm({
                title: "Change Customer",
                });
                form.clientScriptModulePath="./AssignmentAbhayClientScript.js";
                var list = form.addField({
                id: "custpage_cntm_customlist",
                type: serverWidget.FieldType.SELECT,
                label: 'Choose Customer',
                });
                log.error('Before try');
                try{
                  // var custsearch = search.load({
                  //   id:'customsearch_cntm_allcustomer'
                  // })
                  var custsearch = search.create({
                    type: search.Type.VENDOR,
                    id: 'customsearch_assignmentofsavedsearchcustomer',                    
                    columns:[   
                      {
                        name: "internalid",
                      },                  
                      {
                        name: "entityid",
                    }],
                    filters:[
                    ],   
                })
                resultObj = []
			          var saveSearchResult = custsearch.run()
                saveSearchResult.each(function (item) {
                  obj = {}
                  obj.id = item.getValue({name: "internalid"})
                  obj.title = item.getValue({name: "entityid"})
                  resultObj.push(obj)
                  return true
                })
                var searchResultCount = custsearch.runPaged().count;
                log.error('Customer Count: ', searchResultCount);
                for (var i = 0; i < resultObj.length; i++){
                  if (i == 0)
                    list.addSelectOption({
                      value: "",
                      text: "",
                      });
                      list.addSelectOption({
                        value: resultObj[i].id,
                        text: resultObj[i].title,
                        
                      })
                }                  
                log.error('search run executed')
                }catch(error){
                  log.error('Error in search: ', error)
                }

              form.addButton({
                id: 'custpage_btn',
                label: 'Submit',
                functionName: 'changeValue()'
              })           
                scriptContext.response.writePage(form);      

        }
        catch(error){
          log.debug('Error: ', error)
        }
      }
      return {onRequest}
    });
