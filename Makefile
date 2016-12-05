pegjs = node_modules/pegjs/bin/pegjs 
$(pegjs):
	npm install

src/pascal.js: src/pascal.pegjs $(pegjs)
	$(pegjs) src/pascal.pegjs

test: src/pascal.js src/index.js
	node src/index.js
