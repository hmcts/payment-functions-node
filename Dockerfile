FROM mcr.microsoft.com/azure-functions/node:3.0-node12-slim as base
ENV ASPNETCORE_URLS=http://*:5000

ENV USERNAME=appuser
ENV GROUP=grp

ENV AzureWebJobsScriptRoot=/home/site/wwwroot \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true

RUN groupadd -r ${GROUP} &&\
    useradd -r -g ${GROUP} -d / -s /sbin/nologin -c "Docker image user" ${USERNAME}  
    
FROM hmctspublic.azurecr.io/base/node:12-alpine as build

COPY --chown=hmcts:hmcts . .

RUN yarn install --production && rm -r ~/.cache/yarn
    
FROM base as runtime

COPY --chown=${USERNAME}:${GROUP} --from=build /opt/app/ /home/site/wwwroot
    
USER ${USERNAME}