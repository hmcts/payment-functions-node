const request = require('superagent');

module.exports = async function (context, mySbMsg) {

    if (!mySbMsg) {
        context.log.error('No body received');
        return;
    }

    if (!context.bindingData) {
        context.log.error('No binding data');
        return;
    }

    let serviceCallbackUrl = context.bindingData.userProperties.serviceCallbackUrl;

    if (!serviceCallbackUrl) {
        serviceCallbackUrl = context.bindingData.userProperties.servicecallbackurl;

        if (!serviceCallbackUrl) {
            context.log.error('No service callback url...');
            return;
        }

    }

    const res =
        await
            request
                .patch(serviceCallbackUrl)
                .send(mySbMsg);

    if (res.status >= 200 && res.status < 300) {
        context.log.info('Message Sent Successfully to ' + serviceCallbackUrl);
    } else {
        throw new Error("Response was not 2xx but " + res.status);
    }
};