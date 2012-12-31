var jqtpl = require('./jqtpl'),
    express = require('express'),
    fs = require('fs'),
    path = require('path');

if (parseInt(express.version.split('.')[0], 10) < 3) {
    throw Error('Express version 3.x required.');
}

jqtpl.tag.layout = {
    default: {__2: 'null'},
    open: 'if(__notnull_1){__res=__res.concat(__jqtpl.layout(__1,__2,__data));}'
};

/**
 * Merge obj2 to obj1 without overriding properties of obj1.
 *
 * @param {Object} obj1.
 * @param {Object} obj2.
 * @return {Object} obj1.
 * @api private
 */
function defaults(obj1, obj2) {
    var key;

    for (key in obj2) {
        if (obj1[key] == null) {
            obj1[key] = obj2[key];
        }
    }

    return obj1;
}

/**
 * Create an absolute path with ext from:
 *
 *   - absolute path relative to the views dir
 *   - relative to parent view path
 *
 * @param {String} path.
 * @param {Object} options.
 * @return {String}.
 * @api private
 */
function resolvePath(_path, options) {
    var base = options.settings.views;

    // If path is relative - use the directory of parent template as base path.
    if (path[0] == '.') {
        base = path.dirname(options.__path);
    }

    _path = path.resolve(base, _path);

    if (!path.extname(_path)) {
        _path += '.' + options.settings['view engine'];
    }

    return _path;
}

jqtpl.layout = function(path, options, parentOptions) {
    parentOptions.__layout = resolvePath(path, parentOptions);
    return '';
};

jqtpl.partial = function(path, options, parentOptions) {

    // Merge parent options with user data to be consistent to current express behaviour.
    // Don't like it though https://github.com/visionmedia/express/issues/1386
    options = defaults(options || {}, parentOptions);
    path = resolvePath(path, options);

    return exports.render(path, options);
};

function resolveLayoutPath(options) {
    var layout,
        path;

    if (options.__layout) {
        layout = options.__layout;
    } else if (options.settings &&
        options.settings['view options'] &&
        options.settings['view options'].layout) {
        layout = options.settings['view options'].layout;
    } else {
        return;
    }

    path = layout == true ? 'layout' : layout;
    return resolvePath(path, options);
}

function render(path, options, callback) {
    var layoutPath,
        str;

    try {
        str = jqtpl.render(path, options);
    } catch(err) {
        if (callback) {
            return callback(err);
        }

        throw err;
    }

    if (!options.__isLayout) {
        layoutPath = resolveLayoutPath(options);
        if (layoutPath) {
            options.__isLayout = true;
            options.body = str;
            return exports.render(layoutPath, options, callback);
        }
    }

    if (callback) {
        callback(null, str);
    } else {
        return str;
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

    if (callback) {
        fs.readFile(path, 'utf8', function(err, str) {
            if (err) {
                return callback(err);
            }

            jqtpl.compile(str, path);
            render(path, options, callback);
        });
    } else {
        jqtpl.compile(fs.readFileSync(path, 'utf8'), path);
        return render(path, options);
    }
};
