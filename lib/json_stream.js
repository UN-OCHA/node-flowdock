(function() {
  var JSONStream, bufIndexOf, stream,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  bufIndexOf = require('buffer-indexof');

  stream = require('stream');

  JSONStream = (function(superClass) {
    var LF, LFB;

    extend(JSONStream, superClass);

    LF = "\r\n";

    LFB = new Buffer.from(LF);

    function JSONStream() {
      this.buffer = new Buffer.alloc(0);
      this.writable = true;
    }

    JSONStream.prototype.write = function(chunk, encoding) {
      var index, input, ret;
      input = Buffer.isBuffer(chunk) && chunk || new Buffer.from(chunk, encoding);
      this.buffer = Buffer.concat([this.buffer, input]);
      while ((index = bufIndexOf(this.buffer, LFB)) > -1) {
        ret = this.buffer.slice(0, index);
        this.buffer = new Buffer.from(this.buffer.slice(index + LF.length));
        this.emit('data', JSON.parse(ret.toString('utf8')));
      }
      return true;
    };

    JSONStream.prototype.end = function() {
      this.writable = false;
      return this.emit('end');
    };

    return JSONStream;

  })(stream.Stream);

  module.exports = JSONStream;

}).call(this);
