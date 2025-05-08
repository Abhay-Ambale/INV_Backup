/**
* @NApiVersion 2.x
* @NScriptType Restlet
*/

/* 
Name:
Simba File Cabinet API

ID:
customscript_simba_filecabinetapi

Description:
RESTlet to enable RPC-style API calls to NetSuite File Cabinet.
*/

var 
	file,	
	log,
	query,
	record;

define( [ 'N/file', 'N/log', 'N/query', 'N/record' ], main );

function main( fileModule, logModule, queryModule, recordModule ) {

	file = fileModule;
	log = logModule;
	query = queryModule;
	record = recordModule;
	
    return {
        post: postProcess
    }

}


function postProcess( request ) {

	if ( ( typeof request.function == 'undefined' ) || ( request.function == '' ) ) {
		return { 'error': 'No function specified.' }
	}	
	
	switch ( request.function ) {
	
		case 'fileCreate':
			return fileCreate( request )
			break;		
			
		case 'fileEnumerationsGet':
			return file;
			break;
			
		case 'fileGet':
			return fileGet( request )
			break;						
			
		case 'folderCreate':
			return folderCreate( request )
			break;
			
		default:
			var response = { 'error': 'Unsupported Function' }
			return response;
	
	}

}  


function fileCreate( request ) {

	// Validate the request.
	if ( typeof request.name == 'undefined' ) {
		return { 'error': 'No name specified.' }
	}	
	if ( typeof request.fileType == 'undefined' ) {
		return { 'error': 'No fileType specified.' }
	}			
	if ( typeof request.contents == 'undefined' ) {
		return { 'error': 'No content specified.' }
	}	
	if ( typeof request.description == 'undefined' ) {
		return { 'error': 'No description specified.' }
	}		
	if ( typeof request.encoding == 'undefined' ) {
		return { 'error': 'No encoding specified.' }
	}	
	if ( typeof request.folderID == 'undefined' ) {
		return { 'error': 'No folderID specified.' }
	}
	if ( typeof request.isOnline == 'undefined' ) {
		return { 'error': 'No isOnline specified.' }
	}	
		
	// Create the file.
	try {
	
		var fileObj = file.create( 
			{
				name: request.name,
				fileType: request.fileType,
				contents: request.contents,
				description: request.description,
				encoding: request.encoding,
				folder: request.folderID,
				isOnline: request.isOnline
    		} 
		);
		
		// Save the file and get its ID.
		var fileID = fileObj.save();
		
		// Load the file.
		fileObj = file.load( { id: fileID } );
		
		// Create the response.
		var response = {};
		response['info'] = fileObj;
		response['content'] = fileObj.getContents();	

		return response;				
		
	} catch (e) {		
		return { 'error': e }			
	}	
	
}


function fileGet( request ) {

	// Check file ID.
	if ( typeof request.fileID == 'undefined' ) {
		return { 'error': 'No fileID specified.' }
	}	
		
	// Load the file.
	try {
	
		var fileObj = file.load( { id: request.fileID } );
		
		// Create the response.
		var response = {};
		response['info'] = fileObj;
		response['content'] = fileObj.getContents();	

		return response;				
		
	} catch (e) {		
		return { 'error': e }			
	}	
	
}


function folderCreate( request ) {	

	// Check folder name.
	if ( typeof request.name == 'undefined' ) {
		return { 'error': 'No name specified.' }
	}

	// Create the folder record.
	var objRecord = record.create(
		{
			type: record.Type.FOLDER,
			isDynamic: true
		}
	);
	
	// Set the folder name.
	objRecord.setValue( { fieldId: 'name', value: request.name } );
	
	// Check IF subfolder.
	if ( typeof request.parent !== 'undefined' ) {
		objRecord.setValue( { fieldId: 'parent', value: request.parent } );
	}
	
	// Save the record.
	var folderId = objRecord.save();
	
	// Get the record.
	result = record.load( { type: record.Type.FOLDER, id: folderId, isDynamic: false } );
	
	return result;

}