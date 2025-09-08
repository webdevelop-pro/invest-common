#!/bin/sh
set -xe

# always change directly to current file location
SCRIPT_DIR=$(dirname "$0")
cd $SCRIPT_DIR

case $1 in

install)
  npm install # --frozen-lockfile --silent
  ;;

lint)
  npm run audit:check
  npm run lint $2
  ;;

tests)
  npm run unit
  ;;

*)
  echo "unknown $1, try help"
  ;;

esac
