PREFIX ?= /usr/local
PLIST_DIR = $(HOME)/Library/LaunchAgents
PLIST_NAME = com.spinshelf.app.plist

.PHONY: build install uninstall start stop

build:
	swift build -c release

install: build
	mkdir -p $(PREFIX)/bin
	cp .build/release/SpinShelf $(PREFIX)/bin/spinshelf
	@# LaunchAgent plist を生成（ログイン時に自動起動＋バックグラウンド実行）
	@mkdir -p $(PLIST_DIR)
	@echo '<?xml version="1.0" encoding="UTF-8"?>' > $(PLIST_DIR)/$(PLIST_NAME)
	@echo '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">' >> $(PLIST_DIR)/$(PLIST_NAME)
	@echo '<plist version="1.0">' >> $(PLIST_DIR)/$(PLIST_NAME)
	@echo '<dict>' >> $(PLIST_DIR)/$(PLIST_NAME)
	@echo '  <key>Label</key>' >> $(PLIST_DIR)/$(PLIST_NAME)
	@echo '  <string>com.spinshelf.app</string>' >> $(PLIST_DIR)/$(PLIST_NAME)
	@echo '  <key>ProgramArguments</key>' >> $(PLIST_DIR)/$(PLIST_NAME)
	@echo '  <array>' >> $(PLIST_DIR)/$(PLIST_NAME)
	@echo '    <string>$(PREFIX)/bin/spinshelf</string>' >> $(PLIST_DIR)/$(PLIST_NAME)
	@echo '  </array>' >> $(PLIST_DIR)/$(PLIST_NAME)
	@echo '  <key>RunAtLoad</key>' >> $(PLIST_DIR)/$(PLIST_NAME)
	@echo '  <true/>' >> $(PLIST_DIR)/$(PLIST_NAME)
	@echo '  <key>KeepAlive</key>' >> $(PLIST_DIR)/$(PLIST_NAME)
	@echo '  <false/>' >> $(PLIST_DIR)/$(PLIST_NAME)
	@echo '</dict>' >> $(PLIST_DIR)/$(PLIST_NAME)
	@echo '</plist>' >> $(PLIST_DIR)/$(PLIST_NAME)
	@echo ""
	@echo "✅ Installed to $(PREFIX)/bin/spinshelf"
	@echo "✅ LaunchAgent installed (auto-start at login)"
	@echo ""
	@echo "Run 'make start' to start now."
	@echo "SpinShelf will auto-start on next login."
	@echo ""
	@echo "Grant Accessibility permission in:"
	@echo "  System Settings → Privacy & Security → Accessibility"

start:
	@launchctl load -w $(PLIST_DIR)/$(PLIST_NAME) 2>/dev/null || true
	@launchctl start com.spinshelf.app 2>/dev/null || true
	@echo "✅ SpinShelf started"

stop:
	@launchctl stop com.spinshelf.app 2>/dev/null || true
	@launchctl unload $(PLIST_DIR)/$(PLIST_NAME) 2>/dev/null || true
	@echo "✅ SpinShelf stopped"

uninstall: stop
	rm -f $(PREFIX)/bin/spinshelf
	rm -f $(PLIST_DIR)/$(PLIST_NAME)
	@echo "✅ Uninstalled"
