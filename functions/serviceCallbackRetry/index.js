/* Using non binding API as described in
  https://docs.microsoft.com/en-us/azure/service-bus-messaging/service-bus-nodejs-how-to-use-queues
*/
const azure = require('azure-sb');

const MAX_RETRIES = 3;

module.exports = async function (context) {
    const serviceBusService = azure.createServiceBusService(process.env['ServiceCallbackBusConnection']);

    var noMessages = false;

    while (!noMessages) {
        serviceBusService.receiveQueueMessage('serviceCallbackRetryQueue', {isPeekLock: true}, function (error, msg) {
            if (!error) {
                // Message received and locked
                processMessage(msg, context, serviceBusService);
                serviceBusService.deleteMessage(msg, function (deleteError) {
                });
            } else {
                context.log.error("Either no messages to receive or error fetching retry message:", error);
                noMessages = true;
            }
        });
    }
};

function processMessage(msg, context, serviceBusService) {
    if (!msg.customProperties.retries) {
        msg.customProperties.retries = 0;
    }
    if (msg.customProperties.retries === MAX_RETRIES) {
        context.log.error("Max number of retries reached for " + JSON.stringify(msg));
        serviceBusService.sendQueueMessage('serviceCallbackRetryQueue/$DeadLetterQueue', msg, function (error) {
        });
    } else {
        delete msg.customProperties.deadletterreason;
        delete msg.customProperties.deadlettererrordescription;

        msg.customProperties.retries++;

        serviceBusService.sendTopicMessage('servicecallbacktopic', msg, function (error) {
            if (error) {
                context.log.error("Error sending topic message", error);
            }
        });
    }
}

