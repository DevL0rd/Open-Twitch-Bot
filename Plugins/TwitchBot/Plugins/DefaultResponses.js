//Authour: DevL0rd
//GitHub: https://github.com/DevL0rd
//Last Update: 8/22/2017
//Version: 1
/////////////////////////////////
//Public vars and functions here
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function init(commands, events, responses, options, viewerDB, display, say, statsDb) {
    //New command
    //Get pet clip url
    commands.pet = function (channel, user, message, command, isPrivate) {
        say(user, channel, "https://clips.twitch.tv/ProtectiveAffluentFoxBuddhaBar", isPrivate)
    }
    commands.discord = function (channel, user, message, command, isPrivate) {
        say(user, channel, "https://discord.gg/HBDFtd8", isPrivate)
    }
    //New bot response
    //how to view commands
    responses.push(function (user, channel, message, isPrivate, directedToBot) {
        //channel is the name of the channel
        //user is an object with user.username and user.mod which is true or false depending on if you are a mod
        //message is the entire message the user sent with this command
        //directedToBot is weather the user used @thebot

        //check the message for keywords that must mean he is asking about the commands
        if ((message.search("what are") != -1 || message.search("where are") != -1 || message.search("how do i use") != -1) && (message.search("commands") != -1 || message.search("command") != -1)) {
            //tell the user what they asked about.
            say(user, channel, "To view the commands, look below the stream.", isPrivate);
            return true;
        }
        return false;
    });


    //what are points for
    responses.push(function (user, channel, message, isPrivate, directedToBot) {
        if (((message.search("what are") != -1 || message.search("what can") != -1) && (message.search("for") != -1 || message.search("used") != -1) || ((message.search("what do") != -1) && (message.search("do") != -1 || message.search("what are") != -1 || message.search("use") != -1 || message.search("need") != -1))) && (message.search("points") != -1 || message.search(options.pointsName.toLowerCase()) != -1)) {
            say(user, channel, "You can use " + options.pointsName + " on alot of things! For details, look below the stream.", isPrivate)
            return true
        }
        return false;
    });

    //can you send points?
    responses.push(function (user, channel, message, isPrivate, directedToBot) {
        if ((message.search("can i") != -1 || message.search("can you") != -1 || message.search("possible to") != -1 || message.search("how do") != -1 || message.search("how can") != -1) && (message.search("give") != -1 || message.search("share") != -1 || message.search("send") != -1 || message.search("trade") != -1) && (message.search("points") != -1 || message.search(options.pointsName.toLowerCase()) != -1)) {
            say(user, channel, "You can give points with !give <viewer> <ammount>", isPrivate)
            return true
        }
        return false;
    });

    //how do i get points
    responses.push(function (user, channel, message, isPrivate, directedToBot) {
        if ((message.search("how quick") != -1 || message.search("how fast") != -1 || message.search("how do") != -1 || message.search("how to") != -1 || message.search("how to") != -1 || message.search("where do") != -1) && (message.search("get") != -1 || message.search("earn") != -1 || message.search("accumulate") != -1 || message.search("gain") != -1) && (message.search("points") != -1 || message.search(options.pointsName.toLowerCase()) != -1)) {
            say(user, channel, "You get 1 points per minute from watching the stream. 0.5 points per chat. And bonus points for a bit after chatting.", isPrivate)
            return true
        }
        return false;
    });
    //where are you bot? directed at bot
    responses.push(function (user, channel, message, isPrivate, directedToBot) {
        var askedlocation = (message.search("there") != -1 || message.search("broken") != -1 || message.search("online") != -1 || message.search("up") != -1 || message.search("down") != -1 || message.search("working") != -1 || message.search("gone") != -1 || message.search("offline") != -1 || message.search("here") != -1 || message.search("dead") != -1 || message.search("alive") != -1 || message.search("where") != -1)
        if (directedToBot || isPrivate) {
            if ((message.search("you") != -1 && askedlocation) || (message.search("where are") != -1 && message.search("you") != -1) || (message.search("where did") != -1 && message.search("go") != -1)) {
                say(user, channel, "I am right here.", isPrivate)
                return true
            }
        } else {
            if (message.search("hi bot") != -1 || message.search("hey bot") != -1 || message.search("the bot") != -1 || message.search("yo bot") != -1 || message.search("your bot") != -1 || message.search("hey bot") != -1 || message.search("bot ") != -1 || message.search(" bot ") != -1) {
                if ((message.search("the") != -1 && askedlocation) || (message.search("you") != -1 && askedlocation) || (message.search("where are") != -1 && message.search("you") != -1) || (message.search("are you") != -1 && askedlocation) || (message.search("is the") != -1 && askedlocation) || (message.search("where is") != -1 && message.search("at") != -1) || (message.search("where did") != -1 && message.search("go") != -1)) {
                    say(user, channel, "I am right here.", isPrivate)
                    return true
                }
            }

        }
        return false;
    });
    //thanks
    responses.push(function (user, channel, message, isPrivate, directedToBot) {
        if (directedToBot || isPrivate) {
            if (message.search("thank") != -1 || message.search("thx") != -1 || message.search("tanks") != -1 || message.search("ty") != -1) {
                say(user, channel, "No problem.", isPrivate)
                return true
            }
        }
        return false;
    });
    responses.push(function (user, channel, message, isPrivate, directedToBot) {
        if (message.search("brb") != -1 || message.search("be right back") != -1 || message.search("will be back") != -1 || message.search("be back soon") != -1) {
            say(user, channel, "Be back soon <3.", isPrivate)
            return true
        }
        return false;
    });
    //    //math
    //    responses.push(function (user, channel, message, isPrivate, directedToBot) {
    //        if (isPrivate) {
    //            var params = message.split(" ")
    //            if (params.length > 1) {
    //                if (params[0] == "what" || params[0] == "whats" || params[0] == "what's") {
    //
    //
    //                    var rest = message.slice(message.indexOf(' ') + 1)
    //                    rest = rest.replace("is ", "").replace("times", "*").replace("minus", "-").replace("subtract", "-").replace("divided by", "/").replace("plus", "+").replace("add", "+")
    //                    var ans = eval(rest);
    //
    //                    say(user, channel, ans, isPrivate)
    //                    return true;
    //                }
    //            }
    //
    //        } else if (directedToBot) {
    //            var params = message.split(" ")
    //            if (params.length > 2) {
    //                if (params[1] == "what" || params[1] == "whats" || params[1] == "what's") {
    //
    //
    //                    var rest = message.slice(message.indexOf(params[2]))
    //                    rest = rest.replace("is ", "").replace("x", "*").replace("times", "*").replace("minus", "-").replace("subtract", "-").replace("divided by", "/").replace("plus", "+").replace("add", "+").replace("to the power of", "^")
    //                    var ans = eval(rest);
    //
    //                    say(user, channel, ans, isPrivate)
    //                    return true;
    //                }
    //            }
    //        }
    //        return false;
    //    })
    //bye
    responses.push(function (user, channel, message, isPrivate, directedToBot) {
        message = message.replace(".", "").replace("!", "")
        if (message == "bye" || message == "night" || message == "ttyl" || message == "gn" || message == "goodnight" || message == "good night") {
            say(user, channel, "Thanks for watching! We hope to see you again soon ;D", isPrivate)
            return true
        }

        return false;
    })
}
module.exports.init = init;
