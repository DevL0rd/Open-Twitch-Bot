//Authour: DevL0rd
//GitHub: https://github.com/DevL0rd
/////////////////////////////////
//Public vars and functions here

//TODO:
//Add function to autmatically return badge sources, and spacing.

var gameTimeout;
var hpinterval;
var user2;
var user1;
var pointsToStake;
var isStaking = false;
var isChallenging = false;
var user1HP = 99;
var user2HP = 99;
var FirstIsAttacking = false;

//Get random int in this range
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
//round int to 2 decimals
function round(inty) {
    return Math.round(inty * 100) / 100;
}

function duel(channel, user, command, isPrivate, viewerDB, say, display, options) {
    if (!isStaking) {
        if (!isChallenging) {
            var params = command.split(" ");
            if (params.length > 2) {
                if ("" + parseInt(params[2]) != "NaN") {
                    pointsToStake = parseInt(params[2]);
                } else if (params[2] == "yolo" || params[2] == "all" || params[2] == "chuck") {
                    pointsToStake = viewerDB.Viewers[user.username].points;
                } else if (params[2] == "half") {
                    //if param is all or yolo use all points
                    pointsToStake = "" + viewerDB.Viewers[user.username].points / 2;
                }
                user1 = user;
                user2 = {
                    username: params[1].replace("@", "")
                }

                if (user2.username != options.identity.username.toLowerCase()) {
                    if (pointsToStake > 24) {
                        if (viewerDB.Viewers[user.username].points >= pointsToStake) {
                            if (viewerDB.Viewers[user2.username] != null) {
                                if (viewerDB.Viewers[user2.username].points >= pointsToStake) {
                                    if (user1.username != user2.username) {
                                        user2.subscriber = viewerDB.Viewers[user2.username].subscribed
                                        say("", channel, "@" + user2.username + " has been challenged to a duel by " + user.username + " for " + round(pointsToStake) + " " + options.pointsName + "! You have 30 seconds to accept/decline (!accept or !decline).", isPrivate)
                                        isChallenging = true;
                                        clearTimeout(gameTimeout)
                                        viewerDB.Viewers[user1.username].points -= pointsToStake;
                                        user1HP = 99;
                                        gameTimeout = setTimeout(function () {
                                            say("", channel, "@" + user2.username + " did not accept " + user.username + "'s challenge.", isPrivate)
                                            isChallenging = false
                                            viewerDB.Viewers[user1.username].points += pointsToStake;
                                        }, 30000)
                                    } else {
                                        say(user, channel, "You cannot stake yourself.", isPrivate)
                                    }
                                } else {
                                    say(user, channel, user2.username + " only has " + round(viewerDB.Viewers[user2.username].points) + " " + options.pointsName + ".", isPrivate)
                                }
                            } else {
                                say(user, channel, "Cannot find " + params[1], isPrivate)
                            }
                        } else {
                            say(user, channel, "You only have " + round(viewerDB.Viewers[user1.username].points) + " " + options.pointsName + ".", isPrivate)
                        }
                    } else {
                        say(user, channel, "You must stake at least 25 " + options.pointsName, isPrivate)
                    }
                } else {
                    say(user, channel, "Ha, fuck that.", isPrivate)
                }
            } else {
                say(user, channel, "Usage: !stake <username> <points>", isPrivate)
            }
        } else {
            say(user, channel, "A challenge is currently taking place.", isPrivate)
        }
    } else {
        say(user, channel, "The duel arena is currently occupied by " + user.username + " and " + user2.username + ".", isPrivate)
    }
}

function init(commands, events, responses, options, viewerDB, display, say, statsDb) {
    commands.stake = function (channel, user, message, command, isPrivate) {
        duel(channel, user, command, isPrivate, viewerDB, say, display, options)
    }

    commands.duel = function (channel, user, message, command, isPrivate) {
        duel(channel, user, command, isPrivate, viewerDB, say, display, options)
    }
    commands.kdr = function (channel, user, message, command, isPrivate) {
        if (viewerDB.Viewers[user.username].stakedeaths == null) {
            viewerDB.Viewers[user.username].stakedeaths = 0
        }
        if (viewerDB.Viewers[user.username].stakewins == null) {
            viewerDB.Viewers[user.username].stakewins = 0
        }
        var totalRounds = viewerDB.Viewers[user.username].stakedeaths + viewerDB.Viewers[user.username].stakewins
        var killpercent = round((viewerDB.Viewers[user.username].stakewins / totalRounds) * 100)
        var deathpercent = round((viewerDB.Viewers[user.username].stakedeaths / totalRounds) * 100)
        var kdr = round((killpercent / deathpercent))
        say(user, channel, "KDR: " + kdr + " | Kills: " + parseInt("" + viewerDB.Viewers[user.username].stakewins) + " (" + killpercent + "%) Deaths: " + parseInt("" + viewerDB.Viewers[user.username].stakedeaths), isPrivate)
    }
    commands.ls = function (channel, user, message, command, isPrivate) {
        if (viewerDB.Viewers[user.username].largestStake == null) {
            say(user, channel, "You have not staked anyone yet.", isPrivate)
        } else {
            say(user, channel, "Your largest stake reward was " + round(viewerDB.Viewers[user.username].largestStake) + " " + options.pointsName + ".", isPrivate)
        }
    }
    commands.largeststake = function (channel, user, message, command, isPrivate) {
        if (viewerDB.Viewers[user.username].largestStake == null) {
            say(user, channel, "You have not staked anyone yet.", isPrivate)
        } else {
            say(user, channel, "Your largest stake reward was " + round(viewerDB.Viewers[user.username].largestStake) + " " + options.pointsName + ".", isPrivate)
        }
    }
    events.on("chat", function (channel, user, message) {
        timeOutTime = 3000;
        if (isChallenging) {
            if (user.username == user2.username) {
                if (message.toLowerCase() == "!accept") {
                    isStaking = true;
                    if (viewerDB.Viewers[user.username].points >= pointsToStake) {
                        clearTimeout(gameTimeout)
                        say("", channel, "@" + user2.username + " has accepted " + user1.username + "'s challenge. The duel will begin soon.", false)
                        viewerDB.Viewers[user2.username].points -= pointsToStake;
                        if (pointsToStake > 149) {
                            timeOutTime = 7000;
                            display.audio("/audio/duel.mp3", 0.6, "stakes")
                            setTimeout(function () {
                                display.say(user1.username + " and " + user2.username + " are big boy staking for " + round(pointsToStake) + " " + options.pointsName + ".", "stakes")
                            }, 2800);
                        } else {

                            display.say(user1.username + " is dueling " + user2.username + " for " + round(pointsToStake) + " " + options.pointsName + ". Good luck.", "stakes")

                        }

                        user2HP = 99;
                        setTimeout(function () {
                            hpinterval = setInterval(function () {
                                var damage = getRandomInt(0, 25);
                                if (FirstIsAttacking) {
                                    FirstIsAttacking = false;
                                    user2HP -= damage;
                                    if (user2HP < 0) {
                                        user2HP = 0;
                                    }


                                    if (damage > 0) {
                                        //display.audio("/audio/whip.mp3", 0.5, "stakes")
                                        display.media(210, 70, 50, 50, "/img/hitsplat.png", "stakes", 0, 1450, 50);
                                    } else {
                                        //display.audio("/audio/0whip.mp3", 0.5, "stakes")
                                        display.media(210, 70, 50, 50, "/img/hitsplatblue.png", "stakes", 0, 1450, 50);
                                    }
                                    var offset = 0;
                                    if (damage > 9) {
                                        offset = -4
                                    }
                                    display.text("" + damage, 220 + offset, 85, {
                                        color: "white",
                                        font: "bebas",
                                        fontsize: "20px"
                                    }, "stakes", 0, 1450, 0)
                                } else {
                                    FirstIsAttacking = true;
                                    user1HP -= damage;
                                    if (user1HP < 0) {
                                        user1HP = 0;
                                    }
                                    if (damage > 0) {
                                        // display.audio("/audio/whip.mp3", 0.5, "stakes")
                                        display.media(10, 70, 50, 50, "/img/hitsplat.png", "stakes", 0, 1450, 50);
                                    } else {
                                        // display.audio("/audio/0whip.mp3", 0.5, "stakes")
                                        display.media(10, 70, 50, 50, "/img/hitsplatblue.png", "stakes", 0, 1450, 50);
                                    }
                                    var offset = !0;
                                    if (damage > 9) {
                                        offset = -4
                                    }

                                    display.text("" + damage, 30 + offset, 85, {
                                        color: "white",
                                        font: "bebas",
                                        fontsize: "20px"
                                    }, "stakes", 0, 1450, 0)
                                }
                                var user1Color = "white"
                                var user2Color = "white"
                                var nameOffSet = 0
                                var nameOffSet2 = 0
                                display.clear("/img/stakeBG.png", "stakes")
                                display.media(0, 0, 400, 150, "/img/stakeBG.png", "stakes", 0, 1540, 0);
                                if (user1.subscriber || user1.username == "dev_l0rd") {

                                    var subBadgeSource = "/img/subscriberBadge.png"
                                    if (user1.username == "tehhpro") {
                                        subBadgeSource = "/img/tehhproBadge.png"
                                    } else if (user1.username == "dev_l0rd") {
                                        subBadgeSource = "/img/dev_l0rdBadge.png"
                                    }
                                    user1Color = "purple"
                                    display.clear(subBadgeSource, "stakes")
                                    display.media(10, 16, 18, 18, subBadgeSource, "stakes", 0, 1540, 0);
                                    nameOffSet = 23
                                }
                                if (user2.subscriber || user2.username == "dev_l0rd") {
                                    var subBadgeSource = "/img/subscriberBadge.png"
                                    if (user2.username == "tehhpro") {
                                        subBadgeSource = "/img/tehhproBadge.png"
                                    } else if (user2.username == "dev_l0rd") {
                                        subBadgeSource = "/img/dev_l0rdBadge.png"
                                    }
                                    user2Color = "purple"
                                    display.clear(subBadgeSource, "stakes")
                                    display.media(210, 16, 18, 18, subBadgeSource, "stakes", 0, 1540, 0);
                                    nameOffSet2 = 23
                                }
                                display.clear(user1.username, "stakes")
                                display.clear(user2.username, "stakes")
                                display.text(user1.username, 10 + nameOffSet, 10, {
                                    color: user1Color,
                                    font: "bebas",
                                    fontsize: "20px"
                                }, "stakes", 0, 1540, 0)

                                display.text(user2.username, 210 + nameOffSet2, 10, {
                                    color: user2Color,
                                    font: "bebas",
                                    fontsize: "20px"
                                }, "stakes", 0, 1540, 0)

                                var user1color = "white"
                                var user2color = "white"
                                if (user1HP < 20) {
                                    user1color = "red"
                                } else if (user1HP < 40) {
                                    user1color = "yellow"
                                }
                                if (user2HP < 20) {
                                    user2color = "red"
                                } else if (user2HP < 40) {
                                    user2color = "yellow"
                                }
                                display.text(user1HP + "/99", 10, 40, {
                                    color: user1color,
                                    font: "bebas",
                                    fontsize: "20px"
                                }, "stakes", 0, 1540, 0)

                                display.text(user2HP + "/99", 210, 40, {
                                    color: user2color,
                                    font: "bebas",
                                    fontsize: "20px"
                                }, "stakes", 0, 1540, 0)

                                if (user1HP <= 0) {
                                    display.clear("/img/stakeBG.png", "stakes")
                                    display.media(0, 0, 400, 150, "/img/stakeBG.png", "stakes", 0, 8000);
                                    if (viewerDB.Viewers[user1.username].stakedeaths == null) {
                                        viewerDB.Viewers[user1.username].stakedeaths = 0
                                    }
                                    if (viewerDB.Viewers[user2.username].stakewins == null) {
                                        viewerDB.Viewers[user2.username].stakewins = 0
                                    }
                                    viewerDB.Viewers[user1.username].stakedeaths++;
                                    viewerDB.Viewers[user2.username].stakewins++;

                                    display.say(user2.username + " won the duel, walking away with " + round(pointsToStake * 2) + " " + options.pointsName + ".", "stakes")
                                    clearInterval(hpinterval)
                                    setTimeout(function () {
                                        isStaking = false;
                                        isChallenging = false;
                                        say("", channel, "@" + user2.username + " has won the duel and gained " + round(pointsToStake * 2) + " " + options.pointsName + ".", false)
                                    }, 10000)
                                    var nameOffSet = 0
                                    var nameOffSet2 = 0
                                    if (user1.subscriber || user1.username == "dev_l0rd") {
                                        var subBadgeSource = "/img/subscriberBadge.png"
                                        if (user1.username == "tehhpro") {
                                            subBadgeSource = "/img/tehhproBadge.png"
                                        } else if (user1.username == "dev_l0rd") {
                                            subBadgeSource = "/img/dev_l0rdBadge.png"
                                        }
                                        display.clear(subBadgeSource, "stakes")
                                        display.media(10, 16, 18, 18, subBadgeSource, "stakes", 0, 8000);
                                        nameOffSet = 23
                                    }
                                    if (user2.subscriber || user2.username == "dev_l0rd") {
                                        var subBadgeSource = "/img/subscriberBadge.png"
                                        if (user2.username == "tehhpro") {
                                            subBadgeSource = "/img/tehhproBadge.png"
                                        } else if (user2.username == "dev_l0rd") {
                                            subBadgeSource = "/img/dev_l0rdBadge.png"
                                        }
                                        display.clear(subBadgeSource, "stakes")
                                        display.media(210, 16, 18, 18, subBadgeSource, "stakes", 0, 8000);
                                        nameOffSet2 = 23
                                    }
                                    display.clear(user1.username, "stakes")
                                    display.clear(user2.username, "stakes")
                                    display.text(user1.username, 10 + nameOffSet, 11, {
                                        color: "white",
                                        font: "bebas",
                                        fontsize: "20px"
                                    }, "stakes", 0, 8000)
                                    display.audio("/audio/stakeWin.mp3", 0.5, "stakes")
                                    display.text(user2.username, 210 + nameOffSet2, 11, {
                                        color: "green",
                                        font: "bebas",
                                        fontsize: "20px"
                                    }, "stakes", 0, 8000)
                                    display.text(user1HP + "/99", 10, 40, {
                                        color: user1color,
                                        font: "bebas",
                                        fontsize: "20px"
                                    }, "stakes", 0, 8000)

                                    display.text(user2HP + "/99", 210, 40, {
                                        color: user2color,
                                        font: "bebas",
                                        fontsize: "20px"
                                    }, "stakes", 0, 8000)
                                    if (viewerDB.Viewers[user2.username].largestStake < pointsToStake * 2) {
                                        viewerDB.Viewers[user2.username].largestStake = pointsToStake * 2
                                    }
                                    viewerDB.Viewers[user2.username].points += pointsToStake * 2;
                                } else if (user2HP <= 0) {
                                    display.clear("/img/stakeBG.png", "stakes")
                                    display.media(0, 0, 400, 150, "/img/stakeBG.png", "stakes", 0, 8000);
                                    if (viewerDB.Viewers[user2.username].stakedeaths == null) {
                                        viewerDB.Viewers[user2.username].stakedeaths = 0
                                    }
                                    if (viewerDB.Viewers[user1.username].stakewins == null) {
                                        viewerDB.Viewers[user1.username].stakewins = 0
                                    }
                                    viewerDB.Viewers[user2.username].stakedeaths++;
                                    viewerDB.Viewers[user1.username].stakewins++;
                                    display.say(user1.username + " won the duel, walking away with " + round(pointsToStake * 2) + " " + options.pointsName + ".", "stakes")
                                    clearInterval(hpinterval)
                                    setTimeout(function () {
                                        isStaking = false;
                                        isChallenging = false;
                                        say("", channel, "@" + user1.username + " has won the duel and gained " + round(pointsToStake * 2) + " " + options.pointsName + ".", false)
                                    }, 10000)
                                    display.audio("/audio/stakeWin.mp3", 0.5, "stakes")
                                    var nameOffSet = 0
                                    var nameOffSet2 = 0
                                    if (user1.subscriber || user1.username == "dev_l0rd") {
                                        var subBadgeSource = "/img/subscriberBadge.png"
                                        if (user1.username == "tehhpro") {
                                            subBadgeSource = "/img/tehhproBadge.png"
                                        } else if (user1.username == "dev_l0rd") {
                                            subBadgeSource = "/img/dev_l0rdBadge.png"
                                        }
                                        display.clear(subBadgeSource, "stakes")
                                        display.media(10, 16, 18, 18, subBadgeSource, "stakes", 0, 8000);
                                        nameOffSet = 23
                                    }
                                    if (user2.subscriber || user2.username == "dev_l0rd") {
                                        var subBadgeSource = "/img/subscriberBadge.png"
                                        if (user2.username == "tehhpro") {
                                            subBadgeSource = "/img/tehhproBadge.png"
                                        } else if (user2.username == "dev_l0rd") {
                                            subBadgeSource = "/img/dev_l0rdBadge.png"
                                        }
                                        display.clear(subBadgeSource, "stakes")
                                        display.media(210, 16, 18, 18, subBadgeSource, "stakes", 0, 8000);
                                        nameOffSet2 = 23
                                    }

                                    display.clear(user1.username, "stakes")
                                    display.clear(user2.username, "stakes")
                                    display.text(user1.username, 10 + nameOffSet, 10, {
                                        color: "green",
                                        font: "bebas",
                                        fontsize: "20px"
                                    }, "stakes", 0, 8000)
                                    display.text(user2.username, 210 + nameOffSet2, 10, {
                                        color: "white",
                                        font: "bebas",
                                        fontsize: "20px"
                                    }, "stakes", 0, 8000)
                                    display.text(user1HP + "/99", 10, 40, {
                                        color: user1color,
                                        font: "bebas",
                                        fontsize: "20px"
                                    }, "stakes", 0, 8000)

                                    display.text(user2HP + "/99", 210, 40, {
                                        color: user2color,
                                        font: "bebas",
                                        fontsize: "20px"
                                    }, "stakes", 0, 8000)
                                    if (viewerDB.Viewers[user1.username].largestStake < pointsToStake * 2) {
                                        viewerDB.Viewers[user1.username].largestStake = pointsToStake * 2
                                    }
                                    viewerDB.Viewers[user1.username].points += pointsToStake * 2;
                                }
                            }, 1500);
                        }, timeOutTime)

                    } else {
                        say(user, channel, "You do not have enough " + options.pointsName + " to accept.", false)
                        isStaking = false
                        isChallenging = false
                        clearTimeout(gameTimeout)
                    }




                } else if (message.toLowerCase() == "!decline") {
                    clearTimeout(gameTimeout)
                    isStaking = false
                    isChallenging = false
                    say("", channel, user2.username + " has declined " + user1.username + "'s challenge.", false)
                    viewerDB.Viewers[user1.username].points += pointsToStake;
                }
            }
        }
    });

}
module.exports.init = init;
