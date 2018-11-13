'use strict';

let chai = require('chai');
let sinon = require('sinon');
let proxyquire = require('proxyquire');
let expect = chai.expect;
let sinonChai = require("sinon-chai");
chai.use(sinonChai);

const SERVICE_CALLBACK_URL = 'https://divorce.reform.hmcts.net/callback';

let request;

/* Mocking superagent */
beforeEach(function () {

    request = {};
    request.patch = sinon.stub().returns(request);
    request.set = sinon.stub().returns(request);
    request.send = sinon.stub().returns(request);
    request.end = sinon.stub().returns();

});

let serviceCallbackFunction = proxyquire('../../ServiceCallbackFunction/function.json',
    {
        'superagent': request,
    }
);

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


let then = sinon.stub();

describe( "when message is received", function() {

    it(' the desired url is called back', function () {


    });

});