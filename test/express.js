var express = require('express'),
    _ = require('underscore'),
    request = require('request');

var server,
    options;

options = {
    root: __dirname + '/fixtures',
    protocol: 'http',
    host: 'localhost',
    port: 7000
};

options.express = {
    views: options.root + '/1',
    'view engine': 'html',
    'view options': {layout: false}
};

server = createServer();

function post(path, data, callback) {
    if (!callback) {
        callback = data;
        data = null;
    }
    request({
        method: 'post',
        url: options.protocol + '://' + options.host + ':' + options.port + path,
        json: data
    }, function(err, res) {
        if (err) {
            throw new Error(err);
        }

        callback(res.body);
    });
}

function createServer(opts) {
    var server = express.createServer(express.bodyParser()),
        eo = _.defaults(opts || {}, options.express);

    _.each(eo, function(val, name) {
        server.set(name, val);
    });

    // qunit copies jqtpl.express exports to global
    server.register('.html', global);

    server.post('/*', function(req, res){
        if (req.body) {
            req.body.as = global;
        }
        res.render(req.url.substr(1), req.body);
    });

    server.listen(options.port);
    return server;
}

test("locals", function() {
    expect(1);
    stop();
    post('/view', {a:1}, function(data) {
       equal(data, '<div>1</div>', 'template rendered correctly');
       start();
    });
});

test("scope option", function() {
    var fn = compile( "<div>${this.test}</div>", {scope: {test: 123}} );
    same(fn({a:1}), '<div>123</div>', "scope is correct");
});

test("debug option", function() {
    var printed,
        util = require( "util" ),
        debug = util.debug;

    // mock print method
    util.debug = function( str ) {
        printed = true;
    };

    compile( 'test', {debug: true} )();

    // restore orig. print function
    util.debug = debug;

    ok( printed, "debug option works" );
});

test("partials using `partial`", function() {
    expect(1);
    stop();
    post('/partialtest', {test: {a: 1}}, function(data) {
        equal(data, '<div>1</div>', 'data is an object');
        start();
    });
});

test("partials using `partial`", function() {
    expect(1);
    stop();
    var data = {
            test: [
                {a: 1},
                {a: 2},
                {a: 3}
            ]
        };
    post('/partialtest', data, function(data) {
        equal(data, '<div>1</div><div>2</div><div>3</div>', 'data is an array');
        start();
    });
});

test("layout tag", function() {
    var html = 'mylayout requested view mylayout';
    expect(2);
    stop();
    post('/layouttest', function(data) {
        equal(data, html, 'served html is correct');
        post('/layouttest', function(data) {
            ok(data, html, 'if caching is turned, second call should work too #46');
            start();
        });
    });
});

test("rendering multiple times of the same template #29", function() {
    var template = 'Just example ${example}'
    var je = require('../').express
    var render = je.compile(template, {filename: 'example.html'})

    equal(render({example: 'Hello'}), 'Just example Hello', 'template rendered correctly');
    equal(render({example: 'Hello'}), 'Just example Hello', 'template rendered correctly');
});

test("clean cache if template have to be recompiled", function() {
    var je = require('../').express

    var template = 'my template 1';
    var render = je.compile(template, {filename: 'template.html'});

    equal(render(), 'my template 1', 'template 1 rendered correctly');

    // now template has been changed
    template = 'my template 2';

    render = je.compile(template, {filename: 'template.html'})

    equal(render(), 'my template 2', 'template 2 rendered correctly after recompile');
});

test("rendering template with a layout turned on", function() {
    expect(1);
    stop();
    server.close();
    server = createServer({
        'view options': {layout: true},
        views: options.root + '/2'
    });

    post('/views/test', {mylocal: "mylocal"}, function(data) {
        equal(data, 'abc mylocal', 'template and layout rendered correctly');
        server.close();
        server = createServer();
        start();
    });
});

