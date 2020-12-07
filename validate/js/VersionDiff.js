/**
* This program does a difference compare of a newly created Bible with a previous copy.
* And it creates an Identity record inside the Bible to indicate if it is the same or different.
*/
var versionDiff = function(versionCode) {
	var filename = versionCode + '.db';
	openDatabase(CURRENT_PATH, filename, function(currentDB) {
		createIdentity(currentDB, function() {
			var exists = fs.existsSync(FINAL_PATH + filename);
			console.log('EXISTS', exists);
			if (exists) {
				openDatabase(FINAL_PATH, filename, function(finalDB) {
					copyIdentityRecord(finalDB, currentDB, function() {
						var proc = require('child_process');
						var diffLog = 'output/' + versionCode + '/Difference.out';
						proc.exec('sqldiff ' + FINAL_PATH+filename + ' ' + CURRENT_PATH+filename + ' > ' + diffLog, 
										{encoding: 'utf-8'}, function(err, stdout, stderr) {
							if (err) {
								errorMessage(err, 'VersionDiff.sqlidff');
							} else {
								var stat = fs.lstatSync(diffLog);
								console.log('difference.log SIZE', stat.size);
								if (stat.size < 1) {
									console.log('no diff');
									closeDatabases([currentDB, finalDB], function() {
										console.log('DONE, No change from prior version');
									});
								} else {
									getNextBibleVersion(database, function(bibleVersion) {
										createNewIdentityRecord(currentDB, versionCode, filename, bibleVersion, function() {
											closeDatabases([currentDB, finalDB], function() {
												console.log('DONE, New version', bibleVersion);
											});
										});
									});
								}
							}
						});
					});
				});
			} else {
				createNewIdentityRecord(currentDB, versionCode, filename, '1.1', function() {
					closeDatabases([currentDB], function() {
						console.log('DONE, First version 1.1');				
					});
				});	
			}
		});
	});
	
	function openDatabase(path, filename, callback) {
		var sqlite3 = (DB_VERBOSE) ? require('sqlite3').verbose() : require('sqlite3');
		var database = new sqlite3.Database(path + filename);
		if (DB_VERBOSE) {
			database.on('trace', function(sql) {
				console.log('DO ', sql);
			});
			database.on('profile', function(sql, ms) {
				console.log(ms, 'DONE', sql);
			});
		}
		database.run("PRAGMA foreign_keys = ON");
		callback(database);
	}
	function closeDatabases(databases, callback) {
		var database = databases.shift();
		if (database) {
			database.close(function(err) {
				if (err) {
					errorMessage(err, "VersionDiff.closeDatabase");
				} else {
					closeDatabases(databases, callback);
				}
			});
		} else {
			callback();
		}
	}
	function exportTables(database, tables, statements, output, callback) {
		var table = tables.shift();
		if (table) {
			var statement = statements[table];
			database.all(statement, function(err, results) {
				if (err) {
					errorMessage(err, 'VersionDiff.exportTables');
				} else {
					fs.appendFileSync(output, table + '\n', {encoding: 'utf-8'});
					for (var i=0; i<results.length; i++) {
						fs.appendFileSync(output, JSON.stringify(results[i]) + '\n', {encoding: 'utf-8'});
					}
					exportTables(database, tables, statements, output, callback); 
				}
			});
		} else {
			callback();
		}
	}
	function createIdentity(database, callback) {
		var statement = 'DROP TABLE IF EXISTS identity';
		database.run(statement, function(err) {
			if (err) {
				errorMessage(err, 'VersionDiff.dropTableIdentity');
			} else {
				statement = 'CREATE TABLE identity(' +
					' versionCode TEXT NOT NULL PRIMARY KEY,' +
					' filename TEXT NOT NULL,' +
					' bibleVersion TEXT NOT NULL,' +
					' datetime TEXT NOT NULL,' +
					' appVersion TEXT NOT NULL,' +
					' publisher TEXT NOT NULL)';
				database.run(statement, function(err) {
					if (err) {
						errorMessage(err, 'VersionDiff.createIdentity');
					} else {
						callback();
					}
				});
			}
		});
	}
	function copyIdentityRecord(fromDB, toDB, callback) {
		var statement = 'DELETE FROM identity';
		toDB.run(statement, function(err, results) {
			if (err) {
				errorMessage(err, 'VersionDiff.deleteFromIdentity');
			} else {
				statement = 'SELECT versionCode, filename, bibleVersion, datetime, appVersion, publisher FROM identity';
				fromDB.get(statement, function(err, row) {
					if (err) {
						errorMessage(err, 'VersionDiff.copyIdentityRecord fromDB');
					} else {
						statement = 'INSERT INTO identity(versionCode, filename, bibleVersion, datetime, appVersion, publisher) VALUES (?,?,?,?,?,?)';
						toDB.run(statement, [row.versionCode, row.filename, row.bibleVersion, row.datetime, row.appVersion, row.publisher], function(err, result) {
							if (err) {
								errorMessage(err, 'VersionDiff.copyIdentityRecord toDB');
							} else {
								callback(result);
							}
						});
					}
				});
			}
		});
	}
	function createNewIdentityRecord(database, versionCode, filename, bibleVersion, callback) {
		var datetime = new Date().toISOString();
		accessAppVersion(function(appVersion) {
			getWhoAmI(function(who) {
				var statement = 'INSERT INTO identity(versionCode, filename, bibleVersion, datetime, appVersion, publisher) VALUES (?,?,?,?,?,?)';
				database.run(statement, [versionCode, filename, bibleVersion, datetime, appVersion, who], function(err, result) {
					if (err) {
						errorMessage(err, 'VersionDiff.createNewIdentityRecord');
					} else {
						callback(result);
					}
				});
			});			
		});
	}
	function accessAppVersion(callback) {
		const fs = require('fs');
		fs.readFile(CONFIG_XML, "utf-8", function(err, contents) {
			if (err) {
				errorMessage(err, 'VersionDiff.accessAppVersion');
			} else {
				var vers1 = contents.indexOf('version="') + 9;
				if (vers1 > 0) {
					var vers2 = contents.indexOf('"', vers1);
					if (vers2 > 0) {
						appVersion = contents.substr(vers1, vers2 - vers1);
						callback(appVersion);
					} else {
						errorMessage(contents.substr(0,50), 'VersionDiff.accessAppVersion could not parse.');
					}
				} else {
					errorMessage(contents.substr(0,50), 'VersionDiff.accessAppVersion could not parse.');
				}
			}
		});
	}
	function getWhoAmI(callback) {
		var proc = require('child_process');
		proc.exec('whoami', { encoding: 'utf8' }, function(err, stdout, stderr) {
			if (err) {
				errorMessage(err, 'VersionDiff.whoami');
			} else {
				callback(stdout.trim())
			}
		});		
	}
	function getNextBibleVersion(database, callback) {
		database.get('SELECT bibleVersion FROM Identity', function(err, row) {
			if (err) {
				errorMessage(err, 'VersionDiff.getNextBibleVersion');
			} else {
				var parts = row.bibleVersion.split('.');
				parts[1] = Number(parts[1]) + 1;
				callback(parts.join('.'));
			}
		});
	}
	function errorMessage(err, message) {
		console.log('ERROR ', JSON.stringify(err), message);
		process.exit(1);
	}
}

const fs = require('fs');

const DB_VERBOSE = false;
const CURRENT_PATH = process.env.HOME + '/ShortSands/DBL/4validated/';
const FINAL_PATH = process.env.HOME + '/ShortSands/DBL/5ready/';
const CONFIG_XML = process.env.HOME + '/Shortsands/BibleApp/YourBible/config.xml';
	
if (process.argv.length < 3) {
	console.log('Usage: ./VersionDiff.sh VERSION');
	process.exit(1);
} else {
	var version = process.argv[2];
	versionDiff(version);	
}