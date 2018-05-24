//Authour: DevL0rd
//GitHub: https://github.com/DevL0rd
//Last Update: 8/28/2017
//Version: 1.2
/////////////////////////////////
//Public vars and functions here
var YouTube = require('youtube-node');
var url = require('url');
var youTube = new YouTube();
var DB = require('../../../Devlord_modules/DB.js');
var fs = require('fs');

var price = 15

var nameUpdateTimeout = 0;
var NowPlaying
var stopped = false;
var songsPlayed = {}
var audioPlaying = false;

var audiochannel


//Load all external data or generate it
var newPlaylist = {};
var playlistlength
var playlistconvtimeout
var savetimeout
if (fs.existsSync(__dirname + "/Settings/Playlist.json")) {
    var playlist = DB.load(__dirname + "/Settings/Playlist.json")
} else {
    var playlist = {}
    DB.save(__dirname + "/Settings/Playlist.json", playlist)
}

if (fs.existsSync(__dirname + "/Settings/SongRequests.json")) {
    var songsToPlay = DB.load(__dirname + "/Settings/SongRequests.json")
} else {
    var songsToPlay = []
    DB.save(__dirname + "/Settings/SongRequests.json", songsToPlay)
}
if (fs.existsSync(__dirname + "/Settings/CurrentSong.json")) {
    var currentSong = DB.load(__dirname + "/Settings/CurrentSong.json")
} else {
    var currentSong = {
        src: "https://www.youtube.com/watch?v=1",
        user: "None",
        title: "No Song Playing"
    };
    DB.save(__dirname + "/Settings/CurrentSong.json", songsToPlay)
}
if (!fs.existsSync(__dirname + "/Settings/CurrentSong.json")) {
    DB.save(__dirname + "/Settings/CurrentSong.json", "None")
}
if (fs.existsSync(__dirname + "/Settings/YoutubeMusic.json")) {
    var settings = DB.load(__dirname + "/Settings/YoutubeMusic.json")

} else {
    settings = {
        volume: 0.6,
        youtubeApiKey: ""
    }
    DB.save(__dirname + "/Settings/YoutubeMusic.json", settings)
}


youTube.setKey(settings.youtubeApiKey);

function round(inty) {
    return Math.round(inty * 100) / 100;
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
Object.size = function (obj) {
    var size = 0,
        key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

function nextSong(channel, say, display) {
    if (songsToPlay.length > 0) {
        var requestedSong = songsToPlay.shift()

        display.audio(requestedSong.src, settings.volume)
        say("", channel, "Now playing: " + requestedSong.title + " Requested by: " + requestedSong.user, false);
        currentSong = requestedSong
        DB.save(__dirname + "/Settings/CurrentSong.json", currentSong)
        audioPlaying = true
        DB.save(__dirname + "/Settings/SongRequests.json", songsToPlay)
    } else {
        var keys = Object.keys(playlist);
        if (keys.length > 0) {
            var index = getRandomInt(1, keys.length) - 1

            var playlistSong = keys[index]

            songsPlayed[playlistSong] = playlist[playlistSong]


            currentSong = {
                user: "Playlist",
                src: playlistSong,
                title: playlist[playlistSong]
            }
            display.audio(playlistSong, settings.volume)
            DB.save(__dirname + "/Settings/CurrentSong.json", currentSong)
            audioPlaying = true
            delete playlist[playlistSong]

        } else {
            var songsPlayedkeys = Object.keys(songsPlayed);
            if (songsPlayedkeys.length > 0) {
                playlist = Object.assign({}, songsPlayed);
                songsPlayed = {};
            } else {
                audioPlaying = false;
            }

        }
    }

    clearInterval(nameUpdateTimeout)
    nameUpdateTimeout = setInterval(function () {
        display.text("Current Song: " + currentSong.title, 5, 5, {
            color: "white",
            font: "Impact",
            fontsize: "25px"
        }, "currentsong", 0, 1040, 0)
    }, 1000)

}


function init(commands, events, responses, options, viewerDB, display, say, statsDb) {
    /////////////////////
    //Plugin starts here
    commands.vol = function (channel, user, message, command, isPrivate) {
        if (options.admins.includes(user.username)) {
            if (command.split(" ")[1] != null) {
                var ammount = parseInt(command.split(" ")[1]);
                if ("" + ammount != "NaN") {
                    if (ammount > 0 && ammount <= 100) {
                        display.setVolume(ammount)
                        settings.volume = ammount / 100
                        say("", channel, "Volume set.", isPrivate)
                        DB.save(__dirname + "/Settings/YoutubeMusic.json", settings)
                    } else {
                        say(user, channel, "Usage: !vol <1 to 100>", isPrivate);
                    }
                } else {
                    say(user, channel, "Usage: !vol <1 to 100>", isPrivate);
                }
            } else {
                say(user, channel, "Usage: !vol <1 to 100>", isPrivate);
            }
        } else {
            say(user, channel, "You must be an administrator to use this command.", isPrivate);
        }
    }

    commands.pl = function (channel, user, message, command, isPrivate) {
        var keys = Object.keys(playlist);
        say(user, channel, "The length of the playlist is " + keys.length + ".", isPrivate)
    }
    commands.sr = function (channel, user, message, command, isPrivate) {
        songRequest(channel, user, command, say, isPrivate, display, options, viewerDB, message);

    }
    commands.srban = function (channel, user, message, command, isPrivate) {
        if (options.admins.includes(user.username)) {
            if (command.split(" ")[1] != null) {
                var targUser = command.split(" ")[1]
                if (viewerDB.Viewers[targUser] != null) {
                    if (viewerDB.Viewers[targUser].canSongRequest == null) {
                        viewerDB.Viewers[targUser].canSongRequest = true;
                    }
                    if (viewerDB.Viewers[targUser].canSongRequest) {
                        viewerDB.Viewers[targUser].canSongRequest = false;
                        say(user, channel, "User '" + targUser + "' is banned from song requests.", isPrivate);
                        var newsongstoplay = []
                        var songsRemoved = 0;
                        for (var i in songsToPlay) {
                            if (!songsToPlay[i].user == targUser) {
                                newsongstoplay.push(songsToPlay[i])
                            } else {
                                songsRemoved++;
                            }
                        }
                        songsToPlay = newsongstoplay;
                        say(user, channel, "Removed " + songsRemoved + " songs added by '" + targUser + "'.", isPrivate);
                        DB.save(__dirname + "/Settings/SongRequests.json", songsToPlay)
                    } else {
                        viewerDB.Viewers[targUser].canSongRequest = true;
                        say(user, channel, "User '" + targUser + "' is un-banned from song requests.", isPrivate);
                    }
                } else {
                    say(user, channel, "User '" + targUser + "' not found", isPrivate);
                }
            } else {
                say(user, channel, "Usage: !srban <user>", isPrivate);
            }
        } else {
            say(user, channel, "You must be an administrator to use this command.", isPrivate);
        }
    }
    commands.songrequestban = function (channel, user, message, command, isPrivate) {
        if (options.admins.includes(user.username)) {
            if (command.split(" ")[1] != null) {
                var targUser = command.split(" ")[1]
                if (viewerDB.Viewers[targUser] != null) {
                    if (viewerDB.Viewers[targUser].canSongRequest == null) {
                        viewerDB.Viewers[targUser].canSongRequest = true;
                    }
                    if (viewerDB.Viewers[targUser].canSongRequest) {
                        viewerDB.Viewers[targUser].canSongRequest = false;
                        say(user, channel, "User '" + targUser + "' is banned from song requests.", isPrivate);
                        var newsongstoplay = []
                        var songsRemoved = 0;
                        for (var i in songsToPlay) {
                            if (!songsToPlay[i].user == targUser) {
                                newsongstoplay.push(songsToPlay[i])
                            } else {
                                songsRemoved++;
                            }
                        }
                        songsToPlay = newsongstoplay;
                        say(user, channel, "Removed " + songsRemoved + " songs added by '" + targUser + "'.", isPrivate);
                        DB.save(__dirname + "/Settings/SongRequests.json", songsToPlay)
                    } else {
                        viewerDB.Viewers[targUser].canSongRequest = true;
                        say(user, channel, "User '" + targUser + "' is un-banned from song requests.", isPrivate);
                    }

                } else {
                    say(user, channel, "User '" + targUser + "' not found", isPrivate);
                }
            } else {
                say(user, channel, "Usage: !srban <user>", isPrivate);
            }
        } else {
            say(user, channel, "You must be an administrator to use this command.", isPrivate);
        }
    }
    commands.songrequest = function (channel, user, message, command, isPrivate) {

        songRequest(channel, user, command, say, isPrivate, display, options, viewerDB, message);

    }
    commands.skip = function (channel, user, message, command, isPrivate) {
        audiochannel = channel
        if (options.admins.includes(user.username)) {
            if (viewerDB.Viewers[currentSong.user] != null) {
                viewerDB.Viewers[currentSong.user].points += price;
                say(user, channel, currentSong.user + " refunded.", isPrivate)
            }
            nextSong(channel, say, display)
            say(user, channel, "Skipping song.", isPrivate)
        } else {
            say(user, channel, "You must be an administrator to use this command.", isPrivate);
        }
    }
    commands.ss = function (channel, user, message, command, isPrivate) {
        audiochannel = channel
        if (options.admins.includes(user.username)) {
            if (viewerDB.Viewers[currentSong.user] != null) {
                viewerDB.Viewers[currentSong.user].points += price;
                say(user, channel, currentSong.user + " refunded.", isPrivate)
            }

            nextSong(channel, say, display)
            say(user, channel, "Skipping song.", isPrivate)
        } else {
            say(user, channel, "You must be an administrator to use this command.", isPrivate);
        }
    }
    commands.pause = function (channel, user, message, command, isPrivate) {

        if (options.admins.includes(user.username)) {
            display.pauseAudio();
            say(user, channel, "Music paused.", isPrivate);
        } else {
            say(user, channel, "You must be an administrator to use this command.", isPrivate);
        }
    }
    commands.restart = function (channel, user, message, command, isPrivate) {
        if (options.admins.includes(user.username)) {
            display.stopAudio();
            display.playAudio();
            say(user, channel, "Restarted song.", isPrivate)
        } else {
            say(user, channel, "You must be an administrator to use this command.", isPrivate);
        }
    }
    commands.stop = function (channel, user, message, command, isPrivate) {
        if (options.admins.includes(user.username)) {
            display.stopAudio();
            stopped = true;
            say(user, channel, "Music stopped. Song requests disabled", isPrivate);
        } else {
            say(user, channel, "You must be an administrator to use this command.", isPrivate);
        }
    }
    commands.srtoggle = function (channel, user, message, command, isPrivate) {
        if (options.admins.includes(user.username)) {
            if (stopped) {
                stopped = false;
                say(user, channel, "Song requests enabled", isPrivate);
            } else {
                stopped = true;
                say(user, channel, "Song requests disabled", isPrivate);
            }

        } else {
            say(user, channel, "You must be an administrator to use this command.", isPrivate);
        }
    }
    commands.addsong = function (channel, user, message, command, isPrivate) {
        if (options.admins.includes(user.username)) {
            songAdd(channel, user, command, say, isPrivate, display, options, message)
        } else {
            say(user, channel, "You must be an administrator to use this command.", isPrivate);
        }
    }
    commands.as = function (channel, user, message, command, isPrivate) {
        if (options.admins.includes(user.username)) {
            songAdd(channel, user, command, say, isPrivate, display, options, message)
        } else {
            say(user, channel, "You must be an administrator to use this command.", isPrivate);
        }
    }
    commands.play = function (channel, user, message, command, isPrivate) {

        if (options.admins.includes(user.username)) {
            display.playAudio();
            stopped = false;
            say(user, channel, "Playing music.", isPrivate);
        } else {
            say(user, channel, "You must be an administrator to use this command.", isPrivate);
        }
    }
    commands.removesong = function (channel, user, message, command, isPrivate) {
        removeSong(channel, user, command, say, isPrivate, display, options)
    }

    commands.deletesong = function (channel, user, message, command, isPrivate) {
        removeSong(channel, user, command, say, isPrivate, display, options)
    }
    commands.ds = function (channel, user, message, command, isPrivate) {
        removeSong(channel, user, command, say, isPrivate, display, options)
    }
    commands.sn = function (channel, user, message, command, isPrivate) {
        say(user, channel, currentSong.title + " Requested by: " + currentSong.user, isPrivate);
    }

    commands.songname = function (channel, user, message, command, isPrivate) {
        say(user, channel, currentSong.title + " Requested by: " + currentSong.user, isPrivate);
    }
    events.on("audioComplete", function () {

        nextSong(audiochannel, say, display)
    })

}

function removeSong(channel, user, command, say, isPrivate, display, options) {
    audiochannel = channel
    if (options.admins.includes(user.username)) {
        if (songsPlayed[currentSong.src] != null) {
            delete songsPlayed[currentSong.src]
            say(user, channel, "Song removed from playlist and skipped.", isPrivate);
            DB.save(__dirname + "/Settings/Playlist.json", Object.assign(playlist, songsPlayed))
        } else {
            say(user, channel, "Song was not in play-list, but will skip.", isPrivate);
        }
        nextSong(channel, say, display)
    } else {
        say(user, channel, "You must be an administrator to use this command.", isPrivate);
    }
}

function songRequest(channel, user, command, say, isPrivate, display, options, viewerDB, message) {
    var price = 15
    if (user.subscriber) {
        price = 0
    }
    if (!stopped) {

        if (viewerDB.Viewers[user.username].canSongRequest == null) {
            viewerDB.Viewers[user.username].canSongRequest = true;
        }
        if (viewerDB.Viewers[user.username].canSongRequest) {


            if ((user.mod || options.admins.includes(user.username)) || viewerDB.Viewers[user.username].points >= price) {
                audiochannel = channel
                if (message.split(" ")[1] != null) {
                    var search = message.substr(message.indexOf(" ") + 1)
                    var hasParam = false;
                    if (search.includes("?v=")) {
                        var url_parts = url.parse(search, false);
                        var search = url_parts.query.split('v=')[1]
                        if (search.includes("&")) {
                            search = search.split("&")[0];
                        }
                        hasParam = true;
                    }
                    if (hasParam) {
                        youTube.getById(search, function (error, result) {
                            if (error) {
                                console.log(error);
                            } else {
                                if (result.items.length > 0 && result.items[0].id != null && result.items[0].id.videoId != null) {
                                    if (songsToPlay.length == 0 && !audioPlaying) {
                                        display.audio("https://www.youtube.com/watch?v=" + result.items[0].id.videoId, settings.volume)
                                        currentSong = {
                                            user: user.username,
                                            src: "https://www.youtube.com/watch?v=" + result.items[0].id.videoId,
                                            title: result.items[0].snippet.title
                                        }
                                        DB.save(__dirname + "/Settings/CurrentSong.json", {
                                            user: user.username,
                                            src: "https://www.youtube.com/watch?v=" + result.items[0].id.videoId,
                                            title: result.items[0].snippet.title
                                        })
                                        say(user, channel, "Playing '" + result.items[0].snippet.title + "' now.", isPrivate);
                                        audioPlaying = true;
                                    } else {
                                        songsToPlay.push({
                                            user: user.username,
                                            src: "https://www.youtube.com/watch?v=" + result.items[0].id.videoId,
                                            title: result.items[0].snippet.title
                                        })
                                        say(user, channel, "'" + result.items[0].snippet.title + "' added to queue. Position #" + songsToPlay.length + ".", isPrivate);
                                        DB.save(__dirname + "/Settings/SongRequests.json", songsToPlay)
                                    }
                                    if (!(user.mod || options.admins.includes(user.username))) {
                                        viewerDB.Viewers[user.username].points -= price;
                                    }
                                    if (price > 0) {
                                        say(user, channel, price + " " + options.pointsName + " taken. You now have " + round(viewerDB.Viewers[user.username].points) + " " + options.pointsName + ".", isPrivate)
                                    }


                                } else {
                                    youTube.search(search, 2, function (error, result) {
                                        if (error) {
                                            console.log(error);
                                            say(user, channel, "Could not find '" + search + "'. Please re-define your search.", isPrivate);
                                        } else {
                                            if (result.items.length > 0 && result.items[0].id != null && result.items[0].id.videoId != null) {

                                                if (songsToPlay.length == 0 && !audioPlaying) {
                                                    display.audio("https://www.youtube.com/watch?v=" + result.items[0].id.videoId, settings.volume)
                                                    currentSong = {
                                                        user: user.username,
                                                        src: "https://www.youtube.com/watch?v=" + result.items[0].id.videoId,
                                                        title: result.items[0].snippet.title
                                                    }
                                                    DB.save(__dirname + "/Settings/CurrentSong.json", {
                                                        user: user.username,
                                                        src: "https://www.youtube.com/watch?v=" + result.items[0].id.videoId,
                                                        title: result.items[0].snippet.title
                                                    })
                                                    say(user, channel, "Playing '" + result.items[0].snippet.title + "' now.", isPrivate);
                                                    audioPlaying = true;
                                                } else {
                                                    songsToPlay.push({
                                                        user: user.username,
                                                        src: "https://www.youtube.com/watch?v=" + result.items[0].id.videoId,
                                                        title: result.items[0].snippet.title
                                                    })
                                                    say(user, channel, "'" + result.items[0].snippet.title + "' added to queue. Position #" + songsToPlay.length + ".", isPrivate);
                                                    DB.save(__dirname + "/Settings/SongRequests.json", songsToPlay)
                                                }
                                                if (!(user.mod || options.admins.includes(user.username))) {
                                                    viewerDB.Viewers[user.username].points -= price;
                                                }

                                                if (price > 0) {
                                                    say(user, channel, price + " " + options.pointsName + " taken. You now have " + round(viewerDB.Viewers[user.username].points) + " " + options.pointsName + ".", isPrivate)
                                                }

                                            } else {
                                                say(user, channel, "Could not find '" + search + "'. Please re-define your search.", isPrivate);
                                            }
                                        }
                                    });
                                }


                            }

                        });
                    } else {
                        youTube.search(search, 2, function (error, result) {
                            if (error) {
                                console.log(error);
                                say(user, channel, "Could not find '" + search + "'. Please re-define your search.", isPrivate);
                            } else {
                                if (result.items.length > 0 && result.items[0].id != null && result.items[0].id.videoId != null) {
                                    if (songsToPlay.length == 0 && !audioPlaying) {
                                        display.audio("https://www.youtube.com/watch?v=" + result.items[0].id.videoId, settings.volume)
                                        currentSong = {
                                            user: user.username,
                                            src: "https://www.youtube.com/watch?v=" + result.items[0].id.videoId,
                                            title: result.items[0].snippet.title
                                        }
                                        DB.save(__dirname + "/Settings/CurrentSong.json", {
                                            user: user.username,
                                            src: "https://www.youtube.com/watch?v=" + result.items[0].id.videoId,
                                            title: result.items[0].snippet.title
                                        })
                                        say(user, channel, "Playing '" + result.items[0].snippet.title + "' now.", isPrivate);
                                        audioPlaying = true;
                                    } else {
                                        songsToPlay.push({
                                            user: user.username,
                                            src: "https://www.youtube.com/watch?v=" + result.items[0].id.videoId,
                                            title: result.items[0].snippet.title
                                        })
                                        say(user, channel, "'" + result.items[0].snippet.title + "' added to queue. Position #" + songsToPlay.length + ".", isPrivate);
                                        DB.save(__dirname + "/Settings/SongRequests.json", songsToPlay)
                                    }
                                    if (!(user.mod || options.admins.includes(user.username))) {
                                        viewerDB.Viewers[user.username].points -= price;
                                    }
                                    if (price > 0) {
                                        say(user, channel, price + " " + options.pointsName + " taken. You now have " + round(viewerDB.Viewers[user.username].points) + " " + options.pointsName + ".", isPrivate)
                                    }

                                } else {
                                    say(user, channel, "Could not find '" + search + "'. Please re-define your search.", isPrivate);
                                }
                            }
                        });
                    }


                } else {
                    say(user, channel, "Usage: !sr <Song Name or Youtube URL / ID>", isPrivate);
                }

            } else {
                say(user, channel, "This costs " + price + " " + options.pointsName + " but you only have " + round(viewerDB.Viewers[user.username].points) + " " + options.pointsName + ".", isPrivate)
            }
        } else {
            say(user, channel, "You are not allowed to request songs.", isPrivate)
        }
    } else {
        say(user, channel, "We are currently not accepting song requests.", isPrivate);
    }



}

function songAdd(channel, user, command, say, isPrivate, display, options, message) {
    audiochannel = channel
    if (message.split(" ")[1] != null) {
        var search = message.substr(message.indexOf(" ") + 1)
        var hasParam = false;
        if (search.includes("?v=")) {
            var url_parts = url.parse(search, false);
            var search = url_parts.query.split('v=')[1]
            if (search.includes("&")) {
                search = search.split("&")[0];
            }
            hasParam = true;
        }
        if (hasParam) {
            youTube.getById(search, function (error, result) {
                if (error) {
                    console.log(error);
                } else {
                    if (result.items.length > 0 && result.items[0].id != null && result.items[0].id.videoId != null) {
                        if (playlist["https://www.youtube.com/watch?v=" + result.items[0].id.videoId] == null && songsPlayed["https://www.youtube.com/watch?v=" + result.items[0].id.videoId] == null) {
                            songsPlayed["https://www.youtube.com/watch?v=" + result.items[0].id.videoId] = result.items[0].snippet.title
                            DB.save(__dirname + "/Settings/Playlist.json", Object.assign(playlist, songsPlayed))
                            if (songsToPlay.length == 0 && !audioPlaying) {
                                display.audio("https://www.youtube.com/watch?v=" + result.items[0].id.videoId, settings.volume)
                                currentSong = {
                                    user: user.username,
                                    src: "https://www.youtube.com/watch?v=" + result.items[0].id.videoId,
                                    title: result.items[0].snippet.title
                                }
                                DB.save(__dirname + "/Settings/CurrentSong.json", {
                                    user: user.username,
                                    src: "https://www.youtube.com/watch?v=" + result.items[0].id.videoId,
                                    title: result.items[0].snippet.title
                                })
                                say(user, channel, "Playing '" + result.items[0].snippet.title + "' now.", isPrivate);
                                audioPlaying = true;
                            } else {
                                songsToPlay.push({
                                    user: user.username,
                                    src: "https://www.youtube.com/watch?v=" + result.items[0].id.videoId,
                                    title: result.items[0].snippet.title
                                })
                                say(user, channel, "'" + result.items[0].snippet.title + "' added to queue. Position #" + songsToPlay.length + ".", isPrivate);
                                DB.save(__dirname + "/Settings/SongRequests.json", songsToPlay)
                            }
                            say(user, channel, "'" + result.items[0].snippet.title + "' was added.", isPrivate);
                        } else {
                            say(user, channel, "Song is already in playlist", isPrivate);
                        }
                    } else {
                        youTube.search(search, 2, function (error, result) {
                            if (error) {
                                console.log(error);
                                say(user, channel, "Could not find '" + search + "'. Please re-define your search.", isPrivate);
                            } else {
                                if (result.items.length > 0 && result.items[0].id != null && result.items[0].id.videoId != null) {
                                    if ((playlist["https://www.youtube.com/watch?v=" + result.items[0].id.videoId] == null && songsPlayed["https://www.youtube.com/watch?v=" + result.items[0].id.videoId] == null)) {
                                        songsPlayed["https://www.youtube.com/watch?v=" + result.items[0].id.videoId] = result.items[0].snippet.title
                                        DB.save(__dirname + "/Settings/Playlist.json", Object.assign(playlist, songsPlayed))
                                        if (songsToPlay.length == 0 && !audioPlaying) {
                                            display.audio("https://www.youtube.com/watch?v=" + result.items[0].id.videoId, settings.volume)
                                            currentSong = {
                                                user: user.username,
                                                src: "https://www.youtube.com/watch?v=" + result.items[0].id.videoId,
                                                title: result.items[0].snippet.title
                                            }
                                            DB.save(__dirname + "/Settings/CurrentSong.json", {
                                                user: user.username,
                                                src: "https://www.youtube.com/watch?v=" + result.items[0].id.videoId,
                                                title: result.items[0].snippet.title
                                            })
                                            say(user, channel, "Playing '" + result.items[0].snippet.title + "' now.", isPrivate);
                                            audioPlaying = true;
                                        } else {
                                            songsToPlay.push({
                                                user: user.username,
                                                src: "https://www.youtube.com/watch?v=" + result.items[0].id.videoId,
                                                title: result.items[0].snippet.title
                                            })
                                            say(user, channel, "'" + result.items[0].snippet.title + "' added to queue. Position #" + songsToPlay.length + ".", isPrivate);
                                            DB.save(__dirname + "/Settings/SongRequests.json", songsToPlay)
                                        }
                                        say(user, channel, "'" + result.items[0].snippet.title + "' was added.", isPrivate);
                                    } else {
                                        say(user, channel, "Song is already in playlist", isPrivate);
                                    }
                                } else {
                                    say(user, channel, "Could not find '" + search + "'. Please re-define your search.", isPrivate);
                                }
                            }
                        });


                    }
                }
            });
        } else {
            youTube.search(search, 2, function (error, result) {
                if (error) {
                    console.log(error);
                    say(user, channel, "Could not find '" + search + "'. Please re-define your search.", isPrivate);
                } else {
                    if (result.items.length > 0 && result.items[0].id != null && result.items[0].id.videoId != null) {
                        if (playlist["https://www.youtube.com/watch?v=" + result.items[0].id.videoId] == null && songsPlayed["https://www.youtube.com/watch?v=" + result.items[0].id.videoId] == null) {
                            songsPlayed["https://www.youtube.com/watch?v=" + result.items[0].id.videoId] = result.items[0].snippet.title
                            DB.save(__dirname + "/Settings/Playlist.json", Object.assign(playlist, songsPlayed))
                            if (songsToPlay.length == 0 && !audioPlaying) {
                                display.audio("https://www.youtube.com/watch?v=" + result.items[0].id.videoId, settings.volume)
                                currentSong = {
                                    user: user.username,
                                    src: "https://www.youtube.com/watch?v=" + result.items[0].id.videoId,
                                    title: result.items[0].snippet.title
                                }
                                DB.save(__dirname + "/Settings/CurrentSong.json", {
                                    user: user.username,
                                    src: "https://www.youtube.com/watch?v=" + result.items[0].id.videoId,
                                    title: result.items[0].snippet.title
                                })
                                say(user, channel, "Playing '" + result.items[0].snippet.title + "' now.", isPrivate);
                                audioPlaying = true;
                            } else {
                                songsToPlay.push({
                                    user: user.username,
                                    src: "https://www.youtube.com/watch?v=" + result.items[0].id.videoId,
                                    title: result.items[0].snippet.title
                                })
                                say(user, channel, "'" + result.items[0].snippet.title + "' added to queue. Position #" + songsToPlay.length + ".", isPrivate);
                                DB.save(__dirname + "/Settings/SongRequests.json", songsToPlay)
                            }
                            say(user, channel, "'" + result.items[0].snippet.title + "' was added.", isPrivate);
                        } else {
                            say(user, channel, "Song is already in playlist", isPrivate);
                        }
                    } else {
                        say(user, channel, "Could not find '" + search + "'. Please re-define your search.", isPrivate);
                    }
                }
            });
        }

    } else {
        if (playlist[currentSong.src] == null && songsPlayed[currentSong.src] == null) {
            say(user, channel, "Added current song.", isPrivate);
            say({
                username: currentSong.user
            }, channel, "Dope song bruddah. Here's 30 points.", isPrivate);
            viewerDB.Viewers[currentSong.user].points += 30;

            songsPlayed[currentSong.src] = currentSong.title;
            DB.save(__dirname + "/Settings/Playlist.json", Object.assign(playlist, songsPlayed))
        } else {
            say(user, channel, "Song is already in playlist", isPrivate);
        }
    }
}
module.exports.init = init;
