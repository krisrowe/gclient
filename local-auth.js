const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
//const { gmailpostmastertools } = require('googleapis/build/src/apis/gmailpostmastertools/index.js');

// If modifying these scopes, delete google.json.
const SCOPES = ['https://www.googleapis.com/auth/gmail.labels', // master labels list access
  'https://www.googleapis.com/auth/gmail.modify', // min to assign/remove labels on an email
  'https://www.googleapis.com/auth/spreadsheets', // min permissions for writing to sheets
  'https://www.googleapis.com/auth/logging.write' // enable use of Google Cloud Logging for GCP deployment
]; 

async function generateToken(credentialsPath) {
  if (!credentialsPath) {
    throw new Error('No file path specified for Google credentials input.');
  }
  if (!credentialsPath.startsWith('/')) {
    credentialsPath = path.join(process.cwd(), credentialsPath);
  }
  console.log('credentials (input) path: ' + credentialsPath);
  var client;
  try {
    client = await authenticate({
      scopes: SCOPES,
      keyfilePath: credentialsPath,
    });
    console.log('authentication with Google complete');
  } catch (err) {
    if (err.code == "MODULE_NOT_FOUND") {
      throw new Error('Google authenticatication failed. Please ensure the OAuth 2 credentials have been retrieved and saved locally in JSON format to the specified file path.');
    } else {
      throw err;
    }
  }
  if (client.credentials) {
    const refreshToken = client.credentials.refresh_token;
    return buildToken(refreshToken, credentialsPath);
  }
  throw new Error('Google authentication failed. No credentials found.');
}

/**
 * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
 *
 * @param {String} refreshToken
 * @param {String} credentialsPath
 * @return {Promise<void>}
 */
async function buildToken(refreshToken, credentialsPath) {
  const content = await fs.readFile(credentialsPath);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: refreshToken,
  });
  return payload;
}

module.exports = { generateToken };