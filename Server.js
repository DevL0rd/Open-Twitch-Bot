//Authour: DevL0rd
//GitHub: https://github.com/DevL0rd
//Last Update: 8/22/2017
//Version: 1

//Include Libs
var url = require('url');
var os = require('os');
var fs = require('fs');
var http = require('http');
var crypto = require('crypto');
var Engine = require('./Engine');
var DB = require('./Devlord_modules/DB.js');

//
//Include DevLord Libs.
//
var Logging = require('./Devlord_modules/Logging.js');
Logging.setNamespace('Console')
Logging.setConsoleLogging(false)

//Startup
Logging.log("Starting Up...");
//Load DBS
if (fs.existsSync("./Server.json")) {
    var settings = DB.load("./Server.json")
} else {
    var settings = {
        IP: "0.0.0.0",
        PORT: 80,
        HTTP_TIMEOUT_MS: 5000
    }
    DB.save("./Server.json", settings)
}

var server = http.createServer(Http_Handler)
var io = require('socket.io')(server);
server.timeout = settings.HTTP_TIMEOUT_MS;
//startServer
Logging.log("Starting server at '" + settings.IP + ":" + settings.PORT + "'...", false, "HTTP");
server.listen(settings.PORT, settings.IP);
io.generate_key = function() {
    var sha = crypto.createHash('sha256');
    sha.update(Math.random().toString());
    return sha.digest('hex');
}
Engine.init(io)

function Http_Handler(request, response) {
    // Parse the request containing file name
    var pathname = url.parse(request.url).pathname;
    if (pathname.substr(1) == "") {
        pathname = pathname + "/index.html";
    }
    var extension = pathname.substr(1).split('.').pop();

    var FileFound = false;
    if (fs.existsSync('WebRoot/' + pathname.substr(1))) {
        FileFound = true
    }
    if (FileFound) {
        // Read the requested file content from file system
        fs.readFile('WebRoot/' + pathname.substr(1), function(err, data) {
            if (extension == "html" || extension == "htm" || extension == "js" || extension == "json") {
                response.writeHead(200, {
                    'Content-Type': 'text/html',
                    'Content-Length': data.length,
                    'Accept-Ranges': 'bytes'
                });
                response.end(data.toString());
            } else if (extension == "dat" || extension == "ts") {
                response.writeHead(200, {
                    'Content-Type': 'text/html',
                    'Content-Length': data.length,
                    'Accept-Ranges': 'bytes',
                    'Cache-Control': 'no-cache'
                });
                response.end(data.toString());
            } else if (extension == "css") {
                response.writeHead(200, {
                    'Content-Type': 'text/css',
                    'Content-Length': data.length,
                    'Accept-Ranges': 'bytes',
                    'Cache-Control': 'no-cache'
                });
                response.end(data.toString());
            } else if (extension == "png") {
                response.writeHead(200, {
                    'Content-Type': 'image/png',
                    'Content-Length': data.length,
                    'Accept-Ranges': 'bytes'
                });
                response.end(data, 'binary');
            } else if (extension == "jpg") {
                response.writeHead(200, {
                    'Content-Type': 'image/jpg',
                    'Content-Length': data.length,
                    'Accept-Ranges': 'bytes'
                });
                response.end(data, 'binary');
            } else if (extension == "gif") {
                response.writeHead(200, {
                    'Content-Type': 'image/gif',
                    'Content-Length': data.length,
                    'Accept-Ranges': 'bytes'
                });
                response.end(data, 'binary');
            } else if (extension == "mp3") {
                response.writeHead(200, {
                    'Content-Type': 'audio/mp3',
                    'Content-Length': data.length,
                    'Accept-Ranges': 'bytes'
                });
                response.end(data, 'binary');
            } else if (extension == "ico") {
                response.writeHead(200, {
                    'Content-Type': 'image/ico',
                    'Content-Length': data.length,
                    'Accept-Ranges': 'bytes'
                })
                response.end(data, 'binary');
            } else if (extension == "exe") {
                response.writeHead(200, {
                    'Content-Type': 'application/x-msdownload',
                    'Content-Length': data.length,
                    'Accept-Ranges': 'bytes',
                    'Cache-Control': 'no-cache'
                });
                response.end(data);
            } else if (extension == "ttf") {
                response.writeHead(200, {
                    'Content-Type': 'application/octet-stream',
                    'Content-Length': data.length,
                    'Accept-Ranges': 'bytes',
                    'Cache-Control': 'no-cache'
                });
                response.end(data, 'binary');
            }
        });
    } else {
        Logging.log("File requested (" + pathname.substr(1) + ") does not exist!", true, "HTTP");
        response.writeHead(404, {
            'Content-Type': 'text/html'
        });
        response.end("File (" + 'WebRoot/' + pathname.substr(1) + ") does not exist!");
    };

}
server.on('error', function(err) {
    Logging.log(err, true, "HTTP");
});
server.on('uncaughtException', function(err) {
    Logging.log(err, true, "HTTP");
});
io.on('error', function(err) {
    Logging.log(err, true, "IO");
});
io.on('uncaughtException', function(err) {
    Logging.log(err, true, "IO");
});