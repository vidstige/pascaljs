pegjs = node_modules/pegjs/bin/pegjs

SRCS=$(wildcard tests/*.pas)
OBJS=$(patsubst tests/%.pas,build/%.js,$(SRCS))
EXPECTED=$(patsubst tests/%.pas,tests/expectations/%.out,$(SRCS))

$(pegjs):
	npm install

src/emit.js: src/emit.pegjs $(pegjs)
	$(pegjs) src/emit.pegjs

test: $(OBJS) $(EXPECTED) verify.sh
	@./verify.sh "$(OBJS)"

build/%.js: tests/%.pas src/compile.js src/emit.js
	@mkdir -p build/
	node src/compile.js $< > $@ || rm $@

.PHONY: test
