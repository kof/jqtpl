test: test-jqtpl test-express

test-jqtpl:
	./node_modules/qunit/bin/cli.js -c ./lib/jqtpl.js -t ./test/jqtpl.js

test-express:
	./node_modules/qunit/bin/cli.js -c ./lib/jqtpl.express.js -t ./test/express.js

lint:
	linter -f ./lib/jqtpl.js

.PHONY: test test-jqtpl test-express lint
