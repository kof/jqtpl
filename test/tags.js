/*
test("verbatim tag", function() {
    equal(
        render(
            '<div>{{= a}}{{verbatim}}${a}12345{{/verbatim}{{/verbatim}}{{verbatim}}}{{= a}}{{/verbatim}}${a}</div>',
            {a:1}
       ),
        '<div>1${a}12345{{/verbatim}}{{= a}}1</div>',
        'verbatim'
   );
});
*/
test('tr tag', function() {
    /*
    equal(render('{{tr "a"}}'), 'a', 'simple string in double quotes');
    equal(render("{{tr 'a'}}"), 'a', 'simple string in single quotes');
    equal(render('{{tr({b: 1, c: 2}) "a{b}{c}"}}'), 'a12', 'interpolation');
*/
    equal(render('{{tr}}a{{/tr}}'), 'a', 'multiline translation');

    return;
    equal(render('{{tr}} \n\ta\n\t {{/tr}}'), 'a', 'trim multiline translation');
    equal(render('{{tr}}a {1}{{/tr}}'), 'a 1', 'multiline translation with interpolation');
});
