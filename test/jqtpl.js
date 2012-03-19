QUnit.module('jqtpl');

var tpl1 = "<div>${a}</div>",
    tpl2 = "<div>{{= a}}</div>",
    tpl3 = "<div>${$data.a}</div>",
    tpl4 = "<div>${$item.data.a}</div>",
    tpl5 = "<div>${$item.someFunction()}</div>",
    tpl6 = "{{html a}}",
    tpl9 = "{{if a == 1}}<div>${a}</div>{{/if}}",
    tpl11 = "{{if a == 1}}<div>${a}</div>{{else}}2{{/if}}",
    tpl12 = "{{if a == 1}}<div>${a}</div>{{else a==2 }}2{{else}}3{{/if}}";

test('method "template"', function() {
    equal( typeof template("test", tpl1), "function", "precompile template and cache using template name" );
    equal( tmpl("test", {a:1}), "<div>1</div>", "render using template name" );
    ok( delete template["test"], "remove cache item" );
});

test('escaping', function() {
    equal(tmpl("${ 'foo<div>bar</div>baz' }"), 'foo&lt;div&gt;bar&lt;/div&gt;baz', 'echoing escapes html');
    equal(tmpl("${ r }", {r:'foo<div>bar</div>baz'}), 'foo&lt;div&gt;bar&lt;/div&gt;baz',  'echoing escapes html (lookup)');
    equal(tmpl("${ '&' }"), '&amp;', 'echoing escapes ampersands 1');
    equal(tmpl("${ '&amp;' }"), '&amp;amp;', 'echoing escapes ampersands 2');
    equal(tmpl("${ '-<&>-<&>-' }"), '-&lt;&amp;&gt;-&lt;&amp;&gt;-', 'echoing escapes & < >');
});

test('${}', function() {
    equal( tmpl(tpl1, {a:1}), "<div>1</div>", "use simple data object" );
    equal( tmpl(tpl1,{a:'<div id="123">2</div>'}), "<div>&lt;div id=&quot;123&quot;&gt;2&lt;/div&gt;</div>", "escaping per default" );
    equal( tmpl(tpl2, {a:1}), "<div>1</div>", "use simple data object, using {{= }} in the template " );
    equal( tmpl(tpl1, [{a:1}]), "<div>1</div>", "use an array with one object element" );
    equal( tmpl(tpl2, [{a:1}]), "<div>1</div>", "use an array with one object element, using {{= }} in the template" );
    equal( tmpl(tpl1, [{a:1},{a:2}]), "<div>1</div><div>2</div>", "use an array with 2 objects" );
    equal( tmpl(tpl1, {a: function(){return 1}}), "<div>1</div>", "use function as a value" );
})

test('local variables', function() {
    equal( tmpl(tpl3, {a:1}), "<div>1</div>", "test access to $data" );
    equal( tmpl(tpl4, {a:1}), "<div>1</div>", "test access to $item" );
    equal( tmpl(tpl5, null, {someFunction: function() {return 1}}), "<div>1</div>", "test access to $item" );
});

test('${html}', function() {
    equal( tmpl(tpl6,{a:'<div id="123">2</div>'}), '<div id="123">2</div>', 'output html without escaping');
});

test('${if}', function() {
    equal( tmpl(tpl9,{a:1}), "<div>1</div>", "test 'if' when true" );
    equal( tmpl(tpl9,{a:2}), "", "test 'if' when false" );
});

test('{else}', function() {
    equal( tmpl(tpl11,{a:1}), "<div>1</div>", "test else when true" );
    equal( tmpl(tpl11,{a:2}), "2", "test else when false" );
    equal( tmpl(tpl12,{a:2}), "2", "test else =2" );
    equal( tmpl(tpl12,{a:3}), "3", "test else =3" );
});

test('{{each}}', function() {
    equal(
        tmpl(
            "{{each(index, value) names}}<div>${index}.${value}</div>{{/each}}",
            {names: ["A", "B"]}
        ),
        "<div>0.A</div><div>1.B</div>", "test 'each', use index and value, explizitely mapping them "
    );
    equal(
        tmpl(
            "{{each names}}<div>${$index}.${$value}</div>{{/each}}",
            {names: ["A", "B"]}
        ),
        "<div>0.A</div><div>1.B</div>", "test 'each', use index and name with auto mapping"
    );
    equal(
        tmpl(
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
    equal(
        tmpl(
            "{{each data }}<div>${$value}</div>{{/each}}",
            {
                data: {1:1, 2:2, 3:3}
            }
        ),
        "<div>1</div><div>2</div><div>3</div>",
        "iterate over json in each loop"
    );
});


test('{{tmpl}}', function() {
    equal(
        tmpl(
            "{{tmpl(data) extTpl}}",
            {
                extTpl: "<div>${a}</div>",
                data: {a:123456}
            }
        ),
        "<div>123456</div>",
        "include template {{tmpl}} and pass data object"
    );

    equal(
        tmpl(
            "{{tmpl(data) extTpl}}",
            {
                extTpl: "<div>${a}</div>",
                data: [{a:1}, {a:2}]
            }
        ),
        "<div>1</div><div>2</div>",
        "include template {{tmpl}} and pass data array"
    );
});

test('{{!}}', function() {
    equal( tmpl("<div>{{! its a comment}}</div>", {a:1}), "<div></div>", "comments work" );
});

test('empty template', function() {
    try {
        equal(tmpl(''), '', 'empty template string rendered without errors');
    } catch(e) {
        ok(false, 'empty template shouldn\'t throw errors');
    }
});

test('preserve whitespaces', function() {
    var html;

    try {
        html = tmpl(
            '<div>\n{{= [{\tkey: \n"value"\r}] }}\n</div>',
            {}
        );
        ok(true, 'no compilation errors');
    } catch(err) {
        ok(false, err.message);
    }

    equal(
        html,
        '<div>\n[object Object]\n</div>',
        'whitespaces preserved'
    );

    try {
        html = tmpl(
            '<div>\n{{= someFunction({\tkey: \n"value"\r}) }}\n</div>',
            {
                someFunction: function(data) {
                    return 'some text ' + data.key;
                }
            }
        );
        ok(true, 'no compilation errors');
    } catch(err) {
        ok(false, err.message);
    }

    equal(
        html,
        '<div>\nsome text value\n</div>',
        'whitespaces preserved'
    );
});

test('{{verbatim}}', function() {
    equal(
        tmpl(
            "<div>{{= a}}{{verbatim}}${a}12345{{/verbatim}{{/verbatim}}{{verbatim}}}{{= a}}{{/verbatim}}${a}</div>",
            {a:1}
        ),
        "<div>1${a}12345{{/verbatim}}{{= a}}1</div>",
        "verbatim"
    );
});
