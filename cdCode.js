/*exported onSubmit  , todayS , nowS ,  userEmail , logStatusofData ,
docID , foldID , propListInstG */

/*global Utilities , Logger  , DriveApp , BetterLog , HtmlService , 
databaseC , docC , proposalC, propListC , ckC  , propDetailC ,
 getCurrPropID_,  readFromTable ,   maxRows , difference , 
 saveAsJSON  , optRowsStructG , removeOptRows , ckLocalSectionAC , removeParkRows
 */
// 210727 10:39

const todayS = Utilities.formatDate(new Date(), "GMT-4", "MMMM d, yyyy");
// const propDateS = Utilities.formatDate(new Date(), "GMT-4", "MM/dd/yyyy");
const nowS = Utilities.formatDate(new Date(), "GMT-4", "yyyy-MM-dd HH:MM:ss");
// const userEmail = Session.getActiveUser().getEmail();
const userEmail = "mcolacino@squarefoot.com";
const docID = '17wgVY-pSMzqScI7GPBf4keprBu_t-LdekXecTlqfcmE'; // Proposal Tempate 1
const foldID = '1eJIDn5LT-nTbMU0GA4MR8e8fwxfe6Q4Q'; // Proposal Generation in MyDrive
const databaseNameG = "applesmysql";
const dbInstG = new databaseC(databaseNameG);
const propListInstG = new propListC(dbInstG);




/************** clauseKey strings object ***********************/
/* UPDATE  these when form is modified especially when new clauses/clauseKeys are added */
const clauseKeyObjG = {
  expenses: "('oePerInc','oeBaseYear','retBaseYear','elecDirect','elecRentInc','elecSubmeter','elecRentIncCharge')",
  // security: "('secDeposit')",
  overview: "('secDeposit','useType','llName','llbrokerName','proposalSalutation','recipientEmail','llbrokerCo','llbrokerAddr','commDate','leaseTerm','earlyAccess')",
  ti: "('tiAllow','tiFreight','tiAccess','tiCompBid','llWork')",
  opt: "('optRenew','optYears','optROFO','optROFR')",
  park: "('parkUnreservedNum','parkUnreservedRatio','parkUnreservedCost','parkReservedNum',\
        'parkReservedRatio','parkReservedCost','parkMaxEscPercent',parkDescription)"
};



const ssLogID = "1sUkePGlPOhnBRtGwRQWQZBwfy154zl70jDKL9o3ekKk";
// eslint-disable-next-line no-global-assign
Logger = BetterLog.useSpreadsheet(ssLogID);

// var dbInstG = new databaseC("applesmysql");

/**
 * Purpose: When using html forms, this function is called by 
 * processForm with the form object from the html 
 *
 * @param  {object} htmlFormObject - from html form
 * @return {boolean    var probS = `In onSubmit, propblem initializing`;
 } t/f 
 */

const disp_onHtmlSubmit = false;
// eslint-disable-next-line no-unused-vars
function onHtmlSubmit(htmlFormObject = {
  'val': "unneeded"
}) {
  var fS = "onHtmlSubmit";
  var ret;
  //var ck2, pid;
  disp_onHtmlSubmit ? Logger.log(`The htmlFormObject is  ${JSON.stringify(htmlFormObject)}`) : true;
  // Include this test in production but not in testing
  var dbInst = dbInstG;
  try {
    ret = evalProposal(dbInst);
    return ret

  } catch (err) {
    var probS = `In ${fS}, problem initializing`;
    Logger.log(probS);
    return false

  }
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
  [propID, propNameS] = getCurrPropID_(dbInst, userEmail);
  var docInst; 
  try {
    // get proposal name and returns [false,false] if there is a problem--in status.gs
    // eslint-disable-next-line no-unused-vars
    docInst = new docC(docID, foldID, propNameS); 
    const propInst = new proposalC(dbInst, propNameS); // create for later use, specifically in handleBaseRent
    // const propSize = propInst.getSize();
    const propDetailInst = new propDetailC(dbInst, propID);
    const ckSectionInst = new ckLocalSectionAC();

    ret = handleExpenses(dbInst, docInst, propDetailInst, propInst, ckSectionInst);
    logLoc ? Logger.log("Expenses: " + ret) : true;
    if (!ret) {
      throw new Error(`handleExpenses returned false`)
    }
    var fName = "handleExpenses";
    console.log(`${fName} completed successfully`)

    ret = handleOver(dbInst, docInst, propDetailInst, propInst);
    logLoc ? Logger.log("Over: " + ret) : true;
    if (!ret) {
      throw new Error(`handleOver returned false`)
    }
    fName = "handleOver";
    console.log(`${fName} completed successfully`)

    ret = handleTenAndPrem(dbInst, docInst, propInst);
    logLoc ? Logger.log("Premises: " + ret) : true;
    if (!ret) {
      throw new Error(`handleTenAndPrem returned false`)
    }
    fName = "handleTenAndPrem";
    console.log(`${fName} completed successfully`);

    ret = handleTI(dbInst, docInst, propDetailInst, propInst);
    logLoc ? Logger.log("TI: " + ret) : true;
    if (!ret) {
      throw new Error(`handleTI returned false`)
    }
    fName = "handleTI";
    console.log(`${fName} completed successfully`);

    ret = handleJSON(docInst);
    logLoc ? Logger.log("JSON: " + ret) : true;
    if (!ret) {
      throw new Error(`handleJSON returned false`)
    }

    ret = handleBaseRent(dbInst, docInst, propInst);
    logLoc ? Logger.log("BR: " + ret) : true;
    if (!ret) {
      throw new Error(`handleBaseRent returned false`)
    }
    fName = "handleBaseRent";
    console.log(`${fName} completed successfully`);

    ret = handleOpt(dbInst, docInst, propDetailInst, propInst);
    if (!ret) {
      throw new Error(`handleOpt returned false`)
    }
    fName = "handleOpt";
    console.log(`${fName} completed successfully`);

    ret = handleParking(dbInst, docInst, propDetailInst, propInst, ckSectionInst);
    if (!ret) {
      throw new Error(`handleParking returned false`)
    }
    fName = "handleParking";
    console.log(`${fName} completed successfully`);

  } catch (err) {
    Logger.log(`In ${fS}: ${err}`);
    return false
  }
  docInst.saveAndCloseTemplate();
  dbInst.closeconn()
  return true
}

/**
 * Purpose: Handle base rent
 *
 * @param {Object} dbInst - instance of databaseC
 * @param  {Object} docInst - docC instance
 * @param  {object} propInst - proposalC instance
 * @@return {boolean} return - true or false
 */
const disp_handleBaseRent = false;

function handleBaseRent(dbInst, docInst, propInst) {
  var fS = "handleBaseRent";
  var locLog = disp_handleBaseRent;

  try {
    var propID = propInst.getID();
    var offsetObj = {},
      offset = 0;
    // get the local doc body from the doc instance
    var doc = docInst.locBody;
    // Find the replacement text
    var rgel = doc.findText("<<BaseRentalRate>>");
    var el = rgel.getElement().getParent(); // take the found element and get its parent
    var loopCtl = el.toString() // use the type of the parent (as string) to start the loop
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
    var t = [
      ["Begin Date", "End Date", "Rent PSF"]
    ];
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
  } catch (err) {
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
function handleJSON(docInst) {
  var fS = "handleJSON",
    probS;
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
// clauseKeyObjG.ti: "('tiAllow','tiFreight','tiAccess','tiCompBid','llWork')"

function handleTI(dbInst, docInst, propDetailInst, propInst) {
  var fS = "handleTI";
  const inS = clauseKeyObjG.ti;

  var tiTerms = "";
  var probS, ret;
  var ckInst;
  var proposalanswer, clausebody, replstruct;
  try {
    // const propStruct = getPropStructFromName(dbInst, propNameS);
    const tempCKS = inS.slice(2, inS.length - 2);
    const clauseKeyA = tempCKS.split("','");
    var ck;
    for (var i in clauseKeyA) {
      ck = clauseKeyA[i];
      ckInst = new ckC(dbInst, ck, propInst.getSize(), propInst.getLocation(), "current");
      replstruct = ckInst.getReplStruct();
      clausebody = ckInst.getClauseBody();
      proposalanswer = propDetailInst.getAnswerFromCK(ck);
      if (!proposalanswer) continue; // didn't find this ck in prop_detail so continue to next
      switch (ck) {
        case "tiAllow":
          if (checkZeroValue(proposalanswer)) {
            const tiDollars = curr_formatter.format(proposalanswer);
            tiTerms = tiTerms + clausebody.replace(replstruct, tiDollars) + "\n\n";
          }
          break;
        case "llWork":
          if (proposalanswer !== "") {
            tiTerms = tiTerms + clausebody.replace(replstruct, proposalanswer) + "\n\n";
          }
          break;
        default:
          tiTerms = tiTerms + clausebody.replace(replstruct, proposalanswer) + "\n\n";
          break;
      } // end switch

    } // end for

    if (tiTerms != "") {
      tiTerms = tiTerms.replace(/\n\n$/, '');
    }
    const docReplS = "<<TenantImprovements>>";
    ret = updateTemplateBody(docReplS, tiTerms, docInst);
    if (!ret) {
      throw new Error(`In ${fS}: problem with updateTemplateBody `)
    }

  } catch (err) {
    probS = `In ${fS}: ${err}`
    Logger.log(probS);
    return false
  }
  return true
}

/**
 * Purpose check if a value is 0 or equivalent
 *
 * @param  {String} param_name - param
 * @param  {itemReponse[]} param_name - an array of responses 
 * @return {String} retS - return value
 */
function checkZeroValue(valS) {
  // can convert to number and then check if >0
  var valN = +valS;
  if (!valN) return false
  if (valN <= 0) return false
  if (valN > 0) return true
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
function handleTenAndPrem(dbInst, docInst, propInst) {
  var fS = "handleTenAndPrem",
    probS;
  var premClauseBody = "";
  try {
    // create spA: record from survey_spaces: contains address, squareFeet, and floorAndSuite (in first slot)
    const spA = readFromTable(dbInst, "survey_spaces", "identity", propInst.getSpaceIdentity(), false)[0];
    // create clause key instance for premises
    const ckInst = new ckC(dbInst, "premises", propInst.getSize(), propInst.getLocation, "current");
    // first update inside the premises clause, putting in sf, floorAndSuite
    premClauseBody = ckInst.getClauseBody();
    const fmtsf = new Intl.NumberFormat().format(spA.squarefeet)
    premClauseBody = premClauseBody.replace("<<SF>>", fmtsf);
    premClauseBody = premClauseBody.replace("<<FloorAndSuite>>", spA.floorandsuite);
    // now update the template for premises, address, and client company
    updateTemplateBody("<<Premises>>", premClauseBody, docInst)
    updateTemplateBody("<<Address>>", spA.address, docInst);
    updateTemplateBody("<<ClientCompany>>", propInst.getTenant(), docInst);
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
 * @param  {string} propNameS - name of proposal
 * @param  {object} propDetailInst - instance of prop detail
 * @param  {object} ckSectionInst -- instance of ckSectionAC
 * @return {boolean} t/f - return true or false
 */
// now uses ckC
function handleExpenses(dbInst, docInst, propDetailInst, propInst, ckSectionInst) {
  var fS = "handleExpenses";
  // get clauseKeys from the global structure; update this when cks are added
  //const inS = clauseKeyObjG.expenses;

  var ckInst, repClauseS, proposalanswer, clausebody, replstruct, ret, probS, elRepS, retRepS;
  const location = propInst.getLocation();
  try {
    const clauseKeyA = ckSectionInst.getExpA(location);
    // create array of ckC instances, with each ck from expInS
    clauseKeyA.forEach(ck => {
      ckInst = new ckC(dbInst, ck, propInst.getSize(), location, "current");
      replstruct = ckInst.getReplStruct();
      clausebody = ckInst.getClauseBody();
      proposalanswer = propDetailInst.getAnswerFromCK(ck);
      if (proposalanswer) {
        switch (ckInst.getSection()) {
          case "OperatingExpenses":
            repClauseS = clausebody.replace(replstruct, proposalanswer);
            ret = updateTemplateBody("<<OperatingExpenses>>", repClauseS, docInst);
            if (!ret) {
              throw new Error(`In ${fS}: problem with updateTemplateBody on ${repClauseS} `)
            }
            break;
          case "Electric":
            // special case (two level replace) for elecRentInc
            if (ck === "elecRentInc") {
              elRepS = clausebody.replace(replstruct, proposalanswer);
            } else {
              elRepS = clausebody;
            }
            ret = updateTemplateBody("<<Electric>>", elRepS, docInst);
            if (!ret) {
              throw new Error(`In ${fS}: problem with updateTemplateBody on ${elRepS} `)
            }
            break;
          case "RealEstateTaxes":
            retRepS = clausebody.replace(replstruct, proposalanswer);
            ret = updateTemplateBody("<<RealEstateTaxes>>", retRepS, docInst);
            if (!ret) {
              throw new Error(`In ${fS}: problem with updateTemplateBody on ${retRepS} `)
            }
            break;
          default:
            break;
        }
      } // end if
    }); // end forEach
  } catch (err) {
    probS = `In ${fS}: ${err} `
    Logger.log(probS);
    return false
  }
  return true
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

function handleOver(dbInst, docInst, propDetailInst, propInst) {
  const fS = "handleOver";
  const inS = clauseKeyObjG.overview;

  // var tiTerms = "";
  var probS, repS, ret, repClauseS;
  var ckInst;
  var proposalanswer, clausebody, replstruct;
  try {
    // first do security deposit

    // const propStruct = getPropStructFromName(dbInst, propNameS);
    const tempCKS = inS.slice(2, inS.length - 2);
    const clauseKeyA = tempCKS.split("','");
    var ck;
    for (var i in clauseKeyA) {
      ck = clauseKeyA[i];
      ckInst = new ckC(dbInst, ck, propInst.getSize(), propInst.getLocation(), "current");
      replstruct = ckInst.getReplStruct();
      clausebody = ckInst.getClauseBody();
      proposalanswer = propDetailInst.getAnswerFromCK(ck);
      if (!proposalanswer) continue; // didn't find this ck in prop_detail so continue to next
      switch (ck) {
        case "secDeposit":
          repClauseS = clausebody.replace(replstruct, proposalanswer);
          ret = updateTemplateBody(replstruct, repClauseS, docInst);
          if (!ret) {
            throw new Error(`In ${fS}: problem with updateTemplateBody on ${repClauseS} `)
          }
          break;
        case "commDate":
          var dA = proposalanswer.split('-');
          repS = `${dA[1]} /${dA[2]}/${dA[0]} `;
          ret = updateTemplateBody(replstruct, repS, docInst);
          if (!ret) {
            throw new Error(`In ${fS}: problem with updateTemplateBody: ${ret} `)
          }
          break;
        case "recipientEmail":
          if (proposalanswer != "") {
            repS = `Sent Via E-mail: ${proposalanswer}`;
          }
          ret = updateTemplateBody(replstruct, repS, docInst);
          if (!ret) {
            throw new Error(`In ${fS}: problem with 'recipientEmail' in updateTemplateBody: ${ret} `)
          }
          break;
        default:
          ret = updateTemplateBody(replstruct, proposalanswer, docInst);
          if (!ret) {
            throw new Error(`In ${fS}: problem with updateTemplateBody: ${ret} `)
          }
          break;
      } // end switch
    } // end for
    ret = updateTemplateBody("<<DateofProposal>>", propInst.getPropDateS(), docInst);
    if (!ret) {
      throw new Error(`In ${fS}: problem with updateTemplateBody: ${ret} `)
    }
  } catch (err) {
    probS = `In ${fS}: ${err} `
    Logger.log(probS);
    return false

  }
  return true
}

/**
 * Purpose: Handle option stuff, which includes
 * renewal (and years), ROFO, and ROFR
 *
 * @param  {Object} dbInst - instance of database class
 * @param  {Object} docInst - instance of document class
 * @return {boolean} return - true or false
 */
// clauseKeyObjG.opt -> opt: "('optRenew','optYears','optROFO','optROFR')"

function handleOpt(dbInst, docInst, propDetailInst, propInst) {
  var fS = "handleOpt";
  // const inS = clauseKeyObjG.opt;
  var ckSet = new Set(Object.keys(optRowsStructG)); // in removeOptRows.js
  var knockOutSet = new Set();
  // const clauseKeyA = ["optRenew", "optROFR", "optROFO", "optTerm"];


  var probS, ret;
  var ckInst, ckInstYears;
  var proposalanswer, clausebody, replstruct;
  try {
    // const propStruct = getPropStructFromName(dbInst, propNameS);
    // const tempCKS = inS.slice(2, inS.length - 2);
    // const clauseKeyA = tempCKS.split("','");
    var optYears, repClauseS;
    for (let ck of ckSet) {
      // ck = clauseKeyA[i];
      ckInst = new ckC(dbInst, ck, propInst.getSize(), propInst.getLocation(), "current");
      clausebody = ckInst.getClauseBody();
      proposalanswer = propDetailInst.getAnswerFromCK(ck);
      if (!proposalanswer) continue; // didn't find this ck in prop_detail so continue to next
      switch (ck) {
        case "optRenew":
          // get number of years as the answer to ck "optYears"
          optYears = propDetailInst.getAnswerFromCK("optYears");
          // create a ckInst for "optYears"
          ckInstYears = new ckC(dbInst, "optYears", propInst.getSize(), propInst.getLocation(), "current");
          // get the replStruct for that
          replstruct = ckInstYears.getReplStruct();
          // use this replStruct to update the clausebody for "optRenew"
          repClauseS = clausebody.replace(replstruct, optYears);
          // use the updated clausebody in repClauseS to update the template body
          ret = updateTemplateBody("<<renewalOption>>", repClauseS, docInst);
          if (!ret) {
            throw new Error(`In ${fS}: problem with updateTemplateBody for optRenew `)
          }
          // add to knockOutSet, which then removes this from the delete list below
          knockOutSet.add("optRenew");
          break;
        case "optROFO": // just add to the end
          if (proposalanswer !== "") {
            ret = updateTemplateBody("<<ROFOOption>>", clausebody, docInst);
            if (!ret) {
              throw new Error(`In ${fS}: problem with updateTemplateBody for optROFO `)
            }
          }
          knockOutSet.add("optROFO");
          break;
        case "optROFR": // just add to the end
          if (proposalanswer !== "") {
            ret = updateTemplateBody("<<ROFROption>>", clausebody, docInst);
            if (!ret) {
              throw new Error(`In ${fS}: problem with updateTemplateBody for optROFO `)
            }
          }
          knockOutSet.add("optROFR")
          break;
        default:
          // optTerms = optTerms + clausebody.replace(replstruct, proposalanswer) + "\n\n";
          break;
      } // end switch
    } // end for
    // delete provisions here
    const deleteOptSet = new Set(difference(ckSet, knockOutSet));
    for (let ck of deleteOptSet) {
      ret = removeOptRows(docInst, ck);
    }
    // console.log(`removeOptSet: ${deleteOptSet}`)

  } catch (err) {
    probS = `In ${fS}: ${err}`
    Logger.log(probS);
    return false
  }
  return true
}


/**
 * Purpose: Handle Parking stuff, which includes
 *
 * @param  {Object} dbInst - instance of database class
 * @param  {Object} docInst - instance of document class
 * @param  {object} propDetailInst -- instance of propDetailC 
 * @return {boolean} return - true or false
 */
// propDetailInst has the answers to questions for the form
// propInst has the proposal information
// ckSectionInst has the list of ck's for parking

function handleParking(dbInst, docInst, propDetailInst, propInst, ckSectionInst) {
  var fS = "handleParking";
  var probS, ret, proposalanswer, replstruct, ckInst;

  try {
    const location = propInst.getLocation();
    if (location === "New York") {
      ret = removeParkRows(dbInst, "parkGeneral");
      return
    }
    const clauseKeyA = ckSectionInst.getParkA();
    // first get the parkGeneral clauseBody and replStruct (<<parkGeneral>>) if it exists
    const ckInstParkGen = new ckC(dbInst, "parkGeneral", propInst.getSize(), propInst.getLocation(), "current");
    var mainClause = ckInstParkGen.getClauseBody();

    clauseKeyA.forEach(ck => {
      ckInst = new ckC(dbInst, ck, propInst.getSize(), propInst.getLocation(), "current");
      replstruct = ckInst.getReplStruct();
      // clausebody = ckInst.getClauseBody();
      proposalanswer = propDetailInst.getAnswerFromCK(ck);
      if (proposalanswer !== "") {
        mainClause = mainClause.replace(replstruct, proposalanswer);
      }
    }); // end forEach

    ret = updateTemplateBody("<<parkGeneral>>", mainClause, docInst);
    if (!ret) {
      throw new Error(`In ${fS}: problem with updateTemplateBody `)
    }

  } catch (err) {
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
    var probS = `In ${fS}: unable to update ${replStructure} `;
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
    var fS = "chkMajorPropDetailCategories",
      qryS = "";
    var incSec = [],
      excSec = [];
    var results;

    // const dbInst = new databaseC("applesmysql");
    const dbInst = dbInstG;
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
      qryS = `SELECT * FROM prop_detail_ex where ProposalID = '${propID}' AND section = '${s}'; `;
      results = stmt.executeQuery(qryS);
      results.next() ? incSec.push(s) : excSec.push(s);
    });
    // excSec.length==0 ? excSec =["none"] : true;
    logChkMajorPropDetailCategories ? Logger.log(`in: ${incSec} missing: ${excSec} `) : true;
    return [incSec, excSec, excSec.length]
  } catch (err) {
    Logger.log(`In ${fS}: ${err} `);
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
  } else {
    excSec.forEach((sec) => {
      Logger.log(`In ${fS} missing sections: ${sec} `);
    });
    return false
  }

}

const disp_doGet = false;


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
  // const dbInst = new databaseC(databaseNameG);
  const propListInst = propListInstG;

  // eslint-disable-next-line no-undef
  var ddvaluesA = []; // values for proposal dd (dropdown)
  var propA = [],
    pid, pNS;
  // gets a list that looks like [ [name, id],...] - propA
  propA = propListInst.getPropNIDA();
  disp_doGet ? Logger.log(`In doGet: ${propA}`) : true;
  Logger.log(`In doGet propA: ${propA}`);
  for (var i in propA) {
    ddvaluesA.push({
      proposal: `${propA[i][0]}`
    }); // create dropdown array
  }
  pid = propListInst.getCurr();
  // Logger.log(`in doGet pid is ${pid}`);
  pNS = propListInst.getNamefromID(pid);
  // Logger.log(`in doGet pNS is ${pNS}`);

  var html = HtmlService.createTemplateFromFile('indexCD');
  html.proposals = JSON.stringify(ddvaluesA); // move to client side
  html.currProposal = pNS;
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

/*************************** utilities ***********************/
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
 * Purpose: for the propID parameter make an array of structures of the form 
 * [{ ck: theClauseKey, ans: answerFromPropDetail }..] based on all of the 
 * prop_detail records for this propID.
 *
 * @param  {object} dbInst - instance of database
 * @param  {string} propID - proposal id
 * @return {object[]} propDetailA - return value
 */

// eslint-disable-next-line no-unused-vars
function createPropDetailA(dbInst, propID) {
  const fS = "createPropDetailA";
  var propDetailA = [];
  // var ansStruct = {};
  var results;

  try {
    const locConn = dbInst.getconn(); // get connection from the instance
    const stmt = locConn.createStatement();
    const qryS = `SELECT ProposalClauseKey, ProposalAnswer FROM prop_detail where ProposalID = '${propID}'`;
    results = stmt.executeQuery(qryS);
    if (!results.next()) {
      throw new Error(`no prop_detail records for ${propID}`)
    }
    results.beforeFirst();
    while (results.next()) {
      var ansStruct = {};
      ansStruct.ck = results.getString("ProposalClauseKey");
      ansStruct.ans = results.getString("ProposalAnswer");
      propDetailA.push(ansStruct);
    }

  } catch (error) {
    const probS = `In ${fS}: error: ${error}`;
    Logger.log(probS);
    throw new Error(probS)

  }
  return propDetailA
}