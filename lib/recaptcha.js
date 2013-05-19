/*!
 * re-captcha
 * Copyright(c) 2010 Michael Hampton <mirhampt+github@gmail.com>
 * Copyright(c) 2013 Jackson Tian <shyvo1987@gmail.com>
 * MIT Licensed
 */

var http = require('http');
// change Agent.maxSockets to 1000
var agent = new http.Agent();
agent.maxSockets = 1000;

var querystring = require('querystring');

// Constants
var API_HOST = 'www.google.com';
var SCRIPT_SRC = API_HOST + '/recaptcha/api/challenge';
var NOSCRIPT_SRC = API_HOST + '/recaptcha/api/noscript';

/**
 * Initialize Recaptcha with given `publicKey`, `privateKey`
 *
 * @param {String} publicKey Your Recaptcha public key.
 * @param {String} privateKey Your Recaptcha private key.
 * @param {Boolean} secure Flag for using https connections to load client-facing things. (optional)
 */
var Recaptcha = function (publicKey, privateKey, secure) {
  this.publicKey = publicKey;
  this.privateKey = privateKey;
  this.protocol = secure ? "https://" : "http://";
};

/**
 * Render the Recaptcha fields as HTML. If there was an error during `verify` and 
 * the selected Recaptcha theme supports it, it will be displayed.
 * @param {Object} err The error object, optional
 */
Recaptcha.prototype.toHTML = function (err) {
  var qs = 'k=' + this.publicKey;
  if (err) {
    qs += '&error=' + err.message;
  }

  var script_src = this.protocol + SCRIPT_SRC + '?' + qs;
  var noscript_src = this.protocol + NOSCRIPT_SRC + '?' + qs;

  return '<script src="' + script_src + '"></script>' +
   '<noscript><iframe src="' + noscript_src + '" height="300" width="500" ' +
   'frameborder="0"></iframe><br><textarea name="recaptcha_challenge_field" ' +
   'rows="3" cols="40"></textarea><input type="hidden" ' +
   'name="recaptcha_response_field" value="manual_challenge" /></noscript>';
};

/**
 * Verify the Recaptcha response.
 *
 * Data:
 *
 * The `data` argument should have the following keys and values:
 *
 * - `remoteip`The IP of the client who submitted the form.
 * - `challenge`: The value of `recaptcha_challenge_field` from the Recaptcha form.
 * - `response`: The value of `recaptcha_response_field` from the Recaptcha form.
 *
 * Examples:
 *
 * ```
 * var recaptcha = new Recaptcha('PUBLIC_KEY', 'PRIVATE_KEY');
 * recaptcha.verify(data, function(err) {
 *   if (err) {
 *     // data was invalid, redisplay the form using
 *     // recaptcha.toHTML().
 *   } else {
 *     // data was valid.  Continue onward.
 *   }
 * });
 * ```
 * @param {Object} data The Recaptcha data to be verified. See above for format.
 * @param {Function} callback Callback
 */
Recaptcha.prototype.verify = function (data, callback) {
  var err;
  // See if we can declare this invalid without even contacting Recaptcha.
  if (!data || !('remoteip' in data && 'challenge' in data && 'response' in data)) {
    err = new Error('verify-params-incorrect');
    err.name = 'RecaptchaVerifyParamsIncorrectError';
    return callback(err);
  }
  if (data.response === '') {
    err = new Error('incorrect-captcha-sol');
    err.name = 'RecaptchaIncorrectCaptchaError';
    return callback(err);
  }

  // Add the private_key to the request.
  data.privatekey = this.privateKey;
  var postData = querystring.stringify(data);

  var options = {
    host: API_HOST,
    path: '/recaptcha/api/verify',
    port: 80,
    method: 'POST',
    agent: agent, // 1000 connection pool
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': postData.length
    }
  };

  var req = http.request(options, function (res) {
    var chunks = [];

    res.on('error', function (err) {
      err = new Error('recaptcha-not-reachable');
      err.name = 'RecaptchaNotReachableError';
      callback(err);
    });

    res.on('data', function(chunk) {
      chunks.push(chunk);
    });

    res.on('end', function () {
      var body = Buffer.concat(chunks).toString();
      var parts = body.split('\n');
      var success = parts[0];
      var errorCode = parts[1];

      if (success !== 'true') {
        err = new Error(errorCode);
        err.name = 'RecaptchaError';
        return callback(err);
      }
      callback(null);
    });
  });
  req.write(postData);
  req.end();
};

module.exports = Recaptcha;
