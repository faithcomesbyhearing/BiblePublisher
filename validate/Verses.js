"use strict";
/**
* This object contains a paragraph of the Bible text as parsed from a USX version of the Bible.
*/
function Para(node) {
	this.style = node.style;
	if (!Para.isKnownStyle(this.style)) {
		console.log("WARN Unknown Para style '" + this.style + "'");
	}
	this.vid = node.vid;
	this.emptyElement = node.emptyElement;
	this.usxParent = null;
	this.children = []; // contains verse | note | char | text
	Object.seal(this);
}
Para.inChapterInVerse = new Set(['p', // normal paragraph
								'm', // margin paragraph
								'po', // opening of an epistle
								'pr', // right aligned
								'cls', // closure
								'pmo', // embedded text
								'pm', // embedded text paragraph
								'pmc', // embedded text closing
								'pmr', // embedded text refrain
								'pi', 'pi1', 'pi2', 'pi3', // indented paragraph
								'mi', // indented flush left
								'nb', // no break
								'pb', // explicit page break
								'pc', // centered paragrpah
								'ph', 'ph1', 'ph2', 'ph3', // indented wtih hanging indent
								'q', 'q1', 'q2', 'q3', // poetry
								'qr', // right aligned poetry
								'qc', // centered poetry
								'qm', 'qm1', 'qm2', 'qm3', // embedded text poetic line
								'b', // blank line
								'lh', // list header
								'li', 'li1', 'li2', 'li3', // list entry
								'lf', // list footer
								'lim', 'lim1', 'lim2', 'lim3' // embedded list entry
								]);
Para.inChapterNotVerse = new Set(['iex', // introduction or bridge text
								'ms', 'ms1', 'ms2', 'ms3', // section heading
								'mr', 'mr1', 'mr2', 'mr3', // section reference range
								's', 's1', 's2', 's3', // section heading s, s1, s2, s3
								'sr', // section reference range
								'r', // parallel passage reference
								'd', // descriptive title
								'sp', // speaker identification
								'cl', // chapter label
								'cp', 'cp1', 'cp2', 'cp3', // published chapter character
								'cd', // chapter description
								'sd', 'sd1', 'sd2', 'sd3', // semantic division (can be ignored)
								'qa', // acrostic heading
								'qd', // Hebrew note
								'v', // verse number
								]);
Para.notInChapter = new Set(['ide', // encoding
							'sts', // status
							'rem', // remark of translator
							'h', // running header text
							'toc', 'toc1', // long table of contents text
							'toc2', // short table of contents text
							'toc3', // book abbreviation
							'toca2', // alternative language short table of contents text
							'toca3', // alternative language book abbreviation
							'imt', 'imt1', 'imt2', 'imt3', // introduction major title
							'is', 'is1', 'is2', 'is3', // introduction section heading
							'ip', // introduction paragraph
							'ipi', // indented introduction paragraph
							'im', // introduction flush left margin paragraph
							'imi', // Indented introduction flush left margin paragraph
							'ipq', // introduction quote from scripture text paragraph
							'imq', // introduction flush left margin quote from scripture
							'ipr', // introduction right-aligned paragraph
							'iq', 'iq1', 'iq2', 'iq3', // introduction poetic line
							'ib', // introduction blank line
							'ili', 'ili1', 'ili2', 'ili3', // introduction list item
							'iot', // introduction outline title
							'io', 'io1', 'io2', 'io3', // introduction outline entry
							'imte', // introduction major title ending
							'ie', // introduction end
							'mt', 'mt1', 'mt2', 'mt3', 'mt4', // main title
							'mte', // main title at introduction ending
							'periph', // various peripheral material'
							'restore' // nonstandard translator's notes like rem
							]);
Para.allStyles = null;
Para.isKnownStyle = function(style) {
	if (Para.allStyles === null) {
		Para.allStyles = new Set(Para.inChapterInVerse);
		for (let elem of Para.inChapterNotVerse) {
			Para.allStyles.add(elem);
		}
		for (let elem of Para.notInChapter) {
			Para.allStyles.add(elem);
		}
	}
	return Para.allStyles.has(style);
};
Para.prototype.tagName = 'para';
Para.prototype.addChild = function(node) {
	this.children.push(node);
	node.usxParent = this;
};
Para.prototype.openElement = function() {
	var elementEnd = (this.emptyElement) ? '" />' : '">';
	if (this.vid) {
		return('<para style="' + this.style + '" vid="' + this.vid + elementEnd);
	} else {
		return('<para style="' + this.style + elementEnd);
	}
};
Para.prototype.closeElement = function() {
	return(this.emptyElement ? '' : '</para>');
};
Para.prototype.buildUSX = function(result) {
	result.push(this.openElement());
	for (var i=0; i<this.children.length; i++) {
		this.children[i].buildUSX(result);
	}
	result.push(this.closeElement());
};
Para.prototype.toDOM = function(parentNode) {
	var identStyles = [ 'ide', 'sts', 'rem', 'restore', 'h', 'toc1', 'toc2', 'toc3', 'toca2', 'toca3' ];
	var child = new DOMNode('p');
	child.setAttribute('class', this.style);
	if (identStyles.indexOf(this.style) >= 0) {
		child.setAttribute('hidden', '');	
	}
	child.emptyElement = this.emptyElement;
	parentNode.appendChild(child);
	return(child);
};

/**
* This class does a stream read of an XML string to return XML tokens and their token type.
*/
var XMLNodeType = Object.freeze({ELE:'ele', ELE_OPEN:'ele-open', ATTR_NAME:'attr-name', ATTR_VALUE:'attr-value', ELE_END:'ele-end', 
			WHITESP:'whitesp', TEXT:'text', ELE_EMPTY:'ele-empty', ELE_CLOSE:'ele-close', PROG_INST:'prog-inst', END:'end'});

function XMLTokenizer(data) {
	this.data = data;
	this.position = 0;

	this.tokenStart = 0;
	this.tokenEnd = 0;

	this.state = Object.freeze({ BEGIN:'begin', START:'start', WHITESP:'whitesp', TEXT:'text', ELE_START:'ele-start', ELE_OPEN:'ele-open', 
		EXPECT_EMPTY_ELE:'expect-empty-ele', ELE_CLOSE:'ele-close', 
		EXPECT_ATTR_NAME:'expect-attr-name', ATTR_NAME:'attr-name', EXPECT_ATTR_VALUE:'expect-attr-value1', ATTR_VALUE:'attr-value', 
		PROG_INST:'prog-inst', END:'end' });
	this.current = this.state.BEGIN;

	Object.seal(this);
}
XMLTokenizer.prototype.tokenValue = function() {
	return(this.data.substring(this.tokenStart, this.tokenEnd));
};
XMLTokenizer.prototype.nextToken = function() {
	this.tokenStart = this.position;
	while(this.position < this.data.length) {
		var chr = this.data[this.position++];
		//console.log(this.current, chr, chr.charCodeAt(0));
		switch(this.current) {
			case this.state.BEGIN:
				if (chr === '<') {
					this.current = this.state.ELE_START;
					this.tokenStart = this.position;
				}
				else if (chr === ' ' || chr === '\t' || chr === '\n' || chr === '\r') {
					this.current = this.state.WHITESP;
					this.tokenStart = this.position -1;
				}
				break;
			case this.state.START:
				if (chr === '<') {
					this.current = this.state.ELE_START;
					this.tokenStart = this.position;
				}
				else if (chr === ' ' || chr === '\t' || chr === '\n' || chr === '\r') {
					this.current = this.state.WHITESP;
					this.tokenStart = this.position -1;
				}
				else {
					this.current = this.state.TEXT;
					this.tokenStart = this.position -1;
				}
				break;
			case this.state.WHITESP:
				if (chr === '<') {
					this.current = this.state.START;
					this.position--;
					this.tokenEnd = this.position;
					return(XMLNodeType.WHITESP);
				}
				else if (chr !== ' ' && chr !== '\t' && chr !== '\n' && chr !== '\r') {
					this.current = this.state.TEXT;
				}
				break;
			case this.state.TEXT:
				if (chr === '<') {
					this.current = this.state.START;
					this.position--;
					this.tokenEnd = this.position;
					return(XMLNodeType.TEXT);
				}
				break;
			case this.state.ELE_START:
				if (chr === '/') {
					this.current = this.state.ELE_CLOSE;
					this.tokenStart = this.position;
				} 
				else if (chr === '?') {
					this.current = this.state.PROG_INST;
					this.tokenStart = this.position;
				} 
				else {
					this.current = this.state.ELE_OPEN;
				}
				break;
			case this.state.ELE_OPEN:
				if (chr === ' ') {
					this.current = this.state.EXPECT_ATTR_NAME;
					this.tokenEnd = this.position -1;
					return(XMLNodeType.ELE_OPEN);
				} 
				else if (chr === '>') {
					this.current = this.state.START;
					this.tokenEnd = this.position -1;
					return(XMLNodeType.ELE);
				}
				else if (chr === '/') {
					this.current = this.state.EXPECT_EMPTY_ELE;
					this.tokenEnd = this.position -1;
					return(XMLNodeType.ELE_OPEN);
				}
				break;
			case this.state.ELE_CLOSE:
				if (chr === '>') {
					this.current = this.state.START;
					this.tokenEnd = this.position -1;
					return(XMLNodeType.ELE_CLOSE);
				}
				break;
			case this.state.EXPECT_ATTR_NAME:
				if (chr === '>') {
					this.current = this.state.START;
					this.tokenEnd = this.tokenStart;
					return(XMLNodeType.ELE_END);
				}
				else if (chr === '/') {
					this.current = this.state.EXPECT_EMPTY_ELE;
				}
				else if (chr !== ' ') {
					this.current = this.state.ATTR_NAME;
					this.tokenStart = this.position -1;		
				}
				break;
			case this.state.EXPECT_EMPTY_ELE:
				if (chr === '>') {
					this.current = this.state.START;
					this.tokenEnd = this.tokenStart;
					return(XMLNodeType.ELE_EMPTY);
				}
				break;
			case this.state.ATTR_NAME:
				if (chr === '=') {
					this.current = this.state.EXPECT_ATTR_VALUE;
					this.tokenEnd = this.position -1;
					return(XMLNodeType.ATTR_NAME);
				}
				break;
			case this.state.EXPECT_ATTR_VALUE:
				if (chr === '"') {
					this.current = this.state.ATTR_VALUE;
					this.tokenStart = this.position;
				} else if (chr !== ' ') {
					throw new Error();
				}
				break;
			case this.state.ATTR_VALUE:
				if (chr === '"') {
					this.current = this.state.EXPECT_ATTR_NAME;
					this.tokenEnd = this.position -1;
					return(XMLNodeType.ATTR_VALUE);
				}
				break;
			case this.state.PROG_INST:
				if (chr === '>') {
					this.current = this.state.START;
					this.tokenStart -= 2;
					this.tokenEnd = this.position;
					return(XMLNodeType.PROG_INST);
				}
				break;
			default:
				throw new Error('Unknown state ' + this.current);
		}
	}
	return(XMLNodeType.END);
};
/**
* This class is the database adapter for the validation table
*/
class _ValidationAdapter {
	constructor() {
		this.bibleId = null;
		this.dbDir = null;
		this.program = null;
		this.datetime = new Date().toISOString();
		this.database = null;
		this.errorCount = 0;
		Object.seal(this);
	}
	open(bibleId, dbDir, program) {
		this.bibleId = bibleId;
		this.dbDir = dbDir;
		this.program = program;
		const databaseFile = dbDir + '/' + bibleId + '.db';
    	const sqlite3 = require('sqlite3'); //.verbose();
		this.database = new sqlite3.Database(databaseFile);
		const statement = 'create table if not exists validation(' +
		'program text not null, ' +
		'datetime text not null, ' +
		'book text not null, ' +
		'errors text not null);';
		this.database.exec(statement, function(err) {
			if (err) throw new Error(err);
		});
	}
	error(book, message, callback) {
		this.errorCount += 1;
		if (this.errorCount > 100) { // ERROR LIMIT
			callback(0);
		} else {
			var bookCode = book.split('.')[0];
			if (bookCode.length > 3) {
				bookCode = bookCode.substr(-3);
			}
			const sql = "insert into validation(program, datetime, book, errors) values (?,?,?,?)";
			const values = [this.program, this.datetime, book, message];
			this.database.run(sql, values, function(err) {
				if (err) throw new Error(err);
				callback(1);
			});
		}
	}
	close() {
		var that = this;
		const sql = "insert into validation(program, datetime, book, errors) values (?,?,?,'DONE')";
		const values = [this.program, this.datetime, this.errorCount];
		this.database.run(sql, values, function(err) {
			if (err) throw new Error(err);
			that.database.close();
		});
	}
}
class ValidationAdapter {
	constructor() {
		throw new Error('Use ValidationAdapter.shared()');
	}
	static shared() {
		if (!ValidationAdapter.singleton) {
			ValidationAdapter.singleton = new _ValidationAdapter();
		}
		return ValidationAdapter.singleton;
	}
}
// USXFileCompare class compares two USX files, usually one is an original file and the other a test generated one.


function TextFileCompare(originalFilename, generatedFilename, testType) {
	const originalFile = openFile(originalFilename);
	const generatedFile = openFile(generatedFilename);
	compare(originalFile, generatedFile, testType);

	function openFile(filePath) {
		var fs = require("fs");
		const data = fs.readFileSync(filePath, {encoding:'utf8', flag:'r'}); 
		const lines = data.split("\n");
		return lines;
	}
	function compare(orginalList, generatedList, testType) {
		const len = Math.max(orginalList.length, generatedList.length);
		for (var i=0; i<len; i++) {
			var original = "";
			var generated = "";
			if (orginalList.length > i) {
				original = orginalList[i];
			}
			if (generatedList.length > i) {
				generated = generatedList[i];
			}
			if (original != generated) {
				var results = [];
				results.push("Line " + i+3);
				results.push("ACT: " + original);
				results.push("GEN: " + generated);
				for (var j=0; j<results.length; j++) {
					console.log(results[j]);
				}
				ValidationAdapter.shared().error('verse', results.join('\n'), function() {});
			}
		}
	}
}


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
					if (attrName === 'class' && tokenValue === 'v') {
						outputVerse(verseId);
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
							if (!Para.inChapterNotVerse.has(clas) && !isAncestorFootnote(elementStack)) {
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

