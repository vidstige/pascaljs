SRCS=$(wildcard tests/*.pas)
VERIFICATION=$(patsubst tests/%.pas,verify/%,$(SRCS))

src/pascal.js: src/pascal.pegjs $(pegjs)
	npx peggy --format es src/pascal.pegjs

tests/actual/%.out: export NODE_PATH=build/
tests/actual/%.out: build/%.js
	@mkdir -p tests/actual/
	node $< > $@ || rm $@
	@test -f $@

tests/expectations/%.out:
	@mkdir -p build/fpc/
	fpc $(patsubst tests/expectations/%.out,tests/%.pas,$@) -FEbuild/fpc
	$(patsubst tests/expectations/%.out,build/fpc/%,$@) > $@

verify/%: tests/actual/%.out tests/expectations/%.out
	@./verify.sh $^

test: $(VERIFICATION)

build/%.js: tests/%.pas src/compile.js src/pascal.js src/backend/js.js src/backend/assembler.js
	@mkdir -p build/
	node src/compile.js $< > $@ || rm $@
	@test -f $@

clean:
	rm -rf src/pascal.js build/

.PRECIOUS: tests/actual/%.out build/%.js tests/expectations/%.out

.PHONY: test clean verify/%
