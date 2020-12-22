#!/bin/sh

echo \"use strict\"\; > XMLTokenizer.js
cat ../Library/util/Directory.js >> XMLTokenizer.js
cat ../Library/xml/XMLTokenizer.js >> XMLTokenizer.js
cat ../Library/io/ValidationAdapter.js >> XMLTokenizer.js
cat js/USXFileCompare.js >> XMLTokenizer.js
cat js/XMLTokenizerTest.js >> XMLTokenizer.js
node XMLTokenizer.js $*
