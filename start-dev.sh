#!/bin/sh
export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:$PATH"
cd "$(dirname "$0")"
exec node node_modules/.bin/vite "$@"
