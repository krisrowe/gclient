class LocalUserManager {
    constructor() {
        var fs = require('fs');
        var path = require('path');
        const SECRETS_PATH = process.env.SECRETS_PATH || path.join(process.cwd(), 'secrets');
        var jsonPath = path.join(SECRETS_PATH, 'users.json');
        var jsonString = fs.readFileSync(jsonPath, 'utf8');
        this.users = JSON.parse(jsonString);     
    }

    findByApiKey(apiKey) {
        return this.users.find(user => user["api-key"] == apiKey);
    }
}

module.exports = {LocalUserManager};