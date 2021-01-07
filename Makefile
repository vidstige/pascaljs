pegjs = node_modules/pegjs/bin/pegjs

SRCS=$(wildcard tests/*.pas)
VERIFICATION=$(patsubst tests/%.pas,verify/%,$(SRCS))

$(pegjs):
	npm install

src/pascal.js: src/pascal.pegjs $(pegjs)
	$(pegjs) src/pascal.pegjs

tests/actual/%.out: build/%.js
	@mkdir -p tests/actual/
	node $< > $@

verify/%: tests/actual/%.out tests/expectations/%.out
	@./verify.sh $^

test: $(VERIFICATION)

build/%.js: tests/%.pas src/compile.js src/pascal.js src/backend/js.js
	@mkdir -p build/
	node src/compile.js $< > $@ || rm $@

clean:
	rm -rf src/pascal.js build/

.PRECIOUS: tests/actual/%.out

.PHONY: test clean verify/
