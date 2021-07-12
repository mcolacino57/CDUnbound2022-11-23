const todayS = Utilities.formatDate(new Date(), "GMT-4", "yyyy-MM-dd");
const nowS = Utilities.formatDate(new Date(), "GMT-4", "yyyy-MM-dd HH:MM:ss");
const userEmail = Session.getActiveUser().getEmail();
const ssLogID = '1sUkePGlPOhnBRtGwRQWQZBwfy154zl70jDKL9o3ekKk';
const docID = '17wgVY-pSMzqScI7GPBf4keprBu_t-LdekXecTlqfcmE';
const foldID = '1eJIDn5LT-nTbMU0GA4MR8e8fwxfe6Q4Q';

Logger = BetterLog.useSpreadsheet(ssLogID);

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
  var repClauseS, retS;
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
    Logger.log(err);

  }
  return pdA
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
      if(pd.proposalclausekey==="commDate"){
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



function main() {
  var dbInst = new databaseC("applesmysql");
  var docInst = new docC(docID, foldID);
  var ret = handleExpenses(dbInst, docInst);
  ret = handleOver(dbInst, docInst);
  docInst.saveAndCloseTemplate();
  dbInst.closeconn()
}




