

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
	if (filename.substr(0, 1) === '.' || !filename.toLowerCase().endsWith(".usx")) {
		callback();
	} else {
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
				const errorCount = USXFileCompare(fullPath, outPath, filename, "USX");
				callback(errorCount);
			});
		});
	}
}

if (process.argv.length < 6) {
	console.log('Usage: USXParserTest.sh  inputDir  dbDir  outputDir  bibleId');
	process.exit(1);
}
const bibleId = process.argv[5];
console.log(bibleId, "USXParserTest START");
const dbDir = process.argv[3];
ValidationAdapter.shared().open(bibleId, dbDir, "USXParserTest");
var parser = new USXParser();
const outPath = process.argv[4] + "/" + bibleId + "/usx";
ensureDirectory(outPath, function() {
	var fullPath = process.argv[2]
	if (!fullPath.endsWith("/")) {
		fullPath += "/"
	}
	var files = fs.readdirSync(fullPath);
	testOne(fullPath, outPath, files, 0, function() {
		ValidationAdapter.shared().close();
		console.log(bibleId, 'USXParserTest DONE');
	});
});

