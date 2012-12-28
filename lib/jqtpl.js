/*jslint evil: true*/
/**
 * Port of jQuery's Template Engine to Nodejs.
 * http://github.com/jquery/jquery-tmpl
 *
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * @author Oleg Slobodskoi
 */


/**
 * Use this technique because, because Array.isArray is not in
 * couchdb env and instanceof will not work if different global contexts used.
 *
 * @param {Object} obj any object.
 * @return {Boolean}
 * @api private
 */
var isArray = Array.isArray || function(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
};

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

var rverbatim = /\{\{verbatim\}\}((.|\n)*?)\{\{\/verbatim\}\}/g,
    rtags = /\$\{([^\}]*)\}/g,
    rparser = /\{\{(\/?)(\w+|.)(?:\(((?:[^\}]|\}(?!\}))*?)?\))?(?:\s+(.*?)?)?(\(((?:[^\}]|\}(?!\}))*?)\))?\s*\}\}/g;

/**
 * Build reusable function for template generation
 *
 * @param {String} markup html string.
 * @return {Function} reusable template generator function.
 * @api private
 */
function compile(markup) {
    var verbatims = [];

    return new Function('$', '$item',
        'var __res=[], $data=$item.data;' +

        // Introduce the data as local variables using with(){}
        'with($data){__res.push("' +

            // Convert the template into pure JavaScript.
            escape(markup)
                .trim()
                // Save all the data inside the verbatim tags.
                .replace(rverbatim, function(all, content) {
                    verbatims.push(content);

                    // replace the {{verbatim}}data{{/verbatim}} with just {{verbatim}}
                    // this tag will let the parser know where to inject the corresponding data
                    return "{{verbatim}}";
                })
                .replace(rtags, '{{= $1}}')
                .replace(rparser, function(all, slash, type, fnargs, target, parens, args) {
                    var tag = exports.tag[type], def, expr, exprAutoFnDetect,
                        rEscapedWhite = /\\n|\\t|\\r/g;

                    if (!tag) {
                        throw new Error('Tag not found: ' + type);
                    }

                    if (type == 'verbatim') {

                        // inject the corresponding verbatim data
                        return escape(verbatims.shift());
                    }

                    def = tag._default || [];

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
                        '__res.push("';
                }) +
        '");}return __res.join("");'
    );
}

/**
 * Tags supported by the engine.
 *
 * @type {Object}
 * @api public
 */
exports.tag = {
    partial: {
        _default: { $2: 'null' },
        open: 'if($notnull_1){__res=__res.concat($.render($1,$2));}'
        // tmpl target parameter can be of type function, so use $1,
        // not $1a (so not auto detection of functions) This means that
        // {{tmpl foo}} treats foo as a template (which IS a function).
        // Explicit parens can be used if foo is a function that returns
        // a template: {{tmpl foo()}}.
    },
    each: {
        _default: { $2: '$index, $value' },
        open: 'if($notnull_1){$.each($1a,function($2){with(this){',
        close: '}});}'
    },
    verbatim: {},
    html: {
        // Unecoded expression evaluation.
        open: 'if($notnull_1){__res.push($1a);}'
    },
    'if': {
        open: 'if(($notnull_1) && $1a){',
        close: '}'
    },
    'else': {
        _default: { $1: 'true' },
        open: '}else if(($notnull_1) && $1a){'
    },
    '=': {
        // Encoded expression evaluation. Abbreviated form is ${}.
        _default: { $1: '$data' },
        open: 'if($notnull_1){__res.push($.escapeHtml($1a));}'
    },
    '!': {
        // Comment tag. Skipped by parser
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
 * Generate reusable function and cache it using name or markup as a key.
 *
 * @param {String?} optional name of the template.
 * @param {String} markup html string.
 * @return {Function} reusable template generator function.
 * @api public
 */
exports.compile = function(name, markup) {
    var fn = cache[name];

    markup || (markup = name);

    if (markup == null) {
        throw new Error('Either `markup` or `name` is required.');
    }

    if (!fn) {
        // Generate a reusable function that will serve as a template
        // generator (and which will be cached).
        try {
            fn = cache[name] = compile(markup);
        } catch(err) {
            err.message += ': ' + markup;
            throw err;
        }
    }

    return fn;
};

/**
 * Render a template.
 *
 * @param {String} markup or cached name.
 * @param {Object?} data used as template vars.
 * @param {Object?} additional options.
 * @return {String} rendered markup string.
 * @api public
 */
exports.render = function(markup, data, options) {
    var fn = exports.cache[markup] || exports.compile(markup),
        ret = '', i;

    data || (data = {});
    options || (options = {});
    options.data = data;

    if (isArray(data)) {
        for (i = 0; i < data.length; ++i) {
            options.data = data[i];
            ret += fn.call(options.scope, exports, options);
        }
    } else {
        ret = fn.call(options.scope, exports, options);
    }

    return ret;
};

/**
 * Iterate over array or object ala jquery.
 * @param {Object|Array} obj object or array to iterate over.
 * @param {Function} callback function.
 * @api private
 */
exports.each = function(obj, callback) {
    var key;

    if (isArray(obj)) {
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
 *
 * @param {String} str html string.
 * @return {String} str escaped html string.
 * @api private
 */
exports.escapeHtml = function(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/'/g, '&#39;')
        .replace(/"/g, '&quot;');
};
