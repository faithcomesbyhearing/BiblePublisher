/**
* This class is used to carry information about the language and version
* for the publish program.
*/
function PubVersion(silCode, langCode, direction) {
	this.silCode = silCode;
	this.langCode = langCode;
	this.direction = direction;
	Object.freeze(this);
}