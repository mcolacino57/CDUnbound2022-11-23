/*exported testCrFormResponseArray, 
testExamineForm,
testPrintTitlesAndIDs, 
testGetCKThisForm,runTests
 */

/*global fieldS_G , crFormResponseArray, userEmail , logStatusofData, evalProposal , chkMajorPropDetailCategories,getCurrPropID_, FormApp , databaseC ,formID_G ,
UnitTestingApp*/

function testCrFormResponseArray() {
  var f = FormApp.getActiveForm();
  var resp = crFormResponseArray(f);
  console.log(`In testCrFormResponseArray: ${resp}`)
}

// logs all of the titles of items in a form 
function examineForm(form) {
  var fitems = form.getItems();
  for (var j = 0; j < fitems.length; j++) {
    var title = fitems[j].getTitle()
    var id = fitems[j].getId();
    var itemTypeIs = fitems[j].getType();
    var typeS = itemTypeIs.toString();
    console.log(`Item title for: #${j} - ${title} ID: ${id} - type ${typeS}`);
  }
}

function testExamineForm() {
  var f = FormApp.openById(formID_G);
  var ret = examineForm(f);
  return ret
}

function printTitlesAndIDS_(formID) {
  var form = FormApp.openById(formID);
  var items = form.getItems();
  for (var i in items) {
    console.log(items[i].getTitle() + ': ' + items[i].getId() + " / " + items[i].getHelpText());  // HelpText == Description
  }
}

function testPrintTitlesAndIDs() {
  var retS = printTitlesAndIDS_(formID_G);
  console.log(`In testPrintTitlesAndIDs: ${retS}`)
}
/**
 * Purpose: Get clauseKeys for global form
 *
 * @param  {String} param_name - param
 * @param  {itemReponse[]} param_name - an array of responses 
 * @return {String} retS - return value
 */
 function getCKThisForm(dbInst,formName) {
  const fS = "getCKThisForm";
  var resA = [];
  try {
    const locConn = dbInst.getconn(); // get connection from the instance 
    const qryS = `SELECT ClauseKey FROM ck_question WHERE FormName='${formName}';`;
    const stmt = locConn.prepareStatement(qryS);
    const results = stmt.executeQuery(qryS);

    if (!results.last()) {
      // throw new Error(`In ${fS} no results returned for formname ${formName}`)
      return false
    }
    results.beforeFirst(); // reset to beginning
    while (results.next()) { // the resultSet cursor moves forward with next; ends with false when at end
      var resS = results.getString("ClauseKey")
      resA.push(`'${resS}'`)
    }
  } catch (err) {
    const probS = `In ${fS} ${err}`;
    throw new Error(probS)
  }
  return resA
}

/**
 * Purpose: Get all the clauseKeys in this form
 *
 * @param  {String} param_name - param
 * @param  {itemReponse[]} param_name - an array of responses 
 * @return {String} retS - return value
 */
function testGetCKThisForm() {
  var dbInst = new databaseC("applesmysql");
  var retS ="";
  var ret = getCKThisForm(dbInst,"Create Document");
  var l = ret.length;
  for (var j = 0; j < l-1; j++){
    retS=retS+(ret[j]+", ")
}
  retS = retS+ret[l-1];
  fieldS_G==retS ? console.log("fieldS_G equals retS"): console.log("fieldS_G not equal to retS");
  console.log(`In testGetCKThisForm: ${retS}`)
}

function runTests() {
  var dbInst = new databaseC("applesmysql");
  //var form = FormApp.openById(formID_G);
  //var dupePropS = "Tootco at 6 East 45"
  var userS = userEmail;
  var propID = getCurrPropID_(dbInst,userS)[0];
  const test = new UnitTestingApp();
  test.enable(); // tests will run below this line
  test.runInGas(true);
  if (test.isEnabled) {
    test.assert(chkMajorPropDetailCategories(propID), `chkMajorPropDetailCategories -> propID ${propID}`);
    test.assert(logStatusofData(propID), `logStatusofData -> propID ${propID}`);
    test.assert(evalProposal(),`evalProposal -> propID ${propID}`)


  }
}
