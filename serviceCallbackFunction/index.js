const request = require('superagent');
let appInsights = require('applicationinsights');
appInsights.setup(process.env['APPINSIGHTS_INSTRUMENTATIONKEY']).start();

module.exports = async function (context, mySbMsg) {
     context.log.info('Received callback message: ',  JSON.stringify(mySbMsg));

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