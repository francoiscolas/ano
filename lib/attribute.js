var _     = require('./misc/underscore');
var Types = require('./types');

var Attribute = function (name, options) {
    options || (options = {});
    this.name = name;
    this.type = Types.fromNative(options.type);
    this.default = options.default;
    this.virtual = !!options.virtual;
    this.getter = options.getter;
    this.setter = options.setter;
    this.validations = _.omit(options, _.keys(this));
};

Attribute.prototype.isValid = function () {
    return (typeof this.name === 'string' && this.name.length > 0
        && Types.isValid(this.type));
};

Attribute.prototype.evalDefault = function () {
    if (typeof this.default === 'function')
        return this.default();
    else
        return this.default;
};

var _value = function (object, property, value) {
    if (object && object.hasOwnAttribute(property))
        return object[property];
    return value;
};

module.exports = Attribute;

