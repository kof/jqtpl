var a = require( "assert" ),
    jte = require( "./../lib/jqtpl" );

var tpl1 = "<div>${a}</div>",
    tpl2 = "<div>{{= a}}</div>",
    tpl3 = "<div>${$data.a}</div>",
    tpl4 = "<div>${$item.data.a}</div>",
    tpl5 = "<div>${$item.someFunction()}</div>",
    tpl6 = "{{html a}}",
    tpl7 = "{{each $item.getData()}}<div>${$value}</div>{{/each}}",
    tpl8 = "{{each(index, value) names}}<div>${index}.${value}</div>{{/each}}",
    tpl13 = "{{each names}}<div>${$index}.${$value}</div>{{/each}}",
    tpl9 = "{{if a == 1}}<div>${a}</div>{{/if}}",
    tpl11 = "{{if a == 1}}<div>${a}</div>{{else}}2{{/if}}",
    tpl12 = "{{if a == 1}}<div>${a}</div>{{else a==2 }}2{{else}}3{{/if}}",
    tpl14 = "{{tmpl($data) extTpl}}";

// "template" method
a.equal( typeof jte.template("test", tpl1), "function", "precompile template and cache using template name" );
a.equal( jte.render("test", {a:1}), "<div>1</div>", "render using template name" );
a.ok( delete jte.template["test"], "remove cache item" );

// ${}
a.equal( jte.render(tpl1, {a:1}), "<div>1</div>", "use simple data object" );
a.equal( jte.render(tpl1,{a:'<div id="123">2</div>'}), "<div>&lt;div id=&quot;123&quot;&gt;2&lt;/div&gt;</div>", "escaping per default" );
a.equal( jte.render(tpl2, {a:1}), "<div>1</div>", "use simple data object, using {{= }} in the template " );
a.equal( jte.render(tpl1, [{a:1}]), "<div>1</div>", "use an array with one object element" );
a.equal( jte.render(tpl2, [{a:1}]), "<div>1</div>", "use an array with one object element, using {{= }} in the template" );
a.equal( jte.render(tpl1, [{a:1},{a:2}]), "<div>1</div><div>2</div>", "use an array with 2 objects" );
a.equal( jte.render(tpl1, {a: function(){return 1}}), "<div>1</div>", "use function as a value" );

// local variables
a.equal( jte.render(tpl3, {a:1}), "<div>1</div>", "test access to $data" );
a.equal( jte.render(tpl4, {a:1}), "<div>1</div>", "test access to $item" );
a.equal( jte.render(tpl5, null, {someFunction: function() {return 1}}), "<div>1</div>", "test access to $item" );

// ${html}
a.equal( jte.render(tpl6,{a:'<div id="123">2</div>'}), '<div id="123">2</div>', 'output html without escaping');


// ${if}
a.equal( jte.render(tpl9,{a:1}), "<div>1</div>", "test 'if' when true" );
a.equal( jte.render(tpl9,{a:2}), "", "test 'if' when false" );

// ${else}
a.equal( jte.render(tpl11,{a:1}), "<div>1</div>", "test else when true" );
a.equal( jte.render(tpl11,{a:2}), "2", "test else when false" );
a.equal( jte.render(tpl12,{a:2}), "2", "test else =2" );
a.equal( jte.render(tpl12,{a:3}), "3", "test else =3" );

// {{each}}
a.equal( jte.render(tpl8, {names: ["A", "B"]}), "<div>0.A</div><div>1.B</div>", "test 'each', use index and value, explizitely mapping them " );
a.equal( jte.render(tpl13, {names: ["A", "B"]}), "<div>0.A</div><div>1.B</div>", "test 'each', use index and name with auto mapping" );
a.equal( jte.render(tpl7, null, {getData: function(){ return [1,2,3]}}), "<div>1</div><div>2</div><div>3</div>", "test 'each', using templates variables" );

// {{tmpl}}
a.equal( jte.render(tpl4, {a:1, extTpl: tpl1}), "<div>1</div>", "include template" );

// {{wrap}}

var tpl1 = 
    '{{wrap "#tableWrapper"}}\
        <div>\
            First <b>content</b>\
        </div>\
        <div>\
            And <em>more</em> <b>content</b>...\
        </div>\
    {{/wrap}}';

var tpl2 = 
    '<table><tbody>\
        <tr>\
            {{each $item.html("div")}}\
                <td>\
                    {{html $value}}\
                </td>\
            {{/each}}\
        </tr>\
    </tbody></table>';

//jte.template( "#tableWrapper", tpl2 );
//console.log(jte.render(tpl1));

// {{!}}
a.equal( jte.render("<div>{{! its a comment}}</div>", {a:1}), "<div></div>", "comments work" );



require( "util" ).print("Tests passed successfull\n");
