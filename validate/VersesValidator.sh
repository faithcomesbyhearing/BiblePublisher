#!/bin/sh

echo \"use strict\"\; > Verses.js
cat ../Library/xml/XMLTokenizer.js >> Verses.js
cat ../Library/io/ValidationAdapter.js >> Verses.js
cat js/TextFileCompare.js >> Verses.js
cat js/VersesValidator.js >> Verses.js

node Verses.js $*

