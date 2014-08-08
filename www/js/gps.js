betteryLevel = 100;
isTracking = true;
gpsLastPositoin = {};
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
        $("#logout-button").hide();
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
        window.addEventListener("batterystatus", onBatteryStatus, false);
    },
    stop: function() {
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
        gpsSendingTimeOut();
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

    }
};



function gpsGatheringTimeOut() {
    var gpsGatheringTime = getGpsGatheringTime();
    gps.gatheringTimer = window.setTimeout(gpsGatheringTimeOut, gpsGatheringTime);
    gatherGpsdata();
}

function getGpsGatheringTime()
{
    return 10 * 1000; //Predefined 10 sec
}

function getGpsSendingtime()
{
//    return 12000; 
    if (betteryLevel > 1) {
        return (20 / betteryLevel) * 100000; // 10sec min time interval to send data to server
    }
    else {
        return 100000000; // infinete when bettery status is less 1%
    }
}

function gpsSendingTimeOut()
{
//    if (isTracking == false)
//    {
//        return;
//    }
//    alert('1');
    gps.sendingTimer = window.setTimeout(gpsSendingTimeOut, getGpsSendingtime());
    var gpsAjaxDataToSend = {};
    var permanentStorage = window.localStorage;
//    alert('2');
    if (permanentStorage.gpsData)
    {
//        alert('3');
        gpsAjaxDataToSend = permanentStorage.gpsData;
//        alert('4');
        if (gpsAjaxDataToSend == "")
        {
//            alert("No data stored in local storage");
            console.log("No data stored in local storage");
            return;
        }
    }
    else
    {
//        alert('5');
//        alert("No data stored in local storage");
        console.log("No data stored in local storage");
//        if (gps.sendingTimer)
//        {
//            window.clearTimeout(gps.sendingTimer);
//        }
        return;
    }
//    alert('6');

//    alert("Sending data : " + JSON.stringify(gpsAjaxData));
    console.log("Sending data : " + JSON.stringify(gpsAjaxData));
    var op = '<li style="color:red;">Data sent</li>';
    $("#gpsGatheringLog").append(op);
//    $("#gpsSendingLog").html(JSON.stringify(gpsAjaxData));
    $.ajax("http://www.coachclick.co.uk/app/track.php", {
        type: "POST",
//        data: JSON.stringify(gpsAjaxData),
        data: gpsAjaxDataToSend,
        success: function(response) {
//            alert("response : " + response);
            console.log("response : " + response);
            response = JSON.parse(response);
//            console.log("response : " + response);
            for (i = 0; i < response.storedgps.length; i++) {
                delete (gpsAjaxData.gps[response.storedgps[i]]);
            }
            console.log("gpsajaxdata: response : " + JSON.stringify(gpsAjaxData));
            var permanentStorage = window.localStorage;
            permanentStorage.setItem("gpsData", JSON.stringify(gpsAjaxData));
        },
        error: function(request, errorType, errorMessage) {
//            alert(JSON.stringify(errorMessage));
//            alert("Error");
            console.log("Error");
        }
    });
}

function onSuccess(position) {
    gpsLastPositoin = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        alt: position.coords.altitude
    };
    gpsLastPositoin["acc-x"] = position.coords.accuracy;
    gpsLastPositoin["acc-y"] = position.coords.accuracy;
    gpsLastPositoin["acc-z"] = position.coords.altitudeAccuracy;
    gpsLastPositoin["batt"] = betteryLevel;
    gpsLastPositoin["gpstimestamp"] = position.timestamp;
    console.log("WatchPosition got data: " + JSON.stringify(gpsLastPositoin));
}

function gatherGpsdata() {

//    delete gpsAjaxData["auth"]; //to put auth at end, first delete it and then append it.
    gpsAjaxData["auth"] = auth;
    var tempGpsData = gpsAjaxData.gps;
    delete gpsAjaxData.gps;
    gpsAjaxData.gps = tempGpsData;
    gpsAjaxData.gps[ (Math.round(new Date().getTime() / 1000)).toString() ] = gpsLastPositoin;
    var permanentStorage = window.localStorage;
    permanentStorage.setItem("gpsData", JSON.stringify(gpsAjaxData));
    var op = '<li>' + (Math.round(new Date().getTime() / 1000)).toString() + ' : Data gathered</li>';
//    op += "<br>" + JSON.stringify(gpsAjaxData) + "<br></li>";
    $("#gpsGatheringLog").append(op);
    console.log("Gathering data: \n" +  JSON.stringify(gpsAjaxData));
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
    // Handle the online event
    //alert("Level: " + info.level + " isPlugged: " + info.isPlugged);
    if (isTracking == false)
    {
        return;
    }
    betteryLevel = info.level;
    console.log("Level: " + info.level + " isPlugged: " + info.isPlugged);
    if (gps.sendingTimer) {
        window.clearTimeout(gps.sendingTimer);
    }
    gps.sendingTimer = window.setTimeout(gpsSendingTimeOut, getGpsSendingtime());
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