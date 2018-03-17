//Authour: DevL0rd
//GitHub: https://github.com/DevL0rd
//Last Update: 5/18/2017
//Version: 0.1.6
var os = require('os');
var MaxHistoryLength = 31
function round(value, decimals) {
    //This rounds a decimal by the specified number of decmial places
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
};
var onTick = function() {

}
function Start(histLength, NewonTick) {
    MaxHistoryLength = histLength
    onTick = NewonTick
    setInterval(function () {
        Cpu.PollUsage()
        Memory.PollUsage()
        onTick()
    }, 1000)
}

var Memory = {
    "Size": function (Unit) {
        var Result
        if (Unit == "B") {
            Result = os.totalmem()
        } else if (Unit == "KB") {
            Result = os.totalmem() / 1000
        } else if (Unit == "MB") {
            Result = os.totalmem() / 1000000
        } else if (Unit == "GB") {
            Result = os.totalmem() / 1000000000
        }
        return Result
    },
    "Usage": function (Unit) {
        var Result
        var UsedMem = this.UsageHistory[this.UsageHistory.length - 1]
        if (Unit == "B") {
            Result = UsedMem
        } else if (Unit == "KB") {
            Result = UsedMem / 1000
        } else if (Unit == "MB") {
            Result = UsedMem / 1000000
        } else if (Unit == "GB") {
            Result = UsedMem / 1000000000
        }
        return Result
    },
    "Free": function (Unit) {
        var Result
        if (Unit == "B") {
            Result = os.freemem()
        } else if (Unit == "KB") {
            Result = os.freemem() / 1000
        } else if (Unit == "MB") {
            Result = os.freemem() / 1000000
        } else if (Unit == "GB") {
            Result = os.freemem() / 1000000000
        }
        return Result
    }, "PollUsage": function () {
        var Result = (os.totalmem() - os.freemem())
        this.UsageHistory.push(Result)
        if (this.UsageHistory.length > MaxHistoryLength) {
            this.UsageHistory = this.UsageHistory.slice(1, this.UsageHistory.length)
        }
        
        return Result
    },
    "UsageHistory": []
}
var cpuMeasuringData = []
var Cpu = {
    "startMeasure": cpuAverage(),
    "PollUsage": function () {
        var cpus = os.cpus();
        
        for (var i = 0, len = cpus.length; i < len; i++) {
            if (i > cpuMeasuringData.length - 1) {
                cpuMeasuringData.push({ startMeasure: { idle: 0, total: 0 } })
            }
           
            if (i + 1 > this.UsageHistory.length - 1) {
                this.UsageHistory.push([])
            }

            //Select CPU core
            var cpu = cpus[i];
           
            var coreTimeTotal = 0
            //Total up the time in the cores tick
            
            for (type in cpu.times) {
                coreTimeTotal += cpu.times[type];
            }
            
            cpuMeasuringData[i].endMeasure = { idle: cpu.times.idle, total: coreTimeTotal };
            var Result = 0
            //Calculate the difference in idle and total time between the measures
            var idleDifference = cpuMeasuringData[i].endMeasure.idle - cpuMeasuringData[i].startMeasure.idle;
            var totalDifference = cpuMeasuringData[i].endMeasure.total - cpuMeasuringData[i].startMeasure.total;
            
            //Calculate the average percentage CPU usage
            Result = 100 - ~~(100 * idleDifference / totalDifference);
            this.UsageHistory[i + 1].push(Result)
           
            if (this.UsageHistory[i + 1].length > MaxHistoryLength) {
                this.UsageHistory[i + 1] = this.UsageHistory[i + 1].slice(1, this.UsageHistory[i + 1].length)
            }
           
            
        }
        cpus = os.cpus();
        for (var i = 0, len = cpus.length; i < len; i++) {
            //Select CPU core
            var cpu = cpus[i];

            var coreTimeTotal = 0
            //Total up the time in the cores tick

            for (type in cpu.times) {
                coreTimeTotal += cpu.times[type];

            }
            //Grab first CPU Measure
            cpuMeasuringData[i].startMeasure = { idle: cpu.times.idle, total: coreTimeTotal };
        }
        
        var Result = 0
        var endMeasure = cpuAverage();
        //Calculate the difference in idle and total time between the measures
        var idleDifference = endMeasure.idle - this.startMeasure.idle;
        var totalDifference = endMeasure.total - this.startMeasure.total;
        //Calculate the average percentage CPU usage
        Result = 100 - ~~(100 * idleDifference / totalDifference);
        this.UsageHistory[0].push(Result)
        if (this.UsageHistory[0].length > MaxHistoryLength) {
            this.UsageHistory[0] = this.UsageHistory[0].slice(1, this.UsageHistory[0].length)
        }
        //Grab first CPU Measure
        this.startMeasure = cpuAverage();
        return Result
    },
    "UsageHistory": [[]],
    "Usage": function (core) {
        return this.UsageHistory[core][this.UsageHistory[core].length - 1]
    },
    "Count": os.cpus().length
}
function cpuAverage() {

    //Initialise sum of idle and time of cores and fetch CPU info
    var totalIdle = 0, totalTick = 0;
    var cpus = os.cpus();

    //Loop through CPU cores
    for (var i = 0, len = cpus.length; i < len; i++) {

        //Select CPU core
        var cpu = cpus[i];

        //Total up the time in the cores tick
        for (type in cpu.times) {
            totalTick += cpu.times[type];
        }

        //Total up the idle time of the core
        totalIdle += cpu.times.idle;
    }

    //Return the average Idle and Tick times
    return { idle: totalIdle / cpus.length, total: totalTick / cpus.length };
}


//List all public objects
exports.Cpu = Cpu;
exports.Memory = Memory;
exports.onTick = onTick
exports.Start = Start