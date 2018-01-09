var callBatchSendAPI = require('./callBatchSendAPI')
module.exports={
dnldAnyPeriodStmt: function dnldAnyPeriodStmt(PSId, text){
  console.log("dnldAnyPeriodStmt :: called with PSId: %s and message: %s", PSId, text)

  var messageDataArr = Array()
  var messageData1 = {
    "recipient":{
        "id":PSId
    },
    "message":{
      "text":text
    }
  }
  messageDataArr[0] = messageData1

  var messageData2 = {
    "recipient":{
        "id":PSId
    },
    "message":{
      "attachment":{
        "type":"file",
        "payload":{
          "is_reusable": false,
          "url":"https://peaceful-springs-82345.herokuapp.com/Statement.pdf"
        }
      }
    }
  }
  messageDataArr[1] = messageData2

  callBatchSendAPI.callBatchSendAPI(messageDataArr)

  //Delete transactions data
  var findFunction = function(element){
    if(element.key == PSId) return true
  }
  var multiArr = JSON.parse(process.env.INPROGTRAN)
  var usrArrItm = multiArr.PSId.find(findFunction)
  usrArrItm.tranName = undefined
  usrArrItm.values = undefined
  process.env.INPROGTRAN = JSON.stringify(multiArr)
  console.log("dnldAnyPeriodStmt sent replies to recipient %s", PSId);
}
}
