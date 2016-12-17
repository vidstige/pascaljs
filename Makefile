pegjs = node_modules/pegjs/bin/pegjs

SRCS=$(wildcard tests/*.pas)
OBJS=$(patsubst tests/%.pas,build/%.js,$(SRCS))
EXPECTED=$(patsubst tests/%.pas,tests/expectations/%.out,$(SRCS))

$(pegjs):
	npm install

src/pascal.js: src/pascal.pegjs $(pegjs)
	$(pegjs) src/pascal.pegjs

test: $(OBJS) $(EXPECTED) verify.sh
	@./verify.sh "$(OBJS)"

build/%.js: tests/%.pas src/compile.js src/pascal.js
	@mkdir -p build/
	node src/compile.js $< > $@ || rm $@

clean:
	rm -rf src/pascal.js build/

.PHONY: test clean
