/**
 * Purpose: client side calls to get readiness information f
 * or a given proposal ID
 * by querying _prop_detail_ based on the id and sub query of ck_repl
 *
 * @param  {object} dbInst - instance of databaseC
 * @param  {string} proposalID - an array of responses
 * @return {object[]} resA - return array of objects
 * Format of returned array of objects:
 *
 * clausekeys and answers
 */
const disp_clientGetCDData = false;
// eslint-disable-next-line no-unused-vars
function clientGetCDData(proposalNameS) {
  var fS = "clientGetCDData";
  disp_clientGetCDData ? Logger.log(`In ${fS} proposalNameS is ${proposalNameS}`) : true;
  var resA = [];
  try {
    const dbInst = dbInstG;
    // extract id from name
    // var propInst = new proposalC(dbInst, proposalNameS);
    // var proposalID = propInst.getID();
    const locConn = dbInst.getconn(); // get connection from the instance


    // this select statement cannont have the databasename hard wired in
    // fixed 2022-11-23
    const dbName = dbInst.getdb();
    const qryS = `SELECT ProposalClauseKey, ProposalAnswer, section FROM ${dbName}.prop_detail_ex where ProposalName like "${proposalNameS}" 
      order by section;`;
    const stmt = locConn.prepareStatement(qryS);
    const results = stmt.executeQuery(qryS);
    Logger.log(`in ${fS}: qry is ${qryS}`);
    results.beforeFirst(); // reset to beginning
    while (results.next()) { // the resultSet cursor moves forward with next; ends with false when at end
      var ans = results.getString("ProposalAnswer");
      var ck = results.getString("ProposalClauseKey");
      var sect = results.getString("section");
      var retObj = {
        'ans': ans,
        'clause': ck,
        "sect": sect
      };
      resA.push(retObj);
    }
  } catch (err) {
    var probS = `In ${fS} error ${err}`;
    Logger.log(probS);
    throw new Error(probS);
  }
  var stringR = JSON.stringify(resA);
  disp_clientGetCDData ? Logger.log(`In ${fS} resA: ${stringR}`) : true;
  return resA;
}
