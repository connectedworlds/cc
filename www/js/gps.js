batteryLevel = 100;
var gpsData = {};
gpsLastPosition = {};
gpsAjaxData = {
    gps: {}
};
var doSync = false;
var gps = {
    GPSWatchId: null,
    gpsErrorCount: 0,
    gatheringTimer: null,
    sendingTimer: null,
    init: function() {
        gps.start();
    },
    initToggleListener: function() {
    },
    sync: function() {
        isTracking = false;
        console.log("Sync Started");
		gpsSendingTimeOut(true);
    },
	start: function() {
        isTracking = true;
        $("#start-tracking").hide();
        $("#stop-tracking").show();
        showNotification();
        console.log("Tracking Started");

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
        gps.sendingTimer = window.setTimeout(gpsSendingTimeOut(false), 20 * 1000);
        
    },
    stop: function() {
        isTracking = false;
        $("#stop-tracking").hide();
        $("#start-tracking").show();
        cancelNotification();

        if (gps.sendingTimer) {
            window.clearTimeout(gps.sendingTimer);
        }
        gpsSendingTimeOut(doSync);
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
	console.log('getGpsGatheringTime' + '10000');
    return 10000; 
}

function getGpsSendingtime()
{
    if (batteryLevel = 100) {
        return 4 * 1000; 
    }
    else if (batteryLevel > 1) {
        return (20 / batteryLevel) * 100000; // 10sec min time interval to send data to server
    }
    else {
        return 100000000; // infinete when bettery status is less 1%
    }
}

function uploadAmount() {
	
	var result;
	if(!pc){
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
		result = upload[networkState];
	} else {
		result =  30;
	}
	
	console.log('uploadAmount' + result);
	return result;
	
	
}

function gpsSendingTimeOut(doSync)
{
	var tmpgpsData = permanentStorage.getItem("gpsData");
	var storedAuth = permanentStorage.getItem("auth");
	var gpsAjaxDataToSend = {};
	gpsAjaxDataToSend.gps = {};
	$('.icon-loop').addClass('loader');
	console.log('Sending Data');
	if(tmpgpsData === null) {
		console.log("No data stored in local storage");
		return;
	} else {
		var tmpgpsData = JSON.parse(tmpgpsData);
		var keys = Object.keys(tmpgpsData);
		keys = keys.reverse();
		
		var j = uploadAmount();
		if(keys.length < j) {
			j = keys.length;
		}
		
		
		
		for (i = 0; i < j; i++) {
			var k = keys[i];
			if(k !== 'undefined' && k !== null) {
				if(typeof tmpgpsData[k].auth !== 'undefined' && tmpgpsData[k].auth !== null && tmpgpsData[k].auth !== '') {
					var a = tmpgpsData[k].auth;
					//console.log('-'+tmpgpsData[k].auth+'-');
				} else if (storedAuth !== null) {
					var a = storedAuth;
					console.log("using stored auth");
				} else {
					console.log("login before send");
					app.doLogin();
					if(permanentStorage.getItem("auth") === null) {
						console.log("login failed");
						return;
					};
					var a = permanentStorage.getItem("auth");
					
				}
				if(typeof gpsAjaxDataToSend.gps[a] === 'undefined') {
					gpsAjaxDataToSend.gps[a] = {};
				}
				gpsAjaxDataToSend.gps[a][k] = tmpgpsData[k];
			}
		}
		
		gpsAjaxDataToSend = JSON.stringify(gpsAjaxDataToSend);
		console.log(gpsAjaxDataToSend);
		var gst = getGpsSendingtime();
		
		$.ajax("http://www.coachclick.co.uk/app/track.php", {
			type: "POST",
			dataType : 'json',
			data: gpsAjaxDataToSend			
		}).done(function(response) {
			console.log('done - '+gst);
			for (i = 0; i < response.storedgps.length; i++) {
				delete (tmpgpsData[response.storedgps[i]]);
			}
			permanentStorage.setItem("gpsData", JSON.stringify(tmpgpsData));				
		}).always(function(response) {
			checkConnection();
			var toSync = checkUnsent();
			
			if(doSync === true && toSync === 0 && isTracking == false) {
				console.log('Sync Complete');
			} else {
				gps.sendingTimer = window.setTimeout(function(){ gpsSendingTimeOut(doSync)}, gst);
				console.log('Upload Complete - '+gst);
			}
			$('.icon-loop').removeClass('loader');
			// console.log(tmpgpsData);
		}).fail(function(response) {
			console.log("send failed : ",response);
			gps.sendingTimer = window.setTimeout(function(){ gpsSendingTimeOut(doSync)}, gst);
		});
		return;
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
}

function gatherGpsdata() {	
	var tmpgpsData = permanentStorage.getItem("gpsData");
	if(tmpgpsData !== null) {
		gpsData = JSON.parse(tmpgpsData);
	}
    gpsData[(Math.round(new Date().getTime() / 1000)).toString()] = gpsLastPosition;
    permanentStorage.setItem("gpsData", JSON.stringify(gpsData));
	
	checkConnection();
	checkUnsent();
    console.log('GPS Gathered');
}

function onError(error) {
    alert("GPS onError. Is your GPS turned on? Please double check and click 'Start Tracking' again");
    isTracking = false;
    $("#stop-tracking").hide();
    $("#start-tracking").show();
    $("#logout-button").show();
    cancelNotification();
    // Clear old timer.
    if (gps.sendingTimer) {
        window.clearTimeout(gps.sendingTimer);
    }
//    gpsSendingTimeOut();
    console.log("Tracking Stopped");
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
}

function onBatteryStatus(info) {
    batteryLevel = info.level;
    console.log("Level: " + info.level + " isPlugged: " + info.isPlugged);
	if(info.isPlugged) {
		$('#batterylevel').text('AC');
	} else {
		$('#batterylevel').text(batteryLevel+'%');
	}	
}