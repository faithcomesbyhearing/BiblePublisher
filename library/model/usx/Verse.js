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
	child.setAttribute('class', this.style + " v-number");
	if (this.number) child.setAttribute('data-number', this.number);
	if (this.altnumber) child.setAttribute('data-altnumber', this.altnumber);
	if (this.pubnumber) child.setAttribute('data-pubnumber', this.pubnumber);
	child.emptyElement = false;
	if (printVerse) child.appendText(localizeNumber.toLocal(this.number) + '&nbsp;');

	container.appendChild(child);
	parentNode.appendChild(container);
	return(this.getContentDOM(container));
};
Verse.prototype.getContentDOM = function(verseContainer) {

	var text = new DOMNode('span');
	text.setAttribute('class', 'v-text');
	if (this.number) text.setAttribute('data-number', this.number);
	if (this.altnumber) text.setAttribute('data-altnumber', this.altnumber);
	if (this.pubnumber) text.setAttribute('data-pubnumber', this.pubnumber);
	text.emptyElement = false;

	verseContainer.appendChild(text);
	return(text);
};
