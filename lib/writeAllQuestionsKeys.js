/*global dbInstG,crFormKeyArray,formList,userEmail,todayS,nowS,writeCk_Question */
/************************ FORM PREP ******************************************************* */
/**
 * Purpose: Run this function to populate the ck_question table; this should be run
 * whenever a new question is added to the form; START HERE, and use emptyCk_Question if needed
 * to empty out the ck_question table
 *
 * @param  {string} formName - full name of form
 * @return {boolean} t/f - return true or false
 */
// eslint-disable-next-line no-unused-vars
function writeAllQuestionsKeys(formName) {
  var fS = 'writeAllQuestionsKeys';
  const dbInst = dbInstG;
  var form = formList.find(f => {
    if (f.name === formName)
      return f;
  });
  try {
    var qcrA = crFormKeyArray(form.id); // this is specific to the particular form and needs changing in other formUtils
    if (qcrA) {
      qcrA.forEach(r => {
        var qcrRec = {
          'Question': r.question,
          'ClauseKey': r.clausekey,
          'ReplStruct': r.replacement,
          'FormName': form.name,
          'CreatedBy': userEmail,
          'CreatedWhen': todayS,
          'ModifiedWhen': nowS,
          'ModifiedBy': userEmail
        };
        var ret = writeCk_Question(dbInst, qcrRec);
        if (!ret) { throw new Error(`In ${fS}: problem with ${qcrA.qustion}`); }
      });
    }
  } catch (err) {
    console.log(`In ${fS}: ${err}`);
    return false;
  }
  return true;
}
