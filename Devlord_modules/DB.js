//Authour: Dustin Harris
//GitHub: https://github.com/DevL0rd
//Last Update: 3/17/2018
//Version: 1.0.1
var fs = require('fs');
var mkdirp = require('mkdirp');
var getDirName = require('path').dirname;

function load(path) {
	var contents = fs.readFileSync(path).toString('utf-8');
	return JSON.parse(contents)
}

function save(path, obj) {
	var contents = JSON.stringify(obj, null, "\t")
	mkdirp(getDirName(path), function (err) {
		if (err) throw err;
		fs.writeFile(path, contents, function (err) {
			if (err) throw err;
		});
	});

}
exports.load = load;
exports.save = save;