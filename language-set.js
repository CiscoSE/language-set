/**
 * Language Settings for Cisco Video Codecs
 * @module language-set
 * @author Jaroslav Martan <jmartan@cisco.com>
 * @copyright Copyright (c) 2019 Cisco and/or its affiliates.
 * @license Cisco Sample Code License, Version 1.1
 */
 
 /**
 * @license
 * Copyright (c) 2019 Cisco and/or its affiliates.
 *
 * This software is licensed to you under the terms of the Cisco Sample
 * Code License, Version 1.1 (the "License"). You may obtain a copy of the
 * License at
 *
 *                https://developer.cisco.com/docs/licenses
 *
 * All use of the material herein must be in accordance with the terms of
 * the License. All rights not expressly granted by the License are
 * reserved. Unless required by applicable law or agreed to separately in
 * writing, software distributed under the License is distributed on an "AS
 * IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied.
 */

const xapi = require('xapi');

// global variables
var g_call_active = false;

const DEFAULT_LANG = 0; // default language index
const LANGUAGES = ["English", "German", "ChineseSimplified"]; // see codec command "xconfiguration UserInterface Language: <TAB>"
/* as of now the available languages are:

Arabic               Danish               French               Italian              Portuguese           Swedish
Catalan              Dutch                FrenchCanadian       Japanese             PortugueseBrazilian  Turkish
ChineseSimplified    English              German               Korean               Russian              
ChineseTraditional   EnglishUK            Hebrew               Norwegian            Spanish              
Czech                Finnish              Hungarian            Polish               SpanishLatin         
*/

const MAX_DUMP_DEPTH = 10;

/**
 * dumpObj - get a string dump of an object
 *  
 * @param  {Object} obj    an Object to dump 
 * @param  {string} name   name to assign to the object in dump 
 * @param  {string} indent indentation string, gets added depending on the the depth 
 * @param  {int} depth  maximum depth of the dump 
 * @return {string}        string dump 
 */ 
function dumpObj(obj, name, indent, depth) {
    if (depth > MAX_DUMP_DEPTH) {
        return indent + name + ": <Maximum Depth Reached>\n";
    }
    if (typeof obj == "object") {
        var child = null;
        var output = indent + name + "";
        indent += "-";
        for (var item in obj) {
            try {
                child = obj[item];
            } catch (e) {
                child = "<Unable to Evaluate>";
            }
            if (typeof child == "object") {
                output += dumpObj(child, item, indent, depth + 1);
            } else {
                output += indent + item + ": " + child + "\n";
            }
        }
        return output;
    } else {
        return obj;
    }
}

/**
 * defaultWidgets - initialize widget values on Touch10
 *  
 */ 
function defaultWidgets() {
  console.log("Setting widget defaults");
  xapi.command("UserInterface Extensions Widget Action", {WidgetId: "language", Value: DEFAULT_LANG, Type: "released"});
}

/**
 *
 * setLanguage - set codec UI setLanguage
 * 
 */
function setLanguage(language) {
  console.log("Set language to: "+language+" ("+LANGUAGES[language]+")");
  xapi.config.set("UserInterface Language", LANGUAGES[language]);
}

// monitor call status
const callStatusFeedback = xapi.status.on('Call Status', (status) => {
  console.log('Call status changed to: '+status);
  switch (status) {
    case 'Connected':
        g_call_active = true;
        console.log('call connected');
        break;
    case 'Idle':
        g_call_active = false;
        console.log('call disconnected');
        defaultWidgets(); // reset language back to default
        break;
    default:
  }
});

// De-register feedback
// callStatusFeedback();

// monitor touch10 events
const touchFeedback = xapi.event.on('UserInterface Extensions Widget', (status) => {
  if (status.LayoutUpdated) {
    console.log("Layout updated");
    defaultWidgets();
  } else {
    console.log("Widget event: "+dumpObj(status, "", "  "));
    if (status.Action) {
      var widgetId = status.Action.WidgetId;
      var widgetValue = status.Action.Value;
      var widgetValueInt = parseInt(widgetValue);
      var actionType = status.Action.Type;
      switch (widgetId) {
        case "language":
          if (actionType == "released") {
            setLanguage(widgetValue);
          }
          break;
        default:
          console.log("Widget "+widgetId+" "+actionType+", value: "+widgetValue);
      }
    }
  }
});

// system setup
defaultWidgets();
