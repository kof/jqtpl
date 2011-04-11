test: jqtpl express

jqtpl:
	qunit -c ./lib/jqtpl.js -t ./test/jqtpl.js

express:
	qunit -c ./lib/jqtpl.express.js -t ./test/express.js --cov false
	
lint:
	linter -f ./lib/jqtpl.js
	
.PHONY: test jqtpl express lint	