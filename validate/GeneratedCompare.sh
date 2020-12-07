#!/bin/sh

if [ -z "$1" ]; then
	echo "Usage: GeneratedCompare.sh VERSION";
	exit 1;
fi
VERSION=$1;

DBL=${HOME}/ShortSands/DBL;
PRODUCTION_DB=${DBL}/5ready/${VERSION}.db;
DEVELOPMENT_DB=${DBL}/3prepared/${VERSION}.db;

PRODUCTION_FL=output/diff/PROD_${VERSION}.html
DEVELOPMENT_FL=output/diff/DEV_${VERSION}.html

sqlite3 ${PRODUCTION_DB} <<END_SQL
.output $PRODUCTION_FL
select html from chapters;
END_SQL

sqlite3 ${DEVELOPMENT_DB} <<END_SQL
.output $DEVELOPMENT_FL
select html from chapters;
END_SQL

diff $PRODUCTION_FL $DEVELOPMENT_FL > output/diff/DIFF_${VERSION}.txt

ls -l output/diff/*${VERSION}*