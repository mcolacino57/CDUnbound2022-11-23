/*global databaseC,Logger*/
/*exported executeStatus*/
//Logger = BetterLog.useSpreadsheet(ssStatus);

/* 
Before beginning to create a document, this code should run to give a "report" inside
of the ssStatus sheet reflecting what has been done on a given proposal. This should assume 
that the proposal marked as "current" will be the one of interest
*/

const logGetCurrPropID = true;
function getCurrPropID_() {
  var fS = "getCurrPropID";
  var recA = [];
  try {
    var dbInst = new databaseC("applesmysql");
    var locConn = dbInst.getconn(); // get connection from the instance
    var qryS = `SELECT proposals.ProposalID,proposals.ProposalName FROM proposals WHERE proposals.current = true ;`;
    var stmt = locConn.prepareStatement(qryS);
    var results = stmt.executeQuery(qryS);
    var numCols = results.getMetaData().getColumnCount();
    while (results.next()) {  // the resultSet cursor moves forward with next; ends with false when at end
      for (var col = 0; col < numCols; col++) {
        recA.push(results.getString(col + 1));
      }
    }
  } catch (err) {
    logGetCurrPropID ? Logger.log(`In ${fS}: ${err}`) : true;
    return "Problem"
  }
  dbInst.closeconn();
  console.log(recA);
  return recA
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
