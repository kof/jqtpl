test('Variables ${}, {{=}}', function() {
    equal(render('lorem ipsum'), 'lorem ipsum', 'plain text passes through untouched');
    equal(render('${ a }', {a: 1}), '1', 'simple variable output');
    equal(render(''), '', 'empty template string rendered without errors');
    equal(render('{{}}'), '{{}}', 'empty tag');
    equal(render('{{\t\t}}'), '{{\t\t}}', 'empty tag with tabs whitespace');
    equal(render('<div>${a}/${a}</div>', {a:1}), '<div>1/1</div>', 'many variables');
    equal(render('<div>{{= a}}</div>', {a:1}), '<div>1</div>', 'use simple data object, using {{= }} in the template ');
    equal(render('<div>${a}</div>', [{a:1}]), '<div>1</div>', 'use an array with one object element');
    equal(render('<div>{{= a}}</div>', [{a:1}]), '<div>1</div>', 'use an array with one object element, using {{= }} in the template');
    equal(render('<div>${a}</div>', [{a:1},{a:2}]), '<div>1</div><div>2</div>', 'use an array with 2 objects');
    equal(render('<div>${a}</div>', {a: function(){return 1}}), '<div>1</div>', 'use function as a value');
    equal(render('<div>${$data.a}</div>', {a:1}), '<div>1</div>', 'test access to $data');
    equal(render('<div>${$item.data.a}</div>', {a:1}), '<div>1</div>', 'test access to $item');
    equal(
        render(
            '<div>${$item.someFunction()}</div>',
            null,
            {someFunction: function() { return 1; }}
        ),
        '<div>1</div>',
        'test access to $item'
    );
    equal(render('${ "string" }'), 'string', 'basic string output (double)');
    equal(render("${ 'string' }"), 'string', 'basic string output (single)');
    equal(render('${ isUndefined }'), '', 'variable lookup error suppression');

    equal(render('A${ a }', {a: 1}), 'A1', 'variable and text (1)');
    equal(render('${ a }B', {a: 1}), '1B', 'variable and text (2)');
    equal(render('A${ a }B', {a: 1}), 'A1B', 'variable and text (3)');

    equal(render('${ a.b.c }', {a:{b:{c:'abc'}}}), 'abc', 'lookups work for submembers');

    equal(render('<div>${a()}</div>', {a: function(){return 1}}), '<div>1</div>', 'function can be called within tag');
    equal(render('<div>${a("aaa")}</div>', {a: function(arg){return arg}}), '<div>aaa</div>', 'functions pass strings correctly');
    equal(render('<div>${a(aaa)}</div>', {a: function(arg){return arg}, aaa: 123}), '<div>123</div>', 'functions pass arguments correctly');

    equal(
        render('${ foo }', {
            foo: {
                toString: function () {return 'S';},
                toValue:function () {return 'V';}
            }
        }),
        'S',
        'variables use toString, not toValue'
    );

    equal(render('${ dot,dot,comma,dash }', {dot:'.','comma':',','dash':'-'}), '-', 'Comma passes variables correctly.');

    equal(render('${ fun }', {fun: function() {return 123;}}), 123, 'variable gets called if it is callable');
    equal(render('${ obj.fun }', {obj: {fun: function() {return 123;}}}), 123, 'last variable in sequence gets called if it is callable');
    equal(
        render('${ foo.bar }', {
            foo: function() {
                return  { bar: function () {return 'BAZ'; } };
            }
        }),
        '',
        'member functions in a sequence do not get called'
    );

    // FIXME
    // equal(render('${ "str\\"i\\"ng" }'), 'str"i"ng', 'string quote escapes (double)');
    // equal(render("${ 'str\\'i\\'ng' }"), "str'i'ng", 'string quote escapes (single)');
    // equal(render('{{ }}'), '{{ }}', 'empty tag with whitespace');
    // equal(render('${ isUndefined.member }'), '', 'variable lookup error suppression (with member)');
});

test("Falsy values", function() {
    equal(render('${ 0 }'), '0', '0');
    equal(render('${ false }'), 'false', 'false');
    equal(render('${ null }'), '', 'null');
    equal(render('${ undefined }'), '', 'undefined');
    equal(render("${ '' }"), '', 'empty string');
    equal(render('${ "" }'), '', 'empty string 2');
});

test("Falsy lookups", function() {
    equal(render('${ zero }', {zero: 0}), '0', '0');
    equal(render('${ zero }', {zero: false}), 'false', 'false');
    equal(render('${ zero }', {zero: null}), '', 'null');
    equal(render('${ zero }', {zero: undefined}), '', 'undefined');
    equal(render("${ zero }", {zero: ''}), '', 'empty string');
});


test("Bracketed accessors", function() {
    equal(render('${ foo["bar"] }',{foo:{bar:'baz'}}), 'baz', 'foo["bar"]');
    equal(render("${ foo['bar'] }",{foo:{bar:'baz'}}), 'baz', "foo['bar']");
});

test('${html}', function() {
    equal(
        render('{{html a}}', {a:'<div id="123">2</div>'}),
        '<div id="123">2</div>',
        'output html without escaping'
    );
});

test('${if}', function() {
    var tpl = '{{if a == 1}}<div>${a}</div>{{/if}}';
    equal(render(tpl,{a:1}), '<div>1</div>', 'test "if" when true');
    equal(render(tpl,{a:2}), '', 'test "if" when false');
});

test('{else}', function() {
    var tpl1 = '{{if a == 1}}<div>${a}</div>{{else}}2{{/if}}',
        tpl2 = '{{if a == 1}}<div>${a}</div>{{else a==2 }}2{{else}}3{{/if}}';

    equal(render(tpl1,{a:1}), '<div>1</div>', 'test else when true');
    equal(render(tpl1,{a:2}), '2', 'test else when false');
    equal(render(tpl2,{a:2}), '2', 'test else =2');
    equal(render(tpl2,{a:3}), '3', 'test else =3');
});

test("Incorrect nesting", function() {
    throws(function() { render('{{if 1}}{{if 1}}{{/if}}') }, SyntaxError, 'defaut');
    throws(function() { render('{{if 1}}{{/if}}{{/if}}') }, SyntaxError, 'extra /if');
    throws(function() { render('{{if 1}}{{each arr}}{{/if}}{{/each}}', {arr: []}) }, SyntaxError, 'but terminated');
});


test('{{each}}', function() {
    equal(
        render(
            '{{each(index, value) names}}<div>${index}.${value}</div>{{/each}}',
            {names: ['A', 'B']}
       ),
        '<div>0.A</div><div>1.B</div>', 'test "each", use index and value, explizitely mapping them '
   );
    equal(
        render(
            '{{each names}}<div>${$index}.${$value}</div>{{/each}}',
            {names: ['A', 'B']}
       ),
        '<div>0.A</div><div>1.B</div>', 'test "each", use index and name with auto mapping'
   );
    equal(
        render(
            '{{each $item.getData()}}<div>${$value}</div>{{/each}}',
            null,
            {
                getData: function(){
                    return [1,2,3];
                }
            }
       ),
        '<div>1</div><div>2</div><div>3</div>', 'test "each", using templates variables'
   );
    equal(
        render(
            '{{each data }}<div>${$value}</div>{{/each}}',
            {
                data: {1:1, 2:2, 3:3}
            }
       ),
        '<div>1</div><div>2</div><div>3</div>',
        'iterate over json in each loop'
   );
});

test('{{partial}}', function() {
    equal(
        render(
            '{{partial(data) extTpl}}',
            {
                extTpl: '<div>${a}</div>',
                data: {a:123456}
            }
       ),
        '<div>123456</div>',
        'include template {{tmpl}} and pass data object'
   );

    equal(
        render(
            '{{partial(data) extTpl}}',
            {
                extTpl: '<div>${a}</div>',
                data: [{a:1}, {a:2}]
            }
       ),
        '<div>1</div><div>2</div>',
        'include template {{tmpl}} and pass data array'
   );
});

test('{{!}}', function() {
    equal(render('A{{! its a comment}}B'), 'AB', 'comments are removed');
    equal(render('{{! inky }}foo{{! blinky }}'), 'foo', 'comments are removed 2');

    // FIXME
    // equal(render('A{{! comments "}}" test }}B'), 'AB', 'comments may include string of comments');
    // equal(render('A{# C{# E #}D #}B'), 'AD #}B', 'comments cannot nest other comments');
    // test_handler( "comments may include strings with escapes (double)", R('A{# comments "str\"ing" test #}B', testData), "AB" );
    // test_handler( "comments may include strings with escapes (single)", R("A{# comments 'str\'ing' test #}B", testData), "AB" );
    // test_handler( "comments may include tags", R("A{# {{= v }} #}B", testData), "AB" );
    // test_handler( "comments may span lines", R("A{# \ncomments test\n #}B", testData), "AB" );
    // test_handler( "comments may contain invalid content (invalid tag)", R('1{{! {{ INVALID_TAG }} }}2', testData), '12' );
    // test_handler( "comments may contain invalid content (stray end tag)", R('1{{! {{/if}} }}2', testData), '12' );
    // test_handler( "comments may contain invalid content (stray else)", R('1{{! {{else}} }}2', testData), '12' );
    // test_handler( "comments may contain invalid content (invalid javascript)", R('1{{! {{if ...}} }}2', testData), '12' );


});

test('preserve whitespaces', function() {
    var html = render("<div>\n{{= [{\tkey: \n'value'\r}] }}\n</div>", {});

    equal(
        html,
        "<div>\n[object Object]\n</div>",
        "whitespaces preserved"
   );

    html = render(
        "<div>\n{{= someFunction({\tkey: \n'value'\r}) }}\n</div>",
        {
            someFunction: function(data) {
                return "some text " + data.key;
            }
        }
   );

    equal(
        html,
        "<div>\nsome text value\n</div>",
        "whitespaces preserved"
   );
});

test("{{verbatim}}", function() {
    equal(
        render(
            '<div>{{= a}}{{verbatim}}${a}12345{{/verbatim}{{/verbatim}}{{verbatim}}}{{= a}}{{/verbatim}}${a}</div>',
            {a:1}
       ),
        '<div>1${a}12345{{/verbatim}}{{= a}}1</div>',
        'verbatim'
   );
});


test('Error reporting', function() {
    throws(function() { render('${ a b c }}'); }, SyntaxError, 'syntax error');
    throws(function() { render('${a.b}'); }, ReferenceError, 'reference error');
    throws(function() { render('${[]()}'); }, TypeError, 'type error');
});

test('Escaping', function() {
    equal(render('${ "foo<div>bar</div>baz" }'), "foo&lt;div&gt;bar&lt;/div&gt;baz", "echoing escapes html");
    equal(render('${ r }', {r:"foo<div>bar</div>baz"}), "foo&lt;div&gt;bar&lt;/div&gt;baz",  "echoing escapes html (lookup)");
    equal(render('${ "&" }'), "&amp;", "echoing escapes ampersands 1");
    equal(render('${ "&amp;" }'), "&amp;amp;", "echoing escapes ampersands 2");
    equal(render('${ "-<&>-<&>-" }'), "-&lt;&amp;&gt;-&lt;&amp;&gt;-", "echoing escapes & < >");
    equal(render('${\n \na\n }', {a: 1}), '1', 'newlines do not kill tags');
    equal(render('${ "on\ne" }'), 'one', 'newlines in strings do not kill tags');
    equal(render('${\r \r\na\r\n }', {a: 1}), '1', 'returns do not kill tags');
    equal(render('${ "on\re" }'), 'one', 'returns in strings do not kill tags');
    equal(render('${ "on\\e" }'), 'one', 'slashes in strings do not kill tags');
    equal(render('a\nb\nc${ 8 }.'), 'a\nb\nc8.', 'newlines do not kill parsing');
});


test("Ignore malformed tags", function() {
    equal(render('a {{one } b'), 'a {{one } b', 'a {{one } b');
    equal(render('${ a }} {{b }', {a: '1', b: '1'}), '1} {{b }', '1} {{b }');
    equal(render('{{one }'), '{{one }', '{{one }');
});

test("Reserved words", function() {
    // FIXME
    // throws(function() { render('${ new Object() }'); }, SyntaxError, 'Disallow new operator');
    // throws(function() { render('${ delete a }'); }, SyntaxError, 'Disallow delete operator');

    throws(function() { render('${ function(){} }'); }, SyntaxError, 'Disallow function operator');
    throws(function() { render('${ return a }'); }, SyntaxError, 'Disallow return');
    throws(function() { render('${ for a }'); }, SyntaxError, 'Disallow for');
    throws(function() { render('${ do{ a }while(a) }'); }, SyntaxError, 'Disallow do/while');
    throws(function() { render('${ if a }'); }, SyntaxError, 'Disallow if');
    throws(function() { render('${ try{b.s}catch(e){} }'); }, SyntaxError, 'Disallow try/catch');
    throws(function() { render('${ with (s) }'); }, SyntaxError, 'Disallow with keyword');
    throws(function() { render('${ throw "foo" }'); }, SyntaxError, 'Disallow throw keyword');
});

