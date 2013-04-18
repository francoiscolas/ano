var _           = require('./misc/underscore');
var Attribute   = require('./attribute');
var Query       = require('./query');
var Validations = require('./validations');
var VError      = require('./validation_error');
var va          = require('./misc/va');

var _noop = function () {
};

var _hook = function (record, method, afterBefores, afterAfters) {
    var befores = record._class.hooks.before[method];

    _.eachS(befores, function (before, next) {
        before.call(record, next);
    }, function (error) {
        afterBefores.call(record, error, function (error) {
            if (error) return afterAfters.call(record, error);
            var afters = record._class.hooks.after[method];

            _.eachS(afters, function (after, next) {
                after.call(record, next);
            }, afterAfters.bind(record));
        });
    });
};

var _toCamelCase = function (string) {
    return string.replace(/(?:^|_|-)+(.)?/g, function (match, chr) {
        return (chr) ? chr.toUpperCase() : '';
    });
}

var _toLowerCamelCase = function (string) {
    string = _toCamelCase(string);
    return string.charAt(0).toLowerCase() + string.substring(1);
};

var _toUnderscoreCase = function (string) {
    return string.replace(/::/g, '/')
        .replace(/-/g, '_')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
        .replace(/([a-z\d])([A-Z])/g, '$1_$2')
        .toLowerCase();
};

var Model = function (data) {
    var Class = this._class;

    this.errors = new VError();
    this.__data = {};

    data || (data = {});
    _.each(Class.attributes, function (attribute, name) {
        Object.defineProperty(this, name, {
            enumerable: true,
            get: function () {
                if (attribute.getter !== undefined)
                    return attribute.getter.call(this);
                else
                    return this.__data[name];
            },
            set: function (value) {
                if (attribute.setter !== undefined)
                    attribute.setter.call(this, value);
                else
                    this.__data[name] = value;
            }
        });
        Object.defineProperty(this, '_' + name, {
            enumerable: false,
            get: function () {
                return this.__data[name];
            },
            set: function (value) {
                this.__data[name] = value;
            }
        });
        if (data[name] !== undefined) {
            this[name] = data[name];
        } else {
            var val = attribute.evalDefault();
            if (val !== undefined)
                this[name] = val;
        }
    }, this);

    this.initialize.apply(this, arguments);
};

Model.extend = function (attributes, staticProps) {
    var Parent = this;
    var Child  = function () {
        return Parent.apply(this, arguments);
    };

    if (!('database' in staticProps)) throw new Error('database property is mandatory');
    if (!('modelName' in staticProps)) throw new Error('modelName property is mandatory');
    if (!('collection' in staticProps)) staticProps.collection = _toUnderscoreCase(staticProps.modelName) + 's'

    for (var key in Parent)
        Child[key] = Parent[key];
    Child.prototype = Object.create(Parent.prototype);

    for (var key in staticProps)
        Child[key] = staticProps[key];

    Child.attributes = {};
    Child.hooks = {before: {}, after: {}};
    Child.defineAttributes(attributes);

    Child.prototype.constructor = Child;
    Child.prototype._class = Child;
    Child.prototype._super = Parent;

    if (Child.database.adapter.onModelDefined)
        Child.database.adapter.onModelDefined(Child);

    return Child;
};

Model.defineAttribute = function (name, options) {
    var Class = this;
    var attribute = new Attribute(name, options);

    if (attribute.isValid()) {
        Class.attributes[name] = attribute;
        return attribute;
    }
};

Model.defineAttributes = function (rawAttributes) {
    var Class = this;

    for (var name in rawAttributes)
        Class.defineAttribute(name, rawAttributes[name]);
    return Class;
};

Model.before = function (method, hook) {
    var Class = this;
    var hooks = Class.hooks.before;

    if (hooks[method] === undefined)
        hooks[method] = [];
    hooks[method].push(hook);
    return Class;
};

Model.after = function (method, hook) {
    var Class = this;
    var hooks = Class.hooks.after;

    if (hooks[method] === undefined)
        hooks[method] = [];
    hooks[method].push(hook);
    return Class;
};

Model.hasOne = function (Other) {
    var This = this;
    var from = This.primaryKey;
    var to   = _toUnderscoreCase(This.modelName) + '_id';
    var thisName  = _toLowerCamelCase(This.modelName);
    var otherName = _toLowerCamelCase(Other.modelName);

    This.prototype['get' + Other.modelName] = function (callback) {
        if (this[otherName] !== undefined) {
            callback(null, this[otherName]);
        } else {
            var selector = {};

            selector[to] = this[from];
            Other.first(selector, function (error, other) {
                if (error) {
                    callback(error, null);
                } else {
                    this[otherName] = other;
                    callback(null, this[otherName]);
                }
            }.bind(this));
        }
    };
    This.prototype['new' + Other.modelName] = function (data) {
        data = _.clone((_.isObject(data)) ? data : {});
        data[to] = this[from];
        this[otherName] = new Other(data);
        return this[otherName];
    };
};

Model.belongsTo = function (Other) {
    var This = this;
    var from = _toUnderscoreCase(Other.modelName) + '_id';
    var to   = Other.primaryKey;
    var thisName = _toLowerCamelCase(This.modelName);
    var otherName = _toLowerCamelCase(Other.modelName);

    This.prototype['get' + Other.modelName] = function (callback) {
        if (this[otherName] !== undefined) {
            callback(null, this[otherName]);
        } else {
            var selector = {};

            selector[to] = this[from];
            Other.first(selector, function (error, other) {
                if (error) {
                    callback(error, null);
                } else {
                    this[otherName] = other;
                    callback(null, this[otherName]);
                }
            }.bind(this));
        }
    };
    This.prototype['new' + Other.modelName] = function (data) {
        data = _.clone(data || {});
        data[to] = this[from];
        this[otherName] = new Other(data);
        return this[otherName];
    };
};

Model.find = function (conditions, callback) {
    with (va(arguments, '!function conditions=', 'function callback=')) {
        var Class = this;
        var query = (new Query(Class));

        if (conditions !== undefined) {
            if (!_.isObject(conditions)) {
                var key = Class.primaryKey;
                var value = conditions;

                conditions = {};
                conditions[key] = Class.getAttributes(key).type.cast(value);
            }
            query.where(conditions);
        }

        if (!callback) return query;
        query.toArray(callback);
    }
};

/**
 * TODO - Add serie:true option to do something like that:
 *   Model.forEach({serie: true}, function (error, record, next) {
 *     if (error) ...
 *     else doSomethingAsync(next);
 *   });
 */
Model.forEach = function (conditions, callback) {
    with (va(arguments, '!function conditions=', 'function callback')) {
        this.find(conditions).forEach(callback);
    }
};

Model.first = function (conditions, callback) {
    with (va(arguments, '!function conditions=', 'function callback')) {
        this.find(conditions).first(callback);
    }
};

Model.last = function (conditions, callback) {
    with (va(arguments, '!function conditions=', 'function callback')) {
        this.find(conditions).last(callback);
    }
};

Model.count = function (conditions, callback) {
    with (va(arguments, '!function conditions=', 'function callback')) {
        this.find(conditions).count(callback);
    }
};

Model.exists = function (conditions, callback) {
    with (va(arguments, '!function conditions=', 'function callback')) {
        this.find(conditions).exists(callback);
    }
};

Model.create = function (docs, callback) {
    var Class = this;
    var records = [];
    var is_array = _.isArray(docs);

    if (!is_array) docs = [docs];
    _.eachS(docs, function (doc, next) {
        var record = (doc instanceof Class) ? doc : new Class(doc);
        record.save(function (error, record) {
            records.push(record);
            next(error);
        });
    }, function (error) {
        callback(error, (is_array) ? records : (records[0] || null));
    });
};

Model.destroy = function (selector, callback) {
    with (va(arguments, '!function conditions=', 'function callback')) {
        this.find(conditions).destroy(callback);
    }
};

Model.prototype.initialize = function () {
};

Model.prototype.isNew = function () {
    var Class = this._class;
    return (this[Class.primaryKey] === undefined);
};

Model.prototype.has = function (name) {
    return (this.hasOwnProperty(name));
};

Model.prototype.set = function (attrs) {
    _.extend(this, attrs);
    return this;
};

Model.prototype.validate = function (callback) {
    var validations = _.pluck(this._class.attributes, 'validations');
    var errors = this.errors = new VError();
    var that = this;

    _.eachP(this._class.attributes, function (attr, done, name) {
        _.eachS(attr.validations, function (validation, next, validationName) {
            var func;

            if (typeof (func = Validations[validationName]) !== 'function'
                    && typeof (func = validation) !== 'function')
                return next();

            var _callback = function (ok) {
                if (ok !== undefined)
                    next((!ok) ? 'ano.' + that._class.collection + '.errors.' + name + '.' + validationName : null);
            };
            _callback(func.call(that, {record: that, name: name, value: that[name], arg: validation}, _callback));
        }, function (error) {
            if (error)
                errors[name] = error;
            done();
        });
    }, function () {
        callback((!_.isEmpty(errors)) ? errors : null);
    });
    return this;
};

Model.prototype.update = function (attrs, callback) {
    this.set(attrs);
    this.save(callback);
    return this;
};

Model.prototype.save = function (options, callback) {
    with (va(arguments, 'object options=', 'function callback=')) {
        var save = function () {
            _hook(this, 'save', function (error, after) {
                if (error) callback(error, this);
                else this._class.database.adapter.save(this, after);
            }, function (error) {
                callback(error || null, this);
            });
        }.bind(this);

        options || (options = {});
        callback || (callback = _noop);

        if (options.validate === false) {
            save();
        } else {
            this.validate(function (error) {
                if (error) callback(error, this);
                else save();
            }.bind(this));
        }
    };
    return this;
};

Model.prototype.destroy = function (callback) {
    this._class.database.adapter.destroy(this, callback);
    return this;
};

Model.prototype.forEach = function (iterator, context) {
    _.each(this._class.attributes, function (attribute, name) {
        var value = this[name];

        if (value !== undefined)
            iterator.call(context, value, name, this);
    }, this);
};

Model.prototype.toJSON = function () {
    return this.toObject();
};

Model.prototype.toObject = function () {
    var object = {};
    var attributes = this._class.attributes;

    this.forEach(function (value, name) {
        if (!attributes[name].virtual)
            object[name] = attributes[name].type.cast(value);
    });
    return object;
};

Model.prototype.toString = function () {
    return '[object Model:' + this._class.collection + ']';
};

module.exports = Model;
