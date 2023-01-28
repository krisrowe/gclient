const config = require("config");
const Sheet = require("../sheets.js").Sheet;
const email = require("../email.js");
const core = require("../core.js")
const logging = require('@kdrowe/common-utils/logging');

class DummyBatch {

  /**
   * @param {User} user - The user to run the batch for.
   */
  initialize(user) {
    if (!user) {
      throw new Error("User is required to initialize batch.");
    }
    
    this.gmailManager = new email.GmailManager(user.auth);
    const spreadsheetId = user.spreadsheetId;
  }

  async processEmails(queryParams, process, maxResults = 0) {
    return this.gmailManager.processEmails(queryParams, process, maxResults);
  }

  processAnyEmail(message) {
    return true;
  }

}

module.exports = DummyBatch;
