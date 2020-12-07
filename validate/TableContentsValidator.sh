#!/bin/sh

if [ -z "$1" ]; then
	echo "Usage: TableContentsValidator.sh VERSION";
	exit 1;
fi

VERSION=$1;
DB_PATH=../../DBL/3prepared/${VERSION}.db;

sqlite3 ${DB_PATH} <<END_SQL
select lastChapter + chapterRowId from tableContents where code='REV';
END_SQL

echo 'Response should be 1255'

