pegjs = node_modules/pegjs/bin/pegjs

$(pegjs):
	npm install

src/pascal.js: src/pascal.pegjs $(pegjs)
	$(pegjs) src/pascal.pegjs

src/emit.js: src/emit.pegjs $(pegjs)
	$(pegjs) src/emit.pegjs

test: src/pascal.js src/index.js
	node src/index.js

build/%.js: tests/%.pas src/compile.js src/emit.js
	node src/compile.js $< > $@

emit_spike: build/if1.js build/var.js
	node build/var.js
	node build/if1.js
