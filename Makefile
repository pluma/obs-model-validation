LICENSE_COMMENT="/*! obs-model-validation 0.3.0 Copyright (c) 2013 Alan Plum. MIT licensed. @preserve */"

test:
	@./node_modules/.bin/mocha \
		--growl \
		--reporter spec \
		spec/*.spec.js

clean:
	@rm -rf dist

dist/vendor: clean
	@mkdir -p dist

dist/obs-model-validation.js: dist/vendor
	@echo $(LICENSE_COMMENT) > dist/obs-model-validation.js
	@cat src/obs-model-validation.js >> dist/obs-model-validation.js

dist/obs-model-validation.globals.js: dist/vendor
	@echo $(LICENSE_COMMENT) > dist/obs-model-validation.globals.js
	@echo "(function(root){\
	var require=function(key){return root[key];},\
	module={};" >> dist/obs-model-validation.globals.js
	@cat src/obs-model-validation.js >> dist/obs-model-validation.globals.js
	@echo "root.obsModelValidation = module.exports;\
	}(this));" >> dist/obs-model-validation.globals.js

dist/obs-model-validation.amd.js: dist/vendor
	@echo $(LICENSE_COMMENT) > dist/obs-model-validation.amd.js
	@echo "define(function(require, exports, module) {" >> dist/obs-model-validation.amd.js
	@cat src/obs-model-validation.js >> dist/obs-model-validation.amd.js
	@echo "return module.exports;});" >> dist/obs-model-validation.amd.js

dist/obs-model-validation.min.js: dist/obs-model-validation.js
	@./node_modules/.bin/uglifyjs dist/obs-model-validation.js --comments -m > dist/obs-model-validation.min.js

dist/obs-model-validation.globals.min.js: dist/obs-model-validation.globals.js
	@./node_modules/.bin/uglifyjs dist/obs-model-validation.globals.js --comments -m > dist/obs-model-validation.globals.min.js

dist/obs-model-validation.amd.min.js: dist/obs-model-validation.amd.js
	@./node_modules/.bin/uglifyjs dist/obs-model-validation.amd.js --comments > dist/obs-model-validation.amd.min.js

dist: dist/obs-model-validation.min.js dist/obs-model-validation.globals.min.js dist/obs-model-validation.amd.min.js

lint:
	@./node_modules/.bin/jshint src/obs-model-validation.js spec

.PHONY: lint test clean
