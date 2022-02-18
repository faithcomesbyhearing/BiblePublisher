/**
* Main Calling program for Publisher.js
*/

function PublisherMain() {
}

PublisherMain.prototype.process = function(inputDir, outputDir, bibleId, iso3, iso1, direction) {
	var types = new AssetType(inputDir, bibleId);
	types.chapterFiles = true;
	types.tableContents = true;
	types.concordance = true;
	types.styleIndex = true;
	types.statistics = true;
	var database = new DeviceDatabase(outputDir + bibleId + '.db');
	var pubVersion = new PubVersion(iso3, iso1, direction);
	var builder = new AssetBuilder(types, database, pubVersion);
	builder.build(function(err) {
		if (err instanceof IOError) {
			console.log('FAILED', JSON.stringify(err));
			process.exit(1);
		} else {
			console.log('Success, Bible created');
			var htmlPageBuilder = new HTMLPageBuilder(bibleId, outputDir, database);
			htmlPageBuilder.process();
		}
	});
};

function usageMessage() {
	console.log('USAGE: node Publisher.js inputDir outputDir bibleId iso3 iso1 direction');
	process.exit(1);	
}
	
if (process.argv.length < 8) {
	console.log("ERROR: Not all parameters are included.");
	usageMessage();
}
const fs = require('fs');
var inputDir = process.argv[2];
if (!fs.existsSync(inputDir)) {
	console.log("ERROR: Input directory '%s' must exist.", inputDir);
	usageMessage();
}
const files = fs.readdirSync(inputDir);
var usxCount = 0
files.forEach(file => {
    if (file.endsWith(".usx") || file.endsWith(".USX")) {
    	usxCount += 1
    } else if (!file.startsWith(".")) {
    	console.log("INFO: Cannot process file %s.", file);
    }
});
if (usxCount == 0) {
    console.log("ERROR: There are no .usx files in inputDir '%s'.", inputDir);
    usageMessage();
}
if (!inputDir.endsWith("/")) {
	inputDir += "/";
}
var outputDir = process.argv[3];
if (!fs.existsSync(outputDir)) {
	console.log("ERROR: Output directory '%s' must exist.", outputDir);
	usageMessage();
}
if (!outputDir.endsWith("/")) {
	outputDir += "/";
}
const bibleId = process.argv[4];
if (bibleId.length < 4) {
	console.log("ERROR: Bibleid '%s' must be at least 4 characters.", bibleId);
	usageMessage();
}
const iso3 = process.argv[5].toLowerCase();
if (iso3.length != 3) {
	console.log("ERROR: iso3 code '%s' must be 3 characters long.", iso3);
	usageMessage();
}
const iso1 = process.argv[6].toLowerCase();
if (iso1.length != 2 && iso1 != "null") {
	console.log("ERROR: iso1 code '%s' must be 2 characters long or is must be null.", iso1);
	usageMessage();
}
const direction = process.argv[7].toLowerCase();
if (direction != "ltr" && direction != "rtl") {
	console.log("ERROR: direction '%s' must be ltr or rtl.", direction);
	usageMessage();
}

var publisher = new PublisherMain()
publisher.process(inputDir, outputDir, bibleId, iso3, iso1, direction)

//var metadata = new DBLMetaData();
//metadata.parse("/Volumes/FCBH/files/validate/text/PESNMV/PESNMV/");
//metadata.parse("/Volumes/FCBH/files/validate/text/HOCIEM/HOCIEM/");
//console.log("done");
//console.log(metadata);

