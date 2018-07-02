//Authour: DevL0rd
//GitHub: https://github.com/DevL0rd
/////////////////////////////////
//Public vars and functions here
//hold giveaway price for when it is set
var giveAwayPrice = 0;
//id of giveaway timeout so it can be cleared
var endGiveawayTimeout;
//array of people in giveaway
var draw = [];
//Is giveaway happening now
var isInGiveaway = false;
//Public countdown var
var countDown = 59;
//Id of countdown interval so it can be cleared
var countDownInterval;


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
    //Enter giveaway
    commands.enter = function (channel, user, message, command, isPrivate) {
        //is giveaway started
        if (isInGiveaway) {
            //is player in draw
            if (!draw.includes(user.username)) {
                //does user have enough pointss
                if (user.subscriber || (user.mod || options.admins.includes(user.username)) || viewerDB.Viewers[user.username].points >= giveAwayPrice) {
                    //deduct points
                    if (!(user.subscriber || (user.mod || options.admins.includes(user.username)))) {
                        viewerDB.Viewers[user.username].points -= giveAwayPrice;
                        say(user, channel, giveAwayPrice + " " + options.pointsName + " taken. You have entered the giveaway.", isPrivate)
                    } else {
                        say(user, channel, "You have entered the giveaway.", isPrivate)
                    }
                    //add user to draw
                    draw.push(user.username)
                } else {
                    //user does not have enough points
                    say(user, channel, "This costs " + giveAwayPrice + " " + options.pointsName + " but you only have " + round(viewerDB.Viewers[user.username].points) + " " + options.pointsName + ".", isPrivate)
                }
            } else {
                //say(user, channel, "You have already entered the giveaway.", isPrivate)
            }
        }
    }

    //Make a new command
    //Make new giveaway
    commands.giveaway = function (channel, user, message, command, isPrivate) {
        //if user is a admin
        if (options.admins.includes(user.username)) {
            //if give away is not running, start one
            if (!isInGiveaway) {
                giveAwayPrice = 0;
                //make sure paramater was givin and is a number
                if ("" + parseInt(command.split(" ")[1]) != "NaN") {
                    giveAwayPrice = parseInt(command.split(" ")[1]);
                }
                //if giveaway was a number start it
                if (giveAwayPrice != 0) {
                    //stazrt giveaway
                    isInGiveaway = true;
                    //clear last draw
                    draw = [];
                    //pause any music playing
                    display.pauseAudio();
                    say(user, channel, "To enter the giveaway, type !enter", isPrivate)
                    //say(user, channel, "To enter the giveaway, type !enter", isPrivate)
                    display.audio("/audio/giveaway" + getRandomInt(1, 2) + ".mp3")
                    //display give away instructions on screen
                    display.text("You have 1 minute to enter giveaway. To enter type !enter.", "center", 50, {
                        color: "white",
                        font: "Impact",
                        fontsize: "40px"
                    }, "overlay", 300, 60000)
                    //display cost on screen
                    display.text("This giveaway costs " + giveAwayPrice + " " + options.pointsName + ".", "center", 95, {
                        color: "white",
                        font: "Impact",
                        fontsize: "40px"
                    }, "overlay", 300, 60000)
                    //set countdown to 59
                    countDown = 59;

                    //make countdown graphics loop
                    countDownInterval = setInterval(function () {
                        //depending on progress change size and color of text
                        if (countDown > 20) {
                            //display countdown
                            display.text("" + countDown, "center", "center", {
                                color: "white",
                                font: "Impact",
                                fontsize: "150px"
                            }, "overlay", 0, 700)
                        } else if (countDown > 5) {
                            display.text("" + countDown, "center", "center", {
                                color: "yellow",
                                font: "Impact",
                                fontsize: "200px"
                            }, "overlay", 0, 700)
                        } else {
                            display.text("" + countDown, "center", "center", {
                                color: "red",
                                font: "Impact",
                                fontsize: "250px"
                            }, "overlay", 0, 700)
                        }
                        //count down the countdown
                        countDown--;
                        //if countdown is over, clear the loop
                        if (countDown <= 0) {
                            clearInterval(countDownInterval)
                        }

                    }, 1000) // loop interval is 1 second 

                    //clear any existing giveaway timeout
                    clearTimeout(endGiveawayTimeout);

                    //set timeout to choose winner
                    endGiveawayTimeout = setTimeout(function () {
                        //end giveaway
                        isInGiveaway = false;
                        //check if people entered
                        if (draw.length != 0) {
                            //grab a random winner
                            var whowon = draw[getRandomInt(1, draw.length) - 1]
                            //display winner on screen
                            display.text(whowon + " wins the giveaway!", "center", 800, {
                                color: "white",
                                font: "Impact",
                                fontsize: "80px"
                            }, "overlay", 300, 10000)
                            //play giveaway winner sound
                            display.audio("/audio/giveawaywin.mp3")
                            //show media for giveaway win
                            display.media("center", "center", 1920 / 2, 1080 / 2, "/img/giveawaywin.gif", "overlay", 300, 10000);
                            //resume music after giveaway is over.
                            setTimeout(function () {
                                display.playAudio();
                            }, 10000)
                        } else {
                            //display that no on entered on screen.
                            display.text("The give away has ended, but no one entered.", "center", "center", {
                                color: "white",
                                font: "Impact",
                                fontsize: "60px"
                            }, "overlay", 300, 5000)
                            //resum music
                            setTimeout(function () {
                                display.playAudio();
                            }, 5000)
                        }

                    }, 60000)
                } else {
                    //incorrect input for price
                    say(user, channel, "Usage: giveaway <price>", isPrivate)
                }
            } else {
                //not an admin
                say(user, channel, "You must be an administrator to use this command.", isPrivate)
            }
        } else {
            //A giveaway is already taking place. No need to spam the chat.
        }
    }



}
module.exports.init = init;
