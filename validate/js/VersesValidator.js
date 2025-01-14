/**
* This program validates that the HTML copy of the Bible that is generated by the Publisher program,
* contains exactly the same text as the original USX files.  The verses table was generated from the USX
* files by Library/manuacture/VersesBuilder.js  It did this by reading the USX files using the USXParser,
* This program reads the HTML files in the version.db Chapters table, and extracting the text.  
* It outputs both of these to a text file of the entire Bible, and does a line by 
* line comparison using diff.  
* In order to be able to do line by line comparison it outputs each verse as a line.
*/
function VersesValidator(version, versionPath) {
	this.version = version;
	this.versionPath = versionPath;
	this.fs = require('fs');
	this.db = null;
	Object.seal(this);
}
VersesValidator.prototype.open = function(callback) {
	var that = this;
	var sqlite3 = require('sqlite3');
	this.db = new sqlite3.Database(this.versionPath, sqlite3.OPEN_READWRITE, function(err) {
		if (err) that.fatalError(err, 'openDatabase');
		//that.db.on('trace', function(sql) { console.log('DO ', sql); });
		//that.db.on('profile', function(sql, ms) { console.log(ms, 'DONE', sql); });
		callback();
	});
};
VersesValidator.prototype.generateVersesFile = function(outPath, callback) {
	var that = this;
	const statement = 'SELECT reference, html FROM verses;'
	this.db.all(statement, [], function(err, results) {
		if (err) {
			that.fatalError(err, 'generateVersesFile');
		} else {
			var array = [];
			for (var i=0; i<results.length; i++) {
				var row = results[i];
				if (row.html && row.html.length > 0) {
					array.push(row.reference + '|' + row.html + '\n');
				}
			}
			that.fs.writeFileSync(outPath + '/verses.txt', array.join(''), 'utf8');
			callback();
		}
	});
}
VersesValidator.prototype.generateChaptersFile = function(outPath, callback) {
	var that = this;
	var bible = [];
	var chapter = [];
	var verse = [];
	var statement = 'SELECT reference, html FROM chapters';
	this.db.all(statement, [], function(err, results) {
		if (err) {
			that.fatalError(err, 'generateChaptersFile');
		} else {
			for (var i=1; i<results.length; i++) {
				var row = results[i];
				parseChapter(row.reference, row.html);
			}
			that.fs.writeFileSync(outPath + '/chapters.txt', bible.join(''), "utf8");
			callback();
		}
	});
	
	function parseChapter(reference, html) {
		var reader = new XMLTokenizer(html);
		var elementStack = [];
		var element = null;
		var attrName = null;
		var verseId = null;
		var clas = null;
		while (tokenType !== XMLNodeType.END) {
			var tokenType = reader.nextToken();
			var tokenValue = reader.tokenValue();
			
			switch(tokenType) {
				case XMLNodeType.ELE:
					element = { tagName: tokenValue };
					elementStack.push(element);
					break;
				case XMLNodeType.ELE_OPEN:
					element = { tagName: tokenValue };
					break;
				case XMLNodeType.ATTR_NAME:
					attrName = tokenValue;
					break;
				case XMLNodeType.ATTR_VALUE:
					element[attrName] = tokenValue;
					if (attrName === 'class' && tokenValue === 'v-number') {
						if(verseId !== element['id']) outputVerse(verseId);
						verseId = element['id'];
					}
					break;
				case XMLNodeType.ELE_END:
					elementStack.push(element);
					break;
				case XMLNodeType.ELE_EMPTY:
					// do nothing,
					break;
				case XMLNodeType.WHITESP:
				case XMLNodeType.TEXT:
					var currElement = elementStack[elementStack.length -1];
					if (currElement['class']) {  // && currElement.tagName == 'para') {
						clas = currElement['class'];
					}
					switch(currElement.tagName) {
						case 'section':
							verse.push(tokenValue);
							break;
						case 'p':
							if (!Para.inChapterNotVerse.has(clas)) {
								verse.push(tokenValue);
							}
							break;
						case 'span':
							if (!Para.inChapterNotVerse.has(clas) && !isAncestorFootnote(elementStack) && clas !== 'v-number') {
								verse.push(tokenValue);
							}
							break;
					}
					break;
				case XMLNodeType.ELE_CLOSE:
					element = elementStack.pop();
					break;
				case XMLNodeType.PROG_INST:
					// do nothing
					break;
				case XMLNodeType.END:
					outputVerse(verseId);
					break;
				default:
					throw new Error('The XMLNodeType ' + tokenType + ' is unknown in VersesValidator.');
			}
		}
		outputVerse(reference);
		outputChapter();
	}
	function isAncestorFootnote(stack) {
		for (var i=0; i<stack.length; i++) {
			var clas = stack[i]['class'];
			if (clas === 'topf' || clas === 'topx') {
				return(true);
			}
		}
		return(false);
	}
	function outputVerse(verseId) {
		//console.log('OUTPUT VERSE ***', verse.join(''));
		if (verse.length > 0 && verse.join('').trim().length > 0 && verseId) {
			verseId = verseId.replace(",", "-");
			chapter.push(verseId, '|', verse.join('').trim(), '\n');
		}
		verse = [];
	}
	function outputChapter() {
		//console.log('OUTPUT CHAPTER ****', chapter.join(''));
		if (chapter.length > 0) {
			bible.push(chapter.join(''));
		}
		chapter = [];
	}	
};
VersesValidator.prototype.fatalError = function(err, source) {
	console.log('FATAL ERROR ', err, ' AT ', source);
	process.exit(1);
};
VersesValidator.prototype.completed = function() {
	this.db.close();
};

	
if (process.argv.length < 5) {
	console.log('Usage: ./VersesValidator.sh  dbDir  outputDir  bibleId');
	process.exit(1);
} else {
	const bibleId = process.argv[4];
	console.log(bibleId, "VersesValidator START");
	const dbDir = process.argv[2];
	ValidationAdapter.shared().open(bibleId, dbDir, "VersesValidator");
	var dbFilename = process.argv[2] + "/" + bibleId + ".db";
	var val = new VersesValidator(process.argv[4], dbFilename);
	val.open(function() {
		var outPath = process.argv[3]
		val.generateVersesFile(outPath, function() {
			val.generateChaptersFile(outPath, function() {
				TextFileCompare(outPath + '/verses.txt', outPath + '/chapters.txt', "VERSE");			
				ValidationAdapter.shared().close();
				val.completed();
				console.log(bibleId, "VersesValidator DONE");
			});
		});
	});
}

