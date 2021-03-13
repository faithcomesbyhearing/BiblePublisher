/**
* This class reads the USX files of the Bibles, and divides them up into verses
* and stores the individual verses in the verses table.
*/
function VerseBuilder(adapter, chapterBuilder) {
	this.adapter = adapter;
	this.chapterBuilder = chapterBuilder;
	this.verses = [];
	this.breakList = []; // temp used by breakChapterIntoVerses
	this.oneVerse = null; // temp used by breakChapterIntoVerses
	this.insideVerse = false; // temp used by breakChapterIntoVerses
	this.scanResult = []; // temp used by extractVerseText
	Object.seal(this); 
}
VerseBuilder.prototype.readBook = function(usxRoot) {
	// Do nothing here. Data collection is done by using chapterBuilder
};
VerseBuilder.prototype.loadDB = function(callback) {
	var that = this;
	var chapters = this.chapterBuilder.chapters;
	for (var i=0; i<chapters.length; i++) {
		var chapObj = chapters[i];
		if (chapObj.chapterNum > 0) { // excludes FRT, GLO and chapter introductions
			var verseList = breakChapterIntoVerses(chapObj.usxTree);
			for (var j=0; j<verseList.length; j++) {
				var verseUSX = verseList[j];
				var verseNum = verseUSX.children[0].number;
				verseNum = verseNum.replace(",", "-")
				var verseHTML = extractVerseText(verseUSX);
				var reference = chapObj.bookCode + ':' + chapObj.chapterNum + ':' + verseNum;
				if (verseNum) {
					this.verses.push([ reference, verseUSX.toUSX(), verseHTML ]);
				}	
			}
		}
	}
	this.adapter.load(this.verses, function(err) {
		if (err instanceof IOError) {
			console.log('Storing verses failed');
			callback(err);
		} else {
			callback();
		}
	});
	function breakChapterIntoVerses(chapterUSX) {
		that.breakList = [];
		that.oneVerse = null;
		breakRecursively(chapterUSX);
		if (that.oneVerse) {
			that.breakList.push(that.oneVerse); // last verse in chapter
		}
		return(that.breakList);
	}
	function breakRecursively(verseUSX) {
		switch(verseUSX.tagName) {
			case 'book':
			case 'chapter':
			case 'note':
			case 'ref':
			case 'optbreak':
			case 'figure':
			case 'table':   // This excludes table content from verses.  This might not always be correct.
				break;
			case 'usx':
				for (var i=0; i<verseUSX.children.length; i++) {
					breakRecursively(verseUSX.children[i]);
				}
				break;
			case 'para':
				if (Para.inChapterInVerse.has(verseUSX.style)) {
					for (var i=0; i<verseUSX.children.length; i++) {
						breakRecursively(verseUSX.children[i]);
					}
				}
				break;		
			case 'verse':
				if (verseUSX.eid) {
					that.insideVerse = false;
				} else {
					that.insideVerse = true;
					if (that.oneVerse) {
						that.breakList.push(that.oneVerse);
					}
					var versionNumber = getVersion(verseUSX);
					that.oneVerse = new USX({ version: versionNumber });
					that.oneVerse.addChild(verseUSX);
				}
				break;
			case 'char':
			case 'text':
				if (that.oneVerse && that.insideVerse) {
					that.oneVerse.addChild(verseUSX);
				}
				break;
			default:
				throw new Error('Unknown tagName ' + verseUSX.tagName + ' in VerseBuilder.breakRecursively.');
		}
	}
	function extractVerseText(verseUSX) {
		that.scanResult = [];
		scanRecursively(verseUSX);
		return(that.scanResult.join('').trim());
	}
	function scanRecursively(node) {
		if (node.tagName === 'text') {
			that.scanResult.push(node.text);
		}
		if (node.tagName !== 'note' && 'children' in node) {
			for (var i=0; i<node.children.length; i++) {
				scanRecursively(node.children[i]);
			}
		}
	}
	function getVersion(verseUSX) {
		var nodeUSX = verseUSX;
		while(nodeUSX.usxParent) {
			nodeUSX = nodeUSX.usxParent;
		}
		return nodeUSX.version;
	}
};
