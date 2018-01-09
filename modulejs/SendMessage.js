var datendTime = require('./DateAndTime')
const request = require('request')
const url1 = 'https://graph.facebook.com/v2.6/me/messages';
var token =process.env.FB_token
module.exports={
  sendRequest: function sendRequest(sender,messageData){
        console.log(datendTime.getToDateAndTime()+" called sendRequest");
        request({
             	    url: url1,
             	    qs: {access_token:token},
             	    method: 'POST',
             	    json: messageData
                 }, function(error, response, body) {
             	    if (error) {
                    console.log("something went wrong");
             		    console.log('Error sending messages: ', error)
             	    } else if (response.body.error) {
             		    console.log('Error: ', response.body.error)
             	    }
                 })
  }
}
