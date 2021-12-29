/*exported testExamineForm , testPrintTitlesAndIDs, testGetCKThisForm , runTests
 */

/*global  userEmail , logStatusofData, evalProposal , getCKThisForm
chkMajorPropDetailCategories,getCurrPropID_   , dbInstG ,
UnitTestingApp  , docC , docID , foldID , proposalC , handleTenAndPrem , checkZeroValue ,
onHtmlSubmit */

// eslint-disable-next-line no-unused-vars
function testEvalProposal() {
  const dbInst = dbInstG;
  var ret = evalProposal(dbInst);
  console.log(ret);
}

// eslint-disable-next-line no-unused-vars
function testHandleTenAndPrem() {
  const dbInst = dbInstG;
  const docInst = new docC(docID, foldID);
  var ret = handleTenAndPrem(dbInst, docInst, "Tenant X Downtown", "M");
  console.log(ret);
}

/**
 * Purpose: Get all the clauseKeys in this form
 *
 * @param  {String} param_name - param
 * @param  {itemReponse[]} param_name - an array of responses 
 * @return {String} retS - return value
 */
function testGetCKThisForm() {
  const dbInst = dbInstG;
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
  const dbInst = dbInstG;
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
  const dbInst = dbInstG;
  var docInst = new docC(docID, foldID);
  // eslint-disable-next-line no-undef
  var ret = handleOver(dbInst, docInst);
  docInst.saveAndCloseTemplate();
  dbInst.closeconn()
  return ret
}

// eslint-disable-next-line no-unused-vars
function testOnHtmlSubmit() {
  // eslint-disable-next-line no-unused-vars
  var ret = onHtmlSubmit({});
}


// eslint-disable-next-line no-unused-vars
function testHandleExpenses() {
  const dbInst = dbInstG;
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
  const dbInst = dbInstG;
    var propInst = new proposalC(dbInst, "MediaPlus 419 Park Avenue South");
    var docInst = new docC(docID, foldID);
    // eslint-disable-next-line no-undef
    var ret = handleBaseRent(dbInst, docInst, propInst);
    return ret
  
}

// eslint-disable-next-line no-unused-vars
function testReadInClausesFromTable() {
  const dbInst = dbInstG;
  // eslint-disable-next-line no-undef
  var ret = readInClausesFromTable(dbInst);
  console.log(JSON.stringify(ret));

}

// eslint-disable-next-line no-unused-vars
function testZeroValue() {
  
  var ret = checkZeroValue("")
  console.log(ret);
  ret = checkZeroValue("0")
  console.log(ret);
  ret = checkZeroValue("0.0")
  console.log(ret);
  ret = checkZeroValue(undefined)
  console.log(ret);
  ret = checkZeroValue("text")
  console.log(ret);
  ret = checkZeroValue("0.00")
  console.log(ret);
   ret = checkZeroValue("3.00")
  console.log(ret);
   ret = checkZeroValue("3")
  console.log(ret);
   ret = checkZeroValue("3.")
  console.log(ret);

}