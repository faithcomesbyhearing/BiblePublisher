/**
* This is not a validation program, but it produces a report of the name information in
* the table of contents for all translations
*/
"use strict";
var fs = require('fs');
var PATH = process.env['HOME'] + '/ShortSands/DBL/3prepared/';

var tableContentsAudit = function() {
	
	var bibles = fs.readdirSync(PATH);
	iterateBiblesSync(bibles);
	
	function iterateBiblesSync(bibles) {
		var bible = bibles.shift();

		if (bible) {
			if (bible.charAt(0) !== '.') {
				processOne(bible, function() {
					iterateBiblesSync(bibles);
				});
			} else {
				iterateBiblesSync(bibles);
			}
		}
	}
	function processOne(bible, callback) {
		console.log(bible);
		open(bible, function(db) {
			select(db, bible, 'title', function() {
				select(db, bible, 'name', function() {
					select(db, bible, 'heading', function() {
						select(db, bible, 'abbrev', function() {
							db.close();
							callback();
						});
					});
				});
			});
		});
	}
	function open(bible, callback) {
		var sqlite3 = require('sqlite3');
		var db = new sqlite3.Database(PATH + bible, sqlite3.OPEN_READWRITE, function(error) {
			if (error) fatalError(error, 'openDatabase');
			//db.on('trace', function(sql) { console.log('DO ', sql); });
			//db.on('profile', function(sql, ms) { console.log(ms, 'DONE', sql); });
			callback(db);
		});
	}
	function select(db, bible, column, callback) {
		var statement = 'SELECT avg(length(name)) AS avg, max(length(name)) AS max, min(length(name)) AS min FROM tableContents';
		statement = statement.replace(/name/g, column);
		db.get(statement, [], function(error, row) {
			if (error) fatalError(error, 'select summary');
			var result = [bible, column, Math.round(row.avg), row.max, row.min];
			console.log(result.join(', '));
			callback();
		});
	}
}

tableContentsAudit();
