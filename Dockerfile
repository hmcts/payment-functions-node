FROM mcr.microsoft.com/azure-functions/node:3.0-node12-slim

RUN node -v
ENV AzureWebJobsStorage=DefaultEndpointsProtocol=https;AccountName=ccpayfunctionsnodeaat;AccountKey=pyAQAS4cXjAIRTplYwZ7WrMqUu9OybdPPnIKtmJToTNBzndiJ0DHSS7b6Val2UAD/WSMF0qgp09jT0Crk7HJbA==;EndpointSuffix=core.windows.net
ENV ServiceCallbackBusConnection=Endpoint=sb://ccpay-servicebus-aat.servicebus.windows.net/;SharedAccessKeyName=SendAndListenSharedAccessKey;SharedAccessKey=OnMfqfsFhthyeAyQxdBaZME9KNGvswOy7Bm7rX+7kho=
ENV AzureWebJobsScriptRoot=/home/site/wwwroot \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true


COPY . /home/site/wwwroot

RUN cd /home/site/wwwroot && \
    npm install --production