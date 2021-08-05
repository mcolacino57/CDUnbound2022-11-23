/*global Logger,databaseC,*/
/*exported getProposalNamesAndIDs,getSpaceDisplay,getProposalData,
setProposalCurrent */
/****************Called from other gs files*************** */
/**
 * Purpose: read row(s) up to maxRows from database using dbInst for connection
 * Returns a json record
 *
 * @param  {object} dbInst - instance of database class
 * @param {string} tableNameS - table to read
 * @param {string} colS - column to select on
 * @param {object[]} rowA - array of objects
 * @return {String} retS - return value
 * 
 * return value is in the form: 
 */

const logReadFromTable = false;
const maxRows = 1000;
function readFromTable(dbInst, tableNameS, colS, searchS, jsonyn) {
  var fS = "readFromTable";
  var logLoc = logReadFromTable;
  /*********connect to database ************************************ */
  try {
    var locConn = dbInst.getconn(); // get connection from the instance
    logLoc ? console.log(locConn.toString()) : true;
    var stmt = locConn.createStatement();
    stmt.setMaxRows(maxRows);
  } catch (err) {
    console.log(`In ${fS} issue getting connection or creating statement: ${err}`);
    return -1
  }
  /******************extract rows that meet select criteria ********* */
  var qryS = `SELECT * FROM ${tableNameS} where ${colS} = "${searchS}";`;
  try {
    var results = stmt.executeQuery(qryS);
    var numCols = results.getMetaData().getColumnCount();
  } catch (err) {
    console.log(`In ${fS} problem with executing ${colS} = ${searchS} query : ${err}`);
    return false
  }
  var dataA = [];
  while (results.next()) {  // the resultSet cursor moves forward with next; ends with false when at end
    var recA = [];
    for (var col = 0; col < numCols; col++) {
      recA.push(results.getString(col + 1));  // create inner array(s)
    }
    dataA.push(recA); // push inner array into outside array
  }
  // This finishes with an nxm matrix with #rows = length of dataA and #cols = numCols
  logLoc ? console.log(dataA) : true;

  /**************************now get the header names ************************** */
  qryS = `SHOW COLUMNS FROM ${tableNameS};`
  try {
    var stmt2 = locConn.createStatement();
    var colA = [];
    var cols = stmt2.executeQuery(qryS);
    while (cols.next()) {
      colA.push(cols.getString(1));
    }
  } catch (err) {
    var problemS = `In ${fS} problem with executing query : ${err}`
    Logger.log(problemS);
    return problemS
  }

  var rowA = splitRangesToObjects(colA, dataA); // utility function in objUtil.gs
  logLoc ? console.log(rowA) : true;

  results.close();
  stmt.close();
  stmt2.close();

  // Turn the result into a json record with fields as the key for each record
  // This preserves backward compatibility with the AT code which used a REST
  // call to get the data which was returned as json structure
  // This should be changed to be simpler in future
  var retA = [];
  for (var j in rowA) {
    var retObj = new Object();
    retObj["fields"] = rowA[j];
    retA.push(retObj);
  }
  // console.log(retA);
  if (jsonyn) { 
    return retA }
  else { 
    return rowA }

}

/**
 * Purpose: read row(s) up to maxRows from database using dbInst for connection
 *
 * @param  {object} dbInst - instance of database class
 * @param {string} tableNameS - table to read
 
 * @return {String} retS - return value
 */

 const logReadAllFromTable = false;
 function readAllFromTable(dbInst, tableNameS,jsonyn=true) {
   var fS = "readAllFromTable";
   var logLoc = logReadAllFromTable;
   /*********connect to database ************************************ */
   try {
     var locConn = dbInst.getconn(); // get connection from the instance
     logLoc ? console.log(locConn.toString()) : true;
 
     var stmt = locConn.createStatement();
     stmt.setMaxRows(maxRows);
   } catch (err) {
     console.log(`In ${fS} issue getting connection or creating statement: ${err}`);
     return false
   }
   /******************extract rows that meet select criteria ********* */
   var qryS = `SELECT * FROM ${tableNameS};`;
   try {
     var results = stmt.executeQuery(qryS);
     var numCols = results.getMetaData().getColumnCount();
   } catch (err) {
     console.log(`In ${fS} problem with executing query : ${err}`);
     return -1
   }
   var dataA = [];
   while (results.next()) {  // the resultSet cursor moves forward with next; ends with false when at end
     var recA = [];
     for (var col = 0; col < numCols; col++) {
       recA.push(results.getString(col + 1));  // create inner array(s)
     }
     dataA.push(recA); // push inner array into outside array
   }
   logLoc ? console.log(dataA) : true;
 
   /**************************now get the header names ************************** */
   try {
     var colA = dbInst.getcolumns(tableNameS);
   } catch (err) {
     var problemS = `In ${fS} problem with executing query : ${err}`
     console.log(problemS);
     return problemS
   }
   var rowA = splitRangesToObjects(colA, dataA); // utility fn in objUtil.gs
   logLoc ? console.log(rowA) : true;
   results.close();
   stmt.close();
   var retA = [];
   for (var j in rowA) {
     var retObj = new Object();
     retObj["fields"] = rowA[j];
     retA.push(retObj);
   }
    if (jsonyn) {
     return retA 
     }
   else { 
     return rowA 
     }
 }

/** NOTE: This code is the same as in BASER..any changes should probably be in both
 * 
  * Purpose: get an array of ProposalNames and IDs from proposals table
  *         based upon the name of the user
  *
  * @param  {String} userS - optional user string (email)
  * @return {array} propNameIDA - 2D array: name, id
  */

function getProposalNamesAndIDs(dbInst, userS = "mcolacino@squarefoot.com") {
  // var dbInst = new databaseC("applesmysql");
  var tableNameS = "proposals";
  var colNameS = "CreatedBy";
  var searchS = userS;
  var jsonyn = false;
  var ret = readFromTable(dbInst, tableNameS, colNameS, searchS,jsonyn);
  var propNameIDA = ret.map(function (record) {
    return [record.proposalname, record.proposalid]
  })
  //console.log(propNameIDA)
  return propNameIDA
}

/**
 * Purpose: Join spaces and buildings (view?) to get SpaceID / Floor / Suite / Square Footage
 *
 * @param  {String} param_name - param
 * @param  {itemReponse[]} param_name - an array of responses 
 * @return {String} retS - return value
 */
const logGetSpaceDisplay = false;
// eslint-disable-next-line no-unused-vars
function getSpaceDisplay(userS = "mcolacino@squarefoot.com") {
  var dbInst = new databaseC("applesmysql");
  var tableNameS = "display_spaces"; // this is actually a view but should work the same
  var jsonyn = true;
  var ret = readAllFromTable(dbInst, tableNameS,jsonyn);
  var spaceA = ret.map(record => {
    return {
      sdesc: record.fields.displayspace,
      sidentity: record.fields.spaceidentity  // note that somewhere along the way underscore gets stripped
    }
  })
  logGetSpaceDisplay ? console.log(spaceA) : true;
  return spaceA

}


/** 
  * Purpose: Get data from the proposal table
  *         based upon the name of the user
  *
  * @param  {String} userS - optional user string (email)
  * @return {array} propDataA - 2D array: name, id, loc, size
  */

function getProposalData(userS = "mcolacino@squarefoot.com") {
  var dbInst = new databaseC("applesmysql");
  var tableNameS = "proposals";
  var colNameS = "CreatedBy";
  var searchS = userS;
  var ret = readFromTable(dbInst, tableNameS, colNameS, searchS);
  var propDataA = ret.map(function (record) {
    return [record.fields.proposalname, record.fields.proposalid, record.fields.proposallocation, record.fields.proposalsize]
  })
  console.log(propDataA)
  return propDataA
}

/**
 * Purpose: Takes the proposal instance and sets the proposal to current, 
 * toggling all other proposals (meaning ALL) to false first
 * 
 * @param  {Object} dbInst - instance of databaseC
 * @param  {Object} propInst - instance of proposalC
 * @return {String} retS - return value
 */
/* UPDATE [LOW_PRIORITY] [IGNORE] table_name 
SET 
    column_name1 = expr1,
    column_name2 = expr2,
    ...
[WHERE
    condition];*/

const logSetProposalCurrent = false;
function setProposalCurrent(dbInst, propInst) {
  var fS = "setProposalCurrent";
  try {
    var pid = propInst.getpropID();
    var locConn = dbInst.getconn(); // get connection from the instance

    // first set all proposal current -> false
    locConn = dbInst.getconn(); // get connection from the instance
    var qryS1 = `UPDATE proposals SET proposals.current = false;`;
    var stmt = locConn.prepareStatement(qryS1);
    stmt.execute();
    var qryS2 = `UPDATE proposals SET proposals.current = true WHERE proposals.ProposalID= '${pid}';`;
    // console.log(qryS);
    stmt = locConn.prepareStatement(qryS2);
    stmt.execute();
  } catch (err) {
    logSetProposalCurrent ? Logger.log(`In ${fS}: ${err}`) : true;
    return "Problem"
  }
  return "Success"

}

/**
 * Purpose: 
 *
 * @param  {Object} dbInst - instance of database class
 * @param {String} tableNameS - table to read
 * @param {String} colS - column to select on
 * @param {String} inListS - string in IN SQL format
 * @return {String} retS - return value
 * 
 * return value is in the form: 
 */

 const logReadInListFromTable = false;
 function readInListFromTable(dbInst, tableNameS, colS, inListS) {
   var fS = "readInListFromTable";
   var logLoc = logReadInListFromTable;
   var problemS;
   /*********connect to database ************************************ */
   try {
     var locConn = dbInst.getconn(); // get connection from the instance
     logLoc ? console.log(locConn.toString()) : true;
     var stmt = locConn.createStatement();
     stmt.setMaxRows(maxRows);
   } catch (err) {
     problemS = `In ${fS} issue getting connection or creating statement: ${err}`;
     Logger.log(problemS);
     return problemS
   }
   /******************extract rows that meet select criteria ********* */
   var qryS = `SELECT * FROM ${tableNameS} where ${colS} IN ${inListS};`;
   logLoc ? console.log(qryS) : true;
   try {
     var results = stmt.executeQuery(qryS);
     var numCols = results.getMetaData().getColumnCount();
   } catch (err) {
     problemS = `In ${fS} problem with executing ${colS} = ${inListS} query : ${err}`;
     Logger.log(problemS);
     return problemS
   }
   var dataA = [];
   while (results.next()) {  // the resultSet cursor moves forward with next; ends with false when at end
     recA = [];
     for (var col = 0; col < numCols; col++) {
       recA.push(results.getString(col + 1));  // create inner array(s)
     }
     dataA.push(recA); // push inner array into outside array
   }
   // This finishes with an nxm matrix with #rows = length of dataA and #cols = numCols
   logLoc ? console.log(dataA) : true;
 
   /**************************now get the header names ************************** */
   var qryS = `SHOW COLUMNS FROM ${tableNameS};`
   try {
     stmt2 = locConn.createStatement();
     var colA = [];
     var cols = stmt2.executeQuery(qryS);
     while (cols.next()) {
       colA.push(cols.getString(1));
     }
   } catch (err) {
     var problemS = `In ${fS} problem with executing query : ${err}`
     Logger.log(problemS);
     return problemS
   }
 
   var rowA = splitRangesToObjects(colA, dataA); // utility function in objUtil.gs
   logLoc ? console.log(rowA) : true;
 
   results.close();
   stmt.close();
   stmt2.close();
 
   return rowA
 }


/*****************UTILITIES********************* */

/**
 * Changes a range array into an array of objects with key value pairs
 *
 * @params  {array}    headers  [key, key, ...]
 * @params  {array}    values    [[value, value, ...], ...]
 * @returns {array}    [{key:value, ...}, ...]  
 */
function splitRangesToObjects(headers, values) {
  var rowObjects = [];
  for (var i = 0; i < values.length; ++i) {
    var row = new Object();
    //row.rowNum = i;
    for (var j in headers) {
      row[camelString(headers[j])] = values[i][j];
    }
    rowObjects.push(row);
  }
  return rowObjects;
}

/**
 * Removes special characters from a string
 * Commonly know as a camelCase, 
 * Examples:
 *   "First Name" -> "firstName"
 *   "Market Cap (millions) -> "marketCapMillions
 *   "1 number at the beginning is ignored" -> "numberAtTheBeginningIsIgnored"
 * @params  {string}  header   string
 * @returns {string}           camelCase 
 */
function camelString(header) {
  var key = "";
  var upperCase = false;
  for (var i = 0; i < header.length; ++i) {
    var letter = header[i];
    if (letter == " " && key.length > 0) {
      upperCase = true;
      continue;
    }
    if (!isAlnum_(letter)) {
      continue;
    }
    if (key.length == 0 && isDigit_(letter)) {
      continue; // first character must be a letter
    }
    if (upperCase) {
      upperCase = false;
      key += letter.toUpperCase();
    } else {
      key += letter.toLowerCase();
    }
  }
  return key;
}

function isAlnum_(char) {
  return char >= 'A' && char <= 'Z' ||
    char >= 'a' && char <= 'z' ||
    isDigit_(char);
}
function isDigit_(char) {
  return char >= '0' && char <= '9';
}





