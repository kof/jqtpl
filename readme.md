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
   1. because of the "var" problem in javascript - very evil
  
## Features

 * jquery tmpl plugin conform
 * extendable - you can implement new statements
 * html escaping per default
 * simple syntax
 * tiny and fast

## Installation via npm
	npm install jqtpl

## Run tests
    $ node test/test.js
    
## Usage

### require the module
    var jqtpl = require( "jqtpl" );
    

#### Want to use it with Express?
    app.set( "view engine", "html" );
    app.register( ".html", require( "jqtpl" ) );

Following options are supported by render method

 - `locals` Local variables object
 - `cache` Compiled functions are cached, requires `filename`
 - `filename` Used by `cache` to key caches
 - `scope` Function execution context
 - `debug` Output generated function body    
 
##### Code example 
	
	jqtpl.render('your template', {
		locals: {
			// your data here
		},
		cache: true, // default
		filename: 'file-name',
		scope: {} // default to {}
		debug: false // will output generated function to the console, false is default
	});

### Simple output (escaped per default)

##### Template
    <div>${a}</div>
##### Code
    jqtpl.tmpl( tpl, {a:123});
##### Output
    <div>123</div>

### Simple output but with array as data argument (escaped per default)

##### Template   
    <div>${a}</div>
##### Code
    jqtpl.tmpl( tpl, [{a:1},{a:2},{a:3}]);
##### Output
    <div>1</div><div>2</div><div>3</div>
         
### If property is a function - it will be called automatically    (escaped per default)      

##### Template
    <div>${a}</div>
##### Code
    jqtpl.tmpl( tpl, {
        a:function() {
            return 1 + 5;
        }
    });
##### Output
    <div>6</div>
    
### "if" statement

##### Template
    {{if a == 6}}
        <div>${a}</div>
    {{else a == 5}}
    	<div>5</div>
    {{else}}
        <div>a is not 6 and not 5</div>    
    {{/if}}
##### Code
    jqtpl.tmpl( tpl, {a:6});
##### Output
    <div>6</div>

##### Code
    jqtpl.tmpl( tpl, {a:5});
###### Output
    <div>a is not 6</div>
    
### "each" statement

##### Template
    {{each(i, name) names}}
        <div>${i}.${name}</div>
    {{/each}}        
    
or
	{{each names}}
		<div>${$index}.${$value}</div>
	{{/each}}
    
##### Code
    jqtpl.tmpl( tpl, {names: ["A", "B"]});
##### Output
    <div>0.A</div><div>1.B</div>
    
### There is a way to avoid escaping if you know what you do :)

##### Template
    <div>{{html a}}</div>
##### Code
    jqtpl.tmpl( tpl, {a:'<div id="123">2</div>'});
##### Output
    <div id="123">2</div>    
    
### Named templates - there is a way to precompile the template using a string, so you can render this template later using its name

##### Template
    <div>${a}</div>
##### Code
	// precompile an cache it
	jte.template( "templateName", tpl );
    jqtpl.tmpl( "templateName", {a:1} );
    
    // you can also delete the template from cache
    delete jte.template["templateName"];
##### Output
    <div>1</div>       

### Local variables

* $data - data object passed to render method
* $item - contains $data via $item.data as well as user options - an optional map of user-defined key-value pairs.


##### Template
    <div>${ $item.someMethod() }</div>
##### Code
	jqtpl.tmpl( tpl, {a:1}, {
		someMethod: function(){ return 1; }
	});
##### Output
    <div>1</div> 	


##### Template
    <div>${a}</div>
##### Code
	// precompile an cache it
	jte.template( "templateName", tpl );
    jqtpl.tmpl( "templateName", {a:1} );
    
    // you can also delete the template from cache
    delete jte.template["templateName"];
##### Output
    <div>1</div>    

### Comments

##### Template
    <div>{{! its a comment}}</div>
##### Code
    jqtpl.tmpl( tpl );
##### Output
    <div></div>  
     