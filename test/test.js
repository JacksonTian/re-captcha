var Recaptcha = require('../');
var http = require('http');
var events = require('events');
var assert = require('assert');
var querystring = require('querystring');

describe('lib/recaptcha.js', function () {
  it('construction https', function () {
    var recaptcha = new Recaptcha('PUBLIC', 'PRIVATE', true);
    assert.strictEqual(recaptcha.public_key, 'PUBLIC', 'public_key is set');
    assert.strictEqual(recaptcha.private_key, 'PRIVATE', 'private_key is set');
    assert.strictEqual(recaptcha.protocol, 'https://', 'protocol is set');
  });

  it('construction http', function () {
    var recaptcha = new Recaptcha('PUBLIC', 'PRIVATE');
    assert.strictEqual(recaptcha.public_key, 'PUBLIC', 'public_key is set');
    assert.strictEqual(recaptcha.private_key, 'PRIVATE', 'private_key is set');
    assert.strictEqual(recaptcha.protocol, 'http://', 'protocol is not set');
  });

  it('toHTML() with no error', function () {
    var recaptcha = new Recaptcha('PUBLIC', 'PRIVATE');
    var script_src = 'http://www.google.com/recaptcha/api/challenge?k=PUBLIC';
    var noscript_src = 'http://www.google.com/recaptcha/api/noscript?k=PUBLIC';

    var expected = '<script src="' + script_src + '">' +
      '</script><noscript><iframe src="' + noscript_src + '" ' +
      'height="300" width="500" frameborder="0"></iframe><br>' +
      '<textarea name="recaptcha_challenge_field" rows="3" cols="40">' +
      '</textarea><input type="hidden" name="recaptcha_response_field" ' +
      'value="manual_challenge" /></noscript>';

    assert.strictEqual(recaptcha.toHTML(), expected, 'toHTML() returns expected HTML');
  });

  it('toHTML() https with no error', function () {
    var recaptcha = new Recaptcha('PUBLIC', 'PRIVATE', true);
    var script_src = 'https://www.google.com/recaptcha/api/challenge?k=PUBLIC';
    var noscript_src = 'https://www.google.com/recaptcha/api/noscript?k=PUBLIC';

    var expected = '<script src="' + script_src + '">' +
      '</script><noscript><iframe src="' + noscript_src + '" ' +
      'height="300" width="500" frameborder="0"></iframe><br>' +
      '<textarea name="recaptcha_challenge_field" rows="3" cols="40">' +
      '</textarea><input type="hidden" name="recaptcha_response_field" ' +
      'value="manual_challenge" /></noscript>';

    assert.strictEqual(recaptcha.toHTML(), expected, 'toHTML() https returns expected HTML');
  });

  it('toHTML() with error', function () {
    var recaptcha = new Recaptcha('PUBLIC', 'PRIVATE');

    var script_src = 'http://www.google.com/recaptcha/api/challenge?k=PUBLIC&error=ERROR';
    var noscript_src = 'http://www.google.com/recaptcha/api/noscript?k=PUBLIC&error=ERROR';

    var expected = '<script src="' + script_src + '">' +
      '</script><noscript><iframe src="' + noscript_src + '" ' +
      'height="300" width="500" frameborder="0"></iframe><br>' +
      '<textarea name="recaptcha_challenge_field" rows="3" cols="40">' +
      '</textarea><input type="hidden" name="recaptcha_response_field" ' +
      'value="manual_challenge" /></noscript>';

    // Fake an error.
    var err = new Error('ERROR');
    assert.strictEqual(recaptcha.toHTML(err), expected, 'toHTML() returns expected HTML');
  });

  it('toHTML() https with error', function () {
    var recaptcha = new Recaptcha('PUBLIC', 'PRIVATE', true);
    recaptcha.error_code = 'ERROR';  // Fake an error.

    var script_src = 'https://www.google.com/recaptcha/api/challenge?k=PUBLIC&error=ERROR';
    var noscript_src = 'https://www.google.com/recaptcha/api/noscript?k=PUBLIC&error=ERROR';

    var expected = '<script src="' + script_src + '">' +
      '</script><noscript><iframe src="' + noscript_src + '" ' +
      'height="300" width="500" frameborder="0"></iframe><br>' +
      '<textarea name="recaptcha_challenge_field" rows="3" cols="40">' +
      '</textarea><input type="hidden" name="recaptcha_response_field" ' +
      'value="manual_challenge" /></noscript>';

    // Fake an error.
    var err = new Error('ERROR');
    assert.strictEqual(recaptcha.toHTML(err), expected, 'toHTML() https returns expected HTML');
  });

  it('verify() with no data', function (done) {
    var recaptcha = new Recaptcha('PUBLIC', 'PRIVATE');
    var create_client_called = false;

    // We shouldn't need to contact Recaptcha to know this is invalid.
    http.request = function (options) {
      create_client_called = true;
    };

    recaptcha.verify(undefined, function (err) {
      assert.strictEqual(err.message, 'verify-params-incorrect');
      // Ensure that http.request() was never called.
      assert.strictEqual(create_client_called, false);
      done();
    });
  });

  it('verify() with blank response', function (done) {
    var data = {
      remoteip: '127.0.0.1',
      challenge: 'challenge',
      response: ''
    };
    var recaptcha = new Recaptcha('PUBLIC', 'PRIVATE');
    var create_client_called = false;

    // We shouldn't need to contact Recaptcha to know this is invalid.
    http.request = function (options) {
      create_client_called = true;
    };

    recaptcha.verify(data, function (err) {
      assert.strictEqual(err.message, 'incorrect-captcha-sol');
      // Ensure that http.request() was never called.
      assert.strictEqual(create_client_called, false);
      done();
    });
  });

  it('verify() with missing remoteip', function (done) {
    var data = {
      challenge: 'challenge',
      response: 'response'
    };
    var recaptcha = new Recaptcha('PUBLIC', 'PRIVATE');
    var create_client_called = false;

    // We shouldn't need to contact Recaptcha to know this is invalid.
    http.request = function (options) {
      create_client_called = true;
    };

    recaptcha.verify(data, function (err) {
      assert.strictEqual(err.message, 'verify-params-incorrect');
      // Ensure that http.request() was never called.
      assert.strictEqual(create_client_called, false);
      done();
    });
  });

  it('verify() with missing challenge', function (done) {
    var data = {
      remoteip: '127.0.0.1',
      response: 'response'
    };
    var recaptcha = new Recaptcha('PUBLIC', 'PRIVATE');
    var create_client_called = false;

    // We shouldn't need to contact Recaptcha to know this is invalid.
    http.request = function(options, callback) {
      create_client_called = true;
    };

    recaptcha.verify(data, function (err) {
      assert.strictEqual(err.message, 'verify-params-incorrect');
      // Ensure that http.request() was never called.
      assert.strictEqual(create_client_called, false);
      done();
    });
  });

  it('verify() with missing response', function (done) {
    var data = {
      remoteip: '127.0.0.1',
      challenge: 'challenge'
    };
    var recaptcha = new Recaptcha('PUBLIC', 'PRIVATE');
    var create_client_called = false;

    // We shouldn't need to contact Recaptcha to know this is invalid.
    http.request = function(options, callback) {
      create_client_called = true;
    };

    recaptcha.verify(data, function(err) {
      assert.strictEqual(err.message, 'verify-params-incorrect');

      // Ensure that http.request() was never called.
      assert.strictEqual(create_client_called, false);

      done();
    });
  });

  it('verify() with bad data', function (done) {
    var data = {
      remoteip: '127.0.0.1',
      challenge: 'challenge',
      response: 'bad_response'
    };
    var recaptcha = new Recaptcha('PUBLIC', 'PRIVATE');

    var data_with_pk = {
      remoteip: data['remoteip'],
      challenge: data['challenge'],
      response: data['response'],
      privatekey: 'PRIVATE'
    };

    var response_data = 'false\nincorrect-captcha-sol';
    var data_qs = querystring.stringify(data_with_pk);
    var end_called = false;
    var write_called = false;

    // Stub out communication with Recaptcha.
    var fake_client = {};
    var fake_request = new events.EventEmitter();
    var fake_response = new events.EventEmitter();

    http.request = function (options, callback) {
      assert.deepEqual(options, {
        host: 'www.google.com',
        path: '/recaptcha/api/verify',
        port: 80,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': data_qs.length
        }
      }, 'options for request() call are correct');

      callback(fake_response);
      return fake_request;
    };
    fake_request.write = function (data) {
      assert.strictEqual(data, data_qs, 'data correct in request.write() call');
      write_called = true;
    };
    fake_request.end = function() { end_called = true; };

    // Check callback values for verify.
    recaptcha.verify(data, function(err) {
      assert.strictEqual(err.message, 'incorrect-captcha-sol', 'error_code is correct');

      // Make sure that request.write() and request.end() were called.
      assert.strictEqual(write_called, true, 'request.write() was called');
      assert.strictEqual(end_called, true, 'request.end() was called');

      done();
    });

    // Emit the signals to mimic getting data from Recaptcha.
    fake_request.emit('response', fake_response);
    fake_response.emit('data', response_data);
    fake_response.emit('end');
  });

  it('verify() with good data', function (done) {
    var data = {
      remoteip:  '127.0.0.1',
      challenge: 'challenge',
      response:  'good_response'
    };
    var recaptcha = new Recaptcha('PUBLIC', 'PRIVATE');

    var data_with_pk = {
      remoteip: data['remoteip'],
      challenge: data['challenge'],
      response: data['response'],
      privatekey: 'PRIVATE'
    };

    var response_data = 'true';
    var data_qs = querystring.stringify(data_with_pk);
    var end_called = false;
    var write_called = false;

    // Stub out communication with Recaptcha.
    var fake_client = {};
    var fake_request = new events.EventEmitter();
    var fake_response = new events.EventEmitter();

    http.request = function (options, callback) {
      assert.deepEqual(options, {
        host: 'www.google.com',
        path: '/recaptcha/api/verify',
        port: 80,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': data_qs.length
        }
      }, 'options for request() call are correct');

      callback(fake_response);
      return fake_request;
    };

    fake_request.write = function (data) {
      assert.strictEqual(data, data_qs, 'data correct in request.write() call');
      write_called = true;
    };
    fake_request.end = function() { end_called = true; };

    // Check callback values for verify.
    recaptcha.verify(data, function (err) {
      assert.strictEqual(err, null, 'err is null');
      // Make sure that request.write() and request.end() were called.
      assert.strictEqual(write_called, true, 'request.write() was called');
      assert.strictEqual(end_called, true, 'request.end() was called');
      done();
    });

    // Emit the signals to mimic getting data from Recaptcha.
    fake_request.emit('response', fake_response);
    fake_response.emit('data', response_data);
    fake_response.emit('end');
  });
});
