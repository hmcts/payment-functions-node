const storage = require('azure-storage');
const azure = require('azure');


module.exports = async function (context) {

    const errorFunction = function (error) {
        if (error) {
            context.log.error("Error", error);
        }
    };

    const tableSvc = storage.createTableService(process.env['AzureWebJobsStorage']);

    const serviceBusService = azure.createServiceBusService(process.env['ServiceCallbackBusConnection']);

    for (const idx in context.bindings.failedMessagesEntity) {

        const msg = context.bindings.failedMessagesEntity[idx];

        context.log.error("Msg = " + msg);
        context.log.error("RowKey = " + msg.RowKey);
        context.log.error("DeliveryCount = " + msg.DeliveryCount);
        context.log.error("ServiceCallbackUrl = " + msg.ServiceCallbackUrl);

        tableSvc.deleteEntity(
            "FailedMessages",
            {
                PartitionKey: {'_': 'FailedMessages'},
                RowKey: {'_': msg.RowKey}
            },
            errorFunction
        );

        serviceBusService.sendTopicMessage(
            'serviceCallbackTopic',
            {
                body: msg.Message,
                customProperties: {
                    deliveryRetries: msg.DeliveryCount + 1,
                    serviceCallbackUrl: msg.ServiceCallbackUrl
                }
            },
            errorFunction
        );

    }

};