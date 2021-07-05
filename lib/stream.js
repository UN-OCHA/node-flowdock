(function() {
  var JSONStream, Stream, backoff, baseURL, events, fetch, abortController, url,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  url = require('url');

  events = require('events');

  fetch = require('node-fetch');

  AbortController = require('abort-controller');

  JSONStream = require('./json_stream');

  baseURL = function() {
    return url.parse(process.env.FLOWDOCK_STREAM_URL || 'https://stream.flowdock.com/flows');
  };

  backoff = function(backoff, errors, operator) {
    if (operator == null) {
      operator = '*';
    }
    return Math.min(backoff.max, (operator === '+' ? errors : Math.pow(2, errors - 1)) * backoff.delay);
  };

  Stream = (function(superClass) {
    extend(Stream, superClass);

    function Stream(auth1, flows1, params1) {
      this.controller = new AbortController();
      this.auth = auth1;
      this.flows = flows1;
      this.params = params1 != null ? params1 : {};
      this.networkErrors = 0;
      this.responseErrors = 0;
      this.on('end', function() {
        return this.controller.abort();
      });
      this.on('reconnecting', (function(_this) {
        return function(timeout) {
          return setTimeout(function() {
            return _this.connect();
          }, timeout);
        };
      })(this));
    }

    Stream.prototype.connect = function() {
      var _this = this;
      if (this.disconnecting) {
        return;
      }

      this.fetch = fetch(this.flowUrl(), this.options())
        .catch(err => {
          this.emit('clientError', 0);
          this.networkErrors += 1;
          return this.emit('reconnecting', backoff(Stream.backoff.network, this.networkErrors, '+'));
        })
        .then(res => {
          if (!res.ok) {
            _this.responseErrors += 1;
            _this.emit('clientError', res.status);
            return this.emit('reconnecting', backoff(Stream.backoff.error, this.responseErrors, '*'));
          }
          this.networkErrors = 0;
          const parser = new JSONStream();
          parser.on('data', function(message) {
            return _this.emit('message', message);
          });
          this.on('abort', function() {
            parser.removeAllListeners();
            this.emit('disconnected');
            return this.emit('end');
          });
          parser.on('end', function() {
            parser.removeAllListeners();
            _this.emit('disconnected');
            _this.emit('clientError', 0, 'Disconnected');
            return _this.emit('reconnecting', 0);
          });
          res.body.pipe(parser);
          return this.emit('connected');
        });
      return this.fetch;
    };

    Stream.prototype.flowUrl = function() {
      let params, key, ref, value;
      params = new URLSearchParams({ filter: this.flows.join(',') });
      ref = this.params;
      for (key in ref) {
        value = ref[key];
        params.append(key, value);
      }
      return url.format(baseURL()) + "?" + params;
    };

    Stream.prototype.options = function() {
      var options = {
        signal: this.controller.signal,
        method: 'GET',
        headers: {
          'Authorization': this.auth,
          'Accept': 'application/json'
        }
      };
      return options;
    };

    Stream.prototype.end = function() {
      this.disconnecting = true;
      if (this.fetch) {
        this.controller.abort();
        this.emit('end');
        this.removeAllListeners();
        return this.fetch = void 0;
      }
    };

    Stream.prototype.close = function() {
      console.warn('DEPRECATED, use Stream#end() instead');
      return this.end();
    };

    return Stream;

  })(events.EventEmitter);

  Stream.connect = function(auth, flows, params) {
    var stream;
    stream = new Stream(auth, flows, params);
    stream.connect();
    return stream;
  };

  Stream.backoff = {
    network: {
      delay: 200,
      max: 10000
    },
    error: {
      delay: 2000,
      max: 120000
    }
  };

  module.exports = Stream;

}).call(this);
