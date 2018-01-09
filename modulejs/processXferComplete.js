var date = require('./DateAndTime')
var sendRequest = require('./SendMessage')
var processXferGetFromAc= require('./processXferGetFromAc')
var processXferToAcct = require('./processXferGetToAcct')
var processXferDestBank = require('./processXferDestBank')
var processXferGetFee= require('./processXferGetFee')
var processXferGetRececiveDate= require('./processXferGetReceiveDate')
var callBatchSendAPI= require('./callBatchSendAPI')
module.exports={
processXferComplete: function processXferComplete(sender,usrArrItm){
   console.log(date.getToDateAndTime()+" process transfer complete page ")
    let trnsDetail = process.env.trans_dtl+"\n"+process.env.Txn_Id+" : NT171337993\n"+
                   process.env.Xfer_from_acct+" : "+processXferGetFromAc.processXferGetFromAc(sender, usrArrItm)+"\n"+
                   process.env.Xfer_to_acct+" : "+processXferToAcct.processXferToAcct(sender,usrArrItm)+"\n"+
                   processXferDestBank.processXferDestBank(sender,usrArrItm)+
                   process.env.Xfer_amount+" : "+usrArrItm.values.amount+"\n"+
                   process.env.Xfer_fee+" : "+processXferGetFee.processXferGetFee(sender,usrArrItm)+"\n"+
                   process.env.Xfer_date+" : "+ Date().toString().substring(0,16)+"\n"+
                   process.env.receive_date+" : "+processXferGetRececiveDate.processXferGetRececiveDate(sender,usrArrItm)+"\n\n"+
                   process.env.trans_on_to_me
        var messageDataArr = Array()
        var messageData1={
          "recipient":{
            "id":sender
          },
          "message":{
            "text":process.env.txn_complete_msg
          }
        }
        messageDataArr[0]=messageData1
        //console.log(" 1st message is attached ");
        var messageData2={
          "recipient":{
            "id":sender
          },
              "message":{
              "attachment":{
                "type":"template",
                "payload":{
                  "template_type":"generic",
                  "sharable":true,
                  "image_aspect_ratio":"square",
                  "elements":
                  [
                    {
                      "title":"ट्रान्सफर से जुड़े सलाह",
                      "image_url":"https://peaceful-springs-82345.herokuapp.com/Correct.png",
                      "subtitle":process.env.trans_as_pdf,
                      "default_action": {
                        "type": "web_url",
                        "url": "https://peaceful-springs-82345.herokuapp.com/transfercompletion.html",
                        "webview_height_ratio": "tall"
                    },
                      "buttons":
                      [
                        {
                          "type":"postback",
                          "payload":"FUND_XFER__DN_PDF",
                          "title":"pdf डाउनलोड"
                        },
                        {
                          "type":"web_url",
                          "url":"https://peaceful-springs-82345.herokuapp.com/transfercompletion.html",
                          "title":"डिटेल्स देखें"
                        },
                        {
                          "type": "element_share",
                          "share_contents": {
                            "attachment": {
                              "type": "template",
                              "payload": {
                                "template_type": "generic",
                                "elements": [
                                  {
                                    "title": "Banking with MRC on Messenger is so cool.",
                                    "subtitle": "Open a MRC account and give it a go..",
                                    "image_url": "https://peaceful-springs-82345.herokuapp.com/TMB.jpg",
                                    "default_action": {
                                      "type": "web_url",
                                      "url": "http://m.me/mrcube.retailbanking?ref=1468726026538987"
                                    },
                                    "buttons": [
                                      {
                                        "type": "web_url",
                                        "url": "http://m.me/mrcube.retailbanking?ref=1468726026538987",
                                        "title": "Open MRC account and enjoy higher returns."
                                      }
                                    ]
                                  }
                                ]
                              }
                            }
                          }
                        }
                      ]
                    }
                  ]
                }
              }
            }
          }
          messageDataArr[1]=messageData2
            //console.log(" 2nd message is attached ");
          var messageData3 = {
              "recipient":{
                "id":sender
              },
              "message":{
                "text":trnsDetail
              }
            }
            messageDataArr[2] = messageData3
            //  console.log(" 3rdt message is attached ");
            callBatchSendAPI.callBatchSendAPI(messageDataArr)

            //Delete transactions data
            var findFunction = function(element){
              if(element.key == sender) return true
            }
            var multiArr = JSON.parse(process.env.INPROGTRAN)
            var usrArrItm = multiArr.PSId.find(findFunction)
            usrArrItm.tranName = undefined
            usrArrItm.values = undefined
            process.env.INPROGTRAN = JSON.stringify(multiArr)
            console.log("process.env.INPROGTRAN = JSON.stringify(multiArr) "+ JSON.stringify(multiArr));

}
}
