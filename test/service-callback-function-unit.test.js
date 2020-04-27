'use strict';

let chai = require('chai');
let sinon = require('sinon');
let proxyquire = require('proxyquire');
let expect = chai.expect;
let sinonChai = require('sinon-chai');
let URL = require('url');

chai.use(sinonChai);

let request, context, bindingData, serviceCallbackFunction;

beforeEach(function () {

    request = {};

    request.put = sinon.stub().returns(request);
    request.patch = sinon.stub().returns(request);
    request.set = sinon.stub().returns(request);
    request.send = sinon.stub().returns(request);

    serviceCallbackFunction = proxyquire('../ServiceCallbackFunction',
        {
            'superagent': request,
        }
    );

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
                serviceCallbackUrl: 'http://google.com',
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
            error: sinon.stub(),
            info: sinon.stub(),
            debug: sinon.stub()
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

describe("when message is received", function () {

    it('the desired url is called back', function () {

        serviceCallbackFunction(context, payment);

        expect(request.put).to.have.been.calledOnce;
        expect(request.put).to.have.been.calledWith(bindingData.userProperties.serviceCallbackUrl);

    });

    it('if there is no callback url and error is logged and no url is called back', function () {

        context.bindingData.userProperties = {};

        serviceCallbackFunction(context, payment);

        expect(request.patch).to.not.have.been.called;
        expect(context.log.error).to.have.been.called;

    });

    it('if there is no body context.log.error is called', function () {

        serviceCallbackFunction(context, null);

        expect(context.log.error).to.have.been.called;
        expect(request.patch).to.not.have.been.called;

    });

});