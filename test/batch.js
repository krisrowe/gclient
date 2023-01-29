const assert = require('assert');
const config = require('config');
const auth = require('../auth.js');
const users = require('../users.js');
const process = require('process');
const setup = require('./setup.js'); // ensure global test setup is run
const batchManager = require('../batch-manager.js');

describe ('config', function() {

    it('should have an api-key defined for testing', function() {
        assert.ok(process.env.API_KEY);
    });

    it('should be able to load unit test user spreadsheet id', function() {
        const authManager = new auth.Manager(new users.LocalUserManager());
        const user = authManager.getUnitTestUser();
        const spreadsheetId = user.spreadsheetId;
        assert.ok(/1[a-zA-Z0-9_-]{42}[AEIMQUYcgkosw048]/.test(spreadsheetId), 
            "No valid spreadsheet identifier configured. Found: " + spreadsheetId);
    });

    it.skip('should have a test label for processed email', function() {

        assert.equal(config.get('processedEmailLabel'), 'Test');
    });

    it('should run a batch successfully', function() {
        const authManager = new auth.Manager(new users.LocalUserManager());
        const user = authManager.getUnitTestUser();
        const dummy = require('../batches/dummy.js');
        const batch = new dummy.Batch(user);
        const settings = require('../batches/dummy.json');
        const result = batchManager.runBatch(batch, settings, user);
        assert.ok(result);
    });

    it.skip('should have console output disabled', function() {
        const setting = config.get('logging.console.enabled');
        assert.strictEqual(setting, false);
    });

    it.skip('should have file output enabled', function() {
        const setting = config.get('logging.file.enabled');
        assert.strictEqual(setting, true);
    });
});