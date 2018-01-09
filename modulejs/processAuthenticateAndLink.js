//Authenticate and link FB Id to Bank A/C
var date = require('./DateAndTime')
var callSendAPI = require('./SendMessage')
var chooseIdentifucationMethod = require('./IdentiFunctionMethod')
module.exports={
processAuthenticateAndLink:async function processAuthenticateAndLink(PSId, messageText){
  console.log(date.getToDateAndTime()+" processAuthenticateAndLink :: called with PSId: %s", PSId)
  if(chooseIdentifucationMethod.chooseIdentifucationMethod(PSId)){
    var messageData = {
    "recipient":{
      "id":PSId
    },
    "message":{
      "text" : "आपकी प्रोफ़ाइल पहले से ही आपके MRC बैंक खाते से जुड़ी हुई है.\nमेसेंजर से खुशी खुशी बैंकिंग करें!!"
    }
  }
  callSendAPI.sendRequest(PSId,messageData)
  console.log(date.getToDateAndTime()+" processAuthenticateAndLink :: sent reply to recipient %s", PSId);
  }
}
}
