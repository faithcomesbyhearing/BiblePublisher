#!/bin/sh
echo \"use strict\"\; > temp.js
cat ../Library/model/meta/Canon.js >> temp.js
cat js/ConcordanceValidator.js >> temp.js

node temp.js $*
