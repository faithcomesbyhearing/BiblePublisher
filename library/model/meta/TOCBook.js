/**
* This class holds the table of contents data each book of the Bible, or whatever books were loaded.
*/
function TOCBook(code, heading, title, name, abbrev, chapters, priorBook, nextBook) {
	this.code = code || null;
	this.heading = heading || null;
	this.title = title || null;
	this.name = name || null;
	this.abbrev = abbrev || null;
	this.chapters = chapters || [];
	this.priorBook = priorBook || null;
	this.nextBook = nextBook || null; // do not want undefined in database
	Object.seal(this);
}

