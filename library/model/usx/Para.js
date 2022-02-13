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
	var child = Para.inChapterInVerse.has(this.style) ? new DOMNode('span') : new DOMNode('p');
	child.setAttribute('class', this.style);
	if (identStyles.indexOf(this.style) >= 0) {
		child.setAttribute('hidden', '');	
	}
	child.emptyElement = this.emptyElement;
	if (this.style === "p" && parentNode.childNodes.length > 0) {
		parentNode.appendChild(new DOMNode("br"));
	}
	parentNode.appendChild(child);
	return(child);
};

