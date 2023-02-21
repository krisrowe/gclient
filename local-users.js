const { User } = require('./auth');
const { google } = require('googleapis');

class LocalUsersProvider {
    constructor() {
        var fs = require('fs');
        var path = require('path');
        const localUsersFilePath = process.env.LOCAL_USERS_PATH 
            || path.join(process.cwd(), 'secrets/users.json');
        if (fs.existsSync(localUsersFilePath)) {
            var jsonString = fs.readFileSync(localUsersFilePath, 'utf8');
            this.users = JSON.parse(jsonString);         
        } else {
        const LOCAL_USERS_PATH = process.env.LOCAL_USERS_PATH 
            throw new Error('No users file found at ' + localUsersFilePath + '. Place the file at that location or specify an alternate path and file name using the LOCAL_USERS_PATH environment variable.');
        }
    }

    getByApiKey(apiKey) {
        if (!apiKey) {
            throw new Error('No API key provided.');
        }
        const data = this.users.find(user => user["api-key"] == apiKey);
        return this.loadUserData(data);
    }

    loadUserData(data) {
        if (data) {
            const auth = google.auth.fromJSON(data["google-token"]);
            const user = new User();
            user.spreadsheetId = data.spreadsheetId;
            user.auth = auth;
            user.email = data.email;
            user.name = data.name + "";
            user.apiKey = data["api-key"];
            return user;
        }  else {
            return null;
        }
    }

    findByEmail(email) {
        if (!email) {
            throw new Error('No email provided.');
        }
        const data = this.users.find(user => user.email == email);
        return this.loadUserData(data);
    }
}

const provider = new LocalUsersProvider();
module.exports = provider;