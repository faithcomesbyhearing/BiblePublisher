#!/bin/sh

echo \"use strict\"\; > temp.js
cat ../Library/util/Directory.js >> temp.js
cat ../Library/model/meta/Canon.js >> temp.js
cat ../Library/xml/XMLTokenizer.js >> temp.js
cat js/USXFileCompare.js >> temp.js
cat js/HTMLValidator.js >> temp.js

node temp.js $*


