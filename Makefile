test:
	qunit -c lib/jqtpl.js -t test/main.js test/express.js
lint:
	linter -f lib/jqtpl.js
	
.PHONY: test lint	