const request = require('superagent');

module.exports = async function (context, mySbMsg) {
     context.log('Received callback message: ',  JSON.stringify(mySbMsg));

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
                .put(serviceCallbackUrl)
                .send(mySbMsg);

    if (res.status >= 200 && res.status < 300) {
        context.log.info('Message Sent Successfully to ' + serviceCallbackUrl);
    } else {
        context.log.error('Error response received from callback provider: ' + res.status);
        throw new Error("Response was not 2xx but " + res.status);
    }
};