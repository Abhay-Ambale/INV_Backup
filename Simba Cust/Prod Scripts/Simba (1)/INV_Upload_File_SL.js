/**
 * 
 * MODULE DESCRIPTION
 * 
 * Version  Date            Author          Remarks
 * 1.00     27 Dec 2018		Supriya G		This script is used to upload the file and set in Communication tab. This is for the role Overseas GM
 * 
 */


function uploadFile_SL(request, response){
	if(request.getMethod() == 'GET'){		
		var id		= request.getParameter('tid');
		var recType	= request.getParameter('recordType');
		nlapiLogExecution('debug', 'param recType', recType);
		
		if(!_validateData(id))
			throw nlapiCreateError('ERROR', 'Missing Parameter', true);
		
		var form	= nlapiCreateForm('Upload File', true);
		//form.setScript('customscript_vst_sale_proforma_inv_ul_cl'); //client script called when filters changed

		var fileField = form.addField('custpage_upload_file', 'file', 'File').setMandatory(true);
		fileField.setHelpText("Upload file", true);
		
		var fldRecType	= form.addField('custpage_rec_type', 'text', 'Record Type').setDisplayType('hidden');
		var fldRecId	= form.addField('custpage_rec_id', 'text', 'Record Id').setDisplayType('hidden');
		
		fldRecType.setDefaultValue(recType);
		fldRecId.setDefaultValue(id);
		
		form.addSubmitButton('Upload');
		response.writePage(form);			
	} else {
		var recType		= request.getParameter('custpage_rec_type');
		var recId 		= request.getParameter('custpage_rec_id');
		var file 		= request.getFile('custpage_upload_file');
		var fileName 	= file.getName();
	
		file.setFolder(690);
		file.setEncoding('UTF-8');

		var fileId = nlapiSubmitFile(file);
		
		nlapiAttachRecord('file', fileId, recType, recId, null);
		
		response.setContentType('HTMLDOC');
		response.write('<!DOCTYPE html><html><head><title>Upload Successful</title></head><body><h3 style="Tahoma,Geneva,sans-serif; font-size: 20px; font-weight:bold; color:#5C7499;">Upload Successful</h3><script type="text/javascript">setTimeout(function() { window.opener.location.reload(); window.close(); }, 1500);</script></body></html>');
	}
}