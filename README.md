# Node.js API for Dynatrace OneAgent

This module provides JavaScript bindings for Node.js applications 
monitored with [Dynatrace](https://www.dynatrace.com/technologies/nodejs-monitoring/).

## What does this module provide?
The current version provides a method `passContext()` which passes transactional context 
through chains of callbacks for *currently not supported technologies*.
Dynatrace supports many technologies out-of-the-box and context loss only happens 
in rare cases - so only use this module if transactions seem to be incomplete.

## Quick Start

### Installation
`$ npm install --save dynatrace-agent-api`

### Usage

#### Example: Regular callbacks
```js
const dta = require('dynatrace-agent-api')();

some.asyncFunction(someParam, dta.passContext(function(err, result) {
   // Context is preserved
   http.get('https://some-api.xyz/service', dta.passContext((res) => {}));
}));
```

#### Example: Express route with couchDB middleware and promises
```js
const dta = require('dynatrace-agent-api')();

function couchMiddleware(req, res, next) {
  couch.get("testdb", "123a3354452ddfa2973ec0a477000f7a").then(dta.passContext(couchCallback), err => {
    if(err) throw err;
  }).then(dta.passContext(next)); 
}

router.get('/couchdb', couchMiddleware, (req, res, next) => {
  request.get('https://google.com', (err, result) => {
    res.send('hello');
  });
});

```
### Please Note
* Make sure that the module is required after Dynatrace agent.
* Using this module will not cause any errors if no agent is present (e.g. in testing). 
* The wrapping needs to happen call time.

```js
// This will *NOT* work
const wrappedFunction = dta.passContext(someFunction);
some.asyncFunction('someParam', wrappedFunction);

// This works
some.asyncFunction('someParam', dta.passContext(someFunction));
```

## Further Information

### What is transactional context?
[Dynatrace's patented PurePath Technology®](https://www.dynatrace.com/en_us/application-performance-management/products/purepath-technology.html) captures timing and code level context for *all* transactions, 
end-to-end, from user click, across all tiers, to the database of record and back. 
Technically this means that Dynatrace adds transactional context to any inbound-, outbound- and function call of an application.  

### What does this mean for Node.js applications?

Node.js is single threaded - its control flow is based on events and asynchronous callbacks.

Let's look at an example for finding a document with mongoDB:

```js
function callback(err, document) {
    console.log(document.name);

    http.get('https://some-api.xyz/service', (res) => {});
      // ^^^                                 °°°°°°°°°°°
      // Asynchronous call                   Asynchronous callback                                            
}

collection.findOne({_id: doc_id}, callback);
        // ^^^^^^^                °°°°°°°°
        // Asynchronous call      Asynchronous callback

```

After `collection.findOne()` is executed asynchronously `callback()` will be called.
`callback()` again contains an asynchronous call `http.get()` which performs an outbound http request.
If there is a current transactional context, Dynatrace will transparently add a header containing a transaction id to this outbound request. 
The next tier - if instrumented with Dynatrace - will continue this transaction then.

Without further intervention any transactional context would get lost between asynchronous invocation
and a callback.

Currently the only reliable way to pass over context information to a callback is called 'wrapping'.

This means: Dynatrace will transparently wrap *supported* libraries to add context information.
For every yet *unsupported* module `passContext()` can be used to provide transactional context to callbacks.



## License
Licensed under the MIT License. See the LICENSE file for details.