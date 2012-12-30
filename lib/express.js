var jqtpl = require('./jqtpl'),
    express = require('express'),
    fs = require('fs'),
    path = require('path');

if (Number(express.version[0]) < 3) {
    throw Error('Express version 3.x required.');
}

jqtpl.tag.layout = jqtpl.tag.partial;

function resolvePath(_path, options) {
    var base = options.settings.partials || path.dirname(options.__path);

    _path = path.resolve(base, _path);

    if (!path.extname(path)) {
        _path += '.' + options.settings['view engine'];
    }

    return _path;
}

jqtpl.partial = function(path, data, options) {
    var markup;

    path = resolvePath(path, options);

    try {
        markup = fs.readFileSync(path, 'utf8');
    } catch(err) {
        return jqtpl.render(path, data);
    }

    if (!options.cache) {
        delete jqtpl.cache[path];
    }

    jqtpl.compile(markup, path);

    return jqtpl.render(path, data);
};

function render(path, options, callback) {
    try {
        callback(null, jqtpl.render(path, options));
    } catch(err) {
        callback(err);
    }
}

exports.render = function(path, options, callback) {
    options.__path = path;

    if (jqtpl.cache[path] && options.cache) {
        return render(path, options, callback);
    }

    if (!options.cache) {
        delete jqtpl.cache[path];
    }

    fs.readFile(path, 'utf8', function(err, str) {
        if (err) {
            return callback(err);
        }

        jqtpl.compile(str, path);
        render(path, options, callback);
    });
};
