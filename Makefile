PREFIX ?= /usr/local

.PHONY: build install uninstall

build:
	swift build -c release

install: build
	mkdir -p $(PREFIX)/bin
	cp .build/release/SpinShelf $(PREFIX)/bin/spinshelf
	@echo ""
	@echo "✅ Installed to $(PREFIX)/bin/spinshelf"
	@echo ""
	@echo "Run 'spinshelf' to start."
	@echo "You need to grant Accessibility permission in:"
	@echo "  System Settings → Privacy & Security → Accessibility"

uninstall:
	rm -f $(PREFIX)/bin/spinshelf
	@echo "✅ Uninstalled"
