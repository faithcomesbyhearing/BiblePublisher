// USXFileCompare class compares two USX files, usually one is an original file and the other a test generated one.


function TextFileCompare(originalFilename, generatedFilename, testType) {
	const originalFile = openFile(originalFilename);
	const generatedFile = openFile(generatedFilename);
	compare(originalFile, generatedFile, testType);

	function openFile(filePath) {
		var fs = require("fs");
		const data = fs.readFileSync(filePath, {encoding:'utf8', flag:'r'}); 
		const lines = data.split("\n");
		return lines;
	}
	function compare(orginalList, generatedList, testType) {
		const len = Math.max(orginalList.length, generatedList.length);
		for (var i=0; i<len; i++) {
			var original = "";
			var generated = "";
			if (orginalList.length > i) {
				original = orginalList[i];
			}
			if (generatedList.length > i) {
				generated = generatedList[i];
			}
			if (original != generated) {
				var results = [];
				results.push("Line " + i+3);
				results.push("ACT: " + original);
				results.push("GEN: " + generated);
				for (var j=0; j<results.length; j++) {
					console.log(results[j]);
				}
				ValidationAdapter.shared().error('verse', results.join('\n'), function() {});
			}
		}
	}
}


