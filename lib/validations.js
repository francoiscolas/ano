var Validations = {
};

//
// options.record -> record instance
// options.name   -> record's field name
// options.value  -> record's field value
// options.arg    -> validation argument (ex: {required: true, match: /.../})
Validations.match = function (options) {
    return (new RegExp(options.arg)).test(options.value);
};

Validations.max = function (options) {
    if (options.value === undefined) return true;
    return (options.value.length <= options.arg);
};

Validations.min = function (options) {
    if (options.value === undefined) return true;
    return (options.value.length >= options.arg);
};

Validations.required = function (options) {
    return options.record.has(options.name);
};

Validations.unique = function (options, result) {
    var record = options.record;
    var Model = options.record._class;
    var selector = {};

    if (record.isNew() === false) {
        selector.$ne = {};
        selector.$ne[Model.primaryKey] = record[Model.primaryKey];
    }
    selector[options.name] = record[options.name];

    Model.count(selector, function (error, count) {
        result(!(count > 0));
    });
};

module.exports = Validations;

