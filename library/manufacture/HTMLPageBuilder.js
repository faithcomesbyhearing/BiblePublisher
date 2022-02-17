/**
* This class a zip file with the css file and a Bible book version.
*/
function HTMLPageBuilder(version, versionPath, database) {
	this.version = version;
	this.versionPath = versionPath;
	this.fs = require('fs');
	this.db = database;
}
HTMLPageBuilder.prototype.process = function () {

	this.query( function () {
		console.log('HTMLPageBuilder DONE');
	});
}

HTMLPageBuilder.prototype.query = function (callback) {
	var that = this;
	that.db.select('SELECT reference, html FROM chapters order by rowid', [], function(results) {	
		for (var i = 0; i < results?.length; i++) {
			var row = results[i];
			that.outputFile( row);
		}
		console.log(results?.length, 'Book chapters');
		callback(that.db);
	});
};
HTMLPageBuilder.prototype.outputFile = function (row) {
	var that = this;
	var chap = row.reference;
	var book = chap.split(':');
	chap = chap.replace(':','');
	var html = row.html;
	var css = '\n<LINK REL=StyleSheet HREF="BibleApp.css" TYPE="text/css" MEDIA=screen>';
	html = html.concat(css);
	var folder = `${that.versionPath}${this.version}/`;
	var outputFile = `${folder}${chap}.html`;
	if (!this.fs.existsSync(folder)) { 
		this.fs.mkdir(folder, {recursive: false}, (err) => {if (err) that.fatalError(err, 'make dir')});
	}
	this.fs.writeFile(outputFile, html, function (err) {
		if (err) that.fatalError(err, `write generated ${book[0]} ${book[1]}`);
		console.log('Generated Stored');
	});
};
HTMLPageBuilder.prototype.fatalError = function (err, source) {
	console.log('FATAL ERROR ', err, ' AT ', source);
	process.exit(1);
};



