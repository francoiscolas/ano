var Types = {

    Boolean: {
        cast: function (value) {
            if (value === null || value === undefined)
                return null;
            else
                return !!value;
        }
    },

    Date: {
        cast: function (value) {
            if (value === null || value === undefined)
                return null;
            else
                return new Date(value);
        }
    },

    Number: {
        cast: function (value) {
            if (value === null || value === undefined)
                return null;
            else
                return Number(value);
        }
    },

    String: {
        cast: function (value) {
            if (value === null || value === undefined)
                return null;
            else
                return String(value);
        }
    },

    Text: {
        cast: function (value) {
            if (value === null || value === undefined)
                return null;
            else
                return String(value);
        },
    },

    ObjectID: {
        cast: function (value) {
            var ObjectID = require('mongodb').ObjectID;

            if (value === null || value === undefined)
                return null;
            else
                return !(value instanceof ObjectID) ? new ObjectID(value) : value;
        }
    },

    isValid: function (type) {
        return type === this.Boolean
            || type === this.Date
            || type === this.Number
            || type === this.String
            || type === this.Text
            || type === this.ObjectID;
    },

    fromNative: function (type) {
        if (type === Boolean) return this.Boolean;
        if (type === Date) return this.Date;
        if (type === Number) return this.Number;
        if (type === String) return this.String;
        return type;
    }

};

module.exports = Types;

