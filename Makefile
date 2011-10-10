test: jqtpl express

jqtpl:
	./node_modules/qunit/bin/cli.js -c ./lib/jqtpl.js -t ./test/jqtpl.js --cov false

express:
	./node_modules/qunit/bin/cli.js -c ./lib/jqtpl.express.js -t ./test/express.js --cov false
	
lint:
	linter -f ./lib/jqtpl.js
	
.PHONY: test jqtpl express lint	