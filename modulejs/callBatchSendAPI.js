var datendTime = require('./DateAndTime')
var request = require('request');
module.exports={
callBatchSendAPI: function callBatchSendAPI(messageDataArr) {
  console.log(datendTime.getToDateAndTime()+" callBatchSendAPI :: called for PSId: %s at time %s ", messageDataArr[0].recipient.id,datendTime.getToDateAndTime())

  var id = messageDataArr[0].recipient.id
  //create form (i.e. multipart/form-data)
  const fbEnd = "https://graph.facebook.com"
  const r = request.post(fbEnd, (err, httpResponse, body) => {
      if (err) {
        return console.log(datendTime.getToDateAndTime()+" callBatchSendAPI :: batch send error: ", JSON.stringify(err))
      }
      console.log(datendTime.getToDateAndTime()+" callBatchSendAPI :: batch send successfull: ", JSON.stringify(body))
  });
  const form = r.form()
  const rec = "recipient=" + encodeURIComponent(JSON.stringify({"id": id})) //needs to be URLEncoded
  var batchMsgArr = Array()
  batchMsgArr[0] = {"method":"POST", "name": "senderAction", "relative_url":"v2.6/me/messages", "body": rec + "&" + "sender_action=typing_on"}

  //Loop thru and create all the messages to be sent
  for (var idx = 0; idx < messageDataArr.length; idx++){
    var msgObj = new Object()
    msgObj.method = "POST"
    msgObj.relative_url = "v2.6/me/messages"
    msgObj.name = "message"+(idx+1)
    if(idx ==0) msgObj.depends_on = "senderAction"
    else msgObj.depends_on = "message"+idx
    var messageObj = new Object()
    //text
    if(messageDataArr[idx].message.text != undefined){
      messageObj.text = messageDataArr[idx].message.text
    }
    //quick_replies
    if(messageDataArr[idx].message.quick_replies != undefined){
      messageObj.quick_replies = messageDataArr[idx].message.quick_replies
    }
    //attachment
    if(messageDataArr[idx].message.attachment != undefined){
      messageObj.attachment = messageDataArr[idx].message.attachment
    }
    console.log(datendTime.getToDateAndTime()+" callBatchSendAPI :: msgObj is: %s", JSON.stringify(messageObj))
    var messageStr = "message="+encodeURIComponent(JSON.stringify(messageObj))
    msgObj.body =  rec+"&"+messageStr
    batchMsgArr[idx+1] = msgObj
  }
  const batchMessages = JSON.stringify(batchMsgArr)
  console.log(datendTime.getToDateAndTime()+" callBatchSendAPI :: batchMessages are: %s", batchMessages)
  var token =process.env.FB_token
  form.append("access_token", token)
  form.append('batch', batchMessages)
}
}
