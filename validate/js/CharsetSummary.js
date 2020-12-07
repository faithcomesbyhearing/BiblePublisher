/**
* This program reads any number of Bible versions in sqlite format, and reads the charset table, and creates
* a single table, which it outputs in CSV format.  This table is usd to identify characters that should affect
* the concordance builder program.  Both characters that are to serve as word separators and punctuation characters that
* must be removed must be identified in the concordance program.
*/
"use strict";
function CharsetSummary(versionsPath) {
	this.versionsPath = versionsPath;
	this.fs = require('fs');
}
CharsetSummary.prototype.readData = function(callback) {
	var that = this;
	var normalized = [];
	readDirectory(function(files) {
		var bibles = filterBibles(files);
		console.log('BIBLES', bibles);
		readAllCharsets(bibles, 0, function(results) {
			callback(results);
		});
	});

	function readDirectory(callback) {
		that.fs.readdir(that.versionsPath, function(err, data) {
			if (err) { that.fatalError(err, 'readdir'); } 
			callback(data);
		});	
	}	
	function filterBibles(files) {
		var result = [];
		for (var i=0; i<files.length; i++) {
			if (files[i].indexOf('.db') > 0) {
				result.push(files[i]);
			}
		}
		return(result);
	}
	function readAllCharsets(files, index, callback) {
		if (index < files.length) {
			var file = files[index];
			console.log('READ DB ', file);
			readCharsetTable(file, function(results) {
				for (var i=0; i<results.length; i++) {
					var row = results[i];
					row.version = file;
					normalized.push(row);
				}
				readAllCharsets(files, index + 1, callback);
			});
		} else {
			callback(normalized);
		}
	}
	function readCharsetTable(file, callback) {
		var sqlite3 = require('sqlite3');
		var db = new sqlite3.Database(file, sqlite3.OPEN_READONLY, function(err) {
			if (err) that.fatalError(err, 'openDatabase');
			//db.on('trace', function(sql) { console.log('DO ', sql); });
			db.all('SELECT hex, char FROM charset', [], function(err, results) {
				db.close();
				if (err) that.fatalError(err, 'select charset');
				callback(results);
			});
		});		
	}
};
CharsetSummary.prototype.organizeData = function(normalized) {
	normalized.sort(function(a, b) {
		if (a.version < b.version) return(-1);
		if (a.version > b.version) return(1);
		return(0);
	});
	var that = this;
	var summary = {};
	for (var i=0; i<normalized.length; i++) {
		var row = normalized[i];
		var entry = summary[row.hex];
		if (entry) {
			entry.versions.push(row.version);
		} else {
			summary[row.hex] = { char: row.char, versions: [ row.version ]};
		}
	}
	return(summary);	
};
CharsetSummary.prototype.formatData = function(organized) {
	var formatted = [];
	var unicode = Object.keys(organized);
	unicode.sort();
	for (var i=0; i<unicode.length; i++) {
		var code = unicode[i];
		var value = organized[code];
		console.log(code, value);
		var result = [code, value.char];
		for (var j=0; j<value.versions.length; j++) {
			result.push(value.versions[j]);
		}
		formatted.push(result.join(',  '));
	}
	return(formatted);
};
CharsetSummary.prototype.outputData = function(path, data) {
	this.fs.writeFile(path, data, { encoding: 'utf8'}, function(err) {
		if (err) fatalError(err, 'writeData');
		else process.exit(0);
	});
};
CharsetSummary.prototype.fatalError = function(err, source) {
	console.error('FATAL ERROR', err, ' AT ', source);
	process.exit(1);	
};

var summary = new CharsetSummary('.');
summary.readData(function(results) {
	var organized = summary.organizeData(results);
	var formatted = summary.formatData(organized);
	summary.outputData('output.txt', formatted.join('\n'));
	console.log('******', formatted);
	console.log('DONE');
});
