//Authour: DevL0rd
//GitHub: https://github.com/DevL0rd
function init(plugins, settings, events, io, log, commands) {
    commands.refresh = {
        usage: "refresh",
        help: "Forces all clients to refresh.",
        do: function () {
            log("Forcing clients to refresh.")
            io.emit("forceRefresh")
        }
    }
}
exports.init = init;