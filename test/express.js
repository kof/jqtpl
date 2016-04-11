var express = require('express'),
    _ = require('underscore'),
    request = require('request'),
    fs = require('fs');

var options;

options = {
    root: __dirname + '/fixtures',
    protocol: 'http',
    host: 'localhost',
    port: 7000
};

var views = options.root + '/1';

function create() {
    var app = express();

    app.engine('html', render);
    app.set('views', views);
    app.set('view engine', 'html');
    app.use(express.bodyParser());
    app.post('/*', function(req, res){
        res.render(req.url.substr(1), req.body);
    });
    app.listen(options.port);

    return app;
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
            console.error(err);
            equal(err, null, 'Request errored.');
        }

        callback(res.body);
    });
}

var app = create();

test("locals", function() {
    expect(1);
    stop();
    post('/view', {a:1}, function(data) {
       equal(data, '<div>1</div>', 'template rendered correctly');
       start();
    });
});

test("partials", function() {
    expect(2);
    stop();
    post('/partialtest', {test: {a: 1}}, function(data) {
        equal(data, '<div>1</div>', 'data is an object');
        data = {
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
});

test("partials 2", function() {
    expect(1);
    stop();
    var data = {absPartialPath: views + '/view.html'};
    post('/partialtest2', data, function(data) {
        equal(
            data,
            '<div>1</div><div>2</div><div>3</div><div>4</div><div>5</div>',
            'paths resolved correctly'
        );
        start();
    });
});

test('use layout from the current dir', function() {
    expect(1);
    stop();

    app.set('layout', true);
    app.set('views', options.root + '/3');
    // In production options are cached too.
    app.cache = {};
    post('/view', {a: "abc"}, function(data) {
        equal(data, 'layout view abc', 'template and layout rendered correctly');
        app.set('layout', false);
        app.set('views', views);
        start();
    });
});

test('use layout from the parent dir', function() {
    expect(1);
    stop();

    app.set('layout', true);
    app.set('views', options.root + '/2');
    // In production options are cached too.
    app.cache = {};
    post('/views/test', {mylocal: "mylocal"}, function(data) {
        equal(data, 'abc mylocal', 'template and layout rendered correctly');
        app.set('layout', false);
        app.set('views', views);
        start();
    });
});

test('no layout found', function() {
    var util = require('util'),
        error = util.error;

    expect(2);
    stop();

    app.set('layout', true);
    app.set('views', options.root + '/4');
    // In production options are cached too.
    app.cache = {};
    util.error = function(str) {
        equal(str, 'Layout not found in jqtpl template:', 'printed an error');
    };

    post('/view', {a: "abc"}, function(data) {
        equal(data, 'view', 'template rendered without layout');
        app.set('layout', false);
        app.set('views', views);
        util.error = error;
        start();
    });
});

test('render partial, from view with layout', function() {
    expect(1);
    stop();

    app.set('layout', true);
    app.set('views', options.root + '/2');
    // In production options are cached too.
    app.cache = {};
    post('/views/partial-and-layout', {mylocal: "layout"}, function(data) {
        equal(data, 'view partial layout', 'partial rendered without layout');
        app.set('layout', false);
        app.set('views', views);
        start();
    });
});

test('render partial from layout using relative path', function() {
    expect(1);
    stop();

    app.set('layout', '../layout2');
    app.set('views', options.root + '/2');

    post('/views/test', {mylocal: "mylocal"}, function(data) {
        equal(data, 'abc partial', 'partial path resolved correctly');
        app.set('layout', false);
        app.set('views', views);
        start();
    });
});

test("render multiple times the same template #29", function() {
    var data;

    data = {
        a: 'Hello',
        settings: {}
    };
    equal(render(views + '/view.html', data), '<div>Hello</div>', 'template rendered correctly');
    equal(render(views + '/view.html', data), '<div>Hello</div>', 'template rendered correctly 2');
    equal(render(views + '/view.html', data), '<div>Hello</div>', 'template rendered correctly 3');
});

test("template recompiled if cache disabled", function() {
    var data,
        view = views + '/view.html';

    data = {
        a: 'Hello',
        settings: {}
    };
    equal(render(view, data), '<div>Hello</div>', 'template rendered correctly');
    fs.writeFileSync(view, 'new template ${a}');
    equal(render(view, data), 'new template Hello', 'template was recompiled');
    fs.writeFileSync(view, '<div>${a}</div>');
});

test("layout tag", function() {
    var html = 'mylayout requested view mylayout';
    expect(2);
    stop();
    post('/layouttest', function(data) {
        equal(data, html, 'layout rendered correctly');
        post('/layouttest', function(data) {
            equal(data, html, 'if caching is turned on, second call should work too #46');
            start();
        });
    });
});
