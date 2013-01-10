(function(jqtpl) {

var rTag = /\{\{tr\}\}((.|\n)*?)\{\{\/tr\}\}/g,
    rInterp = /\{([^}]*)\}/g,
    $ = jqtpl.$;

jqtpl.tag.tr = {
    default: {__1: '""'},
    open: 'if(__notnull_1){__body+=$.tr(__1a, __2, __inner)}',
    close: '',
};

jqtpl.pre.push(function(markup) {
    var self = this;
    this.trs = [];

    // Save all the data inside the verbatim tags.
    return markup.replace(rTag, function(match, content) {
        self.trs.push(content);

        // Replace the {{verbatim}}data{{/verbatim}} with just __verbatim__
        // this tag will let the parser know where to inject the corresponding data.
        return '__verbatim__';
    });
});


                ret = ret.replace('__inner', inner ? '"' + inner + '"' : '""');


$.tr = function(str, data, inner) {
    str = str || inner || '';

    if (data && str) {
        str = str.replace(rInterp, function(_, key) {
            return data[key];
        });
    }

    return str;
};

}(function(){
    if (this.jqtpl) {
        return this.jqtpl;
    }

    if (typeof require == 'function') {
        return require('jqtpl');
    }
}()));
