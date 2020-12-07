#!/bin/sh -v

if [ -z "$1" ]; then
	echo "Usage: Upload.sh VERSION";
	exit 1;
fi

VERSION=$1;

SOURCE=../../DBL/4validated
TARGET=../../DBL/5ready
HOST=root@cloud.shortsands.com
DIRECTORY=/root/StaticRoot/book/

echo "Upload $VERSION";


cp ${SOURCE}/${VERSION}.db ${TARGET}/${VERSION}.db

cd ${TARGET}
rm ${VERSION}.db.zip

zip ${VERSION}.db.zip ${VERSION}.db

##scp -P7022 ${VERSION}.db.zip ${HOST}:${DIRECTORY}

##scp -P7022 ${VERSION}.db ${HOST}:${DIRECTORY}


