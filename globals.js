const { Logger } = require('winston');
const winston = require('winston');

class Globals { 
    constructor() {
        this._logger = winston.createLogger();
    }

    /**
     * @returns {Logger}
     */
    get logger() {
        return this._logger;
    }

    /**
     * @param {Logger} logger
     */
    set logger(logger) {
        this._logger = logger;
    }
}

module.exports = new Globals();
