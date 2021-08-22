/*exported testIncPropName,runTests,testEvalResponses,
testProposalNameYN,onSubmit,testGetNamedProposalData, testQuestionToClauseKey ,
testGetProposalData, testPrintTitlesAndIDs,todayS,nowS,testHandleOver,testHandleExpenses,
testHandleBR,userEmail,logStatusofData*/

/*global Utilities,Session,Logger,BetterLog,databaseC, docC,proposalC,
 getCurrPropID_,readFromTable,DriveApp,readInListFromTable,maxRows*/
// 210727 10:39

const todayS = Utilities.formatDate(new Date(), "GMT-4", "yyyy-MM-dd");
const propDateS = Utilities.formatDate(new Date(), "GMT-4", "MM/dd/yyyy");
const nowS = Utilities.formatDate(new Date(), "GMT-4", "yyyy-MM-dd HH:MM:ss");
const userEmail = Session.getActiveUser().getEmail();
const ssLogID = '1sUkePGlPOhnBRtGwRQWQZBwfy154zl70jDKL9o3ekKk';   // consolidate spreadsheet--general debug
const docID = '17wgVY-pSMzqScI7GPBf4keprBu_t-LdekXecTlqfcmE';     // Proposal Tempate 1
const foldID = '1eJIDn5LT-nTbMU0GA4MR8e8fwxfe6Q4Q';               // Proposal Generation in MyDrive

/************** clauseKey strings object ***********************/
/* UPDATE  these when form is modified especially when new questions/clauses/clauseKeys are added */
const clauseKeyObjG = {
  expenses: "('oePerInc','oeBaseYear','retBaseYear','elecDirect','elecRentInc','elecSubmeter','elecRentIncCharge')",
  security: "('secDeposit')",
  overview: "('useType','llName','llbrokerName','llbrokerCo','llbrokerAddr','commDate','leaseTerm','earlyAccess')",
  ti: "('tiAllow','tiFreight','tiAccess','tiCompBid')"
};



// eslint-disable-next-line no-global-assign
Logger = BetterLog.useSpreadsheet(ssLogID);

function onSubmit() {
  var ret = evalProposal();
  return ret
}


const logEvalProposal = false;
/**
 * Purpose: Evaluate responses to this form and write records to prop_detail table
 *
 * @return {boolean} return - true or false
 */
function evalProposal() {
  const fS = "evalProposal";
  const logLoc = logEvalProposal;
  var ret, propID, propS;
  try {
    var dbInst = new databaseC("applesmysql");
    var docInst = new docC(docID, foldID);
    // get proposal name and returns [false,false] if there is a problem--in status.gs
    // eslint-disable-next-line no-unused-vars
    [propID, propS] = getCurrPropID_(dbInst, userEmail);
    var propInst = new proposalC(dbInst, propS);  // create for later use, specifically in handleBaseRent
    var propSize = propInst.getSize();

    ret = handleExpenses(dbInst, docInst, propSize);
    logLoc ? Logger.log("Expenses: " + ret) : true;
    if(!ret) { throw new Error(`handleExpenses returned false`)}
   
    ret = handleOver(dbInst, docInst, propSize);
    logLoc ? Logger.log("Over: " + ret) : true;
    if(!ret) { throw new Error(`handleOver returned false`)}

    ret = handleTenAndPrem(dbInst, docInst, propS, propSize);
    logLoc ? Logger.log("Premises: " + ret) : true;
    if(!ret) { throw new Error(`handleTenAndPrem returned false`)}

    ret = handleTI(dbInst, docInst, propSize);
    logLoc ? Logger.log("TI: " + ret) : true;
    if(!ret) { throw new Error(`handleTI returned false`)}

    ret = handleJSON(dbInst, docInst);
    logLoc ? Logger.log("JSON: " + ret) : true;
    if(!ret) { throw new Error(`handleJSON returned false`)}

    ret = handleBaseRent(dbInst, docInst, propInst);
    logLoc ? Logger.log("BR: " + ret) : true;
    if(!ret) { throw new Error(`handleBaseRent returned false`)}


  } catch (err) {
    Logger.log(`In ${fS}: ${err}`);
    return false
  }
  docInst.saveAndCloseTemplate();
  dbInst.closeconn()
  return true
}

var logHandleBaseRent = false;
/**
 * Purpose: Handle base rent
 *
 * @param {Object} dbInst - instance of databaseC
 * @param  {Object} docInst - docC instance
 * @param  {object} propInst - proposalC instance
 * @@return {boolean} return - true or false
 */
function handleBaseRent(dbInst, docInst, propInst) {
  var fS = "handleBaseRent";
  var locLog = logHandleBaseRent;

  try {
    var propID = propInst.getID();
    var offsetObj = {}, offset = 0;
    // get the local doc body from the doc instance
    var doc = docInst.locBody;
    // Find the replacement text
    var rgel = doc.findText("<<BaseRentalRate>>");
    var el = rgel.getElement().getParent(); // take the found element and get its parent
    var loopCtl = el.toString()  // use the type of the parent (as string) to start the loop
    while (loopCtl != "BODY_SECTION") { // stop when you get to the body section
      var par = el.getParent();
      var parType = par.getType(); // put parent type into var
      el = par; // make the parent into the current element, el 
      offset = el.getParent().getChildIndex(el); // go up and down to count siblings
      loopCtl = parType.toString();
      offsetObj[loopCtl] = offset;
    }
    /* At this point we know that the basic structure is table/table row/table cell/paragraph. Go down the structure by using getChild, stopping at cell. Use the offset list to determine which child should be looked at. Look at the child of the cell (a paragraph FYI) and null out the second paragraph which should be "<<BaseRentalRate>>". Note this will break if there is a new line or anythig added as a second paragraph in the templace cell */
    var t0 = doc.getChild(offsetObj["TABLE"]);
    var r0 = t0.getChild(offsetObj["TABLE_ROW"]);
    var c0 = r0.getChild(offsetObj["TABLE_CELL"]);
    //c0.getChild(1).asText().setText('');  // delete <<BaseRentalRate>>
    doc.replaceText("<<BaseRentalRate>>", '\n');

    // go to the DB and get the proposed rental rates associated with this spaceID
    // var retBR = getBySpaceID(spaceID, "proposedrent");
    var jsonyn = false;
    var records = readFromTable(dbInst, "base_rent", "ProposalID", propID, jsonyn);
    if (records.length === 0) {
      throw new Error(`no base rent records found for proposal ${propID}`);
    }
    // call the sort function (below) to order by begin date (note should be done in DB)
    records.sort(sortDate);
    // create the base rent table; header first
    var t = [["Begin Date", "End Date", "Rent PSF"]];
    // for all the base records, push the created row onto the table
    for (var j = 0; j < records.length; j++) {
      var row = [
        Utilities.formatDate(new Date(records[j].begindate), "GMT+1", "MMMM d, yyyy"),
        Utilities.formatDate(new Date(records[j].enddate), "GMT+1", "MMMM d, yyyy"),
        curr_formatter.format(records[j].rentpsf)
      ]
      t.push(row);
    }
    locLog ? Logger.log(t) : true;
    c0.insertTable(2, t); // insert the table at c0 created above, third paragraph
    var s = c0.getChild(1).getType().toString();
    s = c0.getChild(2).getType().toString();
    // eslint-disable-next-line no-unused-vars
    s = c0.getChild(3).getType().toString();
  }
  catch (err) {
    Logger.log(`In ${fS}: ${err}`);
    return false
  }
  locLog ? Logger.log(`Base Rent Updated for id ${propID}`) : true;
  return true
}

/**
 * Purpose: get information stored in JSON file, use it to update template for 
 * BrokerName, Broker License and Broker Email
 *
 * @param  {object} dbInst - instance of databaseC
 * @param  {object} docInst - instance of docC
 * @return {boolean} t/f - return true or false
 */
function handleJSON(dbInst, docInst) {
  var fS = "handleJSON", probS;
  var userPrefixS = userEmail.split('@')[0];
  var fileName = userPrefixS + ".json";
  try {
    var files = DriveApp.getFilesByName(fileName);
    if (files.hasNext()) {
      var file = files.next();
      var content = file.getBlob().getDataAsString();
      var json = JSON.parse(content);
    }
    if (json.name) {
      updateTemplateBody("<<BrokerName>>", json.name, docInst)
    }
    if (json.email) {
      updateTemplateBody("<<BrokerEmail>>", json.email, docInst);
    }
    if (json.license_num) {
      updateTemplateBody("<<BrokerageLicense>>", json.license_num, docInst);
    }
  } catch (err) {
    probS = `In ${fS}: ${err}`
    Logger.log(probS);
    return false
  }
  return true
}

/**
 * Purpose: Handle TI stuff, which includes
 * Allowance, Freight Access, and other TI conditions
 *
 * @param  {Object} dbInst - instance of database class
 * @param  {Object} docInst - instance of document class
 * @return {boolean} return - true or false
 */
// attempted fix on propSize
function handleTI(dbInst, docInst, propSize) {
  var fS = "handleTI", probS, repClauseS;
  var tiInS = clauseKeyObjG.ti;
  //var tiInS = "('tiAllow','tiFreight','tiAccess','tiCompBid')";
  try {
    var pdA = readInListFromTable(dbInst, "prop_detail_ex", "ProposalClauseKey", tiInS);
    var tiTerms = "";
    pdA.forEach((pd) => {
      if (!correctSize(propSize, pd.clausesize)) return;

      if (pd.proposalclausekey === "tiAllow") {
        var tiDollars = curr_formatter.format(pd.proposalanswer);
        updateTemplateBody("<<TenantImprovementPSF>>", tiDollars, docInst);
      } else {
        repClauseS = pd.clausebody.replace(pd.replstruct, pd.proposalanswer);
        tiTerms = tiTerms + repClauseS + "\n\n"
      }
    });
    //if(tiTerms !=""){ tiTerms = tiTerms.slice(0, -2);}
    if (tiTerms != "") { tiTerms = tiTerms.replace(/\n\n$/, ''); }
    updateTemplateBody("<<TenantImprovements>>", tiTerms, docInst);

  } catch (err) {
    probS = `In ${fS}: ${err}`
    Logger.log(probS);
    return false
  }
  return true
}


/**
 * Purpose: Deal with Premises, Building (Location), tenant
 *
 * @param  {Object} dbInst - instance of database class
 * @param  {Object} docInst - instance of document class
 * @return {boolean} return - true or false
 */
// attempted fix for propSize
function handleTenAndPrem(dbInst, docInst, propIDS, propSize) {
  var fS = "handleTenAndPrem", probS;
  var foundCorrectSize = false;
  var premClauseBody = "";
  try {
    var jsonyn = false;
    var retA = readFromTable(dbInst, "proposals", "ProposalName", propIDS, jsonyn);
    var spid = retA[0].spaceidentity;
    var tenantNameS = retA[0].tenantname;
    retA = readFromTable(dbInst, "survey_spaces", "identity", spid, jsonyn);
    var spA = retA[0]
    //retA = readFromTable(dbInst, "clauses", "ClauseKey", "premises", jsonyn);

    var pdA = readInListFromTable(dbInst, "clauses", "ClauseKey", "('premises')");
    for (var i = 0; i < pdA.length; i++) {
      if (correctSize(propSize, pdA[i].clausesize)) {
        foundCorrectSize = true;
        premClauseBody = pdA[i].clausebody;
      }
    }
    // Note: if there are more than one premises clauses that match the propSize
    // you get the last (latest?) one
    if (!foundCorrectSize) {
      throw new Error(`in ${fS} no premises record for proposal size ${propSize}`)
    }
    var fmtsf = new Intl.NumberFormat().format(spA.squarefeet)
    premClauseBody = premClauseBody.replace("<<SF>>", fmtsf);
    premClauseBody = premClauseBody.replace("<<FloorAndSuite>>", spA.floorandsuite);
    updateTemplateBody("<<Premises>>", premClauseBody, docInst)
    updateTemplateBody("<<Address>>", spA.address, docInst);
    updateTemplateBody("<<ClientCompany>>", tenantNameS, docInst);

  } catch (err) {
    probS = `In ${fS}: ${err}`
    Logger.log(probS);
    return false
  }
  return true
}


/**
 * Purpose: Handles operating expenses, real estate taxes, and electric
 *
 * @param  {Object} dbInst - instance of databaseC
 * @param  {Object} docInst - instance of documenC
 * @param  {Object} propInst - instance of proposalC
 * @return {boolean} t/f - return true or false
 */
// fixed to include propSize
function handleExpenses(dbInst, docInst, propSize) {
  var fS = "handleExpenses";
  // all clauseKeys in expenses UPDATE if Operating Expenses form update
  var expInS = clauseKeyObjG.expenses
  // var expInS = "('oePerInc','oeBaseYear','retBaseYear','elecDirect','elecRentInc','elecSubmeter','elecRentIncCharge')";
  var repClauseS, ret, probS, elRepS, retRepS;
  try {
    var pdA = readInListFromTable(dbInst, "prop_detail_ex", "ProposalClauseKey", expInS);
    pdA.forEach((pd) => {
      if (!correctSize(propSize, pd.clausesize)) return;

      if (pd.section === "OperatingExpenses") {
        repClauseS = pd.clausebody.replace(pd.replstruct, pd.proposalanswer);
        ret = updateTemplateBody("<<OperatingExpenses>>", repClauseS, docInst);
        if (!ret) {
          throw new Error(`In ${fS}: problem with updateTemplateBody on ${repClauseS}`)
        }
      }
      if (pd.section === "Electric") {
        if (pd.proposalclausekey === "elecRentIncCharge") {
          elRepS = pd.clausebody.replace(pd.replstruct, pd.proposalanswer);
        } else {
          elRepS = pd.clausebody;
        }
        ret = updateTemplateBody("<<Electric>>", elRepS, docInst);
        if (!ret) {
          throw new Error(`In ${fS}: problem with updateTemplateBody on ${repClauseS}`)
        }
      }
      if (pd.section === "RealEstateTaxes") {
        retRepS = pd.clausebody.replace(pd.replstruct, pd.proposalanswer);
        ret = updateTemplateBody("<<RealEstateTaxes>>", retRepS, docInst);
        if (!ret) {
          throw new Error(`In ${fS}: problem with updateTemplateBody on ${repClauseS}`)
        }
      }
    });
  }
  catch (err) {
    probS = `In ${fS}: ${err}`
    Logger.log(probS);
    return false
  }
  return true
}

/**
 * Purpose
 *
 * @param  {string} propSize - size of proposal
 * @param  {string} clauseSize - size of clause 
 * @return {boolean} t/f - return ture or false
 */
function correctSize(propSize, clauseSize) {
  if (clauseSize === propSize) return true;
  if (clauseSize.includes("A")) return true;
  if (clauseSize.includes(propSize)) return true;
  return false
}

/**
 * 
 * Purpose: Replaces elements from  Proposal Start and Proposal Overview, including DateOfProposal
 * from prop_detail_ex
 *
 * @param  {Object} dbInst - instance of databaseC
 * @param  {Object} docInst - instance of documenC
 * @return {boolean} return - true or false
 */
// fixed to handle propSize

function handleOver(dbInst, docInst, propSize) {
  var fS = "handleOver";
  var probS, repClauseS, repS, ret;
  // first handle clauses, then direct replacements
  try {
    // var overInsCl = "('secDeposit')";
    var overInsCl = clauseKeyObjG.security;
    var pdA = readInListFromTable(dbInst, "prop_detail_ex", "ProposalClauseKey", overInsCl);
    pdA.forEach((pd) => {
      if (!correctSize(propSize, pd.clausesize)) return;
      repClauseS = pd.clausebody.replace(pd.replstruct, pd.proposalanswer);
      ret = updateTemplateBody(pd.replstruct, repClauseS, docInst);
      if (!ret) {
        throw new Error(`In ${fS}: problem with updateTemplateBody on ${repClauseS}`)
      }
    });
    // direct replacements: 

    //var overInsS = "('useType','llName','llbrokerName','llbrokerCo','llbrokerAddr','commDate','leaseTerm','earlyAccess')";
    var overInsS = clauseKeyObjG.overview;
    pdA = readInListFromTable(dbInst, "prop_detail_ex", "ProposalClauseKey", overInsS);
    pdA.forEach((pd) => {
      if (!correctSize(propSize, pd.clausesize)) return;
      if (pd.proposalclausekey === "commDate") {
        // var repS = Utilities.formatDate(new Date(pd.proposalanswer), "GMT-4", "MM/dd/yyyy");
        var dA = pd.proposalanswer.split('-');
        repS = `${dA[1]}/${dA[2]}/${dA[0]}`;
      } else {
        repS = pd.proposalanswer;
      }
      ret = updateTemplateBody(pd.replstruct, repS, docInst);
      if (!ret) {
        throw new Error(`In ${fS}: problem with updateTemplateBody: ${ret}`)
      }
    });

    ret = updateTemplateBody("<<DateofProposal>>", propDateS, docInst);
    if (!ret) {
      throw new Error(`In ${fS}: problem with updateTemplateBody: ${ret}`)
    }
  }
  catch (err) {
    probS = `In ${fS}: ${err}`
    Logger.log(probS);
    return false
  }
  return true

}

/*************************************Test ************************************ */

function testHandleOver() {
  var dbInst = new databaseC("applesmysql");
  var docInst = new docC(docID, foldID);
  var ret = handleOver(dbInst, docInst);
  docInst.saveAndCloseTemplate();
  dbInst.closeconn()
  return ret
}

function testHandleExpenses() {
  var dbInst = new databaseC("applesmysql");
  var docInst = new docC(docID, foldID);
  var ret = handleExpenses(dbInst, docInst);
  // Logger.log(ret)
  docInst.saveAndCloseTemplate();
  dbInst.closeconn()
  return ret
}

/**
 * Purpose: replace a chunk of text in the docInst, using replacement structure and replacement text
 *
 * @param  {String} replStructure - string in the form <<replace_me>>
 * @param  {String} replText - text to be replaced
 * @return {boolean}  return - true or undefined
 */

function updateTemplateBody(replStructure, replText, docInst) {
  var fS = "updateTemplateBody";
  //Then we call replaceText method
  try {
    docInst.locBody.replaceText(replStructure, replText);
  } catch (err) {
    var probS = `In ${fS}: unable to update ${replStructure}`;
    throw new Error(probS)
  }
  return true
}

function testHandleBR() {
  var dbInst = new databaseC("applesmysql");
  var propInst = new proposalC(dbInst, "MediaPlus 419 Park Avenue South");
  var docInst = new docC(docID, foldID);
  var ret = handleBaseRent(dbInst, docInst, propInst);
  return ret
}

const logChkMajorPropDetailCategories = false;
/**
 * Purpose: Before running an attempt to create a proposal, test to see that all the major
 * categories have been filled in. Should modifiy if additional clauses  sections are added.
 * Also should check to see where the proposal is located and omit certain checks, for example 
 * parking in NY. Also note that Premises is omitted even though its a legitimate section
 * since it's set entirely through the survey_spaces table.
 * 
 * Also note that this uses the view prop_detail_ex which joins the clause table
 * with the prop_detail table. This is where the 
 *
 * @param  {String} propID - proposal id
 *
 * @return {object} return - [incSec, excSec, excSec.length] or false
 */
function chkMajorPropDetailCategories(propID) {
  try {
    var fS = "chkMajorPropDetailCategories", qryS = "";
    var incSec = [], excSec = [];
    var results;

    const dbInst = new databaseC("applesmysql");
    var locConn = dbInst.getconn(); // get connection from the instance
    var stmt = locConn.createStatement();
    stmt.setMaxRows(maxRows);
    // If additional sections get added, add to this list
    var sectionSA = [
      "Date",
      "Electric",
      "Overview",
      "OperatingExpenses",
      "RealEstateTaxes",
      "Security",
      "TenantImprovements",
      "Use"
    ];
    sectionSA.forEach((s) => {
      qryS = `SELECT * FROM prop_detail_ex where ProposalID = '${propID}' AND section = '${s}';`;
      results = stmt.executeQuery(qryS);
      results.next() ? incSec.push(s) : excSec.push(s);
    });
    // excSec.length==0 ? excSec =["none"] : true;
    logChkMajorPropDetailCategories ? Logger.log(`in: ${incSec} missing: ${excSec}`) : true;
    return [incSec, excSec, excSec.length]
  }
  catch (err) {
    Logger.log(`In ${fS}: ${err}`);
    return false
  }
}

const logLogStatusofData = false;
/**
 * Purpose: check to see if major sections are represented in 
 *
 * @param  {String} param_name - param
 * @param  {itemReponse[]} param_name - an array of responses 
 * @return {boolean} return - true or false
 */
function logStatusofData(propID) {
  var fS = "logStatusofData";
  // eslint-disable-next-line no-unused-vars
  var [incSec, excSec, excludedLen] = chkMajorPropDetailCategories(propID);
  if (excludedLen === 0) {
    logLogStatusofData ? Logger.log(`In CD Bound / logStatusofData all major sections included`) : true;
    return true
  }
  else {
    excSec.forEach((sec) => {
      Logger.log(`In ${fS} missing sections: ${sec}`);
    });
    return false
  }

}






/************************Utilities *********************** */
const curr_formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2
})

// const percent_formatter = new Intl.NumberFormat('en-US', {
//   style: 'percent',
//   minimumFractionDigits: 2,
//   maximumFractionDigits: 2
// })

function sortDate(r1, r2) {
  if (r1.BeginDate < r2.BeginDate)
    return -1;
  if (r1.BeginDate > r2.BeginDate)
    return 1;
  return 0;
}





