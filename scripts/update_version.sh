#!/bin/bash
# Sets the version of the component from VERSION file and points the example to it
set -e

version=$(tr -d '[:space:]' < VERSION)
npm --no-commit-hooks --no-git-tag-version --allow-same-version version "$version"

cd example
dependency="^$version"
if [ "$(npm pkg get "dependencies.@mamenko/editable-table" | tr -d '"')" != "$dependency" ]; then
  npm pkg set "dependencies.@mamenko/editable-table=$dependency"
  # The example is changed only when it uses the new version of the component
  npm --no-commit-hooks --no-git-tag-version version patch
fi
