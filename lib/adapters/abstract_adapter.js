var AbstractAdapter = function () {
    this.initialize.apply(this, arguments);
};

AbstractAdapter.extend = require('../misc/inherits');

AbstractAdapter.prototype.onModelDefined;

AbstractAdapter.prototype.initialize = function () {};

AbstractAdapter.prototype.acquire = function () {
    throw new Error('AbstractAdapter#acquire must be overriden');
};

AbstractAdapter.prototype.release = function () {
    throw new Error('AbstractAdapter#release must be overriden');
};

AbstractAdapter.prototype.count = function (query, callback) {
    throw new Error('AbstractAdapter#count must be overriden');
};

AbstractAdapter.prototype.exists = function (query, callback) {
    throw new Error('AbstractAdapter#exists must be overriden');
};

AbstractAdapter.prototype.forEach = function (query, callback) {
    throw new Error('AbstractAdapter#forEach must be overriden');
};

AbstractAdapter.prototype.toArray = function (query, callback) {
    throw new Error('AbstractAdapter#toArray must be overriden');
};

AbstractAdapter.prototype.insert = function () {
    throw new Error('AbstractAdapter#insert must be overriden');
};

AbstractAdapter.prototype.update = function () {
    throw new Error('AbstractAdapter#update must be overriden');
};

AbstractAdapter.prototype.save = function (record, callback) {
    if (record.isNew())
        this.insert(record, callback);
    else
        this.update(record, callback);
};

AbstractAdapter.prototype.destroy = function () {
    throw new Error('AbstractAdapter#destroy must be overriden');
};

module.exports = AbstractAdapter;

