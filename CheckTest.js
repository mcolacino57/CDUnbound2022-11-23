/*exported testExamineForm , testPrintTitlesAndIDs, testGetCKThisForm , runTests
 */

/*global logStatusofData, evalProposal , getCKThisForm , propDetailC
chkMajorPropDetailCategories    , dbInstG , incPropName ,
UnitTestingApp , docC , docID , foldID , proposalC  , checkZeroValue ,
onHtmlSubmit  , ckLocalSectionAC  , difference  */
// foldID, docID in cdCode.js



function testLogStatusofData(){
  var pid,pN;
  [pid, pN] = getCurrentProposal();
  var ret = logStatusofData(pid);
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
   return resA
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
  var ret = evalProposal();
  console.log(ret);
  return true
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
  var pid,pN;
  [pid, pN] = getCurrentProposal();
  const test = new UnitTestingApp();

  test.enable(); // tests will run below this line
  test.runInGas(true);
  if (test.isEnabled) {
    test.assert(testPropDetailA(dbInst, pid), `testPropDetail -> propID ${pid} `);
    test.assert(chkMajorPropDetailCategories(pid), `chkMajorPropDetailCategories -> propID ${pid}`);
    test.assert(logStatusofData(pid), `logStatusofData -> propID ${pid}`);
    test.assert(testEvalProposal(), `evalProposal -> propID ${pid}`);
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


