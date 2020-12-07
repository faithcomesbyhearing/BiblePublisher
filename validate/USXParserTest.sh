#!/bin/sh

echo \"use strict\"\; > temp.js
cat ../Library/util/Directory.js >> temp.js
cat ../Library/model/usx/USX.js >> temp.js
cat ../Library/model/usx/Book.js >> temp.js
cat ../Library/model/usx/Chapter.js >> temp.js
cat ../Library/model/usx/Para.js >> temp.js
cat ../Library/model/usx/Verse.js >> temp.js
cat ../Library/model/usx/Note.js >> temp.js
cat ../Library/model/usx/Char.js >> temp.js
cat ../Library/model/usx/Text.js >> temp.js
cat ../Library/model/usx/Ref.js >> temp.js
cat ../Library/model/usx/OptBreak.js >> temp.js
cat ../Library/model/usx/Table.js >> temp.js
cat ../Library/model/usx/Row.js >> temp.js
cat ../Library/model/usx/Cell.js >> temp.js
cat ../Library/xml/XMLTokenizer.js >> temp.js
cat ../Library/xml/USXParser.js >> temp.js
cat js/USXParserTest.js >> temp.js
node temp.js $*


