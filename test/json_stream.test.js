var JSONStream, assert;

assert = require('assert');

JSONStream = require(__dirname + '/../lib/json_stream');

describe('JSONStream', function() {
  var parser;
  parser = null;
  beforeEach(function() {
    return parser = new JSONStream();
  });
  it('does not emit on newline', function() {
    parser.on('data', function(message) {
      return assert.ok(false, 'unexpected message was emitted');
    });
    return parser.write(Buffer.from('\n'));
  });
  it('does not emit partial message', function() {
    parser.on('data', function(message) {
      return assert.ok(false, parser.write(new Buffer.from("{")));
    });
    return parser.write(Buffer.from('{'));
  });
  it('emits when chunk contains JSON', function() {
    var messages;
    messages = 0;
    parser.on('data', function(message) {
      assert.deepEqual(message, {});
      return messages += 1;
    });
    parser.write('{}\r\n');
    return assert.equal(messages, 1, 'message was not emitted');
  });
  it('emits multiple messages from one chunk', function() {
    var messages;
    messages = 0;
    parser.on('data', function(message) {
      return messages += 1;
    });
    parser.write('{}\r\n{}\r\n');
    return assert.equal(messages, 2);
  });
  it('should join chunks together', function() {
    var messages;
    messages = 0;
    parser.on('data', function(message) {
      assert.deepEqual(message, {});
      return messages += 1;
    });
    parser.write('\n{');
    parser.write('}\r\n');
    return assert.equal(messages, 1, 'message was not emitted');
  });
  return it('handles partial multibyte characters', function() {
    var messages;
    messages = 0;
    parser.on('data', function(message) {
      assert.deepEqual(message, ['ä']);
      return messages += 1;
    });
    parser.write(Buffer.from([0x5b, 0x22, 0xc3]));
    parser.write(Buffer.from([0xa4, 0x22, 0x5d, 0x0d, 0x0a]));
    return assert.equal(messages, 1, 'message was not emitted');
  });
});
