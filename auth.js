const {google} = require('googleapis');

async function verify(token) {
    const {OAuth2Client} = require('google-auth-library');
    const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    if (!CLIENT_ID) {
        throw new Error('Must set the GOOGLE_CLIENT_ID environment variable.');
    }
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

module.exports = { verify };