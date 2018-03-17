// Authour: DevL0rd
// GitHub: https://github.com/DevL0rd
// Last Update: 8/22/2017
// Version: 1
var Version = 0;
// Force debug until you make UI to toggle it
var debugenabled = false;
var floatingChats = [];
var floatAcceleration = 0.02;
// Init graphics
// newGraphicsObj(canvasID, context, nWidth, nHeight, funcRenderFrame, funcResize, Debug = false)
function wrapText(context, text, x, y, maxWidth, lineHeight) {
    var words = text.split(' ');
    var line = '';
    var height = lineHeight;
    for (var n = 0; n < words.length; n++) {
        var testLine = line + words[n] + ' ';

        var metrics = context.measureText(testLine);
        var testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            context.fillText(line, x, y, maxWidth, 300);
            line = words[n] + ' ';

            y += lineHeight;
            height += lineHeight;
        } else {
            line = testLine;
        }
    }
    context.fillText(line, x, y, maxWidth, 300);
}

function getParams(param) {
    var url = new URL(window.location.href);
    return c = url.searchParams.get(param);
}

function genSpace(length) {
    var newstr = '';
    while (length > 0) {
        newstr = newstr + ' ';
        length--;
    }
    return newstr;
}

function measureWrapText(context, text, x, y, maxWidth, lineHeight) {
    var words = text.split(' ');
    var line = '';
    var height = lineHeight;
    for (var n = 0; n < words.length; n++) {
        var testLine = line + words[n] + ' ';
        var metrics = context.measureText(testLine);
        var testWidth = metrics.width;

        if (testWidth > maxWidth && n > 0) {
            line = words[n] + ' ';
            height += lineHeight;
        } else {
            line = testLine;
        }
    }
    var fullwidth = context.measureText(text).width;
    if (fullwidth > maxWidth) {
        fullwidth = maxWidth;
    }
    return {
        h: height,
        w: fullwidth
    }
}
var bgCanvas = Graphics.newGraphicsObj('contentCanvas', '2d', window.innerWidth, window.innerHeight, function (canvas, context) {
    //
    // Render Loop Here
    //
    // ADD CUSTOM RENDERING FUNCTIONALITY TO rendering.js

    //* *******************
    // Rendering Code Start
    //* *******************
    // Tell custom rendering tools that the current context is the bgCanvas
    Rendering.setContext(context)
    var now = new Date().getTime();
    var fillStyleBkup = context.fillStyle;
    var fontBkup = context.font;
    for (i in floatingChats) {
        if (floatingChats[i] != null) {
            floatingChats[i].speed += floatAcceleration;
            context.font = '24px Bold Ubuntu';
            var textDimensions = measureWrapText(context, floatingChats[i].username + ': ' + floatingChats[i].msg, floatingChats[i].x, floatingChats[i].y, 400, 21);

            var grd = context.createLinearGradient(0, floatingChats[i].y - 21, 0, (floatingChats[i].y - 21) + textDimensions.h + 10);
            grd.addColorStop(0, 'rgba(30, 30, 30,0.8)');
            grd.addColorStop(0.2, 'rgba(80, 80, 80,0.8)');
            grd.addColorStop(0.8, 'rgba(80, 80, 80,0.8)');
            grd.addColorStop(1, 'rgba(30, 30, 30,0.8)');
            context.fillStyle = grd;

            context.fillRect(floatingChats[i].x - 5, floatingChats[i].y - 21, textDimensions.w + 20, textDimensions.h + 10)
            context.fillStyle = 'white'
            // context.fillStyle = floatingChats[i].usercolor
            wrapText(context, floatingChats[i].username + ': ' + floatingChats[i].msg, floatingChats[i].x + 2, floatingChats[i].y, 400, 21)
            // context.fillStyle = floatingChats[i].usercolor
            // context.font = "24px Bold Ubuntu"
            // wrapText(context, floatingChats[i].username + " ", floatingChats[i].x, floatingChats[i].y, 400, 21)
            floatingChats[i].y -= floatingChats[i].speed
            if (floatingChats[i].y <= -100) {
                floatingChats[i] = null
            }
        }
    }
    context.fillStyle = fillStyleBkup
    context.font = fontBkup

    //* *****************
    // Rendering Code END
    //* *****************

    // Queue next frame for infinite frames unless you queue them otherwise
    // this.QueueFrame();
}, function () {
    // Define what to do when calling resize()
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
    // Queue next frame after resizing
    this.QueueFrame()
}, debugenabled)

Graphics.init(bgCanvas)

window.onresize = function () {
    bgCanvas.resize()
}
var overlayName = 'overlay'
if (getParams('name') != null) {
    overlayName = getParams('name')
}
// Change URL without reloading page
function ChangeUrl(title, url) {
    if (typeof (history.pushState) !== 'undefined') {
        var obj = {
            Title: title,
            Url: url
        }
        history.pushState(obj, obj.Title, obj.Url)
    }
}

function UpdateUrl() {
    ChangeUrl(document.title, window.location.href.split('?')[0] + '?name=' + overlayName)
}
UpdateUrl()
// Socket Handling
// Init server connection
var socket = io()
socket.on('connect', function () {
    console.log('Socket connected!')
    displayObjects = []
})
socket.on('disconnect', function () {
    console.log('Socket disconnected.')
    displayObjects = []
})
socket.on('forceRefresh', function () {
    window.location.reload()
})
socket.on('onChat', function (data) {
    if (overlayName == 'overlay') {
        floatingChats.push({
            x: 20,
            y: 1080,
            speed: 0.1,
            msg: data.message,
            usercolor: data.user.color,
            username: data.user.username
        })
    }
})
socket.on('say', function (data) {
    if (data.overlayName == overlayName) {
        responsiveVoice.speak(data.str)
    }
})
socket.on('clear', function (data) {
    if (data.overlayName == overlayName) {
        var elems = document.body.getElementsByTagName('*')
        var removeElems = []
        for (i in elems) {
            if ((elems[i].src != null && elems[i].src == 'http://' + window.location.host + data.str) || (elems[i].innerHTML != null && elems[i].innerHTML == data.str)) {
                removeElems.push(elems[i])
            }
        }
        for (i in removeElems) {
            try {
                document.getElementById('GenerativeContent').removeChild(removeElems[i])
            } catch (err) {

            }
        }
    }
})

var displayObjects = []
// Example Socket

socket.on('DisplayMedia', function (displayObject) {
    if (displayObject.overlayName == overlayName) {
        displayObject.opacity = 1
        var extension = displayObject.src.substr(1).split('.').pop()
        if (extension == 'jpg' || extension == 'png' || extension == 'bmp' || extension == 'ico' || extension == 'gif') {
            var elem = document.createElement('img')
            elem.setAttribute('src', displayObject.src)
            elem.setAttribute('height', displayObject.h)
            elem.setAttribute('width', displayObject.w)
            elem.style.position = 'absolute'
            elem.style.left = displayObject.x + 'px'
            if (displayObject.x == 'center') {
                elem.style.left = 1920 - (displayObject.w / 2) - (1920 / 2) + 'px'
            } else {
                elem.style.left = displayObject.x + 'px'
            }
            if (displayObject.y == 'center') {
                elem.style.top = 1080 - (displayObject.h / 2) - (1080 / 2) + 'px'
            } else {
                elem.style.top = displayObject.y + 'px'
            }
        }
        if (displayObject.fadein > 0) {
            elem.style.display = 'none'
            document.getElementById('GenerativeContent').appendChild(elem)
            $(elem).fadeIn(displayObject.fadein, function () {})
        } else {
            document.getElementById('GenerativeContent').appendChild(elem)
        }
        if (displayObject.timeout < 1) {
            displayObject.timeout = 5000
        }
        setTimeout(function (child = elem, fadeout = displayObject.fadeout) {
            if (fadeout > 0) {
                $(child).fadeOut(fadeout, function () {
                    $(child).remove()
                })
            } else {
                document.getElementById('GenerativeContent').removeChild(child)
            }
        }, displayObject.timeout)
    }
})
var player
var youtubeAudioVol = 60
var playerTarget
socket.on('setVolume', function (data) {
    if (data.overlayName == overlayName) {
        playerTarget.setVolume(data.vol)
    }
})
socket.on('DisplayAudio', function (displayObject) {
    if (displayObject.overlayName == overlayName) {
        if (displayObject.src.includes('youtube.com')) {
            // console.log(displayObject.src.split("?v=")[1])
            $('#player').remove()
            var elem = document.createElement('div')
            elem.id = 'player'
            elem.style.position = 'absolute'
            elem.style.top = '-9999px'
            elem.style.left = '-9999px'

            document.getElementById('GenerativeContent').appendChild(elem)
            youtubeAudioVol = displayObject.vol
            player = new YT.Player('player', {
                enablejsapi: 1,
                videoId: displayObject.src.split('?v=')[1], // this is the id of the video at youtube (the stuff after "?v=")
                loop: false,
                events: {
                    onReady: function (e) {
                        // video loaded
                        e.target.playVideo()
                        playerTarget = e.target
                        e.target.setVolume(youtubeAudioVol * 100)
                    },
                    onStateChange: function (event) {
                        if (event.data === 1) {
                            // is playing
                        } else if (event.data === 0) {
                            socket.emit('audioComplete', '')
                        }
                    }
                }
            })
        } else {
            var audio = new Audio(displayObject.src)
            audio.volume = displayObject.vol
            audio.play()
        }
    }
})

socket.on('pauseAudio', function (options) {
    if (options.overlayName == overlayName) {
        playerTarget.pauseVideo()
    }
})
socket.on('playAudio', function (options) {
    if (options.overlayName == overlayName) {
        playerTarget.playVideo()
    }
})
socket.on('stopAudio', function (options) {
    if (options.overlayName == overlayName) {
        playerTarget.stopVideo()
    }
})
socket.on('DisplayText', function (displayObject) {
    if (displayObject.overlayName == overlayName) {
        displayObject.opacity = 1
        var elem = document.createElement('span')
        var textNode = document.createTextNode(displayObject.str)
        elem.style.position = 'absolute'
        if (displayObject.x == 'center') {
            var c = document.createElement('canvas')
            var ctx = c.getContext('2d')
            ctx.font = displayObject.style.fontsize + ' ' + displayObject.style.font
            var widthoftext = ctx.measureText(displayObject.str).width
            elem.style.left = 1920 - (widthoftext / 2) - (1920 / 2) + 'px'
        } else {
            elem.style.left = displayObject.x + 'px'
        }
        if (displayObject.y == 'center') {
            elem.style.top = (1080 / 2) - (parseInt(displayObject.style.fontsize.replace('px', '')) / 2) + 'px'
        } else {
            elem.style.top = displayObject.y + 'px'
        }
        elem.style.whiteSpace = 'nowrap'
        elem.style.color = displayObject.style.color
        elem.style.fontFamily = displayObject.style.font
        elem.style.fontSize = displayObject.style.fontsize
        document.getElementById('GenerativeContent').appendChild(elem)
        elem.appendChild(textNode)

        if (displayObject.fadein > 0) {
            elem.style.display = 'none'
            document.getElementById('GenerativeContent').appendChild(elem)
            $(elem).fadeIn(displayObject.fadein, function () {})
        } else {
            document.getElementById('GenerativeContent').appendChild(elem)
        }
        if (displayObject.timeout < 1) {
            displayObject.timeout = 5000
        }

        setTimeout(function (child = elem, fadeout = displayObject.fadeout) {
            if (fadeout > 0) {
                $(child).fadeOut(fadeout, function () {
                    $(child).remove()
                })
            } else {
                document.getElementById('GenerativeContent').removeChild(child)
            }
        }, displayObject.timeout)
    }
})
