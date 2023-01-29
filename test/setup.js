const globals = require('../globals.js');
const winston = require('winston');

globals.logger = new winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.simple(),
    transports: [new winston.transports.File({
        level: 'verbose',
        filename: 'test.log'
    })]
}); 