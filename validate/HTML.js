"use strict";

var fs = require('fs');
var ensureDirectory = function(fullpath, callback) {
	var path = fullpath.split('/');
	if (path[0] === "") {
		path.shift();
		path[0] = "/" + path[0];
	}
	var dir = path.shift();
	ensureDirPart(dir, path);
	
	function ensureDirPart(dir, path) {
		fs.lstat(dir, function(err, stat) {
			if (err) {
				//console.log('mkdir', dir);
				fs.mkdirSync(dir);
			}
			var next = path.shift();
			if (next) {
				dir = dir + '/' + next;
				ensureDirPart(dir, path);
			} else {
				callback();
			}
		});
	}
};
//ensureDirectory("/Volumes/FCBH/BiblePublisher/ENGWEB/output/xml", function() {
//	ensureDirectory("BobTestDir", function() {
//		console.log("Directory Created.")
//	});
//})
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


function USXFileCompare(originalDir, generatedDir, filename, testType) {
	const originalFile = openFile(originalDir + "/" + filename);
	const generatedFile = openFile(generatedDir + "/" + filename);
	const results = compare(originalFile, generatedFile, testType);
	if (results.length > 0) {
		console.log("COMPARE", filename);
		for (var i=0; i<results.length; i++) {
			console.log(results[i]);
			ValidationAdapter.shared().error(filename, results[i], function() {});
		}
	}
	return results.length / 3;

	function openFile(filePath) {
		var fs = require("fs");
		const data = fs.readFileSync(filePath, {encoding:'utf8', flag:'r'}); 
		const lines = data.split("\n");
		var results = [];
		for (var i=0; i<lines.length; i++) {
			const line = lines[i].trim();
			if (!line.includes("<?xml ") && line.length > 0) {
				results.push(line);
			}
		}
		return results;
	}
	function compare(orginalList, generatedList, testType) {
		var results = [];
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
			if (testType == "USX") {
				original = original.replace(/\"\/\>/g, '" />');  // Hack to fix no space in some empty elements
				original = original.replace(/optbreak\/>/g, 'optbreak />'); // Hack to fix no space in optbreak element.
				generated = generated.replace(/optbreak\/>/g, 'optbreak />'); // Hack to fix no space in optbreak element.
			}
			if (testType == "HTML") {
				original = original.replace(/\"\/\>/g, '" />');  // Hack to fix no space in some empty elements
				original = original.replace(/<verse eid=\"[A-Z0-9 :-]+\" \/>/g, '');
				original = original.replace(/ vid=\"[A-Z0-9 :-]+\"/g, '');
				original = original.replace(/optbreak \/>/g, 'optbreak/>'); // Hack to fix no space in optbreak element.
			}
			if (original != generated) {
				results.push("Line " + i+3);
				results.push("ACT: " + original);
				results.push("GEN: " + generated);
			}
		}
		return results
	}
}

//const originalDirectory = "/Volumes/FCBH/usx/2_5/PESNMV";
//const generatedDirectory = "testOutput/PESNMV/usx";
//var count = USXFileCompare(originalDirectory, generatedDirectory, "JHN.usx", "USX");
//console.log(count);

/**
* This validation program specifically checks that the generated HTML is identical in content
* to the original USX file.  To do this it reads the HTML data from the generated database,
* parses it, and generates USX files
*/
var fs = require("fs");
var EOL = '\r\n';
var END_EMPTY = ' />';

function HTMLValidator(version, versionPath) {
	this.version = version;
	this.versionPath = versionPath;
	this.parser = new HTMLParser();
	this.db = null;
	this.usxVersion = null;
	this.usxVersionNum = 0;
	this.bookId = null;
	this.lastChapter = null;
	Object.seal(this);
}
HTMLValidator.prototype.open = function(callback) {
	var that = this;
	var sqlite3 = require('sqlite3');
	this.db = new sqlite3.Database(this.versionPath, sqlite3.OPEN_READWRITE, function(err) {
		if (err) that.fatalError(err, 'openDatabase ' + this.versionPath);
		//that.db.on('trace', function(sql) { console.log('DO ', sql); });
		//that.db.on('profile', function(sql, ms) { console.log(ms, 'DONE', sql); });
		callback();
	});
};
HTMLValidator.prototype.validateBook = function(inputPath, outPath, index, files, callback) {
	var that = this;
	if (index >= files.length) {
		callback();
	} else {
		var chapters = [];
		var chapterNum = null;
		var file = files[index];
		var book = file.split(".")[0].substr(-3);
		this.db.all("SELECT html FROM chapters WHERE reference LIKE ?", book + '%', function(err, results) {
			if (err) that.fatalError(err, 'select html');
			for (var i=0; i<results.length; i++) {
				var node = that.parser.readBook(results[i].html);
				chapters.push(node);
			}
			if (chapters.length > 0) {
				var usx = convertHTML2USX(book, chapters);
				compareUSXFile(file, inputPath, outPath, usx, function(errorCount) {
					that.validateBook(inputPath, outPath, index + 1, files, callback);
				});
			} else {
				that.validateBook(inputPath, outPath, index + 1, files, callback);				
			}
		});
	}
	
	function convertHTML2USX(book, chapters) {
		var usx = [];
		that.usxVersion = chapters[0].children[0]['data-usx'];
		that.usxVersionNum = parseFloat(that.usxVersion);
		usx.push(String.fromCharCode('0xFEFF'));
		usx.push('<?xml version="1.0" encoding="utf-8"?>', EOL);
		usx.push('<usx version="' + that.usxVersion + '">');
		for (var i=0; i<chapters.length; i++) {
			recurseOverHTML(usx, chapters[i]);
		}
		if (that.usxVersionNum >= 3.0) {
			usx.push('<chapter eid="', book, ' ', that.lastChapter, '" />', EOL);
		}
		usx.push('</usx>');
		return(usx.join(''));
	}
	
	function recurseOverHTML(usx, node) {
		convertOpenElement(usx, node);
		if (node.children) {
			for (var i=0; i<node.children.length; i++) {
				recurseOverHTML(usx, node.children[i]);		
			}
		}
		convertCloseElement(usx, node);
	}
	
	function convertOpenElement(usx, node) {
		//console.log(node.tagName);
		switch(node.tagName) {
			case 'ROOT':
				// do nothing
				break;
			case 'article':
				that.bookId = node.id;
				usx.push('<book code="', that.bookId, '" style="', node['class'], '"');
				if (node.emptyElement) {
					usx.push(END_EMPTY);
				} else {
					usx.push('>');
					if (node.hidden) {
						usx.push(node.hidden);
					}
				}
				break;
			case 'section':
				chapterNum = node.id.split(':')[1];
				that.lastChapter = chapterNum;
				break;
			case 'p':
				if (node['class'] === 'c') {
					if (that.usxVersionNum >= 3.0) {
						if (chapterNum > "1") {
							var priorChapter = parseFloat(chapterNum) - 1;
							usx.push('<chapter eid="', that.bookId + " " + priorChapter, '"', END_EMPTY, EOL);
						}
					}
					usx.push('<chapter number="', chapterNum, '" style="c"');
					if (node['data-altnumber']) usx.push(' altnumber="', node['data-altnumber'], '"');
					if (node['data-pubnumber']) usx.push(' pubnumber="', node['data-pubnumber'], '"');
					if (that.usxVersionNum >= 3.0) usx.push(' sid="', that.bookId, ' ', chapterNum, '"');
					usx.push(END_EMPTY);
					node.children = [];
				} else if (node.emptyElement) {
					usx.push('<para style="', node['class'], '"', END_EMPTY);
				} else {
					usx.push('<para style="', node['class'], '">');
				}
				if (node.hidden) {
					usx.push(node.hidden);
				}
				break;
			case 'span':
				if (node['class'] === 'v') {
					var parts = node.id.split(':');
					usx.push('<verse number="', parts[2], '" style="', node['class'], '"');
					if (node['data-altnumber']) usx.push(' altnumber="', node['data-altnumber'], '"');
					if (node['data-pubnumber']) usx.push(' pubnumber="', node['data-pubnumber'], '"');
					if (that.usxVersionNum >= 3.0) usx.push( ' sid="', that.bookId, ' ', chapterNum, ':', parts[2], '"');
					usx.push(END_EMPTY);
					node.children = [];
				} else if (node['class'] === 'topf') {
					usx.push('<note caller="', node.caller, '" style="f">');
					clearTextChildren(node); // clear note button
				} else if (node['class'] === 'topx') {
					usx.push('<note caller="', node.caller, '" style="x">');
					clearTextChildren(node); // clear note button
				} else if (node.hidden) {
					if (node.closed) {
						usx.push('<char style="', node['class'], '" closed="', node.closed, '">');
					} else {
						usx.push('<char style="', node['class'], '">');
					}
					usx.push(node.hidden);
				} else if (node.loc) {
					usx.push('<ref loc="', node.loc, '">');
				} else if (node['class'] !== 'f' && node['class'] !== 'x') {
					if (node.closed) {
						usx.push('<char style="', node['class'], '" closed="', node.closed, '"');
					} else {
						usx.push('<char style="', node['class'], '"');
					}
					if (node.emptyElement) {
						usx.push(END_EMPTY)
					} else {
						usx.push('>');
					}
				}
				break;
			case 'table':
				usx.push('<table>');
				break;
			case 'tr':
				usx.push('<row style="tr">');
				break;
			case 'td':
				var nodeClass = node['class'];
				if (nodeClass.length === 3) {
					usx.push('<cell style="', node['class'], '" align="start">');
				} else {
					usx.push('<cell style="', node['class'], '" align="end">');
				}
				break;
			case 'wbr':
				usx.push('<optbreak/>');
				break;
			case 'TEXT':
				usx.push(node.text);
				break;
			default:
				throw new Error('unexpected HTML element ' + node.tagName + '.');		
		}
	}
	
	function clearTextChildren(node) {
		for (var i=0; i<node.children.length; i++) {
			var child = node.children[i];
			if (child.tagName === 'TEXT') {
				child.text = '';
			}
		}
	}
	
	function convertCloseElement(usx, node) {
		if (! node.emptyElement) {
			switch(node.tagName) {
				case 'ROOT':
				case 'section':
					break;
				case 'article':
					usx.push('</book>');
					break;
				case 'TEXT':
					// do nothing
					break;
				case 'p':
					if (node['class'] !== 'c' && ! node.emptyElement) {
						usx.push('</para>');
					}
					break;
				case 'span':
					if (node['class'] === 'v') {
						// do nothing
					} else if (node['class'] === 'topf' || node['class'] === 'topx') {
						usx.push('</note>');
					} else if (node.hidden) {
						usx.push('</char>');
					} else if (node.loc) {
						usx.push('</ref>');
					} else if (node['class'] !== 'f' && node['class'] !== 'x') {
						usx.push('</char>');
					}
					break;
				case 'table':
					usx.push('</table>');
					break;
				case 'tr':
					usx.push('</row>');
					break;
				case 'td':
					usx.push('</cell>');
					break;
				case 'wbr':
					break;
				default:
					throw new Error('unexpected HTML element ' + node.tagName + '.');
					
			}
		}
	}
	
	
	function compareUSXFile(filename, inputPath, outPath, data, callback) {
		var outFile = outPath + '/' + filename;
		fs.writeFile(outFile, data, { encoding: 'utf8'}, function(err) {
			if (err) {
				that.fatalError(err, 'Write USX File');
			}
			const errorCount = USXFileCompare(inputPath, outPath, filename, "HTML");
			callback(errorCount);
		});
	}
};
HTMLValidator.prototype.fatalError = function(err, source) {
	console.log('FATAL ERROR ', err, ' AT ', source);
	process.exit(1);
};
HTMLValidator.prototype.completed = function() {
	this.db.close();
};

function HTMLParser() {
}
HTMLParser.prototype.readBook = function(data) {
	var reader = new XMLTokenizer(data);
	var rootNode = new HTMLRoot();
	var nodeStack = [rootNode];
	var node = null;
	var count = 0;
	while (tokenType !== XMLNodeType.END && count < 300000) {

		var tokenType = reader.nextToken();

		var tokenValue = reader.tokenValue();
		//console.log('type=|' + tokenType + '|  value=|' + tokenValue + '|');
		count++;

		switch(tokenType) {
			case XMLNodeType.ELE:
				node = new HTMLElement(tokenValue);
				//node.emptyNode = false;
				nodeStack[nodeStack.length -1].addChild(node);
				nodeStack.push(node);
				break;
			case XMLNodeType.ELE_OPEN:
				node = new HTMLElement(tokenValue);
				break;
			case XMLNodeType.ATTR_NAME:
				// do nothing
				break;
			case XMLNodeType.ATTR_VALUE:
				if (priorValue !== 'onclick' && priorValue !== 'style') {
					node[priorValue] = tokenValue;
				}
				break;
			case XMLNodeType.ELE_END:
				node.emptyElement = false;
				nodeStack[nodeStack.length -1].addChild(node);
				nodeStack.push(node);
				break;
			case XMLNodeType.WHITESP:
			case XMLNodeType.TEXT:
				node = new HTMLTextNode(tokenValue);
				nodeStack[nodeStack.length -1].addChild(node);
				break;
			case XMLNodeType.ELE_EMPTY:
				node.emptyElement = true;
				nodeStack[nodeStack.length -1].addChild(node);
				break;
			case XMLNodeType.ELE_CLOSE:
				node = nodeStack.pop();
				if (node.tagName !== tokenValue) {
					throw new Error('closing element mismatch ' + node.openElement() + ' and ' + tokenValue);
				}
				break;
			case XMLNodeType.PROG_INST:
				// do nothing
				break;
			case XMLNodeType.END:
				// do nothing
				break;
			default:
				throw new Error('The XMLNodeType ' + tokenType + ' is unknown in HTMLParser.');
		}
		var priorValue = tokenValue;
	}
	return(rootNode);
};

function HTMLElement(tagName) {
	this.tagName = tagName;
	this['data-usx'] = null;
	this.id = null;
	this['class'] = null;
	this['data-number'] = null;
	this['data-altnumber'] = null;
	this['data-pubnumber'] = null;
	this.caller = null;
	this.loc = null;
	this.note = null;
	this.hidden = null;
	this.closed = null;
	this.emptyElement = false;
	this.children = [];
	Object.seal(this);
}
HTMLElement.prototype.addChild = function(node) {
	this.children.push(node);
};
HTMLElement.prototype.toString = function() {
	var array = [];
	this.buildHTML(array, false);
	return(array.join(''));	
};
HTMLElement.prototype.toHTML = function() {
	var array = [];
	this.buildHTML(array, true);
	return(array.join(''));	
};
HTMLElement.prototype.buildHTML = function(array, includeChildren) {
	array.push(EOL, '<', this.tagName);
	if (this['data-usx']) array.push(' data-usx="', this['data-usx'], '"');
	if (this.id) array.push(' id="', this.id, '"');
	if (this['class']) array.push(' class="', this['class'], '"');
	if (this['data-altnumber']) array.push(' altnumber"', this['data-altnumber'], '"');
	if (this['data-pubnumber']) array.push(' pubnumber"', this['data-pubnumber'], '"');
	if (this.caller) array.push(' caller="', this.caller, '"');
	if (this.loc) array.push(' loc="', this.loc, '"');
	if (this.note) array.push(' note="', this.note, '"');
	if (this.hidden) array.push(' hidden="', this.hidden, '"');
	if (this.closed) array.push(' closed"', this.closed, '"');
	if (this.emptyElement) {
		array.push(' />');
	} else {
		array.push('>');
		if (includeChildren) {
			for (var i=0; i<this.children.length; i++) {
				this.children[i].buildHTML(array, includeChildren);
			}
		}
		array.push('</', this.tagName, '>');
	}
};

function HTMLTextNode(text) {
	this.tagName = 'TEXT';
	this.text = text;
	Object.seal(this);
}
HTMLTextNode.prototype.toString = function() {
	return(this.text);
};
HTMLTextNode.prototype.buildHTML = function(array) {
	array.push(this.text);
};

function HTMLRoot() {
	this.tagName = 'ROOT';
	this.children = [];
	Object.seal(this);
}
HTMLRoot.prototype.addChild = function(node) {
	this.children.push(node);
};
HTMLRoot.prototype.toHTML = function() {
	var array = [];
	for (var i=0; i<this.children.length; i++) {
		this.children[i].buildHTML(array, true);
	}
	return(array.join(''));	
};


if (process.argv.length < 6) {
	console.log('Usage: HTMLValidator.sh  inputDir  dbDir outputDir  bibleId');
	process.exit(1);
}

const bibleId = process.argv[5];
console.log(bibleId, "HTMLValidator START");
const dbDir = process.argv[3];
ValidationAdapter.shared().open(bibleId, dbDir, "HTMLValidator");
const outPath = process.argv[4] + '/html';
ensureDirectory(outPath, function() {
	var versionPath = process.argv[3] + "/" + bibleId + '.db';
	console.log("BibleDB", versionPath);
	//console.log(bibleId, versionPath);
	var htmlValidator = new HTMLValidator(bibleId, versionPath);
	htmlValidator.open(function() {
		var inputPath = process.argv[2]
		if (!inputPath.endsWith("/")) {
			inputPath += "/";
		}
		var fs = require('fs');
		const files = fs.readdirSync(inputPath);
		var goodFiles = [];
		for (var i=0; i<files.length; i++) {
			if (! files[i].startsWith(".") && files[i].toLowerCase().endsWith(".usx")) {
				goodFiles.push(files[i]);
			}
		}
		htmlValidator.validateBook(inputPath, outPath, 0, goodFiles, function() {
			htmlValidator.completed();
			ValidationAdapter.shared().close();
			console.log(bibleId, 'HTMLValidator DONE');
		});
	});
});

