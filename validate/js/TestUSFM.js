/**
* This program will test a directory of USFM Files and find the presence of
* invalid characters, and it will report the book chapter and verse and character
* position of each invalid character.
*/

var DIRECTORY = '../../DBL/0othersources/cmn-cu89t_usfm/';

readDirectory(DIRECTORY, function(fileList) {
	readFile(0, fileList, function() {
		console.log('DONE');
	});
});

function readDirectory(fullPath, callback) {
	var fs = require('fs');
	fs.readdir(fullPath, function(err, list) {
		if (err) reportError(err, 'readDirectory');
		var results = [];
		for (var i=0; i<list.length; i++) {
			var file = list[i];
			if (list[i].indexOf('.usfm') > -1) {
				results.push(file);
			}
		}
		callback(results);
	});
}
function readFile(index, fileList, callback) {
	if (index < fileList.length) {
		readOneFile(fileList[index], function() {
			readFile(index + 1, fileList, callback);
		});
	} else {
		callback();
	}
}

function readOneFile(file, callback) {
	var book = '';
	var chapter = '0';
	var verse = '0';
	var position = 0;
	//console.log(file);
	var fs = require('fs');
	var fullPath = DIRECTORY + file;
	fs.readFile(fullPath, { encoding: 'utf8'}, function(err, data) {
		if (err) reportError(err, 'readOneFile');
		var lines = data.split('\n');
		for (var i=0; i<lines.length; i++) {
			var line = lines[i];
			if (line.substr(0, 3) === '\\id') {
				book = line.substr(4,3);
				chapter = '0';
				verse = '0';
				position = 0;
				//console.log('BOOK', book);
			}
			else if (line.substr(0, 2) === '\\c') {
				var num = line.substr(3).split(' ');
				chapter = num[0];
				verse = '0';
				position = 0;
			}
			else if (line.substr(0, 2) === '\\v') {
				var num = line.substr(3).split(' ');
				verse = num[0];
				position = 0;
			}
			for (var j=0; j<line.length; j++) {
				var char = line.charCodeAt(j).toString(16);
				if (char.substr(0, 1) === 'e') {
					console.log(book, chapter + ":" + verse, j + 1, char);
				}
			}
		}
		callback();
	});
}

function reportError(err, source) {
	console.log(source, err);
	process.exit(1);
}




