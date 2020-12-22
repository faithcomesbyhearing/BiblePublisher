#!/bin/sh

echo \"use strict\"\; > HTML.js
cat ../Library/util/Directory.js >> HTML.js
cat ../Library/xml/XMLTokenizer.js >> HTML.js
cat ../Library/io/ValidationAdapter.js >> HTML.js
cat js/USXFileCompare.js >> HTML.js
cat js/HTMLValidator.js >> HTML.js

node HTML.js $*


