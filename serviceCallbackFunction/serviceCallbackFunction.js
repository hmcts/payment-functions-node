const request = require('superagent');
const { ServiceBusClient, ReceiveMode } = require("@azure/service-bus");
const config = require('config');

const connectionString = config.get('servicecallbackBusConnection');
const topicName = config.get('servicecallbackTopicName');
const subscriptionName = config.get('servicecallbackSubscriptionName');
const processMessagesCount = config.get('processMessagesCount');

const { Logger } = require('@hmcts/nodejs-logging');

const MAX_RETRIES = 3;

let logger;

module.exports = async function serviceCallbackFunction() {
    const sbClient = ServiceBusClient.createFromConnectionString(connectionString);
    const subscriptionClient = sbClient.createSubscriptionClient(topicName, subscriptionName);
    const receiver = subscriptionClient.createReceiver(ReceiveMode.receiveAndDelete);
    logger = Logger.getLogger('serviceCallbackFunction');
    await receiver.receiveMessages(processMessagesCount)
       .then(async(messages) => {
            if (messages.length > 0) {
                messages.forEach(async (msg) => {
                    await processMsg(msg)
                });
            } else {
                logger.info('no messages received in this run');
            }
    }).finally(async () => {
        await subscriptionClient.close();
        await sbClient.close();
    });
}

validateMessage = message => {
    logger.info('Received callback message: ', JSON.stringify(message.body));
    if (!message.body) {
        logger.error('No body received');
        return false;
    }
    if (!message.userProperties) {
        logger.error('No userProperties data');
        return false;
    }
    let serviceCallbackUrl = message.userProperties.serviceCallbackUrl;
    if (!serviceCallbackUrl) {
        serviceCallbackUrl = message.userProperties.servicecallbackurl;
        if (!serviceCallbackUrl) {
            logger.info('No service callback url...');
            return false;
        }
    }
    return true;
}

async function processMsg(msg) {
    if (this.validateMessage(msg)) {
        const serviceCallbackUrl = msg.userProperties.serviceCallbackUrl;
        try {
            const res = await request.put(serviceCallbackUrl).send(msg.body);
            if (res && res.status >= 200 && res.status < 300) {
                logger.info('Message Sent Successfully to ' + serviceCallbackUrl);
            } else {
                await addRetryMessagesIfNeeded(msg);
                logger.error('Error response received from callback provider: ', res.status);
            }
        } catch (err) {
            logger.error('Error response received from ', serviceCallbackUrl, err );
            await addRetryMessagesIfNeeded(msg);
        }
    } else {
        logger.error('Skipping processing invalid message ' + JSON.stringify(msg.body));
    }
}

async function addRetryMessagesIfNeeded(msg) {
    if (!msg.userProperties.retries) {
        msg.userProperties.retries = 0;
    } else if (msg.userProperties.retries === MAX_RETRIES) {
        logger.info("Max number of retries reached for ", JSON.stringify(msg));
        await msg.complete();
        return;
    }
    msg.userProperties.retries++;
    await sendMessage(msg.clone());
}

async function sendMessage(msg) {
    const sbClient = ServiceBusClient.createFromConnectionString(connectionString);
    const topicClient = sbClient.createTopicClient(topicName);
    const topicSender = topicClient.createSender();
    const msgFailedTime = new Date();
    const retryAfterHalfAnHour = new Date(msgFailedTime.setMinutes(msgFailedTime.getMinutes() + 30));
    topicSender.scheduleMessage(retryAfterHalfAnHour, msg)
        .then(() => {
            logger.info("Message is scheduled to retry at UTC: ", retryAfterHalfAnHour);
        })
        .catch(err => {
            logger.error("Error while scheduling message ", err)
        }).finally(async () => {
            await topicClient.close();
            await sbClient.close();
        })
}