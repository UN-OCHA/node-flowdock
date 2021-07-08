(function() {
  var Session, Stream, events, extend, fetch, url,
    slice = [].slice,
    extend1 = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  url = require('url');

  events = require('events');

  fetch = require('node-fetch');

  Stream = require('./stream');

  extend = function() {
    var i, key, len, object, objects, result, value;
    objects = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    result = {};
    for (i = 0, len = objects.length; i < len; i++) {
      object = objects[i];
      for (key in object) {
        value = object[key];
        result[key] = value;
      }
    }
    return result;
  };

  Session = (function(superClass) {
    extend1(Session, superClass);

    function Session(email1, password, url1) {
      this.email = email1;
      this.password = password;
      this.url = url1 != null ? url1 : process.env.FLOWDOCK_API_URL || 'https://api.flowdock.com';
      this.auth = 'Basic ' + new Buffer.from(this.email + ':' + this.password).toString('base64');
    }

    Session.prototype.flows = function(callback) {
      return this.get('/flows', {
        users: 1
      }, callback);
    };

    Session.prototype.stream = function(flows, options) {
      if (options == null) {
        options = {};
      }
      if (!Array.isArray(flows)) {
        flows = [flows];
      }
      return Stream.connect(this.auth, flows, options);
    };

    Session.prototype.send = function(path, message, callback) {
      return this.post(path, message, callback);
    };

    Session.prototype.message = function(flowId, message, tags, callback) {
      var data;
      data = {
        flow: flowId,
        event: 'message',
        content: message,
        tags: tags || []
      };
      return this.send("/messages", data, callback);
    };

    Session.prototype.threadMessage = function(flowId, threadId, message, tags, callback) {
      var data;
      data = {
        flow: flowId,
        thread_id: threadId,
        event: 'message',
        content: message,
        tags: tags || []
      };
      return this.send("/messages", data, callback);
    };

    Session.prototype.comment = function(flowId, parentId, comment, tags, callback) {
      var data;
      data = {
        flow: flowId,
        message: parentId,
        event: 'comment',
        content: comment,
        tags: tags || []
      };
      return this.send("/comments", data, callback);
    };

    Session.prototype.privateMessage = function(userId, message, tags, callback) {
      var data;
      data = {
        event: 'message',
        content: message,
        tags: tags || []
      };
      return this.send("/private/" + userId + "/messages", data, callback);
    };

    Session.prototype.status = function(flowId, status, callback) {
      var data;
      data = {
        event: 'status',
        content: status,
        flow: flowId
      };
      return this.send("/messages", data, callback);
    };

    Session.prototype.invite = function(flowId, organizationId, email, message, callback) {
      var data;
      data = {
        email: email,
        message: message
      };
      return this.send("/flows/" + organizationId + "/" + flowId + "/invitations", data, callback);
    };

    Session.prototype.editMessage = function(flowId, organizationId, messageId, data, callback) {
      return this.put("/flows/" + organizationId + "/" + flowId + "/messages/" + messageId, data, callback);
    };

    Session.prototype.post = function(path, data, cb) {
      return this._request('post', path, data, cb);
    };

    Session.prototype.get = function(path, data, cb) {
      return this._request('get', path, data, cb);
    };

    Session.prototype.put = function(path, data, cb) {
      return this._request('put', path, data, cb);
    };

    Session.prototype["delete"] = function(path, cb) {
      return this._request('delete', path, {}, cb);
    };

    Session.prototype._request = async function(method, path, data, cb) {
      var options, uri;
      uri = this.baseURL();
      uri.pathname = path;
      uri = url.format(uri);
      // @todo This works for other methods. How are params passed?
      if (method.toLowerCase() === 'get') {
        params = new URLSearchParams(data);
        uri += '?' + params
      }
      options = {
        method: method,
        headers: {
          'Authorization': this.auth,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      };
      try {
        const response = await fetch(uri, options);
        const data = await response.json();
        return typeof cb === "function" ? cb(null, data, response) : void 0;
      }
      catch (error) {
        return typeof cb === "function" ? cb(error, null, null) : void 0;
      }
    };

    Session.prototype.baseURL = function() {
      return url.parse(this.url);
    };

    return Session;

  })(events.EventEmitter);

  exports.Session = Session;

}).call(this);
