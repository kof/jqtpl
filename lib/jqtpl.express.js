var jqtpl = require('./jqtpl');


// add express specific tags
jqtpl.tag.partial = {
    _default: { $2: 'null' },
    open: 'if($notnull_1){_=_.concat($item.partial($1,$2));}'
};

jqtpl.tag.layout = {
    _default: { $2: 'null' },
    open: 'if($notnull_1){_=_.concat($item.layout($1,$2));}'
};


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
 * Support Express compile method (used by Express >= 2.0)
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
exports.compile = function(markup, options) {
    options = options || {};
    var name = options.filename || markup;
    
    // express calls compile if the template have to be recompiled
    // so we have to clean cache before compile
    delete jqtpl.template[name];
    
    // precompile the template and cache it using filename
    jqtpl.template(name, markup);
    
    return function render(locals) {
		var tpl = jqtpl.tmpl(name, locals, options);

	    if (options.debug) {
            // print the template generator fn
	        exports.debug(jqtpl.template[name]);
	    }
	
		return tpl;
	};
};

/**
 * Clear cache
 * @export
 */
exports.clearCache = function() {
    var cache = jqtpl.template,
        name;
    for (name in cache) {
        if (cache.hasOwnProperty(name)) {
            delete cache[name];
        }
    }
};