/**
 * This script is governed by the license agreement located in the script directory.
 * By installing and using this script the end user acknowledges that they have accepted and
 * agree with all terms and conditions contained in the license agreement. All code remains the
 * exclusive property of Klugo Group Ltd and the end user agrees that they will not attempt to
 * copy, distribute, or reverse engineer this script, in whole or in part.
 **/
/**
 * Module Description
 * 
 * Version      Date            Author                Remarks
 * 1.00         05 Nov 2017     Muhammad Zain         Initial commit for common lib. contains common functions used by overall application.
 *
 */


/**
 * Get role information of specified id
 * 
 * @param {any} roleId 
 * @returns 
 */
function getRole (roleId) {
    try {
        var roleFilters = [
            new nlobjSearchFilter('internalid', null, 'anyof', [roleId])
        ];
        var roleColumns = [
            new nlobjSearchColumn('custrecord_kl_shipment_header_land'),
            new nlobjSearchColumn('custrecord_kl_can_update_po_ship_head')
        ];
        var roleData = nlapiSearchRecord('Role', null, roleFilters, roleColumns) || [];
        
        // return first record
        return roleData[0];
    } catch(ex) {
        nlapiLogExecution("ERROR", "common_lib:getRole", ex);
    }
}
