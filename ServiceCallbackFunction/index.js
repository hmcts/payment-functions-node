const request = require('superagent');
const URL = require("url");

module.exports = async function (context, mySbMsg) {

    context.log.error('Message Content =', mySbMsg);

    if( ! context.bindingData) {
        context.log.error('No binding data');
        return;
    }

    let serviceCallbackUrl = context.bindingData.serviceCallbackUrl;

    if( !serviceCallbackUrl) {
        serviceCallbackUrl = context.bindingData.userProperties.serviceCallbackUrl;

        if(!serviceCallbackUrl) {
            context.log.error('No serviceCallbackUrl');
            return;
        }

    }

    serviceCallbackUrl = URL.parse(serviceCallbackUrl);



    context.log.error('Binding data =', context.bindingData);
    context.log.error('ServiceCallbackUrl =', context.bindingData.userProperties.serviceCallbackUrl);

    request
        .post(serviceCallbackUrl)
        .send(JSON.stringify(mySbMsg))
        .end(
            function (err, response) {

                if (err) {
                    context.log.error("Error " + err.status + " sending message " + mySbMsg + " to " + serviceCallbackUrl);
                } else {
                    context.log.error('Message Sent Succesfully');
                }

            }
        )
};