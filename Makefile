SHELL := /bin/bash
PATH  := ~/.npm-global/bin:node_modules/.bin:$(PATH)

build: dist/promiseplus.js dist/promiseplus.es6.js

dist/promiseplus.js: src/promiseplus.mjs
	mkdir -p $(@D)
	babel $< -o $@

dist/promiseplus.es6.js: src/promiseplus.mjs
	mkdir -p $(@D)
	cp $< $@

test: dist/promiseplus.js dist/promiseplus.es6.js
	jasmine

clean:
	rm -rf build

install:
	npm install

uninstall:
	rm -rf node_modules/

all: install build test

.PHONY: all clean install uninstall test
