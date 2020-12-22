"use strict";

var fs = require('fs');
var ensureDirectory = function(fullpath, callback) {
	var path = fullpath.split('/');
	var dir = path.shift();
	ensureDirPart(dir, path);
	
	function ensureDirPart(dir, path) {
		fs.lstat(dir, function(err, stat) {
			if (err) {
				console.log('mkdir', dir);
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
};/**
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
	close() {
		var that = this;
		const sql = "insert into validation(program, datetime, book, errors) values (?,?,'','DONE')";
		const values = [this.program, this.datetime];
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
				//original = original.replace(/optbreak\/>/g, 'optbreak />'); // Hack to fix no space in optbreak element.
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
* This file is the unit test of XMLTokenizer
*/
var fs = require("fs");

function XMLSerializer(spaceOption) {
	this.result = [];
	this.emptyElementSpace = (spaceOption !== 'nospace');
	Object.seal(this);
}
XMLSerializer.prototype.write = function(nodeType, nodeValue) {
	switch(nodeType) {
		case XMLNodeType.ELE:
			this.result.push('<', nodeValue, '>');
			break;
		case XMLNodeType.ELE_OPEN:
			this.result.push('<', nodeValue);
			break;
		case XMLNodeType.ATTR_NAME:
			this.result.push(' ', nodeValue, '=');
			break;
		case XMLNodeType.ATTR_VALUE:
			this.result.push('"', nodeValue, '"');
			break;
		case XMLNodeType.ELE_END:
			this.result.push('>');
			break;
		case XMLNodeType.WHITESP:
			this.result.push(nodeValue);
			break;
		case XMLNodeType.TEXT:
			this.result.push(nodeValue);
			break;
		case XMLNodeType.ELE_EMPTY:
			if (this.emptyElementSpace) this.result.push(' />');
			else this.result.push('/>');
			break;
		case XMLNodeType.ELE_CLOSE:
			this.result.push('</', nodeValue, '>');
			break;
		case XMLNodeType.PROG_INST:
			if (! this.emptyElementSpace) this.result.push(nodeValue);
			else this.result.push('\uFEFF', nodeValue);
			break;
		case XMLNodeType.END:
			break;
		default:
			throw new Error('The XMLNodeType ' + nodeType + ' is unknown in XMLWriter');
	}
};
XMLSerializer.prototype.close = function() {
	return(this.result.join(''));
};

function testOne(fullPath, outPath, files, index, spaceOption, callback) {
	if (index >= files.length) {
		callback();
	} else {
		var file = files[index];
		symmetricTest(fullPath, outPath, file, spaceOption, function() {
			testOne(fullPath, outPath, files, index + 1, spaceOption, callback);			
		});
	}
}
function symmetricTest(fullPath, outPath, filename, spaceOption, callback) {
	if (filename.substr(0, 1) === '.' || !filename.toLowerCase().endsWith(".usx")) {
		callback();
	} else {
		var inFile = fullPath + filename;
		fs.readFile(inFile, { encoding: 'utf8'}, function(err, data) {
			if (err) {
				console.log('READ ERROR', JSON.stringify(err));
				process.exit(1);
			}
			var reader = new XMLTokenizer(data);
			var writer = new XMLSerializer(spaceOption);
			var count = 0;
			var type;
			while (type !== XMLNodeType.END && count < 770000) {
				type = reader.nextToken();
				var value = reader.tokenValue();
				writer.write(type, value);
				//count++;
			};
			var result = writer.close();
			if (spaceOption == "nospace") {
				result += "\n";
			}
			var outFile = outPath + '/' + filename;
			fs.writeFile(outFile, result, { encoding: 'utf8'}, function(err) {
				if (err) {
					console.log('WRITE ERROR', JSON.stringify(err));
					process.exit(1);
				}
				const errorCount = USXFileCompare(fullPath, outPath, filename, "USX");
				callback(errorCount);
			});
		});
	}
}
if (process.argv.length < 6) {
	// when optional parameter nospace is used empty elements have no space.
	console.log('Usage: XMLTokenizerTest.sh  inputDir  dbDir  outputDir  bibleId  [nospace]');
	process.exit(1);
}
var spaceOption = null;
if (process.argv.length > 6) {
	if (process.argv[6] === 'nospace') {
		spaceOption = process.argv[5];
	} else {
		console.log('Usage: XMLTokenizerTest.sh  inputDir  dbDir  outputDir  bibleId  [nospace]');
		process.exit(1);
	}
}

const bibleId = process.argv[5];
console.log(bibleId, 'XMLTokenizerTest START');
const dbDir = process.argv[3];
ValidationAdapter.shared().open(bibleId, dbDir, "XMLTokenizerTest");
const outPath = process.argv[4] + "/" + bibleId + "/xml";
ensureDirectory(outPath, function() {
	var fullPath = process.argv[2]
	if (!fullPath.endsWith("/")) {
		fullPath += "/";
	}
	var files = fs.readdirSync(fullPath);
	testOne(fullPath, outPath, files, 0, spaceOption, function() {
		ValidationAdapter.shared().close();
		console.log(bibleId, 'XMLTokenizerTest DONE');
	});
});


