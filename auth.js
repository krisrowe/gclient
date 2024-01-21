const config  = require('config');
const {google} = require('googleapis');

/**
 * Authenticates using an API key and returns the authenticated user details.
 * @param {string} apiKey - The API key to authenticate.
 * @returns {User}
 * @throws {InvalidApiKeyError}
 * @throws {Error} - If no users provider is configured.
 */
function getUserByApiKey(apiKey) {
    const usersProvider = getUsersProvider();
    if (!usersProvider) {
        throw new Error('No users provider set.');
    }
    return usersProvider.getByApiKey(apiKey);
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
    const usersProvider = this.getUsersProvider();
    if (!usersProvider) {
        throw new Error('No users provider configured. Set the "users-provider" config property to the path of a module that exports a users provider.');
    }
    const user = usersProvider.findByEmail(payload.email);
    if (!user) {
        throw new UserNotRegisteredError();
    }
    return user;
}


async function verify(token) {
    const {OAuth2Client} = require('google-auth-library');
    const CLIENT_ID = config.get('googleClientID');
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
    return getUserByApiKey(apiKey);
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
    constructor() {
        this.spreadsheetId = "";
        this.auth = null;
        this.email = "";
        this.name = "";
        this.apiKey = "";
    }
}

var usersProvider = null;
function getUsersProvider() {
    if (!usersProvider) {
        /*
        const usersProviderModule = config.has('users-provider') ? config.get('users-provider') : null;
        usersProvider = usersProviderModule ? require(usersProviderModule) : null;
        */
    }
    return usersProvider;
}

/**
 * Sets the users provider used to authenticate users and retrieve their details by API key,
 * overriding the users provider configured in the config file.
 * @param {Object} provider - The users provider.
 */
function setUsersProvider(provider) {
    usersProvider = provider;
}

module.exports = { getUserByApiKey, authenticateToken, getUnitTestUser, User, InvalidApiKeyError, setUsersProvider };