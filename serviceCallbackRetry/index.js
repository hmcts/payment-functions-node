/* Using non binding API as described in
  https://docs.microsoft.com/en-us/azure/service-bus-messaging/service-bus-nodejs-how-to-use-queues
*/
const azure = require('azure-sb');

const MAX_RETRIES = 3;

module.exports = async function (context) {
    const serviceBusService = azure.createServiceBusService(process.env['SERVICE_CALLBACK_BUS_CONNECTION']);
    const retryMessages = [];

    function sendRetryMessagesToTopic(context) {
        context.log.info("Received " + retryMessages.length + " messages");
        retryMessages.forEach(
            msg => {
                serviceBusService.sendTopicMessage('servicecallbacktopic', msg, function (error) {
                    if (error) {
                        context.log.error("Error sending topic message", error);
                    }
                });
            }
        );
    }

    async function retrieveQueueMessage(context) {
        context.log.info("Trying to retrieve message from retry queue");
        return new Promise((resolve, reject) => {
            serviceBusService.receiveQueueMessage(process.env['SERVICE_CALLBACK_RETRY_QUEUE'], {isPeekLock: true}, function (error, msg) {
                if (!error) {
                    processMessage(msg, context);
                    retrieveQueueMessage(context); // try again for new messages
                    resolve();
                } else if (error === "No messages to receive") {
                    sendRetryMessagesToTopic(context);
                    resolve();
                } else {
                    context.log.error("Error fetching retry message. Error is:", error);
                    reject();
                }
            });
        });
    }

    await retrieveQueueMessage(context);

    function processMessage(msg, context) {
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

            retryMessages.push(msg);
        }
        // delete locked message from Queue
        serviceBusService.deleteMessage(msg, function (deleteError) {
        });
    }
};
