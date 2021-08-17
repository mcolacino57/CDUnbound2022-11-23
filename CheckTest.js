/*exported testCrFormResponseArray, 
testExamineForm,
testPrintTitlesAndIDs, 
testGetClauseKeysThisForm,runTests
 */

/*global fieldS_G , crFormResponseArray, userEmail , logStatusofData, evalProposal , chkMajorPropDetailCategories,getCurrPropID_, FormApp , databaseC, getClauseKeysThisForm ,formID_G ,
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
 * Purpose: Get all the clauseKeys in this form
 *
 * @param  {String} param_name - param
 * @param  {itemReponse[]} param_name - an array of responses 
 * @return {String} retS - return value
 */
function testGetClauseKeysThisForm() {
  var dbInst = new databaseC("applesmysql");
  var retS ="";
  var ret = getClauseKeysThisForm(dbInst);
  var l = ret.length;
  for (var j = 0; j < l-1; j++){
    retS=retS+(ret[j]+", ")
}
  retS = retS+ret[l-1];
  fieldS_G==retS ? console.log("fieldS_G equals retS"): console.log("fieldS_G not equal to retS");
  console.log(`In testGetClauseKeysThisForm: ${retS}`)
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
