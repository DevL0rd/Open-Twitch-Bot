# Open Twitch Bot (WIP)
If I have missed any useful features feel free to let me know, or make a pull request.
  - Completely open source. Go ahead, break things!
  - Completely configurable.
  - Easy to add functionality to.
  - Points system
  - OBS Overlay control from plugins.
  - Play audio to OBS.
  - Display images and video and and animated gifs on OBS.
  - Keep track of stats like command usage, who has the most points. who spent the most points. Most points earned etc..
  - Banking for points.
  - Admin and moderator groups.
  - Private messaging support.
  - Automatic bot responses for automatically answering questions.
  - Other stuff I forgot about! Wow!

## Installation and configuration
Open Twitch Bot requires [Node.js](https://nodejs.org/) v4+, and the modular web server which you can download [here](https://github.com/DevL0rd/Modular-Web-Server).
- Download the server and extract.
- Install the dependencies for the WebServer.
    ```sh
    cd Modular-Web-Server
    npm install --save
     ```
- Extract Open Twitch Bot next to the WebServer folder.
- Install the dependencies for the Bot.
    ```sh
    cd Open-Twitch-Bot
    npm install --save
     ```
- Start the server by opening this folder with the modular websever application to generact the Config.json file
- Create a twitch account for your bot, sign into that account, and visit https://twitchapps.com/tmi/ to obtain your oauth token.
- Open the Config.json file located in 'Open-Twitch-Bot/Plugins/TwitchBot/Config.json'
- Set your bot's sign in details.
    ```javascript
    "identity": {
		"username": "botUsername",
		"password": "botOAUTH"
	},
    ```
- Set the channels the bot will be in.
    ```javascript
    "channels": [
		"#channelname",
		"#maybeAnotherChannel"
	],
    ```
- Other optional configuration can be done in the config file. The configuration is pretty straight forward so I'll skip documenting that here.

## Installing plugins
- Drop your plugins .js file into the plugins folder in 'Open-Twitch-Bot/Plugins/TwitchBot/Plugins'.
- If the plugin has any dependencies, make sure to install them!

## Using OBS Overlays
- Add a webpage source to OBS with the resolution of 1920 X 1080 at 60fps.
- Use the url 'http://localhost/?overlay=overlayName'. The default overlay is "overlay"

## Built in commands.
- A lot.... i'll type these some other time..

## Creating plugins
Here comes the fun part!
- create a new js file in 'Open-Twitch-Bot/Plugins/TwitchBot/Plugins'.
- use this for your basic plugin structure.
    ```javascript
    //Plugin starts here
    function init(commands, events, responses, options, viewerDB, display, say, statsDb) {
        //Make a new command !test
        commands.test = function (channel, user, message, command, isPrivate) {
            //User is the user object of the user, it contains the username, and other twitch data.
            //channel is the channel the message came from.
            //Message is the full message received from the user.
            //isPrivate is a boolean telling us if the message was a pm or not.
            
            //respond to user. will be a pm if the user sent a pm.
            say(user, channel, "This is the test command's response!", isPrivate);
            
            //dispaly text on the OBS overlay centered and 50px from the top of the screen
            display.text("This is some test text!", "center", 50, {
                color: "green", //font color
                font: "Impact", //font type
                fontsize: "70px" 
            }, "overlay", 0, 1000, 0) //overlay name, fadein time, timeout, fadeouttime
        }
    }
    //This must always be included so the bot can init the plugin
    exports.init = init;
    ```
- Perhaps we want to give admins AND moderators the ability to clear the overlay..
    ```javascript
    function init(commands, events, responses, options, viewerDB, display, say, statsDb) {
        //Make a new command !clearoverlay
        commands.clearoverlay = function (channel, user, message, command, isPrivate) {
            if (options.admins.includes(user.username) && user.mod) {
                display.clear();
                //respond to user. will be a pm if the user sent a pm.
                say(user, channel, "This overlay has been cleared!", isPrivate);
            } else {
                say(user, channel, "You do not have peprmission to use this command!", isPrivate);
            }
        }
    }
    //This must always be included so the bot can init the plugin
    exports.init = init;
    ```
- Lets do something a little more advanced. Perhaps we would like a command that costs some points. Maybe play a little audio and display a picture. And this time, it's only for subscribers or moderators.
    ```javascript
    commands.birdup = function (channel, user, message, command, isPrivate) {
        //check if user has the permissions to use the command.
        if (user.subscriber || (user.mod || options.admins.includes(user.username))) {
                var price = 15
                //check if user can afford command
                if (viewerDB.Viewers[user.username].points >= price) {
                    //deduct points from the user
                    viewerDB.Viewers[user.username].points -= price;
                    //play some audio through the obs display
                    display.audio("/audio/birdup.mp3")
                    //display text
                    display.text("Bird up!!!", "center", "center", {
                        color: "yellow",
                        font: "Impact",
                        fontsize: "40px"
                    }, "overlay", 300, 2000)
                    var randomImg = getRandomInt(1, 4);
                    //display 3 images in order at a random place on screen.
                    setTimeout(function () {
                        display.media(getRandomInt(1, 1920 - 200), getRandomInt(1, 1080 - 200), 200, 200, "/img/birdup" + randomImg + ".png", "overlay", 0, 200, 0);
                        setTimeout(function () {
                            display.media(getRandomInt(1, 1920 - 500), getRandomInt(1, 1080 - 500), 500, 500, "/img/birdup" + randomImg + ".png", "overlay", 0, 200, 0);
                            setTimeout(function () {
                                display.media(getRandomInt(1, 1920 - 1000), getRandomInt(1, 1080 - 1000), 1000, 1000, "/img/birdup" + randomImg + ".png", "overlay", 0, 500, 0);
                            }, 200)
                        }, 200)
                    }, 450)
                    //let the user know the points have been deducted.
                    say(user, channel, price + " " + options.pointsName + " taken. You now have " + round(viewerDB.Viewers[user.username].points) + " " + options.pointsName + ".", isPrivate)
                } else {
                    //let the user know they do not have enough points.
                    say(user, channel, "This costs " + price + " " + options.pointsName + " but you only have " + round(viewerDB.Viewers[user.username].points) + " " + options.pointsName + ".", isPrivate)
                }
        } else {
            //tell the user they suck.
            say(user, channel, "You must be a subscriber to use this command.", isPrivate)
        }
    }
    ```
- Well what if we want the bot to detect a question and answer it!?
    ```javascript
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
            //tell the bot we handled the message.
            return true;
        }
        //tell the bot that we didn't have anything to say..
        return false;
    });
    //This must always be included so the bot can init the plugin
    exports.init = init;
    ```
- There is much more that this bot can do, I've left alot of plugins that you can look at as examples.
These plugins collectively use all of the features of the twitch bot.
