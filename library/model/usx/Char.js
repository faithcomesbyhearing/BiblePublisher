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
