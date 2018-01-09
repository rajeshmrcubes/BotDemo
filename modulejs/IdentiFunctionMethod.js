var datendTime = require('./DateAndTime')
var verification = require('./verifiedList')
var sendRequest = require('./SendMessage')
module.exports={
  chooseIdentifucationMethod: function chooseIdentifucationMethod(PSId){
    console.log(datendTime.getToDateAndTime()+" chooseIdentifucationMethod ");
        try{
          var verifiedFlag = verification.checkIfVerified(PSId)
          console.log("verifiedFlag "+(verifiedFlag));
        }catch(Error){
          console.log(datendTime.getToDateAndTime()+" chooseIdentifucationMethod :: Error while calling checkIfVerified: %s", JSON.stringify(Error))
        }
      if(!verifiedFlag){
          console.log(datendTime.getToDateAndTime()+"  verified flag value is "+verifiedFlag);
        console.log(datendTime.getToDateAndTime()+"  verified flag value is "+verifiedFlag);
      var messageData = {
        "recipient":{
          "id":PSId
        },
       "message":{
      "attachment":{
        "type":"template",
        "payload":{
          "template_type":"button",
          "text":process.env.not_linked+"\n"+process.env.to_be_linked +"\n"+"\n"+
                      process.env.option1+"\n"+
                      process.env.option2+"\n\n"+
                      process.env.continue+"\n",
          "buttons":[
            {
                  "type":"web_url",
                  "url":"https://64f8c16d.ngrok.io?PSId="+PSId,
                  "title":"विकल्प 1",
                  "webview_height_ratio":"tall",
                  "webview_share_button":"show"
            },
            {
              "type":"web_url",
              "url":"http://localhost:3030/public?PSId="+PSId,
              "title":"विकल्प 2",
              "webview_height_ratio":"tall",
              "webview_share_button":"show"
              }
            ]
          }
        }
      }
    }
        console.log("XXXXXXXXXXXXX "+JSON.stringify(messageData));
          sendRequest.sendRequest(PSId,messageData);
      }
      return verifiedFlag;
  }

}
