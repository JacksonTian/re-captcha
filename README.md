re-captcha [![Build Status](https://secure.travis-ci.org/JacksonTian/re-captcha.png)](http://travis-ci.org/JacksonTian/re-captcha)
======

recaptcha renders and verifies [Recaptcha](http://www.google.com/recaptcha) captchas.

## Installation

Via npm:

```
npm install re-captcha
```

## Setup

Before you can use this module, you must visit http://www.google.com/recaptcha
to request a public and private API key for your domain.

## Customizing the Recaptcha

See these [instructions](http://code.google.com/apis/recaptcha/docs/customization.html)
for help customizing the look of Recaptcha.  In brief, you will need to add a
structure like the following before the form in your document:

```
<script>
  var RecaptchaOptions = {
   theme: 'clean',
   lang: 'en'
  };
</script>
```

## Example Using Connect/Express

app.js:

```js
var express  = require('connect');
var Recaptcha = require('re-captcha');

var PUBLIC_KEY  = 'YOUR_PUBLIC_KEY';
var PRIVATE_KEY = 'YOUR_PRIVATE_KEY';
var recaptcha = new Recaptcha(PUBLIC_KEY, PRIVATE_KEY);

var app = connect();
app.use(connect.bodyParser());
app.get('/', function(req, res) {
  res.render('index', {
    layout: false,
    locals: {
      recaptcha_form: recaptcha.toHTML()
    }
  });
});

app.post('/', function(req, res) {
  var data = {
    remoteip:  req.connection.remoteAddress,
    challenge: req.body.recaptcha_challenge_field,
    response:  req.body.recaptcha_response_field
  };

  recaptcha.verify(data, function(err) {
    if (err) {
      // Redisplay the form.
      res.render('form.html', {
        layout: false,
        locals: {
          recaptcha_form: recaptcha.toHTML(err)
        }
      });
    } else {
      res.send('Recaptcha response valid.');
    }
  });
});

http.createServer(app).listen(3000);
```

views/form.html:

```html
<form method="POST" action=".">
  <%-recaptcha_form%>
  <input type="submit">
</form>
```

Make sure connect and EJS are installed, then:

```bash
$ node app.js
```
