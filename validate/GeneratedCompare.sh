#!/bin/sh

# This program is a secondary check that compares two copies of the same Bible to see if the HTML has changed.

if [ -z "$4" ]; then
	echo "Usage: GeneratedCompare.sh  oneDBDir  otherDBDir  outputDir  bibleId";
	exit 1;
fi
BIBLEID=$4;
OUTDIR=$3

ONE_DB=$1${BIBLEID}.db;
OTHER_DB=$2${BIBLEID}.db;

ONE_FILE=${OUTDIR}${BIBLEID}/ONE.html
OTHER_FILE=${OUTDIR}${BIBLEID}/OTHER.html

DIFF_FILE=${OUTDIR}${BIBLEID}/ONE_OTHER_DIFF.txt

sqlite3 ${ONE_DB} <<END_SQL
.output $ONE_FILE
select html from chapters;
END_SQL

sqlite3 ${OTHER_DB} <<END_SQL
.output $OTHER_FILE
select html from chapters;
END_SQL

diff $ONE_FILE $OTHER_FILE > ${DIFF_FILE}

ls -l ${DIFF_FILE}