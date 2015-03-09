deviceInfo = {
    name: null,
    cordova: null,
    platform: null,
    uuid: null,
    version: null,
    model: null
};
var isTracking;
var auth;
var permanentStorage = window.localStorage;	
var connectionSpeed = '';
var pc = false;
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
        this.initView();
		checkConnection();
		checkUnsent();
        app.timeLastSubmit = (new Date().getTime() / 1000) - 60;
		// console.log(permanentStorage);
    },
    bindEvents: function() {
       
    },
    initFastClick: function() {
        window.addEventListener('load', function() {
            FastClick.attach(document.body);
        }, false);
    },
    initUserId: function() {
        this.deviceId = permanentStorage.getItem("deviceId");
        if (this.deviceId === null) {
            permanentStorage.setItem("deviceId", Math.floor((Math.random() * 100000)));
            this.deviceId = permanentStorage.getItem("deviceId");
        }
    },
    initView: function() {
		auth = permanentStorage.getItem("auth");
        if (permanentStorage.getItem("loggedin") == "true") {
            $('#email').val(permanentStorage.getItem("email"));
			$('#password').val(permanentStorage.getItem("password"));
			 $('#loggedout').show();
             $('#login-div').hide();
        } else {
			$("#trackingPage").hide();
			$("#settingsPage").show();
			auth = '';
		}
		// console.log(auth);
		// permanentStorage.removeItem("gpsData")
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

function checkConnection() {

	if(navigator.platform !== 'Win32') {
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

		connectionSpeed = states[networkState];
		$('#connectionType').text(states[networkState]);
		
	} else {
		pc = true;
		$('#connectionType').text('PC');
		connectionSpeed = 'Ethernet';
	}
	
	console.log('Connection '+connectionSpeed);
	
}

function checkUnsent() {
	$('#syncnow').hide();
	var tmpgpsData = permanentStorage.getItem("gpsData");
	tmpgpsData = JSON.parse(tmpgpsData);
	var synctext = 'Synced';
	var tosync = 0;
	if(typeof tmpgpsData === 'object' && tmpgpsData !== null) {
		var keys = Object.keys(tmpgpsData);
		
		if(keys.length > 0) {
			synctext = keys.length;
			tosync = keys.length;
			if(isTracking != true) {
				$('#syncnow').show();
			}
		}
	}
	$('#gpsUnsent').text(synctext);
	console.log('Unsent '+synctext);
	return tosync;
}

function onDeviceReady() {
    navigator.splashscreen.hide();
    checkConnection();
	checkUnsent();
    deviceInfo.name = device.name;
    deviceInfo.cordova = device.cordova;
    deviceInfo.platform = device.platform;
    deviceInfo.uuid = device.uuid;
    deviceInfo.model = device.model;
    deviceInfo.version = device.version;
	window.addEventListener("batterystatus", onBatteryStatus, false);
}

document.addEventListener('deviceready', onDeviceReady, false);

$(function() {


    $("#syncnow").click(function() {
        gps.sync();
		$("#syncnow").hide();
		$('.icon-loop').addClass('loader');
    });
	
	$("#start-tracking").click(function() {
		app.doLogin();
        gps.init();
        window.plugin.backgroundMode.setDefaults({ text:'Tracking...'});
        window.plugin.backgroundMode.enable();
        window.plugin.backgroundMode.configure({
            silent: true
        })
    });
	
	$("#stop-tracking").click(function() {
        gps.stop();
        window.plugin.backgroundMode.disable();
    });
	
    $("#login-button").click(function() {
        app.forcedSubmit = true; // forces pop-up
		$( "#login-button .ui-btn-text" ).text("Please wait...."); 
		console.log("Login Button Clicked");
        app.doLogin();
    });

    $("#logout-button").click(function() {
        $('#loggedout').hide();
        $('#login-div').show();
		permanentStorage.removeItem("email");
		permanentStorage.removeItem("password");
		permanentStorage.removeItem("auth");
		permanentStorage.removeItem("loggedin");
		console.log("Logout Button Clicked");
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
	var result;
    app.timeLastSubmit = new Date().getTime() / 1000;
	permanentStorage.setItem("email", email);
	permanentStorage.setItem("password", password);
    checkConnection();
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
			console.log("Login AJAX Success" + response);
			result = true;
        },
        error: function(request, errorType, errorMessage) {
            app.serverError(request, errorType, errorMessage);
			console.log("Login AJAX Failed" + response);
			result = false;
        }
    });
	console.log(app.SERVER_LOGIN_URL);
	console.log(JSON.stringify(tempData));
	console.log(permanentStorage);
	return result;
};

app.serverSuccess = function(response) {
    response = JSON.parse(response);
	console.log(response);
    if (response.status == 200)
    {
        
		permanentStorage.setItem("auth", response.auth);
		permanentStorage.setItem("loggedin", true);
		auth = response.auth;
		
		// $('#logout-button').show();
		$("#login-button").text('Login');
		//$('#login-button').hide();
        $('#loggedout').show();
        $('#login-div').hide();
		$("#settingsPage").hide();
		$("#trackingPage").show();
        $("#loginIncorrect").hide();
        $("#loggedinemail").text(email);
		
        console.log("Login Success \n Auth : " + auth);
		
    }
    else
    {
		permanentStorage.removeItem("auth");
		permanentStorage.removeItem("email");
		permanentStorage.removeItem("loggedin");
		permanentStorage.removeItem("password");
		$("#trackingPage").hide();
		$("#settingsPage").show();
		auth = '';
		// alert(response.message);
		//$('#logout-button').hide();
		$( "#login-button .ui-btn-text" ).text("Login"); 
		//$('#login-button').show();
        $('#loggedout').hide();
        $('#login-div').show();
		$( "#loginIncorrect" ).text(response.message).popup( "open" );
    }
};
app.serverError = function(request, errorType, errorMessage) {
	$( "#loginIncorrect" ).text('Could not contact server, if you are sure your details are correct. Start tracking and we will keep trying to log you in.').popup( "open" );
	$("#login-button  .ui-btn-text").text('Login');
	// $('#login-button').show();
	// $('#logout-button').hide();
	// $("#settingsPage").hide();
	// $("#trackingPage").show();
    console.log(errorType);
    console.log(errorMessage);
};

function showNotification()
{
    if(!pc){
		window.plugin.notification.local.add({id: "11111", title: "Coach Click Tracking App", message: 'Tracking In Progress', ongoing: true});
	}
}
function cancelNotification()
{
	if(!pc){
		window.plugin.notification.local.cancel("11111", function() {
			console.log("Notification Closed");
		});
	}
}

if(navigator.platform !== 'Win32') {		
	console.log = function(message) {
		$('#debugDiv').prepend('<p data-log="'+$("#debugDiv p").length+'">' + message + '</p>');
		if($("#debugDiv p").length > 10){
			$("#debugDiv p")[($("#debugDiv p").length)-1].remove();
		}
	};
	console.error = console.debug = console.info =  console.log
}