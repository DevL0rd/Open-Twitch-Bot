//Authour: DevL0rd
//GitHub: https://github.com/DevL0rd
//Last Update: 5/18/2017
//Version: 0.1.6
var fs = require('fs');
var dirpath = "./"
function load(str) {
	var contents = fs.readFileSync(str).toString('utf-8');
	return JSON.parse(contents)
}
function save(str, obj) {
	var contents = JSON.stringify(obj, null, "\t")
	fs.writeFile(str, contents, function(err) {
		if(err) throw err;
	}); 
}
exports.load = load;
exports.save = save;