const assert = require('assert');
const config = require('config');
const auth = require('../auth.js');
const process = require('process');
const batchManager = require('../batch-manager.js');
const {Sheet} = require('../sheets.js');
const setup = require('./setup.js'); // ensure global test setup is run
const logger = require('../globals.js').logger;

var user = auth.getUnitTestUser();
var sheet = new Sheet(user.spreadsheetId, "Unit Testing", user.auth);
var object1Description = Math.random().toString(36).substring(7);
var object1Promise = null;

after(async function() {
    await sheet.deleteAllDataRows();
    logger.debug("Deleted all data rows from Unit Testing sheet.");
});

describe ('sheets', async function() {
    it('should be able to query', async function() {
        const results = await sheet.getAllValuesWithHeaders();
        assert.ok(results && results.length > 0);
    });

    it('saves object to sheet by id', async function() {
        // Generate a random description.
        await saveObject1();
        const results = await sheet.getSheetValuesAsObjects();
        const found = results.find(r => 
            (r["ID"] + "") == "1" &&
            r["Description"] == object1Description);
        assert.ok(found);
    });

    function saveObject1() {
        if (!object1Promise) {
            object1Promise = sheet.saveToSheetWithHeading({ "ID" : 1, "Name": "Test", "Description": object1Description, "Updated": object1Description }, "ID");
        }
        return object1Promise;
    }

    it('updates a single cell by row id', async function() {
        await saveObject1();
        // Generate a random description.
        const description = Math.random().toString(36).substring(7);
        await sheet.updateSingleCell("ID", 1, "Updated", description);
        /*
        const results = await sheet.getSheetValuesAsObjects();
        const found = results.find(r => r["Description"] === description);
        assert.ok(found && found["Description"] == description);
        */
    });

    it('appends a set of rows', async function() {
        const user = auth.getUnitTestUser();
        var sheet = new Sheet(user.spreadsheetId, "Unit Testing", user.auth);
        const objects = [];
        for (let i = 0; i < 3; i++) {
            const randomID = Math.floor(Math.random() * 1000000);
            objects.push({ "ID": randomID, "Name": "Test", "Description": "Test " + randomID });
        }
        await sheet.appendObjects(objects, "ID");
        const results = await sheet.getSheetValuesAsObjects();
        objects.forEach(o => {
            const found = results.find(r => r["ID"] == o["ID"]);
            assert.ok(found);
        });
    });
});