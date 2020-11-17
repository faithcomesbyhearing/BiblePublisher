/**
* This class parses a DBL MetaData.xml file contents
* and it parses the file.
*/

function DBLMetaData() {
	this.versionName = null;
	this.versionNameLocal = null;
	this.versionAbbrev = null;
	this.iso3 = null;
	this.scriptName = null;
	this.scriptDirection = null;
	this.bookSequence = []
	Object.seal(this);
}

DBLMetaData.prototype.parse = function(directory) {
	const fs = require('fs');
	let pathname = directory + "metadata.xm";
	let exists = fs.existsSync(pathname);
	if (!exists) {
		pathname = directory + "../metadata.xml";
		exists = fs.existsSync(pathname);
	}
	//console.log(exists, pathname);
	if (exists) {
		let data = fs.readFileSync(pathname,"utf-8");
		this.parseXML(data);
	} else {
		this.useFilenameSeq(directory);
	}
}

DBLMetaData.prototype.parseXML = function(data) {
	var reader = new XMLTokenizer(data);
	var stack = [];
	var attrName = null;
	while (tokenType !== XMLNodeType.END) {
		//console.log(stack);
		var tokenType = reader.nextToken();
		var tokenValue = reader.tokenValue();
		//console.log('type=|' + tokenType + '|  value=|' + tokenValue + '|');

		switch(tokenType) {
			case XMLNodeType.ELE:
				stack.push(tokenValue);
				break;
			case XMLNodeType.ELE_OPEN:
				stack.push(tokenValue);
				break;
			case XMLNodeType.ATTR_NAME:
				attrName = tokenValue;
				break;
			case XMLNodeType.ATTR_VALUE:
				if (stack.length == 5) {
					if (stack[1] == "contents") {
						if (stack[2] == "bookList") {
							if (stack[3] == "books") {
								if (stack[4] == "book") {
									if (attrName == "code") {
										this.bookSequence.push(tokenValue + ".usx");
									}
								}
							}
						}
					}
				}
				break;
			case XMLNodeType.TEXT:
				if (stack.length == 3) {
					if (stack[1] == "identification") {
						if (stack[2] == "name") {
							this.versionName = tokenValue;
						}
						else if (stack[2] == "nameLocal") {
							this.versionNameLocal = tokenValue;
						}
						else if (stack[2] == "abbreviation") {
							this.versionAbbrev = tokenValue;
						}
					}
					else if (stack[1] == "language") {
						if (stack[2] == "iso") {
							this.iso3 = tokenValue;
						}
						else if (stack[2] == "script") {
							this.scriptName = tokenValue;
						}
						else if (stack[2] == "scriptDirection") {
							this.scriptDirection = tokenValue;
						}
					}
				}
				break;
			case XMLNodeType.ELE_EMPTY:
				stack.pop();
				break;
			case XMLNodeType.ELE_CLOSE:
				stack.pop();
				break;
		}
	}
};

DBLMetaData.prototype.useFilenameSeq = function(directory) {
	console.log("no file to read, use sequence indicators");

};

DBLMetaData.prototype.useCanonSeq = function() {

};

