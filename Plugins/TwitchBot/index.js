//Authour: DevL0rd
//GitHub: https://github.com/DevL0rd
//Initial requires.
var tmi = require('tmi.js');
var util = require('util');
var fs = require('fs');
var markov = require(__dirname + '/markov');
var m = markov(1);
var io = {}; //Gets loaded later
var botPlugins = [];
fs.readdirSync(__dirname + "/Plugins").forEach(function (file) {
    if (file.split(".").pop() == "js") {
        botPlugins[file.split(".").shift()] = require(__dirname + "/Plugins" + "/" + file);
    }
});
var markovBadWordListPath = __dirname + "/markov/MarkovBadWordList.txt";
var markovBrainPath = __dirname + "/markov/MarkovDB.json";

var DB = require('../../Devlord_modules/DB.js');
//Load DBS
if (fs.existsSync(__dirname + "/Config.json")) {
    var options = DB.load(__dirname + "/Config.json");
} else {
    var options = {
        options: {
            debug: true
        },
        connection: {
            cluster: "aws",
            reconnect: true
        },
        identity: {
            username: "",
            password: ""
        },
        "admins": ["tehhpro", "dev_l0rd", "kohda"],
        "channels": ["#channelname"],
        ignoredUsernames: ["nightbot"],
        pointGainPerMinute: 1,
        pointGainPerChatTick: 0.05,
        pointsPerChat: 0.5,
        pointsName: "points",
        markovEnabled: true,
        markovLearningChannels: [],
        markovDoesReply: true,
        markovLearningMaxLength: 100,
        markovFilterBadWords: true,
        muted: false,
        commandSpamTimeout: 2000,
        chatSpamTimeout: 1000,
        ViewerstoppedChattingTimeoutMinutes: 8,
        ChatsPerTickToWhisper: 4,
        whisperIsSubscriberOnly: true,
        whisperIsModOnly: false,
        broadcasts: {
            "#channelname": [{
                "broadcastIntervalMinutes": 10,
                "message": "To see all commands look below the stream."
            }]
        },
        viewerDbPath: __dirname + "/viewerDB.json",
        statsDbPath: __dirname + "/stats.json",
        purgeUserFromDbTimeoutDays: 30,
        botIsPaused: false,
        subsGetDoublePointGain: true
    }
}
var debug = options.options.debug
options.options.debug = false;
//correct channelformat
for (i in options.markovLearningChannels) {
    options.markovLearningChannels[i] = options.markovLearningChannels[i].toLowerCase();
    if (options.markovLearningChannels[i].charAt(0) != "#") {
        options.markovLearningChannels[i] = "#" + options.markovLearningChannels[i]
    }

}






//Load DBS
if (fs.existsSync(options.viewerDbPath)) {
    try {
        var viewerDB = DB.load(options.viewerDbPath)
    } catch (err) {
        log("Viewer DB corrupt, restoring backup.", true, "OTB")
        var viewerDB = DB.load(options.viewerDbPath + ".bkup")
    }

} else {
    var viewerDB = {
        Viewers: {}
    }
    DB.save(options.viewerDbPath, viewerDB)
}
if (fs.existsSync(options.statsDbPath)) {
    try {
        var statsDb = DB.load(options.statsDbPath)
    } catch (err) {
        log("Stats DB corrupt, restoring backup.", true, "OTB")

        var statsDb = DB.load(options.statsDbPath + ".bkup")
    }
} else {
    var statsDb = {
        commandUsage: {}
    }
    DB.save(options.statsDbPath, statsDb)
}
if (fs.existsSync(markovBadWordListPath)) {
    var texts = fs.readFileSync(markovBadWordListPath).toString('utf-8');
    var badwords = texts.split("\r\n")
} else {
    var badwords = [];
}

m.readExternal(markovBrainPath);

if (fs.existsSync(__dirname + '/new.txt')) {
    log("Markov: Loading New text to learn...", false, "OTB")
    var s = fs.createReadStream(__dirname + '/new.txt');
    m.seed(s, function () {
        m.writeExternal()
    });
}
var client = new tmi.client(options);



var blessings = 0;
var commands = {};
var display = {};
var markovReponses = []
var events = {
    "connected": [],
    "disconnected": [],
    "reconnect": [],
    "logon": [],
    "join": [],
    "leave": [],
    "roomstate": [],
    "hosting": [],
    "hosted": [],
    "unhost": [],
    "mod": [],
    "unmod": [],
    "cheer": [],
    "clearchat": [],
    "subscription": [],
    "resub": [],
    "timeout": [],
    "slowmode": [],
    "serverchange": [],
    "subscribers": [],
    "followersonly": [],
    "emotesets": [],
    "emoteonly": [],
    "r9kbeta": [],
    "ping": [],
    "pong": [],
    "notice": [],
    "tick": [],
    "chat": [],
    "whisper": [],
    "ban": [],
    "audioComplete": [],
    "on": function (event, callback) {
        if (this[event] != null) {
            this[event].push(callback)
        } else {
            log("ERROR: Event '" + event + "' is not found.", true, "OTB")
        }
    }
};

var lastChat = 0;
var lastMessageWasBots = true;
var spamClearTimeout;


function addViewerToDB(user) {
    viewerDB.Viewers[user] = {};
    viewerDB.Viewers[user].points = 0;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isAdmin(user) {
    return options.admins.includes(user)
}

function round(inty) {
    return Math.round(inty * 100) / 100;
}

function tryToAnswer(channel, user, message, isPrivate = false, directedToBot = true) {
    try {
        message = message.toLowerCase();
        var reponse = "";
        for (i in markovReponses) {
            if (markovReponses[i](user, channel, message, isPrivate, (directedToBot || isPrivate))) {
                return true;
            }
        }
        return false;
    } catch (err) {
        log(err, true, "OTB")
        return false;
    }
}



function containsBadWord(str) {
    var words = str.toLowerCase().replace(".", " ").replace("/", " ").replace("!", " ").replace("?", " ").replace("*", " ").split(" ")
    for (var i in words) {
        if (badwords.includes(words[i])) {
            return true;
        }
    }
    return false;
}

function feedMarkov(user, message) {
    if (user && !user.includes("bot") && user != options.identity.username.toLowerCase() && !options.ignoredUsernames.includes(user.username) && message.charAt(0) != "!" && !message.includes("*") && !message.includes("/") && !message.includes("http") && !message.includes("@") && message.length < options.markovLearningMaxLength) {
        if (options.markovFilterBadWords) {
            if (!containsBadWord(message)) {
                m.seed(message.replace("!", "! ").replace('"', "").replace("'", ""))
                m.writeExternal(markovBrainPath)
            }
        } else {
            m.seed(message.replace("!", "! ").replace('"', "").replace("'", ""))
            m.writeExternal(markovBrainPath)
        }
    }
}
process.stdin.on('data', function (line) {
    say(options.channels[0], "", line.toString(), false);
});


var log = function () {

}
var droppedPoints = 0
var droppedPointsTimeout

function say(user, channel, msg, isPrivate = false) {
    if (isPrivate) {
        client.whisper(user.username, msg)
        if (debug) {
            log("[WHISPER_RESPONSE] <" + user.username + ">: " + msg, false, "CHAT")
        }
    } else {
        if (user != null && user.username != null) {
            client.say(channel, "@" + user.username + " " + msg)
        } else {
            client.say(channel, msg)
        }

    }
}

function tryResolvingCommand(channel, user, message, isPrivate = false) {

    // if (ChatsBeforeTimeout >= options.ChatsPerTickToWhisper) {
    // isPrivate = true;
    // }
    try {


        if (message.charAt(0) === "!") {
            if (user.mod || isAdmin(user.username) || isPrivate || new Date().getTime() >= viewerDB.Viewers[user.username].nextCommandAllowed) {

                var command = message.split("!")[1].toLowerCase();
                viewerDB.Viewers[user.username].nextCommandAllowed = new Date().getTime() + options.commandSpamTimeout;
                //Commands

                if (command == "about") {

                    say(user, channel, "This is a bot created by dev_l0rd for tehhpro, with love <3.", isPrivate)

                } else if (commands[command.split(" ")[0]] != null) {
                    var pointsBefore = viewerDB.Viewers[user.username].points

                    commands[command.split(" ")[0]](channel, user, message, command, isPrivate);

                    var pointsAfter = viewerDB.Viewers[user.username].points
                    var pointDifference = pointsBefore - pointsAfter
                    if (viewerDB.Viewers[user.username].largestPurchase == null) {
                        viewerDB.Viewers[user.username].largestPurchase = {};
                        viewerDB.Viewers[user.username].largestPurchase.price = pointDifference
                        viewerDB.Viewers[user.username].largestPurchase.command = command.split(" ")[0]
                    } else {
                        if (pointDifference > viewerDB.Viewers[user.username].largestPurchase.price) {
                            viewerDB.Viewers[user.username].largestPurchase.price = pointDifference
                            viewerDB.Viewers[user.username].largestPurchase.command = command.split(" ")[0]
                        }

                    }
                    if (statsDb.commandUsage[command.split(" ")[0]] == null) {
                        statsDb.commandUsage[command.split(" ")[0]] = 1
                    } else {
                        statsDb.commandUsage[command.split(" ")[0]]++;
                    }
                    if (viewerDB.Viewers[user.username].highscore == null) {
                        viewerDB.Viewers[user.username].highscore = viewerDB.Viewers[user.username].points + viewerDB.Viewers[user.username].bank
                    } else {
                        if (viewerDB.Viewers[user.username].points + viewerDB.Viewers[user.username].bank > viewerDB.Viewers[user.username].highscore) {
                            viewerDB.Viewers[user.username].highscore = viewerDB.Viewers[user.username].points + viewerDB.Viewers[user.username].bank
                        }
                    }
                } else if (command == "biggestpurchase" || command == "largestpurchase" || command == "lp") {
                    if (viewerDB.Viewers[user.username].largestPurchase != null) {
                        say(user, channel, "Your largest purchase was on the command '" + viewerDB.Viewers[user.username].largestPurchase.command + "' for " + round(viewerDB.Viewers[user.username].largestPurchase.price) + " " + options.pointsName + ".", isPrivate)
                    } else {
                        say(user, channel, "You have not spent any points yet.", isPrivate)
                    }
                } else if (command == "highscore" || command == "hs") {
                    if (viewerDB.Viewers[user.username].highscore == null) {
                        viewerDB.Viewers[user.username].highscore = viewerDB.Viewers[user.username].points + viewerDB.Viewers[user.username].bank
                    }
                    say(user, channel, "Your high score is " + round(viewerDB.Viewers[user.username].highscore) + " " + options.pointsName + ".", isPrivate)
                } else if (command == "help" || command == "commands") {
                    say(user, channel, "Look below the stream to read the commands list.", isPrivate)
                    if (statsDb.commandUsage[command.split(" ")[0]] == null) {
                        statsDb.commandUsage[command.split(" ")[0]] = 1
                    } else {
                        statsDb.commandUsage[command.split(" ")[0]]++;
                    }
                } else if (command == "brainstats" || command == "bs") {
                    var stats = fs.statSync(markovBrainPath)
                    var fileSizeInBytes = stats.size
                    var fileSizeInMegabytes = fileSizeInBytes / 1000000.0
                    say(user, channel, "My brain is holding " + round(fileSizeInMegabytes) + " MB of data", isPrivate)
                    if (statsDb.commandUsage[command.split(" ")[0]] == null) {
                        statsDb.commandUsage[command.split(" ")[0]] = 1
                    } else {
                        statsDb.commandUsage[command.split(" ")[0]]++;
                    }
                } else if (command.split(" ")[0] == "bank") {
                    say(user, channel, "Bank: " + round(viewerDB.Viewers[user.username].bank) + ". Pocket: " + round(viewerDB.Viewers[user.username].points) + ".", isPrivate)
                    if (viewerDB.Viewers[user.username].highscore == null) {
                        viewerDB.Viewers[user.username].highscore = viewerDB.Viewers[user.username].points + viewerDB.Viewers[user.username].bank
                    } else {
                        if (viewerDB.Viewers[user.username].points + viewerDB.Viewers[user.username].bank > viewerDB.Viewers[user.username].highscore) {
                            viewerDB.Viewers[user.username].highscore = viewerDB.Viewers[user.username].points + viewerDB.Viewers[user.username].bank
                        }
                    }
                    if (statsDb.commandUsage[command.split(" ")[0]] == null) {
                        statsDb.commandUsage[command.split(" ")[0]] = 1
                    } else {
                        statsDb.commandUsage[command.split(" ")[0]]++;
                    }
                } else if (command.split(" ")[0] == "points" || command.split(" ")[0] == options.pointsName.toLowerCase()) {
                    if (command.split(" ")[1] != null) {
                        var username = command.split(" ")[1]
                        if (viewerDB.Viewers[username] != null) {
                            say(user, channel, username + " has " + round(viewerDB.Viewers[username].points) + " " + options.pointsName + ".", isPrivate)
                        } else {
                            say(user, channel, username + " not found.", isPrivate)
                        }
                    } else {
                        say(user, channel, "You have " + round(viewerDB.Viewers[user.username].points) + " " + options.pointsName + ".", isPrivate)
                        if (viewerDB.Viewers[user.username].highscore == null) {
                            viewerDB.Viewers[user.username].highscore = viewerDB.Viewers[user.username].points + viewerDB.Viewers[user.username].bank
                        } else {
                            if (viewerDB.Viewers[user.username].points + viewerDB.Viewers[user.username].bank > viewerDB.Viewers[user.username].highscore) {
                                viewerDB.Viewers[user.username].highscore = viewerDB.Viewers[user.username].points + viewerDB.Viewers[user.username].bank
                            }
                        }
                    }
                    if (statsDb.commandUsage[command.split(" ")[0]] == null) {
                        statsDb.commandUsage[command.split(" ")[0]] = 1
                    } else {
                        statsDb.commandUsage[command.split(" ")[0]]++;
                    }
                } else if (command.split(" ")[0] == "give") {
                    if (command.split(" ")[1] != null) {
                        var viewer = command.split(" ")[1]
                        if (viewerDB.Viewers[viewer] != null) {
                            var ammount = parseInt(command.split(" ")[2]);
                            if ("" + ammount != "NaN") {
                                if (ammount > 0) {
                                    if ((user.mod || isAdmin(user.username)) || viewerDB.Viewers[user.username].points >= ammount) {
                                        if (!(user.mod || isAdmin(user.username))) {
                                            viewerDB.Viewers[user.username].points -= ammount
                                        }
                                        viewerDB.Viewers[viewer].points += ammount
                                        say(user, channel, ammount + " " + options.pointsName + " were transfered to " + viewer + ".", isPrivate)
                                    } else {
                                        say(user, channel, "You do not have " + round(ammount) + " " + options.pointsName + ". You only have " + round(viewerDB.Viewers[user.username].points) + " " + options.pointsName + ".", isPrivate)
                                    }
                                } else {
                                    say(user, channel, "You can only send a positive amount of " + options.pointsName + ".", isPrivate)
                                }
                            } else {
                                say(user, channel, "Usage: !give <user> <amount>", isPrivate)
                            }
                        } else {
                            say(user, channel, user.username + " " + viewer + " not found.", isPrivate)
                        }
                    } else {
                        say(user, channel, "Usage: !give <user> <amount>", isPrivate)
                    }
                    if (statsDb.commandUsage[command.split(" ")[0]] == null) {
                        statsDb.commandUsage[command.split(" ")[0]] = 1
                    } else {
                        statsDb.commandUsage[command.split(" ")[0]]++;
                    }
                } else if (command.split(" ")[0] == "take") {
                    if ((user.mod || isAdmin(user.username))) {
                        if (command.split(" ")[1] != null) {
                            var viewer = command.split(" ")[1]
                            if (viewerDB.Viewers[viewer] != null) {
                                var ammount = parseInt(command.split(" ")[2]);
                                if ("" + ammount != "NaN") {
                                    if (ammount > 0) {
                                        viewerDB.Viewers[viewer].points -= ammount
                                        say(user, channel, ammount + " " + options.pointsName + " were taken from " + viewer + ".", isPrivate)
                                    } else {
                                        say(user, channel, "You can only take a positive amount of " + options.pointsName + ".", isPrivate)
                                    }
                                } else {
                                    say(user, channel, "Usage: !take <user> <amount>", isPrivate)
                                }
                            } else {
                                say(user, channel, viewer + " not found.", isPrivate)
                            }
                        } else {
                            say(user, channel, "Usage: !take <user> <amount>", isPrivate)
                        }
                    } else {
                        say(user, channel, "You must be a moderator to use that command.", isPrivate)
                    }
                    if (statsDb.commandUsage[command.split(" ")[0]] == null) {
                        statsDb.commandUsage[command.split(" ")[0]] = 1
                    } else {
                        statsDb.commandUsage[command.split(" ")[0]]++;
                    }
                } else if (command.split(" ")[0] == "drop") {
                    if (command.split(" ")[1] != null) {
                        var ammount = parseInt(command.split(" ")[1]);
                        if ("" + ammount != "NaN") {
                            if (ammount > 0) {
                                if (ammount <= viewerDB.Viewers[user.username].points) {
                                    droppedPoints += ammount
                                    viewerDB.Viewers[user.username].points -= ammount
                                    say("", channel, ammount + " " + options.pointsName + " was dropped. To claim type '!claim'.", isPrivate)
                                } else {
                                    say(user, channel, "You only have " + viewerDB.Viewers[user.username].points + " " + options.pointsName + ".", isPrivate)
                                }
                            } else {
                                say(user, channel, "You can only drop a positive amount of " + options.pointsName + ".", isPrivate)
                            }
                        } else {
                            say(user, channel, "Usage: !drop <amount>", isPrivate)
                        }
                    } else {
                        say(user, channel, "Usage: !drop <amount>", isPrivate)
                    }
                    if (statsDb.commandUsage[command.split(" ")[0]] == null) {
                        statsDb.commandUsage[command.split(" ")[0]] = 1
                    } else {
                        statsDb.commandUsage[command.split(" ")[0]]++;
                    }
                } else if (command.split(" ")[0] == "claim") {
                    if (droppedPoints > 0) {
                        viewerDB.Viewers[user.username].points += droppedPoints
                        say(user, channel, "You claimed " + droppedPoints + " " + options.pointsName + ". You now have " + round(viewerDB.Viewers[user.username].points) + " " + options.pointsName + ".", isPrivate)
                        droppedPoints = 0;
                    }
                    if (viewerDB.Viewers[user.username].highscore == null) {
                        viewerDB.Viewers[user.username].highscore = viewerDB.Viewers[user.username].points + viewerDB.Viewers[user.username].bank
                    } else {
                        if (viewerDB.Viewers[user.username].points + viewerDB.Viewers[user.username].bank > viewerDB.Viewers[user.username].highscore) {
                            viewerDB.Viewers[user.username].highscore = viewerDB.Viewers[user.username].points + viewerDB.Viewers[user.username].bank
                        }
                    }
                    if (statsDb.commandUsage[command.split(" ")[0]] == null) {
                        statsDb.commandUsage[command.split(" ")[0]] = 1
                    } else {
                        statsDb.commandUsage[command.split(" ")[0]]++;
                    }
                } else if (command.split(" ")[0] == "deposit") {
                    if (user.subscriber || user.mod || isAdmin(user.username)) {

                        var ammount
                        if (command.split(" ")[1] != null) {
                            if (command.split(" ")[1] == "all") {
                                ammount = viewerDB.Viewers[user.username].points
                            } else if (command.split(" ")[1] == "half") {
                                ammount = viewerDB.Viewers[user.username].points / 2
                            } else {
                                ammount = parseInt(command.split(" ")[1]);
                            }
                        } else {
                            ammount = "NaN"
                        }
                        if ("" + ammount != "NaN") {
                            if (ammount > 0) {
                                if (ammount <= viewerDB.Viewers[user.username].points) {
                                    viewerDB.Viewers[user.username].bank += ammount
                                    viewerDB.Viewers[user.username].points -= ammount
                                    say(user, channel, "Bank: " + round(viewerDB.Viewers[user.username].bank) + ". Pocket: " + round(viewerDB.Viewers[user.username].points) + ".", isPrivate)
                                    if (viewerDB.Viewers[user.username].highscore == null) {
                                        viewerDB.Viewers[user.username].highscore = viewerDB.Viewers[user.username].points + viewerDB.Viewers[user.username].bank
                                    } else {
                                        if (viewerDB.Viewers[user.username].points + viewerDB.Viewers[user.username].bank > viewerDB.Viewers[user.username].highscore) {
                                            viewerDB.Viewers[user.username].highscore = viewerDB.Viewers[user.username].points + viewerDB.Viewers[user.username].bank
                                        }
                                    }
                                } else {
                                    say(user, channel, "You only have " + viewerDB.Viewers[user.username].bank + " " + options.pointsName + ".", isPrivate)
                                }

                            } else {
                                say(user, channel, "You can only deposit a positive amount of " + options.pointsName + ".", isPrivate)
                            }
                        } else {
                            say(user, channel, "Usage: deposit <ammount>", isPrivate)
                        }
                    } else {
                        say(user, channel, "You must be subscriber to use this command.", isPrivate)
                    }
                    if (statsDb.commandUsage[command.split(" ")[0]] == null) {
                        statsDb.commandUsage[command.split(" ")[0]] = 1
                    } else {
                        statsDb.commandUsage[command.split(" ")[0]]++;
                    }
                } else if (command.split(" ")[0] == "withdraw") {
                    if (command.split(" ")[1] != null) {
                        if (command.split(" ")[1] == "all") {
                            ammount = viewerDB.Viewers[user.username].bank
                        } else if (command.split(" ")[1] == "half") {
                            ammount = viewerDB.Viewers[user.username].bank / 2
                        } else {
                            ammount = parseInt(command.split(" ")[1]);
                        }

                        if ("" + ammount != "NaN") {
                            if (ammount > 0) {
                                if (ammount <= viewerDB.Viewers[user.username].bank) {
                                    viewerDB.Viewers[user.username].bank -= ammount
                                    viewerDB.Viewers[user.username].points += ammount
                                    say(user, channel, "Bank: " + round(viewerDB.Viewers[user.username].bank) + ". Pocket: " + round(viewerDB.Viewers[user.username].points) + ".", isPrivate)
                                } else {
                                    say(user, channel, "You only have " + viewerDB.Viewers[user.username].bank + " " + options.pointsName + ".", isPrivate)
                                }

                            } else {
                                say(user, channel, "You can only withdraw a positive amount of " + options.pointsName + ".", isPrivate)
                            }
                        } else {
                            say(user, channel, "Usage: !withdraw <ammount>", isPrivate)
                        }
                    } else {
                        say(user, channel, "Usage: !withdraw <ammount>", isPrivate)
                    }
                    if (statsDb.commandUsage[command.split(" ")[0]] == null) {
                        statsDb.commandUsage[command.split(" ")[0]] = 1
                    } else {
                        statsDb.commandUsage[command.split(" ")[0]]++;
                    }
                } else if (command == "mostpoints") {
                    var highestPoints = 0;
                    var highestPlayer = "Nobody";
                    for (var i in viewerDB.Viewers) {
                        if (viewerDB.Viewers[i] != null) {
                            if (viewerDB.Viewers[i].bank == null) {
                                viewerDB.Viewers[i].bank = 0
                            }

                            if (highestPoints < viewerDB.Viewers[i].points + viewerDB.Viewers[i].bank) {
                                highestPoints = viewerDB.Viewers[i].points + viewerDB.Viewers[i].bank;
                                highestPlayer = i;
                            }
                        }
                    }
                    say(user, channel, highestPlayer + " has the most " + options.pointsName + " at " + round(highestPoints) + " " + options.pointsName + ".", isPrivate)
                    if (statsDb.commandUsage[command.split(" ")[0]] == null) {
                        statsDb.commandUsage[command.split(" ")[0]] = 1;
                    } else {
                        statsDb.commandUsage[command.split(" ")[0]]++;
                    }
                } else if (command == "website") {
                    say(user, channel, "Follow this link and look around the site for 5 minutes to redeem 150 points -> http://www.powerpwn.com/?twitchName=" + user.username + "/", isPrivate)
                    if (statsDb.commandUsage[command.split(" ")[0]] == null) {
                        statsDb.commandUsage[command.split(" ")[0]] = 1;
                    } else {
                        statsDb.commandUsage[command.split(" ")[0]]++;
                    }
                } else if (command == "pausebot") {
                    options.botIsPaused = true;
                    say(user, channel, "Bot paused", isPrivate);

                    if (statsDb.commandUsage[command.split(" ")[0]] == null) {
                        statsDb.commandUsage[command.split(" ")[0]] = 1;
                    } else {
                        statsDb.commandUsage[command.split(" ")[0]]++;
                    }
                    DB.save(__dirname + "/Config.json", options)
                } else if (command == "unpausebot" && options.botIsPaused) {
                    options.botIsPaused = false;
                    say(user, channel, "Bot un-paused", isPrivate);

                    if (statsDb.commandUsage[command.split(" ")[0]] == null) {
                        statsDb.commandUsage[command.split(" ")[0]] = 1
                    } else {
                        statsDb.commandUsage[command.split(" ")[0]]++;
                    }
                    DB.save(__dirname + "/Config.json", options)
                } else if (user.mod || isAdmin(user.username)) {
                    //moderatorCommands
                    if (isAdmin(user.username)) {
                        //Admin commands
                        if (options.markovEnabled && command == "mute") {
                            if (options.markovDoesReply) {
                                options.markovDoesReply = false;
                                say(user, channel, "Markov response muted.", isPrivate)

                            } else {
                                options.markovDoesReply = true;
                                say(user, channel, "Markov response un-muted.", isPrivate)
                            }
                            if (statsDb.commandUsage[command.split(" ")[0]] == null) {
                                statsDb.commandUsage[command.split(" ")[0]] = 1
                            } else {
                                statsDb.commandUsage[command.split(" ")[0]]++;
                            }
                        } else if (options.markovEnabled && command == "markovtest" || command == "mt") {
                            var res = m.respond("").join(' ');
                            say(user, channel, res.replace("/", "").replace("!", ""), isPrivate)
                            if (statsDb.commandUsage[command.split(" ")[0]] == null) {
                                statsDb.commandUsage[command.split(" ")[0]] = 1
                            } else {
                                statsDb.commandUsage[command.split(" ")[0]]++;
                            }
                        } else if (command == "rest") {
                            var res = m.respond("").join(' ');
                            for (var chani in options.channels) {
                                if (!options.markovLearningChannels.includes(options.channels[chani])) {
                                    say("", options.channels[chani], "Server is restarting.", false)
                                }
                            }

                            saveAll()
                            setTimeout(function () {
                                process.exit()
                            }, 2000)
                        }

                    }


                } else {
                    return false;
                }
            } else {
                viewerDB.Viewers[user.username].nextCommandAllowed = new Date().getTime() + options.commandSpamTimeout;
                //Spamming commands
                if (viewerDB.Viewers[user.username] != null) {
                    if (viewerDB.Viewers[user.username].warnings == null) {
                        viewerDB.Viewers[user.username].warnings = 0;
                    }
                    clearTimeout(spamClearTimeout);
                    viewerDB.Viewers[user.username].warnings++;
                    if (viewerDB.Viewers[user.username].warnings == 1) {
                        say(user, channel, "Please slow down with the commands.", false)
                        spamClearTimeout = setTimeout(function () {
                            viewerDB.Viewers[user.username].warnings = 0;
                        }, 10000)
                    } else if (viewerDB.Viewers[user.username].warnings == 2) {
                        say(user, channel, "Seriously, stop spamming or I'm going to ban you...", false)
                        spamClearTimeout = setTimeout(function () {
                            viewerDB.Viewers[user.username].warnings = 0;
                        }, 10000)
                    } else {
                        say(user, channel, "See yah.", false)
                        client.ban(channel, user, "Spam");
                        delete viewerDB.Viewers[user];
                    }
                }
                return false;
            }
            return true;
        } else {
            return false;
        }
    } catch (err) {
        log(err, true, "OTB")
        return false;
    }
}

function saveAll() {
    DB.save(options.viewerDbPath, viewerDB);
    DB.save(options.statsDbPath, statsDb)
    setTimeout(function () {
        DB.save(options.viewerDbPath + ".bkup", viewerDB);
        DB.save(options.statsDbPath + ".bkup", statsDb)
    }, 1000)
}
setInterval(function () {
    saveAll()
    ChatsBeforeTimeout = 0;
}, 5000)
setInterval(function () {
    if (!options.botIsPaused) {
        var nowMS = new Date().getTime();
        for (var user in viewerDB.Viewers) {
            // skip loop if the property is from prototype
            if (viewerDB.Viewers[user] != null && user.username != options.identity.username.toLowerCase() && !options.ignoredUsernames.includes(user)) {
                if (viewerDB.Viewers[user].stoppedChattingTimeout != null) {
                    if (nowMS < viewerDB.Viewers[user].stoppedChattingTimeout) {
                        if (options.subsGetDoublePointGain && viewerDB.Viewers[user].subscribed) {
                            viewerDB.Viewers[user].points += options.pointGainPerChatTick * 2;
                        } else {
                            viewerDB.Viewers[user].points += options.pointGainPerChatTick;
                        }
                    }
                }

                if (viewerDB.Viewers[user].playerDeleteTimeout != null) {
                    if (nowMS >= viewerDB.Viewers[user].playerDeleteTimeout) {
                        delete viewerDB.Viewers[user];
                    }
                }
            }
        }

        if (!options.muted) {
            for (var chani in options.channels) {
                if (!options.markovLearningChannels.includes(options.channels[chani])) {
                    if (options.broadcasts[options.channels[chani]] != null && !lastMessageWasBots) {
                        for (var i in options.broadcasts[options.channels[chani]]) {
                            if (options.broadcasts[options.channels[chani]][i].nextBroadcast == null) {
                                options.broadcasts[options.channels[chani]][i].nextBroadcast = new Date().getTime() + ((options.broadcasts[options.channels[chani]][i].broadcastIntervalMinutes * 60) * 1000)
                            }
                            if (nowMS >= options.broadcasts[options.channels[chani]][i].nextBroadcast) {
                                options.broadcasts[options.channels[chani]][i].nextBroadcast = new Date().getTime() + ((options.broadcasts[options.channels[chani]][i].broadcastIntervalMinutes * 60) * 1000)
                                //delay by 10 seconds in case user just typed.
                                say("", options.channels[chani], options.broadcasts[options.channels[chani]][i].message, false)
                            }
                        }
                        lastMessageWasBots = true;
                    }
                }
            }
        }
        for (i in events["tick"]) {
            events["tick"][i]()
        }
    }
}, 1000)
var ChatsBeforeTimeout = 0;
var ChatsBeforeTimeoutTimeout

function init(serverPlugins, serverSettings, serverEvents, io, newlog, serverCommands) {
    log = newlog
    //on io connection, setup client data
    serverEvents['connection'].push(function (socket) {
        socket.on('audioComplete', function (msgObject) {
            for (i in events["audioComplete"]) {
                events["audioComplete"][i]()
            }
        });
    });


    client.on("connected", function (address, port) {
        for (var chani in options.channels) {
            if (!options.markovLearningChannels.includes(options.channels[chani])) {
                say("", options.channels[chani], "Connected.", false)
            }
        }
        log("Connected to '" + address + "' on port '" + port + "'.", false, "IRC")
        for (i in events["connected"]) {
            events["connected"][i](address, port)
        }
    });
    client.on("disconnected", function (reason) {
        log("Disconnected: " + reason, false, "IRC")
        for (i in events["disconnected"]) {
            events["disconnected"][i](reason)
        }
    });
    client.on("reconnect", function () {
        log("Reconnected.", false, "IRC")
        for (i in events["reconnect"]) {
            events["reconnect"][i]()
        }
    });
    client.on("logon", function () {

        if (debug) {
            log("Bot authenticated.", false, "IRC")
        }
        for (i in events["logon"]) {
            events["logon"][i]()
        }
    });
    var saveDBTimeout
    client.on("join", function (channel, user, self) {
        if (!options.markovLearningChannels.includes(channel)) {
            for (i in events["join"]) {
                events["join"][i](channel, user, self)
            }
            if (user != options.identity.username.toLowerCase() && !options.ignoredUsernames.includes(user)) {

                var firstTime = false;
                if (viewerDB.Viewers[user] == null) {
                    addViewerToDB(user);
                }
                viewerDB.Viewers[user].lastChat = new Date().getTime();
                viewerDB.Viewers[user].stoppedChattingTimeout = new Date().getTime() + ((options.ViewerstoppedChattingTimeoutMinutes * 60) * 1000);
                viewerDB.Viewers[user].playerDeleteTimeout = new Date().getTime() + ((((options.purgeUserFromDbTimeoutDays * 24) * 60) * 60) * 1000);
                if (options.subsGetDoublePointGain && viewerDB.Viewers[user].subscribed) {
                    viewerDB.Viewers[user].points += options.pointGainPerMinute * 2;
                } else {
                    viewerDB.Viewers[user].points += options.pointGainPerMinute;
                }

                if (viewerDB.Viewers[user].highscore == null) {
                    viewerDB.Viewers[user].highscore = viewerDB.Viewers[user].points
                } else {
                    if (viewerDB.Viewers[user].points > viewerDB.Viewers[user].highscore) {
                        viewerDB.Viewers[user].highscore = viewerDB.Viewers[user].points
                    }
                }
                viewerDB.Viewers[user].lastChannel = channel;
                if (viewerDB.Viewers[user].subscribed == null) {
                    viewerDB.Viewers[user].subscribed = user.subscriber;
                }

            }
        }

    });

    client.on("part", function (channel, username, self) {
        if (!options.markovLearningChannels.includes(channel)) {

            for (i in events["leave"]) {
                events["leave"][i](channel, username, self)
            }
            //User left
            //Set delete time from server
            if (viewerDB.Viewers[username] != null) {
                viewerDB.Viewers[username].playerDeleteTimeout = new Date().getTime() + ((((options.purgeUserFromDbTimeoutDays * 24) * 60) * 60) * 1000);
            }
        }
    });
    client.on("roomstate", function (channel, state) {
        if (!options.markovLearningChannels.includes(channel)) {
            for (i in events["roomstate"]) {
                events["roomstate"][i](channel, state)
            }
        }
    });
    client.on("hosting", function (channel, target, viewers) {
        if (!options.markovLearningChannels.includes(channel)) {
            if (debug) {
                log("[" + channel + "]: Now hosting " + target + " for " + viewers + " viewers.", false, "IRC");
            }
            for (i in events["hosting"]) {
                events["hosting"][i](channel, target, viewers);
            }
        }
    });
    client.on("hosted", function (channel, username, viewers, autohost) {
        if (!options.markovLearningChannels.includes(channel)) {
            if (debug) {
                log("[" + channel + "] " + username + " is now hosting this channel for " + viewers + " viewers.", false, "IRC");
            }
            for (i in events["hosted"]) {
                events["hosted"][i](channel, username, viewers, autohost);
            }
        }
    });
    client.on("unhost", function (channel, viewers) {
        if (!options.markovLearningChannels.includes(channel)) {
            if (debug) {
                log("[" + channel + "] Un-Hosting " + channel + ".", false, "IRC");
            }
            for (i in events["unhost"]) {
                events["unhost"][i](channel, viewers);
            }
        }
    });

    client.on("mod", function (channel, username) {
        if (!options.markovLearningChannels.includes(channel)) {
            for (i in events["mod"]) {
                events["mod"][i](channel, username);
            }
        }
    });
    client.on("unmod", function (channel, username) {
        if (!options.markovLearningChannels.includes(channel)) {
            for (i in events["unmod"]) {
                events["unmod"][i](channel, username);
            }
        }
    });
    client.on("cheer", function (channel, userstate, message) {
        if (viewerDB.Viewers[userstate.username] == null) {
            addViewerToDB(userstate.username);
        }
        if (!options.markovLearningChannels.includes(channel)) {
            viewerDB.Viewers[userstate.username].points += userstate.bits * 2;
            say({
                username: userstate.username
            }, channel, "Thanks for the cheer! You have been awarded " + (userstate.bits * 2) + " " + options.pointsName + "!", false)
            if (viewerDB.Viewers[userstate.username].totalBits == null) {
                viewerDB.Viewers[user].totalBits = userstate.bits
            } else {
                viewerDB.Viewers[user].totalBits += userstate.bits
            }
            for (i in events["cheer"]) {
                events["cheer"][i](channel, userstate, message)
            }
        }
    });
    client.on("clearchat", function (channel) {
        if (!options.markovLearningChannels.includes(channel)) {
            if (debug) {
                log("[" + channel + "] Cleared chat.", false, "IRC")
            }
            for (i in events["clearchat"]) {
                events["clearchat"][i](channel)
            }
        }
    });
    client.on("subscription", function (channel, username, method, message, userstate) {
        username = username.toLowerCase()
        if (viewerDB.Viewers[username] == null) {
            addViewerToDB(username);
        }
        if (!options.markovLearningChannels.includes(channel)) {

            viewerDB.Viewers[username].points += 2000;
            say({
                username: username
            }, channel, "Thanks for the sub! You have been awarded 2000 " + options.pointsName + "!", false)
            if (options.subsGetDoublePointGain) {
                say({
                    username: username
                }, channel, "You now gain double points from viewing and chatting.", false)
            }
            say({
                username: username
            }, channel, "You can now wisper the bot. For other subscriber benifits look in the channel secription.", false)
            for (i in events["subscription"]) {
                events["subscription"][i](channel, username, method, message, userstate)
            }
        }
    });

    client.on("resub", function (channel, username, months, message, userstate, methods) {
        if (!options.markovLearningChannels.includes(channel)) {
            for (i in events["resub"]) {
                events["resub"][i](channel, username, months, message, userstate, methods)
            }
        }
    });
    client.on("timeout", function (channel, username, reason, duration) {
        if (!options.markovLearningChannels.includes(channel)) {
            if (debug) {
                log("[" + channel + "] " + username + " has been timed out. " + reason, false, "IRC")
            }
            for (i in events["timeout"]) {
                events["timeout"][i](channel, username, reason, duration)
            }
        }
    });
    client.on("slowmode", function (channel, enabled, length) {
        if (!options.markovLearningChannels.includes(channel)) {
            if (debug) {
                log("[" + channel + "] Slow mode " + enabled + ".", false, "IRC")
            }
            //Channel enabled or disabled slow mode.
            for (i in events["slowmode"]) {
                events["slowmode"][i](channel, enabled, length)
            }
        }
    });

    client.on("serverchange", function (channel) {
        if (!options.markovLearningChannels.includes(channel)) {
            if (debug) {
                log("[" + channel + "] Slow mode " + enabled + ".", false, "IRC")
            }
            //Channel is no longer located on same server.
            for (i in events["serverchange"]) {
                events["serverchange"][i](channel)
            }
        }
    });
    client.on("subscribers", function (channel, enabled) {
        if (!options.markovLearningChannels.includes(channel)) {
            if (debug) {
                log("[" + channel + "] Subscriber only mode " + enabled + ".", false, "IRC")
            }
            //Channel enabled or disabled subscribers-only mode.
            for (i in events["subscribers"]) {
                events["subscribers"][i](channel, enabled)
            }
        }
    });
    client.on("followersonly", function (channel, enabled, length) {
        if (!options.markovLearningChannels.includes(channel)) {
            if (debug) {
                log("[" + channel + "] Followers only mode " + enabled + ".", false, "IRC")
            }
            //Channel enabled or disabled followers-only mode.
            for (i in events["followersonly"]) {
                events["followersonly"][i](channel, enabled, length)
            }
        }
    });
    client.on("emotesets", function (sets, obj) {
        if (debug) {
            log("Retreived new emote set.", false, "IRC")
        }
        //Emote list from twitch:
        //console.log(obj);
        for (i in events["emotesets"]) {
            events["emotesets"][i](sets, obj)
        }
    });
    client.on("emoteonly", function (channel, enabled) {
        if (!options.markovLearningChannels.includes(channel)) {
            if (debug) {
                log("[" + channel + "] Emote only mode " + enabled + ".", false, "IRC")
            }
            //Channel enabled or disabled emote-only mode.
            for (i in events["emoteonly"]) {
                events["emoteonly"][i](channel, enabled)
            }
        }
    });
    client.on("r9kbeta", function (channel, enabled) {
        if (!options.markovLearningChannels.includes(channel)) {
            if (debug) {
                log("[" + channel + "] R9K mode " + enabled + ".", false, "IRC")
            }
            //Channel enabled or disabled R9K mode.
            for (i in events["r9kbeta"]) {
                events["r9kbeta"][i](channel, enabled)
            }
        }
    });
    client.on("ping", function () {
        for (i in events["ping"]) {
            events["ping"][i]()
        }
    });
    client.on("pong", function (latency) {
        for (i in events["pong"]) {
            events["pong"][i](latency)
        }
    });
    client.on("notice", function (channel, msgid, message) {
        if (!options.markovLearningChannels.includes(channel)) {
            if (debug) {
                log("[" + channel + "] <NOTICE>: " + message + ".", false, "IRC")
            }
            for (i in events["notice"]) {
                events["notice"][i](channel, msgid, message)
            }
        }
    });




    client.on("chat", function (channel, user, message) {

        if (debug) {
            log("[" + channel + "] <" + user.username + ">: " + message, false, "CHAT")
        }
        if (!options.botIsPaused || message == "!unpausebot") {
            if (user.username != options.identity.username.toLowerCase() && !options.ignoredUsernames.includes(user.username)) {
                lastMessageWasBots = false;
                if (!options.markovLearningChannels.includes(channel)) {
                    if (user != null) {
                        ChatsBeforeTimeout++;
                        if (viewerDB.Viewers[user.username] == null) {
                            addViewerToDB(user.username);
                        }
                        if (viewerDB.Viewers[user.username].nextCommandAllowed == null) {
                            viewerDB.Viewers[user.username].nextCommandAllowed = 0;
                        }
                        if (viewerDB.Viewers[user.username].nextChatAllowed == null) {
                            viewerDB.Viewers[user.username].nextChatAllowed = 0;
                        }
                        viewerDB.Viewers[user.username].lastChannel = channel;
                        if (viewerDB.Viewers[user.username].subscribed == null) {
                            viewerDB.Viewers[user.username].subscribed = user.subscriber
                        }
                        if (user.subscriber) {
                            viewerDB.Viewers[user.username].subscribed = true;
                        } else if (viewerDB.Viewers[user.username].subscribed) {
                            user.subscriber = viewerDB.Viewers[user.username].subscribed
                        }


                        viewerDB.Viewers[user.username].mod = user.mod
                        if (viewerDB.Viewers[user.username].bank == null) {
                            viewerDB.Viewers[user.username].bank = 0;
                        }
                        if (tryResolvingCommand(channel, user, message)) {

                        } else if (options.markovEnabled && message.split(" ")[0].toLowerCase() === "@" + options.identity.username.toLowerCase()) {

                            //Message to bot through mention
                            if (user.mod || isAdmin(user.username) || new Date().getTime() >= viewerDB.Viewers[user.username].nextCommandAllowed) {
                                viewerDB.Viewers[user.username].nextCommandAllowed = new Date().getTime() + options.commandSpamTimeout;
                                if (options.markovFilterBadWords && containsBadWord(message)) {
                                    say(user, channel, "...", false)
                                } else {
                                    if (tryToAnswer(channel, user, message)) {
                                        viewerDB.Viewers[user.username].timeToRespond = new Date().getTime() + 6000
                                    } else {
                                        if (options.markovDoesReply) {
                                            var res = m.respond(message.replace("@" + options.identity.username + " ", "")).join(' ');
                                            say(user, channel, res.replace("/", "").replace("!", ""), false)
                                        }
                                    }
                                }

                            } else {
                                viewerDB.Viewers[user.username].nextCommandAllowed = new Date().getTime() + options.commandSpamTimeout;
                                //Spamming commands
                                if (viewerDB.Viewers[user] != null) {
                                    if (viewerDB.Viewers[user].warnings == null) {
                                        viewerDB.Viewers[user].warnings = 0;
                                    }
                                    clearTimeout(spamClearTimeout);
                                    viewerDB.Viewers[user].warnings++;
                                    if (viewerDB.Viewers[user].warnings == 1) {
                                        say(user, channel, "Please slow down with the commands.", false)
                                        spamClearTimeout = setTimeout(function () {
                                            viewerDB.Viewers[user].warnings = 0;
                                        }, 10000)
                                    } else if (viewerDB.Viewers[user].warnings == 2) {
                                        say(user, channel, "Seriously, stop spamming or I'm going to ban you...", false)
                                        spamClearTimeout = setTimeout(function () {
                                            viewerDB.Viewers[user].warnings = 0;
                                        }, 10000)
                                    } else {
                                        say(user, channel, "See yah.", false)
                                        client.ban(channel, user, "Spam");
                                        delete viewerDB.Viewers[user];
                                    }
                                }
                            }
                            //still feed him though. Poor markov.
                            feedMarkov(user.username, message);
                        } else {
                            //Message to anyone
                            if (user.mod || isAdmin(user.username) || new Date().getTime() >= viewerDB.Viewers[user.username].nextChatAllowed) {
                                viewerDB.Viewers[user.username].nextChatAllowed = new Date().getTime() + options.chatSpamTimeout;
                                if (options.markovEnabled && tryToAnswer(channel, user, message, false, false)) {
                                    viewerDB.Viewers[user.username].timeToRespond = new Date().getTime() + 6000
                                }
                            } else {
                                //Spamming chat
                                if (viewerDB.Viewers[user.username] != null) {
                                    if (viewerDB.Viewers[user.username].warnings == null) {
                                        viewerDB.Viewers[user.username].warnings = 0;
                                    }
                                    clearTimeout(spamClearTimeout);
                                    viewerDB.Viewers[user.username].warnings++;
                                    if (viewerDB.Viewers[user.username].warnings == 1) {
                                        say(user, channel, "Hey I'm the bot here, STOP SPAMMING!", false)
                                        spamClearTimeout = setTimeout(function () {
                                            viewerDB.Viewers[user.username].warnings = 0;
                                        }, 10000)
                                    } else if (viewerDB.Viewers[user.username].warnings == 2) {
                                        say(user, channel, "Seriously, stop spamming or I'm going to ban you...", false)
                                        spamClearTimeout = setTimeout(function () {
                                            viewerDB.Viewers[user.username].warnings = 0;
                                        }, 10000)
                                    } else {
                                        say(user, channel, "See yah.", false)
                                        client.ban(channel, user.username, "Spam");
                                        delete viewerDB.Viewers[user.username];
                                    }
                                }
                            }
                            if (options.markovEnabled) {
                                feedMarkov(user.username, message);
                            }
                        }
                        if (options.subsGetDoublePointGain) {
                            viewerDB.Viewers[user.username].points += options.pointsPerChat * 2;
                        } else {
                            viewerDB.Viewers[user.username].points += options.pointsPerChat;
                        }
                        lastChat = new Date().getTime();
                        viewerDB.Viewers[user.username].lastChat = new Date().getTime();
                        viewerDB.Viewers[user.username].stoppedChattingTimeout = new Date().getTime() + ((options.ViewerstoppedChattingTimeoutMinutes * 60) * 1000);
                        viewerDB.Viewers[user.username].playerDeleteTimeout = new Date().getTime() + ((((options.purgeUserFromDbTimeoutDays * 24) * 60) * 60) * 1000);
                        viewerDB.Viewers[user.username].nextChatAllowed = new Date().getTime() + options.chatSpamTimeout;
                    }
                    for (i in events["chat"]) {
                        events["chat"][i](channel, user, message)
                    }
                } else {
                    if (options.markovEnabled) {
                        feedMarkov(user.username, message);
                    }

                }
            }
        }
    });
    var whisperedUser = {}
    client.on("whisper", function (from, userstate, message, self) {
        if (self) return;
        if (!options.botIsPaused || message == "!unpausebot") {
            from = from.replace("#", "");
            if (from != null && viewerDB.Viewers[from] != null) {
                if (viewerDB.Viewers[from].lastChannel != null) {
                    whisperedUser = {
                        mod: viewerDB.Viewers[from].mod,
                        username: from,
                        subscriber: viewerDB.Viewers[from].subscribed
                    }
                    if (!options.whisperIsSubscriberOnly || whisperedUser.subscriber || whisperedUser.mod || isAdmin(from)) {
                        if (!options.whisperIsModOnly || whisperedUser.mod || isAdmin(from)) {
                            if (debug) {
                                log("[WHISPER] <" + from + ">: " + message, false, "CHAT")
                            }
                            if (message.charAt(1) != "/" && !message.includes("http")) {
                                //Message to bot directly
                                if (options.markovFilterBadWords && containsBadWord(message)) {
                                    client.whisper(from, "...")
                                    if (debug) {
                                        log("[WHISPER_RESPONSE] <" + from + ">: ...", false, "CHAT")
                                    }
                                } else {
                                    if (options.markovEnabled) {
                                        if (tryResolvingCommand("", whisperedUser, message, true)) {

                                        } else if (tryToAnswer("", whisperedUser, message, true, false)) { } else {
                                            var res = m.respond(message.replace("@" + options.identity.username + " ", "")).join(' ');
                                            client.whisper(from, res)
                                            if (debug) {
                                                log("[WHISPER_RESPONSE] <" + from + ">: " + res, false, "CHAT")
                                            }
                                        }
                                        feedMarkov(from, message);
                                    }
                                }
                            }
                            for (i in events["whisper"]) {
                                events["whisper"][i](from, userstate, message, self)
                            }
                        } else {
                            client.whisper(from, "You must be a moderator to use whisper. If you are a moderator in the channel you are in, try sending a message in main chat and try again.")
                        }
                    } else {
                        client.whisper(from, "You must be a subscriber to use whisper. If you are a subscriber in the channel you are in, try sending a message in main chat and try again.")
                    }
                }
            }
        }
    });
    client.on("ban", function (channel, user, reason) {
        if (!options.markovLearningChannels.includes(channel)) {
            if (debug) {
                log("[" + channel + "] Banned " + user + " for " + reason, false, "IRC")
            }
            if (viewerDB.Viewers[user.username] != null) {
                delete viewerDB.Viewers[user.username];
            }
            for (i in events["ban"]) {
                events["ban"][i](channel, user, reason)
            }
        }

    });

    display.media = function (x, y, w, h, src, overlayName = "overlay", fadeIn = 0, timeout = 5000, fadeOut = 300) {
        io.emit("DisplayMedia", {
            x: x,
            y: y,
            w: w,
            h: h,
            src: src,
            timeout: timeout,
            fadeout: fadeOut,
            fadein: fadeIn,
            overlayName: overlayName
        })
    }
    display.audio = function (src, vol = 0.8, overlayName = "overlay") {
        io.emit("DisplayAudio", {
            src: src,
            vol: vol,
            overlayName: overlayName
        })
    }
    display.pauseAudio = function (overlayName = "overlay") {
        io.emit("pauseAudio", {
            overlayName: overlayName
        })
    }
    display.playAudio = function (overlayName = "overlay") {
        io.emit("playAudio", {
            overlayName: overlayName
        })
    }
    display.stopAudio = function (overlayName = "overlay") {
        io.emit("stopAudio", {
            overlayName: overlayName
        })
    }
    display.audioOnComplete = function (src, vol = 0.8, overlayName = "overlay") {
        io.emit("DisplayAudio", {
            src: src,
            vol: vol,
            overlayName: overlayName
        })
    }
    display.text = function (str, x, y, style, overlayName = "overlay", fadeIn = 0, timeout = 5000, fadeOut = 300) {
        io.emit("DisplayText", {
            x: x,
            y: y,
            str: str,
            style: style,
            timeout: timeout,
            fadeout: fadeOut,
            fadein: fadeIn,
            overlayName: overlayName
        })
    }
    display.setVolume = function (vol, overlayName = "overlay") {
        io.emit("setVolume", {
            vol: vol,
            overlayName: overlayName
        })
    }
    display.say = function (str, overlayName = "overlay") {
        io.emit("say", {
            str: str,
            overlayName: overlayName
        })
    }
    display.clear = function (str = "all", overlayName = "overlay") {
        io.emit("clear", {
            str: str,
            overlayName: overlayName
        })
    }

    log("Loading Open-Twitch-Bot Plugins...", false, "OTB")
    for (var i in botPlugins) {
        log("Plugin '" + i + "' loaded.")
        botPlugins[i].init(commands, events, markovReponses, options, viewerDB, display, say, statsDb);
    }

    setTimeout(function () {
        options.options.debug = debug;
        DB.save(__dirname + "/Config.json", options);
        options.options.debug = false;
        log("Connecting to twitch irc...")
        if (options.markovEnabled) {
            //Update channels list with markov channels
            for (i in options.markovLearningChannels) {
                options.channels.push(options.markovLearningChannels[i])
            }
        }
        client.connect();
    }, 100)
    serverCommands.say = {
        usage: "say [message]",
        help: "Makes bot broadcast the message.",
        do: function (message, messageLowercase, arguments) {
            say(options.channels[0], "", message, false);
        }
    }
    serverCommands.botHelp = {
        usage: "botHelp",
        help: "Lists all twitchbot commands that can be typed in the twitch chat.",
        do: function (message, messageLowercase, arguments) {
            for (command in commands) {
                console.log(command);
            }
        }
    }
}
exports.init = init;