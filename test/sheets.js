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
var savedObject1Promise = null;
var testDate = new Date(2020, 0, 1);

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

    // This is important because the Google Sheets API will persist
    // a Date instance as a string in ISO format, rather than a date,
    // which could cause a variety of issues, including the fact that
    // you can see a very odd-looking value when you directly open the
    // spreadsheet, and you can't properly sort by date when it appears
    // in the same column as actual date values.
    it('persists Date in local format', async function() {
        const found = await getSavedObject1();
        assert.equal(new Date(found["Date"]).getTime(), testDate.getTime());
    });

    function saveObject1() {
        if (!object1Promise) {
            object1Promise = new Promise((resolve, reject) => {
                sheet.saveToSheetWithHeading(
                { "ID" : 1, 
                    "Name": "Test", 
                    "Description": object1Description, 
                    "Updated": object1Description,
                    "Date": testDate 
                }, "ID").then(result => {
                    resolve(result);
                }).catch(err => {
                    reject(err);
                });
            });
        }
        return object1Promise;
    }

    function getSavedObject1() {
        if (!savedObject1Promise) {
            savedObject1Promise = new Promise((resolve, reject) => {
                saveObject1().then(saved => {
                    sheet.getSheetValuesAsObjects().then(results => {
                        const found = results.find(r => r["ID"] == 1);
                        if (found) {
                            resolve(found);
                        } else {
                            reject("Object not found.");
                        } 
                    }).catch(err => {
                        reject(err);
                    });
                }).catch(err => {
                    reject(err);
                });
            });
        }
        return savedObject1Promise;
    }

    it('updates a single cell by row id', async function() {
        await saveObject1();
        const results = await sheet.getSheetValuesAsObjects();
        // Generate a random description.
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