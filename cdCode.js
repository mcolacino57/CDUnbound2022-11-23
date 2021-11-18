/*exported testIncPropName , runTests , testEvalResponses,
testProposalNameYN,  onSubmit , testGetNamedProposalData, testQuestionToClauseKey ,
testGetProposalData , testPrintTitlesAndIDs , todayS , nowS , 
testHandleOver,testHandleExpenses, testHandleBR,  userEmail , logStatusofData ,
docID , foldID */

/*global Utilities , Logger  , databaseC , docC , proposalC,
 getCurrPropID_,  readFromTable , DriveApp , readInListFromTable,  maxRows ,
 getProposalNamesAndIDs , getCurrentProposal , HtmlService , saveAsJSON*/
// 210727 10:39

const todayS = Utilities.formatDate(new Date(), "GMT-4", "yyyy-MM-dd");
const propDateS = Utilities.formatDate(new Date(), "GMT-4", "MM/dd/yyyy");
const nowS = Utilities.formatDate(new Date(), "GMT-4", "yyyy-MM-dd HH:MM:ss");
// const userEmail = Session.getActiveUser().getEmail();
const userEmail = "mcolacino@squarefoot.com";
const docID = '17wgVY-pSMzqScI7GPBf4keprBu_t-LdekXecTlqfcmE';     // Proposal Tempate 1

// const ssLogID = '1sUkePGlPOhnBRtGwRQWQZBwfy154zl70jDKL9o3ekKk';   // consolidate spreadsheet--general debug
const foldID = '1eJIDn5LT-nTbMU0GA4MR8e8fwxfe6Q4Q';               // Proposal Generation in MyDrive
const databaseNameG = "applesmysql";


/************** clauseKey strings object ***********************/
/* UPDATE  these when form is modified especially when new questions/clauses/clauseKeys are added */
const clauseKeyObjG = {
  expenses: "('oePerInc','oeBaseYear','retBaseYear','elecDirect','elecRentInc','elecSubmeter','elecRentIncCharge')",
  security: "('secDeposit')",
  overview: "('useType','llName','llbrokerName','llbrokerCo','llbrokerAddr','commDate','leaseTerm','earlyAccess')",
  ti: "('tiAllow','tiFreight','tiAccess','tiCompBid')"
};



// eslint-disable-next-line no-global-assign
// Logger = BetterLog.useSpreadsheet(ssLogID);


/**
 * Purpose: When using html forms, this function is called by 
 * processForm with the form object from the html 
 *
 * @param  {object} htmlFormObject - from html form
 * @return {boolean    var probS = `In onSubmit, propblem initializing`;
 } t/f 
 */
const disp_onHtmlSubmit = true;
// eslint-disable-next-line no-unused-vars
function onHtmlSubmit(htmlFormObject = { 'val': "unneeded" }) {
  var fS = "onHtmlSubmit";
  var ret;
  //var ck2, pid;
  disp_onHtmlSubmit ? Logger.log(`The htmlFormObject is  ${JSON.stringify(htmlFormObject)}`) : true;
  // Include this test in production but not in testing
  try {
    var dbInst = new databaseC(databaseNameG);
    ret = evalProposal(dbInst);
    return ret

  } catch (err) {
    var probS = `In ${fS}, problem initializing`;
    Logger.log(probS);
  }
  return false
}

const logEvalProposal = false;
/**
 * Purpose: Evaluate responses to this form and write records to prop_detail table
 *
 * @return {boolean} return - true or false
 */
// eslint-disable-next-line no-unused-vars
function evalProposal(dbInst) {
  const fS = "evalProposal";
  const logLoc = logEvalProposal;
  var ret, propID, propNameS;
  try {
    var docInst = new docC(docID, foldID);
    // get proposal name and returns [false,false] if there is a problem--in status.gs
    // eslint-disable-next-line no-unused-vars
    [propID, propNameS] = getCurrPropID_(dbInst, userEmail);
    var propInst = new proposalC(dbInst, propNameS);  // create for later use, specifically in handleBaseRent
    var propSize = propInst.getSize();

    ret = handleExpenses(dbInst, docInst, propSize);
    logLoc ? Logger.log("Expenses: " + ret) : true;
    if (!ret) { throw new Error(`handleExpenses returned false`) }

    ret = handleOver(dbInst, docInst, propSize);
    logLoc ? Logger.log("Over: " + ret) : true;
    if (!ret) { throw new Error(`handleOver returned false`) }

    ret = handleTenAndPrem(dbInst, docInst, propNameS, propSize);
    logLoc ? Logger.log("Premises: " + ret) : true;
    if (!ret) { throw new Error(`handleTenAndPrem returned false`) }

    ret = handleTI(dbInst, docInst, propSize);
    logLoc ? Logger.log("TI: " + ret) : true;
    if (!ret) { throw new Error(`handleTI returned false`) }

    ret = handleJSON(dbInst, docInst);
    logLoc ? Logger.log("JSON: " + ret) : true;
    if (!ret) { throw new Error(`handleJSON returned false`) }

    ret = handleBaseRent(dbInst, docInst, propInst);
    logLoc ? Logger.log("BR: " + ret) : true;
    if (!ret) { throw new Error(`handleBaseRent returned false`) }


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
  var fS = "handleTI", probS, repClauseS,bestFit;
  var tiInS = clauseKeyObjG.ti;
  //var tiInS = "('tiAllow','tiFreight','tiAccess','tiCompBid')";
  try {
    var proposalDetailRows = readInListFromTable(dbInst, "prop_detail_ex", "ProposalClauseKey", tiInS);

    var tiTerms = "";
    proposalDetailRows.forEach((pdRow) => {
      bestFit = matchProposalSizeWithClause(propSize, pdRow.proposalclausekey, proposalDetailRows);
      if (bestFit) { 
      if (bestFit.proposalclausekey === "tiAllow") {
        var tiDollars = curr_formatter.format(bestFit.proposalanswer);
        updateTemplateBody("<<TenantImprovementPSF>>", tiDollars, docInst);
      } else {
        repClauseS = bestFit.clausebody.replace(bestFit.replstruct, bestFit.proposalanswer);
        tiTerms = tiTerms + repClauseS + "\n\n"
      }
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
 * Purpose: deal with Premises, Building (Location), tenant
 *
 * @param  {Object} dbInst - instance of database class
 * @param  {Object} docInst - instance of document class
 * @param  {string} propIDS - proposal identifier
 * @param {string} propSize - one of S/M/L
 * @return {boolean} return - true or false
 */
// attempted fix for propSize
function handleTenAndPrem(dbInst, docInst, propIDS, propSize) {
  var fS = "handleTenAndPrem", probS;
  var foundCorrectSize = false;
  var premClauseBody = "";
  try {
    var retA = readFromTable(dbInst, "proposals", "ProposalName", propIDS, false);
    var spid = retA[0].spaceidentity;
    var tenantNameS = retA[0].tenantname;
    retA = readFromTable(dbInst, "survey_spaces", "identity", spid, false);
    var spA = retA[0]
    //retA = readFromTable(dbInst, "clauses", "ClauseKey", "premises", jsonyn);
    //var pdA = readInListFromTable(dbInst, "prop_detail_ex", "ProposalClauseKey", "('premises')");

    var pdA = readInListFromTable(dbInst, "clauses", "ClauseKey", "('premises')");
    Logger.log(`In ${fS} pdA is ${pdA}`);
    if (pdA.length === 0) {
      throw new Error(`in ${fS} 0 premises clauses ${propSize}`)
    }
    if (pdA.length === 1) {
      premClauseBody = pdA[0].clausebody;
      foundCorrectSize = true;
    } else { // if there is more than one premise clause, choose the right one
      for (var i = 0; i < pdA.length; i++) {
        if (pdA[i].clausesize==propSize) {
          foundCorrectSize = true;
          premClauseBody = pdA[i].clausebody;
          continue;
        }
      }
    }
    if (!foundCorrectSize) { premClauseBody = pdA[0].clausebody }

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
  var proposalDetailRows = [];
  // all clauseKeys in expenses UPDATE if Operating Expenses form update
  // when working change this to extract from ck database
  var expInS = clauseKeyObjG.expenses
  // var expInS = "('oePerInc','oeBaseYear','retBaseYear','elecDirect','elecRentInc','elecSubmeter','elecRentInc')";
  var repClauseS, ret, probS, elRepS, retRepS;
  try {
    // could change query that generates prop_detail_ex to only
    // include current proposal, or get the current proposal here
    // and filter out, or write a query here directly which has the dis-
    // advantage of not excapsulating db calls within gcloudSQL

    proposalDetailRows = readInListFromTable(dbInst, "prop_detail_ex", "ProposalClauseKey", expInS);
    proposalDetailRows.forEach(pdRow => {
      var bestFit = matchProposalSizeWithClause(propSize, pdRow.proposalclausekey, proposalDetailRows);
      if (bestFit) {
        switch (bestFit.section) {
          case "OperatingExpenses":
            repClauseS = bestFit.clausebody.replace(bestFit.replstruct, bestFit.proposalanswer);
            ret = updateTemplateBody("<<OperatingExpenses>>", repClauseS, docInst);
            if (!ret) {
              throw new Error(`In ${fS}: problem with updateTemplateBody on ${repClauseS}`)
            }
            break;
          case "Electric":
            if (bestFit.proposalclausekey === "elecRentInc") {
              elRepS = bestFit.clausebody.replace(bestFit.replstruct, bestFit.proposalanswer);
            } else {
              elRepS = bestFit.clausebody;
            }
            ret = updateTemplateBody("<<Electric>>", elRepS, docInst);
            if (!ret) {
              throw new Error(`In ${fS}: problem with updateTemplateBody on ${repClauseS}`)
            }
            break;
          case "RealEstateTaxes":
            retRepS = bestFit.clausebody.replace(bestFit.replstruct, bestFit.proposalanswer);
            ret = updateTemplateBody("<<RealEstateTaxes>>", retRepS, docInst);
            if (!ret) {
              throw new Error(`In ${fS}: problem with updateTemplateBody on ${repClauseS}`)
            }
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
 * Purpose: takes a proposal size, a clausekey, and a set of rows from
 * the prop_detail_ex view and tests from L->M->S to find the best
 * match, throwing an error if there are no matches
 *
 * @param  {String} propSize - param
 * @param  {String} ck - clause key
 * @param  {Object[]} pdr - stands for proposal detail rows
 * @return {Object} r - row object or false
 */

function matchProposalSizeWithClause(propSize, ck, pdr) {
  const fS = "matchProposalSizeWithClause";
  try {
    var r = "";
    var probS = `ck ${ck} and clause size ${propSize} not found`
    switch (propSize) {
      case "L":
        // find exact match if possible
        r = retRowF("L", ck, pdr); if (r) return r;
        r = retRowF("M", ck, pdr); if (r) return r;
        r = retRowF("S", ck, pdr); if (r) return r;
        throw new Error(probS)
      case "M":
        // find exact match if possible
        r = retRowF("M", ck, pdr); if (r) return r;
        r = retRowF("S", ck, pdr); if (r) return r;
        throw new Error(probS)
      case "S":
        r = retRowF("S", ck, pdr); if (r) return r;
        throw new Error(probS)
    } // end switch

  } // end try

  catch (err) {
    const probS = `In ${fS}: ${err}`;
    Logger.log(probS);
  }
  // if we haven't returned above it measn that we didn't find any matches
  return false
}

function retRowF(findSize, ck, pdr) {
  for (var i = 0; i < pdr.length; i++) {
    if (pdr[i].proposalclausekey === ck && pdr[i].clausesize === findSize) return pdr[i]
  }
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
    var proposalDetailRows = readInListFromTable(dbInst, "prop_detail_ex", "ProposalClauseKey", overInsCl);

    proposalDetailRows.forEach((pdRow) => {
      var bestFit = matchProposalSizeWithClause(propSize, pdRow.proposalclausekey, proposalDetailRows);
      if (bestFit) {
        repClauseS = bestFit.clausebody.replace(bestFit.replstruct, bestFit.proposalanswer);
        ret = updateTemplateBody(bestFit.replstruct, repClauseS, docInst);
        if (!ret) {
          throw new Error(`In ${fS}: problem with updateTemplateBody on ${repClauseS}`)
        }
      }
    });
    // direct replacements: 
    //var overInsS = "('useType','llName','llbrokerName','llbrokerCo','llbrokerAddr','commDate','leaseTerm','earlyAccess')";
    var overInsS = clauseKeyObjG.overview;
    proposalDetailRows = readInListFromTable(dbInst, "prop_detail_ex", "ProposalClauseKey", overInsS);

    proposalDetailRows.forEach((pdRow) => {
      var bestFit = matchProposalSizeWithClause(propSize, pdRow.proposalclausekey, proposalDetailRows);
      if (bestFit) {
        if (bestFit.proposalclausekey === "commDate") {
          // var repS = Utilities.formatDate(new Date(pd.proposalanswer), "GMT-4", "MM/dd/yyyy");
          var dA = bestFit.proposalanswer.split('-');
          repS = `${dA[1]}/${dA[2]}/${dA[0]}`;
        } else {
          repS = bestFit.proposalanswer;
        }
        ret = updateTemplateBody(bestFit.replstruct, repS, docInst);
        if (!ret) {
          throw new Error(`In ${fS}: problem with updateTemplateBody: ${ret}`)
        }
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

/************************HTML *********************** */


// eslint-disable-next-line no-unused-vars
function doGet(request) {
  const dbInst = new databaseC(databaseNameG);
  // eslint-disable-next-line no-undef
  var ddvaluesA = []; // values for proposal dd (dropdown)
  var propA = [];
  // gets a list that looks like [ [name, id],...] - propA
  propA = getProposalNamesAndIDs(dbInst, userEmail);
  Logger.log(`In doGet: ${propA}`);
  for (var i in propA) {
    ddvaluesA.push({ proposal: `${propA[i][0]}` }); // create dropdown array
  }
  var pN = getCurrentProposal(userEmail)[1];
  Logger.log(`ddvalues: ${JSON.stringify(ddvaluesA)}`);
  var html = HtmlService.createTemplateFromFile('indexCD');
  html.proposals = JSON.stringify(ddvaluesA); // move to client side
  html.currProposal = pN;
  var htmlOutput = html.evaluate();
  return htmlOutput
}

/* @Include JavaScript and CSS Files */
// eslint-disable-next-line no-unused-vars
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
    .getContent();
}

/**
 * Purpose: process html-derived formObject passed from client side
 *
 * @param  {objec} formObject - passed from html
 * @return {boolean} ret - return value
 */

/* @Process Form */
// eslint-disable-next-line no-unused-vars
function processForm(formObject) {
  // var formS = JSON.stringify(formObject);
  // Logger.log(formS);
  // console.log(formS);
  var ret = saveAsJSON("processForm.json", formObject);
  ret = onHtmlSubmit(formObject);
  return ret;
}

/*************************** form utilities ***********************/
// eslint-disable-next-line no-unused-vars
function hideSpinner() {
  console.log("attempting to hide spinner");

  document.getElementById('spindiv')
    .style.visibility = 'hidden';
}
// eslint-disable-next-line no-unused-vars
function showSpinner() {
  console.log("attempting to show spinner");

  document.getElementById('spindiv')
    .style.visibility = 'visible';
}

/**
 * Purpose: take the htmlFormObject and "fix" it so that it works. Each form
 * will have slightly different code, but for TI it consists of a stub
 * 
 *
 * @param  {object} htmlFormObject - from processForm
 * @return {String} retS - return value
 */
const log_xfHtmlObj = false;
// eslint-disable-next-line no-unused-vars
function xfHtmlObj(htmlFormObject) {
  var fS = "xfHtmlObj";

  log_xfHtmlObj ? Logger.log(`Returning from ${fS} with ${JSON.stringify(htmlFormObject)}`) : true;
  return htmlFormObject;
}



