test: test-jqtpl test-express test-express-production

test-jqtpl:
	./node_modules/qunit/bin/cli.js -c ./lib/jqtpl.js -t ./test/jqtpl.js -l "{assertions: true, globalSummary: true, errors: true}"

test-express:
	./node_modules/qunit/bin/cli.js -c ./lib/jqtpl.express.js -t ./test/express.js -l "{assertions: true, globalSummary: true, errors: true}"

test-express-production:
	NODE_ENV=production ./node_modules/qunit/bin/cli.js -c ./lib/jqtpl.express.js -t ./test/express.js  -l "{assertions: true, globalSummary: true, errors: true}"

.PHONY: test test-jqtpl test-express test-express-production
