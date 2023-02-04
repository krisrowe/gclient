const {google} = require('googleapis');
const logger = require('./globals.js').logger;

class RowNotFoundError extends Error {
  constructor(params) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(params);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RowNotFoundError);
    }

    this.name = "RowNotFoundError";
  }
}

class Sheet {
  
  /**
   * @param {string} spreadsheetId - The ID of the spreadsheet.
   * @param {string} name - The name of the sheet.
   * @param {google.auth.OAuth2} auth - The OAuth2 client to authorize the request.
   * @param {string} valueRenderOption - The value render option to use when reading values. Options: UNFORMATTED_VALUE, FORMATTED_VALUE, FORMULA
   */
  constructor(spreadsheetId, name, auth, valueRenderOption = "FORMATTED_VALUE") {
    if (!spreadsheetId) {
      throw new Error("Spreadsheet ID is required.");
    }
    if (!name) {
      throw new Error("Sheet name is required.");
    }
    if (!auth) {
      throw new Error("Auth is required.");
    }
    this.spreadsheetId = spreadsheetId;
    this._name = name;
    this._auth = auth;
    this._api = google.sheets({version: 'v4', auth: auth});
    this._columnHeadings = null;
    this._valueRenderOption = valueRenderOption;
  }

  get name() {
    return this._name;
  }

  /**
   * Gets the column headings as a string array.
   * @returns {Promise<string[]>} The column headings.
   */
  async getColumnHeadings() {
    var result = this._columnHeadings;
    if (!result) {
      result = await this.getValuesByRange(this.name + '!$1:$1');
      result = result[0];
      this._columnHeadings = result; 
    }
    return result;
  }

  async getColumnsAndKeys(keyColumn) {
    const sheet = this;

    const headings = await this.getColumnHeadings();
    var keyColumnNumber;
    if (Number.isInteger(keyColumn)) {
      keyColumnNumber = keyColumn;
    } else {
      keyColumnNumber = headings.indexOf(keyColumn) + 1;  
    }
    const keys = await this.getValuesInColumn(keyColumnNumber, true);
    return { headings: headings, keys: keys }; 
  }

  /**
   * Gets the values for a column by the column heading, excluding
   * the column heading row.
   * @param {string} columnHeading - The column heading to get values for.
   * @returns {Promise<string[]>} The values for the column, excluding the column heading row.
   */
  async getValuesByColumnHeading(columnHeading) {
    const headings = await this.getColumnHeadings();
    const columnNumber = headings.indexOf(columnHeading) + 1;
    return await this.getValuesInColumn(columnNumber, true);
  }

  async getValuesInColumn(column, rowContainsHeadings) {
    var columnLetter;
    if (Number.isInteger(column)) {
      columnLetter = this.columnNumberToLetter(column);
    } else {
      columnLetter = column;
    }
    const range = this.name + "!" + columnLetter + "1:" + columnLetter; 
    var result = await this.getValuesByRange(range, "COLUMNS");
    if (result && result.length > 0) {
      // Grab the first and only element in the columns array,
      // which will be an array of row-based values.
      result = result[0];
      if (rowContainsHeadings) {
        // If there are at least two rows, then skip the
        // column heading row and return the rest.
        if (result && result.length > 1) {
          return result.slice(1);
        } else {
          return [];
        }
      }
      // No column headings, so just return the result,
      // if there is one.
      return result && result.length > 0 ? result : [];
    } else {
      // No result, so return an empty array.
      return [];
    }
  }

  async getValuesByRange(range, majorDimension = null) {
    const auth = this._auth;
    const sheets = google.sheets({version: 'v4', auth: auth});
    var rawValues;
    const options = { 
        spreadsheetId: this.spreadsheetId,
        range:range,
        valueRenderOption: this._valueRenderOption
    };
    if (majorDimension) {
      options.majorDimension = majorDimension;
    }
    logger.log('verbose', 'Reading data from spreadsheet ' + this.spreadsheetId +' in range "' + range + '".')
    try { 
      rawValues = await sheets.spreadsheets.values.get(options);
    } catch (ex) {
      if (ex.errors && ex.errors.length > 0 && ex.errors[0].reason == 'notFound'){
        throw new Error(`Spreadsheet id '${this.spreadsheetId}' not found per Sheets API.`);
      } else {
        throw new Error('Failed to read data from spreadsheet by range: ' + ex);
      }
    }
    return rawValues.data.values;
  }

  columnNumberToLetter(i) {
    if (!Number.isInteger(i) || i < 1) {
      throw new Error("Column number argument must be an integer greater than zero.");
    }
    const code = 'A'.charCodeAt(0);  
    return String.fromCharCode(code + (i - 1)); // 1 becomes A
  }

  async updateSingleCell(keyColumnHeading, key, targetColumnHeading, newValue) {
    const structure = await this.getColumnsAndKeys(keyColumnHeading);
    const columnNumber = structure.headings.indexOf(targetColumnHeading) + 1;
    if (columnNumber < 1) {
      throw new Error(`Column heading '${targetColumnHeading}' not found.`);
    }
    const rowNumber = structure.keys.findIndex(k => (k + "") == (key + "")) + 2;
    if (rowNumber < 2) {
      throw new Error(`Key '${key}' not found.`);
    }
    const range = this.columnNumberToLetter(columnNumber) + rowNumber;
    return this.updateRange(range, [[newValue]]);
  }

  /**
   * Appends an array of objects to the sheet, each as a new row,
   * mapping the object property names to the column headings.
   * @param {Array} objects 
   * @param {string} keyColumnHeading 
   * @returns {Promise}
   */
  async appendObjects(objects, keyColumnHeading) {
    if (!objects) {
      throw new Error("No objects provided to append.");
    }

    const headings = await this.getColumnHeadings();

    // Create an array of arrays, where each array is a row of values.
    const rows = [];
    objects.forEach(obj => {
      const columns = [];
      for (var columnHeading of headings) {
        columns.push(obj[columnHeading]);
      }
      rows.push(columns);
    });

    return this._api.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: this.name + "!A2",
      valueInputOption: "USER_ENTERED",
      requestBody: { majorDimension: "ROWS", values: rows },
    });
  }

  /**
   * Deletes all rows from the sheet, leaving the column headings intact.
   * @returns {Promise}
   */
  async deleteAllDataRows() {
      // Get the sheet information to get the sheet ID
      const spreadsheet = await this._api.spreadsheets.get({ spreadsheetId: this.spreadsheetId});
      const sheet = spreadsheet.data.sheets.find(s => s.properties.title === this._name);
      if (!sheet) throw new Error(`Sheet with name "${sheetName}" not found.`);
      const sheetId = sheet.properties.sheetId;
    
      // Delete all the rows in the sheet, excluding the first row with the column headings
      return this._api.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId,
                  dimension: 'ROWS',
                  startIndex: 1,
                  endIndex: 100000
                }
              }
            }
          ]
        }
      });
  }

  async saveToSheetWithHeading(obj, keyColumnHeading) {
    if (!obj) {
      throw new Error("No object provided to save.");
    }
      logger.log('verbose', 'Saving object to sheet ' + this.name + '.');
      logger.log('debug', obj);

      const set = await this.getColumnsAndKeys(keyColumnHeading);
      const columnHeadings = set.headings;
      const keyValues = set.keys;
     
      // Build an array of values that are ordered according to the order of
      // columns in the sheet, as expected by the Sheets API.
      var values = [];
      for (var columnHeading of columnHeadings) {
        var value = obj[columnHeading];
        if (value instanceof Date) {
          value = value.toLocaleDateString();
        }
        values.push(value);
      }

      // Determine if the record already exists in the sheet, so we can decide
      // if we are updating or appending a row.
      const key = obj[keyColumnHeading];
      var row = keyValues.findIndex(k => (k + "") == (key + "")) + 2;
      const auth = this._auth;
      const sheets = google.sheets({version: 'v4', auth: auth});
      const range = this.name + "!A" + row;

      if (row < 2) { // note that the first row with data is row 2
        logger.log('verbose', 'Appending to sheet ' + this.name + ' as a new record with key ' + key + '.');
        row = keyValues.length + 2;
        return sheets.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: this.name + "!A" + row,
          valueInputOption: "USER_ENTERED",
          requestBody: { majorDimension: "ROWS", values: [values] },
        });

      }
      else {
        return this.updateRange("A" + row, [values]);
      }
  }

  

  /**
   * Updates a range of cells in the sheet.
   * @param {string} range - The range to update, in A1 notation, with no sheet name referenced.
   * @param {Array.<Array.<string>>} values - The values to update, as an array of rows, each in turn being an array of strings for the column values.
   * @example updateRange('A1:B2', [['a', 'b'], ['c', 'd']])
   * @example updateRange('A1', [['a']])
   * @return {Promise} a promise that resolves when the update is complete
   */
  async updateRange(range, values, majorDimension = "ROWS") {
    logger.log('verbose', 'Updating range ' + range + ' in sheet ' + this.name + '.');
    return this._api.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: this.name + "!" + range,
      valueInputOption: "USER_ENTERED",
      requestBody: { majorDimension: majorDimension, values: values },
    });
  }

  /**
   * Gets all cell values in the sheet by row, then by column
   *
   * @return {Promise<Array.<Array.<string>>>} array of rows, each in turn being an array of strings for the column values
   */
  async getAllValuesWithHeaders() {
    return this.getValuesByRange(this.name);
  }

  /**
   * Gets all data from the sheet as an array of objects, one for each row, whose attributes contain the column values for that row.
   *
   * @return {Promise<Array.<Object>>} array of rows, each in turn being an array of strings for the column values
   */
  async getSheetValuesAsObjects() {
    const values = await this.getAllValuesWithHeaders();
    var array = [];
    for (var r = 1; r < values.length; r++) {
      var o = { };
      for (var c = 0; c < values[r].length; c++) {
        o[values[0][c]] = values[r][c]; 
      }
      array.push(o);
    }
    return array;
  }

  async loadRowFromSheetByKey(keyColumnName, keyColumnValue) {
    const sheet = this;
    const set = await this.getColumnsAndKeys(keyColumnName);
    const columnHeadings = set.headings;
    const keyValues = set.keys;


    const keyColumnNumber = columnHeadings.indexOf(keyColumnName) + 1;
    const rowNumber = 2 + keyValues.indexOf(keyColumnValue);
    if (rowNumber < 2) {
      throw new RowNotFoundError();
    }
    const values = await sheet.getValuesInRow(rowNumber);
    var result = { };
    for (var i = 0; i < columnHeadings.length; i++) {
      result[columnHeadings[i]] = values[i];
    }
    return result;  
  }
  
  async getValuesInRow(rowNumber) {
    const range = this.name + "!A" + rowNumber + ":" + rowNumber;
    const valuesByRangePromise = this.getValuesByRange(range);
    return new Promise((resolve, reject) => {
      valuesByRangePromise.then(values => {
        resolve(values[0]);
      });
    });
  }

  fetchCachedObjects() {
    if (!this._promise) {
        this._promise = this.getSheetValuesAsObjects();
    }
    return this._promise;
  }

  async getCachedObjectById(id, idColumnName, caseSensitive = true) {
    if (!id) {
      return null;
    }
    const cachedObjects = await this.fetchCachedObjects();
    if (caseSensitive) {
      return cachedObjects.find(o => o[idColumnName] == id);
    }
    else {
      return cachedObjects.find(o => (o[idColumnName] || "").toLowerCase() == id.toLowerCase());
    }
  }

  async getCachedFieldValueById(id, idColumnName, fieldName) {
      const dataObject = await this.getCachedObjectById(id, idColumnName);
      return dataObject != null ? dataObject[fieldName] : null;
  }
  
  /*
  getSheetValuesMinusHeadings(hydrate) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    var items = [];
    var values = sheet.getSheetValues(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn());
    for (var i = 0; i < values.length; i++) {
      var columns = values[i];
      var obj = hydrate(columns);
      items.push(obj);
    }
    return items;
  }
  */
  
}

function joinRow(values) {
  if (!values || values.length != 1) {
    throw "Not a row";
  }
  var columns = values[0];
  return columns.join("|");  
}

function signRow(values) {
  if (!values || values.length != 1) {
    throw "Not a row";
  }
  var columns = values[0];
  return sign(columns.join("|"));
}

module.exports = { Sheet, RowNotFoundError }; 