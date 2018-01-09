var callBatchSendAPI = require('./callBatchSendAPI')
var addToInProg = require('./addToInProg')
var datendTime = require('./DateAndTime')
module.exports={
processCancelRequest: function processCancelRequest(PSId, messageText){
  console.log(datendTime.getToDateAndTime()+" processCancelRequest :: called with PSId: %s", PSId)

  var findFunction = function(element){
    if(element.key == PSId) return true
  }
  var inProgTranName = ""
  var inProgTranFullName = ""
  var msgToSend = process.env.No_Pending_Cancel_Request
  if(process.env.INPROGTRAN == undefined){
    console.log(datendTime.getToDateAndTime()+" processCancelRequest :: No in progress transactions for any user")
  }else{
    console.log(datendTime.getToDateAndTime()+" processCancelRequest :: In progress transactions for users found")
    var multiArr = JSON.parse(process.env.INPROGTRAN)
    var usrArrItm = multiArr.PSId.find(findFunction)
    if(usrArrItm == undefined){
      console.log(datendTime.getToDateAndTime()+" addToInProgTran :: No In progress transactions for current user found: %s", PSId)
    }else if(usrArrItm.tranName == undefined){
      console.log(datendTime.getToDateAndTime()+" addToInProgTran :: No In progress transactions for current user found: %s", PSId)
    }else{
      console.log(datendTime.getToDateAndTime()+" processCancelRequest :: Record for current user found: %s, ongoing tranname: %s", PSId, usrArrItm.tranName)
      inProgTranName = usrArrItm.tranName
      console.log("inProgTranName "+inProgTranName);
      if (inProgTranName == "FUND_XFER") inProgTranFullName = process.env.Transfer_Request
      else if (inProgTranName == "DT_RNG") inProgTranFullName = "Search past transactions based on date tange"
      else if (inProgTranName == "DN_STMT") inProgTranFullName = "Download past statement as pdf"
      msgToSend = inProgTranFullName+" "+process.env.Inprogress_Cancel
      usrArrItm.tranName = undefined
      usrArrItm.values = undefined
      process.env.INPROGTRAN = JSON.stringify(multiArr)
    }
  }

  var messageDataArr = Array()
  var messageData1 = {
    "recipient":{
        "id":PSId
    },
    "message":{
        "text":msgToSend
    }
  }
  messageDataArr[0] = messageData1

  var messageData2 = {
    "recipient":{
        "id":PSId
    },
    "message":{
        "text":process.env.Next_cmd
    }
  }
  messageDataArr[1] = messageData2
  callBatchSendAPI.callBatchSendAPI(messageDataArr)
  console.log("processCancelRequest :: sent reply to recipient %s", PSId);
}
}
