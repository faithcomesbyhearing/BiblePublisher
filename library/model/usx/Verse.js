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
Verse.prototype.toDOM = function(parentNode, bookCode, chapterNum, localizeNumber) {
	var reference = bookCode + ':' + chapterNum + ':' + this.number;
	var child = new DOMNode('span');
	child.setAttribute('id', reference);
	child.setAttribute('class', this.style);
	if (this.number) child.setAttribute('data-number', this.number);
	if (this.altnumber) child.setAttribute('data-altnumber', this.altnumber);
	if (this.pubnumber) child.setAttribute('data-pubnumber', this.pubnumber);
	child.emptyElement = false;
	child.appendText(localizeNumber.toLocal(this.number) + '&nbsp;');
	parentNode.appendChild(child);
	return(child);
};
