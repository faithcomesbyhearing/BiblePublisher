/**
* This class iterates over the USX data model, and translates the contents to DOM.
*
* This method generates a DOM tree that has exactly the same parentage as the USX model.
* This is probably a problem.  The easy insertion and deletion of nodes probably requires
* having a hierarchy of books and chapters. GNG April 13, 2015
*
* The DOMNode class this uses is not a standard class, but one defined for this project
* at Library/util/DOMNode.js
*
* NOTE: This class must be instantiated once for an entire book are all books, not just one chapter,
* because the bookCode is only present in chapter 0, but is needed by all chapters.
*/
function DOMBuilder(pubVersion) {
	this.localizeNumber = new LocalizeNumber(pubVersion.silCode);
	this.direction = pubVersion.direction;
	this.bookCode = '';
	this.chapter = 0;
	this.verse = 0;
	this.noteNum = 0;
	this.treeRoot = null;
	this.oneVerse = null; // temp used to embed verse
	this.inVerseDOM = null; // temp used to embed verse
	this.verseParentDOM = null;
	this.newParentDOM = null;
	Object.seal(this);
}
DOMBuilder.prototype.toDOM = function(usxRoot) {
	this.chapter = 0;
	this.verse = 0;
	this.noteNum = 0;
	this.oneVerse = undefined; // temp used to embed verse
	this.inVerseDOM = undefined; // temp used to embed verse
	this.verseParentDOM = undefined;
	this.newParentDOM = undefined;
	this.treeRoot = new DOMNode('root');
	this.readRecursively(this.treeRoot, usxRoot);
	return(this.treeRoot);
};
DOMBuilder.prototype.readRecursively = function(parentDom, node) {
	var domNode;
	var domParent = parentDom;
	if(this.oneVerse && this.verseParentDOM == parentDom) {
		domParent = this.inVerseDOM ;
	}
	this.newParentDOM = domParent;
	//console.log('dom-parent: ', domParent.nodeName, domParent.nodeType, '  node: ', node.tagName);
	switch(node.tagName) {
		case 'usx':
			domNode = node.toDOM(domParent);
			break;
		case 'book':
			this.bookCode = node.code;
			domParent.setAttribute('id', this.bookCode + ':0');
			domNode = node.toDOM(domParent);
			break;
		case 'chapter':
			this.oneVerse = undefined;
			if (node.number) {
				this.chapter = node.number;
				parentDom.setAttribute('id', this.bookCode + ':' + this.chapter);
				this.noteNum = 0;
				domNode = node.toDOM(parentDom, this.bookCode, this.localizeNumber);
			}
			break;
		case 'para':
			domNode = node.toDOM(parentDom); 
			if (this.oneVerse && Para.inChapterInVerse.has(node.style)) {
				var nextNotWSChild = null;
				for (var i = 0; i < node.children.length; i++ ) { 
					if(!(node.children[i].tagName === 'text' && node.children[i].text.trim().length == 0)) {
						nextNotWSChild = node.children[i];
						break;
					} 
				}
				if(nextNotWSChild?.tagName !== 'verse' && this.oneVerse) {
					this.verseParentDOM = domNode;
					this.newParentDOM = this.oneVerse.toDOM(domNode, this.bookCode, this.chapter, this.localizeNumber, false);
					this.inVerseDOM = this.newParentDOM;
				} else {
					this.oneVerse = undefined;
					this.inVerseDOM = null;
				}
			}
			
			break;
		case 'verse':
			if (node.eid) {
				this.oneVerse = undefined;
				this.inVerseDOM = null;
			} else if (node.number) {
				this.verse = node.number;
				this.oneVerse = node;
				this.verseParentDOM = parentDom;
				domNode = node.toDOM(parentDom, this.bookCode, this.chapter, this.localizeNumber);
				this.newParentDOM = domNode;
				this.inVerseDOM = this.newParentDOM;
			}
			break;
		case 'text':
			var parent = domParent;
			if (this.oneVerse && this.inVerseDOM == domParent) { 
				// open a v-tex span 
				parent = this.oneVerse.getVerseTextDOM(domParent);
			}
			node.toDOM(parent, this.bookCode, this.chapter);
			domNode = domParent;
			break;
		case 'char':
			domNode = node.toDOM(domParent);
			break;
		case 'note':
			domNode = node.toDOM(domParent, this.bookCode, this.chapter, ++this.noteNum, this.direction);
			break;
		case 'ref':
			domNode = node.toDOM(domParent);
			break;
		case 'optbreak':
			domNode = node.toDOM(domParent);
			break;
		case 'table':
			domNode = node.toDOM(domParent);
			break;
		case 'row':
			domNode = node.toDOM(domParent);
			break;
		case 'cell':
			domNode = node.toDOM(domParent);
			break;
		case 'figure':
			domNode = node.toDOM(domParent);
			break;
		default:
			throw new Error('Unknown tagname ' + node.tagName + ' in DOMBuilder.readBook');
	}
	if ('children' in node) {
		this.newParentDOM = domNode;
		for (var i=0; i<node.children.length; i++) {
			this.readRecursively(domNode, node.children[i]);
		}
	}
};
