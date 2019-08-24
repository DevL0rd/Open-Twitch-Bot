//Authour: DevL0rd
//GitHub: https://github.com/DevL0rd
/////////////////////////////////
//Public vars and functions here

var http = require('http');
var DB = require('../../../Devlord_modules/DB.js');
var fs = require('fs');
var nextTimeToUseCommand = 0;
var rng = 0
var rngtimeout
var rngNoticeTimeout
//Get random int in this range
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
//round int to 2 decimals
function round(inty) {
    return Math.round(inty * 100) / 100;
}


//load bad words filter
var markovBadWordListPath = "./Engine/markov/MarkovBadWordList.txt";
if (fs.existsSync(markovBadWordListPath)) {
    var texts = fs.readFileSync(markovBadWordListPath).toString('utf-8');
    var badwords = texts.split("\r\n")
} else {
    var badwords = [];
}
//init bad word searcher
function containsBadWord(str) {
    var words = str.toLowerCase().replace(".", " ").replace("/", " ").replace("!", " ").replace("?", " ").replace("*", " ").split(" ")
    for (var i in words) {
        if (badwords.includes(words[i])) {
            return true;
        }
    }
    return false;
}


function init(commands, events, responses, options, viewerDB, display, say, statsDb) {
    /////////////////////
    //Plugin starts here

    //List all commands and price in this plugin
    commands.trolls = function (channel, user, message, command, isPrivate) {
        say(user, channel, "!cena (70 " + options.pointsName + "), !birdup (30 " + options.pointsName + "), !snaildown (30 " + options.pointsName + "), !insult <user> (25 " + options.pointsName + "), !sayinsult <user> (75 " + options.pointsName + "), !godDamn (25 " + options.pointsName + "), !ohShit (25 " + options.pointsName + "), !fullmast (50 " + options.pointsName + "}", isPrivate)
    }
    commands.fullmast = function (channel, user, message, command, isPrivate) {
        // if (user.subscriber || (user.mod || options.admins.includes(user.username))) {
        var price = 50
        var now = new Date().getTime();
        if (options.admins.includes(user.username) || now >= nextTimeToUseCommand) {


            if (viewerDB.Viewers[user.username].points >= price) {
                viewerDB.Viewers[user.username].points -= price;
                nextTimeToUseCommand = now + 60000
                display.audio("/audio/fullmast.mp3", 1)
                display.media("center", "center", 500, 255, "/img/fullmast.gif", "overlay", 0, 1600, 0);
                display.text(user.username + " typed '!fullmast'", "center", "center", {
                    color: "yellow",
                    font: "Impact",
                    fontsize: "40px"
                }, "overlay", 300, 1000)

                setTimeout(function () {
                    display.say(user.username + " is full mast.")
                }, 1000)

                say(user, channel, price + " " + options.pointsName + " taken. You now have " + round(viewerDB.Viewers[user.username].points) + " " + options.pointsName + ".", isPrivate)
            } else {
                say(user, channel, "This costs " + price + " " + options.pointsName + " but you only have " + round(viewerDB.Viewers[user.username].points) + " " + options.pointsName + ".", isPrivate)
            }
        } else {
            var secondsToWait = Math.round((nextTimeToUseCommand - now) / 1000);
            say(user, channel, "You must wait another " + secondsToWait + " seconds before using this command", isPrivate)
        }
        //  } else {
        //      say(user, channel, "You must be a subscriber to use this command.", isPrivate)
        //  }
    }
    commands.cena = function (channel, user, message, command, isPrivate) {
        // if (user.subscriber || (user.mod || options.admins.includes(user.username))) {
        var price = 70
        var now = new Date().getTime();
        if (options.admins.includes(user.username) || now >= nextTimeToUseCommand) {


            if (viewerDB.Viewers[user.username].points >= price) {
                viewerDB.Viewers[user.username].points -= price;
                nextTimeToUseCommand = now + 60000
                display.audio("/audio/cena.mp3", 1)
                display.text(user.username + " typed '!cena'", "center", "center", {
                    color: "yellow",
                    font: "Impact",
                    fontsize: "40px"
                }, "overlay", 300, 4000)
                setTimeout(function () {

                    display.media("center", "center", 1920 - 100, 1080 - 100, "/img/cena" + getRandomInt(1, 2) + ".gif", "overlay", 0, 4500);
                }, 2500)

                say(user, channel, price + " " + options.pointsName + " taken. You now have " + round(viewerDB.Viewers[user.username].points) + " " + options.pointsName + ".", isPrivate)
            } else {
                say(user, channel, "This costs " + price + " " + options.pointsName + " but you only have " + round(viewerDB.Viewers[user.username].points) + " " + options.pointsName + ".", isPrivate)
            }
        } else {
            var secondsToWait = Math.round((nextTimeToUseCommand - now) / 1000);
            say(user, channel, "You must wait another " + secondsToWait + " seconds before using this command", isPrivate)
        }
        //  } else {
        //      say(user, channel, "You must be a subscriber to use this command.", isPrivate)
        //  }
    }
    commands.birdup = function (channel, user, message, command, isPrivate) {
        if (user.subscriber || (user.mod || options.admins.includes(user.username))) {
            var price = 15
            var now = new Date().getTime();
            if (options.admins.includes(user.username) || now >= nextTimeToUseCommand) {

                if (viewerDB.Viewers[user.username].points >= price) {
                    viewerDB.Viewers[user.username].points -= price;
                    nextTimeToUseCommand = now + 60000
                    display.audio("/audio/birdup.mp3")
                    display.text("Bird up!!!", "center", "center", {
                        color: "yellow",
                        font: "Impact",
                        fontsize: "40px"
                    }, "overlay", 300, 2000)
                    var randomImg = getRandomInt(1, 4);
                    setTimeout(function () {
                        display.media(getRandomInt(1, 1920 - 200), getRandomInt(1, 1080 - 200), 200, 200, "/img/birdup" + randomImg + ".png", "overlay", 0, 200, 0);
                        setTimeout(function () {
                            display.media(getRandomInt(1, 1920 - 500), getRandomInt(1, 1080 - 500), 500, 500, "/img/birdup" + randomImg + ".png", "overlay", 0, 200, 0);
                            setTimeout(function () {
                                display.media(getRandomInt(1, 1920 - 1000), getRandomInt(1, 1080 - 1000), 1000, 1000, "/img/birdup" + randomImg + ".png", "overlay", 0, 500, 0);
                            }, 200)
                        }, 200)
                    }, 450)

                    say(user, channel, price + " " + options.pointsName + " taken. You now have " + round(viewerDB.Viewers[user.username].points) + " " + options.pointsName + ".", isPrivate)
                } else {
                    say(user, channel, "This costs " + price + " " + options.pointsName + " but you only have " + round(viewerDB.Viewers[user.username].points) + " " + options.pointsName + ".", isPrivate)
                }
            } else {
                var secondsToWait = Math.round((nextTimeToUseCommand - now) / 1000);
                say(user, channel, "You must wait another " + secondsToWait + " seconds before using this command.", isPrivate)
            }
        } else {
            say(user, channel, "You must be a subscriber to use this command.", isPrivate)
        }
    }
    commands.snaildown = function (channel, user, message, command, isPrivate) {
        if (user.subscriber || (user.mod || options.admins.includes(user.username))) {
            var price = 15
            var now = new Date().getTime();
            if (options.admins.includes(user.username) || now >= nextTimeToUseCommand) {

                if (viewerDB.Viewers[user.username].points >= price) {
                    viewerDB.Viewers[user.username].points -= price;
                    nextTimeToUseCommand = now + 60000
                    display.audio("/audio/snaildown.mp3")
                    display.text("Snail down!!!", "center", "center", {
                        color: "yellow",
                        font: "Impact",
                        fontsize: "40px"
                    }, "overlay", 300, 2000)
                    var randomImg = getRandomInt(1, 3);
                    setTimeout(function () {
                        display.media(getRandomInt(1, 1920 - 200), getRandomInt(1, 1080 - 200), 200, 200, "/img/snaildown" + randomImg + ".png", "overlay", 0, 200, 0);
                        setTimeout(function () {
                            display.media(getRandomInt(1, 1920 - 500), getRandomInt(1, 1080 - 500), 500, 500, "/img/snaildown" + randomImg + ".png", "overlay", 0, 200, 0);
                            setTimeout(function () {
                                display.media(getRandomInt(1, 1920 - 1000), getRandomInt(1, 1080 - 1000), 1000, 1000, "/img/snaildown" + randomImg + ".png", "overlay", 0, 500, 0);
                            }, 200)
                        }, 200)
                    }, 1000)
                    say(user, channel, price + " " + options.pointsName + " taken. You now have " + round(viewerDB.Viewers[user.username].points) + " " + options.pointsName + ".", isPrivate)
                } else {
                    say(user, channel, "This costs " + price + " " + options.pointsName + " but you only have " + round(viewerDB.Viewers[user.username].points) + " " + options.pointsName + ".", isPrivate)
                }
            } else {
                var secondsToWait = Math.round((nextTimeToUseCommand - now) / 1000);
                say(user, channel, "You must wait another " + secondsToWait + " seconds before using this command.", isPrivate)
            }
        } else {
            say(user, channel, "You must be a subscriber to use this command.", isPrivate)
        }
    }

    //    commands.say = function (channel, user, message, command, isPrivate) {
    //        if (user.subscriber || (user.mod || options.admins.includes(user.username))) {
    //            var price = 50
    //            if (command.split(" ")[1] != null) {
    //                var param = command.substr(command.indexOf(" ") + 1);
    //                if (!containsBadWord(param)) {
    //                    var now = new Date().getTime();
    //                    if (options.admins.includes(user.username) || now >= nextTimeToUseCommand) {
    //
    //                        if (viewerDB.Viewers[user.username].points >= price) {
    //                            nextTimeToUseCommand = now + 60000
    //                            viewerDB.Viewers[user.username].points -= price;
    //                            display.say(param)
    //                            say(user, channel, price + " " + options.pointsName + " taken. You now have " + round(viewerDB.Viewers[user.username].points) + " " + options.pointsName + ".", isPrivate)
    //                        } else {
    //                            say(user, channel, "This costs " + price + " " + options.pointsName + " but you only have " + round(viewerDB.Viewers[user.username].points) + " " + options.pointsName + ".", isPrivate)
    //                        }
    //                    } else {
    //                        var secondsToWait = Math.round((nextTimeToUseCommand - now) / 1000);
    //                        say(user, channel, "You must wait another " + secondsToWait + " seconds before using this command.", isPrivate)
    //                    }
    //                } else {
    //                    say(user, channel, "I refuse to say that.", isPrivate)
    //                }
    //            } else {
    //                say(user, channel, "Usage: say <message>.", isPrivate)
    //            }
    //        } else {
    //            say(user, channel, "You must be a subscriber to use this command.", isPrivate)
    //        }
    //    }
    commands.rig = function (channel, user, message, command, isPrivate) {
        say(user, channel, "Game is now rigged.", isPrivate)
    }
    commands.unrig = function (channel, user, message, command, isPrivate) {
        say(user, channel, "Game is now unrigged.", isPrivate)
    }
    var userToInsult
    var insulte
    var insultprice
    commands.insult = function (channel, user, message, command, isPrivate) {
        if (user.subscriber || (user.mod || options.admins.includes(user.username))) {
            var price = 25
            insultprice = price;
            var params = command.split(" ");
            if (params.length == 2) {
                if (viewerDB.Viewers[params[1]] != null) {
                    if (viewerDB.Viewers[user.username].points >= price) {
                        viewerDB.Viewers[user.username].points -= price;
                        insulte = user.username
                        userToInsult = params[1]
                        var insulttype = getRandomInt(1, 4) - 1;
                        http.get('http://autoinsult.datahamster.com/scripts/webinsult.server.php?xajax=generate_insult&xajaxargs[]=' + insulttype, (res) => {
                            res.setEncoding('utf8');
                            res.on('data', function (body) {
                                try {
                                    var ins = body.split("[CDATA[")[1].split("]]")[0] + ".";
                                    say({
                                        username: userToInsult
                                    }, channel, ins, isPrivate)
                                } catch (err) {
                                    say({
                                        username: userToInsult
                                    }, channel, "There was an issue generating an insult, but uhhmmm... you are a bitch... Also a refund will be provided.", isPrivate)
                                    viewerDB.Viewers[insulte].points += insultprice;
                                }
                            });
                            res.on('error', function (body) {
                                say({
                                    username: userToInsult
                                }, channel, "There was an issue generating an insult, but uhhmmm... you are a bitch. Also a refund will be provided.", isPrivate)
                                viewerDB.Viewers[insulte].points += insultprice;
                            })
                        });

                        say(user, channel, price + " " + options.pointsName + " taken. You now have " + round(viewerDB.Viewers[user.username].points) + " " + options.pointsName + ".", isPrivate)
                    } else {
                        say(user, channel, "This costs " + price + " " + options.pointsName + " but you only have " + round(viewerDB.Viewers[user.username].points) + " " + options.pointsName + ".", isPrivate)
                    }
                } else {
                    say(user, channel, "User '" + params[1] + "' does not exist.", isPrivate)
                }
            } else {
                say(user, channel, "Usage: insult <user>.", isPrivate)
            }
        } else {
            say(user, channel, "You must be a subscriber to use this command.", isPrivate)
        }
    }
    commands.sharkleo = function (channel, user, message, command, isPrivate) {
        var randomChoice = getRandomInt(1, 11)
        if (randomChoice == 1) {
            say(user, channel, "No", isPrivate)
        } else if (randomChoice == 2) {
            say(user, channel, "No, stop it.", isPrivate)
        } else if (randomChoice == 3) {
            say(user, channel, "Stuuuuuup iiiiiiit.", isPrivate)
        } else if (randomChoice == 4) {
            say(user, channel, "Sewiously, knock it off guys :'c", isPrivate)
        } else if (randomChoice == 5) {
            say(user, channel, "Nyeaaaaaaahhhhhhhhhhhh Lemme awone.", isPrivate)
        } else if (randomChoice == 6) {
            say(user, channel, "I don't waaaaaana.", isPrivate)
        } else if (randomChoice == 7) {
            say(user, channel, "This command isn't even that interesting :'c", isPrivate)
        } else if (randomChoice == 8) {
            say(user, channel, "Oh my fucking guthix fuck off...", isPrivate)
        } else if (randomChoice == 9) {
            say(user, channel, "Oww, stop it.", isPrivate)
        } else if (randomChoice == 10) {
            say(user, channel, "tehh pro will you ban dis noob plox?", isPrivate)
        } else if (randomChoice == 11) {
            say(user, channel, "Daww ok... You have given Sharkleo 1 points for being Sharkleo", isPrivate)
            if (viewerDB.Viewers["sharkleo"] != null) {
                viewerDB.Viewers["sharkleo"].points += 1;
            }
        }
    }

    commands.rng = function (channel, user, message, command, isPrivate) {
        var price = 1
        //check for points param
        var param = command.split(" ")[1]
        if ("" + parseInt(param) != "NaN") {
            price = parseInt(command.split(" ")[1]);
        } else if (param == "yolo" || param == "all" || param == "chuck") {
            //if param is all or yolo use all points
            price = viewerDB.Viewers[user.username].points;
        } else if (param == "half") {
            //if param is all or yolo use all points
            price = viewerDB.Viewers[user.username].points / 2;
        }
        if (viewerDB.Viewers[user.username].points >= price) {
            viewerDB.Viewers[user.username].points -= price;


            rng += price;
            clearTimeout(rngNoticeTimeout)
            say(user, channel, "You give " + price + " point to RNGesus for good luck.", isPrivate)
            rngNoticeTimeout = setTimeout(function () {
                say("", channel, "Tehhpro's RNG bonus is now +" + rng + ".", isPrivate)
            }, 6000)

            clearTimeout(rngtimeout)
            rngtimeout = setTimeout(function () {
                rng = 0;
            }, 120000)
        } else {
            say(user, channel, "You don't have" + price + " " + options.pointsName + " you only have " + round(viewerDB.Viewers[user.username].points) + " " + options.pointsName + ".", isPrivate)
        }

    }
    commands.sayinsult = function (channel, user, message, command, isPrivate) {
        if (user.subscriber || (user.mod || options.admins.includes(user.username))) {
            var price = 75
            insultprice = price;
            var params = command.split(" ");
            if (params.length == 2) {
                if (viewerDB.Viewers[params[1]] != null) {
                    if (viewerDB.Viewers[user.username].points >= price) {
                        viewerDB.Viewers[user.username].points -= price;
                        insulte = user.username
                        userToInsult = params[1]
                        var insulttype = getRandomInt(1, 4) - 1;
                        http.get('http://autoinsult.datahamster.com/scripts/webinsult.server.php?xajax=generate_insult&xajaxargs[]=' + insulttype, (res) => {
                            res.setEncoding('utf8');
                            res.on('data', function (body) {
                                say({
                                    username: userToInsult
                                }, channel, body.split("[CDATA[")[1].split("]]")[0] + ".", isPrivate)
                                display.say(userToInsult + ". " + body.split("[CDATA[")[1].split("]]")[0] + ".")
                            });
                            res.on('error', function (body) {
                                say({
                                    username: userToInsult
                                }, channel, "There was an issue generating an insult, but uhhmmm... you are a bitch. Also a refund will be provided.", isPrivate)
                                viewerDB.Viewers[insulte].points += insultprice;
                            })
                        });

                        say(user, channel, price + " " + options.pointsName + " taken. You now have " + round(viewerDB.Viewers[user.username].points) + " " + options.pointsName + ".", isPrivate)
                    } else {
                        say(user, channel, "This costs " + price + " " + options.pointsName + " but you only have " + round(viewerDB.Viewers[user.username].points) + " " + options.pointsName + ".", isPrivate)
                    }
                } else {
                    say(user, channel, "User '" + params[1] + "' does not exist.", isPrivate)
                }
            } else {
                say(user, channel, "Usage: insult <user>.", isPrivate)
            }
        } else {
            say(user, channel, "You must be a subscriber to use this command.", isPrivate)
        }
    }
    /*    commands.ohshit = function (channel, user, message, command, isPrivate) {
            if (user.subscriber || (user.mod || options.admins.includes(user.username))){
            var price = 15
            if (viewerDB.Viewers[user.username].points >= price) {
                viewerDB.Viewers[user.username].points -= price;
                display.audio("/audio/ohshit.mp3")

                say(user, channel, price + " " + options.pointsName + " taken. You now have " + round(viewerDB.Viewers[user.username].points) + " " + options.pointsName + ".", isPrivate)
            } else {
                say(user, channel, "This costs " + price + " " + options.pointsName + " but you only have " + round(viewerDB.Viewers[user.username].points) + " " + options.pointsName + ".", isPrivate)
            }
            } else {
            say(user, channel, "You must be a subscriber to use this command.", isPrivate)
        }
        }*/
    commands.goddamn = function (channel, user, message, command, isPrivate) {
        if (user.subscriber || (user.mod || options.admins.includes(user.username))) {
            var price = 15
            if (viewerDB.Viewers[user.username].points >= price) {
                viewerDB.Viewers[user.username].points -= price;
                display.audio("/audio/godDamn.mp3")

                say(user, channel, price + " " + options.pointsName + " taken. You now have " + round(viewerDB.Viewers[user.username].points) + " " + options.pointsName + ".", isPrivate)
            } else {
                say(user, channel, "This costs " + price + " " + options.pointsName + " but you only have " + round(viewerDB.Viewers[user.username].points) + " " + options.pointsName + ".", isPrivate)
            }
        } else {
            say(user, channel, "You must be a subscriber to use this command.", isPrivate)
        }
    }
}
module.exports.init = init;
