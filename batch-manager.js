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
    const promises = [];
    const operations = batch.operations;
    const operationsCount = operations ? operations.length : 0;
    logger.log('verbose', `Running ${operationsCount} operations.`);
    operations.forEach(op => {
        logger.log('verbose', `Running operation: ${op.name}`)
        if (op.enabled) {
            const process = batch[op.process];
            var promise;
            if (op.query) {
                const query = JSON.parse(JSON.stringify(op.query));
                query.not = query.not || { };
                query.not.label = config.get("processedEmailLabel");
                promise = new Promise((resolve, reject) => {
                    gmailManager.processEmails(query, process.bind(batch)).then(result => {
                        changes[op.process] = result;
                        resolve(result);
                    }).catch(reason => {
                        logger.log('error', 'Failure processing emails.');
                        logger.log('error', reason);
                        reject(reason);
                    });  
                });
            } else {
                promise = new Promise((resolve, reject) => {
                    Promise.resolve(process.bind(batch)()).then(result => {
                        changes[op.process] = result;
                        resolve(result);
                    }).catch(reason => {
                        logger.log('error', 'Failure running ' + op.name + '.');
                        logger.log('error', reason);
                        reject(reason);
                    });
                });
            }
            promises.push(promise);
        }
        else {
            logger.log('warn', 'Skipping disabled operation: ' + op.name);
        } 
    });

    return new Promise((resolve, reject) => {
        Promise.all(promises).then(result => {
            logger.log('info', `Batch completed: ` + JSON.stringify(changes));
            resolve(changes);
        }).catch(reason => {
            reject(reason);
        });
    });
}

module.exports = { runBatch };