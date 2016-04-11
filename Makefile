test:
	./node_modules/qunit/bin/cli.js -c ./lib/express.js -t ./test/express.js -l "{globalSummary: true}"
	NODE_ENV=production ./node_modules/qunit/bin/cli.js -c ./lib/express.js -t ./test/express.js -l "{globalSummary: true}"
	./node_modules/qunit/bin/cli.js -c ./lib/jqtpl.js -t ./test/jqtpl.js -l "{globalSummary: true}"

test-jqtpl:
	./node_modules/qunit/bin/cli.js -c ./lib/jqtpl.js -t ./test/jqtpl.js -l "{assertions: true, globalSummary: true, errors: true}"

test-tags:
	NODE_PATH=$(CURDIR)/lib ./node_modules/qunit/bin/cli.js -d lib/tags/tr.js lib/tags/verbatim.js  -c ./lib/jqtpl.js -t ./test/tags.js -l "{assertions: true, globalSummary: true, errors: true}"

test-express:
	./node_modules/qunit/bin/cli.js -c ./lib/express.js -t ./test/express.js -l "{assertions: true, globalSummary: true, errors: true}"

test-express-production:
	NODE_ENV=production ./node_modules/qunit/bin/cli.js -c ./lib/express.js -t ./test/express.js  -l "{assertions: true, globalSummary: true, errors: true}"

.PHONY: test test-jqtpl test-express test-express-production
