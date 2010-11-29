var a = require( "assert" ),
    jte = require( "./../lib/jqtpl" ),
    undefined;

var tpl1 = "<div>${a}</div>",
    tpl2 = "<div>{{= a}}</div>",
    tpl3 = "<div>${$data.a}</div>",
    tpl4 = "<div>${$item.data.a}</div>",
    tpl5 = "<div>${$item.someFunction()}</div>",
    tpl6 = "{{html a}}",
    tpl9 = "{{if a == 1}}<div>${a}</div>{{/if}}",
    tpl11 = "{{if a == 1}}<div>${a}</div>{{else}}2{{/if}}",
    tpl12 = "{{if a == 1}}<div>${a}</div>{{else a==2 }}2{{else}}3{{/if}}",
    tpl14 = "{{tmpl($data) extTpl}}";

// "template" method
a.equal( typeof jte.template("test", tpl1), "function", "precompile template and cache using template name" );
a.equal( jte.tmpl("test", {a:1}), "<div>1</div>", "render using template name" );
a.ok( delete jte.template["test"], "remove cache item" );

// ${}
a.equal( jte.tmpl(tpl1, {a:1}), "<div>1</div>", "use simple data object" );
a.equal( jte.tmpl(tpl1,{a:'<div id="123">2</div>'}), "<div>&lt;div id=&quot;123&quot;&gt;2&lt;/div&gt;</div>", "escaping per default" );
a.equal( jte.tmpl(tpl2, {a:1}), "<div>1</div>", "use simple data object, using {{= }} in the template " );
a.equal( jte.tmpl(tpl1, [{a:1}]), "<div>1</div>", "use an array with one object element" );
a.equal( jte.tmpl(tpl2, [{a:1}]), "<div>1</div>", "use an array with one object element, using {{= }} in the template" );
a.equal( jte.tmpl(tpl1, [{a:1},{a:2}]), "<div>1</div><div>2</div>", "use an array with 2 objects" );
a.equal( jte.tmpl(tpl1, {a: function(){return 1}}), "<div>1</div>", "use function as a value" );

// local variables
a.equal( jte.tmpl(tpl3, {a:1}), "<div>1</div>", "test access to $data" );
a.equal( jte.tmpl(tpl4, {a:1}), "<div>1</div>", "test access to $item" );
a.equal( jte.tmpl(tpl5, null, {someFunction: function() {return 1}}), "<div>1</div>", "test access to $item" );

// ${html}
a.equal( jte.tmpl(tpl6,{a:'<div id="123">2</div>'}), '<div id="123">2</div>', 'output html without escaping');


// ${if}
a.equal( jte.tmpl(tpl9,{a:1}), "<div>1</div>", "test 'if' when true" );
a.equal( jte.tmpl(tpl9,{a:2}), "", "test 'if' when false" );

// ${else}
a.equal( jte.tmpl(tpl11,{a:1}), "<div>1</div>", "test else when true" );
a.equal( jte.tmpl(tpl11,{a:2}), "2", "test else when false" );
a.equal( jte.tmpl(tpl12,{a:2}), "2", "test else =2" );
a.equal( jte.tmpl(tpl12,{a:3}), "3", "test else =3" );



// {{each}}
a.equal( 
    jte.tmpl(
        "{{each(index, value) names}}<div>${index}.${value}</div>{{/each}}", 
        {names: ["A", "B"]}
    ), 
    "<div>0.A</div><div>1.B</div>", "test 'each', use index and value, explizitely mapping them " 
);
a.equal( 
    jte.tmpl(
        "{{each names}}<div>${$index}.${$value}</div>{{/each}}", 
        {names: ["A", "B"]}
    ), 
    "<div>0.A</div><div>1.B</div>", "test 'each', use index and name with auto mapping" 
);
a.equal( 
    jte.tmpl(
        "{{each $item.getData()}}<div>${$value}</div>{{/each}}",
        null, 
        { 
            getData: function(){ 
                return [1,2,3];
            }
        }
    ), 
    "<div>1</div><div>2</div><div>3</div>", "test 'each', using templates variables" 
);
a.equal(
    jte.tmpl(
        "{{each data }}<div>${$value}</div>{{/each}}",
        {
            data: {1:1, 2:2, 3:3}
        }
    ),
    "<div>1</div><div>2</div><div>3</div>",
    "iterate over json in each loop"
);


// {{tmpl}}
a.equal( jte.tmpl(tpl4, {a:1, extTpl: tpl1}), "<div>1</div>", "include template" );

/*
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

jte.template( "#tableWrapper", tpl2 );
console.log(jte.tmpl(tpl1));
*/

// {{!}}
a.equal( jte.tmpl("<div>{{! its a comment}}</div>", {a:1}), "<div></div>", "comments work" );


// Express render method

a.equal( 
    jte.render( tpl1, { locals: {a:1}, cache: false, filename: "test" } ),
    "<div>1</div>",
    "express locals test" 
);

a.equal( jte.template["test"], undefined, "express cache and filename test" );

a.equal( 
    jte.render( "<div>${this.test}</div>", { locals: {a:1}, scope: {test: 123} } ),
    "<div>123</div>",
    "express scope test" 
);



(function(){
    var printed,
        util = require( "util" ),
        print = util.print;
    
    // mock print method
    util.print = function( str ) {
        printed = true;
    };
    
    jte.render( tpl1, { locals: {a:1}, debug: true} );
    
    // restore orig. print function
    util.print = print;
    
    a.ok( printed, "express debug test" );
})()


require( "util" ).print("Tests passed successfull\n");
