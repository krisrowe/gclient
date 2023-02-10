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

    findByApiKey(apiKey) {
        return this.users.find(user => user["api-key"] == apiKey);
    }

    findByEmail(email) {
        if (!email) {
            throw new Error('No email provided.');
        }
        return this.users.find(user => user.email == email);
    }
}

const provider = new LocalUsersProvider();
module.exports = provider;