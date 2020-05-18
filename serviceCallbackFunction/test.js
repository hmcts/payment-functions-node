const { ServiceBusClient } = require("@azure/service-bus"); 

// Define connection string and related Service Bus entity names here
const connectionString = "Endpoint=sb://test-fp.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=pQjwhM2tr42puH4zNwGBImegvQ8Tqbwwg0N5RBQKrqk=";
const topicName = "servicecallbacktopic"; 

async function main(){
  const sbClient = ServiceBusClient.createFromConnectionString(connectionString); 
  const topicClient = sbClient.createTopicClient(topicName);
  const sender = topicClient.createSender();

    try {
        for (let i = 0; i < 30; i++) {
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