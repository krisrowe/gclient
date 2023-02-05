
/**
 * Returns true if the specified value is a string that not
 * only CAN be parsed as Date instance, but clearly IS a date
 * in a standard, user-entered format, that includes a year, 
 * a month, and a day, such as "1/1/2019" or "2019-01-01", or
 * even an ISO string with time zone, such as "2019-01-01T00:00:00.000Z".
 * This is useful when reading data from a loosely typed data
 * source, such as a spreadsheet, and is employed by the 
 * mapOnLoadStandard function.
 * @param {string} d the string to test.
 * @returns {boolean} true if the string is a date string, false otherwise.
 */
function isDateString(d) {
    if (typeof d == 'string') {
        // Check if the string is in any of these formats:
        // 1) YYYY-MM-DD or YYYY/MM/DD
        // 2) MM/DD/YYYY or MM-DD-YYYY
        // 3) M/D/YYYY or M-D-YYYY)
        if (d.match(/^\d{4}[-\/]\d{2}[-\/]\d{2}($|T)/) ||
            d.match(/^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}$/)) {
            return !isNaN(Date.parse(d));
        } else {
            return false;
        }
    } else {
        return false;
    }
}


function isDate(s) {
    return (new Date(s) !== "Invalid Date") && !isNaN(new Date(s));
}

/**
 * Returns a new Date object with the time set to 00:00:00.000
 * @returns {Date} The date with the time set to 00:00:00.000
 */
Date.prototype.getWithoutTime = function () {
    return new Date(this.toDateString());
}

/**
 * Returns a string in the format YYYY-MM-DD
 * @returns {string} The date in the format YYYY-MM-DD
 */
Date.prototype.toISOStringWithoutTime = function () {
    return this.toISOString().split('T')[0];
}

Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

/**
 * Compares only the date portion of the two date objects, ignoring the time.
 * @param {Date} otherDate The date to compare to.
 * @returns {boolean} true if the dates are equal without considering the time.
 */
Date.prototype.dateEquals = function(otherDate) {
    return this.getWithoutTime().getTime() == otherDate.getWithoutTime().getTime();
}

/**
 * Parses a date string and interprets it as a date in the local time zone,
 * even if the string is in the ISO format YYYY-MM-DD. If the value is already
 * a Date object, it is returned unchanged.
 * @param {*} value a string to parse, or a Date object to be returned unchanged.
 * @returns {Date} the parsed date.
 * @throws {Error} if the value cannot be interpreted as a date.
 */
function parseDateAsLocal(value) {
    if (!value) {
        return value;
    } else {
        if (value instanceof Date) {
            return value;
        } else if (typeof value == "string") {
            if (isIsoUtcDateString(value)) {
                value = new Date(value);
                var userTimezoneOffset = value.getTimezoneOffset() * 60000;
                value = new Date(value.getTime() + userTimezoneOffset);  
                return value;
            } else {
                return new Date(value);
            }
        } else {
            throw new Error(`Expected a string or Date.`);
        }
    } 
  }
  
  /** 
   * Returns true if the specified value is of type string and in the format YYYY-MM-DD,
   * with no time component.
   * @param {*} value the value to test. 
   * @returns {boolean} true if the value is of type string and in the format YYYY-MM-DD, false otherwise.
   */
  function isIsoUtcDateString(value) {
    return value && typeof value == 'string' && value.match(/^\d{4}-\d{2}-\d{2}(T.*Z)?$/);
  }
  
  module.exports = { parseDateAsLocal, isIsoUtcDateString, isDateString, isDate }