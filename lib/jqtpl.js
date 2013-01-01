(function(exports) {

/**
 * A template engine for nodejs, browser and any other javascript environment.
 *
 * Originally started as a port of jQuery's Template Engine to Nodejs.
 * http://github.com/jquery/jquery-tmpl
 *
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * @author Oleg Slobodskoi
 */

var isArray = Array.isArray;

/**
 * Use this technique because, because Array.isArray is not in
 * couchdb env and instanceof will not work if different global contexts used.
 *
 * @param {Object} obj any object.
 * @return {Boolean}
 * @api private
 */
if (!isArray) {
    isArray = function(obj) {
        return {}.toString.call(obj) === '[object Array]';
    };
}

/**
 * Escape template.
 *
 * @param {String} template.
 * @return {String}
 * @api private
 */
function escape(str) {
    return str.replace(/([\\"])/g, '\\$1')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
}

/**
 * Unescape template.
 *
 * @param {String} template.
 * @return {String}
 * @api private
 */
function unescape(args) {
    return args ? args.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\') : null;
}

var rVerbatim = /\{\{verbatim\}\}((.|\n)*?)\{\{\/verbatim\}\}/g,
    rTags = /\$\{([^\}]*)\}/g,
    rParser = /\{\{(\/?)(\w+|.)(?:\(((?:[^\}]|\}(?!\}))*?)?\))?(?:\s+(.*?)?)?(\(((?:[^\}]|\}(?!\}))*?)\))?\s*\}\}/g,
    rEscapedWhite = /\\n|\\t|\\r/g;

/**
 * Build reusable function for template generation
 *
 * @param {String} markup html string.
 * @return {Function} reusable template generator function.
 * @api private
 */
function build(markup) {
    var verbatims = [],
        body;

    body =
        'var __body="";' +

        // Introduce the data as local variables using with(){}.
        'with(__data){' +
            '__body+="' +

                // Convert the template into pure JavaScript.
                escape(markup)
                    .trim()
                    // Save all the data inside the verbatim tags.
                    .replace(rVerbatim, function(all, content) {
                        verbatims.push(content);

                        // Replace the {{verbatim}}data{{/verbatim}} with just {{verbatim}}
                        // this tag will let the parser know where to inject the corresponding data.
                        return "{{verbatim}}";
                    })
                    .replace(rTags, '{{= $1}}')
                    .replace(rParser, function(all, slash, type, fnargs, target, parens, args) {
                        var tag = exports.tag[type], def, expr, exprAutoFnDetect;

                        if (!tag) {
                            throw new Error('Unknown template tag: ' + type);
                        }

                        if (type == 'verbatim') {

                            // Inject the corresponding verbatim data.
                            return escape(verbatims.shift());
                        }

                        def = tag.default || [];

                        if (parens && !/\w$/.test(target)) {
                            target += parens;
                            parens = '';
                        }

                        if (target) {
                            target = unescape(target).replace(rEscapedWhite, '');

                            if (args) {
                                args = ',' + unescape(args) + ')';
                                args = args.replace(rEscapedWhite, '');
                            } else {
                                args = parens ? ')' : '';
                            }

                            // Support for target being things like a.toLowerCase();
                            // In that case don't call with template item as 'this' pointer. Just evaluate...
                            expr = parens ? (target.indexOf('.') > -1 ? target + unescape(parens) : ('(' + target + ').call(__data' + args)) : target;
                            exprAutoFnDetect = parens ? expr : '(typeof(' + target + ')==="function"?(' + target + ').call(__data):(' + target + '))';
                        } else {
                            exprAutoFnDetect = expr = def.__1 || 'null';
                        }
                        fnargs = unescape(fnargs);
                        return '";' +
                            tag[slash ? 'close' : 'open']
                                .split('__notnull_1').join(target ? 'typeof(' + target + ')!=="undefined" && (' + target + ')!=null' : 'true')
                                .split('__1a').join(exprAutoFnDetect)
                                .split('__1').join(expr)
                                .split('__2').join(fnargs || def.__2 || '') +
                            '__body += "';
                    }) +
            '"' +
        '}' +
        'return __body;';

    return new Function('$', '__data', body);
}

/**
 * Render a template.
 *
 * @param {String} cached tempalte name.
 * @param {Object?} data used as template vars.
 * @return {String} rendered markup string.
 * @api private
 */
function render(name, data) {
    var fn = exports.cache[name],
        ret, i;

    if (data && isArray(data)) {
        ret = '';
        for (i = 0; i < data.length; ++i) {
            ret += fn.call({}, $, data[i]);
        }
    } else {
        ret = fn.call({}, $, data || {});
    }

    return ret;
}

/**
 * Tags supported by the engine.
 *
 * @type {Object}
 * @api public
 */
exports.tag = {
    partial: {
        default: {__2: 'null'},

        // Partal target parameter can be of type function, so use __1,
        // not __1a (so not auto detection of functions) This means that
        // {{partial foo}} treats foo as a template (which IS a function).
        // Explicit parens can be used if foo is a function that returns
        // a template: {{partial foo()}}.
        open: 'if(__notnull_1){__body+=$.partial(__1,__2,__data)}'
    },
    each: {
        default: {__2: '$value, $index'},
        open: 'if(__notnull_1){$.each(__1a,function(__2){with(this){',
        close: '}});}'
    },
    verbatim: {},

    // Uncoded expression evaluation.
    html: {
        open: 'if(__notnull_1){__body+=__1a}'
    },
    'if': {
        open: 'if((__notnull_1) && __1a){',
        close: '}'
    },
    'else': {
        default: {__1: 'true'},
        open: '}else if((__notnull_1) && __1a){'
    },

    // Encoded expression evaluation. Abbreviated form is ${}.
    '=': {
        default: {__1: '__data'},
        open: 'if(__notnull_1){__body+=$.escapeHtml(__1a)}'
    },

    // Comment tag. Skipped by parser.
    '!': {
        open: ''
    }
};

/**
 * Cached template generator functions.
 *
 * - `key` - template name or markup string.
 * - `value` - compiled template function.
 *
 * @type {Object}
 * @api public
 */
exports.cache = {};

/**
 * Build a reusable function and cache it using name or markup as a key.
 *
 * @param {String} markup html string.
 * @param {String?} optional name of the template.
 * @return {Function} reusable template generator function.
 * @api public
 */
exports.compile = function(markup, name) {
    if (markup == null) {
        throw new Error('Param `markup` is required.');
    }

    name || (name = markup);

    if (!exports.cache[name]) {

        // Generate a reusable function that will serve as a template
        // generator (and which will be cached).
        try {
            exports.cache[name] = build(markup);
        } catch(err) {
            err.message += ': ' + name;
            err.markup = markup;
            throw err;
        }
    }

    return function(data) {
        return render(name, data);
    };
};

/**
 * Compile and render a template.
 *
 * @param {String} markup or cached name.
 * @param {Object?} data used as template vars.
 * @return {String} rendered markup string.
 * @api public
 */
exports.render = function(markup, data) {
    return exports.compile(markup)(data);
};

/**
 * Global helpers namespace - make functions available in every template.
 * Use this namespace in custom tags.
 *
 * @type {Object}
 * @api public
 */
var $ = exports.$ = {};

/**
 * Can be overridden to provide platform specific functionality like
 * loading files by name.
 */
$.partial = exports.render;

/**
 * Iterate over array or object.
 *
 * @param {Object|Array} obj object or array to iterate over.
 * @param {Function} callback function.
 * @api private
 */
$.each = function(obj, callback) {
    var key;

    if (isArray(obj)) {
        for (key = 0; key < obj.length; ++key) {
            callback.call(obj[key], obj[key], key);
        }
    } else {
        for (key in obj) {
            callback.call(obj[key], obj[key], key);
        }
    }
};

/**
 * Escape html chars.
 *
 * @param {String} str html string.
 * @return {String} str escaped html string.
 * @api private
 */
$.escapeHtml = function(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/'/g, '&#39;')
        .replace(/"/g, '&quot;');
};

}(typeof exports == 'object' ? exports : (this.jqtpl = {})));
