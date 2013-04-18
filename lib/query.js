var _ = require('./misc/underscore');

var Query = function (model) {
    this.model = model;
    this._conditions;
    this._order;
    this._offset;
    this._limit;
};

Query.prototype.where = function (conditions) {
    this._conditions = conditions;
    return this;
};

Query.prototype.order = function (order) {
    this._order = order;
    return this;
};

Query.prototype.offset = function (offset, callback) {
    this._offset = offset;
    return this;
};

Query.prototype.limit = function (limit) {
    this._limit = limit;
    return this;
};

Query.prototype.count = function (callback) {
    return this.model.database.adapter.count(this.toObject(), callback);
};

Query.prototype.exists = function (callback) {
    return this.model.database.adapter.exists(this.toObject(), callback);
};

Query.prototype.forEach = function (callback) {
    return this.model.database.adapter.forEach(this.toObject(), callback);
};

Query.prototype.toArray = function (callback) {
    return this.model.database.adapter.toArray(this.toObject(), callback);
};

Query.prototype.first = function (callback) {
    return this.limit(1).toArray(function (error, records) {
        if (error)
            callback(error, null);
        else
            callback(null, records[0]);
    });
};

Query.prototype.last = function (callback) {
    var order = {};

    order[this.model.primaryKey] = -1;
    return this.order(order).first(callback);
};

Query.prototype.destroy = function (callback) {
    return this.model.database.adapter.destroy(this.toObject(), callback);
};

Query.prototype.toObject = function () {
    return {
        model: this.model,
        conditions: this._conditions,
        order: this._order,
        offset: this._offset,
        limit: this._limit
    };
};

module.exports = Query;

