const process = require('process');
const batchManager = require('./batch-manager.js');
const logger = require('./globals.js').logger;
const {InvalidApiKeyError} = require('./auth.js');
const auth = require('./auth.js');

/**
 * Executes a batch function based on the command line arguments.
 * @param {object} possibleBatches - A map of batch names to batch functions.
 */ 
function execute(possibleBatches) {
    // Find the batch name and API key arguments on the command line.
    const apiKeyArgPrefix = '--api-key=';
    const batchNameArgPrefix = '--batch=';
    var apiKey;
    var batchName;
    process.argv.forEach((val, index) => {
        if (val.startsWith(apiKeyArgPrefix)) {
            apiKey = val.substring(apiKeyArgPrefix.length);
        } else if (val.startsWith(batchNameArgPrefix)) {
            batchName = val.substring(batchNameArgPrefix.length);
        }
    });

    if (!batchName) {
        logger.info('No batch name specified on the command line, so main module is in library mode.');
    } else if (possibleBatches.hasOwnProperty(batchName)) {
        logger.info(`Executing ${batchName} batch...`);
        const batch = require(possibleBatches[batchName]);

        if (!apiKey) {
            apiKey = process.env.API_KEY;
            if (!apiKey) {
                throw new InvalidApiKeyError('No API key argument specified on the command line. Expected format: --api-key=<api-key>');
            }
            logger.log('info', 'Using API key from environment variable.');
        }
        const user = auth.authenticate(apiKey);
        if (batch.intialize) {
            batch.initialize(user);
        }
        batchManager.runBatch(batch, user).then(changes => {
            logger.log('info', batchName + ' batch complete: ' + JSON.stringify(changes));
        }).catch(reason => {
            logger.log('error', batchName + ' batch failed: ' + reason);
        });
    } else {
        logger.error('Invalid batch name. Expected one of the following: ' + Object.keys(batches).join(', '));
    }
}

module.exports = { execute };
