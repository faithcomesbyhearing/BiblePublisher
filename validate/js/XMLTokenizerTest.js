/**
* This file is the unit test of XMLTokenizer
*/
var fs = require("fs");

function XMLSerializer(spaceOption) {
	this.result = [];
	this.emptyElementSpace = (spaceOption !== 'nospace');
	Object.seal(this);
}
XMLSerializer.prototype.write = function(nodeType, nodeValue) {
	switch(nodeType) {
		case XMLNodeType.ELE:
			this.result.push('<', nodeValue, '>');
			break;
		case XMLNodeType.ELE_OPEN:
			this.result.push('<', nodeValue);
			break;
		case XMLNodeType.ATTR_NAME:
			this.result.push(' ', nodeValue, '=');
			break;
		case XMLNodeType.ATTR_VALUE:
			this.result.push('"', nodeValue, '"');
			break;
		case XMLNodeType.ELE_END:
			this.result.push('>');
			break;
		case XMLNodeType.WHITESP:
			this.result.push(nodeValue);
			break;
		case XMLNodeType.TEXT:
			this.result.push(nodeValue);
			break;
		case XMLNodeType.ELE_EMPTY:
			if (this.emptyElementSpace) this.result.push(' />');
			else this.result.push('/>');
			break;
		case XMLNodeType.ELE_CLOSE:
			this.result.push('</', nodeValue, '>');
			break;
		case XMLNodeType.PROG_INST:
			if (! this.emptyElementSpace) this.result.push(nodeValue);
			else this.result.push('\uFEFF', nodeValue);
			break;
		case XMLNodeType.END:
			break;
		default:
			throw new Error('The XMLNodeType ' + nodeType + ' is unknown in XMLWriter');
	}
};
XMLSerializer.prototype.close = function() {
	return(this.result.join(''));
};

function testOne(fullPath, outPath, files, index, spaceOption, callback) {
	if (index >= files.length) {
		callback();
	} else {
		var file = files[index];
		symmetricTest(fullPath, outPath, file, spaceOption, function() {
			testOne(fullPath, outPath, files, index + 1, spaceOption, callback);			
		});
	}
}
function symmetricTest(fullPath, outPath, filename, spaceOption, callback) {
	if (filename.substr(0, 1) === '.') {
		callback();
	} else {
		var inFile = fullPath + filename;
		fs.readFile(inFile, { encoding: 'utf8'}, function(err, data) {
			if (err) {
				console.log('READ ERROR', JSON.stringify(err));
				process.exit(1);
			}
			var reader = new XMLTokenizer(data);
			var writer = new XMLSerializer(spaceOption);
			var count = 0;
			var type;
			while (type !== XMLNodeType.END && count < 770000) {
				type = reader.nextToken();
				var value = reader.tokenValue();
				writer.write(type, value);
				count++;
			};
			var result = writer.close();
			var outFile = outPath + '/' + filename;
			fs.writeFile(outFile, result, { encoding: 'utf8'}, function(err) {
				if (err) {
					console.log('WRITE ERROR', JSON.stringify(err));
					process.exit(1);
				}
				console.log('COMPARE ', filename);
				var proc = require('child_process');
				proc.exec('diff ' + inFile + ' ' + outFile, { encoding: 'utf8' }, function(err, stdout, stderr) {
					if (err) {
						console.log('Diff Error', JSON.stringify(err));
					}
					//console.log('STDOUT', stdout);
					//console.log('STDERR', stderr);
					callback();
				});
			});
		});
	}
}
if (process.argv.length < 5) {
	// when optional parameter nospace is used empty elements have no space.
	console.log('Usage: XMLTokenizerTest.sh  inputDir  outputDir  bibleId  [nospace]');
	process.exit(1);
}
var spaceOption = null;
if (process.argv.length > 5) {
	if (process.argv[5] === 'nospace') {
		spaceOption = process.argv[5];
	} else {
		console.log('Usage: XMLTokenizerTest.sh  inputDir  outputDir  bibleId  [nospace]');
		process.exit(1);
	}
}

const outPath = process.argv[3] + "/" + process.argv[4] + "/xml";
ensureDirectory(outPath, function() {
	var fullPath = process.argv[2]
	var files = fs.readdirSync(fullPath);
	testOne(fullPath, outPath, files, 0, spaceOption, function() {
		console.log('XMLTokenizerTest DONE');
	});
});


