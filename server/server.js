const express = require('express');
const models = require('./models');
const expressGraphQL = require('express-graphql');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportConfig = require('./services/auth');
const MongoStore = require('connect-mongo')(session);
const schema = require('./schema/schema');

// Create a new Express application
const app = express();

// Replace with your mongoLab URI
const MONGO_URI = 'mongodb://bigyan:bigyan@ds255258.mlab.com:55258/bigyann';

// Mongoose's built in promise library is deprecated, replace it with ES2015 Promise
mongoose.Promise = global.Promise;

// Connect to the mongoDB instance and log a message
// on success or failure
mongoose.connect(MONGO_URI);
mongoose.connection
    .once('open', () => console.log('Connected to MongoLab instance.'))
    .on('error', error => console.log('Error connecting to MongoLab:', error));

// Configures express to use sessions.  This places an encrypted identifier
// on the users cookie.  When a user makes a request, this middleware examines
// the cookie and modifies the request object to indicate which user made the request
// The cookie itself only contains the id of a session; more data about the session
// is stored inside of MongoDB.
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: 'aaabbbccc',
  store: new MongoStore({
    url: MONGO_URI,
    autoReconnect: true
  })
}));

// Passport is wired into express as a middleware. When a request comes in,
// Passport will examine the request's session (as set by the above config) and
// assign the current user to the 'req.user' object.  See also servces/auth.js
app.use(passport.initialize());
app.use(passport.session());

// Instruct Express to pass on any request made to the '/graphql' route
// to the GraphQL instance.
app.use('/graphql', expressGraphQL({
  schema,
  graphiql: true
}));

app.get('/forgotpassword', function(req, res){
  res.send('<form action="/passwordreset" method="POST">' +
        '<input type="email" name="email" value="" placeholder="Enter your email address..." />' +
        '<input type="submit" value="Reset Password" />' +
    '</form>');
});

app.post('/passwordreset', function (req, res) {
  if (req.body.email !== undefined) {
      var emailAddress = req.body.email;

      // TODO: Using email, find user from your database.
      var payload = {
          id: 1,        // User ID from database
          email: emailAddress
      };

      // TODO: Make this a one-time-use token by using the user's
      // current password hash from the database, and combine it
      // with the user's created date to make a very unique secret key!
      // For example:
      // var secret = user.password + ‘-' + user.created.getTime();
      var secret = 'fe1a1915a379f3be5394b64d14794932-1506868106675';

      var token = jwt.encode(payload, secret);

      // TODO: Send email containing link to reset password.
      // In our case, will just return a link to click.
      res.send('<a href="/resetpassword/' + payload.id + '/' + token + '">Reset password</a>');
  } else {
      res.send('Email address is missing.');
  }
});



// Webpack runs as a middleware.  If any request comes in for the root route ('/')
// Webpack will respond with the output of the webpack process: an HTML file and
// a single bundle.js output of all of our client side Javascript
const webpackMiddleware = require('webpack-dev-middleware');
const webpack = require('webpack');
const webpackConfig = require('../webpack.config.js');
app.use(webpackMiddleware(webpack(webpackConfig)));

module.exports = app;
