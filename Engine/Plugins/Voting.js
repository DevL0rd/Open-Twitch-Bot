//Authour: DevL0rd
//GitHub: https://github.com/DevL0rd
//Last Update: 8/22/2017
//Version: 1
/////////////////////////////////
//Public vars and functions here

//holds timeout for vote in case it needs to be cleared
var killVoteTimeout;
//Is vote going on now
var isVoting = false;
//Hold end vote timeout in case it needs to be cleared
var voteNotifyTimeout;
//array to hold voters
var voters = [];
//hold votes in obj
var voteAnswers = {}
//holds list of vote options
var voteoptions = []

//round int to 2 decimals
function round(inty) {
    return Math.round(inty * 100) / 100;
}

function init(commands, events, responses, options, viewerDB, display, say, statsDb) {
    /////////////////////
    //Plugin starts here

    //Make a new command
    //Voting system
    commands.vote = function (channel, user, message, command, isPrivate) {
        //get param after "!vote "
        var param = command.slice(command.indexOf(' ') + 1)
        //if param is a vote option, and is voting, cast vote
        if (voteAnswers[param] != null && isVoting) {

            if (voters.includes(user.username)) {
                //if user has already voted
                say(user, channel, "You have already voted.", isPrivate)
                param = "";
            } else {
                //increase vote for option
                voteAnswers[param].votes++
                    //add user to voters list
                    voters.push(user.username)
            }
        } else if (!isVoting && param != "" && param != "vote" && voteAnswers[param] == null) {
            //if no voting is going on, make new vote
            //if user is mod or admin
            if ((user.mod || options.admins.includes(user.username))) {
                //clear old voters
                voters = [];

                if (param.includes(" -o ")) {
                    //if params has options flag
                    //get everything before -o as param
                    var params = param.split(" -o ")
                    param = params[0]
                    //get everything after -o and split up the options by the delimiter ' | '
                    voteoptions = params[1].split(" | ")
                    //setup each vote option
                    for (i in voteoptions) {
                        voteAnswers[voteoptions[i]] = {
                            votes: 0
                        }
                    }
                    //show vote instructions
                    say(user, channel, "'" + param + "' To vote type '!vote " + voteoptions.join("/") + "'. ", isPrivate)
                } else {
                    //use default options
                    voteAnswers = {
                        y: {
                            votes: 0
                        },
                        n: {
                            votes: 0
                        }
                    }
                    //update vote options
                    voteoptions = ["y", "n"]
                    //show vote instructions
                    say(user, channel, "'" + param + "' To vote type '!vote " + voteoptions.join("/") + "'. ", isPrivate)
                }
                //show vote instructions
                say(user, channel, "You have 45 seconds to vote.  (Costs 5 " + options.pointsName + ")", isPrivate)
                //start vote
                isVoting = true;
                //clear old vote loop if it exists
                clearTimeout(killVoteTimeout)
                //start timeout for end of vote
                killVoteTimeout = setTimeout(function () {
                    //clear any existing timeout
                    clearTimeout(voteNotifyTimeout);
                    //stop the vote.
                    isVoting = false;
                    //say results.
                    say("", channel, "Voting ended. Results:", isPrivate)
                    for (i in voteoptions) {
                        say("", channel, voteoptions[i] + ": " + voteAnswers[voteoptions[i]].votes, isPrivate)
                    }

                }, 45000) // timeout of 45 seconds
            } else {
                //user is not admin
                say(user, channel, "You must be an administrator to use this command like this.", isPrivate)
            }
        }
        //if user voted, print points status
        if (isVoting && (voteAnswers[param] != null)) {
            say(user, channel, "5 " + options.pointsName + " taken. You now have " + round(viewerDB.Viewers[user.username].points) + " " + options.pointsName + ".", isPrivate)
        }
    }
}
module.exports.init = init;
