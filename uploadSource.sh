#!/bin/bash

webapp=$1
resourceGroup=$2
zipDir=$3
env=$4

cd $zipDir
#echo "Installing node modules and extensions"
#npm install
#func extensions install  # Jenkins need to install azure-functions-core-tools

echo "Zipping function contents"
zip -r content-$webapp.zip ./

echo "Uploading functions source"
env AZURE_CONFIG_DIR=/opt/jenkins/.azure-$env bash -e az functionapp deployment source config-zip -n $webapp -g $resourceGroup --src content-$webapp.zip

