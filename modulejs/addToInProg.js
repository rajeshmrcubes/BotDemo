var datendTime = require('./DateAndTime')
module.exports={
addToInProgTran:function addToInProgTran(PSId, tranName){
    console.log(datendTime.getToDateAndTime()+" addToInProgTran :: called with PSId: %s & tranName: %s ", PSId, tranName)
    var findFunction = function(element){
      if(element.key == PSId) return true
    }

    if(process.env.INPROGTRAN == undefined){
      console.log(datendTime.getToDateAndTime()+" addToInProgTran :: No in progress transactions for any user")
      var multiArr = new Object()
      multiArr.PSId = Array()
      multiArr.PSId[0] = new Object()
      multiArr.PSId[0].key = PSId
      multiArr.PSId[0].tranName = tranName
      multiArr.PSId[0].values = new Object()
      process.env.INPROGTRAN = JSON.stringify(multiArr)
    }else{
      console.log(datendTime.getToDateAndTime()+" addToInProgTran :: In progress transactions for users found")
      var multiArr = JSON.parse(process.env.INPROGTRAN)
      var usrArrItm = multiArr.PSId.find(findFunction)
      var lstIdx = multiArr.PSId.length
        if(usrArrItm == undefined){
          console.log(datendTime.getToDateAndTime()+" addToInProgTran :: No In progress transactions for current user found: %s", PSId)
          multiArr.PSId[lstIdx] = new Object()
          multiArr.PSId[lstIdx].key = PSId
          multiArr.PSId[lstIdx].tranName = tranName
          multiArr.PSId[lstIdx].values = new Object()
          process.env.INPROGTRAN = JSON.stringify(multiArr)
        }else{
          console.log(datendTime.getToDateAndTime()+" addToInProgTran :: Record for current user found: %s, ongoing tranname: %s", PSId, usrArrItm.tranName)
          if(usrArrItm.tranName == null){
              console.log(datendTime.getToDateAndTime()+" addToInProgTran :: No transaction ongoing, setting new transaction data: %s, current tranname: %s", PSId, tranName)
              usrArrItm.tranName = tranName
              usrArrItm.values = new Object()
              process.env.INPROGTRAN = JSON.stringify(multiArr)
          }else if(usrArrItm.tranName == undefined){
              console.log(datendTime.getToDateAndTime()+" addToInProgTran :: No transaction ongoing, setting new transaction data: %s, current tranname: %s", PSId, tranName)
              usrArrItm.tranName = tranName
              usrArrItm.values = new Object()
              process.env.INPROGTRAN = JSON.stringify(multiArr)
         }else if(usrArrItm.tranName != tranName){
              console.log(datendTime.getToDateAndTime()+" addToInProgTran :: Diff transaction starting so resetting transaction data: %s, current tranname: %s", PSId, tranName)
              usrArrItm.tranName = tranName
              usrArrItm.values = new Object()
              process.env.INPROGTRAN = JSON.stringify(multiArr)
          var messageData = {
            "recipient":{
                "id":PSId
            },
            "message":{
                "text":process.env.Cancel_Curret_Request
            }
          }
          sendRequest(PSId,messageData)
        }else if(usrArrItm.tranName == tranName){
          console.log(datendTime.getToDateAndTime()+" addToInProgTran :: Same transaction so not resetting transaction data: %s, current tranname: %s", PSId, tranName)
        }
      }
    }
    console.log(datendTime.getToDateAndTime()+" addToInProgTran :: JSON.stringify(multiArr): %s", JSON.stringify(multiArr))
  }

}
