module.exports = exports = require('./lib/jqtpl');

exports.version = require('./package.json').version;

var express;

try {
    express = require('express');
    if (parseInt(express.version.split('.')[0], 10) < 3) {
        exports.__express = require('./lib/express').render;
    } else {
        exports.__express = function() {
            console.warn('Express 3.x required.');
        };
    }
} catch(err) {}
