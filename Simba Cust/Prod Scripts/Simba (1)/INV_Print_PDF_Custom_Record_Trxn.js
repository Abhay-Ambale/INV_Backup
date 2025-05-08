/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version  Date            	Author          Remarks
 * 1.00     27 Aug 2018		Supriya G		This script is used to print the PDF
 *												
 * 
 */

function printTraxnPDF()
{
	var transactionSearch 	= '';
	var templateSFilter 	= [];	
	var templateSColumn		= [];
	var paramId				= request.getParameter('recId');
	var paramType			= request.getParameter('recType');
	var paramisemail		= request.getParameter('email');
	
	
	/* nlapiLogExecution('debug','paramId>>',paramId)
	nlapiLogExecution('debug','paramType>>',paramType )*/	
	
	if(_validateData(paramType))
	{
		//Start : PDF Template Layout Search
		templateSFilter.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
		templateSFilter.push(new nlobjSearchFilter('custrecord_inv_record_type', null, 'is', paramType));
		templateSColumn.push(new nlobjSearchColumn('name'));
		templateSColumn.push(new nlobjSearchColumn('custrecord_inv_pdf_logo'));
		templateSColumn.push(new nlobjSearchColumn('custrecord_inv_pdf_layout'));

		var templateSrchObj = nlapiSearchRecord('customrecord_inv_cust_tran_pdf_layout', null, templateSFilter, templateSColumn);
		//nlapiLogExecution('debug','templateSrchObj====>>', templateSrchObj);
		//End : PDF Template Layout Search	
	} 
	
	
	if(_validateData(templateSrchObj))
	{
		var companyInformation = nlapiLoadConfiguration('companyinformation');
		var template 	= templateSrchObj[0].getValue('custrecord_inv_pdf_layout');
		var renderer 	= nlapiCreateTemplateRenderer();
		template 		= template.replace(/<br>/ig, "<br/>");
		template 		= template.replace(/&/g, "&amp;");
		renderer.setTemplate(template); // Passes in raw string of template to be transformed by FreeMarker
		renderer.addSearchResults('templateobj', templateSrchObj);
						
		if(_validateData(paramId) && _validateData(paramType))
		{
			var recordObj 	= nlapiLoadRecord(paramType, paramId);
			var tranid 		= recordObj.getFieldValue('tranid');
			var subsidairy 	= recordObj.getFieldValue('subsidiary');
			
			renderer.addRecord('record', recordObj);
			
			if(_validateData(subsidairy)){
				var subrecordObj = nlapiLoadRecord('subsidiary', subsidairy);
				renderer.addRecord('subsidiary', subrecordObj);
			}
			//renderer.addRecord('subsidiaryObj', recordObj); 
		}
		
		var xml = renderer.renderToString(); // Returns template content interpreted by FreeMarker as XML string that can be passed to the nlapiXMLToPDF function.
		
		xml	= xml.replace(/<br>/ig, "<br/>");
		xml	= xml.replace(/&[^A-Za-z0-9_]/g, "&amp;");
	
		var file = nlapiXMLToPDF(xml);
			
		var pdfFileName = tranid+'.pdf';
		file.setName(pdfFileName);
		response.setContentType('PDF', pdfFileName, 'inline');
		if(paramisemail  == 'T') {
			try{
				//var newAttachment = nlapiCreateFile('pdfFileName', 'PDF', xml);
				//nlapiSendEmail(28377,email, 'PRQ attachment', 'Please see the attached file', null, null, null, file)
			}
			catch(e){
				nlapiLogExecution('debug','ERROR',e)
			}
		}
	
		response.write(file.getValue());
	} 
	
}