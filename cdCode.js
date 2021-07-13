const todayS = Utilities.formatDate(new Date(), "GMT-4", "yyyy-MM-dd");
const nowS = Utilities.formatDate(new Date(), "GMT-4", "yyyy-MM-dd HH:MM:ss");
const userEmail = Session.getActiveUser().getEmail();
const ssLogID = '1sUkePGlPOhnBRtGwRQWQZBwfy154zl70jDKL9o3ekKk';
const docID = '17wgVY-pSMzqScI7GPBf4keprBu_t-LdekXecTlqfcmE';
const foldID = '1eJIDn5LT-nTbMU0GA4MR8e8fwxfe6Q4Q';
const cdFormID = '1JpMiIXViWzTAlXH2xUixtcf2_fPILysw_DAstC0HSn4'; // Create Document Form


Logger = BetterLog.useSpreadsheet(ssLogID);

function onSubmit() {
  // Get which proposal was selected

}

/**
 * Purpose: Evaluate responses to this form and write records to prop_detail table
 *
 * @return {String} retS - Success
 */
function evalProposal() {
  const fS = "evalProposal";
  const pQS = "Proposal Name?"; // proposal question
  var propS, retS;
  try {
    var dbInst = new databaseC("applesmysql");
    var docInst = new docC(docID, foldID);
    // get responses into an array of objects of the form [{"question": qS, "answer": aS},...]
    var f = FormApp.openById(cdFormID);
    var respA = crFormResponseArray(f);
    // get proposal name
    var propO = respA.find((responseObj) => responseObj.question === pQS);
    if (!propO) {
      propS = "No proposal in form";
      throw new Error('missing proposal');
    }
    else { propS = propO.answer; }
    var prop = new proposalC(dbInst, propS);

    retS = handleExpenses(dbInst, docInst);
    console.log("Expenses: " + retS);
    retS = handleOver(dbInst, docInst);
    console.log("Over: " + retS);
    retS = handlePremises(dbInst, docInst, propS);
    console.log("Premises: " + retS);
  } catch (e) {
    Logger.log(`In ${fS}: ${e}`);
    return "Problem"
  }
  docInst.saveAndCloseTemplate();
  dbInst.closeconn()
  return "Success"
}

/************************Utilities *********************** */
const curr_formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2
})

const percent_formatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

/**
 * Purpose: Deal with Premises, Building (Location)
 *
 * @param  {Object} dbInst - instance of database class
 * @param  {Object} docInst - instance of document class
 * @return {String} retS - return value
 */
function handlePremises(dbInst, docInst, propIDS) {
  var fS = "handlePremises", retS, probS;
  try {
    var retA = readFromTable(dbInst, "proposals", "ProposalName", propIDS);
    var spid = retA[0].fields.spaceidentity;
    retA = readFromTable(dbInst, "sub_spaces", "space_identity", spid);
    var spA = retA[0].fields
    retA = readFromTable(dbInst, "clauses", "ClauseKey", "premises");
    var premClauseBody = retA[0].fields.clausebody;

    /* 
    <<SF>> rentable square feet (“RSF”) located on floor <<Floor>> of the Building
    known as suite <<SuiteNumber>> (“Premises”). The Premises shall be measured in 
    accordance with the REBNY standard. Tenant may elect to have its architect confirm the Premises RSF.
    */
    var fmtsf = new Intl.NumberFormat().format(spA.squarefeet)
    premClauseBody = premClauseBody.replace("<<SF>>", fmtsf);
    if (spA.floor) {
      premClauseBody = premClauseBody.replace("<<Floor>>", spA.floor);
    } else {
      premClauseBody = premClauseBody.replace("located on floor <<Floor>> of the Building", "");
    }
    if (spA.suite) {
      premClauseBody = premClauseBody.replace("<<SuiteNumber>>", spA.suite);
    } else {
      premClauseBody = premClauseBody.replace("known as suite <<SuiteNumber>>", "");
    }
    retS = updateTemplateBody("<<Premises>>", premClauseBody, docInst)
    retS = updateTemplateBody("<<Address>>", spA.address, docInst);


  } catch (err) {
    probS = `In ${fS}: ${err}`
    Logger.log(probS);
  }
  return "Success"
}






/**
 * Purpose: Handles operating expenses, real estate taxes, and electric
 *
 * @param  {Object} dbInst - instance of databaseC
 * @param  {Object} docInst - instance of documenC

 * @param  {itemReponse[]} param_name - an array of responses 
 * @return {String} retS - return value
 */
function handleExpenses(dbInst, docInst) {
  var fS = "handleExpenses";
  var expInS = "('oePerInc','oeBaseYear','retBaseYear','elecDirect','elecRentInc','elecSubmeter','elecRentIncCharge')";
  var repClauseS, retS, probS;
  try {
    var pdA = readInListFromTable(dbInst, "prop_detail_ex", "ProposalClauseKey", expInS);
    pdA.forEach((pd) => {
      if (pd.section === "OperatingExpenses") {
        repClauseS = pd.clausebody.replace(pd.replstruct, pd.proposalanswer);
        retS = updateTemplateBody("<<OperatingExpenses>>", repClauseS, docInst);
        if (retS != "Success") {
          throw new Error(`In ${fS}: problem with updateTemplateBody on ${repClauseS}`)
        }
      }
      if (pd.section === "Electric") {
        if (pd.clausekey === "elecRentIncCharge") {
          elRepS = pd.clausebody.replace(pd.replstruct, pd.proposalanswer);
        } else {
          elRepS = pd.clausebody;
        }
        retS = updateTemplateBody("<<Electric>>", elRepS, docInst);
        if (retS != "Success") {
          throw new Error(`In ${fS}: problem with updateTemplateBody on ${repClauseS}`)
        }
      }
      if (pd.section === "RealEstateTaxes") {
        retRepS = pd.clausebody.replace(pd.replstruct, pd.proposalanswer);
        retS = updateTemplateBody("<<RealEstateTaxes>>", elRepS, docInst);
        if (retS != "Success") {
          throw new Error(`In ${fS}: problem with updateTemplateBody on ${repClauseS}`)
        }
      }
    });
  }

  catch (err) {
    probS = `In ${fS}: ${err}`
    Logger.log(probS);
    return probS

  }
  return "Success"
}

/**
 * Purpose: Replaces elements from both Proposal Start and Proposal Overview, from prop_detail_ex
 *
 * @param  {Object} dbInst - instance of databaseC
 * @param  {Object} docInst - instance of documenC
 * @return {String} retS - return value
 */

function handleOver(dbInst, docInst) {
  var fS = "handleOver";
  var probS, repClauseS, repS, retS;
  // first handle clauses, then direct replacements
  try {
    var overInsCl = "('secDeposit')";
    var pdA = readInListFromTable(dbInst, "prop_detail_ex", "ProposalClauseKey", overInsCl);
    pdA.forEach((pd) => {
      repClauseS = pd.clausebody.replace(pd.replstruct, pd.proposalanswer);
      retS = updateTemplateBody(pd.replstruct, repClauseS, docInst);
      if (retS != "Success") {
        throw new Error(`In ${fS}: problem with updateTemplateBody on ${repClauseS}`)
      }
    });
    // direct replacements: 
    var overInsS = "('useType','llName','llbrokerName','commDate','leaseTerm','earlyAccess')";
    pdA = readInListFromTable(dbInst, "prop_detail_ex", "ProposalClauseKey", overInsS);
    pdA.forEach((pd) => {
      if (pd.proposalclausekey === "commDate") {
        var repS = Utilities.formatDate(new Date(pd.proposalanswer), "GMT-4", "MM/dd/yyyy");
      } else {
        repS = pd.proposalanswer;
      }
      retS = updateTemplateBody(pd.replstruct, repS, docInst);
      if (retS != "Success") {
        throw new Error(`In ${fS}: problem with updateTemplateBody: ${retS}`)
      }
    });
    var valsFromProposal
  }

  catch (err) {
    probS = `In ${fS}: ${err}`
    Logger.log(probS);
    return probS
  }
  return "Success"

}

function testHandleOver() {
  var dbInst = new databaseC("applesmysql");
  var docInst = new docC(docID, foldID);
  var ret = handleOver(dbInst, docInst);
  docInst.saveAndCloseTemplate();
  dbInst.closeconn()

}

/**
 * Purpose: replace a chunk of text in the docInst, using replacement structure and replacement text
 *
 * @param  {String} replStructure - string in the form <<replace_me>>
 * @param  {String} replText - text to be replaced
 * @return {String}  retS - string including replacement structure
 */

function updateTemplateBody(replStructure, replText, docInst) {
  var fS = "updateTemplateBody";
  //Then we call replaceText method
  try {
    docInst.locBody.replaceText(replStructure, replText);
    var debugS = docInst.locBody.getText();
    // console.log(debugS)
  } catch (err) {
    probS = `In ${fS}: unable to update ${replStructure}`;
    Logger.log(probS);
    return probS
  }
  return "Success"
}

function tHandleOE() {
  var dbInst = new databaseC("applesmysql");
  var docInst = new docC(docID, foldID);
  var ds = docInst.ds;
  var ret = handleExpenses(dbInst, docInst);
  // Logger.log(ret)
  docInst.saveAndCloseTemplate();
  dbInst.closeconn()
}








