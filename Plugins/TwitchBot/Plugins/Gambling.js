//Authour: DevL0rd
//GitHub: https://github.com/DevL0rd
//Last Update: 8/22/2017
//Version: 1
/////////////////////////////////
//Public vars and functions here

//Get random int in this range
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
//round int to 2 decimals
function round(inty) {
    return Math.round(inty * 100) / 100;
}


//Initialize the plugin, everything inside this code block has access to the bots api
function init(commands, events, responses, options, viewerDB, display, say, statsDb) {
    /////////////////////
    //Plugin starts here


    //Make a new command
    //Flip a coin
    commands.fc = function (channel, user, message, command, isPrivate) {

        //choose 50 / 50 a side of the coin
        if (getRandomInt(1, 2) == 1) {
            //say to the user, in this channeld, the status of the coin, in a public or private message depending on where it came from.
            say(user, channel, "Coin landed on: TAILS", isPrivate)
        } else {
            say(user, channel, "Coin landed on: HEADS", isPrivate)
        }
    }
    commands.lg = function (channel, user, message, command, isPrivate) {
        if (viewerDB.Viewers[user.username].largestGamble == null) {
            say(user, channel, "You have not gambled yet.", isPrivate)
        } else {
            say(user, channel, "Your largest gamble reward was " + round(viewerDB.Viewers[user.username].largestGamble) + " " + options.pointsName + ".", isPrivate)
        }
    }
    commands.largestgamble = function (channel, user, message, command, isPrivate) {
        if (viewerDB.Viewers[user.username].largestGamble == null) {
            say(user, channel, "You have not gambled yet.", isPrivate)
        } else {
            say(user, channel, "Your largest gamble reward was " + round(viewerDB.Viewers[user.username].largestGamble) + " " + options.pointsName + ".", isPrivate)
        }
    }
    //Make a new command
    //Roll dice
    commands.rd = function (channel, user, message, command, isPrivate) {
        //if user is mod or admin
        if (options.admins.includes(user.username) || user.mod) {
            //default dicecount to 1
            var diceCount = 1;
            //check for dice count param
            if ("" + parseInt(command.split(" ")[1]) != "NaN") {
                diceCount = parseInt(command.split(" ")[1]);
            }
            //limit dice to 6
            if (diceCount > 5) {
                diceCount = 6;
            }
            //tell user how many dice were rolled
            say(user, channel, "You roll " + diceCount + " dice.", isPrivate)
            var total = 0;
            var i = 0;
            //roll each dice
            while (i < diceCount) {
                var roll = getRandomInt(1, 6);
                //display dice result
                say(user, channel, "Dice #" + (i + 1) + ": " + roll, isPrivate)
                total += roll
                i++;
            }
            //display roll total
            say(user, channel, "The dice total up to: " + total, isPrivate)
        } else {
            //user is not a admin or moderator
            say(user, channel, "You must be a moderator to use this command.", isPrivate)
        }
    }

    //Make a new command
    //Gamble
    commands.gamble = function (channel, user, message, command, isPrivate) {

        if (viewerDB.Viewers[user.username].nextGambleAllowed == null) {
            viewerDB.Viewers[user.username].nextGambleAllowed = 0;
        }
        var now = new Date().getTime();
        if (user.subscriber || now >= viewerDB.Viewers[user.username].nextGambleAllowed) {
            viewerDB.Viewers[user.username].nextGambleAllowed = now + 60000
            var pointsToGamble = 0;
            //check for points param
            var param = command.split(" ")[1]
            if ("" + parseInt(param) != "NaN") {
                pointsToGamble = parseInt(command.split(" ")[1]);
            } else if (param == "yolo" || param == "all" || param == "chuck") {
                //if param is all or yolo use all points
                pointsToGamble = viewerDB.Viewers[user.username].points;
            } else if (param == "half") {
                //if param is all or yolo use all points
                pointsToGamble = viewerDB.Viewers[user.username].points / 2;
            }
            //make sure points are greater than 0
            if (pointsToGamble < 25) {
                say(user, channel, "Usage: !gamble <ammount> You must gamble at least 25 points.", isPrivate)
            } else {
                //check if user has enough points
                if (viewerDB.Viewers[user.username].points >= pointsToGamble) {
                    //get random numberfrom 1 - 100
                    var gambleChance = getRandomInt(1, 100);
                    if (gambleChance >= 55) {
                        //win
                        if (gambleChance == 100) {
                            //Quad points
                            viewerDB.Viewers[user.username].points += pointsToGamble * 3;
                            say(user, channel, "You gamble " + round(pointsToGamble) + ", roll a " + gambleChance + " and **QUADRUPLE** your " + options.pointsName + "!! You now have " + round(viewerDB.Viewers[user.username].points) + " " + options.pointsName + ".", isPrivate)
                            if (viewerDB.Viewers[user.username].largestGamble == null) {
                                viewerDB.Viewers[user.username].largestGamble = pointsToGamble * 3
                            } else if (viewerDB.Viewers[user.username].largestGamble < pointsToGamble * 3) {
                                viewerDB.Viewers[user.username].largestGamble = pointsToGamble * 3
                            }
                        } else {
                            //normal win
                            viewerDB.Viewers[user.username].points += pointsToGamble;
                            say(user, channel, "You gamble " + round(pointsToGamble) + ", roll a " + gambleChance + " and WIN. You now have " + round(viewerDB.Viewers[user.username].points) + " " + options.pointsName + ".", isPrivate)
                            if (viewerDB.Viewers[user.username].largestGamble == null) {
                                viewerDB.Viewers[user.username].largestGamble = pointsToGamble
                            } else if (viewerDB.Viewers[user.username].largestGamble < pointsToGamble) {
                                viewerDB.Viewers[user.username].largestGamble = pointsToGamble
                            }
                        }
                    } else if (gambleChance == 1) {
                        //take away double points
                        viewerDB.Viewers[user.username].points -= pointsToGamble * 2;
                        //if you are taking more than they have, set points to 0
                        if (viewerDB.Viewers[user.username].points < 0) {
                            viewerDB.Viewers[user.username].points = 0;
                        }
                        say(user, channel, "You gamble " + round(pointsToGamble) + ", roll a " + gambleChance + " and get smited for your bank, losing double the points you gambled. You now have " + round(viewerDB.Viewers[user.username].points) + " " + options.pointsName + ".", isPrivate)
                    } else {
                        //lose
                        viewerDB.Viewers[user.username].points -= pointsToGamble;
                        say(user, channel, "You gamble " + round(pointsToGamble) + ", roll a " + gambleChance + " and LOSE. You now have " + round(viewerDB.Viewers[user.username].points) + " " + options.pointsName + ".", isPrivate)
                    }
                } else {
                    //not enough points
                    say(user, channel, "You do not have " + round(pointsToGamble) + " " + options.pointsName + " to gamble. You only have " + round(viewerDB.Viewers[user.username].points) + ".", isPrivate)
                }
            }

        } else {
            //Do not respond and disallow gamble
            var secondsToWait = Math.round((viewerDB.Viewers[user.username].nextGambleAllowed - now) / 1000);
            say(user, channel, "You must wait another " + secondsToWait + " seconds.", isPrivate)
        }
    }
}
module.exports.init = init;
