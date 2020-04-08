const request = require('superagent');
const otp = require('otp');
const req = require('request-promise-native');

module.exports = async function (context, mySbMsg) {
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

        const s2sUrl = process.env["s2s_url"];
        const ccpayBubbleSecret = process.env["s2s_key"];
        const microService = process.env["ccpaybubble_microservice"];

        /*
        const s2sUrl = 'http://rpe-service-auth-provider-aat.service.core-compute-aat.internal';
        //const s2sUrl_local = 'http://localhost:23443';
        const ccpayBubbleSecret = 'G5XTFNBUW4P6ZP4F';
        const microService = 'ccpay_bubble';
        */
        const otpPassword = otp({ secret: ccpayBubbleSecret }).totp();
        const serviceAuthRequest = {
            microservice: microService,
            oneTimePassword: otpPassword
        };
        context.log.info('I am here-----11 ' + ' otpPassword : ' + otpPassword);
        /*
        const resp = await request
            .post(s2sUrl + '/lease')
            .set('Accept', 'application/json')
            .send(serviceAuthRequest);
        context.log.info('I am here-----12 ' + ' S2S Service Response : ' + resp.status);
        const res = await request
            .put(serviceCallbackUrl)
            .set('Accept', 'application/json')
            .set('ServiceAuthorization', resp.text)
            .send(mySbMsg);
        context.log.info('I am here-----13 ' + ' Callback Service Response : ' + res.status);

        if (res.status >= 200 && res.status < 300) {
            context.log.info('I am here-----14 ' + serviceCallbackUrl);
            context.log.info('Message Sent Successfully to ' + serviceCallbackUrl);
        } else {
            context.log.info('I am here-----15 ' + serviceCallbackUrl);
            context.log.error('Error response received from callback provider: ' + res.status);
            throw new Error("Response was not 2xx but " + res.status);
        }
        */
       req.post({
        uri: s2sUrl + '/lease',
        body: serviceAuthRequest,
        json: true
    })
        .then(token => {
            context.log.info(' S2S Token : ' + token);
            req.put({
                uri: serviceCallbackUrl,
                headers: {
                            ServiceAuthorization: token,
                            'Content-Type': 'application/json'
                          },
                json: true,
                body: mySbMsg
            }).then(response => {
                context.log.info('I am here-----13 ' + serviceCallbackUrl + ' Response : ' + JSON.stringify(response))   
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