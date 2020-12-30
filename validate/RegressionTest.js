/**
* This program executes all validations for all versions, or all validations
* for a specific version.
* It runs each test, saves the stdout results to a file, and then compares
* the results of each stdout to a previously save result.  It there is any difference,
* it stops and reports the difference.  Otherwise, it prints a Done message
*
* ROOT_DIR/
*	{filesetId}/
*		source/
*			*.usx
*			metadata.xml
*		{filesetId}.db
*		output/
*			xml
*			usx
*			html
*			chapters.txt
*			verses.txt
*/

/*
* NMV Notes:
* USXParser to get good results, the following manual changes must be done.
* 1. space in empty node sp/> must be removed in Book, Chapter, Para, Verse
* 2. remove 2 chars before usx node, change utf-8 to UTF-8
* HTMLValidator to get good results, the following manual changes must be done
* 1. remove 2 chars before usx node, change utf-8 to UTF-8
* 2. change usx version to 2.5
* 3. change diff to diff -w to accommodate leading spaces in book, chapter, para and verse empty nodes
*/

class RegressionTest {

	constructor(directory, versionId) {
		this.fs = require('fs');
		this.child = require('child_process');
		this.directory = directory;
		this.versions = [];
		if (versionId) {
			this.versions = [versionId];
		} else {
			const tempVersions = this.fs.readdirSync(directory);
			for (var i=0; i<tempVersions.length; i++) {
				if (tempVersions[i][0] != ".") {
					this.versions.push(tempVersions[i]);
				}
			}
		}
		this.programs = ['XMLTokenizerTest', 'USXParserTest', 'HTMLValidator', 
					'VersesValidator', 'StyleUseValidator', 'TableContentsValidator'];
					//'ConcordanceValidator'];
	}
	execute() {
		this.executeNext(-1, 0);
	}
	executeNext(programIndex, versionIndex) {
		if (++programIndex < this.programs.length) {
			this.executeOne(programIndex, versionIndex);
		} else {
			programIndex = 0;
			if (++versionIndex < this.versions.length) {
				this.executeOne(programIndex, versionIndex);
			}
		}
	}
	executeOne(programIndex, versionIndex) {
		var that = this;
		var version = this.versions[versionIndex];
		var program = this.programs[programIndex];
		const command = this.commandLine(program, version);
		//console.log(command);
		var options = {maxBuffer:1024*1024*8}; // process killed with no error code if buffer size exceeded
		this.child.exec(command, options, function(error, stdout, stderr) {
			if (error) {
				that.errorMessage(command, error);
			}
			const output = 'STDERR: ' + stderr + '\n' + 'STDOUT: ' + stdout;
			console.log(output);
			/*
			const outFile = 'output/' + version + '/' + program + '.out';
			that.fs.writeFile(outFile, output, function(error) {
				if (error) {
					that.errorMessage(outFile, error);
				}
				if (program === 'VersionDiff') {
					console.log(stdout);
				} else {
					const testFile = 'results/' + version + '/' + program + '.out';
					var command = 'diff ' + testFile + ' ' + outFile;
					that.child.exec(command, function(error, stdout, stderr) {
						if (stdout && stdout.length > 0) {
							that.errorOutput('TEST-DIFF STDOUT:', stdout, output);
						}
						if (stderr && stderr.length > 0) {
							that.errorOutput('TEST-DIFF STDERR:', stderr, output);
						}
						if (error) {
							that.errorMessage('TEST-DIFF ERROR', error);
						}
						console.log('OK');
						that.executeNext(programIndex, versionIndex);
					});
				}
			});
			*/
			that.executeNext(programIndex, versionIndex);	
		});
	}
	commandLine(program, version) {
		const rootDir = this.directory + "/" + version;
		if (program === "XMLTokenizerTest") {
			return `${program}.sh ${rootDir}/source ${rootDir}/ ${rootDir}/output ${version}`;
		} else if (program === "USXParserTest") {
			return `${program}.sh ${rootDir}/source ${rootDir}/ ${rootDir}/output ${version}`;
		} else if (program === "HTMLValidator") {
			return `${program}.sh ${rootDir}/source ${rootDir}/ ${rootDir}/output ${version}`;
		} else if (program === "StyleUseValidator") {
			return `${program}.sh ${rootDir}/ ${rootDir}/output ${version}`;
		} else if (program === "VersesValidator") {
			return `${program}.sh ${rootDir}/ ${rootDir}/output ${version}`;
		} else if (program === "TableContentsValidator") {
			return `${program}.sh ${rootDir}/ ${version}`;
		} else if (program === "ConcordanceValidator") {
			return `${program}.sh ${rootDir}/ ${rootDir}/output ${version}`;
		} else {
			return `${program}.sh ${rootDir}/source ${rootDir}/ ${rootDir}/output ${version}`;
		}
	}
	errorMessage(description, error) {
		console.log('ERROR:', description, JSON.stringify(error));
		process.exit(1);
	}
	errorOutput(description, diffOut, execOut) {
		console.log(execOut);
		console.log('********************************');
		console.log(description, diffOut);
		process.exit(1);
	}
}

if (process.argv.length < 3 || process.argv.length > 5) {
	console.log("Usage: node RegressionTest.js  root_directory  [bibleId]");
	process.exit(1);
}
const rootDirectory = process.argv[2];
console.log(rootDirectory);
if (process.argv.length > 3) {
	bibleId = process.argv[3];
} else {
	bibleId = null;
}
var test = new RegressionTest(rootDirectory, bibleId);
test.execute();


