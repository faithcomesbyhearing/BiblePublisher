// USXFileCompare class compares two USX files, usually one is an original file and the other a test generated one.


function TextFileCompare(originalFilename, generatedFilename, testType) {
	const originalFile = openFile(originalFilename);
	const generatedFile = openFile(generatedFilename);
	compare(originalFile, generatedFile, testType);
	//if (results.length > 0) {
	//	console.log("COMPARE", filename);
	//	for (var i=0; i<results.length; i++) {
	//		console.log(results[i]);
	//		ValidationAdapter.shared().error(filename, results[i]);
	//	}
	//}
	//return results.length / 3;

	function openFile(filePath) {
		var fs = require("fs");
		const data = fs.readFileSync(filePath, {encoding:'utf8', flag:'r'}); 
		const lines = data.split("\n");
		return lines;
	}
	function compare(orginalList, generatedList, testType) {
		var results = [];
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
			//if (testType == "USX") {
			//	original = original.replace(/\"\/\>/g, '" />');  // Hack to fix no space in some empty elements
			//	original = original.replace(/optbreak\/>/g, 'optbreak />'); // Hack to fix no space in optbreak element.
			//	generated = generated.replace(/optbreak\/>/g, 'optbreak />'); // Hack to fix no space in optbreak element.
			//}
			//if (testType == "HTML") {
			//	original = original.replace(/\"\/\>/g, '" />');  // Hack to fix no space in some empty elements
			//	original = original.replace(/<verse eid=\"[A-Z0-9 :-]+\" \/>/g, '');
			//	original = original.replace(/ vid=\"[A-Z0-9 :-]+\"/g, '');
			//	//original = original.replace(/optbreak\/>/g, 'optbreak />'); // Hack to fix no space in optbreak element.
			//}
			if (original != generated) {
				var results = [];
				results.push("Line " + i+3);
				results.push("ACT: " + original);
				results.push("GEN: " + generated);
				console.log("COMPARE", filename);
				for (var i=0; i<results.length; i++) {
					console.log(results[i]);
				}
				ValidationAdapter.shared().error('verse', results.join('\n'));
			}
		}
		//return results
	}
}

//const originalDirectory = "/Volumes/FCBH/usx/2_5/PESNMV";
//const generatedDirectory = "testOutput/PESNMV/usx";
//var count = USXFileCompare(originalDirectory, generatedDirectory, "JHN.usx", "USX");
//console.log(count);

