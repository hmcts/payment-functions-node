const request = require('superagent');
const { ServiceBusClient, ReceiveMode } = require("@azure/service-bus");
const config = require('config');

const connectionString = config.get('servicecallbackBusConnection');
const topicName = config.get('servicecallbackTopicName');
const subscriptionName = config.get('servicecallbackSubscriptionName');
const processMessagesCount = config.get('processMessagesCount');

const MAX_RETRIES = 3;

let logger;

module.exports = async function serviceCallbackFunction() {
    const sbClient = ServiceBusClient.createFromConnectionString(connectionString);
    const subscriptionClient = sbClient.createSubscriptionClient(topicName, subscriptionName);
    const receiver = subscriptionClient.createReceiver(ReceiveMode.receiveAndDelete);
    await receiver.receiveMessages(processMessagesCount)
       .then(async(messages) => {
            if (messages.length > 0) {
                messages.forEach(async (msg) => {
                    await processMsg(msg)
                });
            } else {
                console.log('no messages received in this run');
            }
    }).finally(async () => {
        await subscriptionClient.close();
        await sbClient.close();
    });
}

validateMessage = message => {
    console.log('Received callback message: ', JSON.stringify(message.body));
    if (!message.body) {
        console.log('No body received');
        return false;
    }
    if (!message.userProperties) {
        console.log('No userProperties data');
        return false;
    }
    let serviceCallbackUrl = message.userProperties.serviceCallbackUrl;
    if (!serviceCallbackUrl) {
        serviceCallbackUrl = message.userProperties.servicecallbackurl;
        if (!serviceCallbackUrl) {
            console.log('No service callback url...');
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
                console.log('Message Sent Successfully to ' + serviceCallbackUrl);
            } else {
                await addRetryMessagesIfNeeded(msg);
                console.log('Error response received from callback provider: ', res.status);
            }
        } catch (err) {
            console.log('Error response received from ', serviceCallbackUrl, err );
            await addRetryMessagesIfNeeded(msg);
        }
    } else {
        console.log('Skipping processing invalid message ' + JSON.stringify(msg.body));
    }
}

async function addRetryMessagesIfNeeded(msg) {
    if (!msg.userProperties.retries) {
        msg.userProperties.retries = 0;
    } else if (msg.userProperties.retries === MAX_RETRIES) {
        console.log("Max number of retries reached for ", JSON.stringify(msg));
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
            console.log("Message is scheduled to retry at UTC: ", retryAfterHalfAnHour);
        })
        .catch(err => {
            console.log("Error while scheduling message ", err)
        }).finally(async () => {
            await topicClient.close();
            await sbClient.close();
        })
}