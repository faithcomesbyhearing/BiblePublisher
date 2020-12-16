// USXFileCompare class compares two USX files, usually one is an original file and the other a test generated one.


function USXFileCompare(originalDir, generatedDir, filename, testType) {
	const originalFile = openFile(originalDir + "/" + filename);
	const generatedFile = openFile(generatedDir + "/" + filename);
	const results = compare(originalFile, generatedFile, testType);
	if (results.length > 0) {
		console.log("COMPARE", filename);
		for (var i=0; i<results.length; i++) {
			console.log(results[i]);
		}
	}
	return results.length / 3;

	function openFile(filePath) {
		var fs = require("fs");
		const data = fs.readFileSync(filePath, {encoding:'utf8', flag:'r'}); 
		const lines = data.split("\n");
		var results = [];
		for (var i=0; i<lines.length; i++) {
			const line = lines[i].trim();
			if (!line.includes("<?xml ") && line.length > 0) {
				results.push(line);
			}
		}
		return results;
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
			if (testType == "USX") {
				original = original.replace(/\"\/\>/g, '" />');  // Hack to fix no space in some empty elements
				original = original.replace(/optbreak\/>/g, 'optbreak />'); // Hack to fix no space in optbreak element.
				generated = generated.replace(/optbreak\/>/g, 'optbreak />'); // Hack to fix no space in optbreak element.
			}
			if (testType == "HTML") {
				original = original.replace(/\"\/\>/g, '" />');  // Hack to fix no space in some empty elements
				original = original.replace(/<verse eid=\"[A-Z0-9 :-]+\" \/>/g, '');
				original = original.replace(/ vid=\"[A-Z0-9 :-]+\"/g, '');
				//original = original.replace(/optbreak\/>/g, 'optbreak />'); // Hack to fix no space in optbreak element.
			}
			if (original != generated) {
				results.push("Line " + i+3);
				results.push("ACT: " + original);
				results.push("GEN: " + generated);
			}
		}
		return results
	}
}

//const originalDirectory = "/Volumes/FCBH/usx/2_5/PESNMV";
//const generatedDirectory = "testOutput/PESNMV/usx";
//var count = USXFileCompare(originalDirectory, generatedDirectory, "JHN.usx", "USX");
//console.log(count);

