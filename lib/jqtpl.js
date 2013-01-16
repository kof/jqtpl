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

var rTags = /\$\{([^\}]*)\}/g,
    /*
        /\{\{ - "{{" start tag
        (\/?) - "/" closing tag
        (\w+|.) - "tag" tag name
        (?:\(((?:[^\}]|\}(?!\}))*?)?\))? - "(args)" function call
        (?:\s+(.*?)?)? - " bla" white space and property name
        (\((?:[^\}]|\}(?!\})*?)\))? - "(args)" function call
        \s* - whitespace
        \}\}/g; - "}}" end tag
    */
    rParser = /\{\{(\/?)(\w+|.)(?:\(((?:[^\}]|\}(?!\}))*?)?\))?(?:\s+(.*?)?)?(\((?:[^\}]|\}(?!\})*?)\))?\s*\}\}/g,
    rEscapedWhite = /\\n|\\t|\\r/g;

/**
 * Build reusable function for template generation
 *
 * @param {String} markup html string.
 * @return {Function} reusable template generator function.
 * @api private
 */
function build(markup) {
    var compiled, body,

        // A common context for pre/post compilers for state sharing.
        context = {};

    markup = markup.trim();

    if (exports.pre.length) {
        $.each(exports.pre, function(fn) {
            markup = fn.call(context, markup);
        });
    }

    // Convert the template into pure JavaScript.
    compiled = $.escape(markup)
        .replace(rTags, '{{= $1}}')
        .replace(rParser, function(match, slash, type, fnargs, target, parens, offset, str) {
            var tag = exports.tag[type], def, expr, exprAutoFnDetect,
                args,
                tagImpl,
                inner,
                ret;

            if (!tag) {
                throw new Error('Unknown template tag: ' + type);
            }

            def = tag.default || [];

            if (parens && !/\w$/.test(target)) {
                target += parens;
                parens = '';
            }

            if (target) {
                target = $.unescape(target).replace(rEscapedWhite, '');
                args = parens ? ')' : '';

                // Supported port for target being things like a.toLowerCase().
                // In that case don't call with template item as 'this' pointer. Just evaluate...
                expr = parens ? (target.indexOf('.') > -1 ? target + $.unescape(parens) : ('(' + target + ').call($data' + args)) : target;
                exprAutoFnDetect = parens ? expr : '(typeof(' + target + ')==="function"?(' + target + ').call($data):(' + target + '))';
            } else {
                exprAutoFnDetect = expr = def.$1 || null;
            }

            fnargs = $.unescape(fnargs);

            ret = '";';

            tagImpl = tag[slash ? 'close' : 'open'];

            if (tagImpl) {
                ret += tagImpl
                    .split('$notnull1').join(target ? 'typeof(' + target + ')!=="undefined" && (' + target + ')!=null' : true)
                    .split('$1a').join(exprAutoFnDetect)
                    .split('$1').join(expr)
                    .split('$2').join(fnargs || def.$2 || null);
            }

            ret += '__+="';

            return ret;
        });

    if (exports.post.length) {
        $.each(exports.post, function(fn) {
            compiled = fn.call(context, compiled);
        });
    }

    // Function body
    body =
        'var __="";' +

        // Introduce the data as local variables using with(){}.
        'with($data){' +
            '__+="' + compiled + '";' +
        '}' +
        'return __;';

    return new Function('$', '$data', 'undefined', body);
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

    if (data && $.isArray(data)) {
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

        // Partial target parameter can be of type function, so use $1,
        // not $1a (so not auto detection of functions) This means that
        // {{partial foo}} treats foo as a template (which IS a function).
        // Explicit parens can be used if foo is a function that returns
        // a template: {{partial foo()}}.
        open: 'if($notnull1){__+=$.partial($1,$2,$data)}'
    },
    each: {
        default: {$2: '$value,$index'},
        open: 'if($notnull1){$.each($1a,function($2){',
        close: '});}'
    },

    // Uncoded expression evaluation.
    html: {
        open: 'if($notnull1){__+=$1a}'
    },
    'if': {
        open: 'if(($notnull1) && $1a){',
        close: '}'
    },
    'else': {
        default: {$1: true},
        open: '}else if(($notnull1) && $1a){'
    },

    // Encoded expression evaluation. Abbreviated form is ${}.
    '=': {
        default: {$1: '$data'},
        open: 'if($notnull1){__+=$.escapeHtml($1a)}'
    },

    // Comment tag. Skipped by parser.
    '!': {}
};

/**
 * Precompiler functions, which will be called before the main compilation steps.
 *
 * @type {Array}.
 * @api public
 */
exports.pre = [];

/**
 * Postcompiler functions, which will be called after the main compilation steps.
 *
 * @type {Array}.
 * @api public
 */
exports.post = [];

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

    if ($.isArray(obj)) {
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

/**
 * Escape template.
 *
 * @param {String} template.
 * @return {String}
 * @api private
 */
$.escape = function(str) {
    return str.replace(/([\\"])/g, '\\$1')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
};

/**
 * Unescape template.
 *
 * @param {String} template.
 * @return {String}
 * @api private
 */
$.unescape = function(args) {
    return args ? args.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\') : null;
};

/**
 * Use this technique because, because Array.isArray is not in
 * couchdb env and instanceof will not work if different global contexts used.
 *
 * @param {Object} obj any object.
 * @return {Boolean}
 * @api private
 */
$.isArray = Array.isArray || function(obj) {
    return {}.toString.call(obj) === '[object Array]';
};

}(typeof exports == 'object' ? exports : (this.jqtpl = {})));
