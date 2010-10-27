var a = require( "assert" ),
    jte = require( "./../lib/jqtpl" ),
	s = require( "sys" );

var tpl1 = "<div>${a}</div>",
    tpl2 = "<div>${$i}</div>",
    tpl3 = "{{each(i, name) names}}<div>${i}.${name}</div>{{/each}}",
    tpl4 = "{{if a == 1}}<div>${a}</div>{{/if}}",
    tpl5 = "{{if a == 1}} 1 {{else}}<div>${a}</div>{{/if}}",
    tpl6 = "{{html a}}",
	tpl7 = "{{tmpl($data) tpl1}}",
	tpl8 = "{{tmpl($data) extTpl}}";

// simple output 
a.equal( jte.render(tpl1, {a:1}), "<div>1</div>" );
a.equal( jte.render(tpl1, [{a:1}]), "<div>1</div>" );
a.equal( jte.render(tpl1, [{a:1},{a:2}]), "<div>1</div><div>2</div>" );
a.equal( jte.render(tpl1, {a: function(){return 1}}), "<div>1</div>" );
a.equal( jte.render(tpl2, [{a:1}]), "<div>0</div>" );
a.equal( jte.render(tpl2, [{a:1},{a:1}]), "<div>0</div><div>1</div>" );

// escaping per default
a.equal( jte.render(tpl1,{a:'<div id="123">2</div>'}), "<div>&lt;div id=&quot;123&quot;&gt;2&lt;/div&gt;</div>" );

// statements
a.equal( jte.render(tpl3, {names: ["A", "B"]}), "<div>0.A</div><div>1.B</div>" );
a.equal( jte.render(tpl4,{a:1}), "<div>1</div>" );
a.equal( jte.render(tpl5,{a:2}), "<div>2</div>" );

// output html without escaping
a.equal( jte.render(tpl6,{a:'<div id="123">2</div>'}), '<div id="123">2</div>');

// nested templates
global.tpl1 =  global.extTpl = tpl1;
a.equal( jte.render(tpl7, {a:1}), "<div>1</div>" );
a.equal( jte.render(tpl8, [{a:1},{a:2}]), "<div>1</div><div>2</div>" );

s.print("\nTests passed successfull\n");