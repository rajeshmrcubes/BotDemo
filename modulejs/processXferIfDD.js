var callBatchSendAPI= require('./callBatchSendAPI')
module.exports={
processXferIfDD: function processXferIfDD(sender){
   var messageDataArr = Array()
  var messageData1 = {
        "recipient":{
        "id":sender
        },
      "message":{
      "text": "आप क्या करना पसंद करेंगे.\n(1)विथड्रा अपने प्राइमरी अकाउंट से \n(2)डेपोसित अपने प्राइमरी अकाउंट मे ",
      "quick_replies":[
        {
          "content_type":"text",
          "title":"विथड्रा",
          "payload":"FUND_XFER__INHOUSE"
        },
        {
          "content_type":"text",
          "title":"डेपोसित",
          "payload":"FUND_XFER__DD"
        }
      ]
    }

  }
  messageDataArr[0]=messageData1;
  callBatchSendAPI.callBatchSendAPI(messageDataArr)
}
}
