const email = require('./email.js');
const config = require('config');
const BATCHES_FOLDER = './batches/';
const fs = require('fs');
const logging = require('@kdrowe/common-utils/logging');
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
 * @param {string} name The name of the batch to run.
 * @param {User} user The user to run the batch as.
 * @returns {Promise} A promise that resolves to an object containing the number of changes made by each operation.
 */
async function runBatch(name, user) {
    const isValidNameFormat = VALID_BATCH_NAME_FORMAT.test(name);
    if (!isValidNameFormat) {
        throw new Error('Invalid batch name format.');
    }
    if (!batchNames.includes(name)) {
        throw new Error('Specified batch module not found.');
    }
    logging.log('info', `Running batch: ${name}`);

    var changes = { };

    const modulePath = `./batches/${name}.js`;
    const settingsPath = `./batches/${name}.json`;
    var BatchType = require(modulePath);
    const batch = new BatchType();
    batch.initialize(user);
    const settings = require(settingsPath);
    const gmailManager = new email.GmailManager(user.auth);

    const promises = [];
    const operationsCount = settings.operations ? settings.operations.length : 0;
    logging.log('verbose', `Running ${operationsCount} operations.`);
    settings.operations.forEach(op => {
        logging.log('verbose', `Running operation: ${op.name}`)
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
                    logging.log('error', 'Failure processing emails.');
                    logging.log('error', reason);
                    reject(reason);
                });  
            });
            promises.push(promise);
        }
        else {
            logging.log('warn', 'Skipping disabled operation: ' + op.name);
        } 
    });

    return new Promise((resolve, reject) => {
        Promise.all(promises).then(result => {
            logging.log('info', `${name} batch completed: ` + JSON.stringify(changes));
            resolve(changes);
        }).catch(reason => {
            reject(reason);
        });
    });
}

module.exports = { runBatch, getBatchNames, VALID_BATCH_NAME_FORMAT };