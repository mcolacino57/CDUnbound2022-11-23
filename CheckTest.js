/*exported testExamineForm , testPrintTitlesAndIDs, testGetCKThisForm , runTests
 */

/*global logStatusofData, evalProposal , getCKThisForm , propDetailC
chkMajorPropDetailCategories    , dbInstG , incPropName ,
UnitTestingApp , docC , docID , foldID , proposalC  , checkZeroValue ,
onHtmlSubmit  , ckLocalSectionAC  , difference  */
// foldID, docID in cdCode.js

// eslint-disable-next-line no-unused-vars
function testIncPropName() {
  var ret;
  ret = incPropName("Test Proposal");
  console.log(ret);
  ret = incPropName("Test Proposal-001");
  console.log("001 "+ret)
  ret = incPropName("Test Proposal-009");
  console.log("009 "+ ret)
  ret = incPropName("Test Proposal-099");
  console.log("099 " + ret)
  ret = incPropName("Test Proposal-500");
  console.log("500 "+ ret)
  ret = incPropName("Test Proposal-999");
  console.log("0999 "+ ret)

}

function testLogStatusofData(){
  const propID = "41512512-247f-11ec-a0c2-42010a800006"; // Tenant X Downtown
  var ret = logStatusofData(propID);
  console.log(`In testLogStatusofData ret is ${ret} `);
}

// eslint-disable-next-line no-unused-vars
function testExpckSectionAC() {
  const ckLocalSectionInst = new ckLocalSectionAC();
  const getExpA = new Set(ckLocalSectionInst.getExpA("New York")); 
  const constExpA = new Set(['oePerInc', 'retBaseYear', 'elecDirect', 'elecSubmeter', 'elecRentInc', 'elecRentIncCharge']); // missing 'oeBaseYear' for testing purposes
  const res = difference(getExpA, constExpA);
  const resA =  JSON.stringify(Array.from(res.values()))
  console.log(`and result is ${resA}`)

}
// eslint-disable-next-line no-unused-vars
function testParkckSectionAC() {
  const ckLocalSectionInst = new ckLocalSectionAC();
  console.log(`park array for New York ${ckLocalSectionInst.getParkA("New York")}`)
  console.log(`park array for Los Angeles ${ckLocalSectionInst.getParkA("Lost Angeles")}`)
  return true
}


/* This tests the proposal detail class and creates an instance, using Ember at 25th proposal ID*/
// eslint-disable-next-line no-unused-vars
function testPropDetailA(dbInst, propID) {
  const propDetailInst = new propDetailC(dbInst, propID); // ember at 25th
  console.log(`In testPropDetail ${JSON.stringify(propDetailInst)}`);
  return true
}

// eslint-disable-next-line no-unused-vars
function testEvalProposal() {
  const dbInst = dbInstG;
  var ret = evalProposal(dbInst);
  console.log(ret);
}

// // eslint-disable-next-line no-unused-vars
// function testHandleTenAndPrem() {
//   const dbInst = dbInstG;
//   const docInst = new docC(docID, foldID);
//   var ret = handleTenAndPrem(dbInst, docInst, "Tenant X Downtown", "M");
//   console.log(ret);
// }

/**
 * Purpose: Get all the clauseKeys in this form
 *
 * @param  {String} param_name - param
 * @param  {itemReponse[]} param_name - an array of responses 
 * @return {String} retS - return value
 */
function testGetCKThisForm() {
  const dbInst = dbInstG;
  var retS = "";
  var ret = getCKThisForm(dbInst, "Create Document");
  var l = ret.length;
  for (var j = 0; j < l - 1; j++) {
    retS = retS + (ret[j] + ", ")
  }
  retS = retS + ret[l - 1];
  // fieldS_G==retS ? console.log("fieldS_G equals retS"): console.log("fieldS_G not equal to retS");
  console.log(`In testGetCKThisForm: ${retS}`)
}

function runTests() {
  const dbInst = dbInstG;
  // var userS = userEmail;
  // var propID = getCurrPropID_(dbInst,userS)[0];
  const test = new UnitTestingApp();
  const propID = "41512512-247f-11ec-a0c2-42010a800006"; // for testing use Downtown Tenant X
  test.enable(); // tests will run below this line
  test.runInGas(true);
  if (test.isEnabled) {
    test.assert(testPropDetailA(dbInst, propID), `testPropDetail -> propID ${propID} `);
    test.assert(chkMajorPropDetailCategories(propID), `chkMajorPropDetailCategories -> propID ${propID}`);
    test.assert(logStatusofData(propID), `logStatusofData -> propID ${propID}`);
    test.assert(testEvalProposal(), `evalProposal -> propID ${propID}`);
    test.assert(testExpckSectionAC(),'testExpckSectionAC')

  }
}

// // eslint-disable-next-line no-unused-vars
// function testHandleOver() {
//   const dbInst = dbInstG;
//   var docInst = new docC(docID, foldID);
//   // eslint-disable-next-line no-undef
//   var ret = handleOver(dbInst, docInst);
//   docInst.saveAndCloseTemplate();
//   dbInst.closeconn()
//   return ret
// }

// eslint-disable-next-line no-unused-vars
function testOnHtmlSubmit() {
  // eslint-disable-next-line no-unused-vars
  var ret = onHtmlSubmit({});
}


// // eslint-disable-next-line no-unused-vars
// function testHandleExpenses() {
//   const dbInst = dbInstG;
//   var docInst = new docC(docID, foldID);
//   // eslint-disable-next-line no-undef
//   var ret = handleExpenses(dbInst, docInst);
//   // Logger.log(ret)
//   docInst.saveAndCloseTemplate();
//   dbInst.closeconn()
//   return ret
// }

// eslint-disable-next-line no-unused-vars
function testHandleBR() {
  const dbInst = dbInstG;
  const propNameS = "MediaPlus 419 Park Avenue South";
  var propInst = new proposalC(dbInst,propNameS);
  var docInst = new docC(docID, foldID,propNameS);
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


