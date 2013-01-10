var jqtpl = require('./jqtpl'),
    fs = require('fs'),
    path = require('path'),
    _ = require('underscore');

jqtpl.tag.layout = {
    default: {__2: 'null'},
    open: 'if(__notnull_1){__body+=$.layout(__1,__2,__data)}'
};

/**
 * Check if path is absolute.
 * Borrowed by express.
 *
 * @param {String} path.
 * @return {Boolean}
 */
function isAbsolute(path) {
    if (path[0] == '/') {
        return true;
    }
    if (path[1] == ':' && path[2] == '\\') {
        return true;
    }
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
    var s = options.settings;

    if (isAbsolute(_path)) {
        if (_path.substr(0, s.views.length) != s.views) {
            _path = path.join(s.views, _path);
        }
    } else {
        _path = path.resolve(path.dirname(options.__path), _path);
    }

    if (!path.extname(_path)) {
        _path += '.' + s['view engine'];
    }

    return _path;
}

/**
 * Layout tag.
 *
 * @param {String} absolute path.
 * @param {Object?} user options - will overwrite current options.
 * @param {Object} current view options.
 * @return {String}
 */
jqtpl.$.layout = function(path, options, currentOptions) {
    _.extend(currentOptions, options);
    currentOptions.layout = resolvePath(path, currentOptions);

    return '';
};

/**
 * Partial tag.
 *
 * @param {String} absolute path.
 * @param {Object?} user options - will overwrite current options.
 * @param {Object} current view options.
 * @return {String}
 */
jqtpl.$.partial = function(path, options, currentOptions) {
    options = _.defaults(options || {}, currentOptions);

    if (options.__isLayout) {
        options.__path = options.__parent.__path;
    }

    path = resolvePath(path, options);

    options.__isPartial = true;

    return exports.render(path, options);
};

/**
 * Resolve layout path.
 *
 * @param {Object} current view options.
 * @return {String}
 */
function resolveLayoutPath(options) {
    var layout,
        path;

    if (options.layout === false) {
        return;
    }

    if (options.layout) {
        layout = options.layout;
    } else if (options.settings && options.settings.layout) {
        layout = options.settings.layout;
    } else {
        return;
    }

    path = layout === true ? '../layout' : layout;
    return resolvePath(path, options);
}

/**
 * Render the template, catch errors, render layout if needed.
 *
 * @param {String} absoute path.
 * @param {Object} current view options.
 * @param {Function?} callback.
 * @return {String|Undefined}
 */
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

    if (!options.__isLayout && !options.__isPartial) {
        layoutPath = resolveLayoutPath(options);
        if (layoutPath) {
            options.__parent = _.clone(options);
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

/**
 * Render a template using a path.
 *
 * @param {String} absolute path.
 * @param {Object} express options, locals and user data merged - don't like it!
 *     https://github.com/visionmedia/express/issues/1386
 * @param {Function?} callback is optional, if no callback is passed, sync loading
 *     will be done. Used for partials and layout.
 * @return {String|Undefined}
 */
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
