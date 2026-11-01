#!/usr/bin/env bash
set -euo pipefail
ROOT="$GITHUB_WORKSPACE/mobile"
mkdir -p "$ROOT/artifacts"
adb install -r "$ROOT/artifacts/Bayarin-1.0.0.apk"
adb logcat -c
adb shell monkey -p com.darreck0.bayarin -c android.intent.category.LAUNCHER 1
for attempt in $(seq 1 20); do
  adb shell uiautomator dump /sdcard/bayarin-window.xml >/dev/null 2>&1 || true
  adb pull /sdcard/bayarin-window.xml "$ROOT/artifacts/startup.xml" >/dev/null 2>&1 || true
  if grep -q 'Welcome back' "$ROOT/artifacts/startup.xml" 2>/dev/null; then
    adb exec-out screencap -p > "$ROOT/artifacts/mobile-login.png"
    echo 'PASS: standalone APK installed and reached the login screen without Metro.'
    exit 0
  fi
  sleep 2
done
adb logcat -d -s AndroidRuntime:E ReactNativeJS:E > "$ROOT/artifacts/startup-errors.txt"
cat "$ROOT/artifacts/startup-errors.txt"
echo 'FAIL: APK did not reach the login screen.' >&2
exit 1
