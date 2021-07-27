const todayS = Utilities.formatDate(new Date(), "GMT-4", "yyyy-MM-dd");
const propDateS = Utilities.formatDate(new Date(), "GMT-4", "MM/dd/yyyy");
const nowS = Utilities.formatDate(new Date(), "GMT-4", "yyyy-MM-dd HH:MM:ss");
const userEmail = Session.getActiveUser().getEmail();
const ssLogID = '1sUkePGlPOhnBRtGwRQWQZBwfy154zl70jDKL9o3ekKk';   // consolidate spreadsheet--general debug
const docID = '17wgVY-pSMzqScI7GPBf4keprBu_t-LdekXecTlqfcmE';     // Proposal Tempate 1
const foldID = '1eJIDn5LT-nTbMU0GA4MR8e8fwxfe6Q4Q';               // Proposal Generation in MyDrive



Logger = BetterLog.useSpreadsheet(ssLogID);

function onSubmit() {
  var retS = evalProposal();
}

/**
 * Purpose: Evaluate responses to this form and write records to prop_detail table
 *
 * @return {String} retS - Success
 */
function evalProposal() {
  const fS = "evalProposal";
  const pQS = "Proposal Name?"; // proposal question
  var propS, retS, respA, problemS, rA;
  try {
    var dbInst = new databaseC("applesmysql");
    var docInst = new docC(docID, foldID);
    // get proposal name and returns [false,false] if there is a problem--in status.gs
    var [propID, propS] = getCurrPropID_(dbInst, userEmail);    
    var propInst = new proposalC(dbInst, propS);
    var r = setProposalCurrent(dbInst, propInst);
    if (!r) {
      throw new Error(`can't set proposal ${propS} to current`)
    }

    retS = handleExpenses(dbInst, docInst);
    console.log("Expenses: " + retS);
    retS = handleOver(dbInst, docInst);
    console.log("Over: " + retS);
    retS = handleTenAndPrem(dbInst, docInst, propS);
    console.log("Premises: " + retS);
    retS = handleTI(dbInst, docInst);
    console.log("TI: " + retS);
    retS = handleJSON(dbInst, docInst);
    console.log("JSON: " + retS)
    retS = handleBaseRent(dbInst, docInst, propInst);
    console.log("BR: " + retS);

  } catch (err) {
    Logger.log(`In ${fS}: ${err}`);
    return "Problem"
  }
  docInst.saveAndCloseTemplate();
  dbInst.closeconn()
  return "Success"
}


/*********** handleBaseRent********/
/**
 * Purpose: Handle base rent
 *
 * @param  {Object} docInst - document instance
 * @param  {Number} spaceID - integer index into the tourbook table
 * @return {String} updateS - return value
 */

var logHandleBaseRent = false;
function handleBaseRent(dbInst, docInst, propInst) {
  var offsetObj = {}, tempS = "", offset = 0;
  // get the local doc body from the doc instance
  var doc = docInst.locBody;
  // Find the replacement text
  var rgel = doc.findText("<<BaseRentalRate>>");
  var el = rgel.getElement().getParent(); // take the found element and get its parent
  var elType = el.getType();
  var loopCtl = el.toString()  // use the type of the parent (as string) to start the loop
  while (loopCtl != "BODY_SECTION") { // stop when you get to the body section
    par = el.getParent();
    parType = par.getType(); // put parent type into var
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
  var records = readFromTable(dbInst, "base_rent", "ProposalID", propInst.getpropID(), jsonyn);

  // call the sort function (below) to order by begin date (note should be done in DB)
  records.sort(sortDate);
  // create the base rent table; header first
  var t = [["Begin Date", "End Date", "Rent PSF"]];
  // for all the base records, push the created row onto the table
  for (var j = 0; j < records.length; j++) {
    row = [
      Utilities.formatDate(new Date(records[j].begindate), "GMT+1", "MMMM d, yyyy"),
      Utilities.formatDate(new Date(records[j].enddate), "GMT+1", "MMMM d, yyyy"),
      curr_formatter.format(records[j].rentpsf)
    ]
    t.push(row);
  }
  if (logHandleBaseRent) { console.log(t) };
  c0.insertTable(2, t); // insert the table at c0 created above, third paragraph
  var s = c0.getChild(1).getType().toString();
  var s = c0.getChild(2).getType().toString();
  var s = c0.getChild(3).getType().toString();
  // c0.getChild(2).setColumnWidth(0, 80);
  // c0.getChild(2).setColumnWidth(1, 80);
  // c0.getChild(2).setColumnWidth(2, 70);

  // docInstance.saveAndCloseTemplate();
  return `Base Rent Updated for ${propInst.getpropName()}`
}

/**
 * Purpose: get information stored in JSON file, use it to update template for 
 * BrokerName, Broker License and Broker Email
 *
 * @param  {String} param_name - param
 * @param  {itemReponse[]} param_name - an array of responses 
 * @return {String} retS - return value
 */
function handleJSON(dbInst, docInst) {
  var fS = "handleJSON", probS, retS;
  try {
    var fileName = "mcolacino.json";
    var files = DriveApp.getFilesByName(fileName);
    if (files.hasNext()) {
      var file = files.next();
      var content = file.getBlob().getDataAsString();
      var json = JSON.parse(content);
    }
    if (json.name) {
      retS = updateTemplateBody("<<BrokerName>>", json.name, docInst)
    }
    if (json.email) {
      retS = updateTemplateBody("<<BrokerEmail>>", json.email, docInst);
    }
    if (json.license_num) {
      retS = updateTemplateBody("<<BrokerageLicense>>", json.license_num, docInst);
    }
  } catch (err) {
    probS = `In ${fS}: ${err}`
    Logger.log(probS);
    return probS
  }
  return "Success"
}

/**
 * Purpose: Handle TI stuff, which includes
 * Allowance, Freight Access, and other TI conditions
 *
 * @param  {Object} dbInst - instance of database class
 * @param  {Object} docInst - instance of document class
 * @return {String} retS - return value
 */
function handleTI(dbInst, docInst) {
  var fS = "handleTI", probS, retS, repClauseS;
  var tiInS = "('tiAllow','tiFreight','tiAccess','tiCompBid')";
  try {
    var pdA = readInListFromTable(dbInst, "prop_detail_ex", "ProposalClauseKey", tiInS);
    var tiTerms = "";
    pdA.forEach((pd) => {
      if (pd.proposalclausekey === "tiAllow") {
        var tiDollars = curr_formatter.format(pd.proposalanswer);
        retS = updateTemplateBody("<<TenantImprovementPSF>>", tiDollars, docInst);
      } else {
        repClauseS = pd.clausebody.replace(pd.replstruct, pd.proposalanswer);
        tiTerms = tiTerms + repClauseS + "\n\n"
      }
    });
    //if(tiTerms !=""){ tiTerms = tiTerms.slice(0, -2);}
    if (tiTerms != "") { tiTerms = tiTerms.replace(/\n\n$/, ''); }
    retS = updateTemplateBody("<<TenantImprovements>>", tiTerms, docInst);

  } catch (err) {
    probS = `In ${fS}: ${err}`
    Logger.log(probS);
    return probS
  }
  return "Success"
}


/**
 * Purpose: Deal with Premises, Building (Location), tenant
 *
 * @param  {Object} dbInst - instance of database class
 * @param  {Object} docInst - instance of document class
 * @return {String} retS - return value
 */
function handleTenAndPrem(dbInst, docInst, propIDS) {
  var fS = "handleTenAndPrem", retS, probS;
  try {
    var jsonyn = false;
    var retA = readFromTable(dbInst, "proposals", "ProposalName", propIDS, jsonyn);
    var spid = retA[0].spaceidentity;
    var tenantNameS = retA[0].tenantname;
    retA = readFromTable(dbInst, "sub_spaces", "space_identity", spid, jsonyn);
    var spA = retA[0]
    retA = readFromTable(dbInst, "clauses", "ClauseKey", "premises", jsonyn);
    var premClauseBody = retA[0].clausebody;
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
    retS = updateTemplateBody("<<ClientCompany>>", tenantNameS, docInst);

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
  var repClauseS, retS, probS, elRepS;
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
        if (pd.proposalclausekey === "elecRentIncCharge") {
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
 * Purpose: Replaces elements from  Proposal Start and Proposal Overview, including DateOfProposal
 * from prop_detail_ex
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
    var overInsS = "('useType','llName','llbrokerName','llbrokerCo','llbrokerAddr','commDate','leaseTerm','earlyAccess')";
    pdA = readInListFromTable(dbInst, "prop_detail_ex", "ProposalClauseKey", overInsS);
    pdA.forEach((pd) => {
      if (pd.proposalclausekey === "commDate") {
        // var repS = Utilities.formatDate(new Date(pd.proposalanswer), "GMT-4", "MM/dd/yyyy");
        var dA = pd.proposalanswer.split('-');
        repS = `${dA[1]}/${dA[2]}/${dA[0]}`;
      } else {
        repS = pd.proposalanswer;
      }
      retS = updateTemplateBody(pd.replstruct, repS, docInst);
      if (retS != "Success") {
        throw new Error(`In ${fS}: problem with updateTemplateBody: ${retS}`)
      }
    });

    retS = updateTemplateBody("<<DateofProposal>>", propDateS, docInst);
  }
  catch (err) {
    probS = `In ${fS}: ${err}`
    Logger.log(probS);
    return probS
  }
  return "Success"

}

/*************************************Test ************************************ */

function testHandleOver() {
  var dbInst = new databaseC("applesmysql");
  var docInst = new docC(docID, foldID);
  var ret = handleOver(dbInst, docInst);
  docInst.saveAndCloseTemplate();
  dbInst.closeconn()
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

function testHandleBR() {
  var dbInst = new databaseC("applesmysql");
  var propInst = new proposalC(dbInst, "MediaPlus 419 Park Avenue South");
  var docInst = new docC(docID, foldID);
  var retS = handleBaseRent(dbInst, docInst, propInst);

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

function sortDate(r1, r2) {
  if (r1.BeginDate < r2.BeginDate)
    return -1;
  if (r1.BeginDate > r2.BeginDate)
    return 1;
  return 0;
}





