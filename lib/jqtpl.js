/*jslint evil: true*/
/**
 * Port of jQuery's Template Engine to Nodejs.
 * http://github.com/jquery/jquery-tmpl
 *
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 *
 * @author Oleg Slobodskoi
 */


/**
 * Print debugging information to stdout, export print method,
 * to let other commonjs systems without "util" to mock it.
 * @param {*} data any kind of data.
 * @export
 */
exports.debug = function(data) {
    var util = require('util');
    util.debug.apply(util, arguments);
};

/**
 * Iterate over array or object ala jquery.
 * @param {Object} obj any plain object.
 * @param {Function} callback function.
 * @export
 */
exports.each = function(obj, callback) {
    var key;

    if (obj instanceof Array) {
        for (key = 0; key < obj.length; ++key) {
            callback.call(obj[key], key, obj[key]);
        }
    } else {
        for (key in obj) {
            callback.call(obj[key], key, obj[key]);
        }
    }
};

/**
 * Escape html chars.
 * @param {string} str html string.
 * @return {string} str escaped html string.
 * @export
 */
exports.escape = function(str) {
    return String(str)
        .replace(/&(?!\w+;)/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/'/g, '&#39')
        .replace(/"/g, '&quot;');
};

/**
 * Tags supported by the engine.
 * @type {Object}
 * @export
 */
exports.tag = {
    'tmpl': {
        _default: { $2: 'null' },
        open: 'if($notnull_1){_=_.concat($item.nest($1,$2));}'
        // tmpl target parameter can be of type function, so use $1,
        // not $1a (so not auto detection of functions) This means that
        // {{tmpl foo}} treats foo as a template (which IS a function).
        // Explicit parens can be used if foo is a function that returns
        // a template: {{tmpl foo()}}.
    },
    'wrap': {
        _default: { $2: 'null' },
        open: '$item.calls(_,$1,$2);_=[];',
        close: 'call=$item.calls();_=call._.concat($item.wrap(call,_));'
    },
    'each': {
        _default: { $2: '$index, $value' },
        open: 'if($notnull_1){$.each($1a,function($2){with(this){',
        close: '}});}'
    },
    'if': {
        open: 'if(($notnull_1) && $1a){',
        close: '}'
    },
    'else': {
        _default: { $1: 'true' },
        open: '}else if(($notnull_1) && $1a){'
    },
    'html': {
        // Unecoded expression evaluation.
        open: 'if($notnull_1){_.push($1a);}'
    },
    '=': {
        // Encoded expression evaluation. Abbreviated form is ${}.
        _default: { $1: '$data' },
        open: 'if($notnull_1){_.push($.escape($1a));}'
    },
    '!': {
        // Comment tag. Skipped by parser
        open: ''
    }
};


/**
 * Support Express render method
 *
 * @param {string} markup html string.
 * @param {Object} options
 *     `locals` Local variables object.
 *     `cache` Compiled functions are cached, requires `filename`.
 *     `filename` Used by `cache` to key caches.
 *     `scope` Function execution context.
 *     `debug` Output generated function body.
 *
 * @return {string} rendered html string.
 * @export
 */
exports.render = function(markup, options) {
    var name = options.filename || markup,
        tpl;

    // precompile the template and cache it using filename
    exports.template(name, markup);

    tpl = exports.tmpl(name, options.locals, options);

    if (options.debug) {
        exports.debug(exports.template[name]);
    }

    if (!options.cache) {
        delete exports.template[name];
    }

    return tpl;
};

/**
 * Nested template, using {{tmpl}} tag
 *
 * @param {string} tmpl markup or filename.
 * @param {Object=} data object passed to the partial.
 * @param {Object=} options optional express options.
 * @this {Object} http.ServerResponse per default if scope is not set.
 * @return {string} rendered template.
 * @export
 */
function tiNest(tmpl, data, options) {
    options = options || {};
    options.locals = data;
    options.layout = false;
    options.partial = true;
    options.scope = this.scope;
    var markup, error;
    // express way
    if (this.scope && this.scope.res && this.scope.res.render) {
        //console.error(this.scope.res.render+"");
        markup = this.scope.res.render(tmpl, options, function(err, str) {
            error = err;
            markup = str;
        });

        if (!error && markup !== undefined) {
            tmpl = markup;
        }
    }

    return exports.render(tmpl, options);
}

/**
 * Unescape template.
 * @param {string} args template.
 * @return {string} args
 */
function unescape(args) {
    return args ? args.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\') : null;
}

/**
 * Build reusable function for template generation
 *
 * @param {string} markup html string.
 * @return {Function} reusable template generator function.
 * @export
 */
function buildTmplFn(markup) {
    return new Function('$', '$item',
        'var call,_=[],$data=$item.data;' +

        // Introduce the data as local variables using with(){}
        'with($data){_.push("' +

            // Convert the template into pure JavaScript
            markup
                .trim()
                .replace(/([\\"])/g, '\\$1')
                .replace(/[\r\t\n]/g, '')
                .replace(/\$\{([^\}]*)\}/g, '{{= $1}}')
                .replace(/\{\{(\/?)(\w+|.)(?:\(((?:[^\}]|\}(?!\}))*?)?\))?(?:\s+(.*?)?)?(\(((?:[^\}]|\}(?!\}))*?)\))?\s*\}\}/g,
                    function(all, slash, type, fnargs, target, parens, args) {
                        var tag = exports.tag[type], def, expr, exprAutoFnDetect;

                        if (!tag) {
                            throw new Error('Template command not found: ' + type);
                        }

                        def = tag._default || [];

                        if (parens && !/\w$/.test(target)) {
                            target += parens;
                            parens = '';
                        }

                        if (target) {
                            target = unescape(target);
                            args = args ? (',' + unescape(args) + ')') : (parens ? ')' : '');
                            // Support for target being things like a.toLowerCase();
                            // In that case don't call with template item as 'this' pointer. Just evaluate...
                            expr = parens ? (target.indexOf('.') > -1 ? target + unescape(parens) : ('(' + target + ').call($item' + args)) : target;
                            exprAutoFnDetect = parens ? expr : '(typeof(' + target + ')==="function"?(' + target + ').call($item):(' + target + '))';
                        } else {
                            exprAutoFnDetect = expr = def.$1 || 'null';
                        }
                        fnargs = unescape(fnargs);
                        return '");' +
                            tag[slash ? 'close' : 'open']
                                .split('$notnull_1').join(target ? 'typeof(' + target + ')!=="undefined" && (' + target + ')!=null' : 'true')
                                .split('$1a').join(exprAutoFnDetect)
                                .split('$1').join(expr)
                                .split('$2').join(fnargs || def.$2 || '') +
                            '_.push("';
                    }
                ) +
        '");}return _.join("");'
    );
}

/**
 * Generate reusable function and cache it using name or markup as a key
 *
 * @param {?string} name of the template.
 * @param {string} markup html string.
 * @return {Function|undefined} reusable template generator function.
 * @export
 */
exports.template = function template(name, markup) {
    if (typeof markup !== 'string') {
        throw new Error('bad template');
    }

    if (!name) {
        name = markup;
    }

    var fn = template[name];

    if (!fn) {
        // Generate a reusable function that will serve as a template
        // generator (and which will be cached).
        fn = template[name] = buildTmplFn(markup);
    }

    return fn;
};

/**
 * Clear cache
 * @export
 */
exports.clearCache = function() {
    var cache = exports.template,
        name;
    for (name in cache) {
        if (cache.hasOwnProperty(name)) {
            delete cache[name];
        }
    }
};

/**
 * Render template
 * @param {string} markup html markup or precompiled markup name.
 * @param {*} data can be used in template as template vars.
 * @param {Object=} options additional options.
 * @return {string} ret rendered markup string.
 * @export
 */
exports.tmpl = function(markup, data, options) {
    var fn = exports.template(null, markup),
        dataType,
        ret;

    data = data || {};
    options = options || {};
    options.data = data;
    options.nest = tiNest;

    if (data instanceof Array) {
        ret = '';
        data.forEach(function(data) {
            options.data = data;
            ret += fn.call(options.scope, exports, options);
        });
    } else {
        ret = fn.call(options.scope, exports, options);
    }

    return ret;
};
