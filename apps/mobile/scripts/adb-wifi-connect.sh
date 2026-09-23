#!/usr/bin/env bash
# Wireless ADB (Android 11+). No USB required after first pairing.
#
# Phone: Settings → Developer options → Wireless debugging → ON
#   "Pair device with pairing code" → note IP, pair port, and 6-digit code
#   Main screen also shows IP and debug port for "adb connect"
#
# Usage:
#   npm run android:wifi -- 192.168.2.45 41235 39847 847291
#   npm run android:wifi -- 192.168.2.45 39847          # connect only (already paired)
#
set -euo pipefail

IP="${1:-${ADB_WIFI_IP:-}}"
PAIR_PORT="${2:-${ADB_WIFI_PAIR_PORT:-}}"
DEBUG_PORT="${3:-${ADB_WIFI_DEBUG_PORT:-}}"
PAIR_CODE="${4:-${ADB_WIFI_PAIR_CODE:-}}"

# Strip spaces/dashes from pairing code (phone UI shows "8 4 7 2 9 1")
PAIR_CODE="$(echo "${PAIR_CODE}" | tr -d '[:space:]-')"

if [[ -z "$IP" ]]; then
  echo "Usage: npm run android:wifi -- <phone-ip> [pair-port] [debug-port] [pair-code]"
  echo ""
  echo "First time (pair + connect):"
  echo "  npm run android:wifi -- 192.168.2.45 41235 39847 847291"
  echo "  ↑ code = 6 digits, NO spaces (847291 not '8 4 7 2 9 1')"
  echo ""
  echo "Later (connect only):"
  echo "  npm run android:wifi -- 192.168.2.45 39847"
  exit 1
fi

adb kill-server >/dev/null 2>&1 || true
adb start-server

# Two-arg form: IP + debug port only
if [[ -n "$PAIR_PORT" && -z "$DEBUG_PORT" ]]; then
  DEBUG_PORT="$PAIR_PORT"
  PAIR_PORT=""
fi

if [[ -n "$PAIR_PORT" ]]; then
  echo "Pairing with ${IP}:${PAIR_PORT} ..."
  echo "Use the code shown NOW on phone (expires in ~60s)."

  if [[ -z "$PAIR_CODE" ]]; then
    echo ""
    echo "Enter 6-digit code WITHOUT spaces, then Enter:"
    read -r PAIR_CODE
    PAIR_CODE="$(echo "${PAIR_CODE}" | tr -d '[:space:]-')"
  fi

  if [[ ! "$PAIR_CODE" =~ ^[0-9]{6}$ ]]; then
    echo "error: pairing code must be exactly 6 digits (got: '${PAIR_CODE}')"
    exit 1
  fi

  adb pair "${IP}:${PAIR_PORT}" "${PAIR_CODE}"
fi

if [[ -z "$DEBUG_PORT" ]]; then
  echo "Debug port required. Check Wireless debugging screen on phone."
  exit 1
fi

echo "Connecting to ${IP}:${DEBUG_PORT} ..."
adb connect "${IP}:${DEBUG_PORT}"

echo ""
adb devices -l
echo ""
echo "If you see '${IP}:${DEBUG_PORT} device', run: npm run dev:mobile:android"
