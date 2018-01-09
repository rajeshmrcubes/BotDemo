var datendTime = require('./DateAndTime')
var sendMsg = require('./SendMessage')
var Inprong = require('./addToInProg')
module.exports={
showTransWithDateRange: function showTransWithDateRange(PSId){
      console.log(datendTime.getToDateAndTime()+ " showTransWithDateRange :: called with PSId: %s", PSId)
      Inprong.addToInProgTran(PSId, "DT_RNG")
      var messageData = {
        "recipient":{
            "id":PSId
        },
        "message":{
            "text":"कृपया देय तिथि प्रदान करें "
        }
      }
      sendMsg.sendRequest(PSId,messageData)
      console.log(datendTime.getToDateAndTime()+ " showTransWithDateRange sent replies to recipient %s", PSId);
    }
}
