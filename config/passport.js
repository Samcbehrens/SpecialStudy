// load all the things we need
var LocalStrategy    = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy  = require('passport-twitter').Strategy;
var GoogleStrategy   = require('passport-google-oauth').OAuth2Strategy;
var InstagramStrategy  = require('passport-instagram').Strategy;
var Twit = require('twit');

// load up the user model
var User       = require('../app/models/user');

// load the auth variables
var configAuth = require('./auth'); // use this one for testing

module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
    function(req, email, password, done) {

        // asynchronous
        process.nextTick(function() {
            User.findOne({ 'local.email' :  email }, function(err, user) {
                // if there are any errors, return the error
                if (err)
                    return done(err);

                // if no user is found, return the message
                if (!user)
                    return done(null, false, req.flash('loginMessage', 'No user found.'));

                if (!user.validPassword(password))
                    return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));

                // all is well, return user
                else
                    return done(null, user);
            });
        });

    }));

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)
    },
    function(req, email, password, done) {

        // asynchronous
        process.nextTick(function() {

            //  Whether we're signing up or connecting an account, we'll need
            //  to know if the email address is in use.
            User.findOne({'local.email': email}, function(err, existingUser) {

                // if there are any errors, return the error
                if (err)
                    return done(err);

                // check to see if there's already a user with that email
                if (existingUser) 
                    return done(null, false, req.flash('signupMessage', 'That email is already taken.'));

                //  If we're logged in, we're connecting a new local account.
                if(req.user) {
                    var user            = req.user;
                    user.local.email    = email;
                    user.local.password = user.generateHash(password);
                    user.save(function(err) {
                        if (err)
                            throw err;
                        return done(null, user);
                    });
                } 
                //  We're not logged in, so we're creating a brand new user.
                else {
                    // create the user
                    var newUser            = new User();

                    newUser.local.email    = email;
                    newUser.local.password = newUser.generateHash(password);

                    newUser.save(function(err) {
                        if (err)
                            throw err;

                        return done(null, newUser);
                    });
                }

            });
        });

    }));

    // =========================================================================
    // FACEBOOK ================================================================
    // =========================================================================
    passport.use(new FacebookStrategy({

        clientID        : configAuth.facebookAuth.clientID,
        clientSecret    : configAuth.facebookAuth.clientSecret,
        callbackURL     : configAuth.facebookAuth.callbackURL,
        profileFields: ['id', 'emails', 'name', 'likes', 'posts', 'music', 'movies', 'photos', 'books'],
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)

    },
    function(req, token, refreshToken, profile, done) {

       
        // asynchronous
        process.nextTick(function() {
           
            if (!req.user) {

                User.findOne({ 'facebook.id' : profile.id }, function(err, user) {
                    if (err)
                        return done(err);

                    if (user) {

                        // if there is a user id already but no token (user was linked at one point and then removed)
                        if (!user.facebook.token) {
                            user.facebook.token = token;
                            user.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
                            user.facebook.email = profile.emails[0].value;
                            user.facebook.movies= profile._json.movies.data[0].name;
                            user.facebook.friends = profile._json.movies.data[0].name;
                         
            
                        
                        var movieCollection = profile._json.movies.data
                        movieCollection.forEach(function (element, index) {
                            user.facebook.movies.push(element.name);
                            console.log(element.name)
                           
                        });

                        var likeCollection = profile._json.likes.data
                        likeCollection.forEach(function (element, index) {
                            user.facebook.likes.push(element.name);
                            console.log(element.name)
                           
                        });

                        var postsCollection = profile._json.posts.data
                        postsCollection.forEach(function (element, index) {
                            user.facebook.posts.name = element.name;
                            user.facebook.posts.description = element.description;
                            user.facebook.posts.link = element.link;
                            console.log(element.name);
                           
                        });

                        var musicCollection = profile._json.music.data
                        musicCollection.forEach(function (element, index) {
                            user.facebook.music.push(element.name);
                            console.log(element.name)
                           
                        });

                        var bookCollection = profile._json.music.data
                        bookCollection.forEach(function (element, index) {
                             user.facebook.books.push(element.name);
                            console.log(element.name)
                        });


                            user.save(function(err) {
                                if (err)
                                    throw err;
                                return done(null, user);
                            });
                        }

                        return done(null, user); // user found, return that user
                    } else {
                        // if there is no user, create them
                        var newUser            = new User();
                        newUser.facebook.id    = profile.id;
                        newUser.facebook.token = token;
                        newUser.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
                        newUser.facebook.email = profile.emails[0].value;
                        newUser.facebook.movies = profile._json.movies.data[0].name;
                        newUser.facebook.friends = profile._json.movies.data[0].name;
                     
                        var movieCollection = profile._json.movies.data
                        movieCollection.forEach(function (element, index) {
                            user.facebook.movies.push(element.name);
                            console.log(element.name)
                           
                        });

                        var likeCollection = profile._json.likes.data
                        likeCollection.forEach(function (element, index) {
                            newUser.facebook.likes.push(element.name);
                            console.log(element.name)
                           
                        });

                        var postsCollection = profile._json.posts.data
                        postsCollection.forEach(function (element, index) {
                            user.facebook.posts.name = element.name;
                            user.facebook.posts.description = element.description;
                            user.facebook.posts.link = element.link;
                            console.log(element.name)
                           
                        });

                        var musicCollection = profile._json.music.data
                        musicCollection.forEach(function (element, index) {
                            newUser.facebook.music.push(element.name);
                            console.log(element.name)
                           
                        });

                        var bookCollection = profile._json.music.data
                        bookCollection.forEach(function (element, index) {
                            newUser.facebook.books.push(element.name);
                            console.log(element.name)
                        });

                        newUser.save(function(err) {
                            if (err)
                                throw err;
                            return done(null, newUser);
                        });
                    }
                });

            } else {
                // user already exists and is logged in, we have to link accounts
                var user            = req.user; // pull the user out of the session
                user.facebook.id    = profile.id;
                user.facebook.token = token;
                user.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName;
                user.facebook.email = profile.emails[0].value;




                        var movieCollection = profile._json.movies.data
                    
                        movieCollection.forEach(function (element, index) {
                            user.facebook.movies.push(element.name);
                            console.log(element.name)
                           
                        });

                        var likeCollection = profile._json.likes.data
                        
                        likeCollection.forEach(function (element, index) {
                            user.facebook.likes.push(element.name);
                            console.log(element.name)
                           
                        });

                        var postsCollection = profile._json.posts.data
                        postsCollection.forEach(function (element, index) {
                            user.facebook.posts.name = element.name;
                            user.facebook.posts.description = element.description;
                            user.facebook.posts.link = element.link;
                           
                        });

                        var musicCollection = profile._json.music.data
                        musicCollection.forEach(function (element, index) {
                            user.facebook.music.push(element.name);
                            console.log(element.name)
                           
                        });

                        var bookCollection = profile._json.music.data
                    
                        bookCollection.forEach(function (element, index) {
                            user.facebook.books.push(element.name);
                            console.log(element.name)
                        });
 
                user.save(function(err) {
                    if (err)
                        throw err;
                    return done(null, user);
                });

            }

        });
    }));
    // =========================================================================
    // TWITTER =================================================================
   passport.use(new TwitterStrategy({

        consumerKey     : configAuth.twitterAuth.consumerKey,
        consumerSecret  : configAuth.twitterAuth.consumerSecret,
        callbackURL     : configAuth.twitterAuth.callbackURL,
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)

    },
    function(req, token, tokenSecret, profile, done) {
        console.log(profile)
        // asynchronous
        process.nextTick(function() {
     
            // check if the user is already logged in
            if (!req.user) {

                User.findOne({ 'twitter.id' : profile.id }, function(err, user) {
                    var T = new Twit({
                            consumer_key:         configAuth.twitterAuth.consumerKey
                          , consumer_secret:      configAuth.twitterAuth.consumerSecret
                          , access_token:         token
                          , access_token_secret:  tokenSecret
                        });

                    // T.get('followers/ids', function(err, data, response) {
                    //     console.log('test',data)
                    //     console.log(data.ids[0])
                    //     T.get('users/lookup?user_id='+data.ids[0],function(err, data, response){
                    //         console.log(data)
                    //     })
                    // }) 


                   T.get('statuses/user_timeline', function(err, data, response) {
                        console.log('test',data)
                    })  

                    if (err)
                        return done(err);

                    if (user) {
                        // if there is a user id already but no token (user was linked at one point and then removed)
                        if (!user.twitter.token) {
                            user.twitter.token       = token;
                            user.twitter.username    = profile.username;
                            user.twitter.displayName = profile.displayName;

                            user.save(function(err) {
                                if (err)
                                    throw err;
                                return done(null, user);
                            });
                        }

                        return done(null, user); // user found, return that user
                    } else {
                        // if there is no user, create them
                        var newUser                 = new User();

                        newUser.twitter.id          = profile.id;
                        newUser.twitter.token       = token;
                        newUser.twitter.username    = profile.username;
                        newUser.twitter.displayName = profile.displayName;

                        newUser.save(function(err) {
                            if (err)
                                throw err;
                            return done(null, newUser);
                        });
                    }
                });

            } else { 
                // user already exists and is logged in, we have to link accounts
                var user                 = req.user; // pull the user out of the session

                user.twitter.id          = profile.id;
                user.twitter.token       = token;
                user.twitter.username    = profile.username;
                user.twitter.displayName = profile.displayName;

                user.save(function(err) {
                    if (err)
                        throw err;
                    return done(null, user);
                });
            }

        });

    }));

    // =========================================================================
    // INSTAGRAM ===============================================================
    // =========================================================================


    passport.use(new InstagramStrategy({
        clientID: configAuth.instagramAuth.clientID,
        clientSecret: configAuth.instagramAuth.clientSecret,
        callbackURL: configAuth.instagramAuth.callbackURL,
        passReqToCallback : true
    },function(req, token, refreshToken, profile, done) {

        // asynchronous
        process.nextTick(function() {

            // check if the user is already logged in
            if (!req.user) {

                User.findOne({ 'instagram.id' : profile.id }, function(err, user) {
                    if (err)
                        return done(err);

                    if (user) {

                        // if there is a user id already but no token (user was linked at one point and then removed)
                        if (!user.instagram.token) {
                            user.instagram.token = token;
                            user.instagram.name  = profile.displayName;
                            user.instagram.id = profile.id


                            user.save(function(err) {
                                if (err)
                                    throw err;
                                return done(null, user);
                            });
                        }

                        return done(null, user);
                    } else {
                        var newUser          = new User();

                        newUser.instagram.id    = profile.id;
                        newUser.instagram.token = token;
                        newUser.instagram.name  = profile.displayName;

                        newUser.save(function(err) {
                            if (err)
                                throw err;
                            return done(null, newUser);
                        });
                    }
                });

            } else {
                // user already exists and is logged in, we have to link accounts
                var user               = req.user; // pull the user out of the session

                user.instagram.id    = profile.id;
                user.instagram.token = token;
                user.instagram.name  = profile.displayName;

                user.save(function(err) {
                    if (err)
                        throw err;
                    return done(null, user);
                });

            }

        });
        }));


    // =========================================================================
    // GOOGLE ==================================================================
    // =========================================================================
    passport.use(new GoogleStrategy({

        clientID        : configAuth.googleAuth.clientID,
        clientSecret    : configAuth.googleAuth.clientSecret,
        callbackURL     : configAuth.googleAuth.callbackURL,
        passReqToCallback : true // allows us to pass in the req from our route (lets us check if a user is logged in or not)

    },
    function(req, token, refreshToken, profile, done) {

        // asynchronous
        process.nextTick(function() {

            // check if the user is already logged in
            if (!req.user) {

                User.findOne({ 'google.id' : profile.id }, function(err, user) {
                    if (err)
                        return done(err);

                    if (user) {

                        // if there is a user id already but no token (user was linked at one point and then removed)
                        if (!user.google.token) {
                            user.google.token = token;
                            user.google.name  = profile.displayName;
                            user.google.email = profile.emails[0].value; // pull the first email

                            user.save(function(err) {
                                if (err)
                                    throw err;
                                return done(null, user);
                            });
                        }

                        return done(null, user);
                    } else {
                        var newUser          = new User();

                        newUser.google.id    = profile.id;
                        newUser.google.token = token;
                        newUser.google.name  = profile.displayName;
                        newUser.google.email = profile.emails[0].value; // pull the first email

                        newUser.save(function(err) {
                            if (err)
                                throw err;
                            return done(null, newUser);
                        });
                    }
                });

            } else {
                // user already exists and is logged in, we have to link accounts
                var user               = req.user; // pull the user out of the session

                user.google.id    = profile.id;
                user.google.token = token;
                user.google.name  = profile.displayName;
                user.google.email = profile.emails[0].value; // pull the first email

                user.save(function(err) {
                    if (err)
                        throw err;
                    return done(null, user);
                });

            }

        });

    }));

};