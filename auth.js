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
 * Authenticates the specified Google OAuth2 token using Google's own client library,
 * and then gets the email address of the authenticated user and looks up the user
 * and returns the authenticated application user with details.
 * @param {string} token - The Google OAuth2 token to authenticate.
 * @returns {User} The authenticated user.
 */
async function authenticateToken(token) { 
    if (!token) {
        throw new Error("No token provided.")
    }
    const payload = await verify(token);
    if (!payload.email) {
        throw new Error(`No email address: ${JSON.stringify(payload)}`);
    }
    const userData = usersProvider.findByEmail(payload.email);
    if (!userData) {
        throw new UserNotRegisteredError();
    }
    const auth = google.auth.fromJSON(userData["google-token"]);
    const user = new User(userData.spreadsheetId, auth);
    user.email = payload.email;
    user.name = payload.name;
    return user;
}


async function verify(token) {
    const {OAuth2Client} = require('google-auth-library');
    const CLIENT_ID = "664124005760-c5rk9ag9epvslrg586asicu5f5c4d2h5.apps.googleusercontent.com";
    const client = new OAuth2Client(CLIENT_ID);
  
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID  // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
        if (payload) {
            throw new Error(`Invalid token. Verification payload: ${JSON.stringify(payload)}`);
        } else {
            throw new Error(`Invalid token.`);
        }
    }
    return payload;
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

class UserNotRegisteredError extends Error {
    constructor(message = 'User not registered') {
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
        this.email = null;
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

module.exports = { authenticate, authenticateToken, getUnitTestUser, User, InvalidApiKeyError, setUsersProvider };