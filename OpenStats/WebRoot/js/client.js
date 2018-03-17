//Simple Dashboard Client 0.0.5
//Author Name: Dustin Harris
//Work Email:duharris@ebay.com
//Personal Email:dmhzmxn@gmail.com
//*********************************
//
//

//------------------------------
//------Load Local Storage------
//------------------------------
//Make new socket connection
var socket = io();
var tvDisconnectTimout = 120000;
var Page = 0;
if (localStorage.Page == null) {
    localStorage.Page = 0;
} else {
    Page = parseInt(localStorage.Page);
    //pageselector.value = localStorage.Page;
}
param = getURLParameter('p');
if (param != null) {
    Page = parseInt(param);
    //pageselector.value = param;
}
localStorage.Page = Page;
var Group = 0;
if (localStorage.Group == null) {
    localStorage.Group = 0;
} else {
    Group = parseInt(localStorage.Group);
    //pageselector.value = localStorage.Page;
}

param = getURLParameter('g');
if (param != null) {
    Group = parseInt(param);
    //pageselector.value = param;
}
localStorage.Group = Group;
param = getURLParameter('s');
if (param != null) {
    $("#searchInput").val(param);
    //pageselector.value = param;
}
if (localStorage.transitionTimeout == null) {
    localStorage.transitionTimeout = 10000;
}
if (localStorage.autoTransition == null) {
    localStorage.autoTransition = false;
}
var autoTransition = JSON.parse(localStorage.autoTransition);

param = getURLParameter('sp');
var specialMode = false;
if (param != null) {
    if (param == "1") {
        localStorage.specialMode = true;
        specialMode = true;
    } else {
        localStorage.specialMode = false;
        specialMode = false;
    }
} else {
    if (localStorage.specialMode == null) {
        localStorage.specialMode = false;
    }
    specialMode = JSON.parse(localStorage.specialMode);
}
param = getURLParameter('tv');
var tvName = localStorage.tvName;
var tvMode = false;
if (param != null) {
    tvName = param
    localStorage.tvMode = true;
    localStorage.tvName = tvName;
    tvMode = true;
} else {
    if (localStorage.tvName == null) {
        localStorage.tvName = "Un-Named TV";
    }
    tvName = localStorage.tvName;
    if (localStorage.tvMode == null) {
        localStorage.tvMode = false;
    }
    tvMode = JSON.parse(localStorage.tvMode);
}
var twitchName = getURLParameter("twitchName");
if (twitchName != null) {
    console.log(twitchName);
    socket.emit('twitchName', twitchName);
}

UpdateUrl();

function TVmode() {
    hideNavbar();
    showBotbar();
    localStorage.tvMode = true;
    tvMode = true;
    if (socket != null) {
        socket.emit('tvModeEnabled', tvName);
    }
    clearInterval(weatherIntervalID);
    getweather();
    weatherIntervalID = setInterval(function () {
        getweather();
    }, 300000);
    UpdateUrl();
}
tvMode = JSON.parse(localStorage.tvMode);
if (tvMode) {
    TVmode();
}
var tvKey = ""
var isPaired = false
var firstPairedPageChange = false
var firstPairedGroupChange = false
//------------------------------
//---------On Page Load---------
//------------------------------
String.prototype.capitalizeFirstLetter = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
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

function round(value, decimals) {
    //This rounds a decimal by the specified number of decmial places
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
};

//Chart Colors
var colors = ['#bc0d0d', '#ef7b02', '#ffe70f', '#5bea2c', '#00840b', '#1ca4ff', '#274ad8']
var ebaycolors = ['#5bea2c', '#ef7b02', '#1ca4ff', '#ededed']
//On Page Load, load google charts
var now = new Date();
var date = [now.getFullYear(), now.getMonth() + 1, now.getDate()];
var Today = date.join("/");
$('#timeRangeStr').html(Today + ' - ' + Today);
var GlobalTimerange = Today + ' ' + Today
$(document).ready(function () {
    //Load all required charts from G-charts
    google.charts.load('current', {
        'packages': ['corechart', 'table']
    });
    //Set callback for google charts loading
    google.charts.setOnLoadCallback(function () {

        //Make trash section

        // $(".trash").shapeshift({
        //autoHeight: false,
        //enableTrash: true,
        //colWidth: "1000"
        //});

        var start = moment();
        var end = moment();
        $('#reportrange').daterangepicker({
            startDate: start,
            endDate: end,
            ranges: {
                'Today': [moment(), moment()],
                'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                'Last 30 Days': [moment().subtract(29, 'days'), moment()],
                'This Month': [moment().startOf('month'), moment().endOf('month')],
                'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
                'This Year': [moment().startOf('year'), moment().endOf('year')]

            }
        }, function (start, end) {});
    });
    $('.prev').html('←')
    $('.next').html('→')

});


function updateItem(Item) {

    socket.emit('updateTable', {
        name: Item.dataSet,
        timeRange: Item.timeRange
    });
}

function requestTableRange(Timerange = GlobalTimerange) {
    socket.emit('getTables', Timerange)
}
var GlobalItemUpdateIndex = 0

function updateAllItems() {
    var delay = 0
    GlobalItemUpdateIndex = 0
    for (itemIndex = 0; itemIndex < Groups[Group].pages[Page].items.length; itemIndex++) {

        delay += 40
        setTimeout(function (Index = itemIndex) {
            updateItem(Groups[Group].pages[Page].items[GlobalItemUpdateIndex])
            GlobalItemUpdateIndex++
        }, delay)
    }
}

function setGlobalTimerange(TimeRange) {
    GlobalTimerange = TimeRange
    for (itemIndex = 0; itemIndex < Groups[Group].pages[Page].items.length; itemIndex++) {
        Groups[Group].pages[Page].items[itemIndex].timeRange = GlobalTimerange
    }
    updateAllItems()
}
$('#reportrange').on('apply.daterangepicker', function (ev, picker) {
    $('#timeRangeStr').html(picker.startDate.format('YYYY/M/D') + ' - ' + picker.endDate.format('YYYY/M/D'));
    if (tvKey != "") {
        socket.emit('cloneToTV', {
            token: tvKey,
            cmd: "changeGlobalTimerange",
            params: GlobalTimerange
        })
        clearTimeout(pairedTvTimeoutID)
        pairedTvTimeoutID = setTimeout(function () {
            unPair()
        }, tvDisconnectTimout)
    }
    setGlobalTimerange(picker.startDate.format('YYYY/M/D') + ' ' + picker.endDate.format('YYYY/M/D'))
});




//-------------------------------
//---------Graphics Loop---------
//-------------------------------
//Init BG Grahpics
var canvas_bg = document.getElementById('canvas_bg')
var ctx_bg = canvas_bg.getContext('2d');
canvas_bg.width = window.innerWidth;
canvas_bg.height = window.innerHeight;
//Keep track of frame updates.
//Set to rteady for first render
canvas_bg.frameReady = true;
var bg_image = new Image();

//Set frame ready when image has loaded
bg_image.onload = function () {
    canvas_bg.frameReady = true;
};
//Set Trlanslation X and Y for scrolling / displacement
bg_image.TX = 0;
bg_image.TY = 0;
//Set Scroll speeds of X and Y axis
bg_image.scrollY = 0.1;
bg_image.scrollX = -0.2;
//Tell the rendering system that the background will not tiled by default
bg_image.tiled = false;
canvas_bg.RenderFrame = function () {
    //If the BG loaded (Asynchronously), render it with the onload function.
    if (bg_image.complete) {
        bg_image.render();
    };
}
bg_image.render = function () {
    //If the BG is tileable then tile it
    if (bg_image.tiled) {
        //Add to x and y, the scroll speed for x and y.
        bg_image.TY += bg_image.scrollY;
        bg_image.TX += bg_image.scrollX;
        //Get image size into BGw and BGh
        var BGw = bg_image.width;
        var BGh = bg_image.height;
        //Logic to prevent the ofest from being greater than the width or height of the image, so it doesn't continually climb.
        if (bg_image.TX <= -BGw) {
            bg_image.TX = 0;
        } else if (bg_image.TX >= BGw) {
            bg_image.TX = 0;
        } else if (bg_image.TX > 0) {
            bg_image.TX = bg_image.TX - BGw;
        };
        if (bg_image.TY <= -BGh) {
            bg_image.TY = 0;
        } else if (bg_image.TY >= BGh) {
            bg_image.TY = 0;
        } else if (bg_image.TY > 0) {
            bg_image.TY = bg_image.TY - BGh;
        };
        //Bkup the offset to restore after the rendering
        var bkupx = bg_image.TX;
        var bkupy = bg_image.TY;
        //Render the image tiled until the heigt and width are covered.
        //if the top left of the image is still on the screen keep looping
        while (bg_image.TY < canvas_bg.height) {
            //if the right side of the image is still on the screen, still keep looping
            while (bg_image.TX < canvas_bg.width) {
                //Render image in tiled coords BGtx and BGty
                ctx_bg.drawImage(bg_image, bg_image.TX, bg_image.TY, BGw + 2, BGh + 2);
                bg_image.TX += BGw;
            };
            //Go all the way back to the right
            bg_image.TX = bkupx;
            //Increment BGty to draw the next row of the tiled image.
            bg_image.TY += BGh;
        };
        //restore offset
        bg_image.TX = bkupx;
        bg_image.TY = bkupy;
    } else {
        //If the image has no specification of display style, then stretch.
        ctx_bg.drawImage(bg_image, 0, 0, canvas_bg.width, canvas_bg.height);
    };
    //Render top of the page gradient
    ctx_bg.globalAlpha = 1;
}
//Load background image

if (localStorage.bgImageSrc == null) {
    localStorage.bgImageSrc = "/img/BG_Image.png"
}
bg_image.src = localStorage.bgImageSrc

function readURL(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();

        reader.onload = function (e) {
            localStorage.bgImageSrc = e.target.result
            bg_image.src = e.target.result
        };

        reader.readAsDataURL(input.files[0]);
    }
}

function graphicsLoop() {
    //If the BG image is tiled and it is moving, set frame buffer ready to draw
    if (bg_image.tiled && bg_image.scrollY != 0 && bg_image.scrollX != 0) {
        canvas_bg.frameReady = true;
    }
    //Render frame if ready
    if (canvas_bg.frameReady) {
        canvas_bg.frameReady = false;
        canvas_bg.RenderFrame();
    }

    //Request the next animation frame asynchronously from the browser.
    requestAnimationFrame(graphicsLoop);
};
//Start the graphics loop
graphicsLoop();




//---------------------
//----Misc Function----
//---------------------

//Grabs a paramater from a URL string
function getURLParameter(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
}
//Change URL without reloading page
function ChangeUrl(title, url) {
    if (typeof (history.pushState) != "undefined") {
        var obj = {
            Title: title,
            Url: url
        };
        history.pushState(obj, obj.Title, obj.Url);
    }
}
//Updates URL with all params
function UpdateUrl() {
    restParams = ""

    if (Page != 0) {
        restParams = restParams + "&p=" + Page
    }
    if ($("#searchInput").val() != "") {
        restParams = restParams + "&s=" + $("#searchInput").val()
    }
    if (tvMode) {
        restParams = restParams + "&tv=" + tvName
    }

    ChangeUrl(document.title, window.location.href.split('?')[0] + "?g=" + Group + restParams);
}
//Show the delete bar with animation
function showDelete() {
    $(".trash").effect('slide', {
        direction: 'right',
        mode: 'show'
    }, 500);
}
//Hide the delete bar with animation
function hideDelete() {
    $(".trash").effect('slide', {
        direction: 'right',
        mode: 'hide'
    }, 500);
}
//Show the navbar with animation
function showNavbar() {
    $(".navbar").effect('slide', {
        direction: 'up',
        mode: 'show'
    }, 400);
}
//Hide the navbar with animation
function hideNavbar() {
    $(".navbar").effect('slide', {
        direction: 'up',
        mode: 'hide'
    }, 400);
}

function showBotbar() {
    $(".botbar").effect('slide', {
        direction: 'down',
        mode: 'show'
    }, 400);
}
//Hide the navbar with animation
function hideBotbar() {
    $(".botbar").effect('slide', {
        direction: 'down',
        mode: 'hide'
    }, 400);
}

//Formate date into HH:mm AM/PM
function formatAMPM(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;
    var strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
}
//Full date formating, remove formatAMPM later
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


//--------------------------
//----Panel Manipulation----
//--------------------------
function generateTable(data, dataType) {
    //Generate html5 sortable table
    //Make heard of generated table string
    var GeneratedTable = "<table class='sortable'><thead><tr>"
    //On every row of the table
    for (rowIndex = 0; rowIndex < data.length; rowIndex++) {
        var rowColor = ""
        if (rowIndex == 0) {
            //On the first row with column titles
            //Generate the column title html
            for (colIndex = 0; colIndex < data[rowIndex].length; colIndex++) {
                GeneratedTable = GeneratedTable + "<th>" + data[rowIndex][colIndex] + "</th>"
            }

            //End generate table head
            GeneratedTable = GeneratedTable + "</tr></thead><tbody>"
        } else {
            //On the other rows, add each column item
            GeneratedTable = GeneratedTable + "<tr>"
            //Cusom format each item based on data type. 
            for (colIndex = 0; colIndex < data[rowIndex].length; colIndex++) {
                if (dataType == "Agent") {
                    if (colIndex == 0 || colIndex == 1 || colIndex == 2) {
                        var currentAux = data[rowIndex][1]

                        if (currentAux == "69") {
                            currentAux = "Onboard Coordinator"
                            data[rowIndex][1] = "Onboard Coordinator"
                        }
                        var auxHours = parseInt(data[rowIndex][2].split(":")[0])
                        var auxMins = parseInt(data[rowIndex][2].split(":")[1])
                        var color = "white"

                        if (currentAux == "Lunch") {
                            if (auxHours >= 1) {
                                color = "red"
                            } else {
                                color = "purple"
                            }
                        } else if (currentAux == "Available") {
                            color = "green"
                        } else if (currentAux == "Break") {
                            if (auxMins >= 15 || auxHours >= 1) {
                                color = "red"
                            } else {
                                color = "purple"
                            }
                        } else if (currentAux == "On Call") {
                            if (auxMins >= 15 || auxHours >= 1) {
                                color = "red"
                            } else {
                                color = "orange"
                            }
                        } else if (currentAux == "Incoming Call") {
                            color = "orange"
                        } else if (currentAux == "After Call") {
                            if (auxMins >= 2) {
                                color = "red"
                            } else {
                                color = "white"
                            }
                        } else if (currentAux == "OTHER" || currentAux == "Logged in") {
                            color = "red"
                        } else if (currentAux == "Lead" || currentAux == "Training" || currentAux == "Coaching") {
                            color = "lightBlue"
                        } else if (currentAux == "Chat" || currentAux == "Admin Work") {
                            color = "white"
                        } else if (currentAux == "Social Media" && specialMode && colIndex == 1) {
                            color = "rainbow"
                        } else if (currentAux == "Social Media") {
                            color = "white"
                        } else if (currentAux == "Onboard Coordinator" && specialMode) {
                            color = "rainbow"
                        } else if (currentAux == "Onboard Coordinator") {
                            color = "white"
                        } else {
                            color = "gray"
                        }
                        if (auxHours >= 8) {
                            color = "red"
                        }

                        if (colIndex == 0) {
                            rowColor = color
                            if (currentAux == "Lead") {
                                GeneratedTable = GeneratedTable + "<td class='" + color + "Row'><div class='agentImage'><img src='img/doughboy.png' class='profileImage'></img></div ><span>👑 " + data[rowIndex][colIndex] + "</span></td>"
                            } else if (currentAux == "On Call") {
                                GeneratedTable = GeneratedTable + "<td class='" + color + "Row'><div class='agentImage'><img src='img/doughboy.png' class='profileImage'></img></div ><span>📞 " + data[rowIndex][colIndex] + "</span></td>"
                            } else if (currentAux == "Break" || currentAux == "Lunch") {
                                GeneratedTable = GeneratedTable + "<td class='" + color + "Row'><div class='agentImage'><img src='img/doughboy.png' class='profileImage'></img></div ><span>⏲ " + data[rowIndex][colIndex] + "</span></td>"
                            } else if (currentAux == "Available") {
                                GeneratedTable = GeneratedTable + "<td class='" + color + "Row'><div class='agentImage'><img src='img/doughboy.png' class='profileImage'></img></div ><span>• " + data[rowIndex][colIndex] + "</span></td>"
                            } else if (currentAux == "Onboard Coordinator" && specialMode) {
                                GeneratedTable = GeneratedTable + "<td class='" + color + "Row'><div class='agentImage'><img src='img/doughboy.png' class='profileImage'></img></div ><span>👿 " + data[rowIndex][colIndex] + "</span></td>"
                            } else {
                                GeneratedTable = GeneratedTable + "<td class='" + color + "Row'><div class='agentImage'><img src='img/doughboy.png' class='profileImage'></img></div ><span>" + data[rowIndex][colIndex] + "</span></td>"
                            }
                        } else if (colIndex == 1) {
                            if (currentAux == "Lead") {
                                GeneratedTable = GeneratedTable + "<td class='" + color + "Row'>" + data[rowIndex][colIndex] + "</td>"
                            } else if (currentAux == "On Call") {
                                GeneratedTable = GeneratedTable + "<td class='" + color + "Row'>" + data[rowIndex][colIndex] + "</td>"
                            } else if (currentAux == "Break") {
                                if (auxMins >= 15 || auxHours >= 1) {
                                    GeneratedTable = GeneratedTable + "<td class='" + color + "Row fireAux'>🔥" + data[rowIndex][colIndex] + "🔥</td>"
                                } else {
                                    GeneratedTable = GeneratedTable + "<td class='" + color + "Row'>" + data[rowIndex][colIndex] + "</td>"
                                }
                            } else if (currentAux == "Lunch") {
                                if (auxHours >= 1) {
                                    GeneratedTable = GeneratedTable + "<td class='" + color + "Row fireAux'>🔥" + data[rowIndex][colIndex] + "🔥</td>"
                                } else {
                                    GeneratedTable = GeneratedTable + "<td class='" + color + "Row'>" + data[rowIndex][colIndex] + "</td>"
                                }
                            } else if (currentAux == "Logged in") {
                                GeneratedTable = GeneratedTable + "<td class='" + color + "Row fireAux'>🔥" + data[rowIndex][colIndex] + "🔥</td>"
                            } else if (currentAux == "Incoming Call") {
                                GeneratedTable = GeneratedTable + "<td class='" + color + "Row'>🔔" + data[rowIndex][colIndex] + "🔔</td>"
                            } else if (currentAux == "Available") {
                                GeneratedTable = GeneratedTable + "<td class='" + color + "Row'>" + data[rowIndex][colIndex] + "</td>"
                            } else {
                                GeneratedTable = GeneratedTable + "<td class='" + color + "Row'>" + data[rowIndex][colIndex] + "</td>"
                            }
                        } else {
                            GeneratedTable = GeneratedTable + "<td class='" + color + "Row'>" + data[rowIndex][colIndex] + "</td>"
                        }
                    } else if (colIndex == 5) {
                        var sHours = parseInt(data[rowIndex][colIndex].split(":")[0])
                        var sMins = parseInt(data[rowIndex][colIndex].split(":")[1])
                        if (sMins >= 15 || sHours >= 1) {
                            GeneratedTable = GeneratedTable + "<td class='red " + rowColor + "Row'>" + data[rowIndex][colIndex] + "</td>"
                        } else if (sMins >= 13 && sHours == 0) {
                            GeneratedTable = GeneratedTable + "<td class='yellow " + rowColor + "Row'>" + data[rowIndex][colIndex] + "</td>"
                        } else {
                            GeneratedTable = GeneratedTable + "<td class='" + rowColor + "Row'>" + data[rowIndex][colIndex] + "</td>"
                        }
                    } else if (colIndex == 7) {
                        var sHours = parseInt(data[rowIndex][colIndex].split(":")[0])
                        var sMins = parseInt(data[rowIndex][colIndex].split(":")[1])
                        if (sMins >= 15 || sHours >= 1) {
                            GeneratedTable = GeneratedTable + "<td class='red " + rowColor + "Row'>" + data[rowIndex][colIndex] + "</td>"
                        } else if (sMins >= 13 && sHours == 0) {
                            GeneratedTable = GeneratedTable + "<td class='yellow " + rowColor + "Row'>" + data[rowIndex][colIndex] + "</td>"
                        } else {
                            GeneratedTable = GeneratedTable + "<td class='" + rowColor + "Row'>" + data[rowIndex][colIndex] + "</td>"
                        }
                    } else {
                        GeneratedTable = GeneratedTable + "<td class='" + rowColor + "Row'>" + data[rowIndex][colIndex] + "</td>"
                    }
                } else if (dataType == "Call") {
                    var currentStat = data[rowIndex][0]
                    if (colIndex == 0 || colIndex == 1) {

                        if (currentStat == "Answer Speed") {
                            var sHours = parseInt(data[rowIndex][1].split(":")[0])
                            var sMins = parseInt(data[rowIndex][1].split(":")[1])
                            var sSec = parseInt(data[rowIndex][1].split(":")[2])
                            if (sSec >= 15 || sMins > 0 || sHours > 0) {
                                color = "red"
                            } else if (sSec >= 10) {
                                color = "yellow"
                            } else {
                                color = "white"
                            }
                        } else if (currentStat == "Call Duration") {
                            var sHours = parseInt(data[rowIndex][1].split(":")[0])
                            var sMins = parseInt(data[rowIndex][1].split(":")[1])
                            var sSec = parseInt(data[rowIndex][1].split(":")[2])
                            if (sMins >= 15 || sHours > 0) {
                                color = "red"
                            } else if (sMins >= 13) {
                                color = "yellow"
                            } else {
                                color = "white"
                            }
                        } else if (currentStat == "Abandoned Calls") {
                            if (parseInt(data[rowIndex][1]) > 4) {
                                color = "red"
                            } else if (parseInt(data[rowIndex][1]) > 0) {
                                color = "yellow"
                            } else {
                                color = "white"
                            }
                        } else if (currentStat == "AVG Abandon Time") {
                            var sHours = parseInt(data[rowIndex][1].split(":")[0])
                            var sMins = parseInt(data[rowIndex][1].split(":")[1])
                            var sSec = parseInt(data[rowIndex][1].split(":")[2])
                            if (sSec >= 10 || sMins > 0 || sHours > 0) {
                                color = "red"
                            } else if (sSec >= 3) {
                                color = "yellow"
                            } else {
                                color = "white"
                            }
                        } else if (currentStat == "Calls In Queue") {
                            if (parseInt(data[rowIndex][colIndex]) > 0) {
                                color = "orange"
                            } else {
                                color = "white"
                            }
                        } else if (currentStat == "Longest Call Waiting") {
                            var sHours = parseInt(data[rowIndex][1].split(":")[0])
                            var sMins = parseInt(data[rowIndex][1].split(":")[1])
                            var sSec = parseInt(data[rowIndex][1].split(":")[2])
                            if (sSec >= 10 || sMins > 0 || sHours > 0) {
                                color = "red"
                            } else if (sSec >= 3) {
                                color = "yellow"
                            } else {
                                color = "white"
                            }
                        } else {

                            color = "white"
                        }
                        GeneratedTable = GeneratedTable + "<td class='" + color + " " + color + "Row'>" + data[rowIndex][colIndex] + "</td>"
                    } else {
                        GeneratedTable = GeneratedTable + "<td class='whiteRow'>" + data[rowIndex][colIndex] + "</td>"
                    }
                } else if (dataType == "Chat") {
                    var currentStat = data[rowIndex][0]

                    if (currentStat == "In Queue Chats") {
                        if (parseInt(data[rowIndex][1]) > 0) {
                            color = "orange"
                        } else {
                            color = "white"
                        }

                    } else if (currentStat == "Abandoned Chat") {
                        if (parseInt(data[rowIndex][1]) > 4) {
                            color = "red"
                        } else if (parseInt(data[rowIndex][1]) > 0) {
                            color = "yellow"
                        } else {
                            color = "white"
                        }
                    } else if (currentStat == "Avg Abandoned Time") {
                        var sHours = parseInt(data[rowIndex][1].split(":")[0])
                        var sMins = parseInt(data[rowIndex][1].split(":")[1])
                        var sSec = parseInt(data[rowIndex][1].split(":")[2])
                        if (sSec >= 10 || sMins > 0 || sHours > 0) {
                            color = "red"
                        } else if (sSec >= 3) {
                            color = "yellow"
                        } else {
                            color = "white"
                        }
                    } else if (currentStat == "Avg Chat Duration") {
                        var sHours = parseInt(data[rowIndex][1].split(":")[0])
                        var sMins = parseInt(data[rowIndex][1].split(":")[1])
                        var sSec = parseInt(data[rowIndex][1].split(":")[2])
                        if (sMins >= 15 || sHours > 0) {
                            color = "red"
                        } else if (sMins >= 13) {
                            color = "yellow"
                        } else {
                            color = "white"
                        }
                    } else if (currentStat == "Avg Chat Wait Time") {
                        var sHours = parseInt(data[rowIndex][1].split(":")[0])
                        var sMins = parseInt(data[rowIndex][1].split(":")[1])
                        var sSec = parseInt(data[rowIndex][1].split(":")[2])
                        if (sSec >= 15 || sMins > 0 || sHours > 0) {
                            color = "red"
                        } else if (sSec >= 10) {
                            color = "yellow"
                        } else {
                            color = "white"
                        }
                    } else {
                        color = "white"
                    }

                    GeneratedTable = GeneratedTable + "<td class='" + color + " " + color + "Row'>" + data[rowIndex][colIndex] + "</td>"
                } else {
                    if ((data[rowIndex][colIndex] + "").search("http") != -1) {

                        GeneratedTable = GeneratedTable + "<td class='whiteRow'>" + "<a href='" + data[rowIndex][colIndex] + "' target='_blank'>" + data[rowIndex][colIndex] + "</a>" + "</td>"
                    } else {
                        GeneratedTable = GeneratedTable + "<td class='whiteRow'>" + data[rowIndex][colIndex] + "</td>"
                    }


                }

            }
            //End the table body
            GeneratedTable = GeneratedTable + "</tr>"
        }
    }
    //End table
    return GeneratedTable + "</tbody></table>"

}

function isOdd(num) {
    return (num % 2) == 1;
}
//Update data on specified item
function updateChartData(item, itemIndex) {
    try {
        //Update timestamp at top right of panel
        $('#Item_Timestamp_' + itemIndex).text(item.ts)
        //If error message exists
        if (item.error != "") {
            //Show item overlay
            $("#Item_Overlay_" + itemIndex).show("fade")
            //Display error on overlay
            $('#panelError_' + itemIndex).text(item.error)
            //Set border color to red to show error.
            document.getElementById('Item_Viewport_' + itemIndex).style.borderColor = "red";
        } else if (item.loaded && $("#Item_" + itemIndex).is(":visible")) {
            //If there was no error with the data
            //Set border color to normal color
            document.getElementById('Item_Viewport_' + itemIndex).style.borderColor = "rgba(55, 55, 55, 0.5)";
            //Fade out the error overlay
            $("#Item_Overlay_" + itemIndex).hide("fade")
            //Update data with proper method depending on type
            if ((item.type == "pie" || item.type == "bar" || item.type == "combochart")) {
                //Google-Charts data update
                //Perfectly size data
                item.options.width = $("#Item_" + itemIndex).width
                item.options.height = $("#Item_" + itemIndex).height
                if (item.filteredData.length > 0) {
                    if (item.chart != null) {
                        item.chart.draw(google.visualization.arrayToDataTable(item.filteredData), item.options);
                    }

                } else if (item.data.length > 0) {

                    if (item.chart != null) {
                        item.chart.draw(google.visualization.arrayToDataTable(item.data), item.options);
                    }
                }
            } else if (item.type == "table") {
                $("#Item_Viewport_" + itemIndex).css('overflowY', 'auto');
                if (item.filteredData.length > 0) {
                    var GeneratedTable = generateTable(item.filteredData, item.dataType)
                } else {
                    var GeneratedTable = generateTable(item.data, item.dataType)
                }
                //Clear existing html in viewport
                $('#Item_Viewport_' + itemIndex).text("")
                //Append generated html
                $('#Item_Viewport_' + itemIndex).append(GeneratedTable)
                //sorttable.makeSortable('#Item_Viewport_' + itemIndex);
            }
        }
    } catch (err) {
        console.log(err.message)
    }
}

function loadItem(item, itemIndex) {

    try {
        //Update timestamp at top right of panel
        $('#Item_Timestamp_' + itemIndex).text(item.ts)
        //If error message exists
        if (item.error != "") {
            //Show item overlay
            $("#Item_Overlay_" + itemIndex).show("fade")
            //Display error on overlay
            $('#panelError_' + itemIndex).text(item.error)
            //Set border color to red to show error.
            document.getElementById('Item_Viewport_' + itemIndex).style.borderColor = "red";
        } else {
            //If there was no error with the data

            //Set border color to normal color
            document.getElementById('Item_Viewport_' + itemIndex).style.borderColor = "rgba(55, 55, 55, 0.5)";
            //Fade out the error overlay
            $("#Item_Overlay_" + itemIndex).hide("fade")
        }
        //Apply data to viefwpoer with proper method depending on type
        if (item.type == "pie") {
            //Make new gogole pie chart
            item.chart = new google.visualization.PieChart(document.getElementById('Item_Viewport_' + itemIndex));
            //Properly size chart for panel
            item.options.chartArea = {
                'width': '100%',
                'height': '100%',
                'left': 40
            }
            item.options.legendTextStyle = {
                color: '#FFF'
            };
            //Make the background of the panel visible
            item.options.backgroundColor = 'transparent';
            //Apply data update animations
            item.options.animation = {
                duration: 600,
                easing: 'inAndOut',
                "startup": true
            }
            //Perfectly size data
            item.options.width = $("#Item_" + itemIndex).width
            item.options.height = $("#Item_" + itemIndex).height
            //Apply chart colors
            if (item.options.colors == null) {
                item.options.colors = colors
            }
            //Draw chart
            item.chart.draw(google.visualization.arrayToDataTable(item.data), item.options);
        } else if (item.type == "combochart") {
            //Make new gogole pie chart
            item.chart = new google.visualization.ComboChart(document.getElementById('Item_Viewport_' + itemIndex));
            //Properly size chart for panel
            item.options.chartArea = {
                'width': '90%',
                'height': '82%',
                'left': 40,
                'top': 10
            }
            //Set all text white
            item.options.hAxis = {
                textPosition: 'center',
                gridlines: {
                    color: "#FFF"
                },
                textStyle: {
                    color: "#FFFFFF"
                },
                baselineColor: '#FFF'
            }
            item.options.vAxis = {
                textPosition: 'left',
                gridlines: {
                    color: "#FFFFFF"
                },
                textStyle: {
                    color: "#FFFFFF"
                },
                baselineColor: '#FFFFFF'
            }
            item.options.legendTextStyle = {
                color: '#FFF'
            };
            //Make the background of the panel visible
            item.options.backgroundColor = 'transparent';
            //Perfectly size data
            item.options.width = $("#Item_" + itemIndex).width
            item.options.height = $("#Item_" + itemIndex).height
            //Apply chart colors
            if (item.options.colors == null) {
                item.options.colors = ebaycolors
            }
            //Draw chart
            item.chart.draw(google.visualization.arrayToDataTable(item.data), item.options);
        } else if (item.type == "bar") {
            //Make new gogole bar chart
            item.chart = new google.visualization.BarChart(document.getElementById('Item_Viewport_' + itemIndex));
            //Properly size chart for panel
            item.options.chartArea = {
                'bottom': '10px',
                'right': 35,
                'width': '80%',
                'height': '70%'
            }

            //Set all text white
            item.options.hAxis = {
                textPosition: 'center',
                gridlines: {
                    color: "#FFF"
                },
                textStyle: {
                    color: "#FFFFFF"
                },
                baselineColor: '#FFF'
            }
            item.options.vAxis = {
                textPosition: 'left',
                gridlines: {
                    color: "#FFFFFF"
                },
                textStyle: {
                    color: "#FFFFFF"
                },
                baselineColor: '#FFFFFF'
            }
            item.options.annotations = {
                textStyle: {
                    fontName: 'Times-Roman',
                    fontSize: 18,
                    bold: true,
                    italic: false,
                    color: '#fff', // The color of the text.
                    auraColor: '', // The color of the text outline.
                    opacity: 0.8 // The transparency of the text.
                }
            }
            item.options.legendTextStyle = {
                color: '#FFF'
            };
            //Make the background of the panel visible
            item.options.backgroundColor = 'transparent';
            //Apply chart colors
            if (item.options.colors == null) {
                item.options.colors = colors
            }
            //Apply data update animations
            item.options.animation = {
                duration: 600,
                easing: 'inAndOut',
                "startup": true
            }
            //Perfectly size data
            item.options.width = $("#Item_" + itemIndex).width
            item.options.height = $("#Item_" + itemIndex).height

            //Draw chart
            item.chart.draw(google.visualization.arrayToDataTable(item.data), item.options);
        } else if (item.type == "table") {
            $("#Item_Viewport_" + itemIndex).css('overflowY', 'auto');
            if (item.filteredData.length > 0) {
                var GeneratedTable = generateTable(item.filteredData, item.dataType)
            } else {
                var GeneratedTable = generateTable(item.data, item.dataType)
            }
            //Clear existing html in viewport
            $('#Item_Viewport_' + itemIndex).text("")
            //Append generated html
            $('#Item_Viewport_' + itemIndex).append(GeneratedTable)
            //sorttable.makeSortable('#Item_Viewport_' + itemIndex);
        } else if (item.type == "iframe" && item.status != "loaded") {

            //If iframe is not loaded
            //Clear panel html
            $('#Item_Viewport_' + itemIndex).text("")
            //Apend new html
            $('#Item_Viewport_' + itemIndex).append("<iframe src='" + item.url + "' width='100%' height='100%' style='border:none'></iframe>")
            //clear error
            item.error = ""
            //set status to loaded
            item.status = "loaded"
        }
    } catch (err) {
        console.log(err.message)
    }
    //mark the item as loaded
    item.loaded = true
}
var SizeByIndex = false

function resizeAllItems() {
    //Fix Container Size
    $("#container").height(window.innerHeight - 70)
    //For every panel on the current group + page
    var SearchIndex = 0
    for (itemIndex = 0; itemIndex < Groups[Group].pages[Page].items.length; itemIndex++) {
        try {
            if (!SizeByIndex) {
                iWidth = Groups[Group].pages[Page].items[itemIndex].width
                iHeight = Groups[Group].pages[Page].items[itemIndex].height
            } else {
                if ($("#Item_" + itemIndex).is(":visible")) {
                    SearchIndex++
                }
                if (SearchIndex == 1) {
                    document.getElementById('Item_' + itemIndex).style.borderColor = "rgba(0, 250, 0, 0.5)";
                } else {
                    document.getElementById('Item_' + itemIndex).style.borderColor = "rgba(55, 55, 55, 0.5)";
                }

                if (SearchIndex == 1) {
                    iWidth = 3
                    iHeight = 2
                    if (Groups[Group].pages[Page].items[itemIndex].filteredData.length < 7 && Groups[Group].pages[Page].items[itemIndex].filteredData.length > 0) {
                        iHeight = 1
                    }
                } else if (SearchIndex == 2) {
                    iWidth = 3
                    iHeight = 2
                } else if (SearchIndex == 3 || SearchIndex == 4) {
                    iWidth = 2
                    iHeight = 2
                } else if (SearchIndex >= 5 && SearchIndex <= 8) {
                    iWidth = 2
                    iHeight = 1
                } else {
                    iWidth = 1
                    iHeight = 1
                    $(".itemtimestamp").hide()
                    $(".btnsettings").hide()
                }


            }


            //get avail width
            var availWidth = window.innerWidth;
            //keep width between min and max
            if (availWidth < 1100) {
                availWidth = 1100
            } else if (availWidth > 3000) {
                availWidth = 3000
            }
            //Calculate width based on set value
            //Values for width can be from 1 - 4
            if (iWidth == 1) {
                $("#Item_" + itemIndex).width(((availWidth / 4) / 2) - 10)
            } else if (iWidth == 2) {
                $("#Item_" + itemIndex).width((availWidth / 4) - 20)
            } else if (iWidth == 3) {
                $("#Item_" + itemIndex).width((availWidth / 2) - 25)
                iWidth = 4
            } else if (iWidth == 4) {
                $("#Item_" + itemIndex).width(((availWidth / 4) * 3) - 25)
                iWidth = 6
            } else if (iWidth == 5) {
                $("#Item_" + itemIndex).width((availWidth) - 35)
                iWidth = 8
            }
            $("#Item_" + itemIndex).attr("data-ss-colspan", iWidth)
            //get avail height

            if (tvMode) {
                var ContainerHeightOffset = 90
            } else {
                var ContainerHeightOffset = 70
            }
            $(".container").height((window.innerHeight - ContainerHeightOffset) + "px")
            var newheight = ($("#container").height())
            //keep height between min and max
            if (newheight < 540) {
                newheight = 540
            } else if (newheight > 1150) {
                newheight = 1150
            }
            //Calculate width based on set value
            //Values for width can be from 0 - 2
            if (iHeight == 1) {
                $("#Item_" + itemIndex).height(((newheight - 75) / 4))
            } else if (iHeight == 2) {
                $("#Item_" + itemIndex).height(((newheight - 40) / 2))
            } else if (iHeight == 3) {
                $("#Item_" + itemIndex).height(newheight - 25)
            }
            if (Groups[Group].pages[Page].items[itemIndex].loaded) {
                updateChartData(Groups[Group].pages[Page].items[itemIndex], itemIndex)
            }

        } catch (err) {
            console.log(err.message)
        }
    }
    clearTimeout(shapeshitTimeoutID)
    shapeshitTimeoutID = setTimeout(shapeShiftContainer, 200)
}

var shapeshitTimeoutID
//These two functions will probably never be used. It is better to hide the entire container
function hideAllPanels() {
    //For every panel on the current group + page
    for (itemIndex = 0; itemIndex < Groups[Group].pages[Page].items.length; itemIndex++) {
        //Fade out panel
        $("#Item_" + itemIndex).hide("fade")
    }
}

function showAllPanels() {
    //For every panel on the current group + page
    for (itemIndex = 0; itemIndex < Groups[Group].pages[Page].items.length; itemIndex++) {

        //Fade out panel
        $("#Item_" + itemIndex).show("fade")
    }
}

function AddPanel(Group, page, title, type, dataSet, options) {
    //push new item
    Groups[Group].pages[page].items.push({
        title: title,
        type: type,
        width: 1,
        height: 1,
        data: [],
        dataSet: dataSet,
        ts: "",
        error: " ",
        options: options
    })
    var itemIndex = Groups[Group].pages[page].items.length - 1
    $(".container").append("<div class='item'  onmouseup='setTimeout(hideDelete, 200)' onmousedown='showDelete()' data-ss-colspan='" + Groups[Group].pages[Page].items[itemIndex].width + "' id='Item_" + itemIndex + "'> <button class='btnsettings' >⚙</button> <div class='itemtitle'> " + Groups[Group].pages[Page].items[itemIndex].title + "</div><div class='itemtimestamp'id='Item_Timestamp_" + itemIndex + "'>--:--:-- --- --</div><div class='itemviewport' id='Item_Viewport_" + itemIndex + "'> </div>" + "<div class='itemviewportoverlay' id='Item_Overlay_" + itemIndex + "'><center><div id='panelError_" + itemIndex + "' class='panelError'></div></center></div></div>");
    loadItem(Groups[Group].pages[page].items[itemIndex], itemIndex)

    resizeAllItems()
    //re shapeshift container with new item
    shapeShiftContainer()
}

function showSettings(i) {
    if ($("#settingsPanel_" + i).is(":visible")) {
        $("#settingsPanel_" + i).hide("fade")
    } else {
        $("#settingsPanel_" + i).show("fade")
    }
}

function loadpage(p) {
    localStorage.Page = p
    Page = p
    //Generate panel HTML for every item in current  group + page
    for (itemIndex = 0; itemIndex < Groups[Group].pages[p].items.length; itemIndex++) {
        $(".container").append("<div class='item'  onmouseup='setTimeout(hideDelete, 200)' onmousedown='showDelete()' data-ss-colspan='" + Groups[Group].pages[Page].items[itemIndex].width + "' id='Item_" + itemIndex + "'> <button class='btnsettings' onclick='showSettings(" + itemIndex + ")' >⚙</button> <div class='itemtitle'> " + Groups[Group].pages[Page].items[itemIndex].title + "</div><div class='itemtimestamp'id='Item_Timestamp_" + itemIndex + "'>--:--:-- --- --</div><div class='itemviewport' id='Item_Viewport_" + itemIndex + "'> </div>" + "<div class='itemviewportoverlay' id='Item_Overlay_" + itemIndex + "'><center><div id='panelError_" + itemIndex + "' class='panelError'></div></center></div><div id='settingsPanel_" + itemIndex + "' class='settingsPanel'></div></div>");
    }
    for (var i = 0, len = Groups[Group].pages[p].items.length; i < len; i++) {
        if (Groups[Group].pages[p].items[i].type == "iframe") {
            loadItem(Groups[Group].pages[p].items[i], i)
        }
    }
    $(".container").show("fade");
    //Shape shift container
    $("#Page select").val(p);
    UpdateUrl();

    shapeShiftContainer()
    setTimeout(function () {
        setGlobalTimerange(GlobalTimerange)
    }, 600)
    resizeAllItems()

}

function datasetExists(name) {
    try {
        var tableExists = false
        //For every panel on the current group + page
        for (var i = 0, len = Groups[Group].pages[Page].items.length; i < len; i++) {
            //if the dataset name matches, it exists
            if (name == Groups[Group].pages[Page].items[i].dataSet) {
                //break loop and return that it exists
                tableExists = true
                break;
            }
        }
        return tableExists
    } catch (err) {
        return false
    }
}

function shapeShiftContainer() {
    //Makee item container sortable and animated
    $(".container").shapeshift({
        autoHeight: false,
        autoWidth: false,
        align: "center",
        animationSpeed: 400,
        animateOnInit: true,
        animationThreshold: 250
    });
}

function getItemByDataset(name) {
    var citem = {}
    //For every panel on the current group + page
    for (var i = 0, len = Groups[Group].pages[Page].items.length; i < len; i++) {
        //if the dataset name matches, it exists
        if (name == Groups[Group].pages[Page].items[i].dataSet) {
            //break loop and return item
            citem = Groups[Group].pages[Page].items[i]
            break;
        }
    }
    return citem
}

function ReloadGroupSelectors() {
    //Clear group dropdown
    $("#Group").text("")
    var outputgroup = [];
    //For every group in Groups, and key and val to outputgroup array
    for (var i = 0, len = Groups.length; i < len; i++) {
        outputgroup.push("<option class='selectoroption' value=" + i + ">" + Groups[i].name + "</option>");
    }
    //dump array into html and init
    $('#Group').html(outputgroup.join(''));
}

function ReloadPageSelector() {
    //Clear page dropdown
    $("#Page").text("")
    var outputpages = [];
    //For every page in Pages in the current group array, add page to out pages array.
    for (var i2 = 0, len2 = Groups[Group].pages.length; i2 < len2; i2++) {
        outputpages.push("<option class='selectoroption' value=" + i2 + ">" + i2 + " - " + Groups[Group].pages[i2].name + "</option>");
    }
    //dump array into html and init
    $('#Page').html(outputpages.join(''));
}

function unloadPage() {
    //For every panel on the current group + page
    for (itemIndex = 0; itemIndex < Groups[Group].pages[Page].items.length; itemIndex++) {
        //Set all dynamic vars to null like data and the google chart object
        Groups[Group].pages[Page].items[itemIndex].loaded = false
        Groups[Group].pages[Page].items[itemIndex].chart = null
        Groups[Group].pages[Page].items[itemIndex].data = []
    }
    //Whipe containers html
    $(".container").text("")
}
var lastFilterStr = ""

function filterPage(filterStr) {
    localStorage.search = filterStr
    UpdateUrl();
    if (filterStr != "" && filterStr != lastFilterStr && filterStr.length > 1 && isNaN(filterStr)) {
        if (tvKey != "") {
            socket.emit('cloneToTV', {
                token: tvKey,
                cmd: "search",
                params: filterStr
            })
        }
        SizeByIndex = true
        lastFilterStr = filterStr
        for (itemIndex = 0; itemIndex < Groups[Group].pages[Page].items.length; itemIndex++) {
            Groups[Group].pages[Page].items[itemIndex].hitCount = 0
            Groups[Group].pages[Page].items[itemIndex].filteredData = []
        }
        filterStrArray = filterStr.split(" ")
        //filterStrArray.push(filterStr)
        for (filtIndex = 0; filtIndex < filterStrArray.length; filtIndex++) {
            filterStr = filterStrArray[filtIndex]
            if (filterStr.length > 1 && isNaN(filterStr)) {
                filterStr = filterStr.toLowerCase()

                for (itemIndex = 0; itemIndex < Groups[Group].pages[Page].items.length; itemIndex++) {
                    if (Groups[Group].pages[Page].items[itemIndex].title.toLowerCase().includes(filterStr)) {
                        Groups[Group].pages[Page].items[itemIndex].hitCount++
                    } else {
                        for (dataIndexY = 0; dataIndexY < Groups[Group].pages[Page].items[itemIndex].data.length; dataIndexY++) {
                            var rowHit = false
                            for (dataIndexX = 0; dataIndexX < Groups[Group].pages[Page].items[itemIndex].data[dataIndexY].length; dataIndexX++) {
                                if (isNaN((Groups[Group].pages[Page].items[itemIndex].data[dataIndexY][dataIndexX] + "").substr(0, 1))) {
                                    if ((Groups[Group].pages[Page].items[itemIndex].data[dataIndexY][dataIndexX] + "").toLowerCase().includes(filterStr)) {
                                        Groups[Group].pages[Page].items[itemIndex].hitCount++
                                            rowHit = true
                                    }
                                }
                            }
                            if (rowHit && dataIndexY != 0 && Groups[Group].pages[Page].items[itemIndex].type != "pie") {
                                if (Groups[Group].pages[Page].items[itemIndex].filteredData.length == 0) {
                                    Groups[Group].pages[Page].items[itemIndex].filteredData.push(Groups[Group].pages[Page].items[itemIndex].data[0])
                                }
                                var canAddToFilter = true
                                for (filtDataIndex = 1; filtDataIndex < Groups[Group].pages[Page].items[itemIndex].filteredData.length; filtDataIndex++) {
                                    if (Groups[Group].pages[Page].items[itemIndex].filteredData[filtDataIndex][0] == Groups[Group].pages[Page].items[itemIndex].data[dataIndexY][0] && Groups[Group].pages[Page].items[itemIndex].filteredData[filtDataIndex][1] == Groups[Group].pages[Page].items[itemIndex].data[dataIndexY][1]) {
                                        canAddToFilter = false
                                        break;
                                    }
                                }
                                if (canAddToFilter) {
                                    Groups[Group].pages[Page].items[itemIndex].filteredData.push(Groups[Group].pages[Page].items[itemIndex].data[dataIndexY])
                                }
                            }
                        }
                    }
                }
                for (itemIndex = 0; itemIndex < Groups[Group].pages[Page].items.length; itemIndex++) {
                    if (Groups[Group].pages[Page].items[itemIndex].hitCount > 0) {
                        $("#Item_" + itemIndex).show()
                        if (Groups[Group].pages[Page].items[itemIndex].loaded) {
                            updateChartData(Groups[Group].pages[Page].items[itemIndex], itemIndex)
                        }
                    } else {
                        $("#Item_" + itemIndex).hide()

                    }

                }
            }
        }
        resizeAllItems()
        $(".settingsPanel").hide()
    } else {

        SizeByIndex = false
        if (lastFilterStr != filterStr) {
            lastFilterStr = filterStr
            for (itemIndex = 0; itemIndex < Groups[Group].pages[Page].items.length; itemIndex++) {
                $("#Item_" + itemIndex).show()
                Groups[Group].pages[Page].items[itemIndex].filteredData = []
                if (Groups[Group].pages[Page].items[itemIndex].loaded) {
                    updateChartData(Groups[Group].pages[Page].items[itemIndex], itemIndex)
                }
                //Set border color to normal color
                document.getElementById('Item_' + itemIndex).style.borderColor = "rgba(55, 55, 55, 0.5)";

            }
            resizeAllItems()
            $(".itemtimestamp").show()
            $(".btnsettings").show()
            if (tvKey != "") {
                socket.emit('cloneToTV', {
                    token: tvKey,
                    cmd: "clssearch",
                    params: ""
                })
            }
        }

    }
    if (tvKey != "") {
        clearTimeout(pairedTvTimeoutID)
        pairedTvTimeoutID = setTimeout(function () {
            unPair()

        }, tvDisconnectTimout)
    }
}
//------------------
//------Events------
//------------------
//Animates navebarHeight
function setNavbarSize(size, speed) {
    $(".navbar").animate({
        height: size + 'px'
    }, speed);
}
var navbarExpanded = false;
//Handle clicking the menubutton
$(".menubtn").click(function () {
    //Toggle Navbar Size
    if (navbarExpanded) {
        navbarExpanded = false;
        //animate to small Navbar
        setNavbarSize(70, 300)
        //Set menubutton closed color
        $(".menubtn").css("background-color", "transparent");
        //animate menu settings out of view
        $(".menusettingspanel").effect('slide', {
            direction: 'left',
            mode: 'hide'
        }, 300);

    } else {
        if (!isPaired) {
            socket.emit('getTVs', {})

        } else {

        }
        $('#tvNameInput').val(tvName)
        $('#transitionCheckbox').prop('checked', autoTransition);
        $('#tvModeCheckbox').prop('checked', tvMode);
        navbarExpanded = true;
        //animate To Big Navbar
        setNavbarSize(215, 300)
        //Set menubutton open color
        $(".menubtn").css("background-color", "rgba(78, 66, 244, 0.6)");
        //animate menu settings into view
        $(".menusettingspanel").effect('slide', {
            direction: 'left',
            mode: 'show'
        }, 300);
    }
})

//Handle keys being pressed on searchbox
var SearchFilterTimeoutID
$("#searchInput").on('keyup', function (e) {
    clearTimeout(SearchFilterTimeoutID);

    if (e.which == 13) {
        filterPage($("#searchInput").val())
    } else {
        SearchFilterTimeoutID = setTimeout(function () {
            filterPage($("#searchInput").val())
        }, 300)
    }
})
var navLeaveID
//Handle mouse leaving the nav bar
$(".navbar").mouseleave(function () {
    clearTimeout(navLeaveID)
    navLeaveID = setTimeout(function () {
        //If the navbar is already open, close it
        if (navbarExpanded) {
            navbarExpanded = false;
            //Animate navbar back to normal size
            setNavbarSize(70, 500)
            //Set menubutton color to closed color
            $(".menubtn").css("background-color", "rgba(0, 0, 0, 0)");
            //Hide settings panel if it is out
            $(".menusettingspanel").effect('slide', {
                direction: 'left',
                mode: 'hide'
            }, 300);
        }


    }, 1000)


})

var newPage = 0

function changePage(nP) {
    $(".container").hide("fade");
    filterPage("")
    $("#searchInput").val("")
    newPage = nP
    setTimeout(function () {
        unloadPage()
        loadpage(newPage)
    }, 500)
    clearInterval(pageTransitionIntervalID)
    if (newPage != 0 && autoTransition) {
        pageTransitionIntervalID = setInterval(function () {
            nextPage()
        }, localStorage.transitionTimeout)
    }
    if (tvKey != "") {
        socket.emit('cloneToTV', {
            token: tvKey,
            cmd: "changePage",
            params: nP
        })
        clearTimeout(pairedTvTimeoutID)
        pairedTvTimeoutID = setTimeout(function () {
            unPair()
        }, tvDisconnectTimout)
    }
    $("#Page").val(nP)
}
$('#Page').on('change', function () {
    changePage(this.value)
})

function nextPage() {
    $(".container").hide("fade");
    filterPage("")
    $("#searchInput").val("")
    newPage = Page + 1
    if (Groups[Group].pages[newPage] == null) {
        newPage = 1
    }
    $("#Page").val(newPage)
    setTimeout(function () {
        unloadPage()
        loadpage(newPage)

    }, 500)
}

function changeGroup(nG) {
    ReloadPageSelector()
    $(".container").hide("fade");
    filterPage("")
    $("#searchInput").val("")
    newGroup = nG
    unloadPage()
    Group = newGroup
    localStorage.Group = Group
    ReloadPageSelector()
    setTimeout(function () {

        loadpage(0)
    }, 500)
    clearInterval(pageTransitionIntervalID)
    if (Page != 0 && autoTransition) {
        pageTransitionIntervalID = setInterval(function () {
            nextPage()

        }, localStorage.transitionTimeout)
    }
    if (tvKey != "") {
        socket.emit('cloneToTV', {
            token: tvKey,
            cmd: "changeGroup",
            params: nG
        })
        clearTimeout(pairedTvTimeoutID)
        pairedTvTimeoutID = setTimeout(function () {
            unPair()
        }, tvDisconnectTimout)
    }
    $("#Group").val(nG)

}
var newGroup = 0
$('#Group').on('change', function () {
    changeGroup(this.value)
    //Fetch firsttime table data
})
$('#transitionCheckbox').on('change', function () {
    localStorage.autoTransition = this.checked
    autoTransition = this.checked
    clearInterval(pageTransitionIntervalID)
    if (Page != 0 && autoTransition) {
        pageTransitionIntervalID = setInterval(function () {
            nextPage()
        }, localStorage.transitionTimeout)
    }
});

function unTVmode() {
    hideBotbar()
    showNavbar()
    localStorage.tvMode = false
    tvMode = false
    if (socket != null) {
        socket.emit('tvModeDisabled', tvMode);
    }
    clearInterval(weatherIntervalID)
    resizeAllItems()
    UpdateUrl()
}

function unPair() {
    isPaired = false
    socket.emit("unPair", {})
    clearTimeout(pairedTvTimeoutID)
    tvKey = ""
    $(".pairedCmbo").css("background-color", "rgba(0, 0, 0, 0.3)");
    $(".navbar").css("background", navBarBkupColor);
}
$('#tvModeCheckbox').on('change', function () {
    if (this.checked) {
        tvName = $('#tvNameInput').val()
        localStorage.tvName = $('#tvNameInput').val()
        TVmode()
        resizeAllItems()

    } else {
        unTVmode()
    }
    clearTimeout(pairedTvTimeoutID)
});
var pairedTvTimeoutID
var navBarBkupColor = $(".navbar").css("background")
$('#pairedCmbo').on('change', function () {
    if (this.value == "unpair") {
        unPair()
    } else {
        socket.emit("pairTV", this.value)
        tvKey = this.value
        isPaired = true
        var selectedTV = $("#pairedCmbo option:selected").text()
        $("#pairedCmbo").text("")
        var outputgroup = [];
        //For every group in Groups, and key and val to outputgroup array
        outputgroup.push("<option class='selectoroption' value=" + this.value + ">" + selectedTV + "</option>");
        outputgroup.push("<option class='selectoroption' value=" + "unpair" + ">" + "Disconnect" + "</option>");
        //dump array into html and init
        $('#pairedCmbo').html(outputgroup.join(''));
        $(".menubtn").css("background-color", "rgba(0, 0, 0, 0)");

        $(".navbar").css("background", "linear-gradient(0deg, rgba(0, 206, 20, 0.5), rgba(80, 80, 80, 0.5), rgba(80, 80, 80, 0.5), rgba(80, 80, 80, 0.5), rgba(80, 80, 80, 0.5), rgba(80, 80, 80, 0.5), rgba(80, 80, 80, 0.5), rgba(0, 206, 20, 0.5)");
    }
    navbarExpanded = false;
    //animate to small Navbar
    setNavbarSize(70, 300)
    //Set menubutton closed color
    $(".menubtn").css("background-color", "rgba(0, 0, 0, 0)");
    //animate menu settings out of view
    $(".menusettingspanel").effect('slide', {
        direction: 'left',
        mode: 'hide'
    }, 300);

    clearTimeout(pairedTvTimeoutID)
    pairedTvTimeoutID = setTimeout(function () {
        unPair()

    }, tvDisconnectTimout)
});
document.body.onkeydown = function (e) {
    //Spacebar
    if (e.keyCode == 32) {
        if (!$("input#searchInput").is(":focus")) {
            clearInterval(pageTransitionIntervalID)
            if (Page != 0) {
                nextPage()
                if (autoTransition) {
                    pageTransitionIntervalID = setInterval(function () {
                        nextPage()
                    }, localStorage.transitionTimeout)
                }
            }
        }
    }
}
var resizeId;
//Handle window resizing
window.onresize = function (event) {
    clearTimeout(resizeId);
    //set BG canvas to full width and height of screen
    canvas_bg.width = window.innerWidth;
    canvas_bg.height = window.innerHeight;
    //removeForcefrom bg image
    transxforce = 0
    //ready New Frame
    canvas_bg.frameReady = true;
    //resize panel items
    resizeAllItems()
    if (tvKey != "") {
        clearTimeout(pairedTvTimeoutID)
        pairedTvTimeoutID = setTimeout(function () {
            unPair()

        }, tvDisconnectTimout)
    }
};
//--------------------------
//---SocketIO Event Setup---
//--------------------------

//Setup default groups
//TODO send all this default info from server to client next time
var Groups = []


//Setup socket connection event
socket.on('connect', function () {
    socket.emit('updateGroups', {})
    //On connection, show the navbar
    if (!tvMode) {
        setTimeout(showNavbar, 500)
    } else {
        socket.emit('tvModeEnabled', tvName);
    }
    //Remove page overlay with connection error
    $("#pageOverlay").hide("fade");
    //Show all the panels after the client connected
    $(".container").show("fade");
});
//Setup socket disconnect event
socket.on('disconnect', function () {
    firstPairedPageChange = false
    firstPairedGroupChange = false
    $(".profilePairedBox").hide()
    if (tvKey != "") {
        unPair()
    }
    unloadPage()
    Groups = []
    console.log('Disconnected...');
    //Move the navbar out of view
    hideNavbar();
    //Show page overlay
    $("#pageOverlay").show("fade");
    //Set the message to a disonnected message
    $("#pageOverlayText").text("Disconnected from server. Reconnecting...");
    //Hide all now disconnected panels
    $(".container").hide("fade");

});
//Setup event to hear datatable updates
socket.on('tableUpdated', function (tableData) {
    //If i have the need for this table
    if (datasetExists(tableData.name)) {
        for (var i = 0, len = Groups[Group].pages[Page].items.length; i < len; i++) {
            //Find the outdated table by matching the dataset names and time range
            if (tableData.name == Groups[Group].pages[Page].items[i].dataSet) {
                if (tableData.timeRange == Groups[Group].pages[Page].items[i].timeRange) {
                    //Then tell the server i want all of this new data
                    updateItem(Groups[Group].pages[Page].items[i])

                } else if (tableData.timeRange == "None") {
                    updateItem(Groups[Group].pages[Page].items[i])
                }
            }
        }

    }
})
var updateTableDataRefilterTimeoutID
//Setup event on datatable transmit
socket.on('updateTable', function (newTable) {
    //If I still have this table loaded
    if (datasetExists(newTable.name)) {
        //Go through all Items
        for (var i = 0, len = Groups[Group].pages[Page].items.length; i < len; i++) {
            //Find the outdated table by matching the dataset names
            if (newTable.name == Groups[Group].pages[Page].items[i].dataSet) {
                //load the item in a new obj
                citem = Groups[Group].pages[Page].items[i]
                citem.data = newTable.data
                citem.error = newTable.error
                citem.ts = newTable.ts
                //If this panel has laready been initialized then just update the data
                if (citem.loaded) {
                    updateChartData(citem, i)
                } else {
                    loadItem(citem, i)
                }
                if ($("#searchInput").val().length > 2) {
                    clearTimeout(updateTableDataRefilterTimeoutID)
                    updateTableDataRefilterTimeoutID = setTimeout(function () {
                        lastFilterStr = ""
                        filterPage($("#searchInput").val())
                    }, 200)
                }

            }
        }
    }
});

socket.on('updateGroups', function (newGroupList) {
    if (newGroupList == null) {
        console.log("It was null")
    } else {
        Groups = newGroupList
        if (Groups[Group] == null) {
            Group = 0
            Page = 0
            localStorage.Group = 0
            localStorage.Page = 0
            UpdateUrl()
        }
        if (Groups[Group].pages[Page] == null) {
            Page = 0
            localStorage.Page = 0
            UpdateUrl()
        }

        ReloadGroupSelectors()
        ReloadPageSelector()
        $('#Group').val(Group)
        $('#Page').val(Page)
        //Load the starting page
        //Give delay to load page to give time for groups list to asynchronsouly update on first attempt failure.
        //Why does this happen so intermittently?
        loadpage(Page)

    }


});
socket.on('forceRefresh', function () {
    location.reload(true);
});
socket.on('unpair', function () {
    $(".profilePairedBox").hide()
    filterPage("")
});
socket.on('pairTV', function () {
    $(".profilePairedBox").show()
    firstPairedGroupChange = true
    firstPairedPageChange = true
    filterPage("")
    socket.emit('tvPaired', {
        group: Group,
        page: Page,
        timeRange: GlobalTimerange
    })

});
socket.on('forceRefresh', function () {
    location.reload(true);
});

socket.on('cloneToTV', function (Srequest) {
    if (Srequest.cmd == "search") {
        filterPage(Srequest.params)
    } else if (Srequest.cmd == "clssearch") {
        filterPage("")
    } else if (Srequest.cmd == "changeGroup") {
        if (!firstPairedGroupChange) {
            changeGroup(parseInt(Srequest.params))
        } else {
            firstPairedGroupChange = false
        }
    } else if (Srequest.cmd == "changePage") {
        if (!firstPairedPageChange) {
            changePage(parseInt(Srequest.params))
        } else {
            firstPairedPageChange = false
        }
    } else if (Srequest.cmd == "changeGlobalTimerange") {
        setGlobalTimerange(Srequest.params)
    }
});
socket.on('getTVs', function (tvList) {
    $("#pairedCmbo").text("")
    var outputgroup = [];
    //For every group in Groups, and key and val to outputgroup array
    for (var i = 0, len = tvList.length; i < len; i++) {
        outputgroup.push("<option class='selectoroption' value=" + tvList[i].v + ">" + tvList[i].k + "</option>");
    }
    //dump array into html and init
    $('#pairedCmbo').html(outputgroup.join(''));
});
//--------------------------------------
//-----Start Main Loops / Intervals-----
//--------------------------------------
//Keep time updated on the nav bar
setInterval(function () {
    //Get time
    var time = new Date();
    //set them time to formatted HH:MM am/pm
    $('.time').text(formatAMPM(time))
    //set Date
    $('.date').text(formatDate(time, "dddddddddd, MMM dd", true))
    //repeat every second
}, 1000)

var pageTransitionIntervalID = 0
if (Page != 0 && autoTransition) {
    pageTransitionIntervalID = setInterval(function () {
        nextPage()
    }, localStorage.transitionTimeout)
}



var weather = {
    icon: new Image()
}
var xhr_weather = new XMLHttpRequest();

function getWindChill(wind, temp) {
    var wind2 = Math.pow(wind, 0.16);
    var wind_chill = (35.74 + 0.6215 * temp - 35.75 * wind2 + 0.4275 * temp * wind2);
    wind_chill = parseFloat(wind_chill.toFixed(2));
    return wind_chill;
}

function getweather() {

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
                var Pos = position
                QueryWeather(Pos)
            },
            function () {
                var Pos = {
                    coords: {
                        latitude: "40.52",
                        longitude: "-111.86"
                    }
                }
                QueryWeather(Pos)
            }, {
                maximumAge: 50000,
                timeout: 20000,
                enableHighAccuracy: true
            });
    } else {
        var Pos = {
            coords: {
                latitude: "40.52",
                longitude: "-111.86"
            }
        }
        QueryWeather(Pos)
    }

}

function QueryWeather(Pos) {
    xhr_weather.open("GET", 'http://api.openweathermap.org/data/2.5/weather?APPID=1175708071d297968524e96b8eb49bc1&lat=' + Pos.coords.latitude + '&lon=' + Pos.coords.longitude + '&units=imperial', true);
    xhr_weather.onload = function (e) {
        if (xhr_weather.readyState === 4) {
            if (xhr_weather.status === 200) {
                if (JSON.parse(xhr_weather.responseText) != null) {
                    var tmpweather = JSON.parse(xhr_weather.responseText)
                    weather.icon.src = "http://openweathermap.org/img/w/" + tmpweather.weather[0].icon + ".png"
                    $(".Wlogo").attr('src', weather.icon.src);
                    weather.description = tmpweather.weather[0].description.capitalizeFirstLetter()
                    $(".weatherStr1").text(weather.description)
                    weather.temp = tmpweather.main.temp
                    weather.windchill = round(getWindChill(parseInt(tmpweather.wind.speed), parseInt(weather.temp)), 2)
                    weather.humidity = tmpweather.main.humidity
                    weather.cloudcoverage = tmpweather.clouds.all
                    weather.windspeed = tmpweather.wind.speed
                    weather.winddirection = tmpweather.wind.deg
                    weather.location = tmpweather.name
                    $(".weatherStr2").text(weather.temp + "°F  Feels Like: " + weather.windchill + "°F")
                    $(".weatherStr3").text("Humidity: " + weather.humidity + "%  Wind: " + weather.windspeed + " mph")
                    if (tmpweather.visibility != undefined) {
                        weather.visibility = round(parseInt(tmpweather.visibility) * 0.000621371, 2)
                    }

                }
                // file is loaded
            } else {
                console.error(xhr_weather.statusText);
            }
        }

    };
    xhr_weather.send(null);
}
var weatherIntervalID = 0
if (tvMode) {
    getweather();
    weatherIntervalID = setInterval(function () {
        if (tvMode) {
            getweather();
        } else {
            clearInterval(weatherIntervalID);
        }

    }, 300000);
}
//Timekeeping
var now = new Date();
var todaysDate = now.getDate()
setInterval(function () {
    now = new Date();
    var nowDate = now.getDate()
    if (nowDate != todaysDate) {
        var date = [now.getFullYear(), now.getMonth() + 1, now.getDate()];
        var Today = date.join("/");
        todaysDate = nowDate
        setGlobalTimerange(Today + " " + Today)
    }
}, 5000)
