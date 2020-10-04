// this is Benjamin's code that he posted in Slack, I am starting with his as an example as I am completely lost:
// We want to be able to schedule events in the future and look at past events,
// so currentUIDate tracks which date we're looking at on the screen
var currentUIDate=moment();
var hourlyForecast=[];
var startTime=9;
var endTime=17; // Only display hours between 9 and 5pm.
var lat;
var long;
var DISABLE_API=false;
const MAX_API_CALLS=5000;   // I have to ay $.001 every time we make an API call, so I just don't want it to get out of hand, you know?

$("body").ready(init);
// _-='``'=-__-='``'=-__-='``'=-__-='``'=-__-='``'=-__-='``'=-_
// _-=                                                       -_
// _-=      init()                                           -_
// _-=      Called when <body> has loaded, and also every    -_
// _-=      we change the date in the UI.                    -_
// _-=      We set the main date display, the datepicker (if -_
// _-=      needed), build our calendar UI, and launch the   -_
// _-=      getCurrentLocation(), which then also get the    -_
// _-=      weather data from Dark Skies.                    -_
// _-=                                                       -_
// _-='``'=-__-='``'=-__-='``'=-__-='``'=-__-='``'=-__-='``'=-_
function init(){
    // If we haven't set the datepicker yet, addit now
    if($("#datepicker").hasClass("hasDatepicker")===false)   $( "#datepicker" ).datepicker();

    if(localStorage.getItem("APICalls")>=MAX_API_CALLS) DISABLE_API=true;
    $("#current-date").text(currentUIDate.format("dddd, [the] Do of MMMM, YYYY"));
    setUpBlocks(startTime,endTime,currentUIDate);
    getCurrentLocation();
}

// _-='``'=-__-='``'=-__-='``'=-__-='``'=-__-='``'=-__-='``'=-_
// _-=                                                       -_
// _-=      setUpBlocks()                                    -_
// _-=      Take a stat time, and and end time (in 24-hour   -_
// _-=      format) and makes a timeblock for every hours in -_
// _-=      between.                                         -_
// _-=                                                       -_
// _-='``'=-__-='``'=-__-='``'=-__-='``'=-__-='``'=-__-='``'=-_
function setUpBlocks(start, end, thisDate){
    // console.log(thisDate.format("M"));
    for(var i=start;i<=end;i++){ 
        var timeOfDay=i;  
        var displayTime=timeOfDay;
        var suff="<span class='time-suffix'>a.m.</span>";
        if(displayTime>12){
            displayTime-=12;
            suff="<span class='time-suffix'>p.m.</span>";
        }
        if(displayTime===12) suff="<span class='time-suffix'>p.m.</span>";

        // The id will be set to the time of day, 24-hour time

        // But the time will be displayed in 12-hour time
        displayTime=displayTime.toString()+":00 "+suff;
        // $("#displayTime-block-section").append(newTimeBlock(displayTime, timeOfDay, thisDate).attr("id", timeOfDay));
        $("#time-block-section").append(newTimeBlock(displayTime, timeOfDay, thisDate));
        populateEventText(timeOfDay, thisDate);
    }
}

// _-='``'=-__-='``'=-__-='``'=-__-='``'=-__-='``'=-__-='``'=-_
// _-=                                                       -_
// _-=      populateEventText()                              -_
// _-=      Check to see if there's an event stored for this -_
// _-=      time-block, and add it if there is . Note: we    -_
// _-=      can only call this *after* the block has been    -_
// _-=      appended to the <body> somewhere. As I found out -_
// _-=      after spending quite a lot of time being confused-_
// _-=                                                       -_
// _-=      This is also a good place to set the background  -_
// _-=      color based on the current time of day.          -=
// _-=                                                       -_
// _-='``'=-__-='``'=-__-='``'=-__-='``'=-__-='``'=-__-='``'=-_
function populateEventText(timeOfDay, thisDate){
    
    var eventID=timeOfDay+"-"+thisDate.format("YYYYMMDD");  
    // If retrieveEvent does not return false, assign its value to storedEvent and the do the following
    if(storedEvent=retrieveEvent(eventID)){        
        $("#"+eventID).val(storedEvent);
    }
    var currentHour=moment().format("HH");

    if(moment(currentUIDate.format("YYYY-MM-DD")).isBefore(moment(moment().format("YYYY-MM-DD"))))
        $("#"+eventID).addClass("past");
    else if(moment(currentUIDate.format("YYYY-MM-DD")).isAfter(moment(moment().format("YYYY-MM-DD"))))
        $("#"+eventID).addClass("future");
    else{
        if(timeOfDay>currentHour) $("#"+eventID).addClass("future");
        else if(timeOfDay==currentHour) $("#"+eventID).addClass("present");
        else $("#"+eventID).addClass("past");
    }
}
// _-='``'=-__-='``'=-__-='``'=-__-='``'=-__-='``'=-__-='``'=-_
// _-=                                                       -_
// _-=      newTimeBlock()                                   -_
// _-=      Creates a timeblock that displays the displaytime-_
// _-=      and adds a button that passes the timeOfDay and  -_
// _-=      thisDate to addCalendarEvent()                   -_
// _-=                                                       -_
// _-='``'=-__-='``'=-__-='``'=-__-='``'=-__-='``'=-__-='``'=-_
function newTimeBlock(displayTime,timeOfDay, thisDate){
    // console.log(displayTime);
    var eventID=timeOfDay+"-"+thisDate.format("YYYYMMDD"); 
    var newBlock=$("<div>").addClass("row time-block-row");
    newBlock.append(($("<div>")).addClass("col-2 time-of-day"));
    newBlock.find('.time-of-day').append($("<div>").addClass("hour-of-the-day").html(displayTime));
    newBlock.find('.time-of-day').attr("id",timeOfDay+"-column");    
    newBlock.append(($("<div>")).addClass("col-9 event-column"));
    newBlock.find('.event-column').append($("<input>").addClass('event-for-the-day'));
    newBlock.find(".event-for-the-day").attr("id",eventID);
    newBlock.append(($("<div>")).addClass("col-1 save-column"));
    newBlock.find('.save-column').append($("<button>").addClass('save-event').html('<i class="far fa-save"></i>'));
    newBlock.find('.save-event').on("click",function(){addCalendarEvent(eventID)});
    return newBlock;
}
function changeCurrentDate(delta){
    if(delta==="reset") currentUIDate=moment();
    else {
        currentUIDate=currentUIDate.add(delta,'day');
    }
    $("#time-block-section").html("");
    init();
}
// _-='``'=-__-='``'=-__-='``'=-__-='``'=-__-='``'=-__-='``'=-_
// _-=                                                       -_
// _-=      addCalendarEvent()                               -_
// _-=      Writes the context of the corresponding input    -_
// _-=      to local storage, with an appropriate key        -_
// _-=                                                       -_
// _-='``'=-__-='``'=-__-='``'=-__-='``'=-__-='``'=-__-='``'=-_
function addCalendarEvent(eventID){
    newEvent=$("#"+eventID).val();
    localStorage.setItem(eventID, newEvent);
}
// _-='``'=-__-='``'=-__-='``'=-__-='``'=-__-='``'=-__-='``'=-_
// _-=                                                       -_
// _-=      retrieveEvent()                                  -_
// _-=      Returns the value stored in localstorage for     -_
// _-=      the eventID key, or false if nothing is stored   -_
// _-=      there.                                           -_
// _-=                                                       -_
// _-='``'=-__-='``'=-__-='``'=-__-='``'=-__-='``'=-__-='``'=-_
function retrieveEvent(eventID){
    
    var storedEvent=localStorage.getItem(eventID);
    if(storedEvent===null) return false;
    else return storedEvent;
}
// _-='``'=-__-='``'=-__-='``'=-__-='``'=-__-='``'=-__-='``'=-__-='
// _-=                                                         _-='`
// _-=  getCurrentLocation()                                    -='`
// _-=  Retrieves the geolocation data previously stored in the -='`
// _-=  user's computer. If it isn't there, we call             -='`
// _-=  processLocation to add init. If it is there, we can skip-='`
// _-=  that step and go straight to getWeatherData()           -='`
// _-=  **Note that this is a terrible idea for mobile apps!**  -='`
// _-=  But for a desktop-centric userbase, we can assume that  -='`
// _-=  they'll be logging in from the same location every time.-='`    
// _-=                                                         _-='`
// _-='``'=-__-='``'=-__-='``'=-__-='``'=-__-='``'=-__-='``'=-__-='

function getCurrentLocation(){
    lat=localStorage.getItem("lat");
    long=localStorage.getItem("long");
    if(!lat || !long)
        window.navigator.geolocation.getCurrentPosition(processLocation);
    else getWeatherData();
}
function processLocation(pos){

    lat=pos.coords.latitude;
    long=pos.coords.longitude;
    localStorage.setItem("lat",lat);
    localStorage.setItem("long",long);

    getWeatherData();

}
function getWeatherData(){
    if(DISABLE_API) return;
    else{
        var thisDate=currentUIDate.format("YYYY-MM-DD");
        var settings = {
            "async": true,
            "crossDomain": true,
            "url": "https://dark-sky.p.rapidapi.com/"+lat+","+long+","+thisDate+"T00:00:00",
            "method": "GET",
            "headers": {
                "x-rapidapi-host": "dark-sky.p.rapidapi.com",
                "x-rapidapi-key": "909e0f1418msh1a142d822320fdap16d810jsn438f2eea02e2"
            }
        }    
        $.ajax(settings).done(function (response) {
            displayWeatherData(response);
        });
    }
}
function displayWeatherData(response){
    var calls=localStorage.getItem("APICalls");
    calls++;
    localStorage.setItem("APICalls", calls);
    if(calls>=MAX_API_CALLS) DISABLE_API=true;
    _rep=response;
    hourlyForecast=_rep.hourly.data;


    for(var i=startTime-1;i<endTime;i++){
        switch(hourlyForecast[i].icon){
            case "clear-day":{
                fontAwesomeTxt="fas fa-sun";
                break;
            }
            case "partly-cloudy-day":{
                fontAwesomeTxt="fas fa-cloud-sun";
                break;
            }
            case "cloudy":{
                fontAwesomeTxt="fas fa-cloud";
                break;
            }
            case "rain":{
                fontAwesomeTxt="fas fa-umbrella";
                break;
            }
            case "sleet":{
                fontAwesomeTxt="fas fa-cloud-hail";
                break;
            }
            case "snow":{
                fontAwesomeTxt="fas fa-snowflake";
                break;
            }
            case "wind":{
                fontAwesomeTxt="fas fa-wind";
                break;
            }
            case "fog":{
                fontAwesomeTxt="fas fa-fog";
                break;
            }
            default:{
                fontAwesomeTxt="fas fa-question-circle";
                break;
            }
        }           
        var icon=$("<div>").html('<i class="'+fontAwesomeTxt+'"></i>');
        icon.addClass("weather-icon");
        $("#"+(i+1)+"-column").append(icon);
        
    }
}