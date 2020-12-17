#!/bin/sh

if [ -z "$3" ]; then
	echo "Usage: VersesValidator.sh  dbDir  outputDir  bibleId";
	exit 1;
fi

echo \"use strict\"\; > temp.js
cat ../Library/xml/XMLTokenizer.js >> temp.js
cat ../Library/io/ValidationAdapter.js >> temp.js
cat js/TextFileCompare.js >> temp.js
cat js/VersesValidator.js >> temp.js

node temp.js $*

