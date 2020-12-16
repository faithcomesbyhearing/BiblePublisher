#!/bin/sh

echo \"use strict\"\; > temp.js
cat ../Library/util/Directory.js >> temp.js
cat ../Library/xml/XMLTokenizer.js >> temp.js
cat ../Library/io/ValidationAdapter.js >> temp.js
cat js/USXFileCompare.js >> temp.js
cat js/XMLTokenizerTest.js >> temp.js
node temp.js $*
