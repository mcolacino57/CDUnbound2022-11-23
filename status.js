/*global databaseC,Logger*/
/*exported executeStatus*/
//Logger = BetterLog.useSpreadsheet(ssStatus);

/* 
Before beginning to create a document, this code should run to give a "report" inside
of the ssStatus sheet reflecting what has been done on a given proposal. This should assume 
that the proposal marked as "current" will be the one of interest
*/

const logGetCurrPropID = true;
/**
 * Purpose: Query the proposals table, getting the full record where current=true
 *
 * @return {object[]} recA - array-record from proposals
 */

function getCurrPropID_() {
  var fS = "getCurrPropID";
  var recA = [];
  try {
    var dbInst = new databaseC("applesmysql");
    var recCnt = 0;
    var locConn = dbInst.getconn(); // get connection from the instance
    var qryS = `SELECT proposals.ProposalID,proposals.ProposalName FROM proposals WHERE proposals.current = true ;`;
    var stmt = locConn.prepareStatement(qryS);
    var results = stmt.executeQuery(qryS);
    var numCols = results.getMetaData().getColumnCount();
    while (results.next()) {  // the resultSet cursor moves forward with next; ends with false when at end
      var propID = results.getString("ProposalID");
      var propS = results.getString("ProposalName");
      recCnt++;
    }
    if(recCnt==0 || recCnt>1){
      throw new Error(`In ${fS}, recCnt should be 1 but is ${recCnt}`)
    }
  } catch (err) {
    logGetCurrPropID ? Logger.log(`In ${fS}: ${err}`) : true;
    return false
  }
  dbInst.closeconn();
  logGetCurrPropID ? Logger.log(recA) : true;
  return [propID,propS]
}

function extractPropDetail_(propID) {
  var fS = "extractPropDetail_";
  var recA = [];
  try {
    var dbInst = new databaseC("applesmysql");
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
  //console.log(dataA);
  return dataA
}

function executeStatus() {
  var retA = getCurrPropID_();
  var ret = extractPropDetail_(retA[0]);
  return ret
  // console.log(ret);

}
