var Mockdock, Stream, assert;

assert = require('assert');

Stream = require(__dirname + '/../lib/stream');

Mockdock = require('./helper').Mockdock;

describe('Stream', function() {
  var mockdock;
  mockdock = Mockdock.start();
  beforeEach(function() {
    return process.env.FLOWDOCK_STREAM_URL = "http://localhost:" + mockdock.port;
  });
  afterEach(function() {
    return mockdock.removeAllListeners();
  });
  describe('url', function() {
    it('has flows as query param', function(done) {
      var stream;
      mockdock.once('request', function(req, res) {
        stream.end();
        assert.ok(req.url.indexOf('example%3Amain') > 0);
        assert.ok(req.url.indexOf('example%3Atest') > 0);
        return done();
      });
      return stream = Stream.connect('foobar', ['example:main', 'example:test']);
    });
    it('has authentication header', function(done) {
      var stream;
      mockdock.once('request', function(req, res) {
        stream.end();
        assert.equal(req.headers.authorization, 'foobar');
        return done();
      });
      return stream = Stream.connect('foobar', ['example:main', 'example:test']);
    });
    return it('can set extra parameters', function(done) {
      var stream;
      mockdock.once('request', function(req, res) {
        stream.end();
        assert.ok(req.url.indexOf('active=true') > 0);
        return done();
      });
      return stream = Stream.connect('foobar', ['example:main'], {
        active: true
      });
    });
  });
  describe('response', function() {
    it('emits error if connection cannot be established', function(done) {
      var stream;
      process.env.FLOWDOCK_STREAM_URL = "http://localhost:" + (mockdock.port + 1);
      stream = Stream.connect('foobar', ['example:main']);
      return stream.on('clientError', function(status, message) {
        stream.end();
        assert.equal(status, 0);
        return done();
      });
    });
    it('emits error event if response is not successful', function(done) {
      var stream;
      mockdock.once('request', function(req, res) {
        res.writeHead(401);
        return res.end();
      });
      stream = Stream.connect('foobar', ['example:main']);
      return stream.once('clientError', function(status, message) {
        stream.end();
        assert.equal(status, 401);
        return done();
      });
    });
    it('emits end when response ends', function(done) {
      var stream;
      mockdock.once('request', function(req, res) {
        res.writeHead(200);
        return res.write('\n');
      });
      stream = Stream.connect('foobar', ['example:main']);
      stream.once('connected', function() {
        return stream.end();
      });
      return stream.once('end', function() {
        return done();
      });
    });
    return it('emits messages', function(done) {
      var stream;
      mockdock.once('request', function(req, res) {
        res.writeHead(200);
        res.write(JSON.stringify({
          id: 1,
          event: 'message',
          content: 'test',
          flow: 'example:main'
        }));
        res.write('\r\n');
        return res.end();
      });
      stream = Stream.connect('foobar', ['example:main']);
      return stream.once('message', function(message) {
        assert.equal(message.event, 'message');
        stream.end();
        return done();
      });
    });
  });
  return describe('reconnection', function() {
    it('reconnects immediately after connection ends', function(done) {
      var stream;
      mockdock.once('request', function(req, res) {
        res.writeHead(200);
        res.write('\n');
        return res.end();
      });
      stream = Stream.connect('foobar', ['example:main']);
      return stream.once('reconnecting', function(timeout) {
        stream.end();
        assert.equal(timeout, 0);
        return done();
      });
    });
    it('reconnects after small delay if network error', function(done) {
      var stream;
      process.env.FLOWDOCK_STREAM_URL = "http://localhost:" + (mockdock.port + 1);
      stream = Stream.connect('foobar', ['example:main']);
      return stream.once('reconnecting', function(timeout) {
        stream.end();
        assert.equal(timeout, 200);
        return done();
      });
    });
    it('backs off linearly if there are network errors', function(done) {
      var stream;
      process.env.FLOWDOCK_STREAM_URL = "http://localhost:" + (mockdock.port + 1);
      stream = Stream.connect('foobar', ['example:main']);
      stream.networkErrors = 2;
      return stream.once('reconnecting', function(timeout) {
        stream.end();
        assert.equal(timeout, 600);
        return done();
      });
    });
    it('reconnects after delay if server responds with error', function(done) {
      var stream;
      mockdock.once('request', function(req, res) {
        res.writeHead(503);
        return res.end();
      });
      stream = Stream.connect('foobar', ['example:main']);
      return stream.once('reconnecting', function(timeout) {
        stream.end();
        assert.equal(timeout, 2000);
        return done();
      });
    });
    return it('increases delay exponentially if there are existing failure responses', function(done) {
      var stream;
      mockdock.on('request', function(req, res) {
        res.writeHead(503);
        return res.end();
      });
      stream = Stream.connect('foobar', ['example:main']);
      stream.responseErrors = 2;
      return stream.once('reconnecting', function(timeout) {
        stream.end();
        assert.equal(timeout, 8000);
        return done();
      });
    });
  });
});
