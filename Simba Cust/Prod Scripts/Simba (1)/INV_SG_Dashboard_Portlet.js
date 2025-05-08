
function SimbaPortletLinks(portlet, column){
	var content	= '';
	content 	+= '<style>.sg-portlet li{width: 33%;display:inline-block; vertical-align: top; padding: 4px 0px;}</style>';
	portlet.setTitle("Simba Dashboard Shortcuts");	 
	  
	
	var filters = new Array();
	filters.push(new nlobjSearchFilter( 'isinactive', null, 'is', false));

	// Define search columns
	var columns = new Array();
	columns.push(new nlobjSearchColumn('internalid').setSort(false));
	columns.push(new nlobjSearchColumn('name'));
	columns.push(new nlobjSearchColumn('custrecord_inv_sg_db_link'));

	var results = nlapiSearchRecord('customrecord_inv_simba_shortcuts', null, filters, columns);
	
	content 	+= '<ul class="sg-portlet">';
	for(var i = 0; results && i < results.length; i++)
	{
		var name 		= results[i].getValue("name");
		var sglink 		= results[i].getValue("custrecord_inv_sg_db_link");
	
		content 	+= '<li><a href="'+sglink+'" target="_blank">'+name+'</a></li>';
	}
	content 	+= '</ul>';
	portlet.setHtml(content);
}


