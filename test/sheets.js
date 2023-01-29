const assert = require('assert');
const config = require('config');
const auth = require('../auth.js');
const users = require('../users.js');
const process = require('process');
const batchManager = require('../batch-manager.js');
const {Sheet} = require('../sheets.js');
const setup = require('./setup.js'); // ensure global test setup is run

describe ('sheets', async function() {
    it('should be able to query', async function() {
        const authManager = new auth.Manager(new users.LocalUserManager());
        const user = authManager.getUnitTestUser();
        var sheet = new Sheet(user.spreadsheetId, "Properties", user.auth);
        const results = await sheet.getAllValuesWithHeaders();
        assert.ok(results && results.length > 0);
    });
});