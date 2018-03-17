//Authour: DevL0rd
//GitHub: https://github.com/DevL0rd
//Last Update: 8/27/2017
//Version: 0.1.6
var fs = require('fs');

var NameSpace = "DevlordProject"
var LoggingDir = "./Logging"
var consoleLogging = true
if (!fs.existsSync(LoggingDir)) {
    fs.mkdirSync(LoggingDir);
}

function setNamespace(str) {
    NameSpace = str
}

function setConsoleLogging(bool) {
    consoleLogging = bool
}

function setLoggingDir(str) {
    LoggingDir = str
    if (!fs.existsSync(LoggingDir)) {
        fs.mkdirSync(LoggingDir);
    }
}

function timeStamp() {
    // Create a date object with the current time
    var now = new Date();

    // Create an array with the current month, day and time
    var date = [now.getMonth() + 1, now.getDate(), now.getFullYear()];

    // Create an array with the current hour, minute and second
    var time = [now.getHours(), now.getMinutes(), now.getSeconds()];

    // Determine AM or PM suffix based on the hour
    var suffix = (time[0] < 12) ? "AM" : "PM";

    // Convert hour from military time
    time[0] = (time[0] < 12) ? time[0] : time[0] - 12;

    // If hour is 0, set it to 12
    time[0] = time[0] || 12;

    // If seconds and minutes are less than 10, add a zero
    for (var i = 1; i < 3; i++) {
        if (time[i] < 10) {
            time[i] = "0" + time[i];
        }
    }

    // Return the formatted string
    return date.join("/") + " " + time.join(":") + " " + suffix;
}

function log(str, isError = false, NameSpaceStr = NameSpace) {
    var now = new Date();
    var date = [now.getMonth() + 1, now.getDate(), now.getFullYear()];
    var TodaysDate = date.join("-")
    var formattedString = "[" + timeStamp() + "] (" + NameSpaceStr + "): " + str
    if (isError) {
        //throw formattedString
    } else {
        console.log(formattedString)
    }


    var formattedString = "\r\n" + formattedString
    if (consoleLogging) {
        fs.appendFile(LoggingDir + "/" + NameSpaceStr + "_C-Out_" + TodaysDate + ".txt", formattedString, function (err) {
            if (err) {
                throw "[" + timeStamp() + "]: " + err
            }
        });
        fs.appendFile(LoggingDir + "/" + "C-Out_" + TodaysDate + ".txt", formattedString, function (err) {
            if (err) {
                throw "[" + timeStamp() + "]: " + err
            }
        });
    }
    if (isError) {
        fs.appendFile(LoggingDir + "/" + "E-Out_" + TodaysDate + ".txt", formattedString, function (err) {
            if (err) {
                throw "[" + timeStamp() + "]: " + err
            }
        });
        fs.appendFile(LoggingDir + "/" + NameSpaceStr + "_E-Out_" + TodaysDate + ".txt", formattedString, function (err) {
            if (err) {
                throw "[" + timeStamp() + "]: " + err
            }
        });
    }
}


exports.log = log;
exports.setNamespace = setNamespace;
exports.setLoggingDir = setLoggingDir;
exports.setConsoleLogging = setConsoleLogging;
