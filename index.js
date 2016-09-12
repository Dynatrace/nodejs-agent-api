'use strict';

const debug = require('debug')('dynatrace-agent-api');
const path = require('path');
function findAgent() {
    return Object.keys(require('module')._cache).find((m) => {
        if(m.includes('nodejsagent.js') && (m.includes('dynatrace') || m.includes('ruxit'))) return m;
    }) || null;
}

module.exports = function dynatraceAgentAPI() {
    let core = null;
    const agentPath = findAgent();

    if(agentPath) {
        core = require(path.dirname(agentPath) + '/lib/core');
    } else {
        debug("No Dynatrace Node.js agent found.");
    }

    return {

        /**
         * Passes context into a callback function (f)
         * @param {Function} f
         * @returns {Function}
         */
        passContext: function passContext(f) {
            if(!core) {
                return f;
            } 
            const fname = f.prototype ? f.prototype.name : 'anonymous function';
            return core.directAsyncWrap(f, {}, 'callback for ' + fname);
        }
    }
};