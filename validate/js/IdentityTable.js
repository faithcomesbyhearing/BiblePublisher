/**
* This program inserts an identity table and an identity record into the
* database.  It is expected to be run after all of the validation has been done.
*/

var IdentityTable = function() {
}
IdentityTable.prototype.open = function(versionPath, callback) {
	var that = this;
	var sqlite3 = require('sqlite3');
	var database = new sqlite3.Database(versionPath, sqlite3.OPEN_READWRITE, function(err) {
		if (err) that.fatalError(err, 'openDatabase');
		callback(database);
	});
};
IdentityTable.prototype.createIdentity = function(database, callback) {
	var that = this;
	var statement = 'DROP TABLE IF EXISTS identity';
	database.run(statement, function(err) {
		if (err) that.fatalError(err, 'IdentityTable.dropTableIdentity');
		else {
			statement = 'CREATE TABLE identity(' +
					' versionCode TEXT NOT NULL PRIMARY KEY,' +
					' filename TEXT NOT NULL,' +
					' bibleVersion TEXT NOT NULL,' +
					' datetime TEXT NOT NULL,' +
					' publisher TEXT NOT NULL)';
			database.run(statement, function(err) {
				if (err) that.fatalError(err, 'IdentityTable.createIdentity');
				callback();
			});
		}
	});
};
IdentityTable.prototype.createNewIdentityRecord = function(database, versionCode, filename, bibleVersion, callback) {
	var that = this;
	var datetime = new Date().toISOString();
	this.getWhoAmI(function(who) {
		var statement = 'INSERT INTO identity(versionCode, filename, bibleVersion, datetime, publisher) VALUES (?,?,?,?,?)';
		database.run(statement, [versionCode, filename, bibleVersion, datetime, who], function(err, result) {
			if (err) that.fatalError(err, 'IdentityTable.createNewIdentityRecord');
			callback();
		});
	});
};
IdentityTable.prototype.getWhoAmI = function(callback) {
	var proc = require('child_process');
	proc.exec('whoami', { encoding: 'utf8' }, function(err, stdout, stderr) {
		if (err) that.fatalError(err, 'IdentityTable.whoami');
		callback(stdout.trim());
	});		
};
IdentityTable.prototype.fatalError = function(err, source) {
	console.log('FATAL ERROR ', err, ' AT ', source);
	process.exit(1);
};


if (process.argv.length < 4) {
	console.log('Usage: IdentityTable.sh  dbDir bibleId');
	process.exit(1);
}


const bibleId = process.argv[3];
const filename = bibleId + ".db";
const biblePath = process.argv[2] + "/" + filename;
const bibleVersion = "1.1";

var identityTable = new IdentityTable();
identityTable.open(biblePath, function(database) {
	identityTable.createIdentity(database, function() {
		identityTable.createNewIdentityRecord(database, bibleId, filename, bibleVersion, function() {
			database.close();
			console.log("IdentityTable Completed")
		});	
	});
});

