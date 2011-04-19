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
 * @return {boolean}
 */
var isArray = Array.isArray || function(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';    
};


/**
 * Iterate over array or object ala jquery.
 * @param {Object|Array} obj object or array to iterate over.
 * @param {Function} callback function.
 * @export
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
 * @param {string} str html string.
 * @return {string} str escaped html string.
 * @export
 */
exports.escape = function(str) {
    return String(str)
        .replace(/&(?!\w+;)/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/'/g, '&#39;')
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
                .replace(/\n/g, '\\n')
                .replace(/\r/g, '\\r')
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
 * @param {string} name of the template.
 * @param {string=} markup html string.
 * @return {Function|undefined} reusable template generator function.
 * @export
 */
exports.template = function template(name, markup) {
    name = name || markup;
    
    var fn = template[name];

    if (markup && !fn) {
        // Generate a reusable function that will serve as a template
        // generator (and which will be cached).
        fn = template[name] = buildTmplFn(markup);
    }

    return fn;
};



/**
 * Render nested template
 * @param {string} tmpl path to the view
 * @param {Object=} data data object.
 * @param {Object=} options optional options.
 * @return {string} rendered template.
 */
function nest(tmpl, data, options) {
    return exports.tmpl(exports.template(tmpl), data, options);        
}

/**
 * Render template
 * @param {string|Function} markup html markup or precompiled markup name.
 * @param {*} data can be used in template as template vars.
 * @param {Object=} options additional options.
 * @return {string} ret rendered markup string.
 * @export
 */
exports.tmpl = function(markup, data, options) {
    var fn = typeof markup === 'function' ? markup : exports.template(null, markup),
        ret = '', i;

    data = data || {};
    options = options || {};
    options.data = data;
    options.nest = nest;

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
