// config/passport.js
const uuidv1 = require('uuid/v1');

// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;
var passport = require('passport');

// load up the user model
var user            = require('../models/users.js');

const aws_service = require('./aws.js');
const ddb = aws_service.ddb();

// expose this function to our app using module.exports
module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user);
    });

    // used to deserialize the user
    passport.deserializeUser(function(user, done) {
      const params = {
        ExpressionAttributeValues: {
          ":email": user.email,
        },
        KeyConditionExpression: "email = :email",
        TableName: "users"
      }
      ddb.query(params, function(err, data) {
        if (err) console.log(err)
        else done(err, user);
      });
    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        signupCodeField: 'code',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {
      const params = {
        ExpressionAttributeValues: {
          ":email": email
        },
        KeyConditionExpression: "email = :email",
        TableName: "users"
      }
      ddb.query(params, function(err, data) {
        if (err) return done(err);
        else {
          if (data.Items.length) return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
          var newUser = {};
          newUser.email = email;
          newUser.password = user.generateHash(password);
          newUser.id = uuidv1();
          newUser.traces = [];
          newUser.accessCode = (req.body.code == "ibm_emory") ? "ibm_emory" : "none";
          var params = {
            Item: newUser,
            TableName: "users"
          }
          ddb.put(params, function(err, data) {
            if (err) console.log(err)
            else {
              req.session.key = newUser;
              return done(null, newUser);
            }
          });
        }
      });

    }));

    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) { // callback with email and password from our form

      const params = {
        ExpressionAttributeValues: {
          ":email": email
        },
        KeyConditionExpression: "email = :email",
        TableName: "users"
      }

      console.log('loginnn');

      ddb.query(params, function(err, data) {
        if (err) return done(err);
        else {

          // if there are any errors, return the error before anything else
          if (err)
              return done(err);

          // if no user is found, return the message
          if (!data.Items.length)
            //console.log("no user found");
            return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash

          var password_hash = data.Items[0].password;
          // if the user is found but the password is wrong
          if (!user.validPassword(password, password_hash))
            // console.log('wrong password');
            return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata

          // all is well, return successful user
          req.session.key = data.Items[0];
          return done(null, data.Items[0]);

        }
      });

    }));

};
