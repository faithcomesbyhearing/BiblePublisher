/**
* After validation is complete and manual inspection of validation results in the approval of the file,
* this program should be run in order to remove all extraneous data that was put into the Bible database
* and it should run vacuum at the end.
*/
function ValidationCleanup(versionPath) {
	this.versionPath = versionPath;
	this.db = null;
	Object.seal(this);
}
ValidationCleanup.prototype.open = function(callback) {
	var that = this;
	var sqlite3 = require('sqlite3');
	this.db = new sqlite3.Database(this.versionPath, sqlite3.OPEN_READWRITE, function(err) {
		if (err) that.fatalError(err, 'openDatabase');
		//that.db.on('trace', function(sql) { console.log('DO ', sql); });
		//that.db.on('profile', function(sql, ms) { console.log(ms, 'DONE', sql); });
		callback();
	});	
};
ValidationCleanup.prototype.cleanup = function(callback) {
	var that = this;
	this.db.serialize(function() {
		execute('drop table if exists valPunctuation');
		execute('drop table if exists valConcordance');
		execute('update concordance set refPosition = null');
		execute('update concordance set refList = ""');
		execute('update chapters set xml = ""');
		execute('update verses set xml = ""');
		
		that.close(function() {
			callback();
		});
	});
	
	function execute(statement) {
		that.db.exec(statement, function(err) {
			if (err) that.fatalError(err, statement);
		});
	};
};
/**
* Note: vacuum can change any rowids.  And rowid dependancies in tables must be redone here after vacuum.
*/
ValidationCleanup.prototype.close = function(callback) {
	var that = this;
	this.db.exec('vacuum', function(err) {
		if (err) that.fatalError(err, 'vacuum');
		that.db.close(function(err) {
			if (err) that.fatalError(err, 'close');
			callback();
		});
	});
};
ValidationCleanup.prototype.fatalError = function(err, source) {
	console.log('FATAL ERROR ', err, ' AT ', source);
	process.exit(1);
};

	
if (process.argv.length < 5) {
	console.log('Usage: ValidationCleanup.sh  dbDir  dbOutDir  bibleId');
	process.exit(1);
} else {
	var fs = require('fs');
	var contents = fs.readFileSync(process.argv[2] + process.argv[4] + '.db');
	var filename = process.argv[3] + process.argv[4] + '.db';
	fs.writeFileSync(filename, contents);
	console.log('Process ' + filename);
	var val = new ValidationCleanup(filename);
	val.open(function() {
		val.cleanup(function() {
			process.exit(0);
		});
	});
}

