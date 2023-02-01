const assert = require('assert');
const config = require('config');
const auth = require('../auth.js');
const process = require('process');
const batchManager = require('../batch-manager.js');
const {Sheet} = require('../sheets.js');
const setup = require('./setup.js'); // ensure global test setup is run

describe ('sheets', async function() {
    it('should be able to query', async function() {
        const user = auth.getUnitTestUser();
        var sheet = new Sheet(user.spreadsheetId, "Properties", user.auth);
        const results = await sheet.getAllValuesWithHeaders();
        assert.ok(results && results.length > 0);
    });

    it('saves object to sheet by id', async function() {
        const user = auth.getUnitTestUser();
        var sheet = new Sheet(user.spreadsheetId, "Unit Testing", user.auth);
        // Generate a random description.
        const description = Math.random().toString(36).substring(7);
        await sheet.saveToSheetWithHeading({ "ID" : 1, "Name": "Test", "Description": description }, "ID");
        const results = await sheet.getSheetValuesAsObjects();
        const found = results.find(r => r["Description"] === description);
        assert.ok(found && found["Description"] == description);
    });

    it('updates a single cell by row id', async function() {
        const user = auth.getUnitTestUser();
        var sheet = new Sheet(user.spreadsheetId, "Unit Testing", user.auth);
        // Generate a random description.
        const description = Math.random().toString(36).substring(7);
        await sheet.updateSingleCell("ID", 1, "Description", description);
        const results = await sheet.getSheetValuesAsObjects();
        const found = results.find(r => r["Description"] === description);
        assert.ok(found && found["Description"] == description);
    });
});