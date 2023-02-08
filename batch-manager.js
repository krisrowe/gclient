const email = require('./email.js');
const config = require('config');
const logger = require('./globals.js').logger;
const { User } = require('./auth.js');

/**
 * Runs the specified batch.
 * @param {object} batch The batch to run
 * @param {User} user The user to run the batch as.
 * @returns {Promise} A promise that resolves to an object containing the number of changes made by each operation.
 */
async function runBatch(batch, user) {
    const gmailManager = new email.GmailManager(user.auth);
    var changes = { };
    const operations = batch.operations;
    const operationsCount = operations ? operations.length : 0;
    logger.log('verbose', `Running ${operationsCount} operations.`);
    for (var i = 0; i < operationsCount; i++) {
        const op = operations[i];
        const promises = [];
        logger.log('verbose', `Running operation: ${op.name}`)
        if (op.enabled) {
            const process = batch[op.process];
            var promise;
            if (op.query) {
                const query = JSON.parse(JSON.stringify(op.query));
                query.not = query.not || { };
                query.not.label = config.get("processedEmailLabel");
                changes[op.process] = await gmailManager.processEmails(
                    query, process.bind(batch));  
            } else {
                changes[op.process] = await process.bind(batch)();
            }
        }
        else {
            logger.log('warn', 'Skipping disabled operation: ' + op.name);
        } 
    };
}

module.exports = { runBatch };