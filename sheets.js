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
   */
  constructor(spreadsheetId, name, auth) {
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
    this._columnHeadings = null;
  }

  get name() {
    return this._name;
  }

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


  async getValuesInColumn(column, rowContainsHeadings) {
    var columnLetter;
    if (Number.isInteger(column)) {
      columnLetter = this.columnNumberToLetter(column);
    } else {
      columnLetter = column;
    }
    const startingRow = rowContainsHeadings ? 2 : 1;
    const range = this.name + "!" + columnLetter + startingRow + ":" + columnLetter; 
    var result = await this.getValuesByRange(range, "COLUMNS");
    result = result[0];
    return result;
  }

  async getValuesByRange(range, majorDimension = null) {
    const auth = this._auth;
    const sheets = google.sheets({version: 'v4', auth: auth});
    var rawValues;
    const options = { 
        spreadsheetId: this.spreadsheetId,
        range:range
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

  async saveToSheetWithHeading(obj, keyColumnHeading) {
      logger.log('verbose', 'Saving object to sheet ' + this.name + '.');
      logger.log('debug', obj);

      const set = await this.getColumnsAndKeys(keyColumnHeading);
      const columnHeadings = set.headings;
      const keyValues = set.keys;
     
      // Build an array of values that are ordered according to the order of
      // columns in the sheet, as expected by the Sheets API.
      var values = [];
      for (var columnHeading of columnHeadings) {
        values.push(obj[columnHeading]);
      }

      // Determine if the record already exists in the sheet, so we can decide
      // if we are updating or appending a row.
      const key = obj[keyColumnHeading];
      var row = keyValues.indexOf(key) + 2;
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
        logger.log('verbose', 'Updating row ' + row + ' in sheet ' + this.name + ' with key ' + key + '.');
        return sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: this.name + "!A" + row,
          valueInputOption: "USER_ENTERED",
          requestBody: { majorDimension: "ROWS", values: [values] },
        });
      }
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