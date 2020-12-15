#!/bin/sh

if [ -z "$2" ]; then
	echo "Usage: TableContentsValidator.sh  dbDir  bibleId";
	exit 1;
fi

VERSION=$2;
DB_PATH=$1/${VERSION}.db;

sqlite3 ${DB_PATH} <<END_SQL
SELECT rowId, code, heading, title, name, abbrev, chapters, priorBook, nextBook FROM tableContents
END_SQL



