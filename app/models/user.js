// app/models/user.js
// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var userSchema = mongoose.Schema({

    local            : {
        email        : String,
        password     : String,
    },
    facebook         : {
        id           : String,
        token        : String,
        email        : String,
        name         : String,
        movies       : [String],
        friends      : [String], 
        likes        : [String], 
        posts        : {name: String, description: String, link: String}, 
        photos       : [String], 
        music        : [String]
    },
    twitter          : {
        id           : String,
        token        : String,
        displayName  : String,
        username     : String,
        likes        : {user:  String , text:  String},
        followers    : [String],
        friends      : [String], 
        tweetsAbout  : [String], 
        tweets       : [String]

    },
    google           : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    },
    instagram        : {
        id           : String,
        token        : String, 
        displayName  : String,
        name         : String,
        username     : String 
    }

});

// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);