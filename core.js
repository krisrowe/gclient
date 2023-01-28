function isDate(s) {
    return (new Date(s) !== "Invalid Date") && !isNaN(new Date(s));
}

Date.prototype.getWithoutTime = function () {
    return new Date(this.toDateString());
}

Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

Date.prototype.dateEquals = function(otherDate) {
    return this.getWithoutTime().getTime() == otherDate.getWithoutTime().getTime();
}

function parseIsoDate(s) {
  var pattern = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
  var segments = s.match(pattern);
  return new Date(segments[1], segments[2] - 1, segments[3]);
}

String.prototype.toProperCase = function () {
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

function mapProperties(obj, map) {
  const result = { };
  for (var property in map) {
    const newProperty = map[property];
    result[newProperty] = obj[property];
  }
  return result;
}


function reversePropertyMap(map) {
  const result = { };
  for (const property in map) {
    result[map[property]] = property;
  } 
  return result;
}

function sign(message){     
  var signature = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, 
    message, Utilities.Charset.US_ASCII);
  var signatureStr = '';
    for (i = 0; i < signature.length; i++) {
      var byte = signature[i];
      if (byte < 0)
        byte += 256;
      var byteStr = byte.toString(16);
      // Ensure we have 2 chars in our byte, pad with 0
      if (byteStr.length == 1) byteStr = '0'+byteStr;
      signatureStr += byteStr;
    }   
  return signatureStr;
}

const singleDateExp = "(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\\s\\d+(?:,\\s(\\d+))";

function findDateRange(sourceText) {
  // Add a question mark at the end of the first single date expression, as the start date may or may not have a year,
  // but the second date MUST have a year. Before requiring the second date to include a year, at least one email 
  // resulted in a date range elsewhere in the email being matched (in the body), which was not the formal date range,
  // and therefore, no year was captured.  
  var exp = "(" + singleDateExp + "?)\\s-\\s(" + singleDateExp +")"; 
  var regExp = new RegExp(exp, "gi");  // "i" is for case insensitive
  var match = regExp.exec(sourceText);
  if (match && match.length > 0) {
    var result = { startDate: match[1], endDate: match[3] };
    if (!match[2]) {
      // When there is no year on the start date, use the year from the end date.
      result.startDate += ", " + match[4];
    }
    return result;
  } else {
    console.log("No date range found.");
  }
}


function extractSingleValue(sourceText, regex, params) {
  var flags = "";
  if (params && params.isGlobal) {
    flags += "g";
  }
  if (params && params.caseSensitive) {
    //
  } else {
    flags += "i";
  }
  var regExp = new RegExp(regex, flags);
  var match = regExp.exec(sourceText);
  if (match && match.length > 0) {
    if (params && params.isNumber) {
      return Number(match[0].replace(',',''));
    }
    else 
    { 
      return match[0];
    }
  } else {
    if (params && params.isRequired) {
      throw new Error("Message is missing required field. Pattern: " + regex);
    }
    else if (params && params.isNumber) {
      return 0;
    } else {
      return "";
    }
  }
}

function getAmountFieldRegEx(fieldLabel) {
  return "[\\r\\n\\s]+" + fieldLabel + "[\\r\\n\\s]+([\\−\\-\\$\\d.,]+)[\\r\\n\\s]+";
}

function extractFieldLineValue(sourceText, fieldLabel) {
    var regExp = new RegExp("(?<=\\n" + fieldLabel + "\\s+).+", "gi");
    var match = regExp.exec(sourceText);
    if (match) {
      return match[0].trim();
    } else {
      return 0;
    }

}

function extractAmountField(sourceText, fieldLabel, reverse) {
    var regExp = new RegExp(getAmountFieldRegEx(fieldLabel), "gi");
    var match = regExp.exec(sourceText);
    if (match) {
      return Number(match[1].replace(',', '').replace('$', '').replace('−','-').replace("--", "-")) * (reverse ? -1 : 1);
    } else {
      return 0;
    }
}

module.exports = { mapProperties, reversePropertyMap, extractSingleValue, extractAmountField, extractFieldLineValue, getAmountFieldRegEx, findDateRange, singleDateExp };