var AdapterFactory = require('./adapter_factory');
var Model = require('./model');

var Database = function (url, options) {
    this.adapter = AdapterFactory.create(url, options);
};

Database.prototype.define = function (modelName, attributes, options) {
    options || (options = {});
    options.modelName = modelName;
    options.database = this;
    return Model.extend(attributes, options);
};

Database.prototype.acquire = function () {
    this.adapter.acquire.apply(this.adapter, arguments);
};

Database.prototype.release = function (callback) {
    this.adapter.release.apply(this.adapter, arguments);
};

module.exports = Database;

