var date = require('./DateAndTime')
var sendRequest = require('./SendMessage')
var callBatchSendAPI = require('./callBatchSendAPI')
var Inprong = require('./addToInProg')
module.exports={
processAcctOpening: function processAcctOpening(PSId){
  console.log(date.getToDateAndTime()+" processAcctOpening :: called with PSId: %s", PSId)
  Inprong.addToInProgTran(PSId, "OPEN_CASA")
  console.log(date.getToDateAndTime()+" INPROGTRAN "+process.env.INPROGTRAN );
  var findFunction = function(element){
  if(element.key == PSId) return true
  }
  var multiArr = JSON.parse(process.env.INPROGTRAN)
  var usrArrItm = multiArr.PSId.find(findFunction)
  console.log(date.getToDateAndTime()+" amount is "+JSON.stringify(usrArrItm));
  var messageDataArr = Array()
  var messageData1 = {
    "recipient":{
        "id":PSId
    },
    "message":{
      "text":"to open account in MRC Bank."
    }
  }
  messageDataArr[0] = messageData1
  var messageData2 = {
    "recipient":{
        "id":PSId
    },
    "message":{
      "attachment":{
        "type":"template",
        "payload":{
          "template_type":"button",
          "text":"please proceed with required docs",
          "buttons":[
            {
              "type":"web_url",
              "url":"https://azuredev.tau2904.com/ME/#/applyinitial",
              "title":"open Account"
            }
          ]
        }
      }
    }
  }
  messageDataArr[1] = messageData2

  callBatchSendAPI.callBatchSendAPI(messageDataArr)
  console.log(date.getToDateAndTime()+" processAcctOpening :: sent replies to recipient %s", PSId)
}
}
