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


function init(commands, events, responses, options, viewerDB, display, say, statsDb) {
    /////////////////////
    //Plugin starts here

	
	
	
    //Make a new command
    //Flip a coin
    commands.fc = function(channel, user, message, command, isPrivate) {
        //channel is the name of the channel
        //user is an object with user.username and user.mod which is true or false depending on if you are a mod
        //message is the entire message the user sent with this command
        //command is everything after ! and lowercase
        //isPrivate is true or false depending on if the message was sent in a whisper or not.


        //choose 50 / 50 a side of the coin
        if (getRandomInt(1, 2) == 1) {
            //say to the user, in this channeld, the status of the coin, in a public or private message depending on where it came from.
            say(user, channel, "Coin landed on: TAILS", isPrivate)
        } else {
            say(user, channel, "Coin landed on: HEADS", isPrivate)
        }
    }



	
    //Make a new command
    //Spend some points
    command.spendpoints = function(channel, user, message, command, isPrivate) {
        //set price of command
        var price = 5
        //viewerDB.Viewers[user.username] contains all viewers and their data
        //here we check the points the player has
        if (viewerDB.Viewers[user.username].points >= price) {
            //if you have enough points
            //deduct points
            viewerDB.Viewers[user.username].points -= price;
            say(user, channel, "You spend " + price + " " + options.pointsName + " on absolutely nothing, leaving you with " + viewerDB.Viewers[user.username].points + ".", isPrivate);
        } else {
            //if you don't enough points
            //tell the viewer they don't have enough points
            say(user, channel, "You need " + price + " " + options.pointsName + ", but you only have " + viewerDB.Viewers[user.username].points + ".", isPrivate);
        }
    }


	
	
	
    //New command
    //Check if you are a mod or admin
    command.checkrank = function(channel, user, message, command, isPrivate) {
        if (options.admin.includes(user.username)) {
            //user is admin
            say(user, channel, "You are an admin.", isPrivate);
        } else {
            say(user, channel, "You are not an admin.", isPrivate);
        }
        if (user.mod) {
            //user is twitch mod.
            say(user, channel, "You are a moderator.", isPrivate);
        } else {
            say(user, channel, "You are not a moderator.", isPrivate);
        }
    }




	
	
    //New command
    commands.example = function(channel, user, message, command, isPrivate) {
        var params = message.split(" ");

        var command = params[0] //same as command name
        var param = "defaultparam"
        var param2 = "defaultparam"

        //if you have anough params get param 1
        if (params.length > 1) {
            param = params[1]
        }
        //if you have anough params get param 2
        if (params.length > 2) {
            param2 = params[2]
        }

        //chat 
        say(user, channel, "your message here", isPrivate = false); // the " = value" is the default value if you don't specify it

        //display image or video or gif, later tileset animations and youtube urls
        display.media(x, y, w, h, src, overlay = "overlay", fadeIn = 0, timeout = 5000, fadeOut = 300); // the " = value" is the default value if you don't specify it

        //display text
        display.text(str, x, y, style, overlay = "overlay", fadeIn = 0, timeout = 5000, fadeOut = 300);

        //src can be youtube url
        display.audio(src, vol = 0.8, overlay = "overlay");

        //set volume...
        display.setVolume(vol, overlayName = "overlay")

        display.playAudio(overlayName = "overlay")

        display.stopAudio(overlayName = "overlay")

        display.pauseAudio(overlayName = "overlay")
        //do this on music complete
        display.audioOnComplete = function(src, vol, overlayName) {

        }
        //use text to speach
        display.say(str, overlayName = "overlay")
    };

	
	
	
	
	
    //New bot response
    responses.push(function(user, channel, message, isPrivate, directedToBot) {
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
    })

	
	
	
	
	
    //On tick
    events.on("tick", function() {
        //Every second a tick happens, this is it.
    });

    //On chat
    events.on("chat", function(channel, user, message) {
        //channel is the name of the channel
        //user is an object with user.username and user.mod which is true or false depending on if you are a mod
        //message is the entire message the user sent with this command
    });
    //On whisper
    events.on("whisper", function(from, userstate, message, self) {
        //from is username
        //userstate has alot of info
        //message is just the message....
        //self is a reference to the bots userstate, which has alot of info also


    });

    events.on("ban", function(channel, user, reason) {

    });

    events.on("unban", function(channel, user, reason) {

    });

    events.on("subscription", function(channel, username, method, message, userstate) {

    });
    //there are more events not listed.


});
exports.init = init;