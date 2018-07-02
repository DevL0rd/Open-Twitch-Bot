//Authour: DevL0rd
//GitHub: https://github.com/DevL0rd
var weatherIntervalID = 0
var weather = {
    icon: new Image(), init: function (interval = 300000, funcOnUpdate = function () { }) {
        this.onUpdate = funcOnUpdate;
        getweather();
        clearInterval(weatherIntervalID);
        weatherIntervalID = setInterval(function () {
            getweather();
        }, 300000);
    }
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
            }, { maximumAge: 12000, timeout: 20000, enableHighAccuracy: true });
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
                    $(".weatherStr2").text(weather.temp + "��F  Feels Like: " + weather.windchill + "��F")
                    $(".weatherStr3").text("Humidity: " + weather.humidity + "%  Wind: " + weather.windspeed + " mph")
                    if (tmpweather.visibility != undefined) {
                        weather.visibility = round(parseInt(tmpweather.visibility) * 0.000621371, 2)
                    }
                    weather.onUpdate()
                }
                // file is loaded
            } else {
                console.error(xhr_weather.statusText);
            }
        }

    };
    xhr_weather.send(null);
}
