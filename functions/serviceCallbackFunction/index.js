const http = require('http');

module.exports = async function(context, mySbMsg) {
    context.log.error('Tarun ServiceBus queue trigger function processed message', mySbMsg);
    context.log.error('EnqueuedTimeUtc =', context.bindingData.enqueuedTimeUtc);
    context.log.error('DeliveryCount =', context.bindingData.deliveryCount);
    context.log.error('MessageId =', context.bindingData.messageId);

    http.get('http://api.nasa.gov/planetary/apod?api_key=DEMO_KEY', (resp) => {
        let data = '';

        // A chunk of data has been recieved.
        resp.on('data', (chunk) => {
            data += chunk;
        });

        // The whole response has been received. Print out the result.
        resp.on('end', () => {
            console.log(data);
        });

    }).on("error", (err) => {
        console.log("Error: " + err.message);
    });

};