#!/bin/sh

echo \"use strict\"\; > Concordance.js
cat ../Library/model/meta/Canon.js >> Concordance.js
cat js/ConcordanceValidator.js >> Concordance.js

node Concordance.js $*
