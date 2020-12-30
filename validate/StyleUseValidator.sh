#!/bin/sh

if [ -z "$3" ]; then
	echo "Usage: StyleUseValidator.sh  dbDir  outputDir  bibleId";
	exit 1;
fi

VERSION=$3;
DB_PATH=$1/${VERSION}.db;
OUTPUT=$2

echo "${VERSION} StyleUseValidator START"

sqlite3 ${DB_PATH} <<END_SQL
select * from styleIndex where usage || '.' || style not in (select usage || '.' || style from styleUse) and style != 'undefined';
select usage, style, count(*) from styleIndex where usage || '.' || style not in (select usage || '.' || style from styleUse) and style != 'undefined' group by usage, style;
.output ${OUTPUT}/styleUseUnfinished.txt
select * from styleIndex where usage || '.' || style not in (select usage || '.' || style from styleUse) and style != 'undefined';
select usage, style, count(*) from styleIndex where usage || '.' || style not in (select usage || '.' || style from styleUse) and style != 'undefined' group by usage, style;
END_SQL

echo "${VERSION} StyleUseValidator DONE"

