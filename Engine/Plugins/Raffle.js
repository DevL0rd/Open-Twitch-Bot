//Authour: DevL0rd, Tehhpro
//GitHub: https://github.com/DevL0rd
//Last Update: 8/25/2017
//Version: 1
/////////////////////////////////
//Public vars and functions here
var fs = require('fs');
var DB = require('../Devlord_modules/DB.js');
//Get random int in this range
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
//round int to 2 decimals
function round(inty) {
    return Math.round(inty * 100) / 100;
}
if (fs.existsSync("./Engine/Plugins/Settings/Raffle.json")) {
    var raffleData = DB.load("./Engine/Plugins/Settings/Raffle.json")
} else {
    var raffleData = {
        raffles: [],
        description: "No raffle description.",
        winner: "None yet",
        winnerTicketCount: 0
    }
    DB.save("./Engine/Plugins/Settings/Raffle.json", raffleData)
}

var raffleSaveTimeout

//Initialize the plugin, everything inside this code block has access to the bots api
function init(commands, events, responses, options, viewerDB, display, say, statsDb) {
    /////////////////////
    //Plugin starts here

    //Displays information about the raffle command
    commands.raffleinfo = function (channel, user, message, command, isPrivate) {
        say(user, channel, "'" + raffleData.description + "' (" + raffleData.raffles.length + " entries)", isPrivate)
        say(user, channel, "Last Winner: " + raffleData.winner + " (" + raffleData.winnerTicketCount + " tickets)", isPrivate)
    }
    commands.raffle = function (channel, user, message, command, isPrivate) {
        if (!isPrivate) {
            var paramCount = command.split(" ").length - 1
            var param = message.slice(command.indexOf(' ') + 2)
            if (paramCount > 0) {
                if (param == "yolo" || param == "all" || param == "chuck") {
                    //if param is all or yolo use all points
                    param = "" + viewerDB.Viewers[user.username].points;
                } else if (param == "half") {
                    //if param is all or yolo use all points
                    param = "" + viewerDB.Viewers[user.username].points / 2;
                }
                if ("" + parseInt(param) == "NaN") {
                    if (options.admins.includes(user.username) && param.toLowerCase() != "info") {
                        if (param.toLowerCase() == "draw") {
                            if (raffleData.raffles.length > 0) {
                                var Winner = raffleData.raffles[getRandomInt(1, raffleData.raffles.length) - 1]
                                var totalTikets = 0
                                for (i in raffleData.raffles) {
                                    if (raffleData.raffles[i] == Winner) {
                                        totalTikets++;
                                    }


                                }
                                raffleData.winner = Winner
                                raffleData.winnerTicketCount = totalTikets

                                say("", channel, "The winner is " + Winner + " (" + totalTikets + " tickets)! Congratulations!", isPrivate)
                                raffleData.raffles = []
                                clearTimeout(raffleSaveTimeout)
                                raffleSaveTimeout = setTimeout(function () {
                                    DB.save("./Engine/Plugins/Settings/Raffle.json", raffleData)
                                }, 5000)
                            } else {
                                say("", channel, "No one has entered the raffle.", isPrivate)
                            }
                        } else if (param.toLowerCase() == "clear") {
                            for (i in raffleData.raffles) {
                                viewerDB.Viewers[raffleData.raffles[i]].points++;
                            }
                            raffleData.raffles = []
                            say(user, channel, "Raffle cleared. All points refunded.", isPrivate)
                            clearTimeout(raffleSaveTimeout)
                            raffleSaveTimeout = setTimeout(function () {
                                DB.save("./Engine/Plugins/Settings/Raffle.json", raffleData)
                            }, 5000)
                        } else {
                            raffleData.description = param
                            say(user, channel, "Raffle description set. '" + param + "'.", isPrivate)
                            raffleSaveTimeout = setTimeout(function () {
                                DB.save("./Engine/Plugins/Settings/Raffle.json", raffleData)
                            }, 5000)
                        }
                    } else {
                        if (param.toLowerCase() == "info") {
                            raffleData.raffles
                            say(user, channel, "'" + raffleData.description + "' (" + raffleData.raffles.length + " entries)", isPrivate)
                            say(user, channel, "Last Winner: " + raffleData.winner + " (" + raffleData.winnerTicketCount + " tickets)", isPrivate)
                        } else {
                            say(user, channel, "Usage: !raffle <amount>.", isPrivate)
                        }

                    }

                } else {

                    if (parseInt(param) > 0) {
                        if (parseInt(param) > viewerDB.Viewers[user.username].points) {
                            say(user, channel, "You only have " + round(viewerDB.Viewers[user.username].points) + " " + options.pointsName + " .", isPrivate)
                        } else {
                            //add points for user to raffle
                            viewerDB.Viewers[user.username].points -= parseInt(param)

                            //do this task asynchronously to prevent server thread lag
                            setTimeout(function (pointsSpent = parseInt(param), userToRaffle = user.username) {
                                while (pointsSpent > 0) {
                                    raffleData.raffles.push(userToRaffle)
                                    pointsSpent--;
                                }
                                var totalTikets = 0
                                for (i in raffleData.raffles) {
                                    if (raffleData.raffles[i] == user.username) {
                                        totalTikets++;
                                    }


                                }
                                say(user, channel, "You spend " + round(parseInt(param)) + " " + options.pointsName + " on the raffle and have a total of " + totalTikets + " tickets.", isPrivate)
                                clearTimeout(raffleSaveTimeout)
                                raffleSaveTimeout = setTimeout(function () {
                                    DB.save("./Engine/Plugins/Settings/Raffle.json", raffleData)
                                }, 5000)
                            }, 0)
                        }
                    } else {
                        say(user, channel, "You must raffle a positive ammount of " + options.pointsName + " .", isPrivate)
                    }
                }
            } else {
                say(user, channel, "To enter, type !raffle <amount>. For more info type !raffle info", isPrivate)
            }
        } else {
            say(user, channel, "You can not use this command in a whisper.", isPrivate)
        }
    }
    //question about raffle
    responses.push(function (user, channel, message, isPrivate, directedToBot) {
        if ((message.search("what") != -1 || message.search("when") != -1) && message.search("raffle") != -1) {
            say(user, channel, "'" + raffleData.description + "' (" + raffleData.raffles.length + " entries)", isPrivate)
            return true
        }
        return false;
    })
}



module.exports.init = init;
