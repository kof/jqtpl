var express = require('express'),
    _ = require('underscore'),
    request = require('request');

var options;

options = {
    root: __dirname + '/fixtures',
    protocol: 'http',
    host: 'localhost',
    port: 7000
};

options.express = {
    views: options.root + '/1',
    'view engine': 'html'
};

function createServer() {
    var server = express();

    _.each(options.express, function(val, name) {
        server.set(name, val);
    });

    server.use(express.bodyParser());
    server.engine('html', __express);

    server.post('/*', function(req, res){
        res.render(req.url.substr(1), req.body);
    });

    server.listen(options.port);

    return server;
}

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
            equal(err, null, 'Request errored.');
        }

        callback(res.body);
    });
}

var server = createServer();

test("locals", function() {
    expect(1);
    stop();
    post('/view', {a:1}, function(data) {
       equal(data, '<div>1</div>', 'template rendered correctly');
       start();
    });
});

test("partials", function() {
    expect(1);
    stop();
    post('/partialtest', {test: {a: 1}}, function(data) {
        equal(data, '<div>1</div>', 'data is an object');
        start();
    });
});

test("partials 2", function() {
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
        equal(data, html, 'layout rendered correctly');
        post('/layouttest', function(data) {
            ok(data, html, 'if caching is turned on, second call should work too #46');
            start();
        });
    });
});
return;

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

