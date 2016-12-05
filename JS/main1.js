$(document).ready(function () {

    var userLocation, //Set Location for weather by city and country(in first two characters) e.g. 'City,CO' to bypass auto geolocation.
        washDuration = 2000, //length of time for handwashing, in milliseconds
        weatherRefresh,
        interval;

    function setIntervalatZero(fn, t) {
        fn();
        return (setInterval(fn, t));
    }

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
            },
            error: function (error) {
                $(".climate_bg").html('<img class="weathericon" src="img/icons/wI_3200.svg">');
                $('.errorMsg').text('recalculating');
                clearInterval(weatherRefresh);
                weatherRefresh = setInterval(function () {
                    loadWeather(userLocation);
                }, 5000);
            }
        });
    }

    function readableTime(time, complete) {
        var month = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
            day = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            d = new Date(time),
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

        complete(simpleTime(), simpleDate());
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
        $('.contextualWidget').animate({
            opacity: 0
        }, 1000, function () {
            $(this).css({
                right: -632,
                opacity: 1
            });
            $('.subContext', this).html('');
            if (entry === 0 && memberEntry != 0) {
                $.getJSON('memberData.json', function (json) {
                    var mData = json.member[memberEntry],
                        quantToday = 0,
                        s = '';
                    $.each(mData.washed,
                        function (key, val) {
                            readableTime(val.time, function (timestamp) {
                                var nowTimeStamp = new Date().getTime();
                                if ((nowTimeStamp - val.time) <= 86400000) {
                                    $('.subContext').append('<div class="emojiContainer"><img class="emoji" src="img/icons/emoji-' + val.rate + '.svg"/><br>' + timestamp + '</div>');
                                    quantToday++;
                                }
                            });
                        });
                    $('.contextualWidget h3').data('memberID', memberEntry).html(mData.title + ' ' + mData.firstname + ' ' + mData.middlename + ' ' + mData.lastname);

                    console.log($('.contextualWidget h3').data('memberID'));

                    if (quantToday !== 1) {
                        s = 's';
                    }
                    $('.subContext').prepend('<div> You have washed ' + quantToday + ' time' + s + ' today!</div>');
                });
            } else {
                $('.contextualWidget h3').removeData('memberID');
                $.getJSON('dialogmsg.json', function (json) {
                    $('.contextualWidget h3').html(json.message[entry].title);
                    $('.subContext').html(json.message[entry].text);
                })
            }
            $('.subContext > div').css('opacity', 0);
            $('.contextualWidget h3').css({
                paddingLeft: 0,
                marginLeft: -10
            });
            // Message slides into view
            $('.contextualWidget').animate({
                right: -0
            }, 1000);
            $('.contextualWidget h3').animate({
                paddingLeft: 62,
                marginLeft: -70
            }, 1000, function () {
                animatenext($('.subContext > div'));
            });
        })
    }

    $('.proximityMember').on('click', function () {
        enterContextual(0, 1);
    });

    $('.proximityGuest').on('click', function () {
        enterContextual(0, 0);
    });

    $('.defaultDialog').on('click', function () {
        enterContextual(1, 0);
    });

    function abortTap() {
        clearInterval(interval);
        $('.washResult').removeClass('goodResult');
        $('.barMeter').animate({
            opacity: 0
        }, 500).promise().done(function () {
            $('.barCover').css('height', 0).removeClass('barCoverAnimate');
            $('.washResult').html('<img src="IMG/Icons/emoji-1.svg"/>').addClass('badResult');
        });
        setTimeout(function () {
            $('.washResult').removeClass('badResult');
        }, 4000);
        $(this).one("click", activateTap);
    }

    function activateTap() {
        clearInterval(interval);
        $('.barMeter').css('opacity', 1);
        $('.washResult').removeClass('badResult');
        timer(washDuration,
            function (timeleft) {
                $('.countdown').text(timeleft);
                $('.barCover').height(timePercent * 100 + '%');
                $('.tapTrigger').off().one("click", abortTap);
            },
            function () {
                $('.countdown').text('');
                $('.barCover').addClass('barCoverAnimate');
                if ($('.contextualWidget h3').data('memberID')) {
                    var t = new Date().getTime();
                        $.getJSON('memberData.json', function (json) {
                            var mData = json.member[$('.contextualWidget h3').data('memberID')];
                            mData.washed.push(
                                {"time":t, "rate":0}
                            )
                            console.log(t + ', ' + mData.washed);
                        })
                }
                setTimeout(function () {
                    $('.barMeter').animate({
                        opacity: 0
                    }, 500).promise().done(function () {
                        $('.barCover').css('height', 0).removeClass('barCoverAnimate');
                        $('.washResult').html('<img src="IMG/Icons/emoji-0.svg"/>').addClass('goodResult');
                    });
                }, 1500);
                setTimeout(function () {
                    $('.washResult').removeClass('goodResult');
                    $('.tapTrigger').off().one("click", activateTap);
                }, 4000);
            }
        );
    }

    $('.tapTrigger').one('click', activateTap);

    //readableTime();

    if (userLocation) {
        loadWeather(userLocation);
    } else {
        navigator.geolocation.getCurrentPosition(function (position) {
            userLocation = position.coords.latitude + ',' + position.coords.longitude;
            loadWeather(userLocation);
        });
    }

    currentTime = setIntervalatZero(function () {
        var t = new Date().getTime();
        readableTime(t, function (timestamp, datestamp) {
            $('.time').html(timestamp);
            $('.date').html(datestamp);
        });
    }, 5000);
    loadWeather(userLocation);
});