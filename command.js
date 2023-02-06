const process = require('process');
const assert = require('assert');

const FLAG_PATTERN = /^-{1,2}[\w]+.*$/;
/**
 * The list of flags that have been accessed by name.
 */
var flagsAccessed = new Map();
/**
 * The number of baseline command-line arguments to skip over
 * automatically before reading or counting command-line args.
 * Typically, this number is 2, thus skipping 'node index.js',
 * for example. 
 */
var argumentsToSkip = 2;

class InvalidFlagError extends Error {
    /**
     * Creates a new error.
     * @param {string} flagName 
     */
    constructor(flagName) {
        super(`Invalid flag: ${flagName}`);
    }
}

class ArgumentCountError extends Error {
    constructor(message = "Wrong number of command-line arguments.") {
        super(message);
    }
}

/**
 * Checks to see if all the command-line flags provided
 * have been accessed, and if not, throws an error to
 * highlight the ignored flag.
 * @throws InvalidFlagError
 */
function assertAllFlagsRead() {
    process.argv.filter(a => a.match(FLAG_PATTERN)).forEach(flagString => {
        const flag = parseFlag(flagString);
        if (!flagsAccessed.has(flag.name)) {
            throw new InvalidFlagError(flag.name);
        }
    });  
}

/**
 * Gets a list of subcommands or other arguments that do
 * not follow the pattern of a flag, or do not begin with
 * a hyphen, and throws an error if the number of such
 * arguments is outside the optionally specified threshold.
 * @returns {string[]} the arguments  
 * @throws ArgumentCountError
 */
function getNonFlagArguments(min = 0, max = Number.MAX_SAFE_INTEGER) {
    const args = process.argv.slice(argumentsToSkip).filter(a => !a.match(FLAG_PATTERN));
    const count = args ? args.length : 0;
    if (count < min) {
        throw new ArgumentCountError("Fewer than expected command-line arguments.");
    }
    if (count > max) {
        throw new ArgumentCountError("More than expected command-line arguments.");
    }
    return args;
}

/**
 * Resets the tracking of which command-line flags have
 * been read. Useful, at a minimum, for unit testing purposes.
 * After calling this method, no flags will be considered read
 * unless and until they are again accessed thereafter.
 */
function resetFlagsRead() {
    flagsAccessed = new Map();
}

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

    get map() {
      const filterFlag = this;
      if (!filterFlag.found) {
          return null;
      }
      const filterParamArray = filterFlag.isValueSpecified ? filterFlag.value.split(',') : null;
      const filter = { };
      if (filterParamArray && filterParamArray.length > 0) {
          filterParamArray.forEach((param) => {
              const paramParts = param.split('=');
              if (paramParts.length == 2) {
                  // Remove quotes from the value if they exist.
                  if (paramParts[1].startsWith('"') && paramParts[1].endsWith('"')) {
                      paramParts[1] = paramParts[1].substring(1, paramParts[1].length - 1);
                  }
                  filter[paramParts[0]] = paramParts[1];
              } else {
                filter[paramParts[0]] = null;
              }
          });
      }
      
      return filter;    
    }
}

/**
 * Parses a command-line argument as a flag.
 * @param {string} arg 
 * @returns {Flag}
 */
function parseFlag(arg) {
    // Parse the argument to separate the part left of the first equal sign,
    // if present, from the value to the right of the equal sign.
    const indexOfEqualSign = arg.indexOf("=");
    var name;
    var value;
    if (indexOfEqualSign < 0) {
        name = arg;
        value = null;
    } else {
        name = arg.substring(0, indexOfEqualSign);
        value = arg.substring(indexOfEqualSign + 1) || "";
        value = value.replace(/^"(.*)"$/, '$1');
    }
    return new Flag(name, true, value); 
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
  var result = new Flag(name, false);
  process.argv.forEach((arg, index) => {
    const flag = parseFlag(arg);
    if ((flag.name + "").toLowerCase() == (name + "").toLowerCase()) {
        result = flag;
    }
  });
  if (result.found) {
    flagsAccessed.set(name, result);
  }
  return result;
}

function setArgumentsToSkip(count) {
    argumentsToSkip = count;
}

module.exports = { getFlag, assertAllFlagsRead, getNonFlagArguments, 
    resetFlagsRead, InvalidFlagError, setArgumentsToSkip };