const { User } = require('./auth');
const { Sheet } = require('./sheets');
const dates = require('./dates');

/**
 * Provides access to the underlying data store, while
 * abstracting away the details of the data store.
 */
class Provider {
    /**
     * Create a new DataProvider instance.
     * @param {User} user 
     */
    constructor(user) {
        if (!user) {
            throw new Error('User must be specified.');
        }
        this.user = user;
    }

    /**
     * Returns a promise that resolves to an array of objects, each representing one row from the specified table.
     * @param {string} tableName The name of the table to load.
     * @returns {Promise<Object[]>}
     */
    async loadTable(tableName, mapCallback = null) {
        const sheet = new Sheet(this.user.spreadsheetId, tableName, this.user.auth);
        const objects = await sheet.getSheetValuesAsObjects();
        if (objects && objects.length > 0 && mapCallback) {
            return objects.map(mapCallback);
        } else {
            return objects;
        }
    }
    
    /**
     * Saves the specified object as a row in the specified table.
     * @param {string} tableName 
     * @param {object} object 
     * @param {string} keyField
     * @returns {Promise} promise that resolves when the object has been saved.
     */
    save(tableName, object, keyField) {
        const sheet = new Sheet(this.user.spreadsheetId, tableName, this.user.auth);
        return sheet.saveToSheetWithHeading(object, keyField);
    }
    
    /**
     * Inserts the specified objects as rows in the specified table.
     * @param {string} tableName
     * @param {object[]} objects
     * @returns {Promise} promise that resolves when the objects have been inserted.
     */
    insertAll(tableName, objects) {
        const sheet = new Sheet(this.user.spreadsheetId, tableName, this.user.auth);
        return sheet.appendObjects(objects); 
    }
}

/**
 * Returns a callback function that can be passed to the Array.map method
 * to convert an array of raw data objects whose properties reflect data
 * source field names, e.g. "First Name", as produced by the DataProvider
 * to an array of objects with camel-case property names, e.g. "firstName", 
 * while optionally taking as input a separate callback function that will
 * prepare the output object, e.g. as an instance of a specific class.
 * This allows the caller to use something like DataProvider to return data
 * as generic objects and easily convert an entire array to custom objects.
 * @param {function} createCallback A callback function that instantiate each new object produced by the map operation.
 * @returns {function} A callback function that can be passed to the Array.map method.
 * @example customObjects = dataObjects.map(mapOnLoadStandard(() => new MyClass()));
 */
function mapOnLoadStandard(createCallback = null) {
    return function(val, index, array) {
        var output = createCallback ? createCallback() : {};
        for (var key in val) {
            // Convert title case with spaces to camel case.
            var camelCaseKey = key.replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
                return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
            }).replace(/\s+/g, '');
            if (dates.isDateString(val[key])) {
                output[camelCaseKey] = dates.parseDateAsLocal(val[key]);
            } else {
                output[camelCaseKey] = val[key];
            }
        }
        return output;
    };
}

module.exports = { Provider, mapOnLoadStandard };