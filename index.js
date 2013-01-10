module.exports = exports = require('./lib/jqtpl');
exports.version = require('./package.json').version;

//require('./lib/tags/tr');
require('./lib/tags/verbatim');

var express;

try {
    express = require('express');
    if (parseInt(express.version.split('.')[0], 10) < 3) {
        exports.__express = function() {
            console.warn('Error: jqtpl@%s requires express@3.x.', exports.version);
        };
    } else {
        exports.__express = require('./lib/express').render;
    }
} catch(err) {}
