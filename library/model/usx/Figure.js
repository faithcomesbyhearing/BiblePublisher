/**
* This object contains a figure of the Bible text as parsed from a USX version of the Bible.
*/
function Figure(node) {
	this.style = node.style;
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
	addAttr('alt', this.alt);
	addAttr('file', this.file);
	addAttr('size', this.size);
	addAttr('loc', this.loc);
	addAttr('copy', this.copy);
	addAttr('ref', this.ref);
	result.push(elementEnd);
	return result.join('');
	function addAttr(name, value) {
		if (value) {
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
};