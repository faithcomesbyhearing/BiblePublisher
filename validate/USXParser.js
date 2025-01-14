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
* This class is the root object of a parsed USX document
*/
function USX(node) {
	this.version = node.version;
	this.emptyElement = node.emptyElement;
	this.usxParent = null;
	this.children = []; // includes books, chapters, and paragraphs
	Object.seal(this);
}
USX.prototype.tagName = 'usx';
USX.prototype.addChild = function(node) {
	this.children.push(node);
	node.usxParent = this;
};
USX.prototype.openElement = function() {
	var elementEnd = (this.emptyElement) ? '" />' : '">';
	return('\r\n<usx version="' + this.version + elementEnd);
};
USX.prototype.closeElement = function() {
	return(this.emptyElement ? '' : '</usx>');
};
USX.prototype.toUSX = function() {
	var result = [];
	this.buildUSX(result);
	return(result.join(''));
};
USX.prototype.toDOM = function(parentNode) {
	var child = new DOMNode('section');
	child.setAttribute("data-usx", this.version);
	child.emptyElement = this.emptyElement;
	parentNode.appendChild(child);
	return(child);
};
USX.prototype.buildUSX = function(result) {
	result.push(String.fromCharCode('0xFEFF'), '<?xml version="1.0" encoding="utf-8"?>');
	result.push(this.openElement());
	for (var i=0; i<this.children.length; i++) {
		this.children[i].buildUSX(result);
	}
	result.push(this.closeElement());
};

/**
* This class contains a book of the Bible
*/
function Book(node) {
	this.code = node.code;
	this.style = node.style;
	this.emptyElement = node.emptyElement;
	this.usxParent = null;
	this.children = []; // contains text
	Object.seal(this);
}
Book.prototype.tagName = 'book';
Book.prototype.addChild = function(node) {
	this.children.push(node);
	node.usxParent = this;
};
Book.prototype.openElement = function() {
	var elementEnd = (this.emptyElement) ? '" />' : '">';
	return('<book code="' + this.code + '" style="' + this.style + elementEnd);
};
Book.prototype.closeElement = function() {
	return(this.emptyElement ? '' : '</book>');
};
Book.prototype.buildUSX = function(result) {
	result.push(this.openElement());
	for (var i=0; i<this.children.length; i++) {
		this.children[i].buildUSX(result);
	}
	result.push(this.closeElement());
};
Book.prototype.toDOM = function(parentNode) {
	var article = new DOMNode('article');
	article.setAttribute('id', this.code);
	article.setAttribute('class', this.style);
	article.emptyElement = this.emptyElement;
	parentNode.appendChild(article);
	return(article);
};
/**
* This object contains information about a chapter of the Bible from a parsed USX Bible document.
*/
function Chapter(node) {
	this.number = node.number;
	this.style = node.style;
	this.altnumber = node.altnumber;
	this.pubnumber = node.pubnumber;
	this.sid = node.sid;
	this.eid = node.eid;
	this.emptyElement = node.emptyElement;
	this.usxParent = null;
	Object.seal(this);
}
Chapter.prototype.tagName = 'chapter';
Chapter.prototype.openElement = function() {
	var element = ['<chapter'];
	if (!this.eid) element.push(' number="', this.number, '"');
	if (this.style) element.push(' style="', this.style, '"');
	if (this.altnumber) element.push(' altnumber="', this.altnumber, '"');
	if (this.pubnumber) element.push(' pubnumber="', this.pubnumber, '"');
	if (this.sid) element.push(' sid="', this.sid, '"');
	if (this.eid) element.push(' eid="', this.eid, '"');
	if (this.emptyElement) element.push(' />');
	else element.push('>');
	return element.join('');
};
Chapter.prototype.closeElement = function() {
	return(this.emptyElement ? '' : '</chapter>');
};
Chapter.prototype.buildUSX = function(result) {
	result.push(this.openElement());
	result.push(this.closeElement());
};
Chapter.prototype.toDOM = function(parentNode, bookCode, localizeNumber) {
	var child = new DOMNode('p');
	child.setAttribute('class', this.style);
	if (this.number) child.setAttribute('data-number', this.number);
	if (this.altnumber) child.setAttribute('data-altnumber', this.altnumber);
	if (this.pubnumber) child.setAttribute('data-pubnumber', this.pubnumber);
	child.emptyElement = false;
	child.appendText(localizeNumber.toLocal(this.number));
	parentNode.appendChild(child);
	return(child);
};
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
//	var child = this.style === 'p' ? new DOMNode('span') : new DOMNode('p');
	var child = new DOMNode('span');
	child.setAttribute('class', this.style);
	if (identStyles.indexOf(this.style) >= 0) {
		child.setAttribute('hidden', '');	
	}
	child.emptyElement = this.emptyElement;
	if (this.style === "p" && parentNode.childNodes.length > 0) {
		parentNode.appendBreakLine();
	}
	parentNode.appendBreakLine();
	parentNode.appendChild(child);
	return(child);
};

/**
* This chapter contains the verse of a Bible text as parsed from a USX Bible file.
*/
function Verse(node) {
	this.number = node.number;
	this.style = node.style;
	this.altnumber = node.altnumber;
	this.pubnumber = node.pubnumber;
	this.sid = node.sid;
	this.eid = node.eid;
	this.emptyElement = node.emptyElement;
	this.usxParent = null;
	Object.seal(this);
}
Verse.prototype.tagName = 'verse';
Verse.prototype.openElement = function() {
	var element = ['<verse'];
	if (!this.eid) element.push(' number="', this.number, '"');
	if (this.style) element.push(' style="', this.style, '"');
	if (this.altnumber) element.push(' altnumber="', this.altnumber, '"');
	if (this.pubnumber) element.push(' pubnumber="', this.pubnumber, '"');
	if (this.sid) element.push(' sid="', this.sid, '"');
	if (this.eid) element.push(' eid="', this.eid, '"');
	if (this.emptyElement) element.push(' />');
	else element.push('>');
	return element.join('');
};
Verse.prototype.closeElement = function() {
	return(this.emptyElement ? '' : '</verse>');
};
Verse.prototype.buildUSX = function(result) {
	result.push(this.openElement());
	result.push(this.closeElement());
};
Verse.prototype.toDOM = function(parentNode, bookCode, chapterNum, localizeNumber, printVerse = true) {
	var reference = bookCode + ':' + chapterNum + ':' + this.number;
	var container = new DOMNode('span');
	container.setAttribute('class', 'v-container');
	if (this.number) container.setAttribute('data-number', this.number);
	if (this.altnumber) container.setAttribute('data-altnumber', this.altnumber);
	if (this.pubnumber) container.setAttribute('data-pubnumber', this.pubnumber);
	container.emptyElement = false;
	var child = new DOMNode('span');
	child.setAttribute('id', reference);
	child.setAttribute('class', "v-number");
	if (this.number) child.setAttribute('data-number', this.number);
	if (this.altnumber) child.setAttribute('data-altnumber', this.altnumber);
	if (this.pubnumber) child.setAttribute('data-pubnumber', this.pubnumber);
	child.emptyElement = false;
	if (printVerse) child.appendText(localizeNumber.toLocal(this.number) + '&nbsp;');

	container.appendChild(child);
	parentNode.appendChild(container);
	return(container);
};
Verse.prototype.getVerseTextDOM = function(verseContainer) {

	var text = new DOMNode('span');
	text.setAttribute('class', 'v-text');
	if (this.number) text.setAttribute('data-number', this.number);
	if (this.altnumber) text.setAttribute('data-altnumber', this.altnumber);
	if (this.pubnumber) text.setAttribute('data-pubnumber', this.pubnumber);
	text.emptyElement = false;

	verseContainer.appendChild(text);
	return(text);
};
/**
* This class contains a Note from a USX parsed Bible
*/
function Note(node) {
	this.caller = node.caller;
	// Discarded 2/29/2021
	//if (this.caller.length != 1) {
	//	console.log(JSON.stringify(node));
	//	throw new Error('Note caller is not single char');
	//}
	this.style = node.style;
	this.emptyElement = node.emptyElement;
	this.usxParent = null;
	this.children = [];
	Object.seal(this);
}
Note.prototype.tagName = 'note';
Note.prototype.addChild = function(node) {
	this.children.push(node);
	node.usxParent = this;
};
Note.prototype.openElement = function() {
	var elementEnd = (this.emptyElement) ? '" />' : '">';
	return('<note caller="' + this.caller + '" style="' + this.style + elementEnd);
};
Note.prototype.closeElement = function() {
	return(this.emptyElement ? '' : '</note>');
};
Note.prototype.buildUSX = function(result) {
	result.push(this.openElement());
	for (var i=0; i<this.children.length; i++) {
		this.children[i].buildUSX(result);
	}
	result.push(this.closeElement());
};
Note.prototype.toDOM = function(parentNode, bookCode, chapterNum, noteNum, direction) {
	var nodeId = bookCode + chapterNum + '-' + noteNum;
	var refChild = new DOMNode('span');
	refChild.setAttribute('id', nodeId);
	refChild.setAttribute('class', 'top' + this.style);
	refChild.setAttribute('caller', this.caller);
	refChild.setAttribute('onclick', "bibleShowNoteClick('" + nodeId + "');");
	switch(this.style) {
		case 'f':
			refChild.appendText((direction === 'rtl') ? ' \u261C ' : ' \u261E '); //261C points left, 261E points right
			break;
		case 'x':
			refChild.appendText((direction === 'rtl') ? ' \u261A ' : ' \u261B '); //261A points left, 261B points right
			break;
		default:
			refChild.appendText('* ');
	}
	refChild.emptyElement = false;
	parentNode.appendChild(refChild);
	return(refChild);
};
/**
* This class contains a character style as parsed from a USX Bible file.
*/
function Char(node) {
	this.style = node.style;
	if (!Char.isKnownStyle(this.style)) {
		console.log("WARN Unknown Char style '" + this.style + "'");
	}
	this.closed = node.closed;
	this.emptyElement = node.emptyElement;
	this.usxParent = null;
	this.children = [];
	Object.seal(this);
}
Char.inChapterInVerse = new Set(['bk', // quoted book title
								'k', // keyword
								'litl', // list entry total
								'nd', // name of God
								'ord', // ordinal number
								'pn', // proper name
								'png', // geographic proper name
								'qac', // acrostic within a poetic line
								'qs', // selah
								'qt', // quoted text
								'sig', // signature
								'sls', // passage based on second language
								'tl', // transliterated word
								'wj', // words of Jesus
								'em', // emphasize
								'bd', // bold
								'bdit', // bold + iltalic
								'it', // italic
								'no', // normal
								'sc', // small cap text
								'sup', // super script
								'rb', // ruby characters
								'va', // alternate verse number
								'vp' // published verse character
								]);
Char.inChapterNotVerse = new Set(['add', // translator addition
								'dc', // deuterocanonical/LXX additions
								'rq', // inline quote reference
								'ca' // chapter alternate
								]);
Char.notInChapter = new Set(['ior', // introduction outline reference range
							'iqt', // introduction quoted text
							'ndx', // subject index entry
							'pro', // pronunciation
							'w', // wordlist glossary entry
							'wg', // Greek wordlist entry
							'wh' // Hebrew wordlist entry
							]);
Char.inFootnote = new Set(['f', //  footnote
							'fe', // endnote
							'fr', // footnote origin reference
							'fk', // footnote keyword
							'fq', // footnote translation quotation
							'fqa', // footnote alternate translation
							'fl', // footnote label
							'fp', // footnote additional paragraph
							'fv', // footnote verse number
							'ft', // footnote text 
							'fdc', // Deuterocanonical footnote text
							'fm', // footnote reference mark
							'x', // cross reference
							'xo', // cross reference origin reference
							'xk', // cross reference keyword
							'xq', // cross reference quotation
							'xt', // cross reference target
							'xot', // cross reference other text
							'xnt', // cross reference other text references
							'xdc' // Deuterocanonical cross reference text
							]);
Char.allStyles = null;
Char.isKnownStyle = function(style) {
	if (Char.allStyles == null) {
		Char.allStyles = new Set(Char.inChapterInVerse);
		for (let elem of Char.inChapterNotVerse) {
			Char.allStyles.add(elem);
		}
		for (let elem of Char.notInChapter) {
			Char.allStyles.add(elem);
		}
		for (let elem of Char.inFootnote) {
			Char.allStyles.add(elem);
		}
	}
	return Char.allStyles.has(style);
};
Char.prototype.tagName = 'char';
Char.prototype.addChild = function(node) {
	this.children.push(node);
	node.usxParent = this;
};
Char.prototype.openElement = function() {
	var elementEnd = (this.emptyElement) ? '" />' : '">';
	if (this.closed) {
		return('<char style="' + this.style + '" closed="' + this.closed + elementEnd);
	} else {
		return('<char style="' + this.style + elementEnd);
	}
};
Char.prototype.closeElement = function() {
	return(this.emptyElement ? '' : '</char>');
};
Char.prototype.buildUSX = function(result) {
	result.push(this.openElement());
	for (var i=0; i<this.children.length; i++) {
		this.children[i].buildUSX(result);
	}
	result.push(this.closeElement());
};
Char.prototype.toDOM = function(parentNode) {
	var child = new DOMNode('span');
	child.setAttribute('class', this.style);
	if (this.closed) child.setAttribute('closed', this.closed);
	child.emptyElement = this.emptyElement;
	parentNode.appendChild(child);
	return(child);
};
/**
* This class contains a text string as parsed from a USX Bible file.
*/
function Text(text) {
	this.text = text;
	this.usxParent = null;
	Object.seal(this);
}
Text.prototype.tagName = 'text';
Text.prototype.buildUSX = function(result) {
	result.push(this.text);
};
Text.prototype.toDOM = function(parentNode, bookCode, chapterNum) {
	var that = this;
	if (parentNode.nodeName === 'article') {
		parentNode.setAttribute('hidden', this.text);
	} else if (parentNode.nodeName === 'section') {
		parentNode.appendText(this.text);
	} else if (parentNode.hasAttribute('hidden')) {
		parentNode.setAttribute('hidden', this.text);
	} else {
		var parentClass = parentNode.getAttribute('class');
		if (parentClass === 'fr' || parentClass === 'xo') {
			parentNode.setAttribute('hidden', this.text); // permanently hide note.
		} else {
			var count = isInsideNote(this);
			var parents = ancestors(this);
			//console.log(count, parents.join(', '));
			if (count === 0) {
				parentNode.appendText(this.text);
			} else if (count === 1) {
				var textNode = new DOMNode('span');
				textNode.setAttribute('class', parentClass.substr(3));
				textNode.appendText(this.text);
				textNode.setAttribute('style', 'display:none');
				parentNode.appendChild(textNode);
			} else if (count === 2) {
				parentNode.setAttribute('style', 'display:none');
				parentNode.appendText(this.text);
			} else {
				parentNode.appendText(this.text);
			}
		}
	}

	function isInsideNote(curr) {
		var count = 0;
		while (curr) {
			if (curr.tagName === 'note') {
				return(count);
			} else {
				count++;
				curr = curr.usxParent;
			}
		}
		return(0);
	}
	
	function ancestors(curr) {
		var parents = [curr.tagName];
		while (curr && curr.usxParent) {
			parents.push(curr.usxParent.tagName);
			curr = curr.usxParent;
		}
		return(parents);
	}
	
};


/**
* This class contains a ref element as parsed from a USX Bible file.
* This contains one attribute loc, which contain a bible reference
* And a text node, which contains the Bible reference in text form.
*/
function Ref(node) {
	this.loc = node.loc;
	this.emptyElement = node.emptyElement;
	this.usxParent = null;
	this.children = [];
	Object.seal(this);
}
Ref.prototype.tagName = 'ref';
Ref.prototype.addChild = function(node) {
	this.children.push(node);
	node.usxParent = this;
};
Ref.prototype.openElement = function() {
	var elementEnd = (this.emptyElement) ? '" />' : '">';
	return('<ref loc="' + this.loc + elementEnd);
};
Ref.prototype.closeElement = function() {
	return(this.emptyElement ? '' : '</ref>');
};
Ref.prototype.buildUSX = function(result) {
	result.push(this.openElement());
	for (var i=0; i<this.children.length; i++) {
		this.children[i].buildUSX(result);
	}
	result.push(this.closeElement());
};
Ref.prototype.toDOM = function(parentNode) {
	var child = new DOMNode('span');
	child.setAttribute('loc', this.loc);
	child.emptyElement = this.emptyElement;
	parentNode.appendChild(child);
	return(child);
};
/**
* This class contains a optbreak element as parsed from a USX Bible file.
* This is an empty element, which defines an optional location for a line
* break
*/
function OptBreak(node) {
	this.emptyElement = node.emptyElement;
	this.usxParent = null;
	Object.seal(this);
}
OptBreak.prototype.tagName = 'optbreak';
OptBreak.prototype.openElement = function() {
	var elementEnd = (this.emptyElement) ? '/>' : '>';
	return('<optbreak' + elementEnd);
};
OptBreak.prototype.closeElement = function() {
	return(this.emptyElement ? '' : '</optbreak>');
};
OptBreak.prototype.buildUSX = function(result) {
	result.push(this.openElement());
	result.push(this.closeElement());
};
OptBreak.prototype.toDOM = function(parentNode) {
	var child = new DOMNode('wbr');
	child.emptyElement = this.emptyElement;
	parentNode.appendChild(child);
	return(child);
};
/**
* This class contains a table element as parsed from a USX Bible file.
* This contains no attributes.  In fact it is not an explicit node in
* usfm, but is created at the point of the first row.
*/
function Table(node) {
	this.usxParent = null;
	this.children = [];
	Object.seal(this);
}
Table.prototype.tagName = 'table';
Table.prototype.addChild = function(node) {
	this.children.push(node);
	node.usxParent = this;
};
Table.prototype.openElement = function() {
	return('<table>');
};
Table.prototype.closeElement = function() {
	return('</table>');
};
Table.prototype.buildUSX = function(result) {
	result.push(this.openElement());
	for (var i=0; i<this.children.length; i++) {
		this.children[i].buildUSX(result);
	}
	result.push(this.closeElement());
};
Table.prototype.toDOM = function(parentNode) {
	var child = new DOMNode('table');
	child.setAttribute('class', 'usx');
	parentNode.appendChild(child);
	return(child);
};
/**
* This class contains a row (tr) element as parsed from a USX Bible file.
* This maps perfectly to the tr element of a table.
*/
function Row(node) {
	this.style = node.style;
	if (this.style !== 'tr') {
		throw new Error('Row style must be tr. It is ', this.style);
	}
	this.usxParent = null;
	this.children = [];
	Object.seal(this);
}
Row.prototype.tagName = 'row';
Row.prototype.addChild = function(node) {
	this.children.push(node);
	node.usxParent = this;
};
Row.prototype.openElement = function() {
	return('<row style="' + this.style + '">');
};
Row.prototype.closeElement = function() {
	return('</row>');
};
Row.prototype.buildUSX = function(result) {
	result.push(this.openElement());
	for (var i=0; i<this.children.length; i++) {
		this.children[i].buildUSX(result);
	}
	result.push(this.closeElement());
};
Row.prototype.toDOM = function(parentNode) {
	var child = new DOMNode('tr');
	child.setAttribute('class', 'usx');
	parentNode.appendChild(child);
	return(child);
};
/**
* This class contains a cell (th or td) element as parsed from a USX Bible file.
* This maps perfectly to the th or td element of a table.
*/
function Cell(node) {
	this.style = node.style;
	if (! Cell.expectedStyles.has(this.style)) {
		throw new Error('Cell style must be ' + Array.from(Cell.expectedStyles).join(', ') + '.  It is |' + this.style + '|');
	}
	this.align = node.align;
	if (this.align !== 'start' && this.align !== 'end') {
		throw new Error('Cell align must be start. It is |' + this.align + '|');
	}
	this.usxParent = null;
	this.children = [];
	Object.seal(this);
}
Cell.expectedStyles = new Set(['tc1', 'tc2', 'tc3', 'tc4',  // table cell number
								'tcr1','tcr2', 'tcr3', 'tcr4', // table cell number right aligned
								'th1', 'th2', 'th3', 'th4', // table column heading
								'thr1', 'thr2', 'thr3', 'thr4' // table column heading right aligned
								]);
Cell.prototype.tagName = 'cell';
Cell.prototype.addChild = function(node) {
	this.children.push(node);
	node.usxParent = this;
};
Cell.prototype.openElement = function() {
	return('<cell style="' + this.style + '" align="' + this.align + '">');
};
Cell.prototype.closeElement = function() {
	return('</cell>');
};
Cell.prototype.buildUSX = function(result) {
	result.push(this.openElement());
	for (var i=0; i<this.children.length; i++) {
		this.children[i].buildUSX(result);
	}
	result.push(this.closeElement());
};
Cell.prototype.toDOM = function(parentNode) {
	var child = new DOMNode('td');
	child.setAttribute('class', this.style);
	// align is not processed here.
	parentNode.appendChild(child);
	return(child);
};
/**
* This object contains a figure of the Bible text as parsed from a USX version of the Bible.
*/
function Figure(node) {
	this.style = node.style;
	this.desc = node.desc;
	this.alt = node.alt;
	this.file = node.file;
	this.size = node.size;
	this.loc = node.loc;
	this.copy = node.copy;
	this.ref = node.ref;
	this.caption = null;  // This is set in Figure.addChild
	this.emptyElement = node.emptyElement;
	this.usxParent = null;
	Object.seal(this);
}
Figure.prototype.tagName = 'figure';
Figure.prototype.addChild = function(node) {
	this.caption = node.text;
};
Figure.prototype.openElement = function() {
	var elementEnd = (this.emptyElement) ? ' />' : '>';
	var result = [];
	result.push('<figure');
	addAttr('style', this.style);
	addAttr('desc', this.desc);
	addAttr('alt', this.alt);
	addAttr('file', this.file);
	addAttr('size', this.size);
	addAttr('loc', this.loc);
	addAttr('copy', this.copy);
	addAttr('ref', this.ref);
	result.push(elementEnd);
	return result.join('');
	function addAttr(name, value) {
		if (value != null) {
			result.push(' ' + name + '="' + value + '"');
		}
	}
};
Figure.prototype.closeElement = function() {
	return(this.emptyElement ? '' : '</figure>');
};
Figure.prototype.buildUSX = function(result) {
	result.push(this.openElement());
	result.push(this.caption);
	result.push(this.closeElement());
};
Figure.prototype.toDOM = function(parentNode) {
	var child = new DOMNode('figure');
	child.setAttribute('hidden', 'true')
	child.setAttribute('data-style', this.style);
	child.setAttribute('data-desc', this.desc);
	child.setAttribute('data-size', this.size);
	child.setAttribute('data-loc', this.loc);
	child.setAttribute('data-copy', this.copy);
	child.setAttribute('data-ref', this.ref);
	child.emptyElement = this.emptyElement;
	var imageNode = new DOMNode('img');
	imageNode.setAttribute('src', this.file);
	imageNode.setAttribute('alt', this.alt);
	if (this.caption) {
		var captionNode = new DOMNode('figcaption');
		captionNode.appendText(this.caption);
		imageNode.appendChild(captionNode);
	}
	child.appendChild(imageNode);
	parentNode.appendChild(child);
	return(child);
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
* This class reads USX files and creates an equivalent object tree
* elements = [usx, book, chapter, para, verse, note, char];
* paraStyle = [b, d, cl, cp, h, li, p, pc, q, q2, mt, mt2, mt3, mte, toc1, toc2, toc3, ide, ip, ili, ili2, is, m, mi, ms, nb, pi, s, sp];
* charStyle = [add, bk, it, k, fr, fq, fqa, ft, wj, qs, xo, xt];
*/
function USXParser() {
}
USXParser.prototype.readBook = function(data) {
	var reader = new XMLTokenizer(data);
	var nodeStack = [];
	var node;
	var tempNode = {};
	var count = 0;
	while (tokenType !== XMLNodeType.END && count < 300000) {

		var tokenType = reader.nextToken();

		var tokenValue = reader.tokenValue();
		//console.log('type=|' + type + '|  value=|' + value + '|');
		count++;

		switch(tokenType) {
			case XMLNodeType.ELE:
				node = this.createUSXObject({ tagName: tokenValue, emptyElement: false });
				if (nodeStack.length > 0) {
					nodeStack[nodeStack.length -1].addChild(node);
				}
				nodeStack.push(node);
			case XMLNodeType.ELE_OPEN:
				tempNode = { tagName: tokenValue };
				tempNode.whiteSpace = '';
				//console.log(tokenValue, priorType, '|' + priorValue + '|');
				break;
			case XMLNodeType.ATTR_NAME:
				tempNode[tokenValue] = '';
				break;
			case XMLNodeType.ATTR_VALUE:
				tempNode[priorValue] = tokenValue;
				break;
			case XMLNodeType.ELE_END:
				tempNode.emptyElement = false;
				node = this.createUSXObject(tempNode);
				//console.log(node.openElement());
				if (nodeStack.length > 0) {
					nodeStack[nodeStack.length -1].addChild(node);
				}
				nodeStack.push(node);
				break;
			case XMLNodeType.TEXT:
			case XMLNodeType.WHITESP:
				node = new Text(tokenValue);
				//console.log(node.text);
				if (nodeStack.length > 0) {
					nodeStack[nodeStack.length -1].addChild(node);
				}
				break;
			case XMLNodeType.ELE_EMPTY:
				tempNode.emptyElement = true;
				node = this.createUSXObject(tempNode);
				//console.log(node.openElement());
				nodeStack[nodeStack.length -1].addChild(node);
				break;
			case XMLNodeType.ELE_CLOSE:
				node = nodeStack.pop();
				//console.log(node.closeElement());
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
				throw new Error('The XMLNodeType ' + tokenType + ' is unknown in USXParser.');
		}
		var priorValue = tokenValue;
	}
	return(node);
};
USXParser.prototype.createUSXObject = function(tempNode) {
	switch(tempNode.tagName) {
		case 'char':
			return(new Char(tempNode));
		case 'note':
			return(new Note(tempNode));
		case 'verse':
			return(new Verse(tempNode));
		case 'para':
			return(new Para(tempNode));
		case 'chapter':
			return(new Chapter(tempNode));
		case 'book':
			return(new Book(tempNode));
		case 'ref':
			return(new Ref(tempNode));
		case 'optbreak':
			return(new OptBreak(tempNode));
		case 'table':
			return(new Table(tempNode));
		case 'row':
			return(new Row(tempNode));
		case 'cell':
			return(new Cell(tempNode));
		case 'figure':
			return(new Figure(tempNode));
		case 'usx':
			return(new USX(tempNode));
		default:
			throw new Error('USX element name ' + tempNode.tagName + ' is not known to USXParser.');
	}
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
				original = original.replace(/<verse eid=\"[A-Z0-9a-z\, :-]+\" \/>/g, ''); // Hack remove eid elements
				original = original.replace(/ vid=\"[A-Z0-9 :-]+\"/g, '');
				original = original.replace(/optbreak \/>/g, 'optbreak/>'); // Hack to fix no space in optbreak element.
				original = original.replace(/ vid=\"[A-Z0-9]{3} [0-9]+\:[0-9a-d]+\"/g, '')
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



var fs = require("fs");

function testOne(fullPath, outPath, files, index, callback) {
	if (index >= files.length) {
		callback();
	} else {
		var file = files[index];
		symmetricTest(fullPath, outPath, file, function() {
			testOne(fullPath, outPath, files, index + 1, callback);			
		});
	}
}
function symmetricTest(fullPath, outPath, filename, callback) {
	if (filename.substr(0, 1) === '.' || !filename.toLowerCase().endsWith(".usx")) {
		callback();
	} else {
		var inFile = fullPath + filename;
		fs.readFile(inFile, { encoding: 'utf8'}, function(err, data) {
			if (err) {
				console.log('READ ERROR', JSON.stringify(err));
				process.exit(1);
			}
			var rootNode = parser.readBook(data);
			var outFile = outPath + '/' + filename;
			fs.writeFile(outFile, rootNode.toUSX(), { encoding: 'utf8'}, function(err) {
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
	console.log('Usage: USXParserTest.sh  inputDir  dbDir  outputDir  bibleId');
	process.exit(1);
}
const bibleId = process.argv[5];
console.log(bibleId, "USXParserTest START");
const dbDir = process.argv[3];
ValidationAdapter.shared().open(bibleId, dbDir, "USXParserTest");
var parser = new USXParser();
const outPath = process.argv[4] + "/usx";
ensureDirectory(outPath, function() {
	var fullPath = process.argv[2]
	if (!fullPath.endsWith("/")) {
		fullPath += "/"
	}
	var files = fs.readdirSync(fullPath);
	testOne(fullPath, outPath, files, 0, function() {
		ValidationAdapter.shared().close();
		console.log(bibleId, 'USXParserTest DONE');
	});
});

