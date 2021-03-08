#!/bin/sh

echo \"use strict\"\; > USXParser.js
cat ../Library/util/Directory.js >> USXParser.js
cat ../Library/model/usx/USX.js >> USXParser.js
cat ../Library/model/usx/Book.js >> USXParser.js
cat ../Library/model/usx/Chapter.js >> USXParser.js
cat ../Library/model/usx/Para.js >> USXParser.js
cat ../Library/model/usx/Verse.js >> USXParser.js
cat ../Library/model/usx/Note.js >> USXParser.js
cat ../Library/model/usx/Char.js >> USXParser.js
cat ../Library/model/usx/Text.js >> USXParser.js
cat ../Library/model/usx/Ref.js >> USXParser.js
cat ../Library/model/usx/OptBreak.js >> USXParser.js
cat ../Library/model/usx/Table.js >> USXParser.js
cat ../Library/model/usx/Row.js >> USXParser.js
cat ../Library/model/usx/Cell.js >> USXParser.js
cat ../Library/model/usx/Figure.js >> USXParser.js
cat ../Library/xml/XMLTokenizer.js >> USXParser.js
cat ../Library/xml/USXParser.js >> USXParser.js
cat ../Library/io/ValidationAdapter.js >> USXParser.js
cat js/USXFileCompare.js >> USXParser.js
cat js/USXParserTest.js >> USXParser.js
node USXParser.js $*


