/*global  DriveApp , Logger*/

/**
 * Purpose
 *
 * @param  {String} param_name - param
 * @param  {itemReponse[]} param_name - an array of responses 
 * @return {String} retS - return value
 */

// eslint-disable-next-line no-unused-vars
function getEmailFromJSON() {
    const fS = "getEmailFromJSON";

    try {
        const fileName = "propgen.json";
        const files = DriveApp.getFilesByName(fileName);
        if (files.hasNext()) {
            var file = files.next();
            var content = file.getBlob().getDataAsString();
            var json = JSON.parse(content);
        }
        if (json.email) { return json.email }
        else { return false }

    } catch (err) {
        const probS = `In ${fS}: ${err}`
        Logger.log(probS);
        return false
    }
}

// eslint-disable-next-line no-unused-vars
function saveAsJSON(fileNameS, obj) {
  var file = DriveApp.createFile(fileNameS, JSON.stringify(obj));
  return file
}

/**
 * Purpose: get the values from the processForm for testing purposes
 *
 * 
 * @return {object} json - return value
 */

// eslint-disable-next-line no-unused-vars
function getProcessFormJSON() {
  var fS = "getProcessFormJSON";
  try {
    const fileName = "processForm.json";
    const files = DriveApp.getFilesByName(fileName);
    if (files.hasNext()) {
        var file = files.next();
        var content = file.getBlob().getDataAsString();
        var json = JSON.parse(content);
    }

} catch (err) {
    const probS = `In ${fS}: ${err}`
    Logger.log(probS);
    return false
  }
  return json
}

// eslint-disable-next-line no-unused-vars
function getSurveyIDJSON() {
  var fS = "getSurveyIDJSON";
  try {
    const fileName = "surveyID.json";
    const files = DriveApp.getFilesByName(fileName);
    if (files.hasNext()) {
        var file = files.next();
        var content = file.getBlob().getDataAsString();
        var json = JSON.parse(content);
    }

} catch (err) {
    const probS = `In ${fS}: ${err}`
    Logger.log(probS);
    return false
  }
  return json
}