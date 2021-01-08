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
