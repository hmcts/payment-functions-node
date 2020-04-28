const request = require('superagent');
const otp = require('otp');
const req = require('request-promise-native');

module.exports = function (context, mySbMsg) {
    context.log('Received callback message: ', JSON.stringify(mySbMsg));
    context.log('I am here-----0 ' + "s2s_url: " + process.env["s2s_url"]);

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

    let serviceName = context.bindings.serviceCallback.service_name;

    if (!serviceName) {
        serviceName = context.bindingData.service_name;

        if (!serviceName) {
            context.log.error('No service name to callback...');
            return;
        }
    }

    context.log.info('I am here-----1 ' + serviceCallbackUrl);
    context.log.info('I am here-----1 ' + serviceName);

    try {

        const s2sUrl = process.env["s2s_url"];
        const s2sSecret = process.env["s2s_key_payment_app"];
        const microService = process.env["microservice_payment_app"];

        context.log.info('I am here-----1 s2sSecret ' + s2sSecret);
        context.log.info('I am here-----1 microService ' + microService);

        const otpPassword = otp({ secret: s2sSecret }).totp();
        const serviceAuthRequest = {
            microservice: microService,
            oneTimePassword: otpPassword
        };
        context.log.info('I am here-----11 ' + ' otpPassword : ' + otpPassword);
        req.post({
            uri: s2sUrl + '/lease',
            body: serviceAuthRequest,
            json: true
        })
            .then(token => {
                context.log.info('I am here-----12 ' + ' S2S Token : ' + JSON.stringify(token));
                req.put({
                    uri: serviceCallbackUrl,
                    headers: {
                        ServiceAuthorization: token,
                        'Content-Type': 'application/json'
                    },
                    json: true,
                    body: mySbMsg
                }).then(response => {
                    context.log.info('Response : ' + JSON.stringify(response));
                    context.log.info('Message Sent Successfully to ' + serviceCallbackUrl);
                })
                    .catch(error => {
                        context.log.info('Error in Calling Service ' + error.message + error.response);
                    })
            }).catch(error => {
                context.log.info('Error in fetching S2S token ' + error.message + error.response);
            });
    } catch (error) {
        context.log.info('I am here-----16 ' + error.message + error.response);
    }
    context.log.info('I am here-----17 ' + serviceCallbackUrl);
};