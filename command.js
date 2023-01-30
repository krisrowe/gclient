const process = require('process');

class Flag {
    constructor(name, found, value = null) {
        this._name = name;
        this._found = found;
        this._value = value;
    }

    /**
     * Gets the name of the flag being evaluated.
     * @returns {string} the name of the flag
     * @readonly
     */
    get name() {
        return this._name;
    }

    /**
     * Gets a boolean indicating whether or not the flag was found.
     * @returns {boolean} whether or not the flag was found
     * @readonly
     */
    get found() {
        return this._found;
    }

    /**
     * Gets a boolean indicating whether or not the flag was found and a value was specified.
     * @returns {boolean} whether or not the flag was found and a value was specified. Will return true if flag is specified as "--flag-name=value" or "--flag-name=" where value is empty, but will otherwise return false if flag is given with no assignment operator, e.g. "--flag-name --other-flag".
     */
    get isValueSpecified() {
        return this._found && this._value != null;
    }

    /**
     * Gets the value of the flag being evaluated, if applicable.
     * @returns {string} the value of the flag, if specified, or null in the case that either the flag was not found or no value was specified
     * @readonly
     */
    get value() {
        return this._value;
    }
}

/**
 * Checks the command-line arguments for a flag in the format
 * of --flag-name or --flag-name=value and always returns an
 * object that describes whether the flag was found and what
 * value was optionally provided, if any.
 * @param {string} name the name of the flag to check for
 * @returns {Flag} an object that describes the flag 
 */
function getFlag(name) {
  var flag = new Flag(name, false);
  process.argv.forEach((arg, index) => {
    if (arg === name) {
        flag = new Flag(name, true);
    } else if (arg.startsWith(`${name}=`)) {
      if (arg.length > `${name}=`.length) {
        flag = new Flag(name, true, arg.substring(`${name}=`.length));
      } else {
        flag = new Flag(name, true, "");
      }
    }
  });
  return flag;
}

module.exports = { getFlag };