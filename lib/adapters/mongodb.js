var _               = require('../misc/underscore');
var AbstractAdapter = require('./abstract_adapter');
var Model           = require('../model');
var Types           = require('../types');

var _noop = function () {};

var MongoDb = AbstractAdapter.extend({

    initialize: function (url, options) {
        this.db = null;
        this.error = null;
        require('mongodb').connect(url, options, function (error, db) {
            if (error)
                this.error = error;
            else
                this.db = db;
        }.bind(this));
    },

    acquire: function (callback) {
        process.nextTick(function () {
            if (this.error)
                callback(this.error, null);
            else if (this.db)
                callback(null, this.db);
            else
                setTimeout(this.acquire.bind(this, callback), 500);
        }.bind(this));
    },

    release: function (db) {
        // nothing to do
    },

    ensureIndex: function (model, target, options, callback) {
        if (typeof options === 'function') {
            callback = options;
            options = {};
        }
        if (typeof callback !== 'function') {
            callback = _noop;
        }
        this.acquire(function (error, db) {
            if (error) return callback(error);
            var collection = db.collection(model.collection);

            collection.ensureIndex(target, options, function () {
                this.release(db);
                callback.apply(null, arguments);
            }.bind(this));
        }.bind(this));
    },

    count: function (query, callback) {
        var done = function (db, error, count) {
            this.release(db);
            callback(error, count);
        }.bind(this);

        this._find(query, function (error, cursor, db) {
            if (error) return done(db, error, null);
            cursor.count(true, function (error, count) {
                if (error) done(db, error, null);
                else done(db, null, count);
            });
        });
        return this;
    },

    exists: function (query, callback) {
        this.count(query, function (error, count) {
            if (error) return callback(error, null);
            callback(null, (count > 0));
        });
        return this;
    },

    forEach: function (query, callback) {
        var done = function (db, error, record) {
            this.release(db);
            callback(error, record);
        }.bind(this);

        this._find(query, function (error, cursor, db) {
            if (error) return done(db, error, null);
            cursor.each(function (error, doc) {
                if (error) done(db, error, null);
                else if (!doc) done(db, error, null);
                else callback(null, new query.model(doc));
            });
        });
        return this;
    },

    toArray: function (query, callback) {
        var done = function (db, error, records) {
            this.release(db);
            callback(error, records);
        }.bind(this);

        this._find(query, function (error, cursor, db) {
            if (error) return done(db, error, null);
            cursor.toArray(function (error, docs) {
                if (error) done(db, error, null);
                else done(db, null, docs.map(function (doc) {
                    return new query.model(doc);
                }));
            });
        });
        return this;
    },

    insert: function (record, callback) {
        var done = function (db, error, record) {
            this.release(db);
            callback && callback(error, record);
        }.bind(this);

        this.acquire(function (error, db) {
            if (error) return done(db, error, record);
            var collection = db.collection(record._class.collection);

            collection.insert(record.toObject(), function (error, docs) {
                if (error) done(db, error, record);
                else done(db, null, record.set(docs[0]));
            });
        });
        return this;
    },

    update: function (record, callback) {
        var done = function (db, error, record) {
            this.release(db);
            callback(error, record);
        }.bind(this);

        this.acquire(function (error, db) {
            if (error) return done(db, error, record);
            var collection = db.collection(record._class.collection);

            collection.update({_id: record._id}, record.toObject(), function (error) {
                done(db, error || null, record);
            });
        });
        return this;
    },

    destroy: function (record, callback) {
        var done = function (db, error, record) {
            this.release(db);
            callback(error, record);
        }.bind(this);

        this.acquire(function (error, db) {
            if (error) return done(db, error, record);
            var selector;
            var collection;

            if (record instanceof Model) {
                selector = record.toObject();
                collection = db.collection(record._class.collection);
            } else {
                selector = record.conditions;
                collection = db.collection(record.model.collection);
            }
            collection.remove(selector, function (error) {
                done(db, error || null, record);
            });
        });
        return this;
    },

    onModelDefined: function (model) {
        model.primaryKey = '_id';

        if (model.attributes._id === undefined)
            model.defineAttribute('_id', {type: Types.ObjectID});

        model.ensureIndex = function (target, options, callback) {
            model.database.adapter.ensureIndex(model, target, options, callback);
        };

        // TODO - Automatically call ensureIndex().
    },

    _find: function (query, callback) {
        this.acquire(function (error, db) {
            if (error) return callback(error, null, null);
            var args = [];
            var collection = db.collection(query.model.collection);

            if (query.conditions !== undefined) args.push(query.conditions);
            if ('order' in query) query.sort = query.order;
            if ('offset' in query) query.skip = query.offset;
            args.push(_.pick(query, 'sort', 'skip', 'limit'));
            callback(null, collection.find.apply(collection, args), db);
        });
        return this;
    }

});

module.exports = MongoDb;

