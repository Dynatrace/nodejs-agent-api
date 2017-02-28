"use strict";

var debug = require("debug")("dynatrace-agent-api");
var path = require("path");

// Dummy AgentApi, which acts as a nop
function getDummyAgentApi() {
    return {
        passContext: function passContext(f) {
            return f;
        }
    };
}

function findAgent() {
    var cache = Object.keys(require("module")._cache);
    var i = 0;
    while (i < cache.length) {
        var m = cache[i];
        if ((m.indexOf("nodejsagent.js") !== -1) && ((m.indexOf("dynatrace") !== -1) || (m.indexOf("ruxit") !== -1))) {
            return m;
        }
        i++;
    }
    return null;
}

function getLegacyAgentApi() {
    var agentPath = findAgent();

    if (agentPath) {
        try {
            var directAsyncWrap = require(path.dirname(agentPath) + "/lib/core").directAsyncWrap;
            if (typeof(directAsyncWrap) !== "function") {
                debug("Failed to get core.directAsyncWrap() from agent");
                return null;
            }

            return {
                /**
                 * Passes context into a callback function (f)
                 * @param {Function} f
                 * @returns {Function}
                 */
                passContext: function passContext(f) {
                    var fname = f.prototype ? f.prototype.name : "anonymous function";
                    return directAsyncWrap(f, {}, "callback for " + fname);
                }
            }
        } catch (e) {
            debug("Failed to require path.dirname(agentPath) + '/lib/core'" + e);
        }
    } else {
        debug("No legacy Dynatrace Node.js agent found.");
    }

    return null;
}

function getAgentApi() {
    if (typeof(global.__DT_GETAGENTAPI__) === "function") {
        try {
            return global.__DT_GETAGENTAPI__(1);
        } catch (e) {
            debug("Exception getting Dynatrace Agent Api." + e);
        }
    }

    debug("No Dynatrace AgentApi found.");

    return null;
}

module.exports = function dynatraceAgentAPI() {
    return getAgentApi() || getLegacyAgentApi() || getDummyAgentApi();
};
