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
            context.log.error('No serviceCallbackUrl');
            return;
        }

    }

    serviceCallbackUrl = URL.parse(serviceCallbackUrl);

    const res = await request
        .patch(serviceCallbackUrl)
        .send(mySbMsg);

    if (res.status >= 200 && res.status < 300) {
        context.log.info('Message Sent Succesfully to ' + serviceCallbackUrl);
    } else {
        context.log.error("Error " + res.status + " sending message " + mySbMsg + " to " + serviceCallbackUrl);
    }

};