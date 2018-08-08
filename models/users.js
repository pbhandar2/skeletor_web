var bcrypt   = require('bcrypt-nodejs');

// methods ======================
// generating a hash
exports.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
exports.validPassword = function(password, hash) {
    return bcrypt.compareSync(password, hash);
};
