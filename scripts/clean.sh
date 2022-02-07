#!/bin/bash
#
# Clean development environment.

set -e

to_remove=(
    dist node_modules package-lock.json
)

for item in "${to_remove[@]}"; do
    if [ -e "$item" ]; then
        rm -r "$item"
    fi
done
