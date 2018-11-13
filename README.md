**Payments Functions for Azure**

**Service Callback**

Receives a message from the service bus which is then sent to a callback endpoint by HTTP PATCH

**How to test and develop**

Installation

`npm install -g azure-functions-core-tools`

`./node_modules/azure-functions-core-tools/bin/func extensions install`

`npm install`

Start

`npm start` 

Run tests

`npm test`

Add New Functions 

_Create a folder with the name of the new function and add `function.json` and `index.js` following the existing
function as template_ 