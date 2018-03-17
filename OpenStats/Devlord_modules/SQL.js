//Simple SQL Replicator 0.1.1
//Author Name: Dustin Harris
//Work Email:duharris@ebay.com
//Personal Email:dmhzmxn@gmail.com
//*********************************
//
//
var fs = require('fs');
var Logging = require('./Logging.js');
var DataRefreshRate = 120000;
var Tables = [];
var PullTimeout
var SQLConnection
var ConnectionPool = require('tedious-connection-pool');
var Request = require('tedious').Request;

//------------------------------
//---------SQL Functions--------
//------------------------------

//Connect SQL pool with passed options
function Connect(options) {
    //force these settings
    var poolConfig = {
        min: 1,
        max: 99,
        log: false
    };
    //Collect rows into array on query done
    options.options.rowCollectionOnDone = true;
    //Create automatically pooling SQL connection
    SQLConnection = new ConnectionPool(poolConfig, options)
    //Print SQL errors
    SQLConnection.on('error', function (err) {
        Logging.log(err, true, "SQL")
    });
    //Save pull timeout so we can cancel it later
    PullTimeout = setTimeout(RefreshTables, 0);
}
Date.prototype.addDays = function (days) {
    var dat = new Date(this.valueOf());
    dat.setDate(dat.getDate() + days);
    return dat;
}
Date.prototype.subDays = function (days) {
    var dat = new Date(this.valueOf());
    dat.setDate(dat.getDate() - days);
    return dat;
}
function RefreshTables() {
    try {
        var now = new Date();
        //Clear list
        updatedList = [];
        //Go through all tables
        for (i = 0; i < Tables.length; i++) {
            //If the query is not blank
            if (Tables[i].query != "") {
                for (var key in Tables[i].data) {
                    if (key != "None") {
                        var TimeStart = key.split(" ")[0]
                        var TimeEnd = key.split(" ")[1]
                        var varDate = new Date(TimeEnd).addDays(1);
                        if (varDate >= now) {
                            SQL_Query(Tables[i].query + " '" + TimeStart + "', '" + TimeEnd + "'", Tables[i], key);
                        }
                    }
                }
            }
        }
    } catch (err) {
        Logging.log("Table refresh failed: " + err, true, "SQL");
    }
    try {
        //Call update complete callback
        UpdateComplete(updatedList);
    } catch (err) {
        Logging.log("Refresh callback failed: " + err, true, "SQL");
    }
    //Save pull timeout so we can cancel it later
    clearTimeout(PullTimeout);
    //But this keeps the tables refreshing
    PullTimeout = setTimeout(RefreshTables, DataRefreshRate);
}

//Asynchrounsouly querys SQL
function SQL_Query(query, table, timeRange) {
    // Attempt to connect and execute queries if connection goes through
    SQLConnection.acquire(function (err, connection) {
        //Create ansyc request obj and callback
        var request = new Request(query, function (err, rowCount, rows) {
            //Make timestamp for this pull completion time
            var ts = formatDate(new Date(), "hh:mm:ss MMM dd", false);
            //Handle errors
            if (err) {
                //Set table error message to prompt error overlay
                table.data[timeRange].error = "Query failed for table'" + table.name + "': " + err
                //Logging.log it obviously
                Logging.log(table.data[timeRange].error, true, "SQL")
                //Set timestamp on table
                table.data[timeRange].ts = ts;
                //Clear out the new rows, they do not need to be stored after parsing
                table.data[timeRange].newrows = [];
                //Secore the table and remove sensitive data
                var newtable = secureTable(clone(table))
                //Table query callback
                try {
                    table.callback(newtable, timeRange, table.data[timeRange].error, rowCount, rows);
                } catch (err) {
                    //Handle table lookup error
                    Logging.log("Callback failed for table '" + table.name + "': " + err, true, "SQL");
                }
            } else {
                //Make a row object for holding a row at a time
                var newRow = []
                //Build table from sql query
                if (isDefined(table.data[timeRange].newrows) && table.data[timeRange].newrows.length > 0) {
                    for (i = 0; i < table.data[timeRange].newrows[0].length; i++) {
                        newRow.push(table.data[timeRange].newrows[0][i].metadata.colName)
                    }
                    table.data[timeRange].data = [];
                    table.data[timeRange].data.push(newRow)
                    for (i = 0; i < table.data[timeRange].newrows.length; i++) {
                        newRow = []
                        for (i2 = 0; i2 < table.data[timeRange].newrows[i].length; i2++) {
                            if (isDefined(table.data[timeRange].newrows[i][i2])) {
                                newRow.push(table.data[timeRange].newrows[i][i2].value)
							}
                        }
                        table.data[timeRange].data.push(newRow)
                    }
                    //Clear errors
                    table.data[timeRange].error = ""
                    //Remove unneeded newrows
                    table.data[timeRange].newrows = [];
                    //Set the timestamp
                    table.data[timeRange].ts = ts;
                    //clone the table and secure the data in it
                    var newtable = secureTable(clone(table))
                    //Callback for table data update
                    try {
                        //table.callback(newtable, timeRange, "", rowCount, table.data[timeRange].newrows);
                    } catch (err) {
                        //Handle table lookup error
                        Logging.log("Callback failed for table '" + table.name + "': " + err, true, "SQL");
                    }
                    table.callback(newtable, timeRange, "", rowCount, table.data[timeRange].newrows);
                } else {
                    //Set table error message
                    table.data[timeRange].error = "Query '" + table.name + "' Didn't return data."
                    Logging.log(table.data[timeRange].error, true, "SQL")
                    //Remove unneeded newrows
                    table.data[timeRange].newrows = [];
                    //Set the timestamp
                    table.data[timeRange].ts = ts;
                    //clone the table and secure the data in it
                    var newtable = secureTable(clone(table))
                     //Callback for table data update
                    try {
                        table.callback(newtable, timeRange, table.data[timeRange].error, rowCount, table.data[timeRange].newrows);
                    } catch (err) {
                        //Handle table lookup error
                        Logging.log("Callback failed for table '" + table.name + "': " + err, true, "SQL");
                    }
                }
                //Release this query pool
                connection.release();
            }
        })
        //Handle asynchrounsouly collecting rows from SQL
        request.on('row', function (columns) {
            //Push each new row
            table.data[timeRange].newrows.push(columns)
        });
        try {
            // Read all rows from table
            connection.execSql(request);
        } catch (err) {
            //generate timestamp
            var ts = formatDate(new Date(), "hh:mm:ss MMM dd", false);
            //Set Table error message
            table.data[timeRange].error = "Query failed for table '" + table.name + "': " + err
            Logging.log(table.error, true, "SQL")
            //Remove unneeded newrows
            table.data[timeRange].newrows = [];
            //Set the timestamp
            table.data[timeRange].ts = ts;
            //clone the table and secure the data in it
            var newtable = secureTable(clone(table))
            //Callback for table data update
            
            try {
                table.callback(newtable, timeRange, table.data[timeRange].error, 0, []);
            } catch (err) {
                //Handle table lookup error
                Logging.log("Callback failed for table '" + table.name + "': " + err, true, "SQL");
            }
        }

    })
}
//---------------------------
//------Table Functions------
//---------------------------
//return if table exists
function tableExists(name) {
    try {
        var rtrn = false;
        //set default return to false
        for (i = 0; i < Tables.length; i++) {
            //go through all tables and find the one with the matching name
            if (Tables[i].name == name) {
                //stop loop and return true
                rtrn = true;
                break;
            }
        }
        return rtrn
    } catch (err) {
        //Report error with table lookup
        Logging.log("Table lookup failed!: " + err, true, "SQL");
    }
}
//Add new table to replicator pool
function AddTable(name, query, callback = function (table, timeRange, err, rowCount, rows) { }) {
    //prevent duplicates
    if (tableExists(name)) {
        //report duplicate
        Logging.log("Table '" + name + "' already exists.", false, "SQL");
    } else {
        //make new timestamp
        var ts = formatDate(new Date(), "hh:mm:ss MMM dd", false);
        var now = new Date();
        var date = [now.getFullYear(), now.getMonth() + 1, now.getDate()];
        var Today = date.join("/");
        var tom = new Date();
        var tom = tom.addDays(1)
        date = [tom.getFullYear(), tom.getMonth() + 1, tom.getDate()];
        var Tommorrow = date.join("/")
        //push new table object
        Tables.push({ name: name, query: query, callback: callback, data: {}});
        //Logging.log it
        Logging.log("Table '" + name + "' added!", false, "SQL");
    }

}
function AddTimeRange(name, TimeRangeStr) {
    var table = GetTable(name)
    table.data[TimeRangeStr] = {}
    table.data[TimeRangeStr] = { data: {}, ts: "", newrows: [], error: "" }
    //Logging.log("Table '" + name + "' new time range added.", false, "SQL");
    if (table.query != "") {
        try {
            var TimeStart = TimeRangeStr.split(" ")[0]
            var TimeEnd = TimeRangeStr.split(" ")[1]
            SQL_Query(table.query + " '" + TimeStart + "', '" + TimeEnd + "'", table, TimeRangeStr);
            
        } catch (err) {
            Logging.log("Failure querying newly added timerange for table '" + name + "': " + err, true, "SQL");
        }
        
    }
}
//Get table by name
function GetTable(name) {
    try {
        var rtrn
        //init return var
        name = name.trim()
        //trim name
        var success = false
        for (i = 0; i < Tables.length; i++) {
            //go through every table to find matching name
            if (Tables[i].name == name) {
                //return that table
                rtrn = Tables[i];
                success = true
                break;
            }
        }
        if (!success) {
            //Logging.log("Table lookup failed!: " + "Could not find table '" + name + "'.", true, "SQL");
        }
        return rtrn
    } catch (err) {
        //Handle table lookup error
        Logging.log("Table lookup failed!: " + err, true, "SQL");
    }
}
function GetTableClone(name) {
    try {
        var rtrn
        //init return var
        name = name.trim()
        //trim name
        var success = false
        for (i = 0; i < Tables.length; i++) {
            //go through every table to find matching name
            if (Tables[i].name == name) {
                //return that table
                rtrn = secureTable(clone(Tables[i]));
                success = true
                break;
            }
        }
        if (!success) {
            Logging.log("Table lookup failed!: " + "Could not find table '" + name +  "'.", true, "SQL");
        }
        return rtrn
    } catch (err) {
        //Handle table lookup error
        Logging.log("Table lookup failed!: " + err, true, "SQL");
    }
}
//Serialize table
function StringifyTable(name) {
    //If table exists
    if (tableExists(name)) {
        //seriazlize it and return it
        return JSON.stringify(GetTable(name));
    } else {
        return;
    }
}

//Serialize single table and save to disk
function ExportTable(name, path) {
    try {
        //Turn table into string
        var expoStr = StringifyTable(name)
        //Check if it is defined
        if (isDefined(expoStr)) {
            //Write the serialized file contents
            fs.writeFile(path, expoStr, function (err) {
                if (err) {
                    //Report errors
                    Logging.log("Table Export Failed!: " + err, true, "SQL");
                }
            });
        } else {
             //Report errors
            Logging.log("Table Export Failed! No data found for table '" + name + "'.", true, "SQL");
        }
    } catch (err) {
         //Report errors
        Logging.log("Table Export Failed!: " + err, true, "SQL");
    }
}
//Export Entire Replication DB
function Export(path) {
    try {
        //Serialize the DB and save it to specified path
        fs.writeFile(path, JSON.stringify(Tables), function (err) {
            if (err) {
                //Report errors
                return Logging.log("Table Export Failed!: " + err, true, "SQL");
            }
        });
    } catch (err) {
        //Report errors
        Logging.log("Table Export Failed!: " + err, true, "SQL");
    }
}
//Remove secure info from table
function secureTable(obj) {
    obj.callback = undefined;

    obj.newrows = [];

    return obj
}

//-----------------------------
//--------Misc Function--------
//-----------------------------
//Fully formats datetime obj
function formatDate(date, format, utc) {
    var MMMM = ["\x00", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var MMM = ["\x01", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var dddd = ["\x02", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var ddd = ["\x03", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    function ii(i, len) {
        var s = i + "";
        len = len || 2;
        while (s.length < len) s = "0" + s;
        return s;
    }

    var y = utc ? date.getUTCFullYear() : date.getFullYear();
    format = format.replace(/(^|[^\\])yyyy+/g, "$1" + y);
    format = format.replace(/(^|[^\\])yy/g, "$1" + y.toString().substr(2, 2));
    format = format.replace(/(^|[^\\])y/g, "$1" + y);

    var M = (utc ? date.getUTCMonth() : date.getMonth()) + 1;
    format = format.replace(/(^|[^\\])MMMM+/g, "$1" + MMMM[0]);
    format = format.replace(/(^|[^\\])MMM/g, "$1" + MMM[0]);
    format = format.replace(/(^|[^\\])MM/g, "$1" + ii(M));
    format = format.replace(/(^|[^\\])M/g, "$1" + M);

    var d = utc ? date.getUTCDate() : date.getDate();
    format = format.replace(/(^|[^\\])dddd+/g, "$1" + dddd[0]);
    format = format.replace(/(^|[^\\])ddd/g, "$1" + ddd[0]);
    format = format.replace(/(^|[^\\])dd/g, "$1" + ii(d));
    format = format.replace(/(^|[^\\])d/g, "$1" + d);

    var H = utc ? date.getUTCHours() : date.getHours();
    format = format.replace(/(^|[^\\])HH+/g, "$1" + ii(H));
    format = format.replace(/(^|[^\\])H/g, "$1" + H);

    var h = H > 12 ? H - 12 : H == 0 ? 12 : H;
    format = format.replace(/(^|[^\\])hh+/g, "$1" + ii(h));
    format = format.replace(/(^|[^\\])h/g, "$1" + h);

    var m = utc ? date.getUTCMinutes() : date.getMinutes();
    format = format.replace(/(^|[^\\])mm+/g, "$1" + ii(m));
    format = format.replace(/(^|[^\\])m/g, "$1" + m);

    var s = utc ? date.getUTCSeconds() : date.getSeconds();
    format = format.replace(/(^|[^\\])ss+/g, "$1" + ii(s));
    format = format.replace(/(^|[^\\])s/g, "$1" + s);

    var f = utc ? date.getUTCMilliseconds() : date.getMilliseconds();
    format = format.replace(/(^|[^\\])fff+/g, "$1" + ii(f, 3));
    f = Math.round(f / 10);
    format = format.replace(/(^|[^\\])ff/g, "$1" + ii(f));
    f = Math.round(f / 10);
    format = format.replace(/(^|[^\\])f/g, "$1" + f);

    var T = H < 12 ? "AM" : "PM";
    format = format.replace(/(^|[^\\])TT+/g, "$1" + T);
    format = format.replace(/(^|[^\\])T/g, "$1" + T.charAt(0));

    var t = T.toLowerCase();
    format = format.replace(/(^|[^\\])tt+/g, "$1" + t);
    format = format.replace(/(^|[^\\])t/g, "$1" + t.charAt(0));

    var tz = -date.getTimezoneOffset();
    var K = utc || !tz ? "Z" : tz > 0 ? "+" : "-";
    if (!utc) {
        tz = Math.abs(tz);
        var tzHrs = Math.floor(tz / 60);
        var tzMin = tz % 60;
        K += ii(tzHrs) + ":" + ii(tzMin);
    }
    format = format.replace(/(^|[^\\])K/g, "$1" + K);

    var day = (utc ? date.getUTCDay() : date.getDay()) + 1;
    format = format.replace(new RegExp(dddd[0], "g"), dddd[day]);
    format = format.replace(new RegExp(ddd[0], "g"), ddd[day]);

    format = format.replace(new RegExp(MMMM[0], "g"), MMMM[M]);
    format = format.replace(new RegExp(MMM[0], "g"), MMM[M]);

    format = format.replace(/\\(.)/g, "$1");

    return format;
};
//Checks if obj is defined
function isDefined(x) {
    var undefined;
    return x !== undefined;
}
//Clones OBJ and removes reference
function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
//Sets callback on completion of updating all tables
function OnTableUpdateComplete(thefunction) {
    UpdateComplete = thefunction
}
//Placeholder callback function
var UpdateComplete = function () {

}







//List all public objects
exports.Connect = Connect;
exports.Tables = Tables;
exports.GetTable = GetTable;
exports.GetTableClone = GetTableClone;
exports.StringifyTable = StringifyTable;
exports.AddTable = AddTable;
exports.ExportTable = ExportTable;
exports.OnTableUpdateComplete = OnTableUpdateComplete;
exports.Export = Export;
exports.tableExists = tableExists;
exports.secureTable = secureTable;
exports.AddTimeRange = AddTimeRange;