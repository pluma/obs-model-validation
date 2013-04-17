LICENSE_COMMENT="/*! obs-model-validation 0.1.0 Copyright (c) 2013 Alan Plum. MIT licensed. */"

test:
	@./node_modules/.bin/mocha \
		--growl \
		--reporter spec \
		spec/*.js

clean:
	@rm -rf dist

dist/vendor: clean
	@mkdir -p dist/vendor

dist/obs-model-validation.js: dist/vendor
	@echo $(LICENSE_COMMENT) > dist/obs-model-validation.js
	@cat src/obs-model-validation.js >> dist/obs-model-validation.js

dist/obs-model-validation.globals.js: dist/vendor
	@echo $(LICENSE_COMMENT) > dist/obs-model-validation.globals.js
	@echo "(function(root){\
	var require=function(key){return root[key];},\
	exports=(root.obs-model-validation={});" >> dist/obs-model-validation.globals.js
	@cat src/obs-model-validation.js >> dist/obs-model-validation.globals.js
	@echo "}(this));" >> dist/obs-model-validation.globals.js

dist/obs-model-validation.amd.js: dist/vendor
	@echo $(LICENSE_COMMENT) > dist/obs-model-validation.amd.js
	@echo "define(function(require, exports) {" >> dist/obs-model-validation.amd.js
	@cat src/obs-model-validation.js >> dist/obs-model-validation.amd.js
	@echo "});" >> dist/obs-model-validation.amd.js

dist/obs-model-validation.min.js: dist/obs-model-validation.js
	@./node_modules/.bin/uglifyjs dist/obs-model-validation.js > dist/obs-model-validation.min.js

dist/obs-model-validation.globals.min.js: dist/obs-model-validation.globals.js
	@./node_modules/.bin/uglifyjs dist/obs-model-validation.globals.js > dist/obs-model-validation.globals.min.js

dist/obs-model-validation.amd.min.js: dist/obs-model-validation.amd.js
	@./node_modules/.bin/uglifyjs dist/obs-model-validation.amd.js > dist/obs-model-validation.amd.min.js

dist: dist/obs-model-validation.min.js dist/obs-model-validation.globals.min.js dist/obs-model-validation.amd.min.js

lint:
	@./node_modules/.bin/jshint src/obs-model-validation.js spec

.PHONY: lint test clean
