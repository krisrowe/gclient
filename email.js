const {google} = require('googleapis');
const {OAuth2Client} = require('google-auth-library');
const log = require('./logger');
const INBOX_LABEL_ID = "INBOX"; // must be all caps

const LABEL_NAME = process.env.PROCESSED_EMAIL_LABEL;

class GmailManager {
  /**
   * @param {OAuth2Client} auth
   */  
  constructor(auth) {
    this._labelsPromise = null;
    this._processedLabelPromise = null;
    this._auth = auth;
    this._gmail = google.gmail({version: 'v1', auth: auth});
    /**
     * Whether to automatically label successfully processed emails.
     * @type {boolean}
     */
    this.markProcessed = true;    
  }

  async archiveEmail(emailId) {
    return await this.labelEmail(emailId, INBOX_LABEL_ID, true);
  }

  async getProcessedLabelId() {
    if (!this._processedLabelPromise) {
      this._processedLabelPromise = new Promise((resolve, reject) => {
        this.fetchLabels().then(labels => {
          if (!LABEL_NAME) {
            throw "No processed email label specified.";
          }
          const obj = labels.find(l => l.name == LABEL_NAME);
          const labelId = obj ? obj.id : "";
          if (!labelId) {
            this._gmail.users.labels.create({
                userId: "me",
                resource: {
                  name: LABEL_NAME,
                  labelListVisibility: "labelShow",
                  messageListVisibility: "show"
                }
            }).then(output => {
              log.info('New processed email label created with id: ' + output.data.id);
              resolve(output.data.id);
            });
          }
          else
          {
            resolve(labelId);
          }
        });
      });  
    }
    return this._processedLabelPromise;
  }

  async labelEmail(emailId, label, remove) {
    const attribute = remove ? 'removeLabelIds' : 'addLabelIds';
    var message = {
      userId: "me",
      id: emailId,
    };
    message[attribute] = await this.getProcessedLabelId();
    await this._gmail.users.messages.modify(message);
  }

  findAndLabelEmails(queryParams, label, remove = false, maxCount = 0) {
    return this.processEmails(queryParams, message => {
      return this.labelEmail(message.id, label, remove);
    }, maxCount);
  }

  async removeLabel(emailId, label) {
    return await this.labelEmail(emailId, label, true);
  }

  async fetchLabels() {
    if (!this._labelsPromise) {
      this._labelsPromise = this._gmail.users.labels.list({
        userId: 'me',
      });
    }
    return (await this._labelsPromise).data.labels;
  }

  /*
  setLabelInQuery(queryParams, label, requirement) {
    const newParams = JSON.parse(JSON.stringify(queryParams));
    if (requirement == false) {
      queryParams.not = queryParams.not || { };
    } else if (requirement == true) {

    } else {
      queryParams
    }
  }
  */

  async processEmails(queryParams, process, maxResults = 0) {
    if (!queryParams) {
      throw new Error("Must provide queryParams parameter to filter processing of emails.");
    }
    var query;
    if (typeof queryParams === 'object') {
      query = extendGmailQuery("", queryParams);
    } else{
      query = queryParams;
    }
    const listParams = {
      userId: 'me',
      q: query,
    };
    if (maxResults > 0) {
      listParams.maxResults = maxResults;
    }
    log.debug('Retrieving emails with query: ' + query);
    const raw = await this._gmail.users.messages.list(listParams);  
      
    if (!(raw && raw.data && raw.data.messages && raw.data.messages.length > 0)) {
      log.debug('No emails found for query: ' + query);
      return 0;
    }
    log.debug(`${raw.data.messages.length} emails found for query: ${query}`);
  
    var promises = [];
    for (const element of raw.data.messages) {
      var subPromise = new Promise((resolveMessage, rejectMessage) => {
        this._gmail.users.messages.get({
          userId: "me",
          id: element.id,
          format: "full"
        }).then((resolvedMessage) => {
            var e = new Email();
            e.id = element.id;
            e.date = new Date();
            e.date.setTime(resolvedMessage.data.internalDate);  
            log.debug(`Email date ${e.date} parsed from ${resolvedMessage.data.internalDate}.`);  
            if (resolvedMessage.data.raw) {
              e.body = Buffer.from(resolvedMessage.data.raw, "base64").toString("utf8");
              console.log(e.body);
            } else {
              if (resolvedMessage.data && resolvedMessage.data.payload.headers) { 
                e.subject = resolvedMessage.data.payload.headers.find(h => h.name == "Subject").value;
              }
              /*
              if (resolvedMessage.data.payload.parts) {
                var plain = resolvedMessage.data.payload.parts.find(e => e.mimeType == "text/plain");
                if (plain) {
                  e.body = Buffer.from(plain.body.data, "base64").toString("utf8");
                  //e.body = e.body.slice(0, 15);
                }
              }
              */
              if (queryParams.part === "snippet") {
                // Directly use the snippet attribute from the Gmail API
                e.body = resolvedMessage.data.snippet;
              } else if (resolvedMessage.data.payload.parts) {
                let plainTextPart = resolvedMessage.data.payload.parts.find(
                  part => part.mimeType === "text/plain" && part.body.size > 0
                );
              
                if (plainTextPart) {
                  e.body = Buffer.from(plainTextPart.body.data, "base64").toString("utf8");
                } else {
                  let htmlPart = resolvedMessage.data.payload.parts.find(part => part.mimeType === "text/html");
              
                  if (htmlPart) {
                    // Decode base64 HTML body:
                    const decodedHtmlBody = Buffer.from(htmlPart.body.data, "base64").toString("utf8");
                    e.body = decodedHtmlBody; // Store the decoded HTML directly
                  } else {
                    // Handle cases where neither plain text nor HTML parts exist
                    log.warn("No suitable text part found in email.");
                    e.body = "";
                  }
                }
              } else if (resolvedMessage.data.payload.body && resolvedMessage.data.payload.body.size > 0) {
                // Decode base64 body from payload.body:
                e.body = Buffer.from(resolvedMessage.data.payload.body.data, "base64").toString("utf8");
              } else {
                // Handle case where no parts and no payload.body exist
                log.warn("No suitable text part or payload body found in email.");
                e.body = "";
              }  
            }                  
            
            Promise.resolve(process(e)).then(result => {
              if (this.markProcessed) {
                log.debug("Marking email as processed: " + e.id);
                if (!LABEL_NAME) {
                  throw "No processed email label specified.";
                }
                this.labelEmail(e.id, LABEL_NAME).then((labelResult) => {
                  log.debug("Email marked as processed: " + e.id);
                  resolveMessage(e);
                }).catch(err => {
                  rejectMessage("Failed to label email as processed: " + err);
                });
              }
              else {
                resolveMessage(e);
              }
            }).catch(reason => {
              rejectMessage("Failed to run specific process for email: " + reason);
            });
          }
        ).catch(err => {
          rejectMessage(err);
        });
      });          
      promises.push(subPromise);
    }
    const outputs = await Promise.all(promises);
    const countProcessed = outputs != null ? outputs.length : 0;
    return countProcessed;
  } // end of method
} // end of class

class Email {
  constructor() {

  }

  get id() {
    return this._id;
  }

  set id(s) {
    this._id = s;
  }

  get date() {
    return this._date;
  }

  set date(d) {
    this._date = d;
  }

  get subject() {
    return this._subject;
  }

  set subject(s) {
    this._subject = s;
  }

  set body(s) {
    this._body = s;
  }

  get body() {
    return this._body;
  }
}


// *** BEGIN PRIVATE FUNCTIONS ***
function extendGmailQuery(query, params, inverse) {
  var q = query || "";
  for (var property in params) {
    switch (property){
      case "not":
        q = extendGmailQuery(q, params[property], true);
        break;
      case "any":
        q = appendGmailQueryParam(q, "", params[property], inverse);
        break;
      case "part":
        // does not affect  query sent to API
        break;
      default:
        q = appendGmailQueryParam(q, property, params[property], inverse);
        break;
    }
  }
  return q;
}

function appendGmailQueryParam(q, name, value, inverse) {
  if (!value) {
    return q;
  }
  if (q) {
    q = q + " ";
  } else {
    q = "";
  }
  if (inverse) {
    q += "-";
  }
  if (name) {
    q = q + name + ":";
  }
  if (value.includes(" ")) {
    q = q + "\"" + value + "\"";
  } else {
    q = q + value;
  }
  return q;
}
// *** END PRIVATE FUNCTIONS ***


module.exports = { GmailManager };
