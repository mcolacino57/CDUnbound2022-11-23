/*exported ,testDisplayTitlesAndIDs,testExamineForm ,
runFillProposalDropDown, testFillSpacesDropdown,testPrintTitlesAndIDs,
writeAllQuestionsKeys,
setOverviewDesc */
/*global examineForm,databaseC,FormApp,userEmail , getProposalNamesAndIDs, 
cdFormID,cdDropdownID,formList
*/


/*Code_Section*/
/**********************Tests ************************************************ */
/**
 * function testFillSpacesDropdown() 
 * function testDisplayTitlesAndIDs()
 * function testExamineForm()
 */


function testDisplayTitlesAndIDs() {
  var form = formList.find(f => { if(f.short === 'CD') return f});

  var retS = displayTitlesAndIDS_(form.id);
  console.log(`In testDisplayTitlesAndIDs ${retS}`)
}

function testExamineForm() {
  var form = formList.find(f => { if(f.short === 'OperatingExpenses') return f});

  var f = FormApp.openById(form.id);
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




/**
 * Purpose: Create array of objects with question, clausekey, replacement
 * This function is called by writeAllQuestionKeys
 * @param  {String} formID - string ID for form
 * @return {object[]} sectionA - return value
 */
/* assumes description (getHelpText) for each question in the form: 
key: <clausekey> / replacement: <replacement> */
// small change to test commit
// eslint-disable-next-line no-unused-vars
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




