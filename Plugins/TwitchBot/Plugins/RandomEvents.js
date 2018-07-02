//Authour: DevL0rd
//GitHub: https://github.com/DevL0rd
/////////////////////////////////
//Public vars and functions here
var fs = require('fs');
var randomEvent = false
var games = ["Word Game", "Math Game", "Mr Steely"]
var wordListPath = __dirname + "/Settings/wordGameList.txt"
var gameChoice = ""
var word = ""
var gameTimeout
var giveOrTake
var points
var lastMessageFromBot = false;
var mathAnswer = 0
var mathProblem = ""
var randomItem




//Get random int in this range
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
//round int to 2 decimals
function round(inty) {
    return Math.round(inty * 100) / 100;
}


//load word list 
if (fs.existsSync(wordListPath)) {
    var texts = fs.readFileSync(wordListPath).toString('utf-8');
    var wordlist = texts.split("\r\n")
} else {
    console.log("word list not found")
}

var CommonOfficeObjects = ["bag of bobbish", "plumbus", "crushed red party cup"]

function init(commands, events, responses, options, viewerDB, display, say, statsDb) {
    /////////////////////
    //Plugin starts here

    events.on("tick", function () {
        if (!randomEvent && !lastMessageFromBot) {
            if (getRandomInt(1, 300) == 1) {
                randomEvent = true
                gameChoice = games[getRandomInt(1, games.length) - 1]

                if (gameChoice == "Word Game") {

                    wordChoice = getRandomInt(1, wordlist.length) - 1
                    word = wordlist[wordChoice]

                    if (word.length < 5) {
                        points = 15
                    } else if (word.length < 9) {
                        points = 25
                    } else {
                        points = 35
                    }

                    var GameType = getRandomInt(1, 2)
                    giveOrTake = getRandomInt(1, 5)
                    if (GameType == 1) {
                        if (giveOrTake > 1) {

                            say("", "#tehhpro", "First person to say '" + word + "' wins " + points + " " + options.pointsName + "!", false)
                        } else {

                            say("", "#tehhpro", "First person to say '" + word + "' loses " + points + " " + options.pointsName + "!", false)
                        }

                    } else if (GameType == 2) {
                        if (giveOrTake > 1) {
                            say("", "#tehhpro", "First person to say '" + word + "' in reverse wins " + points + " " + options.pointsName + "!", false)

                        } else {
                            say("", "#tehhpro", "First person to say '" + word + "' in reverse loses " + points + " " + options.pointsName + "!", false)
                        }
                        word = word.split("").reverse().join("")
                    }


                } else if (gameChoice == "Math Game") {
                    mathProblem = ""
                    var difficulty = getRandomInt(1, 4);
                    var operators = ["-", "+", "*"]
                    if (difficulty == 1) {
                        mathProblem = getRandomInt(1, 10) + " " + operators[getRandomInt(1, 2) - 1] + " " + getRandomInt(1, 10)
                        points = 15
                    } else if (difficulty == 2) {
                        mathProblem = getRandomInt(1, 10) + " " + operators[2] + " " + getRandomInt(1, 10)
                        points = 25
                    } else if (difficulty == 3) {
                        mathProblem = getRandomInt(1, 10) + " " + operators[getRandomInt(1, 3) - 1] + " " + getRandomInt(1, 10) + " " + operators[getRandomInt(1, 3) - 1] + " " + getRandomInt(1, 10)
                        points = 30
                    } else if (difficulty == 4) {
                        if (getRandomInt(1, 2) == 1) {
                            mathProblem = "(" + getRandomInt(1, 10) + " " + operators[getRandomInt(1, 3) - 1] + " " + getRandomInt(1, 10) + ") " + operators[getRandomInt(1, 3) - 1] + " " + getRandomInt(1, 10)
                        } else {
                            mathProblem = "" + getRandomInt(1, 10) + " " + operators[getRandomInt(1, 3) - 1] + " (" + getRandomInt(1, 10) + " " + operators[getRandomInt(1, 3) - 1] + " " + getRandomInt(1, 10) + ")"
                        }
                        points = 40
                    } else if (difficulty == 5) {
                        if (getRandomInt(1, 2) == 1) {
                            mathProblem = "((" + getRandomInt(1, 10) + " " + operators[getRandomInt(1, 3) - 1] + " " + getRandomInt(1, 10) + ") " + operators[getRandomInt(1, 3) - 1] + " " + getRandomInt(1, 10) + ") ^ " + getRandomInt(1, 10)
                        } else {
                            mathProblem = "(" + getRandomInt(1, 10) + " " + operators[getRandomInt(1, 3) - 1] + " (" + getRandomInt(1, 10) + " " + operators[getRandomInt(1, 3) - 1] + " " + getRandomInt(1, 10) + ")) ^ " + getRandomInt(1, 10)
                        }
                        points = 80
                    }

                    say("", "#tehhpro", "First person to answer this problem wins " + points + " " + options.pointsName + "! What is '" + mathProblem.replace("-", "minus").replace("+", "plus").replace("*", "times").replace("/", "divided by").replace("^", "to the power of") + ".'", false)
                    mathAnswer = eval(mathProblem);
                } else if (gameChoice == "Mr Steely") {
                    randomItem = CommonOfficeObjects[getRandomInt(1, CommonOfficeObjects.length) - 1]
                    if (randomItem == "bag of bobbish") {
                        points = 8;
                    }

                    if (randomItem == "plumbus") {
                        points = 6.5;
                    }

                    if (randomItem == "crushed red party cup") {
                        points = 15.5;
                    }
                    say("", "#tehhpro", "Whos '" + randomItem + "' is this? Type 'mine' to claim.", false)
                }
                clearTimeout(gameTimeout)
                gameTimeout = setTimeout(function () {
                    say("", "#tehhpro", "The game ended without a winner.", false)
                    randomEvent = false
                }, 30000)
                lastMessageFromBot = true
            }
        }
    });

    events.on("chat", function (channel, user, message) {
        lastMessageFromBot = false;
        if (randomEvent) {
            if (gameChoice == "Word Game") {
                if (message == word) {
                    clearTimeout(gameTimeout)
                    if (giveOrTake > 1) {
                        viewerDB.Viewers[user.username].points += points;
                        say(user, channel, "You won " + points + " " + options.pointsName + "! You now have " + round(viewerDB.Viewers[user.username].points) + " " + options.pointsName + ".", false)
                    } else {
                        viewerDB.Viewers[user.username].points -= points;
                        if (viewerDB.Viewers[user.username].points < 0) {
                            viewerDB.Viewers[user.username].points = 0
                        }
                        say(user, channel, "You lost " + points + " " + options.pointsName + "! You now have " + round(viewerDB.Viewers[user.username].points) + " " + options.pointsName + ".", false)
                    }
                    randomEvent = false
                }
            } else if (gameChoice == "Math Game") {
                if (message == "" + mathAnswer) {
                    clearTimeout(gameTimeout)
                    viewerDB.Viewers[user.username].points += points;
                    say(user, channel, "You won " + points + " " + options.pointsName + "! You now have " + round(viewerDB.Viewers[user.username].points) + " " + options.pointsName + ".", false)
                    randomEvent = false
                }
            } else if (gameChoice == "Mr Steely") {
                if (message == "mine") {
                    clearTimeout(gameTimeout)
                    viewerDB.Viewers[user.username].points += points;
                    say(user, channel, "You claim a '" + randomItem + "' that's " + points + " " + options.pointsName + "! You now have " + round(viewerDB.Viewers[user.username].points) + " " + options.pointsName + ".", false)
                    randomEvent = false
                }
            }
        }
    });
}
module.exports.init = init;
