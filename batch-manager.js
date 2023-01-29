const email = require('./email.js');
const config = require('config');
const BATCHES_FOLDER = './batches/';
const fs = require('fs');
const logger = require('./globals.js').logger;
const { User } = require('./auth.js');

const VALID_BATCH_NAME_FORMAT =  /^[0-9a-zA-Z\-]+$/;

const batchNames = [];
fs.readdirSync(BATCHES_FOLDER).forEach(file => {
    if (file.endsWith(".js")) {
        const withoutExtension = file.replace(/\.[^/.]+$/, "");
        batchNames.push(withoutExtension);
    }
    
});

function getBatchNames() {
    return [...batchNames]; // copy to avoid tampering by client
}

/**
 * Runs the specified batch.
 * @param {object} batch The batch to run
 * @param {object} settings The settings to use for the batch
 * @param {User} user The user to run the batch as.
 * @returns {Promise} A promise that resolves to an object containing the number of changes made by each operation.
 */
async function runBatch(batch, settings, user) {
    const gmailManager = new email.GmailManager(user.auth);
    var changes = { };
    const promises = [];
    const operationsCount = settings.operations ? settings.operations.length : 0;
    logger.log('verbose', `Running ${operationsCount} operations.`);
    settings.operations.forEach(op => {
        logger.log('verbose', `Running operation: ${op.name}`)
        if (op.enabled) {
            const process = batch[op.process];
            const query = JSON.parse(JSON.stringify(op.query));
            query.not = query.not || { };
            query.not.label = config.get("processedEmailLabel");
            const promise = new Promise((resolve, reject) => {
                gmailManager.processEmails(query, process.bind(batch)).then(result => {
                    changes[op.process] = result;
                    resolve(result);
                }).catch(reason => {
                    logger.log('error', 'Failure processing emails.');
                    logger.log('error', reason);
                    reject(reason);
                });  
            });
            promises.push(promise);
        }
        else {
            logger.log('warn', 'Skipping disabled operation: ' + op.name);
        } 
    });

    return new Promise((resolve, reject) => {
        Promise.all(promises).then(result => {
            logger.log('info', `${name} batch completed: ` + JSON.stringify(changes));
            resolve(changes);
        }).catch(reason => {
            reject(reason);
        });
    });
}

module.exports = { runBatch, getBatchNames, VALID_BATCH_NAME_FORMAT };