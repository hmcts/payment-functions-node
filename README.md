**Payments Functions for Azure**

**Service Callback**

Receives a message from the service bus which is then sent to a callback endpoint by HTTP PATCH

**How to test and develop locally**

Go to functions directory `$ cd functions`

Installation

`npm install -g azure-functions-core-tools`

`npm install`

`npm run setup`

Configuration

**1. Create a `local.settings.json` file inside the functions folder with the following content:**

`
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsStorage": "DefaultEndpointsProtocol=XXX",
    "ServiceCallbackBusConnection" : "Endpoint=XXX"
  }
}
`

_Copy the storage value from the functionapp server you want to emulate.

Copy the bus connection from either the functionapp or the servicebus._

Example, in order to connect local Azure Function to the Service Bus Topic in Demo,

{ "IsEncrypted": false, "Values": { 
    "FUNCTIONS_WORKER_RUNTIME": "node", 
    "FUNCTIONS_EXTENSION_VERSION": "~2",
    "AzureWebJobsStorage": "DefaultEndpointsProtocol=https;AccountName=ccpayfunctionsnodedemo;AccountKey=Sh7HPs/N5mZbOy88QG3CbRfaUBWJvb/O5ovIDQ93vLmwnfQ6tm2bVlCFIuyQEj0D3WTBQfB6hmKuS1v9QNAR/g==;EndpointSuffix=core.windows.net", 
    "ServiceCallbackBusConnection" : "Endpoint=sb://ccpay-servicebus-demo.servicebus.windows.net/;SharedAccessKeyName=SendAndListenSharedAccessKey;SharedAccessKey=sulCw3ukm4C5FRr0K+Gfra9JT6mk3a3WrCvshHbk8gA=" } 
}

**2. Update host.json file with new version of Extension Bundle, add following snippet to existing JSON**

"extensionBundle": {
    "id": "Microsoft.Azure.Functions.ExtensionBundle",
    "version": "[1.*, 2.0.0)"
  }
  
**3. Update function.json file in serviceCallbackRetry**

{
  "bindings": [
    {
      "schedule": "0 */30 * * * *",
      "name": "failedMessagesTimerTrigger",
      "type": "timerTrigger",
      "direction": "in"
    }
  ],
  "disabled": false
}


Start

`npm run local` 

Run tests

`npm test`

Add New Functions 

_Create a folder with the name of the new function and add `function.json` and `index.js` following the existing
function as template_ 

**Send Message to Azure Service Bus so Azure function node could consume**

Run the below Java Client to publish message to Service Bus Topic

public class SendMessageApplication {

    public static void main(String[] args) throws Exception{

        /*
        Update below connection sting according to the Remote Service Bus - Topic, currently its connecting to Topic in Demo
         */

        TopicClientProxy client = new TopicClientProxy("Endpoint=sb://ccpay-servicebus-demo.servicebus.windows.net/;SharedAccessKeyName=SendAndListenSharedAccessKey;SharedAccessKey=sulCw3ukm4C5FRr0K+Gfra9JT6mk3a3WrCvshHbk8gA=", "serviceCallbackTopic");

        Payment payment = getPaymentsData().get(0);

        PaymentFeeLink paymentFeeLink = PaymentFeeLink.paymentFeeLinkWith().paymentReference("00000005")
            .payments(Arrays.asList(payment))
            .fees(PaymentsDataUtil.getFeesData())
            .build();

        PaymentDto dto = new PaymentDtoMapper()
            .toRetrievePaymentStatusesDto(paymentFeeLink);

        Message msg = new Message(new ObjectMapper().writeValueAsString(dto));

        msg.setContentType("application/json");
        msg.setLabel("Service Callback Message");
        msg.setProperties(Collections.singletonMap("serviceCallbackUrl", payment.getServiceCallbackUrl()));

        client.send(msg);

        client.close();

    }

    public static List<Payment> getPaymentsData() {
        List<Payment> payments = new ArrayList<>();
        payments.add(paymentWith().amount(BigDecimal.valueOf(30000).movePointRight(2)).reference("reference3").description("desc3").returnUrl("https://www.moneyclaims.service.gov.uk")
            .paymentStatus(PaymentStatus.CREATED)
            .serviceCallbackUrl("http://google.com")
            .paymentChannel(PaymentChannel.paymentChannelWith().name("online").build())
            .statusHistories(Arrays.asList(StatusHistory.statusHistoryWith()
                .externalStatus("created")
                .status("Initiated")
                .build()))
            .ccdCaseNumber("ccdCaseNo3").caseReference("caseRef3").serviceType("probate").currency("GBP").build());
        return payments;
    }
}
