deviceInfo = {
    name: null,
    cordova: null,
    platform: null,
    uuid: null,
    version: null,
    model: null
};
var auth;
var app = {
    SERVER_LOGIN_URL: "http://www.coachclick.co.uk/app/login.php",
    HIGH_GPS_ACCURACY: true, // some emulators require true.
	
    position: null,
    deviceId: 0,
    password: '',
	email: '',
    timeLastSubmit: 0,
    forcedSubmit: false, 

    // Application Constructor
    initialize: function() {
        this.bindEvents();
        this.initFastClick();
        this.initUserId();
        this.initPasscode();
        this.initView();
		this.checkConnection();
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
        var permanentStorage = window.localStorage;
        this.deviceId = permanentStorage.getItem("deviceId");
        if (this.deviceId === null) {
            permanentStorage.setItem("deviceId", Math.floor((Math.random() * 100000)));
            this.deviceId = permanentStorage.getItem("deviceId");
        }
    },
    initPasscode: function() {
        // var permanentStorage = window.localStorage;
        // this.password = permanentStorage.getItem("password");
        // this.email = permanentStorage.getItem("email");
        // if (this.passcode !== null) {
            // $('#email').val(permanentStorage.getItem("email"));
			// $('#password').val(permanentStorage.getItem("password"));
        // } else {
			// $("#trackingPage").hide();
			// $("#settingsPage").show();
		// }
		
    },
    initView: function() {
		var permanentStorage = window.localStorage;
		auth = permanentStorage.getItem("auth");
        if (auth !== null) {
            $('#email').val(permanentStorage.getItem("email"));
			$('#password').val(permanentStorage.getItem("password"));
			$('#logout-button').show();
			$('#login-button').hide();
        } else {
			$("#trackingPage").hide();
			$("#settingsPage").show();
			auth = '';
		}
		// console.log(auth);
		// permanentStorage.removeItem("gpsData")
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

        $('#connectionType').text(states[networkState]);
		
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
        $('#logout-button').show();
		$('#login-button').hide();
    });

    $(document).delegate('.ui-navbar a', 'click', function() {
        $(this).addClass('ui-btn-active');
        $('.content_div').hide();
        $('#' + $(this).attr('data-href')).show();
    });

});

app.doLogin = function() {
	var permanentStorage = window.localStorage;
    var email = document.getElementById('email').value;
    var password = document.getElementById('password').value;

    app.timeLastSubmit = new Date().getTime() / 1000;
	permanentStorage.setItem("email", email);
	permanentStorage.setItem("password", password);
    app.checkConnection();
    var tempData = {
        email: email,
        password: password,
        device: deviceInfo
    };
    $.ajax(app.SERVER_LOGIN_URL, {
        type: "POST",
        data: JSON.stringify(tempData),
        success: function(response) {
            app.serverSuccess(response);
        },
        error: function(request, errorType, errorMessage) {
            app.serverError(request, errorType, errorMessage);
        }
    });
	
	console.log(permanentStorage);

};
app.serverSuccess = function(response) {
	var permanentStorage = window.localStorage;
    response = JSON.parse(response);
	console.log(response);
    if (response.status == 200)
    {
        
		permanentStorage.setItem("auth", response.auth);
		auth = response.auth;
		
		$('#logout-button').show();
		$('#login-button').hide();
		$("#settingsPage").hide();
		$("#trackingPage").show();
		
        console.log("Login Success \n Auth : " + auth);
		
    }
    else
    {
		permanentStorage.removeItem("auth");
		permanentStorage.removeItem("email");
		permanentStorage.removeItem("password");
    }
};
app.serverError = function(request, errorType, errorMessage) {
	alert("Cannot reach server, Please try again in a few minutes.");
	permanentStorage.removeItem("auth");
	permanentStorage.removeItem("email");
	permanentStorage.removeItem("password");
    console.log(errorMessage);
};

function onPause() {
    // Handle the pause event
//    alert("In onPause function");
}

function showNotification()
{
    window.plugin.notification.local.add({id: "11111", title: "Coach Click Tracking App", message: 'Tracking In Progress', ongoing: true});
}
function cancelNotification()
{
    window.plugin.notification.local.cancel("11111", function() {
        console.log("Notification Closed");
    });
}