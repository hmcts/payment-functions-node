/* Using non binding API as described in
  https://docs.microsoft.com/en-us/azure/service-bus-messaging/service-bus-nodejs-how-to-use-queues
*/
const azure = require('azure-sb');

const MAX_RETRIES = 3;

module.exports = async function (context) {
    const serviceBusService = azure.createServiceBusService(process.env['ServiceCallbackBusConnection']);
    const retryMessages = [];

    function sendRetryMessagesToTopic(context) {
        context.log("Received " + retryMessages.length + " messages");
        retryMessages.forEach(
            msg => {
                context.log("I am Retry-----8---sendRetryMessagesToTopic Received from serviceCallbackRetryQueue");
                serviceBusService.sendTopicMessage('servicecallbacktopic', msg, function (error) {
                    if (error) {
                        context.log.error("Error sending topic message", error);
                    }
                });
            }
        );
    }

    async function retrieveQueueMessage(context) {
        context.log("I am Retry-----1---Trying to retrieve message from retry queue");
        return new Promise((resolve, reject) => {
            serviceBusService.receiveQueueMessage('serviceCallbackRetryQueue', {isPeekLock: true}, function (error, msg) {
                context.log("I am Retry-----2---Received error from serviceCallbackRetryQueue " + JSON.stringify(error));
                context.log("I am Retry-----3---Received Message from serviceCallbackRetryQueue " + JSON.stringify(msg));
                if (!error) {
                    context.log("I am Retry-----4---Received Message from serviceCallbackRetryQueue");
                    processMessage(msg, context);
                    retrieveQueueMessage(context); // try again for new messages
                    resolve();
                } else if (error === "No messages to receive") {
                    context.log("I am Retry-----5---Received Message from serviceCallbackRetryQueue");
                    sendRetryMessagesToTopic(context);
                    resolve();
                } else {
                    context.log("I am Retry-----6---Received Message from serviceCallbackRetryQueue");
                    context.log.error("Error fetching retry message. Error is:", error);
                    reject();
                }
            });
        });
    }

    await retrieveQueueMessage(context);

    function processMessage(msg, context) {
        context.log("I am Retry-----7---processMessage Received from serviceCallbackRetryQueue");
        if (!msg.customProperties.retries) {
            msg.customProperties.retries = 0;
        }
        if (msg.customProperties.retries === MAX_RETRIES) {
            context.log.error("Max number of retries reached for " + JSON.stringify(msg));
            //TODO: Find an alternative to do this
            // serviceBusService.sendQueueMessage('serviceCallbackRetryQueue/$DeadLetterQueue', msg, function (error) { });
        } else {
            context.log("I am Retry-----8---processMessage Received from serviceCallbackRetryQueue");
            delete msg.customProperties.deadletterreason;
            delete msg.customProperties.deadlettererrordescription;

            msg.customProperties.retries++;

            retryMessages.push(msg);
        }
        // delete locked message from Queue
        serviceBusService.deleteMessage(msg, function (deleteError) {
        });
    }
};
