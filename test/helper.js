var Mockdock, events, http,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

events = require('events');

http = require('http');

Mockdock = (function(superClass) {
  extend(Mockdock, superClass);

  Mockdock.prototype.request = function(req, res) {
    return this.emit('request', req, res);
  };

  function Mockdock(port) {
    var server;
    this.port = port;
    this.request = bind(this.request, this);
    server = http.createServer(this.request);
    server.listen(this.port);
  }

  return Mockdock;

})(events.EventEmitter);

Mockdock.ephemeralPort = function() {
  var i, range, results;
  range = (function() {
    results = [];
    for (i = 49152; i <= 65535; i++){ results.push(i); }
    return results;
  }).apply(this);
  return range[Math.floor(Math.random() * range.length)];
};

Mockdock.start = function() {
  return new Mockdock(Mockdock.ephemeralPort());
};

exports.Mockdock = Mockdock;
