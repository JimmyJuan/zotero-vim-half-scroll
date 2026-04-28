VERSION := $(shell node -p "require('./manifest.json').version")
XPI := dist/zotero-vim-half-scroll-$(VERSION).xpi

.PHONY: build clean

build:
	mkdir -p dist
	zip -X -r $(XPI) manifest.json bootstrap.js README.md LICENSE
	@echo "Built $(XPI)"

clean:
	rm -rf dist
