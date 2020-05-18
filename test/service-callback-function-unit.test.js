'use strict';

const { ServiceBusClient } = require("@azure/service-bus");
let serviceCallbackFunction = require('../serviceCallbackFunction/serviceCallbackFunction');

const { Logger } = require('@hmcts/nodejs-logging');
let request = require('superagent');

const sandbox = require('sinon').createSandbox();
let chai = require('chai');
let expect = chai.expect;
let sinonChai = require('sinon-chai');

chai.use(sinonChai);

let messages, loggerStub;
beforeEach(function () {
    request.put = sandbox.stub().returns(request);

    loggerStub = {
        error: sandbox.stub(),
        info: sandbox.stub()
    }

    const sbClientStub = {
        createSubscriptionClient : sandbox.stub().returnsThis(),
        createReceiver: sandbox.stub().returnsThis(),
        receiveMessages: sandbox.stub().resolves(messages),
        createTopicClient: sandbox.stub().returnsThis(),
        scheduleMessage: sandbox.stub().resolves(),
        createSender: sandbox.stub().returnsThis(),
        close: sandbox.stub().returnsThis()
    };

    sandbox.stub(ServiceBusClient, 'createFromConnectionString').callsFake(() => sbClientStub);

    Logger.getLogger = sandbox.stub().returns(loggerStub);
});

describe("When messages are received", function () {
    before(function() {
        messages = [{
            body: {
                "amount": 3000000,
            },
            userProperties: {
                retries: 0,
                serviceCallbackUrl: 'www.example.com'
            },
            complete: sandbox.stub(),
            clone: sandbox.stub()
        }];
        request.send  = sandbox.stub().resolves({ "status": 200});

    });

    it('the desired url is called back', async function () {
        await serviceCallbackFunction();
        expect(request.put).to.have.been.calledOnce;
        expect(request.put).to.have.been.calledWith(messages[0].userProperties.serviceCallbackUrl);
    });
});


describe("When received message has no callback url", function () {
    before(function() {
        messages = [{
            body: {
                "amount": 3000000,
            },
            userProperties: {
                retries: 0
            },
            complete: sandbox.stub(),
            clone: sandbox.stub()
        }];
    });

    it('if there is no callback url and error is logged and no url is called back', async function () {
        await serviceCallbackFunction();
        expect(loggerStub.error).to.have.been.called;
    });
});

describe("When no message recieved", function () {
    before(function() {
        messages = [];
    });

    it('if there is no message, an info is logged', async function () {
        await serviceCallbackFunction();
        expect(loggerStub.info).to.have.been.calledWith('no messages received in this run');
    });
});

describe("When no body recieved", function () {
    before(function() {
        messages = [{
        }];
    });

    it('if there is no body, an error is logged', async function () {
        await serviceCallbackFunction();
        expect(loggerStub.error).to.have.been.calledWith('No body received');
    });
});

describe("When no userproperties recieved", function () {
    before(function() {
        messages = [{body: {
            "amount": 3000000,
        }
        }];
    });

    it('if there is no body, an error is logged', async function () {
        await serviceCallbackFunction();
        expect(loggerStub.error).to.have.been.calledWith('No userProperties data');
    });
});

describe("When serviceCallbackUrl returns error", function () {
    before(function() {
        request.send  = sandbox.stub().resolves({ "status": 500});
        messages = [{body: {
            "amount": 3000000,
        },
        userProperties: {
            serviceCallbackUrl: 'www.example.com'
        },
        complete: sandbox.stub(),
        clone: sandbox.stub()
        }];
    });

    it('if there is an error from serviceCallbackUrl, an error is logged', async function () {
        await serviceCallbackFunction();
        expect(request.put).to.have.been.calledOnce;
        expect(request.put).to.have.been.calledWith(messages[0].userProperties.serviceCallbackUrl);
        expect(loggerStub.error).to.have.been.calledWithMatch('Error response received from callback provider: ');
        expect(messages[0].clone).to.have.been.called
    });
});




afterEach(function () {
    sandbox.restore();
});