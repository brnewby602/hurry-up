var Keys = require('../api_keys.js');
var Event = require('../app/models/event.js');
//require the Twilio module and create a REST client
var client = require('twilio')(Keys.twilioAccountSid, Keys.twilioAuthToken);

var displayTime = function(time) {
  var dateString = time.toString();
  var hours = dateString.substring(16, 18);
  var postfix;
  if (Number(hours) > 12) {
    postfix = 'PM';
    hours = hours - 12;
  } else {
    postfix = 'AM';
  }
  var minutes = dateString.substring(19, 21);
  return hours + ':' + minutes + ' ' + postfix;
};

var sendText = function(userPhoneNumber, event, timeoutTime, message) {
  var eventTime = displayTime(event.eventTime);

  //send twilio text
  client.sendMessage({
    to: userPhoneNumber,  // Any number Twilio can deliver to
    from: Keys.twilioPhoneNumber, // ten digits, with a leading '+' sign and no dashes,
    // for example: '+14151234567' - this is a number you bought 
    // from Twilio and set up in your server/api_keys.js file (which is .gitignored)
    body: message // body of the SMS message
  }, function(err, responseData) { //this function is executed when a response is received from Twilio
    if (err) {
      console.log('Error sending Twilio text', err);
    } else {
      console.log(responseData.from); // outputs "+14506667788"
      console.log(responseData.body); // outputs "word to your mother."
    }
  });

  //delete event from database after it starts
  setTimeout(function() {
    new Event({id: event.id})
      .destroy()
      .then(function(model) {
        console.log('Event has been destroyed', model);
      })
      .catch(function(err) {
        console.log(err);
      });
  }, timeoutTime);
};

module.exports = sendText;
