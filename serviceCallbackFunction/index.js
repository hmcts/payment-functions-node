const serviceCallbackFunction = require('./serviceCallbackFunction');
const appInsights = require("applicationinsights");
const config = require('config');

appInsights.setup(config.get('appInsightsInstumentationKey'));
appInsights.start();
serviceCallbackFunction().catch((err) => {
  console.log("Error occurred: ", err);
});