#!/bin/bash
#
# Install development environment.

set -e

./scripts/clean.sh

if ! which npm &> /dev/null; then
    sudo apt-get install npm
fi

npm --save-dev install \
    rollup \
    rollup-plugin-cleanup \
    rollup-plugin-terser

npm --no-save install \
    https://github.com/jquery/jquery#main
