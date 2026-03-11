PREFIX ?= /usr/local
PLIST = $(HOME)/Library/LaunchAgents/com.spinshelf.app.plist

.PHONY: build install setup start stop uninstall

build:
	swift build -c release

install: build
	mkdir -p $(PREFIX)/bin
	cp .build/release/SpinShelf $(PREFIX)/bin/spinshelf
	@echo ""
	@echo "✅ Installed to $(PREFIX)/bin/spinshelf"
	@echo ""
	@echo "Next: run these WITHOUT sudo:"
	@echo "  make start"

start:
	@./scripts/setup-launchagent.sh
	@launchctl load -w $(PLIST) 2>/dev/null || true
	@launchctl start com.spinshelf.app 2>/dev/null || true
	@echo "✅ SpinShelf started (runs in background)"

stop:
	@launchctl stop com.spinshelf.app 2>/dev/null || true
	@launchctl unload $(PLIST) 2>/dev/null || true
	@echo "✅ SpinShelf stopped"

uninstall: stop
	rm -f $(PREFIX)/bin/spinshelf
	rm -f $(PLIST)
	@echo "✅ Uninstalled"
