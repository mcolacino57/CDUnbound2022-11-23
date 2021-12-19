/*global Logger , dbInstG  */
/*exported executeStatus,getCurrPropID_s*/
//Logger = BetterLog.useSpreadsheet(ssStatus);

/* 
Before beginning to create a document, this code should run to give a "report" inside
of the ssStatus sheet reflecting what has been done on a given proposal. This should assume 
that the proposal marked as "current" will be the one of interest
*/
/**
 * Purpose: Get current proposal for this user, and return the proposal id if there is
 * one that's current, or false if there aren't any
 *
 * @param  {object} dbInst- instance of databaseC
 * @param  {string} userS - current user 
 * @return {string} propID - prop ID string or false
 */

 const logGetCurrPropID = false;
 function getCurrPropID_(dbInst, userS) {
   var fS = "getCurrPropID";
   var propID = "";
   var propNameS = "";
   var rowCount = 0;
   try {
     var locConn = dbInst.getconn(); // get connection from the instance
     var qryS = `SELECT proposals.ProposalID,proposals.ProposalName FROM proposals WHERE proposals.current = true AND proposals.CreatedBy = '${userS}';`;
     var stmt = locConn.prepareStatement(qryS);
     var results = stmt.executeQuery(qryS);
     while (results.next()) {  // the resultSet cursor moves forward with next; ends with false when at end
       propID = results.getString("ProposalID");
       propNameS = results.getString("ProposalName");
       rowCount++;
       if (rowCount > 1) {
         throw new Error(`more than one proposal marked current`);
       }
     }
   } catch (err) {
     const probS = `In ${fS}: ${err}`;
     logGetCurrPropID ? Logger.log(probS) : true;
     throw new Error(probS) // send up to calling function
   }
   logGetCurrPropID ? console.log(`In ${fS} propID: ${propID}`) : true;
   if (propID === "") {
     return [false, false]
   }
   else {
     return [propID, propNameS]
   }
 }

function extractPropDetail_(propID) {
  var fS = "extractPropDetail_";
  var recA = [];
  const dbInst = dbInstG;
  try {
    var locConn = dbInst.getconn(); // get connection from the instance
    var qryS = `SELECT section,ProposalQuestion,ProposalAnswer FROM prop_detail_ex WHERE prop_detail_ex.ProposalID = '${propID}' ORDER BY section;`;
    var stmt = locConn.prepareStatement(qryS);
    var results = stmt.executeQuery(qryS);
    var numCols = results.getMetaData().getColumnCount();
    var dataA = [];
    while (results.next()) {  // the resultSet cursor moves forward with next; ends with false when at end
      recA = [];
      for (var col = 0; col < numCols; col++) {
        recA.push(results.getString(col + 1));
      }
      Logger.log(recA);
      dataA.push(recA);
    }
  } catch (err) {
    logGetCurrPropID ? Logger.log(`In ${fS}: ${err}`) : true;
    return "Problem"
  }
  dbInst.closeconn();
  return dataA
}

function executeStatus() {
  var retA = getCurrPropID_();
  var ret = extractPropDetail_(retA[0]);
  return ret

}
