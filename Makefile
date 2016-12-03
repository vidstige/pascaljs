src/pascal.js: src/pascal.pegjs
	ls node_modules
	./node_modules/pegjs/bin/pegjs src/pascal.pegjs

test: src/pascal.js src/index.js
	node src/index.js