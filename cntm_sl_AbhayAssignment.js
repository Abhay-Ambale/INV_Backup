/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
  "N/file",
  "N/record",
  "N/redirect",
  "N/search",
  "N/ui/serverWidget",
  "N/url",
], /**
 * @param{file} file
 * @param{record} record
 * @param{redirect} redirect
 * @param{search} search
 * @param{serverWidget} serverWidget
 * @param{url} url
 */
(file, record, redirect, search, serverWidget, url) => {
  /**
   * Defines the Suitelet script trigger point.
   * @param {Object} scriptContext
   * @param {ServerRequest} scriptContext.request - Incoming request
   * @param {ServerResponse} scriptContext.response - Suitelet response
   * @since 2015.2
   */
  const onRequest = (context) => {
    if (context.request.method == "GET") {
      try {               
        var form = serverWidget.createForm({
          title: "Job Application Form",
        });
        form.clientScriptModulePath = './AssignmentAbhayClientScript.js'; 
        var refresh = form.addButton({
            id: 'refresh_btn',
            label: 'Refresh',
            functionName: 'refresh()'
        })
        var fieldgroup123 = form.addFieldGroup({
          id: "PersonalData",
          label: "Personal Informtion",
        });
        var fieldgroup456 = form.addFieldGroup({
          id: "OtherData",
          label: "Other Information",
        });
        var fieldgroupTest = form.addFieldGroup({
          id: "RemFields",
          label: "All Remaining Test Field",
        });

        var userName = form.addField({
          id: "custpage_cntm_username",
          type: serverWidget.FieldType.TEXT,
          label: "First Name",
          container: "PersonalData",
        });
        var customer = form.addField({
          id: "custpage_cntm_customer",
          type: serverWidget.FieldType.SELECT,
          label: "Customer",
          container: "PersonalData",
        });
        customer.addSelectOption({
          value:'blk',
          text: '',
        })
        customer.addSelectOption({
          value:'bla',
          id: 'bla',
          text: 'alpha',
        })
        customer.addSelectOption({
          value:'blb',
          id: 'blb',
          text: 'beta',
        })
        customer.addSelectOption({
          value:'blc',
          id: 'blc',
          text: 'gamma',
        })
        userName.isMandatory = true;
        var userSurname = form.addField({
          id: "custpage_cntm_usersurname",
          type: serverWidget.FieldType.TEXT,
          label: "Surname",
          container: "PersonalData",
        });
        userSurname.isMandatory = true;

        var contact = form.addField({
          id: "custpage_cntm_usercontact",
          type: serverWidget.FieldType.PHONE,
          label: "Contact Number",
          container: "PersonalData",
        });
        var dob = form.addField({
          id: "custpage_cntm_userdob",
          type: serverWidget.FieldType.DATE,
          label: "Date of Birth",
          container: "PersonalData",
        });
        var email = form.addField({
          id: "custpage_cntm_email",
          type: serverWidget.FieldType.EMAIL,
          label: "Email Address",
          container: "PersonalData",
        });
        var Labelfield = form.addField({
          id: "custpage_fl",
          type: serverWidget.FieldType.LABEL,
          label: "Select Gender",
          container: "PersonalData",
        });

        var male = form.addField({
          id: "custpage_f11",
          type: serverWidget.FieldType.RADIO,
          label: "Male",
          source: "Male",
          container: "PersonalData",
        });

        var female = form.addField({
          id: "custpage_f11",
          type: serverWidget.FieldType.RADIO,
          label: "Female",
          source: "Female",
          container: "PersonalData",
        });
        var photo = form.addField({
          id: "custpage_cntm_photo",
          type: serverWidget.FieldType.IMAGE,
          label: "Upload Your Photograph",
          container: "PersonalData",
        });
        var previousEmp = form.addField({
          id: "custpage_cntm_check",
          type: serverWidget.FieldType.CHECKBOX,
          label: "Previously Employement",
          container: "OtherData",
        });
        var previousdetail = form.addField({
          id: "custpage_cntm_empdetails",
          type: serverWidget.FieldType.TEXT,
          label: "Employer details",
          container: "OtherData",
        });
        var jobdescription = form.addField({
          id: "custpage_cntm_empdetails1",
          type: serverWidget.FieldType.TEXT,
          label: "Job Description",
          container: "OtherData",
        });
        var package = form.addField({
          id: "custpage_cntm_package",
          type: serverWidget.FieldType.FLOAT,
          label: "Package",
          container: "OtherData",
        });
        var curr = form.addField({
          id: "custpage_cntm_curr",
          type: serverWidget.FieldType.CURRENCY,
          label: "Package Currency",
          container: "OtherData",
        });

        var help = form.addField({
          id: "custpage_cntm_help",
          type: serverWidget.FieldType.HELP,
          label: "HELP TEXT FIELD",
          container: "RemFields",
        });
        var IHTML = form.addField({
          id: "custpage_cntm_ihtml",
          type: serverWidget.FieldType.INLINEHTML,
          label: "Inline HTML Field",
          container: "RemFields",
        });
        var number = form.addField({
          id: "custpage_cntm_number",
          type: serverWidget.FieldType.INTEGER,
          label: "Integer Test Field",
          container: "RemFields",
        });
        var ltext = form.addField({
          id: "custpage_cntm_ltext",
          type: serverWidget.FieldType.LONGTEXT,
          label: "Long text Test Field",
          container: "RemFields",
        });
        var mulselect = form.addField({
          id: "custpage_cntm_mulselect",
          type: serverWidget.FieldType.MULTISELECT,
          label: "Multiselect Test Field",
          container: "RemFields",
        });

        var pass = form.addField({
          id: "custpage_cntm_pass",
          type: serverWidget.FieldType.PASSWORD,
          label: "Password Test Field",
          container: "RemFields",
        });
        var pop = form.addField({
            id: "custpage_cntm_popup",
            type: serverWidget.FieldType.CHECKBOX,
            label: "Open PopUp",
            container: "RemFields",
          });
          log.debug('POP value: ', pop);
          
        var percentage = form.addField({
          id: "custpage_cntm_percentage",
          type: serverWidget.FieldType.PERCENT,
          label: "Percent Test Field",
          container: "RemFields",
        });
        var selec = form.addField({
          id: "custpage_cntm_select",
          type: serverWidget.FieldType.SELECT,
          label: "SELECT TEST FIELD",
          container: "RemFields",
        });
        var rtext = form.addField({
          id: "custpage_cntm_rtext",
          type: serverWidget.FieldType.RICHTEXT,
          label: "RICHTEXT TEST FIELD",
          container: "RemFields",
        });

        var tarea = form.addField({
          id: "custpage_cntm_tarea",
          type: serverWidget.FieldType.TEXTAREA,
          label: "TEXTAREA TEST FIELD",
          container: "RemFields",
        });
        var tofday = form.addField({
          id: "custpage_cntm_tofday",
          type: serverWidget.FieldType.TIMEOFDAY,
          label: "TIMEOFDAY TEST FIELD",
          container: "RemFields",
        });
        var website = form.addField({
          id: "custpage_cntm_website",
          type: serverWidget.FieldType.URL,
          label: "URL TEST FIELD",
          container: "RemFields",
        });
        var sublist1 = form.addSublist({
          id: "sublist1",
          type: serverWidget.SublistType.INLINEEDITOR,
          label: "Education Details",
        });
        var field = sublist1.addField({
          id: "sublistfieldinst",
          type: serverWidget.FieldType.TEXT,
          label: "Institution",
        });
        var field = sublist1.addField({
          id: "sublistfieldcgpa",
          type: serverWidget.FieldType.TEXT,
          label: "CGPA",
        });
        var sublist2 = form.addSublist({
          id: "sublist2",
          type: serverWidget.SublistType.INLINEEDITOR,
          label: "Editor Sublist",
        });
        sublist2.addField({
          id: "custpage_ss_internalid",
          type: serverWidget.FieldType.TEXT,
          label: "Internal ID",
        });
        sublist2.addField({
          id: "custpage_ss_docnum",
          type: serverWidget.FieldType.TEXT,
          label: "Document Number",
        });
        sublist2.addField({
          id: "custpage_ss_date",
          type: serverWidget.FieldType.DATE,
          label: "Date",
        });
        sublist2.addField({
          id: "custpage_ss_custname",
          type: serverWidget.FieldType.TEXT,
          label: "Customer Name",
        });
        sublist2.addField({
          id: "custpage_ss_custamt",
          type: serverWidget.FieldType.TEXT,
          label: "Amount",
        });
        var sublist3 = form.addSublist({
          id: "sublist3",
          type: serverWidget.SublistType.LIST,
          label: "List Sublist",
        });
        var sublist4 = form.addSublist({
          id: "sublist4",
          type: serverWidget.SublistType.STATICLIST,
          label: "Static Sublist",
        });
        var resume = form
          .addField({
            id: "custpage_cntm_resume",
            type: serverWidget.FieldType.FILE,
            label: "Upload Resume",
          })
          .setHelpText({
            help: "My first assignment of form creation",
          });
        var submit = form.addSubmitButton({
          id: "custpage_cntm_submit",
          label: "Submit",
        });
        var savedSearch = search.create({
          type: search.Type.SALES_ORDER,
          id: "customsearch_assignmentofsavedsearch",

          columns: [
            {
              name: "transactionnumber",
            },
            {
              name: "tranid",
            },
            {
              name: "entity",
            },
            {
              name: "total",
            },
            {
              name: "trandate",
            },
          ],
          filters: [
            ["type", "anyof", "SalesOrd"],
            "AND",
            ["status", "anyof", "SalesOrd:D", "SalesOrd:B"],
            "AND",
            ["mainline", "is", "T"],
          ],
        });
        var searchResultCount = savedSearch.runPaged().count; //Print's total search count.
        log.debug("Saved Search count", searchResultCount);

        var counter = 0;
        savedSearch.run().each(function (result) {
          var customerName = result.getText("entity");
          var tranid = result.getValue("tranid");
          var amount = result.getValue("total");
          var docnum = result.getValue("transactionnumber");
          var trandate = result.getValue("trandate");

          sublist2.setSublistValue({
            id: "custpage_ss_internalid",
            value: tranid,
            line: counter,
          });

          sublist2.setSublistValue({
            id: "custpage_ss_docnum",
            value: docnum,
            line: counter,
          });
          sublist2.setSublistValue({
            id: "custpage_ss_date",
            value: trandate,
            line: counter,
          });

          sublist2.setSublistValue({
            id: "custpage_ss_custname",
            value: customerName,
            line: counter,
          });
          sublist2.setSublistValue({
            id: "custpage_ss_custamt",
            value: amount,
            line: counter,
          });

          counter++;

          return true;
        });

        context.response.writePage(form);
      } catch (error) {
        log.error("Error in GET :", error);
      }
      log.debug("GET");

    } else {
        try {            
         log.debug("POST");
         var f1 = context.request.parameters.custpage_cntm_username;
         var mail = context.request.parameters.custpage_cntm_email;
         var phon = context.request.parameters.custpage_cntm_usercontact;
         var gen = context.request.parameters.custpage_f11;
         var dobirth = context.request.parameters.custpage_cntm_userdob;
   
         // context.response.write("Name: "+f1+"\n");
         // context.response.write("Email: "+mail+"\n");
         // context.response.write("Contact Number: "+phon+"\n");
         // context.response.write("Gender: "+gen+"\n");
         // context.response.write("Date of birth: "+dobirth+"\n");
         var lineCount = context.request.getLineCount({ group: "sublist1" });
         var arr = [lineCount];
         var arr1 = [lineCount];
         for (var i = 0; i < lineCount; i++) {
           arr[i] = context.request.getSublistValue({
             group: "sublist1",
             name: "sublistfieldinst",
             line: i,
           });
           arr1[i] = context.request.getSublistValue({
             group: "sublist1",
             name: "sublistfieldcgpa",
             line: i,
           });
         }
         // for(var i=0;i<lineCount;i++)
         //     {
         //         context.response.write("Institution: "+arr[i]+ "    "+arr1[i]+"\n");
         //     }
   
         var createdRecord = record.create({
           type: "customrecord_cntm_job_application_form",
           isDynamic: true,
         });
         createdRecord.setValue({
           fieldId: "custrecord_cntm_name",
           value: f1,
         });
         createdRecord.setValue({
           fieldId: "custrecord_cntm_email",
           value: mail,
         });
         createdRecord.setValue({
           fieldId: "custrecord_cntm_contact",
           value: phon,
         });
         createdRecord.setValue({
           fieldId: "custrecord_cntm_gender",
           value: gen,
         });
   
         var recsave = createdRecord.save();
         log.debug('recsave :',recsave);
   
         for (var i = 0; i < lineCount; i++) {
           var jobchild = record.create({
             type: "customrecord_cntm_testchild",
             isDynamic: false,
           });
           jobchild.setValue({
             fieldId: "custrecord_cntm_testchildfield",
             value: recsave,
           });
   
           jobchild.setValue({
             fieldId: "custrecord_cntm_abhaytextfield",
             value: context.request.getSublistValue({
               group: "sublist1",
               name: "sublistfieldinst",
               line: i,
             }),
           });
           jobchild.setValue({
             fieldId: "custrecord_cntm_cgpa",
             value: context.request.getSublistValue({
               group: "sublist1",
               name: "sublistfieldcgpa",
               line: i,
             }),
           });
   
           jobchild.save();
         }
         log.debug("JOBCHILD Created");
         var savedSearch = search.create({
            type: search.Type.SALES_ORDER,
            id: "customsearch_assignmentofsavedsearch",
  
            columns: [
              {
                name: "transactionnumber",
              },
              {
                name: "tranid",
              },
              {
                name: "entity",
              },
              {
                name: "total",
              },
              {
                name: "trandate",
              },
            ],
            filters: [
              ["type", "anyof", "SalesOrd"],
              "AND",
              ["status", "anyof", "SalesOrd:D", "SalesOrd:B"],
              "AND",
              ["mainline", "is", "T"],
            ],
          });
          var searchResultCount = savedSearch.runPaged().count;
          var counter = 0;
         
         savedSearch.run().each(function (result) {
           var customerName = result.getText("entity");
           var tranid = result.getValue("tranid");
           var amount = result.getValue("total");
           var docnum = result.getValue("transactionnumber");
           var trandate = result.getValue("trandate");
           var newrec = record.create({
             type: "customrecord_cntm_institution_list",
             isDynamic: true,
            });
   
           newrec.setValue({
             fieldId: "custrecord_cntm_parent",
             value: recsave,
             line: counter,
            });
   
           newrec.setValue({
             fieldId: "custrecord_internal_id_so",
             value: docnum,
             line: counter,
            });
           newrec.setValue({
             fieldId: "custrecord_docnumber",
             value: tranid,
             line: counter,
            });
           newrec.setValue({
             fieldId: "custrecord_custname",
             value: customerName,
             line: counter,
            });
           newrec.setValue({
             fieldId: "custrecord_cntm_abhaydate",
             value: trandate,
             line: counter,
            });
           newrec.setValue({
             fieldId: "custrecord_soamount",
             value: amount,
             line: counter,
            });
   
           newrec.save();
           counter++;

           return true;
          });
          log.debug("NEW REC created");

          log.debug("record redirection");

          redirect.toRecord({
           type: "customrecord_cntm_job_application_form",
           id: recsave,
          });
       
        } catch (error) {
            log.error('Error in POST :',error)
        }
    }
  };
  return { onRequest };
});
