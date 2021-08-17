/*exported getItemResps,testDisplayTitlesAndIDs,testExamineForm ,
runFillProposalDropDown, testFillSpacesDropdown,testPrintTitlesAndIDs,
writeAllQuestionsKeys,emptyCk_Question,crFormResponseArray,
setOverviewDesc */
/*global examineForm, Logger,databaseC,FormApp,userEmail,todayS,nowS, getProposalNamesAndIDs, 
cdFormID,cdDropdownID
*/
// 210727 9:55

/* CHANGE FOR EACH FORM */
const formID_G = cdFormID;
const formName_G = 'Create Document';
const fieldS_G = ""; // Note that this code doesn't delete from ck_question and therefore no need for this

/*Code_Section*/
/***************Utility ***********************/
/*
* function returnItemNumber_(items, questionS)
* function examineForm()
* function getSectionHeaders(form)
* function getItemResps(form)
* function responseByItemID(form, itemtosearch)
 */



/**
 * Purpose: get a list of items from the form; assumes just one response. Change if there are multiple responsess
 * see getProto1Responses
 * @param  {object} form 
 * @return {object[]} retA - return all items from the form response
 *  
 **/
function getItemResps(form) {
  try {
    var formResponses = form.getResponses(); // assumed to be only one
    if (formResponses.length == 0) { throw new Error("getItemResps: formResponses has no responses") }
    if (formResponses.length > 1) { throw new Error("getItemResps: formResponses has too many responses") }
    var formResponse = formResponses[0]; //  
    var retA = formResponse.getItemResponses(); // array of items; which are questions and answers
  }
  catch (err) {
    console.log(`getItemResps: ${err}`);
    return { result: "Not Found" }
  }
  return retA
}

/*End Code_Section*/

/*Code_Section*/
/**********************Tests ************************************************ */
/**
 * function testFillSpacesDropdown() 
 * function testDisplayTitlesAndIDs()
 * function testExamineForm()
 */


function testDisplayTitlesAndIDs() {
  var retS = displayTitlesAndIDS_(formID_G);
  console.log(`In testDisplayTitlesAndIDs ${retS}`)
}

function testExamineForm() {
  var f = FormApp.openById(formID_G);
  var ret = examineForm(f);
  return ret
}



/*End Code_Section*/

/* Code_Section */

/*************************FILL DROPDOWNS ********************* */
/**
 * function fillProposalDropdown_(dbInst,formID, dropDownID)
 * function runFillProposalDropDown()
 * function displayTitlesAndIDS_(formID)
 * function testPrintTitlesAndIDs() 
 */

/**
 * Purpose: take an array of strings and populate a dropdown in formID
 *
 * @param  {string} formID- form ID
 * @param  {string} dropDownID - id for the dropdown 
 * @return {string} retS - return "Success" or false
 */
function fillProposalDropdown_(dbInst, formID, dropDownID) {
  const fS = "fillProposalDropdown_";
  var retS;
  try {
    // get proposal array from db
    var propA = getProposalNamesAndIDs(dbInst,userEmail);  // in gcloudSQL, change when a library
    var ddvaluesA = propA.map(pr => {
      return pr[0];
    })

    // get the dropdown from the form
    var dd = FormApp.openById(formID).getItemById(dropDownID);
    if (dd.getType() != FormApp.ItemType.LIST) {
      throw new Error(`Item: ${dropDownID} is not a list!`);
    }
    else {
      dd.asListItem().setChoiceValues(ddvaluesA);
    }

  } catch (err) {
    console.log(`In ${fS}: ${err}`)
    return false
  }
  retS = "Success";
  return retS
}

function runFillProposalDropDown() {
  var dbInst = new databaseC("applesmysql");
  var retS = fillProposalDropdown_(dbInst,cdFormID, cdDropdownID);
  console.log(`In runFillProposalDropDown: ${retS}`)
}

/*
function runFillSpacesDropdown() {
  var retS = fillSpacesDropdown_(psFormID, psDropdownID);
}
*/

function displayTitlesAndIDS_(formID) {
  var form = FormApp.openById(formID);
  var items = form.getItems();
  for (var i in items) {
    console.log(items[i].getTitle() + ': ' + items[i].getId() + " / " + items[i].getHelpText());  // HelpText == Description
  }
}

function crFormResponseArray(form) {
  // Use the global form ID and log the responses to each question.
  var respA = [];
  var formResponses = form.getResponses();
  for (var i = 0; i < formResponses.length; i++) {
    var formResponse = formResponses[i];
    var itemResponses = formResponse.getItemResponses();
    for (var j = 0; j < itemResponses.length; j++) {
      var itemResponse = itemResponses[j];
      respA.push({ "question": itemResponse.getItem().getTitle(), "answer": itemResponse.getResponse() });
    }
  }
  return respA
}


/************************ FORM PREP ******************************************************* */
/**
 * Purpose: Run this function to populate the ck_question table; this should be run
 * whenever a new question is added to the form; START HERE, and use emptyCk_Question if needed
 * to empty out the ck_question table
 *
 * @param  {String} param_name - param
 * @param  {itemReponse[]} param_name - an array of responses 
 * @return {String} retS - return value
 */
function writeAllQuestionsKeys() {
  var fS = 'writeAllQuestionsKeys';
  var dbInst = new databaseC("applesmysql");
  try {
    var qcrA = crFormKeyArray(formID_G);  // this is specific to the particular for and needs changing in other formUtils
    if (qcrA) {
      qcrA.forEach(r => {
        var qcrRec = {
          'Question': r.question,
          'ClauseKey': r.clausekey,
          'ReplStruct': r.replacement,
          'FormName'  : formName_G,
          'CreatedBy': userEmail,
          'CreatedWhen': todayS,
          'ModifiedWhen': nowS,
          'ModifiedBy': userEmail
        }
        var rets = writeCk_Question(dbInst, qcrRec);
        if (rets==="Problem") {throw new Error(`In ${fS}: problem with ${qcrA.qustion}`)}
      })
    }
  } catch (err) {
    console.log(`In ${fS}: ${err}`);
    return false
  }
  return true
}

/**
 * Purpose: Create array of objects with question, clausekey, replacement
 * This function is called by writeAllQuestionKeys
 * @param  {String} formID - string ID for form
 * @return {object[]} sectionA - return value
 */
/* assumes description (getHelpText) for each question in the form: 
key: <clausekey> / replacement: <replacement> */
// small change to test commit
function crFormKeyArray(formID) {
  var form = FormApp.openById(formID);
  var fS = "crFormKeyArray";
  try {
    var items = form.getItems();
    var qcrA = [];
    for (var i in items) {
      if (items[i].getHelpText().includes("key: ")) {
        var question = items[i].getTitle();
        var [keyS, repS] = items[i].getHelpText().split(" / ");
        var clausekey = keyS.split(": ")[1];
        var replacement = repS.split(": ")[1];
        qcrA.push({ question, clausekey, replacement });
      }
    }
  } catch (e) {
    console.log(`In ${fS}: ${e}`);
    return false
  }
  return qcrA
}

const logWriteCk_Question = true;
function writeCk_Question(dbInst,qcrRec){
  var fS = 'writeCk_Question';
  // database structure; change when ck_question changes
  var colS = "Question,ClauseKey,ReplStruct,FormName,CreatedBy,CreatedWhen,ModifiedWhen,LastModifiedBy";
  var valA = Object.values(qcrRec);
  var recordS = "";
  for (var i = 0; i < valA.length; i++) {
    if (i < (valA.length - 1)) {
      recordS = recordS + "'" + valA[i] + "',";
    } else {
      recordS = recordS +  "'" + valA[i] + "'";
    }
  }
try {
  var qryS = `INSERT INTO ck_question (${colS}) VALUES(${recordS});`;
  var locConn = dbInst.getconn(); // get connection from the instance
  var stmt = locConn.prepareStatement(qryS);
  stmt.execute();
} catch (e) {
  logWriteCk_Question ? Logger.log(`In ${fS}: ${e}`) : true;
  return "Problem"
}
return "Success"
}

/**
 * Purpose
 *
 * @param  {String} param_name - param
 * @param  {itemReponse[]} param_name - an array of responses 
 * @return {String} retS - return value
 */
const logEmptyCk_Question = true;
function emptyCk_Question(){
  var fS = "emptyCk_Question";
  var dbInst = new databaseC("applesmysql");
  try {
  var qryS = `Delete from ck_question where ClauseKey in (${fieldS_G});`;
  var locConn = dbInst.getconn(); // get connection from the instance
  var stmt = locConn.prepareStatement(qryS);
  stmt.execute();
} catch (e) {
  logEmptyCk_Question ? Logger.log(`In ${fS}: ${e}`) : true;
  return false
}
dbInst.closeconn();
return true
}


