#!/bin/bash

webapp=$1
zipDir=$2
deploymentUri=$3

cd $zipDir
echo "Zipping function contents"
zip -r content-$webapp.zip ./

echo "Deploying functions source with a zip file"
curl -kv POST --data-binary @content-$webapp.zip $deploymentUri/api/zipdeploy
#env AZURE_CONFIG_DIR=/opt/jenkins/.azure-$env bash -e az functionapp deployment source config-zip -n $webapp -g $webapp --src content-$webapp.zip
