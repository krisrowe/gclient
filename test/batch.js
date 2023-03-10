const assert = require('assert');
const config = require('config');
const auth = require('../auth.js');
const process = require('process');
const setup = require('./setup.js'); // ensure global test setup is run
const batchManager = require('../batch-manager.js');
const user = auth.getUnitTestUser();

describe ('batch', function() {

    it('should have an api-key defined for testing', function() {
        assert.ok(process.env.API_KEY);
    });

    it('should be able to load unit test user spreadsheet id', function() {
        const user = auth.getUnitTestUser();
        const spreadsheetId = user.spreadsheetId;
        assert.ok(/1[a-zA-Z0-9_-]{42}[AEIMQUYcgkosw048]/.test(spreadsheetId), 
            "No valid spreadsheet identifier configured. Found: " + spreadsheetId);
    });

    it('should have a test label for processed email', function() {
        assert.equal(config.get('processedEmailLabel'), 'Test');
    });

    it('should run a basic batch successfully', async function() {
        const batch = require('../batches/basic-test').initialize(user);
        await batchManager.runBatch(batch, user);
    });


    it('should run an email batch successfully', async function() {
        const batch = require('../batches/email-test').initialize(user);
        await batchManager.runBatch(batch, user);
    });

});