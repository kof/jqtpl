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
 * Iterate over array or object ala jquery.
 * @param {Object|Array} obj object or array to iterate over.
 * @param {Function} callback function.
 * @api public
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
 * @param {String} str html string.
 * @return {String} str escaped html string.
 * @api public
 */
exports.encode = function(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/'/g, '&#39;')
        .replace(/"/g, '&quot;');
};

/**
 * Tags supported by the engine.
 * @type {Object}
 * @api public
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
        open: 'if($notnull_1){_.push($.encode($1a));}'
    },
    '!': {
        // Comment tag. Skipped by parser
        open: ''
    },
    'verbatim': {}
};

/**
 * Escape template.
 * @param {String} args template.
 * @return {String} args
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
 * @param {String} args template.
 * @return {String} args
 * @api private
 */
function unescape(args) {
    return args ? args.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\') : null;
}

/**
 * Build reusable function for template generation
 *
 * @param {String} markup html string.
 * @return {Function} reusable template generator function.
 * @api private
 */
function buildTmplFn(markup) {
    var verbatims = [],
        rverbatim = /\{\{verbatim\}\}((.|\n)*?)\{\{\/verbatim\}\}/g;

    // save all the data inside the verbatim tags
    markup = markup.replace(rverbatim, function(all, content) {
        verbatims.push(content);

        // replace the {{verbatim}}data{{/verbatim}} with just {{verbatim}}
        // this tag will let the parser know where to inject the corresponding data
        return "{{verbatim}}";
    });


    return new Function('$', '$item',
        'var call,_=[],$data=$item.data;' +

        // Introduce the data as local variables using with(){}
        'with($data){_.push("' +

            // Convert the template into pure JavaScript
            escape(markup.trim())
                .replace(/\$\{([^\}]*)\}/g, '{{= $1}}')
                .replace(/\{\{(\/?)(\w+|.)(?:\(((?:[^\}]|\}(?!\}))*?)?\))?(?:\s+(.*?)?)?(\(((?:[^\}]|\}(?!\}))*?)\))?\s*\}\}/g,
                    function(all, slash, type, fnargs, target, parens, args) {
                        var tag = exports.tag[type], def, expr, exprAutoFnDetect,
                            rEscapedWhite = /\\n|\\t|\\r/g;

                        if (!tag) {
                            throw new Error('Template command not found: ' + type);
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
                            '_.push("';
                    }
                ) +
        '");}return _.join("");'
    );
}

/**
 * Generate reusable function and cache it using name or markup as a key
 *
 * @param {String} name of the template.
 * @param {String} markup html string - optional.
 * @return {Function|undefined} reusable template generator function.
 * @api public
 */
exports.template = function template(name, markup) {
    name = name || markup;

    var fn = template[name];

    if (markup != null && !fn) {
        // Generate a reusable function that will serve as a template
        // generator (and which will be cached).
        try {
            fn = template[name] = buildTmplFn(markup);
        } catch(err) {
            throw new Error('CompilationError: ' + err + '\nTemplate: ' + name);
        }
    }

    return fn;
};



/**
 * Render nested template
 * @param {String} tmpl path to the view
 * @param {Object} data object optional.
 * @param {Object} options optional.
 * @return {String} rendered template.
 * @api private
 */
function nest(tmpl, data, options) {
    return exports.tmpl(exports.template(tmpl), data, options);
}

/**
 * Render template
 * @param {String|Function} markup html markup or precompiled markup name.
 * @param {Object} data can be used in template as template vars.
 * @param {Object} options additional options.
 * @return {String} ret rendered markup string.
 * @api public
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
