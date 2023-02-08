const config = require('config');
const {google} = require('googleapis');
const logger = require('./globals.js').logger;
const INBOX_LABEL_ID = "INBOX"; // must be all caps

class GmailManager {
  /**
   * @param {google.auth.OAuth2} auth
   */  
  constructor(auth) {
    this._labelsPromise = null;
    this._processedLabelPromise = null;
    this._auth = auth;
    this._gmail = google.gmail({version: 'v1', auth: auth});
    this._markProcessed = false;
  }

  async archiveEmail(emailId) {
    return await this.labelEmail(emailId, INBOX_LABEL_ID, true);
  }

  async getProcessedLabelId() {
    if (!this._processedLabelPromise) {
      this._processedLabelPromise = new Promise((resolve, reject) => {
        this.fetchLabels().then(labels => {
          const obj = labels.find(l => l.name == config.get('processedEmailLabel'));
          const labelId = obj ? obj.id : "";
          if (!labelId) {
            this._gmail.users.labels.create({
                userId: "me",
                resource: {
                  name: config.get('processedEmailLabel'),
                  labelListVisibility: "labelShow",
                  messageListVisibility: "show"
                }
            }).then(output => {
              logger.log('info', 'New processed email label created with id: ' + output.data.id);
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
 
  get markProcessed() {
    return this._markProcessed;
  }
  set markProcessed(value) {
    this._markProcessed = value;
  }

  async processEmails(queryParams, process, maxResults = 0) {
    if (!queryParams) {
      throw new Error("Must provide queryParams parameter to filter processing of emails.");
    }
    var query;
    if (typeof queryParams === 'object') {
      if (config.has('emailsAfter') && !queryParams.before && !queryParams.after) {
        queryParams.after = config.get('emailsAfter');
      }
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
    logger.log('verbose', 'Retrieving emails with query: ' + query);
    const raw = await this._gmail.users.messages.list(listParams);  
      
    if (!(raw && raw.data && raw.data.messages && raw.data.messages.length > 0)) {
      logger.log('verbose', 'No emails found for query: ' + query);
      return 0;
    }
    logger.log('verbose', `${raw.data.messages.length} emails found for query: ${query}`);
  
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
            //console.log("date " + getResponse.data.internalDate + " - " + new Date(getResponse.data.internalDate))
            e.date = new Date(resolvedMessage.data.internalDate);     
            e.subject = resolvedMessage.data.payload.headers.find(h => h.name == "Subject").value;
            if (resolvedMessage.data.payload.parts) {
              var plain = resolvedMessage.data.payload.parts.find(e => e.mimeType == "text/plain");
              if (plain) {
                e.body = Buffer.from(plain.body.data, "base64").toString("utf8");
                //e.body = e.body.slice(0, 15);
              }
            }
            Promise.resolve(process(e)).then(result => {
              if (this.markProcessed) {
                logger.debug("Marking email as processed: " + e.id);
                this.labelEmail(e.id, config.get('processedEmailLabel')).then((labelResult) => {
                  logger.debug("Email marked as processed: " + e.id);
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
