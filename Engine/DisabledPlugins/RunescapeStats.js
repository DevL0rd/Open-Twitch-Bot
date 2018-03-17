//Authour: DevL0rd
//GitHub: https://github.com/DevL0rd
//Last Update: 8/22/2017
//Version: 1
/////////////////////////////////
//Public vars and functions here
var request = require('request');
var defaultUser = "TehhPro";
var rsVersion = 'osrs'
var BASE_SKILLS = [
    'overall', 'attack', 'defence', 'strength', 'hitpoints', 'ranged',
    'prayer', 'magic', 'cooking', 'woodcutting', 'fletching', 'fishing',
    'firemaking', 'crafting', 'smithing', 'mining', 'herblore', 'agility',
    'thieving', 'slayer', 'farming', 'runecraft', 'hunter', 'construction'
];

var urls = {
    'osrs': 'http://services.runescape.com/m=hiscore_oldschool/index_lite.ws?player=',
    'rs3': 'http://hiscore.runescape.com/index_lite.ws?player='
};

var skills = {
    'osrs': BASE_SKILLS,
    'rs3': BASE_SKILLS.concat('summoning', 'dungeoneering', 'divination')
};

function lookup(player, game, callback) {
    if (!urls.hasOwnProperty(game)) {
        game = 'rs3';
    }
    var url = urls[game].concat(encodeURIComponent(player));
    request(url, function (err, res, body) {
        if (err) {
            return callback(err);
        }
        var statusCode = res.statusCode;
        switch (statusCode) {
            case 200:
                return callback(null, parseStats(body, skills[game]));
            case 404:
                return callback(new Error('Player not found'));
            default:
                return callback(new Error(statusCode));
        }
    });
};

function parseStats(raw, skillsList) {
    var stats = raw.split('\n').slice(0, skillsList.length);
    var statsObj = {};
    stats.forEach(function (stat, index) {
        var chunk = stat.split(',');
        statsObj[skillsList[index]] = {
            rank: +chunk[0],
            level: +chunk[1],
            xp: +chunk[2]
        };
    });
    return statsObj;
}

function init(commands, events, responses, options, viewerDB, display, say, statsDb) {
    /////////////////////
    //Plugin starts here

    //Make a new command
    //Query stats
    commands.stats = function (channel, user, message, command, isPrivate) {
        var params = command.split(" ")
        var stat = "overall"
        if (params.length >= 2) {
            stat = params[1]
        }

        var userS = defaultUser;
        if (params.length >= 3) {
            userS = params[2]
        }
        var rsVer = rsVersion;
        if (params.length >= 4) {
            rsVer = params[3]
            if (rsVer != "osrs" && rsVer != "rs3") {
                userS = userS + " " + rsVer
                rsVer = rsVersion;
            }

        }
        if (params.length >= 5) {
            userS = params[2] + " " + params[3]
            rsVer = params[4]
            if (rsVer != "osrs" && rsVer != "rs3") {
                userS = userS + " " + rsVer
                rsVer = rsVersion;
            }
        }
        if (params.length >= 6) {
            userS = params[2] + " " + params[3] + " " + params[4]
            rsVer = params[5]
            if (rsVer != "osrs" && rsVer != "rs3") {
                userS = userS + " " + rsVer
                rsVer = rsVersion;
            }
        }
        if (params.length >= 7) {
            userS = params[2] + " " + params[3] + " " + params[4] + " " + params[5]
            rsVer = params[6]
            if (rsVer != "osrs" && rsVer != "rs3") {
                userS = userS + " " + rsVer
                rsVer = rsVersion;
            }
        }
        if (stat != "overall") {
            lookup(userS, rsVer, function (err, stats) {
                if (err) {
                    say(user, channel, "Player '" + userS + "' not found in " + rsVer + ".", isPrivate)
                    return
                }
                var statObj = stats[stat];
                if (statObj != null) {
                    say(user, channel, userS + " has a " + stat + " level of " + statObj.level + ", " + statObj.xp + " xp, " + statObj.rank + " rank.", isPrivate)
                } else {
                    say(user, channel, "Invalid skill '" + stat + "'.", isPrivate)
                }
            });
        } else {
            if (rsVer == "osrs") {
                say(user, channel, "http://07stats.leetscape.com/black/c-quests1/" + userS.replace(" ", "_") + ".png", isPrivate)
            } else if (rsVer == "rs3") {
                say(user, channel, "http://stats.leetscape.com/black/prayer1/" + userS.replace(" ", "_") + ".png", isPrivate)
            }
        }
    }
    setTimeout(function () {
        display.media(0, 0, 320, 125, "http://07stats.leetscape.com/black/c-quests1/" + defaultUser.replace(" ", "_") + ".png", "rsStats", 0, 30000, 0);
        setInterval(function () {
            display.media(0, 0, 320, 125, "http://07stats.leetscape.com/black/c-quests1/" + defaultUser.replace(" ", "_") + ".png", "rsStats", 0, 30000, 0);
        }, 30000)


        //how to view commands
        responses.push(function (user, channel, message, isPrivate, directedToBot) {
            if ((message.search("what are") != -1) && ((message.search("ur") != -1 || message.search("your") != -1) && message.search("stat") != -1) && message.length < 20) {
                say(user, channel, "His stats can be viewed here: http://07stats.leetscape.com/black/c-quests1/" + defaultUser.replace(" ", "_") + ".png", isPrivate)
                return true
            }
            return false;
        })
    }, 5000)
}


module.exports.init = init;
