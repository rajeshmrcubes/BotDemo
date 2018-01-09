var datendTime = require('./DateAndTime')
var sendMsg = require('./SendMessage')
module.exports={
showTransWithDateAndAmt: function showTransWithDateAndAmt(PSId){
      console.log(datendTime.getToDateAndTime()+" showTransWithDateAndAmt :: called with PSId: %s", PSId)
      var messageData = {
        "recipient":{
            "id":PSId
        },
        "message":{
            "text":"मैं यह सुविधा लाने की कोशिश कर रहा हूं ... उस पर काम चल रहा हूं"
        }
      }
      sendMsg.sendRequest(PSId,messageData)
      console.log(datendTime.getToDateAndTime()+" showTransWithDateAndAmt sent replies to recipient %s", PSId);
    }
}
