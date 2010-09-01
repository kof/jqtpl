## This is a port of jQuery's Template Engine to nodejs

http://github.com/jquery/jquery-tmpl

## Philosophy is similar to django

http://docs.djangoproject.com/en/dev/topics/templates/

 * no program logic in templates
 * no embeded script language like in ejs
  1. this is evil because it enables program logic in templates
  2. bad usability
  3. because of the "var" problem in javascript - very very evil
 * extendable - you can implement new statements
  
## Features
 * html escaping per default
 * simple syntax
 * NO PROGRAM LOGIC :)
 * extendable :)
 * tiny and fast
 * jquery conform in the future

## Usage

### require the module
    var jqtpl = require( "jqtpl" );

### Simple output (escaped per default)

##### Template
    <div>${a}</div>
##### Code
    jqtpl.render( tpl, {a:123});
##### Output
    <div>123</div>

### Simple output but with array as data argument (escaped per default)

##### Template   
    <div>${a}</div>
##### Code
    jqtpl.render( tpl, [{a:1},{a:2},{a:3}]);
##### Output
    <div>1</div><div>2</div><div>3</div>
         
### If property is a function - it will be called automatically    (escaped per default)      

##### Template
    <div>${a}</div>
##### Code
    jqtpl.render( tpl, {
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
    {{else}}
        <div>a is not 6</div>    
    {{/if}}
##### Code
    jqtpl.render( tpl, {a:6});
##### Output
    <div>6</div>

##### Code
    jqtpl.render( tpl, {a:5});
###### Output
    <div>a is not 6</div>
    
### "each" statement

##### Template
    {{each(i, name) names}}
        <div>${i}.${name}</div>
    {{/each}}        
##### Code
    jqtpl.render( tpl, {names: ["A", "B"]});
##### Output
    <div>0.A</div><div>1.B</div>
    
### There is a way to avoid escaping if you know what you do :)

##### Template
    <div>{{html a}}</div>
##### Code
    jqtpl.render( tpl, {a:'<div id="123">2</div>'});
##### Output
    <div id="123">2</div>    

## Run tests
    node test/test.js
     