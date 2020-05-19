const serviceCallbackFunction = require('./serviceCallbackFunction');
const appInsights = require("applicationinsights");
const config = require('config');

appInsights.setup(config.get('appInsightsInstumentationKey'))
    .setAutoCollectConsole(true, true)
    .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C)
    .setSendLiveMetrics(true)
    .start();
appInsights.defaultClient.context.tags[appInsights.defaultClient.context.keys.cloudRole] = 'ccpay-callback-function';
appInsights.defaultClient.config.maxBatchSize = 0;
serviceCallbackFunction().catch((err) => {
  console.log("Error occurred: ", err);
});