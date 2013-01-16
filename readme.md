## A template engine for nodejs, browser and any other javascript environment.

- Logic-less.
- Extendable - implement your own tags.
- Html escaped per default.

### Originally started as a port of jquery templates.

http://github.com/jquery/jquery-tmpl

http://api.jquery.com/category/plugins/templates/

**Now compatibility to the original engine is dropped as jquery-tmpl is not any more developed.**

### Installation
	$ npm i jqtpl
    $ make test

## Template API

### ${}, {{=}} print variable, array or function (escaped)

- Print variable

    	// tpl
        <div>${a}</div>
    	// code
        jqtpl.render(tpl, {a:123});
        // output
        <div>123</div>

- Print array

        //tpl
        <div>${a}</div>
        // code
        jqtpl.render(tpl, [{a:1},{a:2},{a:3}]);
        // output
        <div>1</div><div>2</div><div>3</div>

- Print automatically detected function

        // tpl
        <div>${a}</div>
        // code
        jqtpl.render(tpl, {
            a: function() {
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
    jqtpl.render(tpl, {a:6});

	// output
    <div>6</div>

	// code
    jqtpl.render(tpl, {a:5});

	// output
    <div>a is not 6</div>

### {{each}} looping.

	// tpl
    {{each(name, i) names}}
        <div>${i}.${name}</div>
    {{/each}}

    // alternative syntax
	{{each names}}
		<div>${$index}.${$value}</div>
	{{/each}}

	// code
    jqtpl.render(tpl, {names: ['A', 'B']});

	// output
    <div>0.A</div><div>1.B</div>

### {{html}} -  print unescaped html.

	// tpl
    <div>{{html a}}</div>

	// code
    jqtpl.render(tpl, {a:'<div id="123">2</div>'});

	// output
    <div><div id="123">2</div></div>


### {{!}} - comments.

	// tpl
    <div>{{! its a comment}}</div>

	// code
    jqtpl.render(tpl);

	// output
    <div></div>

### {{partial}} - subtemplates.

Render subtemplates by passing a template string, template name or file name (serverside).

**Note: passing json object with 2 curly brackets without any separation will break the engine: {{partial({a: {b: 1}}) 'mypartial'}}**

	// tpl
    <div>{{partial({name: 'Test'}) '${name}'}}</div>
    <div>{{partial 'myTemplate'}}</div>
    <div>{{partial 'myTemplate.html'}}</div>

	// code
    jqtpl.render(tpl);

	// output
    <div>Test</div>


### {{verbatim}} tag

Skip a part of your template - leave it in original on the same place but without "verbatim" tag. If you render the result as a template again - it will be rendered.

The use case is to be able to render the same template partially on the server and on the client. F.e. a layout template can contain variables which needs to be rendered on the server and templates which need to be rendered on the client.

    // mytemplate.html
    <div>my name is ${name}</div>
    {{verbatim}}
    <script id="my-template">
        <div>your name is ${userName}</div>
    </script>
    {{/verbatim}}

    // code
    res.render('myaction', {name: 'Kof'});

    // output
    <div>my name is Kof</div>
    <script id="my-template">
        <div>your name is ${userName}</div>
    </script>


## Engine API

### require the module
    var jqtpl = require('jqtpl');

### jqtpl.render(markup, [data]);

Compile and render a template. It uses `jqtpl.template` method. Returns a rendered html string.

- `markup` html code or precompiled template name.
- `data` optional object or array of data.

### jqtpl.compile(markup, [name])

Compile and cache a template string. Returns a `render` function which can be called to render the template, see `jtpl.render`.

- `markup` html string.
- `name` optional template name, if no name is passed - markup string will be used as a name.

        // tpl
        <div>${a}</div>

        // code

        // precompile an cache it
        jqtpl.compile(tpl, 'myTemplate');

        // render user a name
        jqtpl.render('myTemplate', {a:1});

        // delete the template from cache
        delete jqtpl.cache['myTemplate'];

        // output
        <div>1</div>

### jqtpl.cache

A map of compiled templates.

- `key` - template name or markup string.
- `value` - compiled template function.

### jqtpl.$

A namespace for global helper functions, which can be used in every template.

## Express specific stuff

**Note: express will cache all templates in production!**

### Usage

    app.set('views', '/path/to/the/views/dir');
    app.set('view engine', 'html');
    app.set('layout', true);
    app.engine('html', require('jqtpl').__express);

### {{layout}} tag

Using layout tag in a view it is possible to define a layout within this view.

	// mylayout.html
	<html>
	{{html body}}
    </html>

    // myview.html
    {{layout 'mylayout'}}
	<div>myview</div>

    // myview1.html
    {{layout({a: 1}) 'mylayout'}}
    <div>myview1</div>

    // output
    <html>
	<div>myview</div>
    </html>

## Licence

See package.json
