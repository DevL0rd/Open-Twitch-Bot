//Authour: DevL0rd
//GitHub: https://github.com/DevL0rd
/////////////////////////////////
//Public vars and functions here

var fs = require('fs');
var DB = require('../../../Devlord_modules/DB.js');

var time = 0;
var countDownInterval;
var startTime = 0;


//Get random int in this range
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
//round int to 2 decimals
function round(inty) {
    return Math.round(inty * 100) / 100;
}
//load start time of stream
if (fs.existsSync(__dirname + "/Settings/startTime.json")) {
    var startTime = DB.load(__dirname + "/Settings/startTime.json").startTime;
} else {
    var startTime = 0;

}

function init(commands, events, responses, options, viewerDB, display, say, statsDb) {
    /////////////////////
    //Plugin starts here

    //Make a new command
    //BRB <time>s/m
    commands.brb = function (channel, user, message, command, isPrivate) {
        //if user is admin
        if (options.admins.includes(user.username)) {
            //create string to display on screen
            var string = "Stream resumes in"
            time = 0;
            //get time to wait from parameters
            if (command.split(" ")[1] != null && "" + parseInt(command.split(" ")[1].replace("m", "").replace("s", "")) != "NaN") {
                if (command.split(" ")[1].includes("m")) {
                    time = parseInt(command.split(" ")[1].replace("m", "")) * 60;
                } else if (command.split(" ")[1].includes("s")) {
                    time = parseInt(command.split(" ")[1].replace("s", ""));
                }
            }
            time -= 1;
            //if time is greater than 0
            if (time > 0) {
                //Display brb media
                display.media("center", "center", 1920, 1080, "/img/brb.gif", "overlay", 300, (time) * 1000);
                //clear any old countdowns
                clearInterval(countDownInterval)
                //start countdown
                countDownInterval = setInterval(function () {
                    //depending on timer value choose size and color of text and display it on screen
                    if (time > 15) {
                        display.text(string + ": " + new Date(time * 1000).toISOString().substr(11, 8), "center", 50, {
                            color: "green",
                            font: "Impact",
                            fontsize: "70px"
                        }, "overlay", 0, 1000, 0)
                    } else if (time > 5) {
                        display.text(string + ": " + new Date(time * 1000).toISOString().substr(11, 8), "center", 50, {
                            color: "yellow",
                            font: "Impact",
                            fontsize: "100px"
                        }, "overlay", 0, 1000, 0)
                    } else {
                        display.text(string + ": " + new Date(time * 1000).toISOString().substr(11, 8), "center", 50, {
                            color: "red",
                            font: "Impact",
                            fontsize: "130px"
                        }, "overlay", 0, 1000, 0)
                    }
                    //count down
                    time--;
                    //when countdown is complete clear the loop
                    if (time <= 0) {
                        clearInterval(countDownInterval)
                    }
                }, 1000)

            } else {
                //User put incorrect time param
                say(user, channel, "Usage: !brb <time seconds>", isPrivate)
            }
        } else {
            //user is not an admin
            say(user, channel, "You must be an administrator to use this command", isPrivate)
        }
    }
    //Make a new command
    //startstream <time>s/m
    commands.startstream = function (channel, user, message, command, isPrivate) {
        //if user is admin
        if (options.admins.includes(user.username)) {
            //create string to display on screen
            var string = "Stream starts in"
            time = 0;
            //get time to wait from parameters
            if (command.split(" ")[1] != null && "" + parseInt(command.split(" ")[1].replace("m", "").replace("s", "")) != "NaN") {
                if (command.split(" ")[1].includes("m")) {
                    time = parseInt(command.split(" ")[1].replace("m", "")) * 60;
                } else if (command.split(" ")[1].includes("s")) {
                    time = parseInt(command.split(" ")[1].replace("s", ""));
                }
            }
            time -= 1;
            //if time is greater than 0
            if (time > 0) {
                //Display startstream media
                display.media("center", "center", 1920, 1080, "/img/brb.gif", "overlay", 300, (time) * 1000);
                //set start time of stream
                startTime = new Date().getTime();
                //save the start time.
                DB.save(__dirname + "/Settings/startTime.json", {
                    startTime: startTime
                })
                //clear any old countdowns
                clearInterval(countDownInterval)
                //start countdown
                countDownInterval = setInterval(function () {
                    //depending on timer value choose size and color of text and display it on screen
                    if (time > 15) {
                        display.text(string + ": " + new Date(time * 1000).toISOString().substr(11, 8), "center", 50, {
                            color: "green",
                            font: "Impact",
                            fontsize: "70px"
                        }, "overlay", 0, 1000, 0)
                    } else if (time > 5) {
                        display.text(string + ": " + new Date(time * 1000).toISOString().substr(11, 8), "center", 50, {
                            color: "yellow",
                            font: "Impact",
                            fontsize: "100px"
                        }, "overlay", 0, 1000, 0)
                    } else {
                        display.text(string + ": " + new Date(time * 1000).toISOString().substr(11, 8), "center", 50, {
                            color: "red",
                            font: "Impact",
                            fontsize: "130px"
                        }, "overlay", 0, 1000, 0)
                    }
                    //count down
                    time--;
                    //when countdown is complete clear the loop
                    if (time <= 0) {
                        clearInterval(countDownInterval)
                    }
                }, 1000)

            } else {
                //User put incorrect time param
                say(user, channel, "Usage: !startstream <time seconds>", isPrivate)
            }
        } else {
            //user is not an admin
            say(user, channel, "You must be an administrator to use this command", isPrivate)
        }
    }
    //New Command
    //get up time since !startstream
    commands.uptime = function (channel, user, message, command, isPrivate) {
        say(user, channel, channel + " has been live for '" + new Date(new Date().getTime() - startTime).toISOString().substr(11, 8) + "'", isPrivate)
    }
}
module.exports.init = init;