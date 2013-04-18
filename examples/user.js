var ANO     = require('..');
var BCRYPT  = require('bcrypt');
var db      = new ano.Database('mongodb://127.0.0.1/ano');

var User = app.database.define('User', {
    name            : {type: String, max: 64, match: /^[A-Za-zÀ-ÿ0-9 -]*$/},
    email           : {type: String, unique: true, required: true, match: /^[a-z0-9\+._-]+@[a-z0-9.-]+\.[a-z]{2,4}$/},
    passwordHash    : {type: String},
    password        : {type: String, virtual: true, min: 5, max: 32},
    passwordOld     : {type: String, virtual: true},
    passwordConfirm : {type: String, virtual: true},
    comment         : {type: String},
    isLocked        : {type: Boolean}
}, {
    timestamps: true
});


//
// Validations

User.attributes.passwordOld.validations.invalid = function (options, result) {
    if (this.isNew())
        return true;
    if (this.passwordOld === undefined
            && this.password === undefined && this.passwordConfirm === undefined)
        return true;
    if (this.passwordOld === undefined)
        return false;
    this.isValidPassword(this.passwordOld, result);
};

User.attributes.password.validations.required = function () {
    if (this.isNew() && this.passwordConfirm !== undefined)
        return false;
    if (!this.isNew() && this.passwordOld !== undefined)
        return false;
    return true;
};

User.attributes.password.validations.confirm = function () {
    if (this.password === undefined && this.passwordConfirm === undefined)
        return true;
    return (this.password === this.passwordConfirm);
};


//
// Hooks

User.before('save', function (done) {
    if (this.password === undefined) {
        done();
    } else {
        BCRYPT.hash(this.password, 10, function (error, hash) {
            if (hash) this.passwordHash = hash;
            done(error);
        }.bind(this));
    }
});


//
// Statics

User.authenticate = function (email, password, callback) {
    var message = 'ano.users.errors.badCredentials';

    User.first({email: email, isLocked: {$ne: true}}, function (error, user) {
        if (error) return callback(error, null);
        if (!user) return callback(new Error(message), null);
        user.isValidPassword(password, function (isValid) {
            if (isValid)
                callback(null, user);
            else
                callback(new Error(message), null);
        });
    });
};


//
// Methods

User.prototype.isValidPassword = function (password, callback) {
    // async
    if (typeof callback === 'function') {
        BCRYPT.compare(password, this.passwordHash, function (error, areEquals) {
            callback(areEquals);
        });
    // sync
    } else {
        return BCRYPT.compareSync(password, this.passwordHash);
    }
};

module.exports = User;

