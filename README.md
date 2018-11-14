**Payments Functions for Azure**

**Service Callback**

Receives a message from the service bus which is then sent to a callback endpoint by HTTP PATCH

**How to test and develop locally**

Installation

`npm install -g azure-functions-core-tools`

`npm install`

`npm run setup`

Configuration

Create a `local.settings.json` file inside the functions folder with the following content:

`
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsStorage": "DefaultEndpointsProtocol=XXX",
    "ServiceCallbackBusConnection" : "Endpoint=XXX"
  }
}
`

_Copy the storage value from the functionapp server you want to emulate.

Copy the bus connection from either the functionapp or the servicebus._

Start

`npm run local` 

Run tests

`npm test`

Add New Functions 

_Create a folder with the name of the new function and add `function.json` and `index.js` following the existing
function as template_ 