/**
 * Port of jQuery's Template Engine to Nodejs.
 * 
 * 
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * 
 * @version 0.0.1
 * @credits http://github.com/jquery/jquery-tmpl 
 * @author Oleg Slobodskoi
 */

// pre-built template functions cache
var cache = {};

exports.utils = {
    each: function( arr, callback ) {
        for ( var i=0; i<arr.length; ++i ) {
            callback.call( arr[i], i, arr[i] );
        }
    },
    escape: function( str ) {
        return String(str)
            .replace(/&(?!\w+;)/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/'/g, "&#39")
            .replace(/"/g, "&quot;");        
    }    
};

exports.cmd = {
	 "tmpl": {
		_default: [ null, "this" ],
		prefix: "_.push(render.call(this, $1, $2 ));"
	},
    "each": {
        _default: [ null, "$index, $value" ],
        prefix: "utils.each($1,function($2){with(this){",
        suffix: "}});"
    },
    "if": {
        _default: [null],
        prefix: "if($1){",
        suffix: "}"
    },
    "else": {
        _default: [null],
        prefix: "}else{"
    },
    "html": {
        _default: [ "this" ],
        prefix: "_.push(typeof $1==='function'?$1.call(this):$1);"
    },
    "=": {
        _default: [ "this" ],
        prefix: "_.push(utils.escape(typeof $1==='function'?$1.call(this):$1));"
    }
};
 
exports.parse = function( str ) {
    return "var _=[];_.data=$data;_.index=$i;" +

    // Introduce the data as local variables using with(){}
    "with($data){_.push('" +

        // Convert the template into pure JavaScript
        str
            .replace(/[\r\t\n]/g, " ")
            .replace(/\${([^}]*)}/g, "{{= $1}}")
            .replace(/{{(\/?)(\w+|.)(?:\((.*?)\))?(?: (.*?))?}}/g, function(all, slash, type, fnargs, args) {
                var tmpl = exports.cmd[ type ];
            
                if ( !tmpl ) {
                    throw "Template not found: " + type;
                }
            
                var def = tmpl._default;
            
                return "');" + tmpl[slash ? "suffix" : "prefix"]
                    .split("$1").join(args || def[0])
                    .split("$2").join(fnargs || def[1]) + "_.push('";
            })
    + "');}return _.join('');";    
}; 

exports.render = function( str, data ) {
    if ( typeof str !== "string" ) {
        throw "Bad template passed."
    }
    
    var dataType,
        fn = cache[str],
        context,
        ret;
            
    if ( !data ) {
        data = {};
        dataType = "object";
    } else {
        dataType = Array.isArray(data  ) ? "array" : typeof data;
    }
    
    if ( !fn ) {
        // Generate a reusable function that will serve as a template
        // generator (and which will be cached).
        fn = cache[str] = new Function( "$data", "utils", "render", "$i", exports.parse(str) );
    }
    
    context = data.context || {};

    if ( dataType === "object" ) {
        ret = fn.call( context, data, exports.utils, exports.render );
    } else if ( dataType === "array" ) {
        ret = "";
        data.forEach(function( data, i ){
            ret += fn.call( context, data, exports.utils, exports.render, i );    
        });
    }
    
    return ret; 
};

exports.clearCache = function() {
    cache = {};
};