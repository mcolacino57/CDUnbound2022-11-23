/*global Logger*/

const logWriteCk_Question = false;

/**
 * Purpose: Take a question and clausekey array from writeAllQuestionsKeys and
 * write it to ck_question table
 *
 * @param {object} dbInst - instance of databaseC
 * @param {object} qcrRec - question and clausekey
 * @return {boolean} t/f - return true or false
 */
// eslint-disable-next-line no-unused-vars
function writeCk_Question(dbInst, qcrRec) {
  var fS = 'writeCk_Question',colS="",rS="",i;
  // database structure; change when ck_question changes  
  // colS = "Question,ClauseKey,ReplStruct,FormName,CreatedBy,CreatedWhen,ModifiedWhen,LastModifiedBy";
  
  var colA = dbInst.getcolumns("ck_question");  // construct column string
  for (i = 0; i < colA.length; i++) { // this structure avoids comma at end
    i < (colA.length - 1) ? colS = colS  + colA[i] + "," : colS = colS + colA[i];
  }

  var valA = Object.values(qcrRec);  // construct value string
  for (i = 0; i < valA.length; i++) { // this structure avoids comma at end
    i < (valA.length - 1) ? rS = rS + "'" + valA[i] + "'," : rS = rS + "'" + valA[i] + "'";
  }
  try {
    var qryS = `INSERT INTO ck_question (${colS}) VALUES(${rS});`;
    logWriteCk_Question ? console.log(`In ${fS} ${qryS}`) : true;
    var locConn = dbInst.getconn(); // get connection from the instance
    var stmt = locConn.prepareStatement(qryS);
    stmt.execute();
  } catch (err) {
    logWriteCk_Question ? Logger.log(`In ${fS}: ${err}`) : true;
    return false;
  }
  return true;
}
