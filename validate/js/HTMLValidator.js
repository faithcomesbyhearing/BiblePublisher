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

