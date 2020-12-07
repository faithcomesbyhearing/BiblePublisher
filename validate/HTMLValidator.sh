#!/bin/sh

if [ -z "$1" ]; then
	echo "Usage: HTMLValidator.sh VERSION";
	exit 1;
fi

VERSION=$1;

echo \"use strict\"\; > temp.js
cat ../Library/util/Directory.js >> temp.js
cat ../Library/model/meta/Canon.js >> temp.js
cat ../Library/xml/XMLTokenizer.js >> temp.js
cat js/HTMLValidator.js >> temp.js

node temp.js $VERSION


