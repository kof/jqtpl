(function(jqtpl) {

var rTag = /\{\{verbatim\}\}((.|\n)*?)\{\{\/verbatim\}\}/g,
    rTagPlaceholder = /(__verbatim__)/g,
    $ = jqtpl.$;

jqtpl.tag.verbatim = {};

jqtpl.pre.push(function(markup) {
    var self = this;
    this.verbatims = [];

    // Save all the data inside the verbatim tags.
    return markup.replace(rTag, function(match, content) {
        self.verbatims.push(content);

        // Replace the {{verbatim}}data{{/verbatim}} with just __verbatim__
        // this tag will let the parser know where to inject the corresponding data.
        return '__verbatim__';
    });
});

jqtpl.post.push(function(markup) {
    var self = this;

    return markup.replace(rTagPlaceholder, function(match, content) {
        return $.escape(self.verbatims.shift());
    });
});

}(function(){
    if (this.jqtpl) {
        return this.jqtpl;
    }

    if (typeof require == 'function') {
        return require('jqtpl');
    }
}()));
