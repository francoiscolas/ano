(function () {

    var noop = function () {
    };

    var eachParallel = function (obj, iterator, callback, context) {
        if (callback === null || callback === undefined) {
            callback = noop;
        } else if (typeof callback !== 'function') {
            context  = callback;
            callback = noop;
        }

        var n = _.size(obj);
        if (n === 0) return callback(null);

        _.each(obj, function (value, key, obj) {
            iterator.call(context, value, _.once(function (error) {
                if (error) {
                    callback(error);
                    callback = noop;
                } else if (--n <= 0) {
                    callback(null);
                }
            }), key, obj);
        });
    };

    var eachSerie = function (obj, iterator, callback, context) {
        if (callback === null || callback === undefined) {
            callback = noop;
        } else if (typeof callback !== 'function') {
            context  = callback;
            callback = noop;
        }

        var keys = (obj) ? _.keys(obj) : [];
        if (keys.length === 0) return callback(null);

        (function next(i) {
            var key = keys[i];
            var value = obj[key];

            iterator.call(context, value, _.once(function (error) {
                if (error)
                    callback(error);
                else if (++i >= keys.length)
                    callback(null);
                else
                    next(i);
            }), key, obj);
        })(0);
    };

    var _;

    if (typeof module !== 'undefined' && module.exports !== undefined)
        _ = module.exports = require('underscore');
    else
        _ = this._;

    _ && _.mixin({
        eachParallel: eachParallel,
        eachP		: eachParallel,
        eachSerie	: eachSerie,
        eachS		: eachSerie
    });

})();

