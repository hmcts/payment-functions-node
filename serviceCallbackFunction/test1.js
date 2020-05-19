const { ServiceBusClient } = require("@azure/service-bus"); 

// Define connection string and related Service Bus entity names here
const connectionString = "Endpoint=sb://sb-40e21757-41f4-4a03-95c3-8090d0604f86.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=8HC0kJGWx32V9xzFPKBQ7HaaQYnsRkQVh+aI2a+JK4U=";
const topicName = "servicecallbacktopic"; 

async function main(){
  const sbClient = ServiceBusClient.createFromConnectionString(connectionString); 
  const topicClient = sbClient.createTopicClient(topicName);
  const sender = topicClient.createSender();

    try {
        for (let i = 0; i < 1; i++) {
          const message= {
            body: `Hello world! ${i}`,
            label: `test`,
            userProperties: {
                serviceCallbackUrl: `www.google.com`
            }
            
          };
          console.log(`Sending message: ${message.body}`);
          await sender.send(message);
        }

        await topicClient.close();
      } finally {
        await sbClient.close();
      }
}

main().catch((err) => {
  console.log("Error occurred: ", err);
});