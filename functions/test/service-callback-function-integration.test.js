'use strict';

let expect = require('chai').expect;

const express = require('express');

const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

const PORT = 4872;

let serviceCallbackFunction = require('../ServiceCallbackFunction/index.js');

let context, bindingData;

let serverCalled = false;

let receivedBody = {};

app.patch('/', (req, res) => {

    serverCalled = true;
    receivedBody = req.body;
    res.end();
});

let server = app.listen(PORT, (err) => {
    console.error('error', err);
});

beforeEach(function () {

    serverCalled = false;

    receivedBody = {};

    bindingData = {
        invocationId: '14e2fae6-8f52-4b5d-8859-759a49984e1b',
        deliveryCount: 1,
        lockToken: '5060e6a8-9903-4624-acca-ba026890ed9f',
        expiresAtUtc: '2018-12-01T16:09:49.364Z',
        enqueuedTimeUtc: '2018-11-13T12:56:25.295Z',
        messageId: 'b24bbb9d-5ae0-4567-b597-3157aa83ae36',
        contentType: 'application/json',
        sequenceNumber: 102,
        label: 'Service Callback Message',
        userProperties:
            {
                serviceCallbackUrl: 'http://localhost:' + PORT,
                'x-opt-enqueue-sequence-number': 102
            },
        messageReceiver:
            {
                registeredPlugins: [],
                receiveMode: 0,
                prefetchCount: 100,
                lastPeekedSequenceNumber: 0,
                path: 'serviceCallbackTopic/Subscriptions/defaultServiceCallbackSubscription',
                operationTimeout: '00:01:00',
                serviceBusConnection:
                    {
                        endpoint: 'sb://payments-servicebus-aat.servicebus.windows.net',
                        operationTimeout: '00:01:00',
                        retryPolicy: [Object],
                        transportType: 0,
                        tokenProvider: {}
                    },
                isClosedOrClosing: false,
                clientId: 'MessageReceiver1serviceCallbackTopic/Subscriptions/defaultServiceCallbackSubscription',
                retryPolicy:
                    {
                        minimalBackoff: '00:00:00',
                        maximumBackoff: '00:00:30',
                        deltaBackoff: '00:00:03',
                        maxRetryCount: 5,
                        isServerBusy: false,
                        serverBusyExceptionMessage: null
                    }
            },
        sys:
            {
                methodName: 'ServiceCallbackFunction',
                utcNow: '2018-11-13T12:56:28.7841377Z',
                randGuid: '1b461a51-20a7-4f2f-ba97-5bc0408cd4e8'
            }
    };

    context = {

        log: {
            error: console.log,
            debug: function () {}
        },

        bindingData: bindingData

    };

});

let payment = {
    "amount": 3000000,
    "description": "desc3",
    "reference": "reference3",
    "currency": "GBP",
    "ccd_case_number": "ccdCaseNo3",
    "case_reference": "caseRef3",
    "channel": "online",
    "status": "Initiated",
    "service_name": "probate",
    "payment_group_reference": "00000005",
    "fees": [{"code": "X0011", "version": "1"}, {"code": "X0022", "version": "2"}, {
        "code": "X0033",
        "version": "3"
    }, {"code": "X0044", "version": "4"}],
    "_links": {"self": {"href": "http://localhost/card-payments/reference3", "method": "GET"}}
};

describe("when message is received and i am listening on my own server", function () {

    it('the desired url is called back', async function () {

        await serviceCallbackFunction(context, payment);

        expect(serverCalled).to.equals(true);

        console.log(receivedBody);

        expect(receivedBody.reference).to.equals(payment.reference);

    });

    it(' if there is no callback url and error is logged and no url is called back', async function () {

        context.bindingData.userProperties = {};

        serviceCallbackFunction(context, payment);

        expect(serverCalled).to.equals(false);

    });

    after(
        function () {
            server.close();
        }
    );
});