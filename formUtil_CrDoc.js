// formUtil_CrDoc / Created: 210712
// 
// This form selects a proposal and attempts to created a updated document
// from the Proposal Template 1
const CREATE_DOC = false;
const cdFormID ='1JpMiIXViWzTAlXH2xUixtcf2_fPILysw_DAstC0HSn4'; // Create Document Form
const cdDropdownID = '1941214219';


/***************Utility and testing *************/
/**
 * Purpose
 *
 * @param  {string} param_name - param
 * @param  {itemReponse[]} param_name - an array of responses 
 * @return {string} retS - return value
 */

function extractItemID(f) {
  var items = f.getItems();
  for (var i in items) {
    console.log(items[i].getTitle() + ': ' + items[i].getId());
  }
}

function testExtractItemID() {
  var f = FormApp.openById(cdFormID);
  var ret = extractItemID(f);
}


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


/*************************DROPDOWN INITIALIZATION******* */
const proposalS = "Proposal to be used:"

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
    var itemT = dd.getType();
    if (dd.getType() != FormApp.ItemType.LIST) {
      throw new Error(`Item: ${dropDownID} is not a list!`);
      return false
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
  var retS = fillProposalDropdown_(cdFormID, cdDropdownID);
  console.log(retS)
}

/**
 * Purpose: Populate the spaces dropdown in the Proposal Start project
 *
 * @param  {string} formID- form ID
 * @param  {string} dropDownID - id string for dropdown
 * @return {string} retS - return "Success" or false
 */

function fillSpacesDropdown_(formID, dropDownID) {
  const fS = "fillSpacesDropdown_";
  var retS;
  try {
    // get proposal array from db
    var asfsfA = getSpaceDisplay("mcolacino@squarefoot.com");  // gcloudSQL modified to this 210708
    var ddvaluesA = asfsfA.map(pr => {
      return pr.sdesc;
    })
    // get the dropdown from the form
    var dd = FormApp.openById(formID).getItemById(dropDownID);
    var itemT = dd.getType();
    if (dd.getType() != FormApp.ItemType.LIST) {
      throw new Error(`Item: ${dropDownID} is not a list!`);
      return false
    }
    else {
      dd.asListItem().setChoiceValues(ddvaluesA);
      Logger.log(`Updated ${formID} with spaces`);
    }
  } catch (err) {
    console.log(`In ${fS}: ${err}`)
    return false
  }
  retS = "Success";
  return retS
}

function runFillSpacesDropdown() {
  var retS = fillSpacesDropdown_(psFormID, psDropdownID);
}

function displayTitlesAndIDS_(formID) {
  var form = FormApp.openById(formID);
  var items = form.getItems();
  for (var i in items) {
    console.log(items[i].getTitle() + ': ' + items[i].getId() + " / " + items[i].getHelpText());  // HelpText == Description
  }
}

function testDisplayTitlesAndIDs() {
  var retS = displayTitlesAndIDS_(cdFormID);
 
}


function crFormResponseArray() {
  // Use the global form ID and log the responses to each question.
  var form = FormApp.openById(cdFormID);
  var respA = [];
  var formResponses = form.getResponses();
  // console.log("Number of responses is %s ", formResponses.length)
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
function testCrFormResponseArray() { var ret = crFormResponseArray(psFormID); console.log(ret) }


/**
 * Purpose: Create array of objects with question, clausekey, replacement
 * by extracting strings from the form descriptions:
 * assumes description (getHelpText) for each question in the form: 
 * key: <clausekey> / replacement: <replacement> 
 *
 * @param  {String} formID - string ID for form
 * @return {object[]} sectionA - return value
 */


function crFormKeyArray(formID) {
  var fS = "crFormKeyArray";
  try {
    form = FormApp.openById(formID)
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
  console.log(qcrA);
  return qcrA
}

/**
 * Purpose: Takes a form and writes to the ck_question table 
 * using info extracted from the form via crFormKeyArray
 *
 * @param  {String} param_name - param
 * @param  {itemReponse[]} param_name - an array of responses 
 * @return {String} retS - return value
 */

function writeAllQuestionsKeys(formID) {
  var fS = 'writeAllQuestionsKeys';
  var dbInst = new databaseC("applesmysql");

  try {
    var qcrA = crFormKeyArray(formID)
    if (qcrA) {
      qcrA.forEach(r => {
        var qcrRec = {
          'Question': r.question,
          'ClauseKey': r.clausekey,
          'ReplStruct': r.replacement,
          'CreatedBy': userEmail,
          'CreatedWhen': todayS,
          'ModifiedWhen': nowS,
          'ModifiedBy': userEmail
        }
        var rets = writeCk_Question(dbInst, qcrRec)
      })
    }
  } catch (e) {
    console.log(`In ${fS}: ${e}`);
    return false
  }
  return "Success"
}

function testWriteAllQuestionsKeys() {
  var ret = writeAllQuestionsKeys(psFormID);
  console.log(ret)
}

const logWriteCk_Question = true;
function writeCk_Question(dbInst, qcrRec) {
  var fS = 'writeCk_Question';

  var colS = "Question,ClauseKey,ReplStruct,CreatedBy,CreatedWhen,ModifiedWhen,LastModifiedBy";
  var valA = Object.values(qcrRec);
  var recordS = "";
  for (i = 0; i < valA.length; i++) {
    if (i < (valA.length - 1)) {
      recordS = recordS + "'" + valA[i] + "',";
    } else {
      recordS = recordS + "'" + valA[i] + "'";
    }
  }
  try {
    var qryS = `INSERT INTO ck_question (${colS}) VALUES(${recordS});`;
    console.log(qryS);
    var locConn = dbInst.getconn(); // get connection from the instance
    var stmt = locConn.prepareStatement(qryS);
    stmt.execute();
  } catch (e) {
    logWriteCk_Question ? Logger.log(`In ${fS}: ${e}`) : true;
    return "Problem"
  }
  return "Success"
}


