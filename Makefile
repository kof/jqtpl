test:
	node test/test.js
lint:
	linter -f lib/jqtpl.js
	
.PHONY: test lint	