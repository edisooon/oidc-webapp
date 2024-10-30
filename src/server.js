const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const express = require('express');
const handlebars = require('express-handlebars');
const path = require('path');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const request = require('request-promise');
const session = require('express-session');

// loading env vars from .env file
require('dotenv').config();

const nonceCookie = 'auth0rization-nonce';
let oidcProviderInfo;

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser(crypto.randomBytes(16).toString('hex')));
app.use(
  session({
    secret: crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false
  })
);
app.engine('handlebars', handlebars());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/profile', (req, res) => {
  const { idToken, decodedIdToken } = req.session;
  res.render('profile', {
    idToken,
    decodedIdToken
  });
});

// initiating the Authentication Process
app.get('/login', (req, res) => {
  // define constants for the authorization request
  const authorizationEndpoint = oidcProviderInfo['authorization_endpoint'];
  const responseMode = 'form_post';
  const responseType = 'id_token';
  const scope = 'openid';
  const clientID = "UecQ5gFv4vLkwWTLyHafEkdrpPGekpsF" // ${CLIENT_ID}: in auth0
  const redirectUri = 'http://localhost:3000/callback';
  const nonce = crypto.randomBytes(16).toString('hex');
  // define a signed cookie containing the nonce value
  const options = {
    maxAge: 1000 * 60 * 15,
    httpOnly: true, // The cookie only accessible by the web server
    signed: true  // Indicates if the cookie should be signed
  }

  // add cookie to the response and issue a 302 redirecting user
  res
    .cookie(nonceCookie, nonce, options)
    .redirect(
      authorizationEndpoint +
      '?response_mode=' + responseMode +
      '&response_type=' + responseType +
      '&scope=' + scope +
      '&client_id=' + clientID +
      '&redirect_uri=' + redirectUri +
      '&nonce=' + nonce
    )
});

app.post('/callback', async (req, res) => {
  res.status(501).send();
});

app.get('/to-dos', async (req, res) => {
  res.status(501).send();
});

app.get('/remove-to-do/:id', async (req, res) => {
  res.status(501).send();
});

// Fetch Information from the Discovery Endpoint
const discEnd = 'https://dev-oeat2inrsl0jpupa.us.auth0.com/.well-known/openid-configuration'; // ${OIDC_PROVIDER}: domain in auth0
request(discEnd).then((res) => {
  oidcProviderInfo = JSON.parse(res);
  app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
  });
}).catch((error) => {
  console.error(error);
  console.error('Unable to get OIDC endpoints for ${OIDC_PROVIDER}');
  process.exit(1);
});
