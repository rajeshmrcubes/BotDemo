var sendRequest = require('./SendMessage')
module.exports={
  sendText: function sendText(PSId,text){
  let messageData = {
    "recipient":{
        "id":PSId
    },
    message: {
      text: text
    }
  }
  sendRequest.sendRequest(PSId,messageData);
}
}
