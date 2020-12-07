#!/bin/sh

if [ -z "$1" ]; then
	echo "Usage: StyleUseValidator.sh VERSION";
	exit 1;
fi

VERSION=$1;
DB_PATH=../../DBL/3prepared/${VERSION}.db;

sqlite3 ${DB_PATH} <<END_SQL
select * from styleIndex where usage || '.' || style not in (select usage || '.' || style from styleUse) and style != 'undefined';
select usage, style, count(*) from styleIndex where usage || '.' || style not in (select usage || '.' || style from styleUse) and style != 'undefined' group by usage, style;
.output output/$1/styleUseUnfinished.txt
select * from styleIndex where usage || '.' || style not in (select usage || '.' || style from styleUse) and style != 'undefined';
select usage, style, count(*) from styleIndex where usage || '.' || style not in (select usage || '.' || style from styleUse) and style != 'undefined' group by usage, style;
END_SQL

