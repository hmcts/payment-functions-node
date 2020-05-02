FROM mcr.microsoft.com/azure-functions/node:3.0-node12-slim
ENV ASPNETCORE_URLS=http://*:5000

ENV USERNAME=appuser
ENV GROUP=grp

ENV AzureWebJobsScriptRoot=/home/site/wwwroot \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true

RUN groupadd -r ${GROUP} &&\
    useradd -r -g ${GROUP} -d / -s /sbin/nologin -c "Docker image user" ${USERNAME}

COPY --chown=${USERNAME}:${GROUP} . /home/site/wwwroot

RUN cd /home/site/wwwroot && \
    npm install --production
    
USER ${USERNAME}