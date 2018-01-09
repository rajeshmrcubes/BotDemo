//var date = require('./DateAndTime')
var callBatchSendAPI = require('./callBatchSendAPI')
module.exports={
processXferSmartOrOrft: function processXferSmartOrOrft(sender){
    var messageDataArr = Array();
    var messageData1 ={
      "recipient":{
        "id":sender
      },
      "message":{
        "text": "ट्रान्सफर करने के लिए 2 विकल्प अवेलेबल है -\n(1)तुरंत ट्रान्सफर\n"+
                "(2)आज/अगले वोर्किंग डे मे \n\nकृपया अपने ट्रान्सफर विकल्प को चूने",
        "quick_replies":[
          {
            "content_type":"text",
            "title":"तुरंत",
            "payload":"FUND_XFER__ORFT"
          },
          {
            "content_type":"text",
            "title":"आज के अंत मे",
            "payload":"FUND_XFER__SMART"
          }
        ]
      }
    }
    messageDataArr[0]=messageData1;
    callBatchSendAPI.callBatchSendAPI(messageDataArr);
  }
}
