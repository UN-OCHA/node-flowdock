var Mockdock, assert, flowdock;

assert = require('assert');

flowdock = require(__dirname + '/../lib/flowdock');

Mockdock = require('./helper').Mockdock;

describe('Flowdock', function() {
  var mockdock, session;
  mockdock = Mockdock.start();
  session = null;
  beforeEach(function() {
    process.env.FLOWDOCK_STREAM_URL = "http://localhost:" + mockdock.port;
    process.env.FLOWDOCK_API_URL = "http://localhost:" + mockdock.port;
    session = new flowdock.Session('test', 'password');
    return session.on('error', function() {});
  });
  afterEach(function() {
    return mockdock.removeAllListeners();
  });
  describe('stream', function() {
    it('can handle array parameter', function(done) {
      var stream;
      mockdock.on('request', function(req, res) {
        assert.equal(req.url, '/?filter=example%3Amain%2Cexample%3Atest');
        res.setHeader('Content-Type', 'application/json');
        return res.end('{}');
      });
      stream = session.stream(['example:main', 'example:test']);
      stream.on('connected', function() {
        stream.removeAllListeners();
        return done();
      });
      return assert.deepEqual(stream.flows, ['example:main', 'example:test']);
    });
    return it('can handle single flow', function(done) {
      var stream;
      mockdock.on('request', function(req, res) {
        assert.equal(req.url, '/?filter=example%3Amain');
        res.setHeader('Content-Type', 'application/json');
        return res.end('{}');
      });
      stream = session.stream('example:main');
      stream.on('connected', function() {
        stream.removeAllListeners();
        return done();
      });
      return assert.deepEqual(stream.flows, ['example:main']);
    });
  });
  describe('invitations', function() {
    return it('can send an invitation', function() {
      mockdock.on('request', function(req, res) {
        assert.equal(req.url, '/flows/org1/flow1/invitations');
        res.setHeader('Content-Type', 'application/json');
        return res.end('{}');
      });
      return session.invite('flow1', 'org1', 'test@localhost', 'test message', function(err, data, result) {
        assert.equal(err, null);
      });
    });
  });
  describe('_request', function() {
    return it('makes a sensible request', function() {
      mockdock.on('request', function(req, res) {
        assert.equal(req.url, '/flows/find?id=acdcabbacd1234567890');
        res.setHeader('Content-Type', 'application/json');
        return res.end('{"flow":"foo"}');
      });
      return session._request('get', '/flows/find', {
        id: 'acdcabbacd1234567890'
      }, function(err, data, res) {
        assert.equal(err, null);
        assert.deepEqual(data, {
          flow: "foo"
        });
      });
    });
  });
  return describe('Session', function() {
    return it('should optionally take a URL', function() {
      var alt_mockdock, alt_session;
      alt_mockdock = Mockdock.start();
      alt_session = new flowdock.Session('test', 'password', "http://localhost:" + alt_mockdock.port);
      alt_mockdock.on('request', function(req, res) {
        assert.equal(req.url, '/flows/find?id=acdcabbacd1234567890');
        res.setHeader('Content-Type', 'application/json');
        return res.end('{"flow":"foo"}');
      });
      return alt_session._request('get', '/flows/find', {
        id: 'acdcabbacd1234567890'
      }, function(err, data, res) {
        assert.equal(err, null);
        assert.deepEqual(data, {
          flow: "foo"
        });
        alt_mockdock.removeAllListeners();
      });
    });
  });
});
