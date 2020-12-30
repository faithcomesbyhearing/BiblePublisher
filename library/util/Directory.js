
var fs = require('fs');
var ensureDirectory = function(fullpath, callback) {
	var path = fullpath.split('/');
	if (path[0] === "") {
		path.shift();
		path[0] = "/" + path[0];
	}
	var dir = path.shift();
	ensureDirPart(dir, path);
	
	function ensureDirPart(dir, path) {
		fs.lstat(dir, function(err, stat) {
			if (err) {
				//console.log('mkdir', dir);
				fs.mkdirSync(dir);
			}
			var next = path.shift();
			if (next) {
				dir = dir + '/' + next;
				ensureDirPart(dir, path);
			} else {
				callback();
			}
		});
	}
};
//ensureDirectory("/Volumes/FCBH/BiblePublisher/ENGWEB/output/xml", function() {
//	ensureDirectory("BobTestDir", function() {
//		console.log("Directory Created.")
//	});
//})
