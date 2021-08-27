/*global Logger */
/**
 * Purpose: Write prop_detail record; dbInst and record passed in, using
 * list of columns (colA) as parameter
 *
 * @param  {object} dbInst - instance of databaseC
 * @param  {object} record - prop_detail record
 * @param  {string[]} colA - list of strings representing columns
 * @return {bolean} return true or false
 */
// eslint-disable-next-line no-unused-vars
function writePropDetail(dbInst, record, colA) {
  var fS = 'writePropDetail';
  var colS = "", i;
  try {
    for (i = 0; i < colA.length; i++) { // this structure avoids comma at end
      i < (colA.length - 1) ? colS = colS + colA[i] + "," : colS = colS + colA[i];
    }
    var recA = Object.values(record);
    var rS = "";
    for (i = 0; i < recA.length; i++) { // this structure avoids comma at end
      i < (recA.length - 1) ? rS = rS + "'" + recA[i] + "'" + "," : rS = rS + "'" + recA[i] + "'";
    }
    var qryS = `INSERT INTO prop_detail (${colS}) VALUES(${rS});`;
    var locConn = dbInst.getconn(); // get connection from the instance
    var stmt = locConn.prepareStatement(qryS);
    stmt.execute();
  } catch (err) {
    var problemS = `In ${fS}: ${err}`;
    Logger.log(problemS);
    return false;
  }
  return true;
}
