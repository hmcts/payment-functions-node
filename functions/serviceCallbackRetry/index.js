/* Using non binding API as described in
  https://docs.microsoft.com/en-us/azure/service-bus-messaging/service-bus-nodejs-how-to-use-queues
  https://docs.microsoft.com/en-us/azure/service-bus-messaging/service-bus-nodejs-how-to-use-topics-subscriptions
*/
const azure = require('azure');

const MAX_RETRIES = 3;

module.exports = async function (context) {

    const serviceBusService = azure.createServiceBusService(process.env['ServiceCallbackBusConnection']);

    const receivedMessages = [];

    const errorFunction = function (error) {
        if (error) {
            context.log.error("Error", error);
        }
    };

    function sendMessageToDeadLetter(msg) {
        context.log.error("Max number of retries reached for " + JSON.stringify(msg));
        context.log.error("Message Discarded");
        //TODO: Find an alternative to do this
        //serviceBusService.sendQueueMessage('serviceCallbackRetryQueue/$DeadLetterQueue', msg, errorFunction);
    }

    function sendRetryMessages() {

        context.log.error("Received " + receivedMessages.length + " messages");

        receivedMessages.forEach(
            msg => {

                serviceBusService.sendTopicMessage(
                    'serviceCallbackTopic',
                    msg,
                    errorFunction
                );
            }
        );
    }

    function fetchAllMessagesThenRetryThem() {

        serviceBusService.receiveQueueMessage('serviceCallbackRetryQueue', {isPeekLock : true}, function (error, msg) {

            if (error) {

                if (error === "No messages to receive") {
                    sendRetryMessages();
                    return;
                }

                return errorFunction(error);
            }

            if (!msg.customProperties.retries) {
                msg.customProperties.retries = 0;
            }

            if (msg.customProperties.retries === MAX_RETRIES) {
                sendMessageToDeadLetter(msg);
            }else{
                delete msg.customProperties.deadletterreason;

                delete msg.customProperties.deadlettererrordescription;

                msg.customProperties.retries++;

                receivedMessages.push(msg);
            }

            return fetchAllMessagesThenRetryThem();
        });
    }

    fetchAllMessagesThenRetryThem();
};