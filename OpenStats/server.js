//Authour: DevL0rd
//GitHub: https://github.com/DevL0rd
//Last Update: 5/18/2017
//Version: 0.1.6
//
//
var Port = 8080
//Include Libs
var http = require('http');
var fs = require('fs');
var url = require('url');
var os = require('os');
var cluster = require('cluster');
var crypto = require('crypto');
//Include DevLord Libs.
//*********************
var DB = require('./Devlord_modules/DB.js');
var SimplePerfMon = require('./Devlord_modules/SimplePerfMon.js');
var SQL_DB = require('./Devlord_modules/SQL.js');
var Logging = require('./Devlord_modules/Logging.js');
Logging.setConsoleLogging(true)
Logging.setNamespace("Server")
Logging.log("Starting Server...")

//Include 3RD Party Libs.
//*********************
var generate_key = function () {
    var sha = crypto.createHash('sha256');
    sha.update(Math.random().toString());
    return sha.digest('hex');
};

var serverip = "0.0.0.0"
// Create a server
var server = http.createServer(function (request, response) {
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
        fs.readFile('WebRoot/' + pathname.substr(1), function (err, data) {
            if (extension == "html" || extension == "htm" || extension == "js") {
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
            } else if (extension == "gif") {
                response.writeHead(200, {
                    'Content-Type': 'image/gif',
                    'Content-Length': data.length,
                    'Accept-Ranges': 'bytes'
                });
                response.end(data, 'binary');
            } else if (extension == "bmp") {
                response.writeHead(200, {
                    'Content-Type': 'image/bmp',
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
            }
        });
    } else {
        Logging.log("File requested (" + pathname.substr(1) + ") does not exist!", true);
        response.writeHead(404, {
            'Content-Type': 'text/html'
        });
        response.end("File (" + 'WebRoot/' + pathname.substr(1) + ") does not exist!");
    };

});
server.on('error', function (err) {
    Logging.log(err, true);
});
server.on('uncaughtException', function (err) {
    Logging.log(err, true);
});

function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
if (!fs.existsSync('Groups.json')) {
    var groupsObj = [
        {
            "name": "All Groups",
            "pages": [
                {
                    "name": "All Panels",
                    "items": [
                        {
                            "title": "CPU",
                            "type": "pie",
                            "width": 2,
                            "height": 2,
                            "dataSet": "cpu",
                            "data": [],
                            "filteredData": [],
                            "ts": "",
                            "error": " ",
                            "options": {
                                "legend": {
                                    "position": "right",
                                    "alignment": "center"
                                },
                                "colors": ["#5bea2c", "gray"],
                                "is3D": true
                            }
                        },
                        {
                            "title": "RAM",
                            "type": "pie",
                            "width": 2,
                            "height": 2,
                            "dataSet": "ram",
                            "data": [],
                            "filteredData": [],
                            "ts": "",
                            "error": " ",
                            "options": {
                                "legend": {
                                    "position": "right",
                                    "alignment": "center"
                                },
                                "colors": ["#ef7b02", "gray"],
                                "is3D": true
                            }
                        },
                        {
                            "title": "Server Monitor",
                            "type": "combochart",
                            "width": 3,
                            "height": 2,
                            "dataSet": "Server_Perf",
                            "data": [],
                            "filteredData": [],
                            "ts": "",
                            "error": " ",
                            "options": {
                                "animation": {
                                    "duration": 200,
                                    "easing": "out"
                                },
                                "lineWidth": 5,
                                "pointSize": 8,
                                "seriesType": "lines",
                                "colors": ["#00840b", "#00840b", "#00840b", "#00840b", "#00840b", "#00840b", "#00840b", "#00840b", "#ef7b02", "#5bea2c"],
                                "vAxes": {
                                    "0": {
                                        "viewWindowMode": "explicit",
                                        "viewWindow": {
                                            "max": 100,
                                            "min": 0
                                        },
                                        "format": "###%"
                                    },
                                    "1": {
                                        "viewWindowMode": "explicit",
                                        "viewWindow": {
                                            "max": 16000,
                                            "min": 0
                                        },
                                        "format": "###### MB"
                                    }
                                },
                                "series": {
                                    "8": {
                                        "type": "lines",
                                        "targetAxisIndex": 1
                                    },
                                    "9": {
                                        "type": "lines",
                                        "targetAxisIndex": 0
                                    }
                                },
                                "legend": "none"

                            }
                        }
                    ]
                }
            ]
        }
    ]

    fs.writeFile('Groups.json', JSON.stringify(groupsObj), function (err) {
        if (err) return Logging.log(err, true);
    });
}

function isDefined(x) {
    var undefined;
}

var io = require('socket.io').listen(server);
try {
    server.listen(Port, serverip);
    io.serveClient(true);
    io.attach(server);


} catch (err) {
    Logging.log(err, true, "IO");
}

function getSockets(roomId, namespace) {
    var res = []
        // the default namespace is "/"
        ,
        ns = io.of(namespace || "/");

    if (ns) {
        for (var id in ns.connected) {
            if (roomId) {
                var index = ns.connected[id].rooms.indexOf(roomId);
                if (index !== -1) {
                    res.push(ns.connected[id]);
                }
            } else {
                res.push(ns.connected[id]);
            }
        }
    }
    return res;
}
io.UserCount = 0;
var userCountTimeOutID
io.Connections = 0
io.on("connect", function (socket) {
    io.UserCount++
        io.Connections++
        Logging.log("Socket(" + io.Connections + ") Connected!", false, "IO")
    clearTimeout(userCountTimeOutID)
    userCountTimeOutID = setTimeout(function () {
        Logging.log("User Count: " + io.UserCount, false, "IO")

    }, 2000)
    socket.ip = io.Connections
    socket.isTV = false
    socket.pairingKey = generate_key()
    socket.pairedDeviceKey = ""
    socket.tvName = ""
    socket.connectID = io.Connections
    socket.on("updateTable", function (tableInfo) {
        if (SQL_DB.tableExists(tableInfo.name)) {
            var newtable = SQL_DB.GetTableClone(tableInfo.name)
            if (newtable != null) {

                if (newtable.data[tableInfo.timeRange] != null) {
                    var newtable = SQL_DB.GetTableClone(tableInfo.name)
                    socket.emit('updateTable', {
                        name: newtable.name,
                        data: newtable.data[tableInfo.timeRange].data,
                        error: newtable.data[tableInfo.timeRange].error,
                        ts: newtable.data[tableInfo.timeRange].ts
                    });
                } else if (newtable.data["None"] != null) {
                    socket.emit('updateTable', {
                        name: newtable.name,
                        data: newtable.data["None"].data,
                        error: newtable.data["None"].error,
                        ts: newtable.data["None"].ts
                    });
                } else {
                    SQL_DB.AddTimeRange(tableInfo.name, tableInfo.timeRange)
                }

            } else {
                Logging.log("Table requested, '" + tableInfo.name + "', does not exists: " + io.UserCount, true, "IO")
            }
        }
    })
    socket.on('updateGroups', function () {
        if (fs.existsSync("Groups.json")) {


            fs.readFile('Groups.json', 'utf8', function (err, groupData) {
                if (err) {
                    //Log errors
                    Logging.log(err, true);
                } else {
                    try {
                        socket.emit('updateGroups', JSON.parse(groupData));
                    } catch (err) {
                        Logging.log(err, true);
                    }

                }
            })
        }

    })
    socket.on('twitchName', function (twitchName) {

        Logging.log(socket.request.connection.remoteAddress + " is " + twitchName, false, "IO")


    })

    socket.on("disconnect", function (name) {
        io.UserCount--
            socket.isTV = false
        Logging.log("Socket(" + socket.connectID + ") Disconnected.", false, "IO")
        clearTimeout(userCountTimeOutID)
        userCountTimeOutID = setTimeout(function () {
            Logging.log("User Count: " + io.UserCount, false, "IO")
        }, 2000)
        var clients = getSockets();
        for (i = 0; i < clients.length; i++) {
            if (clients[i].pairingKey == socket.pairedDeviceKey) {
                clients[i].emit("unpair", {})
                socket.pairedDeviceKey = ""
                clients[i].pairedDeviceKey = ""
                break;
            }
        }
        socket.pairedDeviceKey = ""
    })
    socket.on("tvModeEnabled", function (nTVName) {
        socket.isTV = true
        socket.tvName = nTVName
        Logging.log("TV '" + socket.tvName + "' enabled.", false, "IO")
    })
    socket.on("tvModeDisabled", function () {
        socket.isTV = false
        Logging.log("TV '" + socket.tvName + "' disabled.", false, "IO")
    })
    socket.on("getTVs", function () {
        var clients = getSockets();
        var TVlist = [{
            k: "Un-Paired",
            v: "unpair"
        }]
        for (i = 0; i < clients.length; i++) {
            if (clients[i].isTV && clients[i].pairedDeviceKey == "") {
                TVlist.push({
                    k: clients[i].tvName,
                    v: clients[i].pairingKey
                })
            }
        }
        socket.emit('getTVs', TVlist)
    })
    socket.on("pairTV", function (tvKey) {
        var clients = getSockets();
        var TVlist = ["Un-Paired"]
        for (i = 0; i < clients.length; i++) {
            if (clients[i].pairingKey == tvKey) {
                socket.pairedDeviceKey = clients[i].pairingKey
                clients[i].pairedDeviceKey = socket.pairingKey
                clients[i].emit('pairTV', {})
                Logging.log("Socket(" + socket.connectID + ") paired with TV '" + clients[i].tvName + "'", false, "IO")
                break;
            }
        }
    })
    socket.on("tvPaired", function (params) {
        var clients = getSockets();
        for (i = 0; i < clients.length; i++) {
            if (clients[i].pairingKey == socket.pairedDeviceKey) {
                clients[i].emit('cloneToTV', {
                    cmd: 'changeGroup',
                    params: params.group
                })
                clients[i].emit('cloneToTV', {
                    cmd: 'changePage',
                    params: params.page
                })
                clients[i].emit('cloneToTV', {
                    cmd: 'changeGlobalTimerange',
                    params: params.timeRange
                })
                break;
            }
        }
    })
    socket.on("unPair", function () {
        var clients = getSockets();
        for (i = 0; i < clients.length; i++) {
            if (socket.pairedDeviceKey == clients[i].pairingKey) {
                clients[i].emit("unpair", {})
                Logging.log("Socket(" + socket.connectID + ") un-paired with TV '" + clients[i].tvName + "'", false, "IO")
                socket.pairedDeviceKey = ""
                clients[i].pairedDeviceKey = ""
                break;
            }
        }
    })
    socket.on("cloneToTV", function (Srequest) {
        var clients = getSockets();
        var TVlist = ["Un-Paired"]
        for (i = 0; i < clients.length; i++) {
            if (clients[i].pairingKey == Srequest.token && socket.pairedDeviceKey == clients[i].pairingKey) {
                clients[i].emit("cloneToTV", Srequest)
                break;
            }
        }
    })
    //AddTable(name, query, callback = function (err, rowCount, rows) { })
})

var lastIndexTs = 0
fs.readFile('WebRoot/index.ts', 'utf8', function (err, ts) {
    if (err) {
        //Log errors
        Logging.log(err, true);
    } else {
        lastIndexTs = ts
        setInterval(function () {
            fs.readFile('WebRoot/index.ts', 'utf8', function (err, ts) {
                if (err) {
                    //Log errors
                    Logging.log(err, true);
                } else {
                    if (ts != lastIndexTs) {
                        lastIndexTs = ts
                        Logging.log("Forcing clients to refresh...")
                        io.emit("forceRefresh", {})
                    }
                }
            })
        }, 5000)
    }
})

// Create connection to database
var SQLConfig = {
    userName: '',
    password: '',
    server: '',
    options: {
        requestTimeout: 60000,
        database: 'MyIT'
    }
}
SQL_DB.AddTable("ram", "", function (table, timeRange, err, rowCount, rows) {})
SQL_DB.AddTimeRange("ram", "None")
SQL_DB.AddTable("cpu", "", function (table, timeRange, err, rowCount, rows) {})
SQL_DB.AddTimeRange("cpu", "None")
SQL_DB.AddTable("Server_Perf", "", function (table, timeRange, err, rowCount, rows) {})
SQL_DB.AddTimeRange("Server_Perf", "None")

//SQL_DB.OnTableUpdateComplete(function () {
//    SQL_DB.Export("Export.json")
//})
//SQL_DB.Connect(SQLConfig);

Date.prototype.addDays = function (days) {
    var dat = new Date(this.valueOf());
    dat.setDate(dat.getDate() + days);
    return dat;
}

function round(value, decimals) {
    //This rounds a decimal by the specified number of decmial places
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
};

function D_hhmmss(decimalDays) {
    var endtimeSeconds = parseFloat(decimalDays);
    endtimeSeconds = endtimeSeconds * 24 * 60 * 60;
    var hours = Math.floor((endtimeSeconds / (60 * 60)));
    endtimeSeconds = endtimeSeconds - (hours * 60 * 60);
    var minutes = Math.floor((endtimeSeconds / 60));
    endtimeSeconds = endtimeSeconds - (minutes * 60);
    var seconds = Math.round(endtimeSeconds);
    if (hours < 10) {
        hours = "0" + hours;
    }
    if (minutes < 10) {
        minutes = "0" + minutes;

    }
    if (seconds < 10) {
        seconds = "0" + seconds;
    }
    return hours + ":" + minutes + ":" + seconds
}

function formatDate(date, format, utc) {
    var MMMM = ["\x00", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var MMM = ["\x01", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var dddd = ["\x02", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var ddd = ["\x03", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    function ii(i, len) {
        var s = i + "";
        len = len || 2;
        while (s.length < len) s = "0" + s;
        return s;
    }

    var y = utc ? date.getUTCFullYear() : date.getFullYear();
    format = format.replace(/(^|[^\\])yyyy+/g, "$1" + y);
    format = format.replace(/(^|[^\\])yy/g, "$1" + y.toString().substr(2, 2));
    format = format.replace(/(^|[^\\])y/g, "$1" + y);

    var M = (utc ? date.getUTCMonth() : date.getMonth()) + 1;
    format = format.replace(/(^|[^\\])MMMM+/g, "$1" + MMMM[0]);
    format = format.replace(/(^|[^\\])MMM/g, "$1" + MMM[0]);
    format = format.replace(/(^|[^\\])MM/g, "$1" + ii(M));
    format = format.replace(/(^|[^\\])M/g, "$1" + M);

    var d = utc ? date.getUTCDate() : date.getDate();
    format = format.replace(/(^|[^\\])dddd+/g, "$1" + dddd[0]);
    format = format.replace(/(^|[^\\])ddd/g, "$1" + ddd[0]);
    format = format.replace(/(^|[^\\])dd/g, "$1" + ii(d));
    format = format.replace(/(^|[^\\])d/g, "$1" + d);

    var H = utc ? date.getUTCHours() : date.getHours();
    format = format.replace(/(^|[^\\])HH+/g, "$1" + ii(H));
    format = format.replace(/(^|[^\\])H/g, "$1" + H);

    var h = H > 12 ? H - 12 : H == 0 ? 12 : H;
    format = format.replace(/(^|[^\\])hh+/g, "$1" + ii(h));
    format = format.replace(/(^|[^\\])h/g, "$1" + h);

    var m = utc ? date.getUTCMinutes() : date.getMinutes();
    format = format.replace(/(^|[^\\])mm+/g, "$1" + ii(m));
    format = format.replace(/(^|[^\\])m/g, "$1" + m);

    var s = utc ? date.getUTCSeconds() : date.getSeconds();
    format = format.replace(/(^|[^\\])ss+/g, "$1" + ii(s));
    format = format.replace(/(^|[^\\])s/g, "$1" + s);

    var f = utc ? date.getUTCMilliseconds() : date.getMilliseconds();
    format = format.replace(/(^|[^\\])fff+/g, "$1" + ii(f, 3));
    f = Math.round(f / 10);
    format = format.replace(/(^|[^\\])ff/g, "$1" + ii(f));
    f = Math.round(f / 10);
    format = format.replace(/(^|[^\\])f/g, "$1" + f);

    var T = H < 12 ? "AM" : "PM";
    format = format.replace(/(^|[^\\])TT+/g, "$1" + T);
    format = format.replace(/(^|[^\\])T/g, "$1" + T.charAt(0));

    var t = T.toLowerCase();
    format = format.replace(/(^|[^\\])tt+/g, "$1" + t);
    format = format.replace(/(^|[^\\])t/g, "$1" + t.charAt(0));

    var tz = -date.getTimezoneOffset();
    var K = utc || !tz ? "Z" : tz > 0 ? "+" : "-";
    if (!utc) {
        tz = Math.abs(tz);
        var tzHrs = Math.floor(tz / 60);
        var tzMin = tz % 60;
        K += ii(tzHrs) + ":" + ii(tzMin);
    }
    format = format.replace(/(^|[^\\])K/g, "$1" + K);

    var day = (utc ? date.getUTCDay() : date.getDay()) + 1;
    format = format.replace(new RegExp(dddd[0], "g"), dddd[day]);
    format = format.replace(new RegExp(ddd[0], "g"), ddd[day]);

    format = format.replace(new RegExp(MMMM[0], "g"), MMMM[M]);
    format = format.replace(new RegExp(MMM[0], "g"), MMM[M]);

    format = format.replace(/\\(.)/g, "$1");

    return format;
};


process.stdin.resume();

function exitHandler() {
    CMS.Stop();
    process.exit();
}
//process.on('exit', exitHandler);

var monTick = 0
SimplePerfMon.Start(31, function () {
    var newData = []
    var newDatatitle = []
    newDatatitle.push("index")
    for (Ci = 1; Ci < SimplePerfMon.Cpu.Count + 1; Ci++) {
        newDatatitle.push("CPU " + Ci)
    }
    newDatatitle.push("RAM")
    newDatatitle.push("CPU Total")
    newData.push(newDatatitle)
    for (i = 0; i < SimplePerfMon.Cpu.UsageHistory[0].length; i++) {
        var newRow = [i]
        for (Ci = 1; Ci < SimplePerfMon.Cpu.Count + 1; Ci++) {
            newRow.push(SimplePerfMon.Cpu.UsageHistory[Ci][i])
        }
        newRow.push(SimplePerfMon.Memory.UsageHistory[i] / 1000000)
        newRow.push(SimplePerfMon.Cpu.UsageHistory[0][i])
        newData.push(newRow)
    }
    var ts = new Date();

    SQL_DB.GetTable("Server_Perf").data["None"].error = ""
    SQL_DB.GetTable("Server_Perf").data["None"].ts = formatDate(ts, "hh:mm:ss MMM dd", false)
    SQL_DB.GetTable("Server_Perf").data["None"].data = clone(newData)

    newData = [["key", "val"], ["Usage", SimplePerfMon.Cpu.Usage(0)], ["Idle", 100 - SimplePerfMon.Cpu.Usage(0)]]
    SQL_DB.GetTable("cpu").data["None"].error = ""
    SQL_DB.GetTable("cpu").data["None"].ts = formatDate(ts, "hh:mm:ss MMM dd", false)
    SQL_DB.GetTable("cpu").data["None"].data = clone(newData)

    newData = [["key", "val"], ["Usage", SimplePerfMon.Memory.Usage("MB")], ["Avail", 16000]]
    SQL_DB.GetTable("ram").data["None"].error = ""
    SQL_DB.GetTable("ram").data["None"].ts = formatDate(ts, "hh:mm:ss MMM dd", false)
    SQL_DB.GetTable("ram").data["None"].data = clone(newData)

    monTick++
    if (monTick > 0) {
        io.emit('tableUpdated', {
            name: "Server_Perf",
            timeRange: "None"
        });
        io.emit('tableUpdated', {
            name: "cpu",
            timeRange: "None"
        });
        io.emit('tableUpdated', {
            name: "ram",
            timeRange: "None"
        });
        monTick = 0
    }
})
Object.size = function (obj) {
    var size = 0,
        key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};



//Add custom content here

SQL_DB.AddTable("Command_use", "", function (table, timeRange, err, rowCount, rows) {})
SQL_DB.AddTimeRange("Command_use", "None")
SQL_DB.AddTable("Command_use_pie", "", function (table, timeRange, err, rowCount, rows) {})
SQL_DB.AddTimeRange("Command_use_pie", "None")
SQL_DB.AddTable("SongRequests", "", function (table, timeRange, err, rowCount, rows) {})
SQL_DB.AddTimeRange("SongRequests", "None")
SQL_DB.AddTable("Viewers", "", function (table, timeRange, err, rowCount, rows) {})
SQL_DB.AddTimeRange("Viewers", "None")
SQL_DB.AddTable("Viewers_pie", "", function (table, timeRange, err, rowCount, rows) {})
SQL_DB.AddTimeRange("Viewers_pie", "None")
SQL_DB.AddTable("PlayList", "", function (table, timeRange, err, rowCount, rows) {})
SQL_DB.AddTimeRange("PlayList", "None")
var PlaylistOld = " "
var statsOld = " "
var ViewersOld = " "
setInterval(function () {
    try {
        var stats = DB.load("../Engine/DB/statsDB.json");
        var statsstr = JSON.stringify(stats)
        if (statsOld != statsstr) {
            statsOld = statsstr
            var ts = new Date();
            if (stats.commandUsage != null) {
                var newData = [["Command", "Times Used", {
                    role: 'annotation'
                }]]
                for (var i in stats.commandUsage) {
                    newData.push([i, stats.commandUsage[i], stats.commandUsage[i]])
                }
                SQL_DB.GetTable("Command_use").data["None"].error = ""
                SQL_DB.GetTable("Command_use").data["None"].ts = formatDate(ts, "hh:mm:ss MMM dd", false)
                SQL_DB.GetTable("Command_use").data["None"].data = clone(newData)
                io.emit('tableUpdated', {
                    name: "Command_use",
                    timeRange: "None"
                });
                SQL_DB.GetTable("Command_use_pie").data["None"].error = ""
                SQL_DB.GetTable("Command_use_pie").data["None"].ts = formatDate(ts, "hh:mm:ss MMM dd", false)
                SQL_DB.GetTable("Command_use_pie").data["None"].data = clone(newData)
                io.emit('tableUpdated', {
                    name: "Command_use_pie",
                    timeRange: "None"
                });
            }
        }
    } catch (err) {}


    try {

        var SongRequests = DB.load("../Engine/Plugins/Settings/SongRequests.json");
        var ts = new Date();
        var nowPlaying = DB.load("../Engine/Plugins/Settings/CurrentSong.json");
        if (SongRequests != null) {
            var newData = [["Q", "User", "Title", "Link"]]
            newData.push(["#0", nowPlaying.user, nowPlaying.title, nowPlaying.src])
            for (var i in SongRequests) {
                newData.push(["#" + (parseInt(i) + 1), SongRequests[i].user, SongRequests[i].title, SongRequests[i].src])
            }
            SQL_DB.GetTable("SongRequests").data["None"].error = ""
            SQL_DB.GetTable("SongRequests").data["None"].ts = formatDate(ts, "hh:mm:ss MMM dd", false)
            SQL_DB.GetTable("SongRequests").data["None"].data = clone(newData)
            io.emit('tableUpdated', {
                name: "SongRequests",
                timeRange: "None"
            });
        }
    } catch (err) {}


    try {


        var Playlist = DB.load("../Engine/Plugins/Settings/Playlist.json");

        var Playliststr = JSON.stringify(Playlist)
        if (PlaylistOld != Playliststr) {
            PlaylistOld = Playliststr
            var ts = new Date();
            if (SongRequests != null) {
                var newData = [["Name", "URL"]]
                for (var key in Playlist) {
                    newData.push([Playlist[key], key])
                }
                SQL_DB.GetTable("PlayList").data["None"].error = ""
                SQL_DB.GetTable("PlayList").data["None"].ts = formatDate(ts, "hh:mm:ss MMM dd", false)
                SQL_DB.GetTable("PlayList").data["None"].data = clone(newData)
                io.emit('tableUpdated', {
                    name: "PlayList",
                    timeRange: "None"
                });
            }
        }
    } catch (err) {
        console.log(err)
    }
    try {

        var Viewers = DB.load("../Engine/DB/viewerDB.json").Viewers;
        var Viewersstr = JSON.stringify(Viewers)
        if (ViewersOld != Viewersstr) {
            ViewersOld = Viewersstr
            var ts = new Date();
            if (Viewers != null && Object.size(Viewers) > 0) {
                var newData = [["Viewer", "Points", {
                    role: 'annotation'
                }]]
                for (var i in Viewers) {
                    if (Viewers[i].playerDeleteTimeout != null && Viewers[i].playerDeleteTimeout > (ts.getTime() + 2591100000)) {
                        newData.push([i, round(Viewers[i].points, 2), round(Viewers[i].points, 2)])
                    }

                }
                SQL_DB.GetTable("Viewers").data["None"].error = ""
                SQL_DB.GetTable("Viewers").data["None"].ts = formatDate(ts, "hh:mm:ss MMM dd", false)
                SQL_DB.GetTable("Viewers").data["None"].data = clone(newData)
                io.emit('tableUpdated', {
                    name: "Viewers",
                    timeRange: "None"
                });
                SQL_DB.GetTable("Viewers_pie").data["None"].error = ""
                SQL_DB.GetTable("Viewers_pie").data["None"].ts = formatDate(ts, "hh:mm:ss MMM dd", false)
                SQL_DB.GetTable("Viewers_pie").data["None"].data = clone(newData)
                io.emit('tableUpdated', {
                    name: "Viewers_pie",
                    timeRange: "None"
                });
            }
        }
    } catch (err) {}
}, 5000)
