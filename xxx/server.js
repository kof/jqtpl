var express = require('express');
var app = express.createServer();

app.set('view cache', true);
app.set('view engine', 'html');
app.set('view options', { layout: false })
app.set('views', '.');
app.register('.html', require('jqtpl').express);

var count=0;
app.get('/', function(req, res){
count++;
return res.render('main', {
       count: count, title: 'Title', hello: 'Hello World'
    } );
});

app.listen(8080);
console.log('Go to http://localhost:8080/ and keep reloading')
