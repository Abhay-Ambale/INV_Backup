/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version  Date            Author          Remarks
 * 1.00     3 June 2018		Supriya G		This script is used to
 * 
 */


function RFQ_SL(request, response) {
	var context		= nlapiGetContext();
	var isPrint 	= '';
	var email 		= '';
	if (request.getMethod() == 'GET'){
		isPrint 				= request.getParameter('isPrint');
		var paramrqpId			= request.getParameter('recId');
		var paramrqpType		= request.getParameter('recType');
		var paramVendor			= request.getParameter('vendor');
		var paramisemail		= request.getParameter('isemail');
		nlapiLogExecution('debug','paramisemail',paramisemail);
			if(_validateData(paramVendor)){
				var vendObj = nlapiLookupField('vendor',paramVendor,['email']);
				email = vendObj.email
			}
		if(isPrint == 'F') 
		{
			form	= nlapiCreateForm('Generate PDF');
			form.setScript('customscript_inv_rfq_ui_cl');

			//*****Start : Filter Field Group******//
			
			var infoGroup 			= form.addFieldGroup('infogroup', 'Trnsaction Information');
			var fltFilterGroup 		= form.addFieldGroup('filtergroup', 'Search Filters');
			
			var fltEnquiry	 		= form.addField('custpage_entity_no', 'text', 'Entity No.', null, 'infogroup').setDisplayType('inline');
			fltEnquiry.setHelpText("Enter Enity No", true);
			
			var enqNo 		= form.addField('custpage_enquery_no', 'text', 'Enquiry Number',null, 'infogroup').setDisplayType('inline');
			enqNo.setHelpText("Enter Enquiry Number.", true);
			
			var fltCustomer 		= form.addField('custpage_customer', 'select', 'Customer','-2', 'infogroup').setDisplayType('inline');
			fltCustomer.setHelpText("Select Customer to filter the list.", true);
			
			var prqFld		= form.addField('custpage_prq', 'select', 'PRQ #','-30', 'infogroup').setDisplayType('hidden');
			var prqTypeFld		= form.addField('custpage_prq_type', 'text', 'PRQ Type',null, 'infogroup').setDisplayType('hidden');
			
			var vendorFilter = form.addField('custpage_vendor_list', 'select', 'Vendor',null, 'filtergroup').setMandatory(true);
			vendorFilter.addSelectOption('','');
			var emailFld 		= form.addField('custpage_vend_email', 'text', 'Vendor Mail ID',null, 'filtergroup').setDisplayType('inline');

			var transactionVendorSearch = '';
			if(_validateData(paramrqpId) && _validateData(paramrqpType)) {

				var recObj = nlapiLookupField(paramrqpType,paramrqpId,['tranid','custbody_inv_rfq_enquiry_no','custbody_inv_rfq_customer']);
				fltEnquiry.setDefaultValue(recObj.tranid);
				enqNo.setDefaultValue(recObj.custbody_inv_rfq_enquiry_no);
				fltCustomer.setDefaultValue(recObj.custbody_inv_rfq_customer);
				prqFld.setDefaultValue(paramrqpId);
				prqTypeFld.setDefaultValue(paramrqpType);
				emailFld.setDefaultValue(email);
				
			
				transactionVendorSearch = nlapiSearchRecord("transaction",null,
				[
				   ["type","anyof","Custom100"], 
				   "AND", 
				   ["internalid","anyof",paramrqpId], 
				   "AND", 
				   ["mainline","is","F"]
				], 
				[
				   new nlobjSearchColumn("custcol_inv_rfq_supplier",null,"GROUP").setSort(false)
				]
				);
			}
			
			if(_validateData(transactionVendorSearch))
			 {
				for(var i=0;i<transactionVendorSearch.length;i++)
				{
					vendorFilter.addSelectOption(transactionVendorSearch[i].getValue('custcol_inv_rfq_supplier',null,'group'),transactionVendorSearch[i].getText('custcol_inv_rfq_supplier',null,'group'));
				
				}//for(var i=0;i<transactionVendorSearch.length;i++)
			}//if(_validateData(transactionVendorSearch))
				
			var SubtaskTab		= form.addTab('custpage_tab','');
			var SubList			= form.addSubList('custpage_item_list','list','Items','custpage_tab');
			SubList.addField('custpage_select','checkbox','SELECT').setDisplayType('disabled');
			SubList.addField('custpage_item','text','ITEM');
			SubList.addField('custpage_size','text','SIZE');
			SubList.addField('custpage_color','text','COLOR');
			SubList.addField('custpage_dimensions','text','Dimentsions');
			SubList.addField('custpage_weight','text','Weight');
			SubList.addField('custpage_composition','text','COMPOSITION');
			SubList.addField('custpage_construction','text','CONSTRUCTION');
			SubList.addField('custpage_make','text','MAKE');
			SubList.addField('custpage_packeging','text','PACKAGING');
			SubList.addField('custpage_etd','text','ETD');
			SubList.addField('custpage_qty','text','QUANTITY');
			SubList.addField('custpage_moq','text','MOQ');
			SubList.addField('custpage_carton_details','text','CARTON DETAILS');
			SubList.addField('custpage_inco_terms','text','INCO TERMS');
			
			if(_validateData(paramrqpId) && _validateData(paramrqpType) && _validateData(paramVendor)) {
				vendorFilter.setDefaultValue(paramVendor);
				var transactionSearch = nlapiSearchRecord("transaction",null,
					[
					   ["type","anyof","Custom100"], 
					   "AND", 
					   ["internalid","anyof",paramrqpId], 
					   "AND", 
					   ["mainline","is","F"], 
					   "AND", 
					   ["custcol_inv_rfq_supplier","anyof",paramVendor]
					], 
					[
					   new nlobjSearchColumn("custcol_inv_rfq_item"), 
					   new nlobjSearchColumn("custcol_inv_rfq_size"), 
					   new nlobjSearchColumn("custcol_inv_rfq_color"), 
					   new nlobjSearchColumn("custcol_inv_rfq_dimensions"), 
					   new nlobjSearchColumn("custcol_inv_rfq_weight"), 
					   new nlobjSearchColumn("custcol_inv_rfq_composition"), 
					   new nlobjSearchColumn("custcol_inv_rfq_construction"), 
					   new nlobjSearchColumn("custcol_inv_rfq_make"), 
					   new nlobjSearchColumn("custcol_inv_rfq_packaging"), 
					   new nlobjSearchColumn("custcol_inv_rfq_etd"), 
					   new nlobjSearchColumn("custcol_inv_rfq_qty"), 
					   new nlobjSearchColumn("custcol_inv_rfq_supplier").setSort(false),
					   new nlobjSearchColumn("custcol_inv_rfq_inco_terms"),
					   new nlobjSearchColumn("custcol_inv_rfq_moq"),
					   new nlobjSearchColumn("custcol_inv_rfq_carton_dimension"),
					   new nlobjSearchColumn("custcol_inv_rfq_carton_qty")
					   
					]
					);
					
				 if(_validateData(transactionSearch))
				 {
					for(var i=0;i<transactionSearch.length;i++)
					{
						var cartonDetails 	= '';
						var colums 			= transactionSearch[i].getAllColumns();
						if(_validateData(transactionSearch[i].getValue(colums[14])))
							cartonDetails 	= 'Dimension: ' +transactionSearch[i].getValue(colums[14]);
						if(_validateData(transactionSearch[i].getValue(colums[15])))
							cartonDetails 	= cartonDetails+'<br>Qty: '+transactionSearch[i].getValue(colums[15]);
						
						SubList.setLineItemValue('custpage_select',i+1,'T');
						SubList.setLineItemValue('custpage_item',i+1,transactionSearch[i].getText(colums[0]));
						SubList.setLineItemValue('custpage_size',i+1,transactionSearch[i].getValue(colums[1]));
						SubList.setLineItemValue('custpage_color',i+1,transactionSearch[i].getValue(colums[2]));
						SubList.setLineItemValue('custpage_dimensions',i+1,transactionSearch[i].getValue(colums[3]));
						SubList.setLineItemValue('custpage_weight',i+1,transactionSearch[i].getValue(colums[4]));
						SubList.setLineItemValue('custpage_composition',i+1,transactionSearch[i].getValue(colums[5]));
						SubList.setLineItemValue('custpage_construction',i+1,transactionSearch[i].getValue(colums[6]));
						SubList.setLineItemValue('custpage_make',i+1,transactionSearch[i].getValue(colums[7]));
						SubList.setLineItemValue('custpage_packeging',i+1,transactionSearch[i].getValue(colums[8]));
						SubList.setLineItemValue('custpage_etd',i+1,transactionSearch[i].getValue(colums[9]));
						SubList.setLineItemValue('custpage_qty',i+1,transactionSearch[i].getValue(colums[10]));
						SubList.setLineItemValue('custpage_moq',i+1,transactionSearch[i].getValue(colums[13]));
						SubList.setLineItemValue('custpage_carton_details',i+1, cartonDetails);
						SubList.setLineItemValue('custpage_inco_terms',i+1,transactionSearch[i].getText(colums[12]));
						
					}//for(var i=0;i<transactionSearch.length;i++)
				}//if(_validateData(transactionSearch))
			}
			
			

			
			// Buttons
			form.addSubmitButton('Print PDF');
			
			var basePath	= request.getURL();
			basePath	= basePath.substring(0,basePath.indexOf("/app"));
			
			var printURL	= nlapiResolveURL('SUITELET',  context.getScriptId(), context.getDeploymentId(), null);
			printURL	= basePath + '' + printURL ;
			
			printURL	= "javascript: if(save_record() == true) {var paramenqNo= nlapiGetFieldValue('custpage_enquery_no'); var paramrqpId= nlapiGetFieldValue('custpage_prq'); var paramrqpType= nlapiGetFieldValue('custpage_prq_type');  var paramVendor= nlapiGetFieldValue('custpage_vendor_list'); document.getElementById('main_form').submit(); medwin=window.open('" + printURL + "&recId='+paramrqpId+'&recType='+paramrqpType+'&vendor='+paramVendor+'&isPrint=T&isemail=T&enqNo='+paramenqNo,'_self');medwin.focus();}";
			form.addButton('custombutton_print_email','Print & Email',printURL);
	
		
			response.writePage(form);
			return true;
		}
		else if(isPrint == 'T')
		{
			var transactionSearch = '';
			var paramrqpId		= request.getParameter('recId');
			var paramrqpType	= request.getParameter('recType');
			var paramVendor 	= request.getParameter('vendor');
			var paramenqNo 		= request.getParameter('enqNo');
			if(_validateData(paramrqpId) && _validateData(paramVendor)) {
					transactionSearch = nlapiSearchRecord("transaction",null,
					[
					   ["type","anyof","Custom100"], 
					   "AND", 
					   ["internalid","anyof",paramrqpId], 
					   "AND", 
					   ["mainline","is","F"], 
					   "AND", 
					   ["custcol_inv_rfq_supplier","anyof",paramVendor]
					], 
					[
					   new nlobjSearchColumn("custcol_inv_rfq_item"), 
					   new nlobjSearchColumn("custcol_inv_rfq_size"), 
					   new nlobjSearchColumn("custcol_inv_rfq_color"), 
					   new nlobjSearchColumn("custcol_inv_rfq_dimensions"), 
					   new nlobjSearchColumn("custcol_inv_rfq_weight"), 
					   new nlobjSearchColumn("custcol_inv_rfq_composition"), 
					   new nlobjSearchColumn("custcol_inv_rfq_construction"), 
					   new nlobjSearchColumn("custcol_inv_rfq_make"), 
					   new nlobjSearchColumn("custcol_inv_rfq_packaging"), 
					   new nlobjSearchColumn("custcol_inv_rfq_etd"), 
					   new nlobjSearchColumn("custcol_inv_rfq_qty"), 
					   new nlobjSearchColumn("custcol_inv_rfq_supplier").setSort(false),
					   new nlobjSearchColumn("custcol_inv_rfq_inco_terms"),
					   new nlobjSearchColumn("custcol_inv_rfq_moq"),
					   new nlobjSearchColumn("custcol_inv_rfq_carton_dimension"),
					   new nlobjSearchColumn("custcol_inv_rfq_carton_qty")
					]
					);
			}
			
			/* nlapiLogExecution('debug','paramrqpId>>',paramrqpId)
			nlapiLogExecution('debug','paramVendor>>',paramVendor)
			nlapiLogExecution('debug','paramrqpType>>',paramrqpType )*/
			
			var templateSFilter = [];	
			var templateSColumn	= [];
			if(_validateData(paramrqpType))
			{
				//Start : PDF Template Layout Search
				templateSFilter.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
				templateSFilter.push(new nlobjSearchFilter('custrecord_inv_record_type', null, 'is', paramrqpType));
				templateSColumn.push(new nlobjSearchColumn('name'));
				templateSColumn.push(new nlobjSearchColumn('custrecord_inv_pdf_logo'));
				templateSColumn.push(new nlobjSearchColumn('custrecord_inv_pdf_layout'));


				var templateSrchObj = nlapiSearchRecord('customrecord_inv_cust_tran_pdf_layout', null, templateSFilter, templateSColumn);
				nlapiLogExecution('debug','templateSrchObj====>>', templateSrchObj);
				//End : PDF Template Layout Search
			
			} 
			
			
			if(_validateData(templateSrchObj))
			{
		
				companyInformation = nlapiLoadConfiguration('companyinformation');

				var template = templateSrchObj[0].getValue('custrecord_inv_pdf_layout');
				var renderer = nlapiCreateTemplateRenderer();
				template = template.replace(/<br>/ig, "<br/>");
				template = template.replace(/&/g, "&amp;");
				renderer.setTemplate(template); // Passes in raw string of template to be transformed by FreeMarker
				renderer.addSearchResults('templateobj', templateSrchObj);
				
				if(_validateData(transactionSearch))
				{
					renderer.addSearchResults('tansactobj', transactionSearch); 
				}
				
				if(_validateData(paramrqpId) && _validateData(paramrqpType))
				{
					recordObj = nlapiLoadRecord(paramrqpType, paramrqpId);
					var subsidairy = recordObj.getFieldValue('subsidiary');
					if(_validateData(subsidairy)){
						var subrecordObj = nlapiLoadRecord('subsidiary', subsidairy);
						renderer.addRecord('subsidiary', subrecordObj);
					}
					renderer.addRecord('record', recordObj); 
				}
				
				if(_validateData(paramVendor))
				{
					var vendObj = nlapiLoadRecord('vendor',paramVendor);
					renderer.addRecord('vendobj', vendObj); 
				}
				

				var xml = renderer.renderToString(); // Returns template content interpreted by FreeMarker as XML string that can be passed to the nlapiXMLToPDF function.
				
				xml	= xml.replace(/<br>/ig, "<br/>");
				xml	= xml.replace(/&[^A-Za-z0-9_]/g, "&amp;");
			
				var file = nlapiXMLToPDF(xml);
					
				var pdfFileName = ''+paramenqNo+'.pdf';
				file.setName(pdfFileName);
				response.setContentType('PDF', pdfFileName, 'inline');
				if(paramisemail  == 'T') {
					try{
						//var newAttachment = nlapiCreateFile('pdfFileName', 'PDF', xml);
						nlapiSendEmail(28377,email, 'PRQ attachment', 'Please see the attached file', null, null, null, file)
					}
					catch(e){
						nlapiLogExecution('debug','ERROR',e)
					}
				}
			
				response.write(file.getValue());
			} 
			
		}

	}
	else
	{		
		// POST			isPrint 				= request.getParameter('isPrint');
		
			var paramrqpId		= request.getParameter('custpage_prq');
			var paramrqpType	= request.getParameter('custpage_prq_type');
			var paramVendor 	= request.getParameter('custpage_vendor_list');
			var paramenqNo 		= request.getParameter('custpage_enquery_no');	
			params				= [];
			params['recId']	 = paramrqpId;
			params['recType'] 	 = paramrqpType;
			params['vendor']   = paramVendor;
			params['enqNo']   = paramenqNo;
			params['isPrint']   = 'T';
			nlapiSetRedirectURL('SUITELET', context.getScriptId(), context.getDeploymentId(), null, params);	
			
	}
}



function FieldChange(type, name, linenum) {
	if(name == 'custpage_vendor_list')
	{
		var vendorStr 		= '';
		var vendor 			= nlapiGetFieldValue('custpage_vendor_list');
		var redirectUrl		= window.location.search;
		if (redirectUrl.indexOf('&vend') > 0){
			redirectUrl = redirectUrl.substring(0, redirectUrl.indexOf('&vend'));
		}
		if(_validateData(vendor))		
		{
		   vendorStr = '&vendor=' + vendor;
		}
		
		if( _validateData(vendor))
		{
			//save_record(true);	//Auto Page Submitter
			window.location.search = redirectUrl + vendorStr;
		}
	}
}