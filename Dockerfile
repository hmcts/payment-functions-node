FROM mcr.microsoft.com/azure-functions/node:3.0-node12-slim

ENV AzureWebJobsScriptRoot=/home/site/wwwroot \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true
ENV RETRY_SCHEDULE="0 */30 * * * *"
ENV AzureWebJobsStorage="DefaultEndpointsProtocol=https;AccountName=$(STORAGE_ACCOUNT_NAME);AccountKey=$(STORAGE_ACCESS_KEY);EndpointSuffix=core.windows.net"
ENV SERVICE_CALLBACK_BUS_CONNECTION=Endpoint=sb://sb-240528a2-75dd-4d41-bafb-a4f98279b1d0.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=cMfCfViv63ymwkSm2/mQ+dKS3u75xrjFcgXPKCrVxBc=
ENV SERVICE_CALLBACK_SUBSCRIPTION=61973077-b262-47b5-a5e1-184ce83217a6
ENV SERVICE_CALLBACK_TOPIC=ccpay-function-nodejs
ENV STORAGE_ACCESS_KEY=7f5Ruaz+5Ug+KPzWD/S9WdDTz5ozFA9eDVULhU6U7lfvI+ykojTIms6u6QPoVhyakEPvJTIaNl6wXOH+AbWR1Q==
ENV STORAGE_ACCOUNT_NAME=zq2y17q9u2
ENV STORAGE_SERVICE_ENDPOINT=https://zq2y17q9u2.blob.core.windows.net/

DefaultEndpointsProtocol=https;AccountName=ccpayfunctionsnodeaat;AccountKey=pyAQAS4cXjAIRTplYwZ7WrMqUu9OybdPPnIKtmJToTNBzndiJ0DHSS7b6Val2UAD/WSMF0qgp09jT0Crk7HJbA==;EndpointSuffix=core.windows.net

COPY . /home/site/wwwroot

RUN cd /home/site/wwwroot && \
    npm install --production