/*global getCKThisForm , dbInstG,Logger  */
/**
 * Purpose: Delete all records from ck_question related to the clausekeys
 * associated with the operating expenses form
 *
 * @param  {String} param_name - param
 * @param  {itemReponse[]} param_name - an array of responses
 * @return {String} retS - return value
 */
 const logEmptyCk_Question = false;

// eslint-disable-next-line no-unused-vars
function emptyCk_Question(formName) {
  var fS = "emptyCk_Question";
  const dbInst = dbInstG;
  var fgs = getCKThisForm(dbInst, formName);
  if (!fgs)
    return true; // already empty

  try {
    var qryS = `Delete from ck_question where ClauseKey in (${fgs});`;
    logEmptyCk_Question ? console.log(qryS) : true;
    var locConn = dbInst.getconn(); // get connection from the instance
    var stmt = locConn.prepareStatement(qryS);
    stmt.execute();
  } catch (e) {
    logEmptyCk_Question ? Logger.log(`In ${fS}: ${e}`) : true;
    return false;
  }
  dbInst.closeconn();
  return true;
}
