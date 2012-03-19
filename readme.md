## This is a port of jQuery's Template Engine to nodejs

http://github.com/jquery/jquery-tmpl

## Full API documentation of the original plugin

http://api.jquery.com/category/plugins/templates/

Note: currently not implemented: wrap tag and tmplItem method.

## Philosophy is similar to django

http://docs.djangoproject.com/en/dev/topics/templates/

 * no program logic in templates
 * no embeded script language like in ejs
   1. this is evil because it enables program logic in templates
   1. bad usability
   1. because of the "var" problem in javascript

## Features

 * jquery tmpl plugin conform
 * extendable - you can implement new statements
 * html escaping per default
 * simple syntax
 * tiny and fast

## Installation via npm
	npm install jqtpl

## Run tests
    $ make test


## Usage

### require the module
    var jqtpl = require("jqtpl");

### jqtpl.tmpl(markup, data, options);

Compile and render a template. It uses `jqtpl.template` method.

- `markup` html code string
- `data` object or array of data
- `options` optional options object

### jqtpl.template(name, tpl)

Named templates - there is a way to precompile the template using a string, so you can render this template later using its name.
**Template is cached after this fn call.**

	// tpl
    <div>${a}</div>

	// code

	// precompile an cache it
	jqtpl.template( "templateName", tpl );
	// render
    jqtpl.tmpl( "templateName", {a:1} );
    // you can also delete the template from cache
    delete jqtpl.template["templateName"];

	// output
    <div>1</div>

### Local variables

- `$data` - data object passed to render method
- `$item` - contains $data via $item.data as well as user options - an optional map of user-defined key-value pairs.

Examples:

	// tpl
    <div>${ $item.someMethod() }</div>

    // code
	jqtpl.tmpl( tpl, {a:1}, {
		someMethod: function(){ return 1; }
	});

	//output
    <div>1</div>

## Tags

### ${} - simple output (escaped per default)
	// tpl
    <div>${a}</div>

	// code
    jqtpl.tmpl( tpl, {a:123});

    // output
    <div>123</div>

### ${} - simple output but with array as data argument (escaped per default)

	//tpl
    <div>${a}</div>

	// code
    jqtpl.tmpl( tpl, [{a:1},{a:2},{a:3}]);

	// output
    <div>1</div><div>2</div><div>3</div>

### ${} - if property is a function - it will be called automatically (escaped per default)

	// tpl
    <div>${a}</div>

	// code
    jqtpl.tmpl( tpl, {
        a:function() {
            return 1 + 5;
        }
    });

	//output
    <div>6</div>

### {{if}} and {{else}}

	// tpl
    {{if a == 6}}
        <div>${a}</div>
    {{else a == 5}}
    	<div>5</div>
    {{else}}
        <div>a is not 6 and not 5</div>
    {{/if}}

	// code
    jqtpl.tmpl( tpl, {a:6});

	// output
    <div>6</div>

	// code
    jqtpl.tmpl( tpl, {a:5});

	// output
    <div>a is not 6</div>

### {{each}} looping.

	// tpl
    {{each(i, name) names}}
        <div>${i}.${name}</div>
    {{/each}}

    // alternative syntax

	{{each names}}
		<div>${$index}.${$value}</div>
	{{/each}}

	// code
    jqtpl.tmpl( tpl, {names: ["A", "B"]});

	// output
    <div>0.A</div><div>1.B</div>

### {{html}} - there is a way to avoid escaping if you know what you do :)

	// tpl
    <div>{{html a}}</div>

	// code
    jqtpl.tmpl( tpl, {a:'<div id="123">2</div>'});

	// output
    <div id="123">2</div>


### {{!}} - comments.

	// tpl
    <div>{{! its a comment}}</div>

	// code
    jqtpl.tmpl( tpl );

	// output
    <div></div>

### {{tmpl}} - subtemplates.

Note: passing json object with 2 curly brackets without any separation will break the engine: {{tmpl({a: {b: 1}}) "mypartial"}}

	// tpl
    <div>{{tmpl({name: "Test"}) '${name}'}}</div>

	// code
    jqtpl.tmpl(tpl);

	// output
    <div>Test</div>

# Not jquery-tmpl compatible stuff

## Specific tags

### {{verbatim}} tag

If you want to skip a part of your template, which should be rendered on the client, you can use now verbatim tag.

    // mytemplate.html
    <div>my name is ${name}</div>
    {{verbatim}}
        <div>your name is ${userName}</div>
    {{/verbatim}}

    // code
    res.render('myaction', {name: 'Kof'});

    // output
    <div>my name is Kof</div>
    <div>your name is ${userName}</div>


## Express specific stuff

**Note: express is caching all templates in production!**

### Usage

    app.set("view engine", "html");
    app.register(".html", require("jqtpl").express);

### {{partial}} tag

Read express documentation here http://expressjs.com/guide.html#res.partial()

	// tpl

	// myaction.html
    <div>{{partial(test) "mypartial"}}</div>

	// mypartial.html
	${name}

	// code
	app.get('/myaction', function(req, res) {
		res.render('myaction', {test: {name: 'Test'}});
	})

	// output
    <div>Test</div>

Using array of data:

	// tpl

	// myaction.html
    <div id="main">
    	{{partial(test) "mypartial"}}
	</div>

	// mypartial.html
	<div class="partial">
		${name}
	</div>

	// code
	app.get('/myaction', function(req, res) {
		res.render('myaction', {
			as: global,
			test: [
				{name: "Test1"},
				{name: "Test2"}
			]
		});
	})

	// output
	<div id="main">
		<div class="partial">Test1</div>
		<div class="partial">Test2</div>
    </div>

### {{layout}} tag

Using layout tag in a view it is possible to define a layout within this view.
Note: it is possible since express@2.2.1.

	// tpl

	// mylayout.html
	<html>
	{{html body}}
    </html>

    // myview.html
    {{layout "mylayout"}}
    	<div>myview</div>

    // output
    <html>
		<div>myview</div>
    </html>
