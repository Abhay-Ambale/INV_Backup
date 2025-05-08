/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version  Date            	Author          Remarks
 * 1.00     27 Aug 2018		Supriya G		This script is used to add PDF Button on Vendor Return Authorization
 *												
 * 
 */

function VendorReturn_BL(type, form){
	var currContext		= nlapiGetContext();
	var execContext		= currContext.getExecutionContext();
	if(type =='view' && execContext == 'userinterface'){
		var isClaim 	= nlapiGetFieldValue('custbody_inv_is_claim');
		
		if(isClaim == 'T'){
			var basePath	= request.getURL();
			basePath		= basePath.substring(0,basePath.indexOf("/app"));
			
			var suitURL		= nlapiResolveURL("SUITELET", "customscript_inv_print_pdf_trxn_sl", "customdeploy_inv_print_pdf_trxn_sl", null);
			var mainURL		= basePath + suitURL +'&recId='+nlapiGetRecordId()+'&recType='+nlapiGetRecordType()+'&isPrint=F';
			form.addButton("custpage_print_pdf", 'Print PDF',"window.open('"+mainURL+"', '_blank');");
		}
	}
}


function printPDF()
{
	var transactionSearch = '';
	var paramId		= request.getParameter('recId');
	var paramType	= request.getParameter('recType');
	//var paramVendor 	= request.getParameter('vendor');
	//var paramenqNo 		= request.getParameter('enqNo');
	if(_validateData(paramId)) {
			transactionSearch = nlapiSearchRecord("transaction",null,
			[
			   ["type","anyof","Custom100"], 
			   "AND", 
			   ["internalid","anyof",paramId], 
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
	
	/* nlapiLogExecution('debug','paramId>>',paramId)
	nlapiLogExecution('debug','paramVendor>>',paramVendor)
	nlapiLogExecution('debug','paramType>>',paramType )*/
	
	var templateSFilter = [];	
	var templateSColumn	= [];
	if(_validateData(paramType))
	{
		//Start : PDF Template Layout Search
		templateSFilter.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
		templateSFilter.push(new nlobjSearchFilter('custrecord_inv_record_type', null, 'is', paramType));
		templateSColumn.push(new nlobjSearchColumn('name'));
		templateSColumn.push(new nlobjSearchColumn('custrecord_inv_pdf_logo'));
		templateSColumn.push(new nlobjSearchColumn('custrecord_inv_pdf_layout'));


		var templateSrchObj = nlapiSearchRecord('customrecord_inv_cust_tran_pdf_layout', null, templateSFilter, templateSColumn);
		nlapiLogExecution('debug','templateSrchObj====>>', templateSrchObj);
		//End : PDF Template Layout Search	
	} 
	
	
	if(_validateData(templateSrchObj))
	{
		var companyInformation = nlapiLoadConfiguration('companyinformation');

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
		
		if(_validateData(paramId) && _validateData(paramType))
		{
			recordObj = nlapiLoadRecord(paramType, paramId);
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