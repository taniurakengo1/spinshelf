#!/bin/bash
set -e

PLIST_DIR="$HOME/Library/LaunchAgents"
PLIST_PATH="$PLIST_DIR/com.spinshelf.app.plist"

mkdir -p "$PLIST_DIR"

cat > "$PLIST_PATH" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.spinshelf.app</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/spinshelf</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <false/>
</dict>
</plist>
EOF

echo "✅ LaunchAgent registered (auto-start at login)"
