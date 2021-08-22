/**
 * Purpose: Get clauseKeys for form. Throws an error if now results in ck_question
 *
 * @param  {Object} dbInst - instance of databaseC
 * @param  {String} formName - full name of form
 * @return {String} retS - return value or false
 */
// eslint-disable-next-line no-unused-vars
function getCKThisForm(dbInst, formName) {
  const fS = "getCKThisForm";
  var resA = [];
  try {
    const locConn = dbInst.getconn(); // get connection from the instance 
    const qryS = `SELECT ClauseKey FROM ck_question WHERE FormName='${formName}';`;
    const stmt = locConn.prepareStatement(qryS);
    const results = stmt.executeQuery(qryS);

    if (!results.last()) {
      // throw new Error(`In ${fS} no results returned for formname ${formName}`)
      return false;
    }
    results.beforeFirst(); // reset to beginning
    while (results.next()) { // the resultSet cursor moves forward with next; ends with false when at end
      var resS = results.getString("ClauseKey");
      resA.push(`'${resS}'`);
    }
  } catch (err) {
    const probS = `In ${fS} ${err}`;
    throw new Error(probS);
  }
  return resA;
}
