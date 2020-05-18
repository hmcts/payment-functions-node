const serviceCallbackFunction = require('./serviceCallbackFunction');
serviceCallbackFunction().catch((err) => {
  console.log("Error occurred: ", err);
});