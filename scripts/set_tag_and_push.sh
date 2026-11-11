#!/bin/bash

version=$(cat VERSION)
git tag "v$version" -m "v$version"
git push --tags
