var ValidationError = function (errors) {
    for (var key in errors)
        this[key] = errors[key];
};

module.exports = ValidationError;

