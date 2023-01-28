const config  = require('config');
const {google} = require('googleapis');

class Manager {
    constructor(userManager) {
        this._userManager = userManager;
    }

    authenticate(apiKey) {
        const user = this._userManager.findByApiKey(apiKey);
        if (!user) {
            throw new InvalidApiKeyError();
        }
        const auth = google.auth.fromJSON(user["google-token"]);
        return new User(user.spreadsheetId, auth);
    }

    getUnitTestUser() {
        const apiKey = config.get('unit-test-api-key');
        return this.authenticate(apiKey);
    }    
}

class InvalidApiKeyError extends Error {
    constructor(message = 'Invalid API key') {
        super(message);
    }
}

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

    get spreadsheetId() {
        return this._spreadsheetId;
    }

    get auth() {
        return this._auth;
    } 
}

module.exports = {Manager, User, InvalidApiKeyError};