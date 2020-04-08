const request = require('superagent');
const otp = require('otp');
const req = require('request-promise-native');

module.exports = function (context, mySbMsg) {
    context.log('Received callback message: ', JSON.stringify(mySbMsg));
    context.log('I am here-----0 ' + "s2s_url: " + process.env["s2s_url"]);
    context.log('I am here-----0 ' + "s2s_key: " + process.env["s2s_key"]);
    context.log('I am here-----0 ' + "ccpaybubble_microservice: " + process.env["ccpaybubble_microservice"]);

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
    context.log.info('I am here-----1 ' + serviceCallbackUrl);
    try {

        const s2sUrl = process.env["s2s_url"];
        const ccpayBubbleSecret = process.env["s2s_key"];
        const microService = process.env["ccpaybubble_microservice"];

        const otpPassword = otp({ secret: ccpayBubbleSecret }).totp();
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
                        ServiceAuthorization: 'Bearer ' + token,
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