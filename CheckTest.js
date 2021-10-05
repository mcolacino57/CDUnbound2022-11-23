/*exported testExamineForm , testPrintTitlesAndIDs, testGetCKThisForm , runTests
 */

/*global  userEmail , logStatusofData, evalProposal , getCKThisForm
chkMajorPropDetailCategories,getCurrPropID_ , FormApp , databaseC , formList ,
UnitTestingApp , databaseNameG , docC , docID , foldID , proposalC*/



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
  var form = formList.find(f => { if(f.short === "CD") return f})

  var f = FormApp.openById(form.id);
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
  var form = formList.find(f => { if(f.short === "CD") return f})

  var retS = printTitlesAndIDS_(form.id);
  console.log(`In testPrintTitlesAndIDs: ${retS}`)
}


/**
 * Purpose: Get all the clauseKeys in this form
 *
 * @param  {String} param_name - param
 * @param  {itemReponse[]} param_name - an array of responses 
 * @return {String} retS - return value
 */
function testGetCKThisForm() {
  var dbInst = new databaseC(databaseNameG);
  var retS ="";
  var ret = getCKThisForm(dbInst,"Create Document");
  var l = ret.length;
  for (var j = 0; j < l-1; j++){
    retS=retS+(ret[j]+", ")
}
  retS = retS+ret[l-1];
  // fieldS_G==retS ? console.log("fieldS_G equals retS"): console.log("fieldS_G not equal to retS");
  console.log(`In testGetCKThisForm: ${retS}`)
}

function runTests() {
  var dbInst = new databaseC(databaseNameG);
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

// eslint-disable-next-line no-unused-vars
function testHandleOver() {
  var dbInst = new databaseC(databaseNameG);
  var docInst = new docC(docID, foldID);
  // eslint-disable-next-line no-undef
  var ret = handleOver(dbInst, docInst);
  docInst.saveAndCloseTemplate();
  dbInst.closeconn()
  return ret
}


// eslint-disable-next-line no-unused-vars
function testHandleExpenses() {
  var dbInst = new databaseC(databaseNameG);
  var docInst = new docC(docID, foldID);
  // eslint-disable-next-line no-undef
  var ret = handleExpenses(dbInst, docInst);
  // Logger.log(ret)
  docInst.saveAndCloseTemplate();
  dbInst.closeconn()
  return ret
}

// eslint-disable-next-line no-unused-vars
function testHandleBR() {
    var dbInst = new databaseC(databaseNameG);
    var propInst = new proposalC(dbInst, "MediaPlus 419 Park Avenue South");
    var docInst = new docC(docID, foldID);
    // eslint-disable-next-line no-undef
    var ret = handleBaseRent(dbInst, docInst, propInst);
    return ret
  
}