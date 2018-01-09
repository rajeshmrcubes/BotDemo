var sendRequest = require('./SendMessage')
module.exports={
dnldStmt:function dnldStmt(PSId){
  console.log("dnldStmt :: called with PSId: %s", PSId)
  var messageData = {
    "recipient":{
        "id":PSId
    },
    "text":"Here is your last month statement",
    "message":{
      "attachment":{
        "type":"file",
        "payload":{
          "is_reusable": true,
          "url":"https://peaceful-springs-82345.herokuapp.com/Statement1month.pdf"
        }
      }
    }
  }
  sendRequest.sendRequest(PSId,messageData)
  console.log("dnldStmt sent replies to recipient %s", PSId);
}
}
