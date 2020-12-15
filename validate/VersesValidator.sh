#!/bin/sh

if [ -z "$3" ]; then
	echo "Usage: VersesValidator.sh  dbDir  outputDir  bibleId";
	exit 1;
fi

VERSION=$3;
DB_PATH=$1/${VERSION}.db;

echo "${VERSION} VersesValidator START"

sqlite3 ${DB_PATH} <<END_SQL
.output $2/$3/verses.txt
select reference, html from verses;
END_SQL

echo \"use strict\"\; > temp.js
#cat ../Library/model/meta/Canon.js >> temp.js
cat ../Library/xml/XMLTokenizer.js >> temp.js
cat js/VersesValidator.js >> temp.js

node temp.js $*

#diff -y $2/$3/chapters.txt $2/$3/verses.txt
diff $2/$3/chapters.txt $2/$3/verses.txt

echo "${VERSION} VersesValidator DONE"

