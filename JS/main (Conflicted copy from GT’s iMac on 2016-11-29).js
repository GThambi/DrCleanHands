$(document).ready(function () {

    var userLocation, //Set Location for weather by city and country(in first two characters) e.g. 'City,CO' to bypass auto geolocation.
        washDuration = 15000, //length of time for handwashing, in milliseconds
        weatherRefresh,
        interval;

    function loadWeather(location, woeid) {
        $.simpleWeather({
            location: location,
            woeid: woeid,
            unit: 'C',
            success: function (weather) {
                city = weather.city;
                temp = weather.temp + '&deg;';
                wcode = '<img class="weathericon" src="img/icons/wI_' + weather.code + '.svg">';
                wind = '<p>' + weather.wind.speed + ' ' + weather.units.speed + '</p>';
                humidity = weather.humidity + ' %';
                $(".location").text(city);
                $(".temperature").html(temp);
                $(".climate_bg").html(wcode);
                $(".windspeed").html(wind);
                $(".humidity").text(humidity);
                $('.errorMsg').text('');
                clearInterval(weatherRefresh);
                weatherRefresh = setInterval(function () {
                    loadWeather(userLocation);
                }, 60000);
                console.log('success!');
            },
            error: function (error) {
                $(".climate_bg").html('<img class="weathericon" src="img/icons/wI_3200.svg">');
                $('.errorMsg').text('recalculating');
                clearInterval(weatherRefresh);
                weatherRefresh = setInterval(function () {
                    loadWeather(userLocation);
                }, 5000);
                console.log('error!');
            }
        });
    }

    function readableTime() {
        var month = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
            day = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            d = new Date(),
            m = d.getMonth(),
            n = d.getDay(),
            x = d.getDate(),
            y = d.getFullYear(),
            h = d.getHours(),
            min = ("0" + d.getMinutes()).slice(-2);

        function simpleTime(hour, meridiem) {
            hour = h;
            meridiem = 'am';
            if (hour === 0) {
                hour = 12;
            }
            if (hour > 12) {
                hour = hour - 12;
                meridiem = 'pm';
            }
            return hour + ':' + min + ' ' + meridiem;
        }

        function simpleDate() {
            return day[n].slice(0, 3) + ' ' + month[m].slice(0, 3) + ' ' + x + ', ' + y;
        }

        $('.time').html(simpleTime());
        $('.date').html(simpleDate());
    }

    function timer(time, update, complete) {
        var start = new Date().getTime();
        interval = setInterval(function () {
            var now = time - (new Date().getTime() - start);
            timePercent = (time - now) / time;
            if (now <= 0) {
                clearInterval(interval);
                complete();
            } else update(Math.floor(now / 1000));
        }, 10);
    }

    function animatenext(elem) {
        elem.each(function (i) {
            $(this).delay((i++) * 300).fadeTo(500, 1);
        });
    }

    function enterContextual(entry, memberEntry, duration) {
        //ending animation: fade to black
        $('.contextualWidget').animate({
            opacity: 0
        }, 1000, function () {
            $(this).css({
                right: -632,
                opacity: 1
            });
            if (entry === 0 && memberEntry != 0) {
                $.getJSON('memberData.json', function (json) {
                    var mData = json.member[memberEntry];
                    $('.contextualWidget h3').html(mData.title + ' ' + mData.firstname + ' ' + mData.middlename + ' ' + mData.lastname);
                    $('.contextualWidget > div').html('<p> You have washed ' + Object.keys(mData.washed).length + ' times today!</p>');
                    $.each(mData.washed, function (key, val) {
                        $('.contextualWidget > div').append('<p>' + val.rate + ' ' + val.time + '</p>');
                    });
                })
            } else {
                $.getJSON('dialogmsg.json', function (json) {
                    $('.contextualWidget h3').html(json.message[entry].title);
                    $('.contextualWidget > div').html(json.message[entry].text);
                })
            }
            $('.contextualWidget p').css('opacity', 0);
            $('.contextualWidget h3').css({
                paddingLeft: 0,
                marginLeft: -10
            });
            // Message slides into view
            $('.contextualWidget').animate({
                right: -52
            }, 1000);
            $('.contextualWidget h3').animate({
                paddingLeft: 62,
                marginLeft: -70
            }, 1000, function () {
                animatenext($('.contextualWidget p'));
            });
        })
    }

    $('.proximityButton').on('click', function () {
        enterContextual(0, 1);
    })

    $('.tapTrigger').on('click', function () {
        clearInterval(interval);
        $('.barMeter').css('opacity', 1);
        timer(washDuration,
            function (timeleft) {
                $('.countdown').text(timeleft);
                $('.barCover').height(timePercent * 100 + '%');
            },
            function () {
                $('.countdown').text('');
                $('.barCover').addClass('barCoverAnimate');
                setTimeout(function () {
                    $('.barMeter').animate({
                        opacity: 0
                    }, 500).promise().done(function () {
                        $('.barCover').css('height', 0).removeClass('barCoverAnimate');
                    });
                }, 1500);
            }
        );
    })

    readableTime();

    if (userLocation) {
        loadWeather(userLocation);
    } else {
        navigator.geolocation.getCurrentPosition(function (position) {
            userLocation = position.coords.latitude + ',' + position.coords.longitude;
            loadWeather(userLocation);
        });
    }

    setInterval(readableTime, 5000);
    loadWeather(userLocation);
});