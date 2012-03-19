test: test-jqtpl test-express test-express-production

test-jqtpl:
	./node_modules/qunit/bin/cli.js -c ./lib/jqtpl.js -t ./test/jqtpl.js

test-express:
	./node_modules/qunit/bin/cli.js -c ./lib/jqtpl.express.js -t ./test/express.js

test-express-production:
	NODE_ENV=production ./node_modules/qunit/bin/cli.js -c ./lib/jqtpl.express.js -t ./test/express.js

lint:
	linter -f ./lib/jqtpl.js

.PHONY: test test-jqtpl test-express test-express-production lint
