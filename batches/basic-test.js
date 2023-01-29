const config = require("config");
const Sheet = require("../sheets.js").Sheet;
const email = require("../email.js");
const core = require("../core.js");
const { logger } = require("../globals.js");

class Batch {
  constructor() {

  }

  get operations() {
    return require("./basic-test.json").operations;
  }

  async doStuff() {
    logger.info('doing stuff');
  }

}

module.exports = new Batch();
