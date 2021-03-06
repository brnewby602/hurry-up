var request = require('request');
var API_KEYS = require('../api_keys.js');
var TwilioSend = require('./twilio-api-call.js');
var Event = require('../app/models/event.js');

// note: in-memory storage ? write to db?  ...for clearing timeouts
var events = {};

var alreadySentTwilio = function(event) {
  new Event({ id: event.id })
    .fetch()
    .then(function(event) {
      event.set('twilioSent', 'true');
      event.save()
        .then(function(updatedEvent) {
          console.log('Change twilioSent for event: ', updatedEvent);
        })
        .catch(function(err) {
          console.log('Error updated twilioSent for event ', err);
        });
    });
};

var googleWorker = function(event, origin, phoneNumber) {
  // TODO: parse eventtime and earlyarrival to manipulate milliseconds // validate user form entry
  // var arrivalTime = event.eventTime (convert to UTC sec) - event.earlyArrival (convert to UTC sec);
  var arrivalTime = Date.parse(event.eventTime) / 1000 - event.earlyArrival;
  var currentTime = Date.now() / 1000;     //seconds

    //split into each field
  var originLat = origin.latitude;     //37.773972
  var originLong = origin.longitude;    //-122.431297
  //'1118FolsomStreet,SanFrancisco,CA' Doesnt actually need spaces removed, but regex practice is nice;
  var eventAddress = event.address.replace(/\s/g, '') + event.city.replace(/\s/g, '') + event.state;
  var travelMode = event.mode.toLowerCase();          //'driving';

  // Get routes time duration from Google API
  var apiRequest = 'https://maps.googleapis.com/maps/api/directions/json?' +
    'origin=' + originLat + ',' + originLong +
    '&destination=' + eventAddress +
    '&mode=' + travelMode +
    '&key=' + API_KEYS.googleAPI;

  request(apiRequest, function(err, res, body) {
    var parsedBody = JSON.parse(body);
    if (err || !parsedBody.routes[0]) { console.log('There was an error with Google API', err); }
    else {
      var duration = parsedBody.routes[0].legs[0].duration.value;
      var timeoutDuration = (arrivalTime - duration) - currentTime;
      var textMessage = '';

      if (timeoutDuration < 0) {
        var late =  Math.ceil((timeoutDuration * -1) / 60);
        textMessage = 'You are already ' + late + ' minute' + ((late === 1) ? '' : 's') + ' late! Leave now to get to ' + event.eventName;
        timeoutDuration = 0;
      } else {
        textMessage = 'Hurry Up! Leave now to get to ' + event.eventName + ' by ' + eventTime;
      }
      if (events[event.id]) {
        clearTimeout(events[event.id]);
      }
      events[event.id] = setTimeout(function() {
        TwilioSend(phoneNumber, event, duration + event.earlyArrival, textMessage);
        alreadySentTwilio(event);
      }, timeoutDuration * 1000);
    }
  });
};

module.exports = googleWorker;


