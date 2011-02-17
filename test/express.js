var express = require('express'),
    http = require('http');


function request(path, callback) {
    var client = http.createClient(o.port);
    var request = client.request('GET', path, {'host': 'http://localhost'});
    request.on('response', function (response) {
        response.setEncoding('utf8');
	    response.on('data', callback);
    });    
    request.end();
}

var o = {
        root: __dirname + '/fixtures',
        port: 8888    
    },
    app;

QUnit.module('express', {
    setup: function() {
        app = express.createServer();
        app.set('view engine', 'html');
        app.set('views', o.root + '/views');
        app.register('.html', require('../lib/jqtpl'));
        app.get('/:view', function(req, res){
            res.render(req.params.view, { layout: false, locals: {a:1} });
        });        
        app.listen(o.port);
    },
    teardown: function() {
         app.close();       
    }
});

test("locals", 1, function() {
   stop(); 
   request('/locals', function(data) {
       equal(data, '<div>1</div>', 'template rendered correctly');
       start();
   });
});

test("scope option", function() {
    var res = render( "<div>${this.test}</div>", { locals: {a:1}, scope: {test: 123} } );
    same(res, '<div>123</div>', "scope is correct");                
});

test("debug option", function() {
    var printed,
        util = require( "util" ),
        debug = util.debug;
    
    // mock print method
    util.debug = function( str ) {
        printed = true;
    };
    
    render( '', {debug: true} );
    
    // restore orig. print function
    util.debug = debug;
    
    ok( printed, "debug option works" );
});


test("partials tmpl", 1, function() {
    stop();

    request('/partialtest', function(data) {
        equal(data, '<div class="partial">1</div>', 'partial using tmpl');
        start();
    });
});

test("partials express", 1, function() {
    stop();

    request('/partialexpress', function(data) {
        equal(data, '<div class="partial">1</div>', 'partial view using express method');
        start();
    });
});   

test("partials array", 1, function() {
    stop();

    request('/partialarray', function(data) {
        equal(data, '<div class="partial">1</div><div class="partial">2</div><div class="partial">3</div>', 'partial view using tmpl and passing an array');
        start();
    });
}); 

test("wrong partial path", 1, function() {
    stop();

    request('/wrongpartialpath', function(data) {
        equal(data, 'idontexist', 'wrong path is rendered as view text');
        start();
    });
}); 

