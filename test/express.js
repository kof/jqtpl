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
            '<div>1</div><div>2</div><div>3</div><div>4</div><div>5</div><div>6</div>',
            'paths resolved correctly'
        );
        start();
    });
});

test('render template with a layout', function() {
    expect(1);
    stop();

    app.set('view options', {layout: true});
    app.set('views', options.root + '/2');

    post('/views/test', {mylocal: "mylocal"}, function(data) {
        equal(data, 'abc mylocal', 'template and layout rendered correctly');
        app.disable('view options');
        app.set('views', views);
        start();
    });
});

test("render multiple times the same template #29", function() {
    var data;

    data = {
        a: 'Hello',
        settings: {
            'view options': {}
        }
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
        settings: {
            'view options': {}
        }
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
