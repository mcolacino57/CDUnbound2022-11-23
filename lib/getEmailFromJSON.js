/*global DriveApp,Logger */
/**
 * Purpose: open json file with global information (currently mcolacino.json) and get the
 * email, returning it or false if not found
 * 
 * @return {String} return user email or false
 */

// eslint-disable-next-line no-unused-vars
function getEmailFromJSON() {
    const fS = "getEmailFromJSON";

    try {
        const fileName = "mcolacino.json";
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