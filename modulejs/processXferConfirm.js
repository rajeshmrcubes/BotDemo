var date = require('./DateAndTime')
var sendRequest = require('./SendMessage')
var processXferGetFromAc= require('./processXferGetFromAc')
var processXferToAcct = require('./processXferGetToAcct')
var processXferDestBank = require('./processXferDestBank')
var processXferGetFee= require('./processXferGetFee')
var processXferGetRececiveDate= require('./processXferGetReceiveDate')
module.exports={
processXferConfirm: function processXferConfirm(sender,usrArrItm){
    let trnsDetail = process.env.trans_confirm+"\n"+process.env.Txn_Id+" : NT171337993\n"+
                     process.env.Xfer_from_acct+" : "+processXferGetFromAc.processXferGetFromAc(sender, usrArrItm)+"\n"+
                     process.env.Xfer_to_acct+" : "+processXferToAcct.processXferToAcct(sender,usrArrItm)+"\n"+
                     processXferDestBank.processXferDestBank(sender,usrArrItm)+
                     process.env.Xfer_amount+" : "+usrArrItm.values.amount+"\n"+
                     process.env.Xfer_fee+" : "+processXferGetFee.processXferGetFee(sender,usrArrItm)+"\n"+
                     process.env.Xfer_date+" : "+ Date().toString().substring(0,16)+"\n"+
                     process.env.receive_date+" : "+processXferGetRececiveDate.processXferGetRececiveDate(sender,usrArrItm)+"\n\n"+
                     process.env.trans_on_to_me
      var messageData ={
        "recipient":{
          "id":sender
        },
        "message":{
          "text": trnsDetail,
          "quick_replies":[
            {
              "content_type":"text",
              "title":"मै सहमत हूँ",
              "payload":"FUND_XFER__CONFIRM"
            },
            {
              "content_type":"text",
              "title":"रिएंटर अमाउंट",
              "payload":"FUND_XFER__EDIT"
            }
          ]
        }
    }
    sendRequest.sendRequest(sender,messageData)

  }
}
