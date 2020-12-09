/**
* This program executes all validations for a specific version.
* It runs each test, saves the stdout results to a file, and then compares
* the results of each stdout to a previously saved result.  It there is any difference,
* it stops and reports the difference.  Otherwise, it prints the 
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

if (process.argv.length < 6) {
	console.log('Usage: TestFramework.sh  inputDir  dbDir outputDir  bibleId');
	process.exit(1);
}

const programs = ['XMLTokenizerTest', 'USXParserTest', 'HTMLValidator', 'StyleUseValidator', 'VersesValidator', 'TableContentsValidator', 
				'ConcordanceValidator', 'ValidationCleanup', 'IdentityTable'];
//var versions = ['ARBVDPD', 
//	'ERV-ARB', 'ERV-AWA', 'ERV-BEN', 'ERV-BUL', 'ERV-CMN', 'ERV-ENG', 'ERV-HIN', 'ERV-HRV', 'ERV-HUN', 'ERV-IND', 'ERV-KAN', 'ERV-MAR', 'ERV-ORI', 
//	'ERV-NEP','ERV-PAN', 'ERV-POR', 
//	'ERV-RUS', 'ERV-SPA', 'ERV-SRP', 
//	'ERV-TAM', 'ERV-THA', 'ERV-UKR', 'ERV-URD', 'ERV-VIE', 
//	'KJVPD', 'NMV', 'WEB'];

const fs = require('fs');
const child = require('child_process');

//if (process.argv[2] !== 'ALL') {
var versions = [process.argv[2]];
//}
executeNext(-1, 0);

function executeNext(programIndex, versionIndex) {
	if (++programIndex < programs.length) {
		executeOne(programIndex, versionIndex);
	//} else {
	//	programIndex = 0;
	//	if (++versionIndex < versions.length) {
	//		executeOne(programIndex, versionIndex);
	//	}
	//}
}

function executeOne(programIndex, versionIndex) {
	var version = versions[versionIndex];
	var program = programs[programIndex];
	if (version === 'NMV' && program === 'XMLTokenizerTest') {
		var command = './' + program + '.sh ' + version + ' nospace';
	} else {
		command = './' + program + '.sh ' + version;
	}
	console.log(command);
	var options = {maxBuffer:1024*1024*8}; // process killed with no error code if buffer size exceeded
	child.exec(command, options, function(error, stdout, stderr) {
		if (error) {
			errorMessage(command, error);
		}
		const output = 'TEST-STDERR: ' + stderr + '\n' + 'TEST-STDOUT: ' + stdout;
		const outFile = 'output/' + version + '/' + program + '.out';
		fs.writeFile(outFile, output, function(error) {
			if (error) {
				errorMessage(outFile, error);
			}
			if (program === 'VersionDiff') {
				console.log(stdout);
			} else {
				const testFile = 'results/' + version + '/' + program + '.out';
				var command = 'diff ' + testFile + ' ' + outFile;
				child.exec(command, function(error, stdout, stderr) {
					if (stdout && stdout.length > 0) {
						errorOutput('TEST-DIFF STDOUT:', stdout, output);
					}
					if (stderr && stderr.length > 0) {
						errorOutput('TEST-DIFF STDERR:', stderr, output);
					}
					if (error) {
						errorMessage('TEST-DIFF ERROR', error);
					}
					console.log('OK');
					executeNext(programIndex, versionIndex);
				});
			}
		});		
	});
}

function errorMessage(description, error) {
	console.log('ERROR:', description, JSON.stringify(error));
	process.exit(1);
}
function errorOutput(description, diffOut, execOut) {
	console.log(execOut);
	console.log('********************************');
	console.log(description, diffOut);
	process.exit(1);
}


