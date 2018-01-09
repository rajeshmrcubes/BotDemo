var DateAndTime = require('./DateAndTime')
var sendRequest = require('./SendMessage')
var IdentiFunctionMethod = require('./IdentiFunctionMethod')
module.exports={
  showAcBal: async function showAcBal(PSId){
  console.log(DateAndTime.getToDateAndTime()+" showAcBal :: called with PSId: %s ", PSId)
  if(IdentiFunctionMethod.chooseIdentifucationMethod(PSId)){
    var messageData = {
      "recipient":{
        "id":PSId
      },
      "message": {
            "text":process.env.Bal_inq
        }

    }
    sendRequest.sendRequest(PSId,messageData);
  }
  console.log("showAcBal sent replies to recipient %s", PSId);
}
}
