var datendTime = require('./DateAndTime')
const accessToken = require('./../config');
const {Wit} = require('node-wit');

module.exports={
callDialogFlow: async function callDialogFlow(PSId, messageText){
  
  const client = new Wit(accessToken);
    //Send message to witai
    options.sessionId = PSId;
    console.log(datendTime.getToDateAndTime()+" callDialogFlow :: options object being sent is: %s", JSON.stringify(options))
      console.log(datendTime.getToDateAndTime()+" callDialogFlow :: message Text being sent is: %s", messageText)
      let witAiRequest = client.message(messageText,options);
      return   witAiRequest.then(function (response){
        return  response;
      });


}
}
