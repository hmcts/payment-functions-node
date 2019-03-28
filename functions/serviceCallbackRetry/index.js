/* Using non binding API as described in
  https://docs.microsoft.com/en-us/azure/service-bus-messaging/service-bus-nodejs-how-to-use-queues
*/
const azure = require('azure-sb');

const MAX_RETRIES = 3;

module.exports = async function (context) {
    const serviceBusService = azure.createServiceBusService(process.env['ServiceCallbackBusConnection']);
    const receivedMessages = [];

    async function retrieveQueueMessage(context, serviceBusService) {
        context.log("Trying to retrieve message from retry queue");
        return new Promise((resolve, reject) => {
            serviceBusService.receiveQueueMessage('serviceCallbackRetryQueue', {isPeekLock: true}, function (error, msg) {
                if (!error) {
                    processMessage(msg, context, serviceBusService, receivedMessages);
                    await retrieveQueueMessage(context, serviceBusService); // try again for new messages
                    resolve();
                } else if (error === "No messages to receive") {
                    sendRetryMessagesToTopic(receivedMessages);
                    resolve();
                } else {
                    context.log.error("Error fetching retry message. Error is:", error);
                    reject();
                }
            });
        });
    }

    await retrieveQueueMessage(context, serviceBusService);
};

function processMessage(msg, context, serviceBusService, receivedMessages) {
    if (!msg.customProperties.retries) {
        msg.customProperties.retries = 0;
    }
    if (msg.customProperties.retries === MAX_RETRIES) {
        context.log.error("Max number of retries reached for " + JSON.stringify(msg));
        //TODO: Find an alternative to do this
        // serviceBusService.sendQueueMessage('serviceCallbackRetryQueue/$DeadLetterQueue', msg, function (error) { });
    } else {
        delete msg.customProperties.deadletterreason;
        delete msg.customProperties.deadlettererrordescription;

        msg.customProperties.retries++;

        receivedMessages.push(msg);
    }
    // delete locked message from Queue
    serviceBusService.deleteMessage(msg, function (deleteError) {
    });
}

function sendRetryMessagesToTopic(context, receivedMessages) {
    context.log.error("Received " + receivedMessages.length + " messages");
    receivedMessages.forEach(
        msg => {
            serviceBusService.sendTopicMessage('servicecallbacktopic', msg, function (error) {
                if (error) {
                    context.log.error("Error sending topic message", error);
                }
            });
        }
    );
}
