
/*global  */

// Row that might be terminated: ck and text to find
const optRowsStructG = {
  "optRenew": "Renewal Option",
  "optROFO": "Right of First Offer \\(ROFO\\)",
  "optROFR": "Right of First Refusal \\(ROFR\\)",
  "optTerm" : "Right to Terminate"
}

/**
 * Remove all the empty rows from all the tables in a document
 * 
 * @param {object} docInst - instance of doc class
 * @param {string} ck - clause key
 * @return {boolean} true or error 
 */

// eslint-disable-next-line no-unused-vars
function removeOptRows(docInst, ck) {
  const fS = "removeOptRows";
  try {
    const opS = optRowsStructG[ck];
    const tables = docInst.getNewDocID().getBody().getTables();
    const regex = new RegExp(opS,"gi");
    tables.forEach(function (table) {
      var numberOfRows = table.getNumRows();
      for (var rowIndex = 0; rowIndex < numberOfRows; rowIndex++) {
        var nextRow = table.getRow(rowIndex);
        var cellS = nextRow.getCell(0).getText();
        if (regex.test(cellS)) {
          table.removeRow(rowIndex);
          numberOfRows--;
        }        
      } // For each row
    })
  } catch (error) {
    throw new Error(`In ${fS}: ${error.message}`)
  }
  return true

}