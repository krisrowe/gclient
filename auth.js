const config  = require('config');
const {google} = require('googleapis');

/**
 * Authenticates using an API key and returns the authenticated user details.
 * @param {string} apiKey - The API key to authenticate.
 * @returns {User}
 * @throws {InvalidApiKeyError}
 * @throws {Error} - If no users provider is configured.
 */
function authenticate(apiKey) {
    if (!usersProvider) {
        throw new Error('No users provider configured. Set the "users-provider" config property to the path of a module that exports a users provider.');
    }
    const user = usersProvider.findByApiKey(apiKey);
    if (!user) {
        throw new InvalidApiKeyError();
    }
    const auth = google.auth.fromJSON(user["google-token"]);
    return new User(user.spreadsheetId, auth);
}

/**
 * Gets the user to use for unit tests, using the config setting "unit-test-api-key".
 * @returns {User}
 */
function getUnitTestUser() {
    const apiKey = config.get('unit-test-api-key');
    return this.authenticate(apiKey);
}    

class InvalidApiKeyError extends Error {
    constructor(message = 'Invalid API key') {
        super(message);
    }
}

/**
 * Represents an authenticated user.
 */ 
class User {
    /**
     * @param {string} spreadsheetId - The ID of the spreadsheet.
     * @param {google.auth.OAuth2} auth - The Google OAuth2 client to authorize the request.
     * @constructor
     */
    constructor(spreadsheetId, auth) {
        this._spreadsheetId = spreadsheetId;
        this._auth = auth;
    }

    /**
     * Gets the ID of the spreadsheet to use as a data store for the user.
     * @returns {string}
     */
    get spreadsheetId() {
        return this._spreadsheetId;
    }

    /**
     * Gets the Google OAuth2 client for Google API requests.
     * @returns {google.auth.OAuth2}
     */   
    get auth() {
        return this._auth;
    } 
}

const usersProviderModule = config.has('users-provider') ? config.get('users-provider') : null;
var usersProvider = usersProviderModule ? require(usersProviderModule) : null;

/**
 * Sets the users provider used to authenticate users and retrieve their details by API key,
 * overriding the users provider configured in the config file.
 * @param {Object} provider - The users provider.
 */
function setUsersProvider(provider) {
    usersProvider = provider;
}

module.exports = { authenticate, getUnitTestUser, User, InvalidApiKeyError, setUsersProvider };