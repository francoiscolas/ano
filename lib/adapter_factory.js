var AdapterFactory = {

    create: function (url, options) {
        var name = url.substr(0, url.indexOf(':'));

        if (name === 'mongodb')
            return new (require('./adapters/mongodb'))(url, options);
        return null;
    }

};

module.exports = AdapterFactory;

