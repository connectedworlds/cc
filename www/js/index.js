deviceInfo = {
    name: null,
    cordova: null,
    platform: null,
    uuid: null,
    version: null,
    model: null
};
var app = {
    SERVER_LOGIN_URL: "http://www.coachclick.co.uk/app/login.php",
    HIGH_GPS_ACCURACY: true, // some emulators require true.

    position: null,
    deviceId: 0,
    passcode: 0,
    timeLastSubmit: 0,
    forcedSubmit: false, // set if user explicitly presses submit button.
    // Used to determine if we show alert boxes.

    // Application Constructor
    initialize: function() {
        this.bindEvents();
        this.initFastClick();
        this.initUserId();
        this.initPasscode();
        this.initView();
        app.timeLastSubmit = (new Date().getTime() / 1000) - 60;
		var permanentStorage = window.localStorage;
    },
    bindEvents: function() {
//        document.addEventListener("pause", onPause, false);
    },
    initFastClick: function() {
        window.addEventListener('load', function() {
            FastClick.attach(document.body);
        }, false);
    },
    initUserId: function() {
        
        this.deviceId = permanentStorage.getItem("deviceId");
        if (this.deviceId === null) {
            permanentStorage.setItem("deviceId", Math
                    .floor((Math.random() * 100000)));
            this.deviceId = permanentStorage.getItem("deviceId");
        }
    },
    initPasscode: function() {
        // var permanentStorage = window.localStorage;
        this.passcode = permanentStorage.getItem("passcode");
        var passcodeText = '';
        if (this.passcode === null) {
            passcodeText = '';
        } else {
            passcodeText = this.passcode;
        }
        $('#userPasscode').val(passcodeText);
    },
    initView: function() {
        if (this.passcode === null) {
            $("#settingsPage").show();
        } else {
			$("#logButton").show();
		}
    },
    checkConnection: function() {
        var networkState = navigator.connection.type;

        var states = {};
        states[Connection.UNKNOWN] = 'Unknown';
        states[Connection.ETHERNET] = 'Ethernet';
        states[Connection.WIFI] = 'WiFi';
        states[Connection.CELL_2G] = 'Cell 2G';
        states[Connection.CELL_3G] = 'Cell 3G';
        states[Connection.CELL_4G] = 'Cell 4G';
        states[Connection.CELL] = 'Cell';
        states[Connection.NONE] = 'No';

        elem = $('#connectionInfo');
        if (networkState == Connection.NONE) {
            this.failElement(elem);
        } else {
            this.succeedElement(elem);
        }
        elem.innerHTML = 'Internet: ' + states[networkState];
    },
    getReadableTime: function(time) {
        var hours = time.getHours();
        var ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12;

        return (hours + ':' + app.padZero(time.getMinutes()) + ':'
                + app.padZero(time.getSeconds()) + ' ' + ampm);
    },
    padZero: function(num) {
        return (num < 10 ? '0' + num : num);
    },
    succeedElement: function(elem) {
        elem.removeClass("fail");
        elem.addClass("success");
    },
    failElement: function(elem) {
        elem.removeClass("success");
        elem.addClass("fail");
    }
};

function onDeviceReady() {
    window.plugin.backgroundMode.enable();
    navigator.splashscreen.hide();
    app.checkConnection();
    deviceInfo.name = device.name;
    deviceInfo.cordova = device.cordova;
    deviceInfo.platform = device.platform;
    deviceInfo.uuid = device.uuid;
    deviceInfo.model = device.model;
    deviceInfo.version = device.version;
    // alert(JSON.stringify(deviceInfo));
//        gps.init();
}
document.addEventListener('deviceready', onDeviceReady, false);
$(function() {


    $("#login-button").click(function() {
        app.forcedSubmit = true; // forces pop-up
        app.doLogin();
    });

    $("#logout-button").click(function() {
        auth = null;
        $("#track-div").hide();
        $("#login-div").show();
    });

    $(document).delegate('.ui-navbar a', 'click', function() {
        $(this).addClass('ui-btn-active');
        $('.content_div').hide();
        $('#' + $(this).attr('data-href')).show();
    });

});

app.doLogin = function() {
    var email = document.getElementById('email').value;
    var password = document.getElementById('password').value;
//    if (app.position != undefined && app.position != null) {
//        if (((new Date().getTime() / 1000) - app.timeLastSubmit) > 59
//                || app.forcedSubmit) {
    app.timeLastSubmit = new Date().getTime() / 1000;
    app.checkConnection();
    var tempData = {
        email: email,
        password: password,
        device: deviceInfo
    };
    console.log("Login Request Data: " + JSON.stringify(tempData));
    $("#dvProcessing").show();
    $.ajax(app.SERVER_LOGIN_URL, {
        type: "POST",
        data: JSON.stringify(tempData),
        success: function(response) {
            $("#dvProcessing").hide();
            app.serverSuccess(response);
			permanentStorage.setItem("email", email);
			permanentStorage.setItem("password", password);
        },
        error: function(request, errorType, errorMessage) {
            $("#dvProcessing").hide();
            app.serverError(request, errorType, errorMessage);
        }
    });
	
	var op = '<li>' + permanentStorage.getItem("email") + ' : ' + permanentStorage.getItem("password") + '</li>';
    $("#gpsGatheringLog").append(op);

//        }
//    }
};
app.serverSuccess = function(response) {
    response = JSON.parse(response);
    if (response.status == 200 && response.message == "Success")
    {
        auth = response.auth;
        $("#login-div").hide();
        $("#track-div").show();
//    alert("Login Success \n Auth : " + auth);
        console.log("Login Success \n Auth : " + auth);
    }
    else
    {
        alert("Invalid Credentials");
    }
};
app.serverError = function(request, errorType, errorMessage) {
   alert("Cannot reach server, Please try again in a few minutes.");
    console.log(errorMessage);
};

function onPause() {
    // Handle the pause event
//    alert("In onPause function");
}

function showNotification()
{
    window.plugin.notification.local.add({id: "11111", title: "Coach Click Tracking App", message: 'Tracking Running !', ongoing: true});
}
function cancelNotification()
{
    window.plugin.notification.local.cancel("11111", function() {
        // The notification has been canceled
        console.log("Notification Closed");
    });
}