

var fs = require("fs");

function testOne(fullPath, outPath, files, index, callback) {
	if (index >= files.length) {
		callback();
	} else {
		var file = files[index];
		symmetricTest(fullPath, outPath, file, function() {
			testOne(fullPath, outPath, files, index + 1, callback);			
		});
	}
}
function symmetricTest(fullPath, outPath, filename, callback) {
	if (filename.substr(0, 1) === '.') {
		callback();
	} else {
		var bookCode = filename.substring(0, 3);
		console.log(bookCode, filename);
		var inFile = fullPath + filename;
		fs.readFile(inFile, { encoding: 'utf8'}, function(err, data) {
			if (err) {
				console.log('READ ERROR', JSON.stringify(err));
				process.exit(1);
			}
			var rootNode = parser.readBook(data);
			var outFile = outPath + '/' + filename;
			fs.writeFile(outFile, rootNode.toUSX(), { encoding: 'utf8'}, function(err) {
				if (err) {
					console.log('WRITE ERROR', JSON.stringify(err));
					process.exit(1);
				}
				var proc = require('child_process');
				proc.exec('diff ' + inFile + ' ' + outFile, { encoding: 'utf8' }, function(err, stdout, stderr) {
					//if (err) {
					//	console.log('Diff Error', JSON.stringify(err));
					//}
					console.log('DIFF', stdout);
					console.log('ERR', stderr);
					callback();
				});
			});
		});
	}
}

if (process.argv.length < 5) {
	console.log('Usage: USXParserTest.sh  inputDir  outputDir  bibleId');
	process.exit(1);
}
var parser = new USXParser();
const outPath = 'output/' + process.argv[4] + '/usx';
ensureDirectory(outPath, function() {
	var fullPath = process.argv[2]
	var files = fs.readdirSync(fullPath);
	testOne(fullPath, outPath, files, 0, function() {
		console.log('USXParserTest DONE');
	});
});