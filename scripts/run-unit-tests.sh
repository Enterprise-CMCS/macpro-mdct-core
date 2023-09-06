#!/bin/bash

set -e

install_deps() {
  if [ "$CI" == "true" ]; then # If we're in a CI system
    if [ ! -d "node_modules" ]; then # If we don't have any node_modules, run yarn install --frozen-lockfile.  Otherwise, we're all set, do nothing.
      yarn install --frozen-lockfile
    fi
  else # We're not in a CI system, let's yarn install
    yarn install
  fi
}

install_deps
echo "$(pwd)"
echo "$PATH"
export PATH=$(pwd)/node_modules/.bin/:$PATH
echo "$PATH"

yarn run coverage
