const dates = require('./dates');

function renderArray(output, indented, step, array, replacer = null, openInLine = false) {
    if (!openInLine) {
        output += " ".repeat(indented);
    }
    output += "[";
    array.forEach((item, index) => {
      output += "\n";
      output = renderObject(output, indented + step, step, item, replacer);
      if (index < array.length - 1) {
        output += ",";
      }
    });
    output += "\n" + " ".repeat(indented) + "]";
    return output;
  }
  
  function renderObject(output, indented, step, obj, replacer = null, openInLine = false) {
    var linePerAttribute = false;
    for (var key in obj) {
      if (obj[key] != null && typeof obj[key] == "object" && !(obj[key] instanceof Date)) {
        linePerAttribute = true;
        break;
      }
    }
  
    if (!linePerAttribute) {
      if(!openInLine) {
        output += " ".repeat(indented);
      }
      var attributes = "";
      for (var key in obj) {
        if (obj[key] != null) {
          if (attributes) {
              attributes += ",";
          }
          attributes += ` "${key}": ${JSON.stringify(obj[key], replacer)}`;
        }
      }
      output += "{" + attributes + " }";
    } else {
        if (openInLine) {
            output += "{";
        } else {
            output += " ".repeat(indented) + "{";
        }
        for (var i = 0; i < Object.keys(obj).length; i++) {
        var key = Object.keys(obj)[i];
        if (obj[key] != null) {
          if (typeof obj[key] == "object" && !(obj[key] instanceof Date)) {
              if (!Array.isArray(obj[key])) {
              output += "\n" + " ".repeat(indented + step) + `"${key}": `;
              output = renderObject(output, indented + step, step, obj[key], replacer, true);
              }
              else {
              output += "\n" + " ".repeat(indented + step) + `"${key}": `;
              output = renderArray(output, indented + step, step, obj[key], replacer, true);
              }
          } else {
              output += "\n" + " ".repeat(indented + step) + `"${key}": ` + JSON.stringify(obj[key], replacer);
          }
        }
        if (i < Object.keys(obj).length - 1) {
            output += ",";
        }
        }
        output += "\n" + " ".repeat(indented) + "}";
    }

    return output;
  }

  /**
   * Callback for adding two numbers.
   *
   * @callback replacerCallback
   * @param {string} key 
   * @param {*} value
   */

  /**
   * Custom implementation of JSON.stringify that keeps simple objects
   * in one line, and complex objects in multiple lines, and also renders
   * dates in a more readable (local) format. The purpose of this function
   * is to allow JSON to be suitable as both a data structure and a useable
   * report format for scenarios like command console output.
   * @param {*} obj the object to be rendered
   * @param {replacerCallback} [replacer] a function that alters the behavior of the stringification process. Uses defaultReplacer if argument not unspecified.
   * @returns the string representation of the object
   */
  function render(obj, replacer = defaultReplacer) {
    var indented = 0;
    var step = 2;
    var output = "";
    if (Array.isArray(obj)) {
      output = renderArray(output, indented, step, obj, replacer);
    } else {
      output = renderObject(output, indented, step, obj, replacer);
    }
    return output;
  }
  
  function defaultReplacer(key, value) {
    if (dates.isIsoUtcDateString(value)) {
        return new Date(value).toLocaleDateString();
    } else {
        return value;
    }
  }

  module.exports = { render };
  

