pegjs = node_modules/pegjs/bin/pegjs 
$(pegjs):
	npm install

src/pascal.js: src/pascal.pegjs $(pegjs)
	$(pegjs) src/pascal.pegjs

src/emit.js: src/emit.pegjs $(pegjs)
	$(pegjs) src/emit.pegjs

test: src/pascal.js src/index.js
	node src/index.js

emit_spike: src/emit.js src/compile.js
	node src/compile.js tests/writeln.pas