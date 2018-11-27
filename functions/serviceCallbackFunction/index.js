const request = require('superagent');
const URL = require("url");

module.exports = async function (context, mySbMsg) {

    if (!mySbMsg) {
        context.log.error('No body received');
        return;
    }

    if (!context.bindingData) {
        context.log.error('No binding data');
        return;
    }

    let serviceCallbackUrl = context.bindingData.serviceCallbackUrl;

    if (!serviceCallbackUrl) {
        serviceCallbackUrl = context.bindingData.userProperties.serviceCallbackUrl;

        if (!serviceCallbackUrl) {
            context.log.error('No service callback url...');
            return;
        }

    }

    function processError(e) {

        context.log.error("Exception " + e + " sending message " + JSON.stringify(mySbMsg) + " to " + serviceCallbackUrl);

        const deliveryRetries = context.bindingData.userProperties.deliveryRetries ?
            parseInt(context.bindingData.userProperties.deliveryRetries) : 0;

        if (deliveryRetries >= 3) {
            context.log.error("Discarding message...");
            throw new Error("Discarding message"); /* Forces Subscriber to send the message to dead letter queue */
        }
        context.bindings.tableBinding = {
            PartitionKey: "FailedMessages",
            RowKey: context.bindingData.messageId,
            ServiceCallbackUrl: serviceCallbackUrl,
            DeliveryCount: deliveryRetries,
            Message: mySbMsg


        }
    }

    try {

        const res =
            await
                request
                    .patch(serviceCallbackUrl)
                    .send(mySbMsg);

        if (res.status >= 200 && res.status < 300) {
            context.log.info('Message Sent Successfully to ' + serviceCallbackUrl);
        } else {
            processError(e);
        }

    } catch (e) {
        processError(e);
    }
};