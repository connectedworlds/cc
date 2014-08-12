batteryLevel = 100;
var gpsData = {};
isTracking = true;
gpsLastPosition = {};
gpsAjaxData = {
//    auth: auth
    gps: {}
};
var gps = {
    GPSWatchId: null,
    gpsErrorCount: 0,
    gatheringTimer: null,
    sendingTimer: null,
    init: function() {
//        gps.initToggleListener();
        gps.start();
    },
    initToggleListener: function() {
    },
    start: function() {
        isTracking = true;
        $("#start-tracking").hide();
        $("#stop-tracking").show();
        showNotification();
        console.log("Tracking Started");

        if (isTracking == false)
        {
            return;
        }
        var gpsOptions = {
            enableHighAccuracy: app.HIGH_GPS_ACCURACY,
            timeout: 1000 * 60 * 4,
            maximumAge: 1 * 1000,
            frequency: getGpsGatheringTime()
        };
        gps.GPSWatchId = navigator.geolocation.watchPosition(onSuccess, onError, gpsOptions);
//        navigator.geolocation.getCurrentPosition(onSuccess,onError, gpsOptions, {enableHighAccuracy: true});
        var gpsGatheringTime = getGpsGatheringTime();
        gps.gatheringTimer = window.setTimeout(gpsGatheringTimeOut, gpsGatheringTime);
        gps.sendingTimer = window.setTimeout(gpsSendingTimeOut, 20 * 1000);
        
    },
    stop: function() {
        isTracking = false;
        $("#stop-tracking").hide();
        $("#start-tracking").show();
        cancelNotification();

        if (gps.sendingTimer) {
            window.clearTimeout(gps.sendingTimer);
        }
        gpsSendingTimeOut();
        console.log("Tracking Stopped");
        if (gps.GPSWatchId)
        {
            navigator.geolocation.clearWatch(gps.GPSWatchId);
        }
        if (gps.gatheringTimer) {
            window.clearTimeout(gps.gatheringTimer);
        }
        if (gps.sendingTimer) {
            window.clearTimeout(gps.sendingTimer);
        }

    }
};



function gpsGatheringTimeOut() {
    var gpsGatheringTime = getGpsGatheringTime();
    gps.gatheringTimer = window.setTimeout(gpsGatheringTimeOut, gpsGatheringTime);
    gatherGpsdata();
}

function getGpsGatheringTime()
{
    return 3 * 1000; //Predefined 10 sec
}

function getGpsSendingtime()
{

    if (batteryLevel > 1) {
        return (20 / batteryLevel) * 100000; // 10sec min time interval to send data to server
    }
    else {
        return 100000000; // infinete when bettery status is less 1%
    }
}

function uploadAmount() {
	
	var networkState = navigator.connection.type;
	var upload = {};
	upload[Connection.UNKNOWN] = 10;
	upload[Connection.ETHERNET] = 30;
	upload[Connection.WIFI] = 30;
	upload[Connection.CELL_2G] = 1;
	upload[Connection.CELL_3G] = 10;
	upload[Connection.CELL_4G] = 30;
	upload[Connection.CELL] = 1;
	upload[Connection.NONE] = 0;
	
	return upload[networkState];
	
}

function gpsSendingTimeOut()
{

    gps.sendingTimer = window.setTimeout(gpsSendingTimeOut, getGpsSendingtime());
    var permanentStorage = window.localStorage;
	var tmpgpsData = permanentStorage.getItem("gpsData");
	var storedAuth = permanentStorage.getItem("auth");
	var gpsAjaxDataToSend = {};
	gpsAjaxDataToSend.gps = {};
	
	
	
	
	// console.log(tmpgpsData);
	if(tmpgpsData === null) {
		console.log("No data stored in local storage");
		return;
	} else {
		var tmpgpsData = JSON.parse(tmpgpsData);
		var keys = Object.keys(tmpgpsData);
		keys = keys.reverse();
		// console.log(keys);
		
		for (i = 0; i < uploadAmount(); i++) {
			var k = keys[i];
			if(k !== null) {
				if(typeof tmpgpsData[k].auth !== 'undefined') {
					var a = tmpgpsData[k].auth;
				} else if (storedAuth !== null) {
					var a = permanentStorage.getItem("auth");
				} else {
					app.doLogin();
				}
				if(typeof gpsAjaxDataToSend.gps[a] === 'undefined') {
					gpsAjaxDataToSend.gps[a] = {};
				}
				gpsAjaxDataToSend.gps[a][k] = tmpgpsData[k];
			}
		}
		
		// console.log(tmpgpsData);
		
		gpsAjaxDataToSend = JSON.stringify(gpsAjaxDataToSend);
		
		$.ajax("http://www.coachclick.co.uk/app/track.php", {
			type: "POST",
			dataType : 'json',
			data: gpsAjaxDataToSend			
		}).done(function(response) {
			// console.log(response.storedgps);
			for (i = 0; i < response.storedgps.length; i++) {
				delete (tmpgpsData[response.storedgps[i]]);
			}
			permanentStorage.setItem("gpsData", JSON.stringify(tmpgpsData));
			
		}).always(function(response) {
			// console.log("always : ",response);
			// console.log(tmpgpsData);
		}).fail(function(response) {
			// console.log("always : ",response);
		});
		
		console.log(keys.length);
		$('#gpsleft').text(keys.length);
	}
}

function onSuccess(position) {
	// console.log(position);
    gpsLastPosition = {};
    gpsLastPosition["auth"] = auth;
    gpsLastPosition["lat"] = position.coords.latitude;
    gpsLastPosition["lng"] = position.coords.longitude;
    gpsLastPosition["alt"] = position.coords.altitude;
    gpsLastPosition["speed"] = position.coords.speed;
    gpsLastPosition["heading"] = position.coords.heading;
    gpsLastPosition["accuracy"] = position.coords.accuracy;
    gpsLastPosition["acc-x"] = position.coords.accuracy;
    gpsLastPosition["acc-y"] = position.coords.accuracy;
    gpsLastPosition["acc-z"] = position.coords.altitudeAccuracy;
    gpsLastPosition["batt"] = batteryLevel;
    gpsLastPosition["gpstimestamp"] = position.timestamp;
    // console.log("WatchPosition got data: " + JSON.stringify(gpsLastPosition));
    console.log("WatchPosition got data: ");
}

function gatherGpsdata() {
	var permanentStorage = window.localStorage;
	
	var tmpgpsData = permanentStorage.getItem("gpsData");
	if(tmpgpsData !== null) {
		gpsData = JSON.parse(tmpgpsData);
	}
    gpsData[(Math.round(new Date().getTime() / 1000)).toString()] = gpsLastPosition;
    permanentStorage.setItem("gpsData", JSON.stringify(gpsData));
	
    // console.log(permanentStorage.getItem("gpsData"));
}

function onError(error) {
    alert("Error getting gps data. Please restart emulator.");
    console.log("GPS onError. Please restart emulator.");
    isTracking = false;
    $("#stop-tracking").hide();
    $("#start-tracking").show();
    $("#logout-button").show();
    cancelNotification();
    //        sendDataBeforeStopTracking();
    // Clear old timer.
    if (gps.sendingTimer) {
        window.clearTimeout(gps.sendingTimer);
    }
//    gpsSendingTimeOut();
    console.log("Tracking Stoped");
    if (gps.GPSWatchId)
    {
        navigator.geolocation.clearWatch(gps.GPSWatchId);
    }
    if (gps.gatheringTimer) {
        window.clearTimeout(gps.gatheringTimer);
    }
    // Clear new timer.
    if (gps.sendingTimer) {
        window.clearTimeout(gps.sendingTimer);
    }

//    alert(JSON.stringify(error));
//    navigator.geolocation.clearWatch(gps.GPSWatchId);
}

function onBatteryStatus(info) {
    batteryLevel = info.level;
    console.log("Level: " + info.level + " isPlugged: " + info.isPlugged);
    if (gps.sendingTimer) {
        window.clearTimeout(gps.sendingTimer);
    }
    gps.sendingTimer = window.setTimeout(gpsSendingTimeOut, getGpsSendingtime());
	
	if(info.isPlugged) {
		$('#batterylevel').text('plugged');
	} else {
		$('#batterylevel').text(batteryLevel+'%');
	}
	console.log(batteryLevel);
	
}

//function sendDataBeforeStopTracking()
//{
//
////    alert("Sending data : " + JSON.stringify(gpsAjaxData));
//    console.log("Sending Data Before Stop Tracking : " + JSON.stringify(gpsAjaxData));
//    $.ajax("http://www.coachclick.co.uk/app/track.php", {
//        type: "POST",
////        data: JSON.stringify(gpsAjaxData),
//        data: gpsAjaxData,
//        success: function(response) {
////            alert("response : " + response);
//            console.log("response : " + response);
//            response = JSON.parse(response);
//            console.log("response : " + response);
//            for (i = 0; i < response.length; i++) {
//                delete gpsAjaxData[response[i]];
//            }
//            console.log("gpsajaxdata: response : " + JSON.stringify(gpsAjaxData));
//        },
//        error: function(request, errorType, errorMessage) {
////            alert(JSON.stringify(errorMessage));
//            console.log("Error");
//        }
//    });
//}