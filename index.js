const {google} = require('googleapis');
const {GmailManager} = require('./email.js');
const {Sheet} = require('./sheets.js');

class Package {
    constructor() {
    }

    /**
     * @param {google.auth.OAuth2} auth
     */
    emailManager(auth) {
        return new GmailManager(auth);
    }

    /** 
     * @param {string} spreadsheetId
     * @param {string} sheetName
     * @param {google.auth.OAuth2} auth
     * @returns {Sheet}
     */
    sheet(spreadsheetId, sheetName, auth) {
        return new Sheet(spreadsheetId, sheetName, auth);
    }

}


module.exports = new Package();