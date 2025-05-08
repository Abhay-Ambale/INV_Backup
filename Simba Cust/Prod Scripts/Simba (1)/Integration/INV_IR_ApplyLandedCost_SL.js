/**
 * @NApiVersion 2.0
 * @NScriptType Suitelet
*/
/**
 * Module Description
 *
 * Version    Date            Author            Remarks
 * 1.00       18 Nov 2020     Supriya			This script is used to 
 *															
 *
 */
var COMMONFUNC, SEARCH,SERVERWIDGET,RECORD,FORMAT, RUNTIME, REDIRECT, URL;
define(['./INV_Integrations_LIB', 'N/search','N/ui/serverWidget', 'N/record', 'N/runtime', 'N/redirect', 'N/url'], applyLandedCost_SL);

function applyLandedCost_SL(INV_Integrations_LIB, search, serverWidget, record, runtime, redirect, url)
{
	COMMONFUNC 		= INV_Integrations_LIB,
	SEARCH 			= search,
	SERVERWIDGET 	= serverWidget,
	RECORD			= record;
	RUNTIME			= runtime;
	REDIRECT		= redirect;
	URL				= url;
	
	return{
		onRequest: _onRequest
	}
}

function _onRequest(context)
{
	var request			= context.request;
	var shipHeader 		= request.parameters.custpage_shipmentheader;
	var container 		= request.parameters.custpage_container;
	var currency 		= request.parameters.custpage_currency;

	var scriptId 		= RUNTIME.getCurrentScript().id;
	var deploymentId 	= RUNTIME.getCurrentScript().deploymentId;
	var SuiteletURL 	= URL.resolveScript({scriptId: scriptId, deploymentId: deploymentId});
	
	var form 			= SERVERWIDGET.createForm({title : 'Apply Landed Cost'});	
	var fldContainer	= form.addField({id:'custpage_container',label:'Container',type:SERVERWIDGET.FieldType.TEXT});
	fldContainer.setHelpText({help : "Please enter comma seperated Container number here to get the Item Recipt for adding the Landed Cost."});
	
	fldContainer.isMandatory 	= true;	
	fldContainer.defaultValue 	= container;	
	
	if(_validateData(container)){
		var fldCurrency	= form.addField({id:'custpage_currency',label:'Currency',type:SERVERWIDGET.FieldType.SELECT});
		fldCurrency.addSelectOption({value : '',  text : ''});
		fldCurrency.addSelectOption({value : 'loc',  text : 'Local'});
		fldCurrency.addSelectOption({value : 'usd',  text : 'USD'});
		fldCurrency.isMandatory 	= true;
		
		fldContainer.updateDisplayType({displayType : SERVERWIDGET.FieldDisplayType.INLINE });
		
		var fldTotCbm	= form.addField({id:'custpage_totcbm',label:'Select IR Total CBM',type:SERVERWIDGET.FieldType.TEXT}).updateDisplayType({displayType : SERVERWIDGET.FieldDisplayType.HIDDEN });
		
		var sublist 	= form.addSublist({id : 'custpage_irlist',type : SERVERWIDGET.SublistType.LIST,label : 'Item Receipts'});
		sublist.addMarkAllButtons();
		sublist.addField({id:'custpage_select',	label:'Select', type:SERVERWIDGET.FieldType.CHECKBOX});
		sublist.addField({id:'custpage_irno', label:'Item Receipt', type:SERVERWIDGET.FieldType.SELECT, source:'transaction'}).updateDisplayType({displayType : SERVERWIDGET.FieldDisplayType.INLINE });
		sublist.addField({id:'custpage_pono', label:'Purchase Order', type:SERVERWIDGET.FieldType.SELECT, source:'transaction'}).updateDisplayType({displayType : SERVERWIDGET.FieldDisplayType.INLINE });
		sublist.addField({id:'custpage_suplier', label:'Supplier', type:SERVERWIDGET.FieldType.SELECT, source:'vendor'}).updateDisplayType({displayType : SERVERWIDGET.FieldDisplayType.INLINE });
		sublist.addField({id:'custpage_subsid', label:'Subsidiary', type:SERVERWIDGET.FieldType.TEXT});
		sublist.addField({id:'custpage_shipheader', label:'Shipment Header', type:SERVERWIDGET.FieldType.TEXT});
		sublist.addField({id:'custpage_containerno', label:'Container #', type:SERVERWIDGET.FieldType.TEXT});
		sublist.addField({id:'custpage_ircbm',	label:'Total CBM', type:SERVERWIDGET.FieldType.TEXT});
		
		var line 	= 0;
		var totCbm 	= 0;
		var irSearchObj 	= _searchItemReceiptList(container);
		irSearchObj.run().each(function(result){
			var lineCbm = result.getValue({name: "custcol_inv_cbm", summary: "SUM"});
			
			sublist.setSublistValue({id:'custpage_irno', line:line, value: result.getValue({name: "internalid", summary: "GROUP"})});
			sublist.setSublistValue({id:'custpage_pono', line:line, value: result.getValue({name: "internalid", summary: "GROUP", join: "createdFrom"})});
			sublist.setSublistValue({id:'custpage_suplier', line:line, value: result.getValue({name: "internalid", summary: "GROUP", join: "vendor"})});
			sublist.setSublistValue({id:'custpage_subsid', line:line, value: result.getValue({name: "subsidiarynohierarchy", summary: "GROUP"})});
			sublist.setSublistValue({id:'custpage_shipheader', line:line, value: result.getValue({name: "subsidiarynohierarchy", summary: "GROUP"})});
			sublist.setSublistValue({id:'custpage_shipheader', line:line, value: result.getText({name: "custbody_kl_shipment_header", summary: "GROUP"})});
			sublist.setSublistValue({id:'custpage_containerno', line:line, value: result.getValue({name: "custrecord_os_sh_containernum", summary: "GROUP", join: "custbody_kl_shipment_header"})});
			sublist.setSublistValue({id:'custpage_ircbm', line:line, value: Number(result.getValue({name: "custcol_inv_cbm", summary: "SUM"}))});
			
			//totCbm = Number(totCbm) + Number(result.getValue({name: "custcol_inv_cbm", summary: "SUM"}));
			line++;
			return true;		  
		});
		//fldTotCbm.defaultValue 	= totCbm;
		
		var tabid = form.addTab({id : 'tabid',  label : 'Tab'});
		var lcSublist = form.addSublist({id:'custpage_lclist', type:SERVERWIDGET.SublistType.LIST, label:'Landed Cost Category', tab:'tabid'});
		lcSublist.addField({id:'custpage_costcatid', label:'Cost Category', type:SERVERWIDGET.FieldType.TEXT}).updateDisplayType({displayType : SERVERWIDGET.FieldDisplayType.HIDDEN });
		lcSublist.addField({id:'custpage_costcat', label:'Cost Category', type:SERVERWIDGET.FieldType.TEXT});
		lcSublist.addField({id:'custpage_amount', label:'Amount', type:SERVERWIDGET.FieldType.CURRENCY}).updateDisplayType({displayType : SERVERWIDGET.FieldDisplayType.ENTRY });
		
		var ccline 	= 0;
		var costCatSrchObj 	= _searchCostCategory();
		costCatSrchObj.run().each(function(result){
			lcSublist.setSublistValue({id:'custpage_costcatid', line:ccline, value: result.getValue({name: "internalid"})});
			lcSublist.setSublistValue({id:'custpage_costcat', line:ccline, value: result.getValue({name: "name"})});			
			ccline++;
			return true;		  
		});
		
		// Create an Array for landed Cost Category and its entered amount
		var sublistId		= 'custpage_lclist';
		var costCatArr		= [];
		var selCostCatArr 	= [];
		var lineCount 		= request.getLineCount({group : sublistId});
		for(var i = 0; i < lineCount; i++) {
			var costCatId	= request.getSublistValue({group:sublistId, name: 'custpage_costcatid',line: i});
			var amount 		= request.getSublistValue({group:sublistId, name: 'custpage_amount',line: i});			
			
			if(_validateData(amount)){
				selCostCatArr.push(costCatId);
				costCatArr[costCatId] = Number(amount);
			}
		}
		
		// calculate the Total CBM for selected line
		var totCbm			= '';
		var sublistId		= 'custpage_irlist';
		var irCostCatArr	= [];		
		var lineCount 		= request.getLineCount({group : sublistId});
		for(var i = 0; i < lineCount; i++) {
			var isSelect 	= request.getSublistValue({group:sublistId, name: 'custpage_select',line: i});
			var irCbm 		= request.getSublistValue({group:sublistId, name: 'custpage_ircbm',line: i});			
			if(isSelect == 'T'){
				totCbm 		= Number(totCbm) + Number(irCbm);
			}
		}
		fldTotCbm.defaultValue 	= totCbm; // Set total CBM
		
		// Create an Array for selected IR and its Landed Cost based on IR CBM
		for(var i = 0; i < lineCount; i++) {
			var isSelect 	= request.getSublistValue({group:sublistId, name: 'custpage_select',line: i});
			var internalid 	= request.getSublistValue({group:sublistId, name: 'custpage_irno',line: i});
			var irCbm 		= request.getSublistValue({group:sublistId, name: 'custpage_ircbm',line: i});
			//log.debug("isSelect = "+isSelect, internalid);			
			
			if(isSelect == 'T'){				
				var costCatAmtArr 	= [];
				costCatArr.forEach(function(val, key) {
					var irLandedCostAmt = (Number(val) * Number(irCbm)) / Number(totCbm);
					irLandedCostAmt 	= irLandedCostAmt.toFixed(2);					
					costCatAmtArr.push({'costCatId':key, 'landedCostAmt': Number(irLandedCostAmt)});					
				});
				
				irCostCatArr.push({'irId': internalid, 'irCbm':Number(irCbm), 'landedCost':costCatAmtArr});
			}
		}
		log.debug("========= irCostCatArr = ", irCostCatArr);
		
		// if IR selected and Landed Cost amount entered calculate and set the landed cost for each line of Item Receipt
		if(irCostCatArr.length > 0){
			log.debug("irCostCatArr length = "+irCostCatArr.length, irCostCatArr);			
			irCostCatArr.forEach(function(rs) {
				var rsLandedCost = rs.landedCost;						
				var irObj 		= RECORD.load({type: RECORD.Type.ITEM_RECEIPT, id:rs.irId, isDynamic: false});
				var exchngRate	= irObj.getValue({fieldId:'exchangerate'});
				var lineCount 	= irObj.getLineCount({sublistId: 'item'});
				
				//irObj.setValue({fieldId: 'landedcostperline', value: true});
				for(var i=0; i<lineCount; i++){
					var lineTotalLC = 0;
					var itemCbm 	= irObj.getSublistValue({sublistId: 'item', fieldId: 'custcol_inv_cbm', line: i});
					log.debug("itemCbm i "+i, itemCbm);
					
					if(_validateData(itemCbm) && Number(itemCbm) >0){
						// Retrieve the subrecord.
						var landedCost 	= irObj.getSublistSubrecord({sublistId: 'item', fieldId: 'landedcost',line: i});		
						var landCostCnt = landedCost.getLineCount({sublistId: 'landedcostdata'});
						//log.debug("--- landCostCnt ", landCostCnt);
						
						if(landCostCnt >0){
							for (var r = landCostCnt-1; r >= 0; r--) {							
								var extCatId 	= landedCost.getSublistValue({sublistId: 'landedcostdata', fieldId: 'costcategory', line: r});
								var catamount 	= landedCost.getSublistValue({sublistId: 'landedcostdata', fieldId: 'amount', line: r});
								if(selCostCatArr.indexOf(extCatId) != -1){									
									landedCost.removeLine({sublistId: 'landedcostdata', line: r});
								}
								else{
									lineTotalLC = Number(lineTotalLC) + Number(catamount);
								}
							}
						}
						
						
						var l = landedCost.getLineCount({sublistId: 'landedcostdata'});
						rsLandedCost.forEach(function(lc) {
							var itemLandedCost = (Number(lc.landedCostAmt) * Number(itemCbm)) / Number(rs.irCbm);
							if(currency == 'loc'){
								itemLandedCost = Number(itemLandedCost) / Number(exchngRate);
							}
							
							itemLandedCost	= itemLandedCost.toFixed(2);
							lineTotalLC		= Number(lineTotalLC) + Number(itemLandedCost);
							//log.debug("set rs IR costCatId "+lc.costCatId, 'IR landedCostAmt='+lc.landedCostAmt+' itemLandedCost='+itemLandedCost);	
													
							landedCost.setSublistValue({sublistId: 'landedcostdata', fieldId: 'costcategory', line: l, value: lc.costCatId});
							landedCost.setSublistValue({sublistId: 'landedcostdata', fieldId: 'amount',	line: l, value: Number(itemLandedCost)});
							l++;
						});
						
						irObj.setSublistValue({sublistId: 'item', fieldId: 'custcol_inv_line_total_landed_cost', value: Number(lineTotalLC), line: i});
					}
				}
				
				try {
					var recId = irObj.save();
					log.debug({title: 'Record updated successfully', details: 'IR Id: ' + recId});

				} catch (e) {
					log.error({title: e.name, details: e.message});
				}		
			});
			
			REDIRECT.toSuitelet({scriptId: scriptId , deploymentId: deploymentId});
		}
	}		
	
	form.clientScriptModulePath = './INV_IR_ApplyLandedCost_CL.js';
	form.addSubmitButton({label : 'Submit'});
	//form.addResetButton({label : 'Reset'});
	form.addButton({id:'custombutton_reset', label:'Reset', functionName:"onClickReset('"+scriptId+"','"+deploymentId+"');"});
	context.response.writePage(form);
}

function _searchCostCategory()
{
	var costCatSrchObj	= '';
	try{
		costCatSrchObj 	= SEARCH.create({
						   type: "costcategory",
						   filters:
						   [
							  ["isinactive","is","F"]
						   ],
						   columns:
						   [
							  SEARCH.createColumn({name: "internalid", label: "Internal ID"}),
							  SEARCH.createColumn({name: "name", sort: SEARCH.Sort.ASC, label: "Name"})							 
						   ]
						});
		var resultCount = costCatSrchObj.runPaged().count;
		log.debug("costCatSrchObj result count", resultCount);
		
	}catch (e) {
		log.error({title: 'Error In _searchCostCategory: '+e.name, details: e.message});
		
	}
	
	return costCatSrchObj;
}

function _searchItemReceiptList(container)
{
	var irSrchObj	= '';	
	var filters		= [];
	var containerFilterArr = [];
	try{
		var containerArr = container.split(',');		
		for(var c=0; c<containerArr.length; c++){
			containerFilterArr.push(["custbody_kl_shipment_header.custrecord_os_sh_containernum","is", containerArr[c].trim()]);
			if(c < (containerArr.length)-1){
				containerFilterArr.push("OR")
			}
		}
				
		filters.push(["type","anyof","ItemRcpt"]);
		filters.push('AND');
		filters.push(["mainline","is","F"]);
		filters.push('AND');
		filters.push(containerFilterArr);
			
		irSrchObj 	= SEARCH.create({
						   type: "itemreceipt",
						   filters:
						   [
							  filters
						   ],
						   columns:
						   [
							  SEARCH.createColumn({name: "internalid", summary: "GROUP", label: "internalid"}),
							  SEARCH.createColumn({name: "trandate", summary: "GROUP", label: "Date"}),
							  SEARCH.createColumn({name: "mainname", summary: "GROUP", sort: SEARCH.Sort.ASC, label: "Main Line Name"}),
							  SEARCH.createColumn({name: "tranid", summary: "GROUP", label: "Document Number"}),
							  SEARCH.createColumn({name: "createdfrom", summary: "GROUP", label: "Created From"}),
							  SEARCH.createColumn({name: "internalid", summary: "GROUP", join: "createdFrom", label: "Internal ID"}),
							  SEARCH.createColumn({name: "internalid", summary: "GROUP", join: "vendor", label: "Internal ID"}),
							  SEARCH.createColumn({name: "subsidiarynohierarchy", summary: "GROUP", label: "Subsidiary (no hierarchy)"}),							 
							  SEARCH.createColumn({name: "custbody_kl_shipment_header", summary: "GROUP", sort: SEARCH.Sort.ASC, label: "Shipment Header"}),							  
							  SEARCH.createColumn({name: "custrecord_os_sh_containernum", summary: "GROUP", join: "custbody_kl_shipment_header", sort: SEARCH.Sort.ASC, label: "Container #"}),
							  SEARCH.createColumn({name: "custcol_inv_cbm", summary: "SUM", label: "CBM"})
						   ]
						});
		var resultCount = irSrchObj.runPaged().count;
		log.debug("irSrchObj result count", resultCount);
		
	}catch (e) {
		log.error({title: 'Error In _searchItemReceiptList: '+e.name, details: e.message});
		
	}
	
	return irSrchObj;	
}

/* function _onRequest(context)
{
	var irId = 1508809;
	var irObj 		= RECORD.load({type: RECORD.Type.ITEM_RECEIPT, id:irId, isDynamic: false});			
	var lineCount 	= irObj.getLineCount({sublistId: 'item'});
	log.debug("lineCount = ", lineCount);
	
	//irObj.setValue({fieldId: 'landedcostperline', value: true});
	//for(var i=0; i<1; i++){
		// Select the sublist and line.
		//irObj.selectLine({sublistId: 'item', line: i});
		
		// Retrieve the subrecord.
		var landedCost = irObj.getSublistSubrecord({sublistId: 'item', fieldId: 'landedcost',line: 0});				
		landedCost.setSublistValue({
			sublistId: 'landedcostdata',
			fieldId: 'costcategory',
			line: 0,
			value: 1
		});

		landedCost.setSublistValue({
			sublistId: 'landedcostdata',
			fieldId: 'amount',
			line: 0,
			value: 10
		})
		
		
	//}
	
	try {
		var recId = irObj.save();
		log.debug({title: 'Record updated successfully', details: 'Id: ' + recId});

	} catch (e) {
		log.error({title: e.name, details: e.message});
	}
} */

/* function _onRequest(context)
{
	var irId = 1508810;
	var irObj 		= RECORD.load({type: RECORD.Type.ITEM_RECEIPT, id:irId, isDynamic: true});			
	var lineCount 	= irObj.getLineCount({sublistId: 'item'});
	log.debug("lineCount = ", lineCount);
	
	//irObj.setValue({fieldId: 'landedcostperline', value: true});
	for(var i=0; i<1; i++){
		// Select the sublist and line.
		irObj.selectLine({sublistId: 'item', line: i});
		
		// Retrieve the subrecord.
		var landedCostSubrecord = irObj.getCurrentSublistSubrecord({sublistId: 'item', fieldId: 'landedcost'});				
		landedCostSubrecord.selectLine({sublistId: 'landedcostdata', line: 0});
		//landedCostSubrecord.insertLine({sublistId: 'landedcostdata', line: 0});
		landedCostSubrecord.setCurrentSublistValue({sublistId:'landedcostdata ', fieldId:'costcategory', value:1});
		landedCostSubrecord.setCurrentSublistValue({sublistId:'landedcostdata ', fieldId:'amount', value:222});		
		landedCostSubrecord.commitLine({sublistId:'landedcostdata'});  // Save the subrecord's sublist line.
		
		// Save the item sublist line that contains the subrecord.
		irObj.commitLine({sublistId: 'item'});
	}
	
	try {
		var recId = irObj.save();
		log.debug({title: 'Record updated successfully', details: 'Id: ' + recId});

	} catch (e) {
		log.error({title: e.name, details: e.message});
	}
} */