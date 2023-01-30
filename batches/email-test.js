const config = require("config");
const email = require("../email.js");
const core = require("../core.js")

class Batch {
  /**
   * @param {User} user - The user to run the batch for.
   */
  constructor(user) {
    if (!user) {
      throw new Error("User is required to initialize batch.");
    }
    this.gmailManager = new email.GmailManager(user.auth);
  }

  get operations() {
    return require("./email-test.json").operations;
  }

  async processEmails(queryParams, process, maxResults = 0) {
    return this.gmailManager.processEmails(queryParams, process, maxResults);
  }

  processAnyEmail(message) {
    return true;
  }

}

function initialize(user) {
  return new Batch(user);
}

module.exports = { initialize };
